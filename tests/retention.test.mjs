import test from 'node:test';
import assert from 'node:assert/strict';
import { createRetentionHandler } from '../supabase/functions/_shared/retention.mjs';

const env = { RETENTION_CRON_SECRET: 'test-secret' };
const request = (secret, method='POST') => new Request('https://example.invalid/retention-cleanup', { method, headers: secret ? { 'x-retention-secret': secret } : {} });

test('retention cleanup requires the dedicated scheduler secret', async () => {
  const handler = createRetentionHandler(env, { backendFactory: () => { throw new Error('must not run'); } });
  assert.equal((await handler(request('test-secret','GET'))).status,405);
  assert.equal((await handler(request())).status,401);
  assert.equal((await handler(request('wrong-secret'))).status,401);
});

test('retention cleanup reports successful purge and storage deletion', async () => {
  const calls=[];
  const backend={
    async rpc(name, body){calls.push({name,body});if(name==='daese_prune_purge_audit')return 0;if(name==='daese_prepare_retention_purge')return 1;return null;},
    async call(){return [{photo_path:'fake/path.jpg'}];},
    async removePhoto(path){calls.push({remove:path});},
  };
  const response=await createRetentionHandler(env,{backendFactory:()=>backend})(request('test-secret'));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{auditRemoved:0,purged:1,removed:1,failed:0});
  assert.ok(calls.some(call=>call.name==='daese_record_photo_cleanup_result'&&call.body.p_success===true));
});

test('retention cleanup records a failed photo deletion for the next retry', async () => {
  const calls=[];
  const backend={
    async rpc(name,body){calls.push({name,body});if(name==='daese_prune_purge_audit')return 0;if(name==='daese_prepare_retention_purge')return 0;return null;},
    async call(){return [{photo_path:'fake/path.jpg'}];},
    async removePhoto(){throw new Error('storage down');},
  };
  const response=await createRetentionHandler(env,{backendFactory:()=>backend})(request('test-secret'));
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{auditRemoved:0,purged:0,removed:0,failed:1});
  assert.ok(calls.some(call=>call.name==='daese_record_photo_cleanup_result'&&call.body.p_success===false));
});
