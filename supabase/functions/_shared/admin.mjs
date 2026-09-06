import { createBackend, cleanupPhotos } from "./supabase.mjs";
import { cors, json, publicError } from "./intake.mjs";
import { InputError, UUID } from "./validation.mjs";

async function readJson(request) {
  if (!(request.headers.get("content-type") || "").startsWith("application/json")) throw new InputError("지원하지 않는 전송 형식입니다.", "", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("요청 내용이 없습니다.");
  const chunks = []; let length = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.length;
      if (length > 16384) { await reader.cancel(); throw new InputError("요청이 너무 큽니다.", "", 413); }
      chunks.push(part.value);
    }
    return JSON.parse(await new Blob(chunks).text());
  } catch (error) { if (error instanceof InputError) throw error; throw new InputError("요청 형식을 확인해주세요."); }
  finally { reader.releaseLock(); }
}

async function requireAdmin(backend, token) {
  if (!token || token.length > 8192) throw new InputError("관리자 로그인이 필요합니다.", "", 401);
  let user;
  try { user = await backend.call("/auth/v1/user", { headers: { Authorization: `Bearer ${token}` } }); }
  catch (error) { if ([401,403].includes(error.status)) throw new InputError("로그인이 만료되었습니다. 다시 로그인해주세요.", "", 401); throw error; }
  if (!UUID.test(user?.id || "")) throw new InputError("관리자 로그인이 필요합니다.", "", 401);
  const rows = await backend.call(`/rest/v1/daese_admins?user_id=eq.${user.id}&active=eq.true&select=user_id`);
  if (!rows.length) throw new InputError("관리자 권한이 없습니다.", "", 403);
  return user;
}

export function createAdminHandler(env, { backendFactory = createBackend, fetcher = fetch } = {}) {
  return async function handle(request) {
    let headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
    try {
      headers = cors(request, env);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") throw new InputError("지원하지 않는 요청입니다.", "", 405);
      if (!request.headers.get("origin")) throw new InputError("관리자 페이지에서 다시 시도해주세요.", "", 403);
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new InputError("요청 형식을 확인해주세요.");
      const backend = backendFactory(env, fetcher);
      if (body.action === "login") {
        if (typeof body.email !== "string" || body.email.length > 254 || typeof body.password !== "string" || !body.password || body.password.length > 1024) {
          throw new InputError("이메일과 비밀번호를 확인해주세요.");
        }
        let session;
        try { session = await backend.call("/auth/v1/token?grant_type=password", { method: "POST", body: { email: body.email, password: body.password } }); }
        catch (error) { if ([400,401,403,422].includes(error.status)) throw new InputError("로그인 정보 또는 관리자 권한을 확인해주세요.", "", 401); if (error.status === 429) throw new InputError("로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.", "", 429); throw error; }
        await requireAdmin(backend, session.access_token);
        // Never persist or return a refresh token; closing/reloading this page logs out.
        return json({ accessToken: session.access_token, expiresIn: session.expires_in }, 200, headers);
      }
      const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
      const user = await requireAdmin(backend, token);
      if (body.action === "logout") {
        await backend.call("/auth/v1/logout?scope=local", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        return json({ ok: true }, 200, headers);
      }
      if (body.action === "list") {
        const statuses = ["submitted", "reviewing", "approved", "rejected"];
        if (body.status && !statuses.includes(body.status)) throw new InputError("조회 조건을 확인해주세요.");
        const offset = Number(body.offset || 0);
        if (!Number.isInteger(offset) || offset < 0 || offset > 1000000) throw new InputError("페이지를 확인해주세요.");
        const rows = await backend.call(`/rest/v1/daese_applications?select=id,name,birth_year,region_city,status,photo_review,created_at&order=created_at.desc,id.desc&limit=25&offset=${offset}${body.status ? `&status=eq.${body.status}` : ""}`);
        return json({ applications: rows }, 200, headers);
      }
      if (body.action === "cleanup") return json({ removed: await cleanupPhotos(backend) }, 200, headers);
      if (!UUID.test(body.id || "")) throw new InputError("신청 번호를 확인해주세요.");
      if (body.action === "detail") {
        const rows = await backend.call(`/rest/v1/daese_applications?id=eq.${body.id}&select=*`);
        if (!rows.length) throw new InputError("신청서를 찾을 수 없습니다.", "", 404);
        const [contact, consent, sensitive, signed] = await Promise.all([
          backend.call(`/rest/v1/daese_contacts?application_id=eq.${body.id}&select=phone,phone_verified`),
          backend.call(`/rest/v1/daese_consents?application_id=eq.${body.id}&select=*`),
          backend.call(`/rest/v1/daese_sensitive_details?application_id=eq.${body.id}&select=religion`),
          backend.call(`/storage/v1/object/sign/application-photos/${rows[0].photo_path}`, { method: "POST", body: { expiresIn: 60 } }).catch(() => null),
        ]);
        const signedPath = signed?.signedURL;
        const photoUrl = typeof signedPath === "string" && signedPath.startsWith("/object/sign/application-photos/")
          ? `${env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1${signedPath}` : null;
        const { photo_path, ...application } = rows[0];
        return json({ application, contact: contact[0], consent: consent[0], sensitive: sensitive[0] || null, photoUrl }, 200, headers);
      }
      if (body.action === "review") {
        if (!["submitted","reviewing","approved","rejected"].includes(body.status)
          || !["pending","approved","rejected"].includes(body.photoReview)
          || typeof body.note !== "string" || body.note.length > 3000
          || typeof body.updatedAt !== "string" || !Number.isFinite(Date.parse(body.updatedAt))) throw new InputError("검토 내용을 확인해주세요.");
        if (body.status === "approved" && body.photoReview !== "approved") throw new InputError("정면 얼굴 사진을 먼저 확인하고 승인해주세요.");
        const updated = await backend.rpc("daese_review_application", { p_id: body.id, p_actor: user.id,
          p_status: body.status, p_photo_review: body.photoReview, p_note: body.note, p_expected_updated_at: body.updatedAt });
        if (!updated) throw new InputError("다른 곳에서 수정되었거나 삭제되었습니다. 상세를 다시 열어주세요.", "", 409);
        return json({ ok: true }, 200, headers);
      }
      if (body.action === "delete") {
        if (body.confirmId !== body.id) throw new InputError("삭제할 신청 번호를 다시 확인해주세요.");
        const removed = await backend.rpc("daese_delete_application", { p_id: body.id, p_actor: user.id });
        let photosPending = false;
        try { await cleanupPhotos(backend); } catch { photosPending = true; }
        return json({ removed, photosPending }, 200, headers);
      }
      throw new InputError("지원하지 않는 요청입니다.");
    } catch (error) { return publicError(error, headers); }
  };
}
