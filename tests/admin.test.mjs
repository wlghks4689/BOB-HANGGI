import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminHandler } from '../supabase/functions/_shared/admin.mjs';
import { env, actorId, id } from './fixtures.mjs';
const req = (body, token='user-jwt') => new Request('http://localhost:4174/api/admin', {
  method:'POST',headers:{Origin:'http://localhost:4174','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),
});
function mock({active=true, invalid=false}={}) {
  const calls=[];
  return {calls, async call(path, options) {
    calls.push({path,options});
    if (path === '/auth/v1/token?grant_type=password') return {access_token:'verified-token',refresh_token:'never-return-this',expires_in:3600};
    if (path === '/auth/v1/user') {if(invalid) throw Object.assign(new Error('private-error'),{status:401});return {id:actorId};}
    if (path.startsWith('/auth/v1/logout')) return null;
    if (path.startsWith('/rest/v1/daese_admins')) return active?[{user_id:actorId}]:[];
    if (path.startsWith('/rest/v1/daese_applications')) return [];
    if (path.startsWith('/rest/v1/daese_photo_cleanup')) return [];
    throw new Error('Unexpected request');
  }, async rpc(name){calls.push({name});return true;} };
}
test('all admin operations require authenticated, active allowlisted user', async () => {
  for (const action of ['list','detail','review','delete','cleanup']) {
    for (const [options,token,status] of [[{},'',401],[{invalid:true},'forged',401],[{active:false},'user-jwt',403]]) {
      const backend=mock(options), handle=createAdminHandler(env,{backendFactory:()=>backend});
      const result=await handle(req({action,id},token)); assert.equal(result.status,status);
      assert.ok(!backend.calls.some(c=>c.name || c.path.includes('/daese_applications')));
    }
  }
});
test('login verifies admin membership and never returns refresh token', async () => {
  const backend=mock(), handle=createAdminHandler(env,{backendFactory:()=>backend});
  const response=await handle(req({action:'login',email:'test@example.invalid',password:'fake-password'},''));
  const data=await response.json();assert.equal(response.status,200);assert.equal(data.accessToken,'verified-token');assert.equal(data.refreshToken,undefined);
  assert.ok(!JSON.stringify(data).includes('never-return-this'));
  const denied=await createAdminHandler(env,{backendFactory:()=>mock({active:false})})(req({action:'login',email:'test@example.invalid',password:'fake'},''));assert.equal(denied.status,403);
});
test('password recovery token can set a strong password only for an allowlisted admin', async () => {
  const backend=mock(), handle=createAdminHandler(env,{backendFactory:()=>backend});
  assert.equal((await handle(req({action:'reset-password',password:'short'}))).status,400);
  const response=await handle(req({action:'reset-password',password:'long-fake-password'}));
  assert.equal(response.status,200);
  const update=backend.calls.find(call=>call.path==='/auth/v1/user' && call.options?.method==='PUT');
  assert.equal(update.options.body.password,'long-fake-password');
  const denied=await createAdminHandler(env,{backendFactory:()=>mock({active:false})})(req({action:'reset-password',password:'long-fake-password'}));
  assert.equal(denied.status,403);
});
test('list filters and pagination validate input before querying applications', async () => {
  const handle=createAdminHandler(env,{backendFactory:()=>mock()});
  for (const body of [{action:'list',offset:-1},{action:'list',status:'approved&select=*'}]) assert.equal((await handle(req(body))).status,400);
  assert.equal((await handle(req({action:'list'}))).status,200);
});
test('delete requires exact id confirmation; review refuses approval without photo approval', async () => {
  const backend=mock(),handle=createAdminHandler(env,{backendFactory:()=>backend});
  assert.equal((await handle(req({action:'delete',id,confirmId:'wrong'}))).status,400);
  assert.equal((await handle(req({action:'review',id,status:'approved',photoReview:'pending',note:'',updatedAt:new Date().toISOString()}))).status,400);
  assert.ok(!backend.calls.some(c=>c.name));
});
test('stale review returns conflict; actor comes from verified auth, not body', async () => {
  const backend=mock();let params;backend.rpc=async(_name,body)=>{params=body;return false;};
  const handle=createAdminHandler(env,{backendFactory:()=>backend});
  const result=await handle(req({action:'review',id,actorId:'attacker',status:'reviewing',photoReview:'pending',note:'',updatedAt:new Date().toISOString()}));
  assert.equal(result.status,409);assert.equal(params.p_actor,actorId);
});
test('photo deletion failure is returned as pending, not falsely reported complete', async () => {
  const backend=mock();backend.rpc=async(name)=>{if(name==='daese_prepare_cleanup')throw new Error('storage unavailable');return true;};
  const result=await createAdminHandler(env,{backendFactory:()=>backend})(req({action:'delete',id,confirmId:id}));
  assert.equal((await result.json()).photosPending,true);
});
test('admin response does not leak backend internals', async () => {
  const handle=createAdminHandler(env,{backendFactory:()=>{throw new Error('private-credential');}});
  const result=await handle(req({action:'list'}));assert.equal(result.status,503);assert.ok(!(await result.text()).includes('private-credential'));
});
