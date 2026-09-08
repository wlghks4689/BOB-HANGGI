import { createBackend, cleanupPhotos } from './supabase.mjs';

function sameSecret(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function createRetentionHandler(env, { backendFactory = createBackend } = {}) {
  return async function handle(request) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    if (!sameSecret(request.headers.get('x-retention-secret'), env.RETENTION_CRON_SECRET)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    try {
      const result = await cleanupPhotos(backendFactory(env));
      return new Response(JSON.stringify(result), { status: result.failed ? 503 : 200, headers });
    } catch {
      return new Response(JSON.stringify({ error: 'Retention cleanup failed' }), { status: 503, headers });
    }
  };
}
