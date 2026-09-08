import test from 'node:test';
import assert from 'node:assert/strict';
import { database, sqlBackend, env, id, actorId, validForm, request } from './fixtures.mjs';
import { createIntakeHandler } from '../supabase/functions/_shared/intake.mjs';
import { CONSENT_VERSION, validateForm } from '../supabase/functions/_shared/validation.mjs';

test('PostgreSQL migration, access control, intake, recovery and administrator mutations', async t => {
  const db=await database(); t.after(()=>db.close());
  const backend=sqlBackend(db);
  const handle=createIntakeHandler(env,{local:true,backendFactory:()=>backend});
  const hash='a'.repeat(64), rate='b'.repeat(64);
  await t.test('anonymous and authenticated roles cannot read tables or invoke service RPCs', async () => {
    for (const role of ['anon','authenticated']) {
      for (const table of ['daese_applications','daese_contacts','daese_consents','daese_sensitive_details','daese_admins','daese_intake_jobs']) {
        const {rows}=await db.query('select has_table_privilege($1,$2,\'SELECT\') as allowed',[role,`public.${table}`]); assert.equal(rows[0].allowed,false);
      }
      await assert.rejects(()=>db.transaction(async tx=>{await tx.exec(`set local role ${role}`);await tx.query('select * from public.daese_contacts');}));
      await assert.rejects(()=>db.transaction(async tx=>{await tx.exec(`set local role ${role}`);await tx.query('select public.daese_claim_intake($1,$2,$3)',[id,hash,rate]);}));
    }
    const {rows}=await db.query("select public from storage.buckets where id='application-photos'"); assert.equal(rows[0].public,false);
  });
  await t.test('Storage remains blocked even if a broad permissive policy is later added', async () => {
    await db.exec("grant select,insert on storage.objects to authenticated; create policy broad on storage.objects for all to authenticated using (true) with check (true)");
    await assert.rejects(()=>db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("insert into storage.objects(bucket_id,name) values ('application-photos','unauthorized')");}));
  });
  await t.test('complete intake writes profile, contact and consent atomically; retry has one row', async () => {
    const form=validForm(); form.set('religion','기독교');
    const first=await handle(request(form),'local-test'); assert.equal(first.status,201,await first.clone().text());
    assert.equal((await handle(request(form),'local-test')).status,200);
    for (const table of ['daese_applications','daese_contacts','daese_consents']) assert.equal((await db.query(`select count(*)::integer as n from public.${table}`)).rows[0].n,1);
    assert.equal((await db.query('select count(*)::integer as n from public.daese_sensitive_details')).rows[0].n,0);
    const a=(await db.query('select status,photo_review,purge_reason,purge_due_at,created_at from public.daese_applications')).rows[0];
    assert.equal(a.status,'submitted'); assert.equal(a.photo_review,'pending'); assert.equal(a.purge_reason,'intake_timeout');
    assert.ok(new Date(a.purge_due_at)-new Date(a.created_at) <= 30*24*60*60*1000);
    assert.equal((await db.query('select phone_verified from public.daese_contacts')).rows[0].phone_verified,false);
    assert.equal((await db.query('select document_version from public.daese_consents')).rows[0].document_version,CONSENT_VERSION);
  });
  await t.test('same request ID with different data cannot overwrite an application', async () => {
    const form=validForm(); form.set('name','변경 시도'); assert.equal((await handle(request(form),'local-test')).status,409);
    assert.equal((await db.query('select name from public.daese_applications')).rows[0].name,'가상 신청자');
  });
  await t.test('failed multi-table write rolls back; a pending lease can be safely retried', async () => {
    const second='10000000-0000-4000-8000-000000000002';
    const claim=await backend.rpc('daese_claim_intake',{p_id:second,p_fingerprint:hash,p_rate_key:rate});
    assert.equal((await backend.rpc('daese_claim_intake',{p_id:second,p_fingerprint:hash,p_rate_key:rate})).state,'busy');
    await backend.upload(claim.photo_path);
    const payload=validateForm(validForm(second)).payload; payload.phone='invalid';
    for (const version of ['2026-09-07',null]) {
      await assert.rejects(()=>backend.rpc('daese_finish_intake',{p_id:second,p_lease_id:claim.lease_id,p_data:{...payload,consent_version:version}}), /Invalid consent version/);
    }
    await assert.rejects(()=>backend.rpc('daese_finish_intake',{p_id:second,p_lease_id:claim.lease_id,p_data:payload}));
    assert.equal((await db.query('select count(*)::integer n from public.daese_applications where id=$1',[second])).rows[0].n,0);
    await db.query("update public.daese_intake_jobs set updated_at=now()-interval '3 minutes' where id=$1",[second]);
    const next=await backend.rpc('daese_claim_intake',{p_id:second,p_fingerprint:hash,p_rate_key:rate});
    assert.notEqual(next.photo_path,claim.photo_path);
    assert.equal((await db.query('select count(*)::integer n from public.daese_photo_cleanup where photo_path=$1',[claim.photo_path])).rows[0].n,1);
    await assert.rejects(()=>backend.rpc('daese_finish_intake',{p_id:second,p_lease_id:claim.lease_id,p_data:validateForm(validForm()).payload}));
  });
  await t.test('rate limit is persisted in DB and blocks the sixth new attempt', async () => {
    for (let i=10;i<16;i++) {
      const value=await backend.rpc('daese_claim_intake',{p_id:`10000000-0000-4000-8000-0000000000${i}`,p_fingerprint:hash,p_rate_key:'c'.repeat(64)});
      assert.equal(value.state,i===15?'limited':'claimed');
    }
  });
  await t.test('only an active admin may review; approving requires photo approval; concurrent edits detected', async () => {
    const row=(await db.query('select updated_at from public.daese_applications where id=$1',[id])).rows[0];
    const args={p_id:id,p_actor:actorId,p_status:'approved',p_photo_review:'pending',p_note:'검토',p_expected_updated_at:row.updated_at.toISOString()};
    await assert.rejects(()=>backend.rpc('daese_review_application',args));
    args.p_photo_review='approved'; args.p_actor='30000000-0000-4000-8000-000000000001';
    await assert.rejects(()=>backend.rpc('daese_review_application',args));
    args.p_actor=actorId; assert.equal(await backend.rpc('daese_review_application',args),true);
    assert.equal(await backend.rpc('daese_review_application',args),false);
    assert.equal((await db.query('select count(*)::integer n from public.daese_review_events')).rows[0].n,1);
  });
  await t.test('retention event advances the deadline and due purge removes personal data while queuing the photo', async () => {
    const row=(await db.query('select updated_at from public.daese_applications where id=$1',[id])).rows[0];
    const due=await backend.rpc('daese_mark_retention_event',{p_id:id,p_actor:actorId,p_event:'service_ended',p_expected_updated_at:row.updated_at.toISOString()});
    assert.ok(new Date(due).getTime()<=Date.now()+47*60*60*1000+5000);
    await db.query("update public.daese_applications set purge_due_at=now()-interval '1 second' where id=$1",[id]);
    assert.equal(await backend.rpc('daese_prepare_retention_purge',{p_limit:100}),1);
    for (const table of ['daese_applications','daese_contacts','daese_consents','daese_review_events']) assert.equal((await db.query(`select count(*)::integer n from public.${table}`)).rows[0].n,0);
    assert.ok((await db.query('select photo_path from public.daese_photo_cleanup')).rows.length>0);
    const audit=(await db.query('select reason,photo_deleted_at from public.daese_purge_audit where application_id=$1',[id])).rows[0];
    assert.equal(audit.reason,'service_ended'); assert.equal(audit.photo_deleted_at,null);
    await db.query("update public.daese_purge_audit set photo_deleted_at=now()-interval '91 days' where application_id=$1",[id]);
    assert.equal(await backend.rpc('daese_prune_purge_audit',{}),1);
    assert.equal((await db.query('select count(*)::integer n from public.daese_purge_audit where application_id=$1',[id])).rows[0].n,0);
  });
});
