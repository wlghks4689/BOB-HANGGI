import { CONSENT_VERSION, InputError, limitedFormData, validateForm, validatePhoto } from "./validation.mjs";
import { createBackend, rateKey, sha256 } from "./supabase.mjs";

// Release blocker: implement and verify the 48-hour / 30-day retention jobs first.
// An environment toggle alone must not reopen real-data intake.
const RETENTION_AUTOMATION_VERIFIED = false;

export function cors(request, env) {
  const origin = request.headers.get("origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (origin && !allowed.includes(origin)) throw new InputError("허용되지 않은 접속 주소입니다.", "", 403);
  return {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
export function json(body, status = 200, headers = {}) { return new Response(JSON.stringify(body), { status, headers }); }
export function publicError(error, headers) {
  if (error instanceof InputError) return json({ error: error.message, field: error.field }, error.status, headers);
  // Never return PostgREST errors, credentials, payloads, or contact details to browsers/logs.
  return json({ error: "저장 결과를 확인하지 못했습니다. 입력을 유지한 채 잠시 후 다시 시도해주세요." }, 503, headers);
}

function config(env, local) {
  const testing = local && env.ALLOW_LOCAL_TEST_SUBMISSIONS === "true";
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(env.SUPABASE_URL || "")
    && Boolean(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)
    && (env.RATE_LIMIT_SECRET || "").length >= 32;
  // A draft notice cannot silently become the production consent document.
  const policyReady = env.CONSENT_VERSION === CONSENT_VERSION && (testing || !CONSENT_VERSION.endsWith("-draft"));
  const captchaReady = testing || Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
  const retentionReady = testing || RETENTION_AUTOMATION_VERIFIED;
  return { enabled: Boolean(configured && policyReady && captchaReady && retentionReady && env.APPLICATIONS_ENABLED === "true"), testing };
}

async function verifyCaptcha(token, origin, env, fetcher) {
  if (typeof token !== "string" || !token || token.length > 2048) throw new InputError("자동입력 방지 확인을 완료해주세요.");
  const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Verification unavailable");
  const result = await response.json();
  if (!result.success || result.action !== "apply" || result.hostname !== new URL(origin).hostname) {
    throw new InputError("자동입력 방지 확인이 만료되었습니다. 다시 확인해주세요.");
  }
}

export function createIntakeHandler(env, { local = false, backendFactory = createBackend, fetcher = fetch } = {}) {
  return async function handle(request, clientAddress = "unknown") {
    let headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
    try {
      headers = cors(request, env);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      const settings = config(env, local);
      if (request.method === "GET") return json({
        enabled: settings.enabled, testMode: settings.testing, consentVersion: CONSENT_VERSION,
        turnstileSiteKey: settings.enabled && !settings.testing ? env.TURNSTILE_SITE_KEY : "",
      }, 200, headers);
      if (request.method !== "POST") throw new InputError("지원하지 않는 요청입니다.", "", 405);
      if (!settings.enabled) throw new InputError("현재 신청 접수를 준비 중입니다. 아직 전송·저장되지 않았습니다.", "", 503);
      const origin = request.headers.get("origin");
      if (!origin) throw new InputError("신청 페이지에서 다시 시도해주세요.", "", 403);
      const form = await limitedFormData(request);
      const { requestId, payload } = validateForm(form);
      const bytes = await validatePhoto(form.get("profile_photo"));
      if (!settings.testing) await verifyCaptcha(form.get("cf-turnstile-response"), origin, env, fetcher);
      const fingerprint = await sha256(`${JSON.stringify(payload)}:${await sha256(bytes)}`);
      const backend = backendFactory(env, fetcher);
      const claim = await backend.rpc("daese_claim_intake", {
        p_id: requestId, p_fingerprint: fingerprint,
        p_rate_key: await rateKey(env.RATE_LIMIT_SECRET, clientAddress),
      });
      if (claim.state === "limited") throw new InputError("신청 횟수가 많습니다. 10분 후 다시 시도해주세요.", "", 429);
      if (claim.state === "conflict") throw new InputError("이전 전송과 입력 내용이 다릅니다. 새 신청으로 다시 시도해주세요.", "", 409);
      if (claim.state === "busy") throw new InputError("이전 신청을 처리 중입니다. 잠시 후 같은 내용으로 다시 시도해주세요.", "", 409);
      if (claim.state === "submitted") return json({ id: requestId, submitted: true }, 200, headers);
      if (claim.state !== "claimed") throw new Error("Invalid claim response");
      await backend.upload(claim.photo_path, bytes);
      const id = await backend.rpc("daese_finish_intake", { p_id: requestId, p_lease_id: claim.lease_id, p_data: payload });
      if (id !== requestId) throw new Error("Invalid receipt");
      return json({ id, submitted: true }, 201, headers);
    } catch (error) {
      // An upload/commit timeout is ambiguous. Do not delete the photo here:
      // the DB transaction might have committed. Retried IDs and cleanup leases resolve it.
      return publicError(error, headers);
    }
  };
}
