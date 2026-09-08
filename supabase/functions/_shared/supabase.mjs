export class BackendError extends Error {
  constructor(status) { super("Backend request failed"); this.status = status; }
}
export function createBackend(env, fetcher = fetch) {
  const base = (env.SUPABASE_URL || "").replace(/\/$/, "");
  const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base) || !secret) throw new BackendError(503);
  const serviceHeaders = { apikey: secret };
  // sb_secret_ keys are not JWTs. Legacy service_role JWTs require Authorization.
  if (!secret.startsWith("sb_secret_")) serviceHeaders.Authorization = `Bearer ${secret}`;
  async function call(path, { method = "GET", body, headers = {}, ...options } = {}) {
    const response = await fetcher(`${base}${path}`, {
      method, headers: { ...serviceHeaders, ...(body && !(body instanceof Uint8Array) ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body instanceof Uint8Array ? body : body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000), ...options,
    });
    if (!response.ok) throw new BackendError(response.status);
    if (response.status === 204) return null;
    const value = await response.text();
    return value ? JSON.parse(value) : null;
  }
  return {
    call,
    rpc: (name, body) => call(`/rest/v1/${name.startsWith("rpc/") ? name : `rpc/${name}`}`, { method: "POST", body }),
    upload: (path, bytes) => call(`/storage/v1/object/application-photos/${path}`, {
      method: "POST", body: bytes, headers: { "Content-Type": "image/jpeg", "x-upsert": "false" },
    }),
    removePhoto: (path) => call("/storage/v1/object/application-photos", { method: "DELETE", body: { prefixes: [path] } }),
  };
}

export async function sha256(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b => b.toString(16).padStart(2, "0")).join("");
}
export async function rateKey(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}

export async function cleanupPhotos(backend) {
  const auditRemoved = await backend.rpc("daese_prune_purge_audit", {});
  const purged = await backend.rpc("daese_prepare_retention_purge", { p_limit: 100 });
  await backend.rpc("daese_prepare_cleanup", {});
  const rows = await backend.call("/rest/v1/daese_photo_cleanup?select=photo_path&order=queued_at&limit=100");
  let removed = 0, failed = 0;
  for (const row of rows) {
    try {
      await backend.removePhoto(row.photo_path);
      await backend.rpc("daese_record_photo_cleanup_result", { p_photo_path: row.photo_path, p_success: true, p_error: null });
      removed++;
    } catch {
      failed++;
      await backend.rpc("daese_record_photo_cleanup_result", { p_photo_path: row.photo_path, p_success: false, p_error: "storage_delete_failed" });
    }
  }
  return { auditRemoved, purged, removed, failed };
}
