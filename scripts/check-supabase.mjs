import { loadEnvFile } from 'node:process';
import { createBackend } from '../supabase/functions/_shared/supabase.mjs';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw new Error('Check .env.local syntax'); }
try {
  const backend = createBackend(process.env);
  for (const table of ['daese_applications','daese_contacts','daese_consents','daese_sensitive_details','daese_admins','daese_intake_jobs','daese_photo_cleanup']) {
    await backend.call(`/rest/v1/${table}?select=*&limit=0`);
    console.log(`${table}: reachable`);
  }
  const bucket = await backend.call('/storage/v1/bucket/application-photos');
  if (bucket.public !== false || bucket.file_size_limit !== 5242880 || !bucket.allowed_mime_types?.includes('image/jpeg')) throw new Error('Bucket policy mismatch');
  const admins = await backend.call('/rest/v1/daese_admins?select=user_id&active=eq.true&limit=1');
  console.log(`Private photo bucket: OK; active administrator: ${admins.length ? 'present' : 'NOT CONFIGURED'}`);
  if (!admins.length) process.exitCode = 1;
  console.log('Read-only connection check only. No personal data was printed or written. Hosted Auth/Storage and deny-access tests remain separate.');
} catch {
  console.error('Connection check failed. Verify .env.local, migration, bucket settings and project state. No secret values were printed.');
  process.exitCode = 1;
}
