import test from 'node:test';
import assert from 'node:assert/strict';
import { validateForm, validatePhoto, MAX_BODY_BYTES, limitedFormData } from '../supabase/functions/_shared/validation.mjs';
import { createIntakeHandler } from '../supabase/functions/_shared/intake.mjs';
import { createBackend, sha256, rateKey } from '../supabase/functions/_shared/supabase.mjs';
import { env, id, validForm, request } from './fixtures.mjs';

test('mandatory consent and old document versions fail', () => {
  const form = validForm(); form.delete('privacy_required'); assert.throws(() => validateForm(form), /동의/);
  form.set('privacy_required','on'); form.set('consent_version','old'); assert.throws(() => validateForm(form), /새로고침/);
});
test('religion is discarded without separate consent; forged verified flag is ignored', () => {
  const form = validForm(); form.set('religion','기독교'); form.set('phone_verified','true');
  const { payload } = validateForm(form); assert.equal(payload.religion,null); assert.equal(payload.phone_verified,undefined);
  form.set('sensitive_religion_consent','on'); assert.equal(validateForm(form).payload.religion,'기독교');
});
test('reject invalid ages, region, occupation, MBTI, phone, required whitespace and duplicate fields', () => {
  for (const [field,value] of [['birth_year','2020'],['region_detail','서울'],['job_category','무효'],['mbti','XXXX'],['phone','123'],['interest_1','  '],['height','999'],['preferred_age_min','41']]) {
    const form = validForm(); form.set(field,value); assert.throws(() => validateForm(form), undefined, field);
  }
  const form=validForm(); form.append('name','duplicate'); assert.throws(() => validateForm(form), /중복/);
});
test('other occupation requires details; non-other discards details', () => {
  const form=validForm(); form.set('job_other','irrelevant'); assert.equal(validateForm(form).payload.job_other,null);
  form.set('job_category','기타'); form.set('job_other',''); assert.throws(() => validateForm(form));
});
test('reject reversed age range and enforce current-year boundary', () => {
  const form=validForm(); form.set('preferred_age_min','30'); form.set('preferred_age_max','20'); assert.throws(() => validateForm(form), /최소/);
  form.set('preferred_age_max','40'); form.set('birth_year','2006'); assert.doesNotThrow(() => validateForm(form,new Date('2026-09-07T00:00:00Z')));
  form.set('birth_year','2007'); assert.throws(() => validateForm(form,new Date('2026-09-07T00:00:00Z')));
});
test('photo validates size, signature and expected cropped dimensions', async () => {
  await validatePhoto(validForm().get('profile_photo'));
  await assert.rejects(() => validatePhoto(new File(['fake'],'x.jpg',{type:'image/jpeg'})));
  await assert.rejects(() => validatePhoto(new File(['fake'],'x.svg',{type:'image/svg+xml'})));
  await assert.rejects(() => validatePhoto({size:6*1024*1024,type:'image/jpeg',arrayBuffer(){throw new Error('must not read');}}));
});
test('multipart parser rejects oversized declared and streamed body', async () => {
  const a=request(); a.headers.set('content-length',String(MAX_BODY_BYTES+1)); await assert.rejects(() => limitedFormData(a), /용량/);
  const b = new Request('http://localhost', {method:'POST',headers:{'content-type':'multipart/form-data; boundary=x'},body:new Uint8Array(MAX_BODY_BYTES+1)});
  await assert.rejects(() => limitedFormData(b), /용량/);
});
test('missing config fails closed; production cannot use local testing bypass', async () => {
  for (const handler of [createIntakeHandler({}), createIntakeHandler(env)]) {
    const state=await (await handler(new Request('http://localhost'))).json(); assert.equal(state.enabled,false);
    assert.equal((await handler(request())).status === 503 || (await handler(request())).status === 403,true);
  }
});
test('cross-origin and missing-origin POST rejected before backend', async () => {
  const handle=createIntakeHandler(env,{local:true,backendFactory(){throw new Error('must not reach');}});
  assert.equal((await handle(request(validForm(),'https://attacker.invalid'))).status,403);
  assert.equal((await handle(request(validForm(),null))).status,403);
  const options = await handle(new Request('http://localhost',{method:'OPTIONS',headers:{Origin:'http://localhost:4174'}})); assert.equal(options.status,204);
});
test('production intake stays closed until the explicit application flag is enabled', async () => {
  const readyEnv = {...env, APPLICATIONS_ENABLED:'false', TURNSTILE_SITE_KEY:'fake-site-key', TURNSTILE_SECRET_KEY:'fake-captcha-secret'};
  const neverCall = () => { throw new Error('closed intake must not reach backend or captcha'); };
  for (const local of [false,true]) {
    const handle=createIntakeHandler({...readyEnv, ALLOW_LOCAL_TEST_SUBMISSIONS:local?'false':'true'}, {local,backendFactory:neverCall,fetcher:neverCall});
    const state=await (await handle(new Request('http://localhost'))).json();
    assert.equal(state.enabled,false);assert.equal(state.testMode,false);assert.equal(state.turnstileSiteKey,'');
    assert.equal((await handle(request())).status,503);
  }
  const state=await (await createIntakeHandler({...readyEnv,APPLICATIONS_ENABLED:'true'})(new Request('http://localhost'))).json();
  assert.equal(state.enabled,true);assert.equal(state.testMode,false);assert.equal(state.turnstileSiteKey,'fake-site-key');
});
test('upload failure does not report success or delete a possibly committed photo', async () => {
  const handle=createIntakeHandler(env,{local:true,backendFactory:()=>({rpc:async()=>({state:'claimed',photo_path:'x'}),upload:async()=>{throw new Error('private-token');}})});
  const result=await handle(request(),'127.0.0.1'); assert.equal(result.status,503); assert.ok(!(await result.text()).includes('private-token'));
});
test('backend outcomes map to busy/conflict/limit and successful retry', async () => {
  for (const [state,status] of [['busy',409],['conflict',409],['limited',429],['submitted',200]]) {
    const handle=createIntakeHandler(env,{local:true,backendFactory:()=>({rpc:async()=>({state})})});
    const result=await handle(request()); assert.equal(result.status,status);
  }
});
test('public config never includes credentials or rate-limit secret', async () => {
  const response=await createIntakeHandler(env,{local:true})(new Request('http://localhost'));
  const raw=await response.text(); assert.ok(!raw.includes(env.SUPABASE_SECRET_KEY)); assert.ok(!raw.includes(env.RATE_LIMIT_SECRET));
});
test('new secret keys are apikey-only, legacy JWTs are Bearer; upload does not upsert', async () => {
  for (const secret of ['sb_secret_fake','legacy-jwt']) {
    let init;
    const backend=createBackend({...env,SUPABASE_SECRET_KEY:secret},async(_url,options)=>{init=options;return new Response('{}');});
    await backend.upload(`${id}/test.jpg`,new Uint8Array([1]));
    assert.equal(init.headers.apikey,secret); assert.equal(init.headers.Authorization,secret.startsWith('sb_secret_')?undefined:`Bearer ${secret}`);
    assert.equal(init.headers['x-upsert'],'false');
  }
});
test('hash keys hide raw addresses and are deterministic', async () => {
  const key=await rateKey(env.RATE_LIMIT_SECRET,'127.0.0.1'); assert.equal(key.length,64); assert.equal(key,await rateKey(env.RATE_LIMIT_SECRET,'127.0.0.1'));
  assert.notEqual(key,await sha256('127.0.0.1'));
});
