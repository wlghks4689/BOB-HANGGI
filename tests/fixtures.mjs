import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { CONSENT_VERSION } from '../supabase/functions/_shared/validation.mjs';

export const id = '10000000-0000-4000-8000-000000000001';
export const actorId = '20000000-0000-4000-8000-000000000001';
export const env = {
  SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'test-server-secret',
  APPLICATIONS_ENABLED: 'true', ALLOW_LOCAL_TEST_SUBMISSIONS: 'true',
  ALLOWED_ORIGINS: 'http://localhost:4174', CONSENT_VERSION,
  RATE_LIMIT_SECRET: 'fake-test-value-not-a-production-secret',
};
// JPEG marker fixture for envelope validation only; no real person's photograph.
export const photoBytes = new Uint8Array([255,216,255,192,0,11,8,4,66,6,244,1,1,17,0,255,218,0,8,1,1,0,0,63,0,1,2,3,255,217]);
export function validForm(requestId = id) {
  const form = new FormData();
  for (const [key,value] of Object.entries({
    request_id: requestId, consent_version: CONSENT_VERSION, privacy_required: 'on', name: '가상 신청자',
    birth_year: String(new Date().getUTCFullYear() - 25), gender: 'female', region_city: 'daejeon', region_detail: '서구',
    job_category: 'IT / 개발', height: '165', mbti: 'INTJ', smoking: 'none', drinking: 'none', pet: 'none',
    preferred_age_relation: 'any', interest_1: '산책', priority_condition: '가상 테스트 조건',
    preferred_age_min: '20', preferred_age_max: '40', phone: '010-0000-0000',
  })) form.set(key,value);
  form.set('profile_photo', new File([photoBytes], 'test.jpg', { type:'image/jpeg' }));
  return form;
}
export const request = (form = validForm(), origin = 'http://localhost:4174') => new Request('http://localhost:4174/api/applications', {
  method:'POST', headers: origin ? { Origin: origin } : {}, body:form,
});

export async function database() {
  const db = new PGlite();
  // Supabase-owned tables/roles are stubs here; hosted Auth/Storage still need integration QA.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant usage on schema public,storage,auth to service_role,anon,authenticated;
    grant all on storage.objects to service_role;
  `);
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  await db.query('insert into auth.users values ($1)', [actorId]);
  await db.query('insert into public.daese_admins(user_id) values ($1)', [actorId]);
  return db;
}

const signatures = {
  daese_claim_intake: ['p_id','p_fingerprint','p_rate_key'], daese_finish_intake: ['p_id','p_lease_id','p_data'],
  daese_review_application:['p_id','p_actor','p_status','p_photo_review','p_note','p_expected_updated_at'],
  daese_delete_application:['p_id','p_actor'], daese_prepare_cleanup:[],
  daese_mark_retention_event:['p_id','p_actor','p_event','p_expected_updated_at'],
  daese_prepare_retention_purge:['p_limit'],
  daese_record_photo_cleanup_result:['p_photo_path','p_success','p_error'],
};
export function sqlBackend(db) {
  return {
    async rpc(name, body) {
      const keys = signatures[name]; if (!keys) throw new Error('Unexpected RPC');
      const args = keys.map(k => typeof body[k] === 'object' ? JSON.stringify(body[k]) : body[k]);
      return db.transaction(async tx => {
        await tx.exec('set local role service_role');
        const { rows } = await tx.query(`select public.${name}(${keys.map((_,i) => '$'+(i+1)).join(',')}) as result`, args);
        return rows[0].result;
      });
    },
    async upload(path) { await db.query('insert into storage.objects(bucket_id,name) values ($1,$2)', ['application-photos',path]); },
  };
}
