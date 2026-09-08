export const CONSENT_VERSION = "2026-09-07-v1";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_BODY_BYTES = MAX_PHOTO_BYTES + 64 * 1024;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const REGIONS = {
  daejeon: ["동구", "중구", "서구", "대덕구", "유성구"],
  sejong: ["아름동", "한솔동", "도담동", "종촌동", "고운동", "보람동", "새롬동", "대평동", "소담동", "다정동", "해밀동", "반곡동", "나성동", "어진동", "집현동"],
};
const JOBS = ["IT / 개발", "경영 / 사무", "금융", "전문직", "의료", "교육", "공무원 / 공공기관", "연구 / 기술", "디자인 / 예술", "미디어", "영업 / 마케팅", "서비스", "자영업 / 사업", "학생", "기타"];
export class InputError extends Error {
  constructor(message, field = "", status = 400) { super(message); this.field = field; this.status = status; }
}

export function validateForm(form, now = new Date()) {
  for (const key of new Set(form.keys())) {
    if (form.getAll(key).length !== 1) throw new InputError("같은 항목이 중복 전송되었습니다.");
  }
  const text = (key, max, required = true) => {
    const raw = form.get(key);
    if (raw !== null && typeof raw !== "string") throw new InputError("입력 형식을 확인해주세요.", key);
    const value = (raw || "").trim();
    if ((required && !value) || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      throw new InputError(`입력 내용을 확인해주세요. 최대 ${max}자입니다.`, key);
    }
    return value;
  };
  const oneOf = (key, values) => {
    const value = text(key, 80);
    if (!values.includes(value)) throw new InputError("목록에서 항목을 선택해주세요.", key);
    return value;
  };
  const integer = (key, min, max) => {
    const value = text(key, 4);
    if (!/^\d+$/.test(value) || +value < min || +value > max) throw new InputError("선택 범위를 확인해주세요.", key);
    return +value;
  };
  const checked = (key) => form.get(key) === "on";
  if (!checked("privacy_required")) throw new InputError("필수 개인정보 수집 및 이용에 동의해주세요.", "privacy_required");
  if (text("consent_version", 80) !== CONSENT_VERSION) throw new InputError("동의 내용이 변경되었습니다. 새로고침 후 확인해주세요.", "", 409);
  const requestId = text("request_id", 36);
  if (!UUID.test(requestId)) throw new InputError("신청 요청 정보를 확인할 수 없습니다. 새로고침해주세요.");
  const regionCity = oneOf("region_city", Object.keys(REGIONS));
  const job = oneOf("job_category", JOBS);
  const min = integer("preferred_age_min", 20, 40);
  const max = integer("preferred_age_max", 20, 40);
  if (min > max) throw new InputError("희망 최소 나이는 최대 나이보다 클 수 없습니다.", "preferred_age_min");
  const phone = text("phone", 20).replace(/[\s-]/g, "");
  if (!/^0\d{8,10}$/.test(phone)) throw new InputError("전화번호를 확인해주세요.", "phone");
  const birthYear = integer("birth_year", now.getUTCFullYear() - 40, now.getUTCFullYear() - 20);
  const heightValue = text("height", 8);
  if (heightValue !== "195_plus" && (!/^\d{3}$/.test(heightValue) || +heightValue < 145 || +heightValue > 194)) throw new InputError("키를 목록에서 선택해주세요.", "height");
  const mbti = text("mbti", 4);
  if (!/^[IE][NS][TF][JP]$/.test(mbti)) throw new InputError("MBTI를 선택해주세요.", "mbti");
  const religionConsent = checked("sensitive_religion_consent");
  // Never trust the client's omission of optional sensitive data.
  const religion = religionConsent && form.get("religion")
    ? oneOf("religion", ["무교", "기독교", "천주교", "불교", "기타"]) : null;
  return {
    requestId,
    payload: {
      name: text("name", 50), birth_year: birthYear, gender: oneOf("gender", ["male", "female"]),
      region_city: regionCity, region_detail: oneOf("region_detail", REGIONS[regionCity]),
      job_category: job, job_other: job === "기타" ? text("job_other", 80) : null,
      height: heightValue, mbti, smoking: oneOf("smoking", ["yes", "vape", "none"]),
      drinking: oneOf("drinking", ["none", "monthly", "weekly", "often"]),
      pet: oneOf("pet", ["none", "dog", "cat", "other"]),
      preferred_age_relation: oneOf("preferred_age_relation", ["older", "younger", "same", "any"]),
      interests: [text("interest_1", 30), text("interest_2", 30, false), text("interest_3", 30, false)].filter(Boolean),
      priority_condition: text("priority_condition", 1000), preferred_condition: text("preferred_condition", 1000, false),
      preferred_age_min: min, preferred_age_max: max, phone, religion,
      religion_consent: religionConsent, consent_version: CONSENT_VERSION,
    },
  };
}

// Inspect the JPEG envelope and dimensions rather than trusting its filename/MIME.
// This is format validation, not face recognition or photo approval.
export async function validatePhoto(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.type !== "image/jpeg" || !file.size || file.size > MAX_PHOTO_BYTES) {
    throw new InputError("사진 구도를 적용해주세요. 적용한 JPG 사진은 5MB 이하여야 합니다.", "profile_photo");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const invalid = () => { throw new InputError("올바른 JPG 사진이 아닙니다. 사진을 다시 적용해주세요.", "profile_photo"); };
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) invalid();
  let position = 2, dimensions = false, scan = false;
  while (position + 3 < bytes.length) {
    if (bytes[position++] !== 0xff) invalid();
    while (bytes[position] === 0xff) position++;
    const marker = bytes[position++];
    const length = bytes[position] * 256 + bytes[position + 1];
    if (length < 2 || position + length > bytes.length) invalid();
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) invalid();
      const height = bytes[position + 3] * 256 + bytes[position + 4];
      const width = bytes[position + 5] * 256 + bytes[position + 6];
      // Keep in-flight legacy clients compatible while new clients save square photos.
      const square = width === 1200 && height === 1200;
      const legacy = width === 1780 && height === 1090;
      if (!square && !legacy) invalid();
      dimensions = true;
    }
    if (marker === 0xda) { scan = true; break; }
    position += length;
  }
  if (!dimensions || !scan) invalid();
  return bytes;
}

export async function limitedFormData(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("multipart/form-data;")) throw new InputError("지원하지 않는 전송 형식입니다.", "", 415);
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_BODY_BYTES) throw new InputError("사진 용량을 줄여주세요.", "profile_photo", 413);
  if (!request.body) throw new InputError("신청 정보가 없습니다.");
  const reader = request.body.getReader(), chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BODY_BYTES) { await reader.cancel(); throw new InputError("사진 용량을 줄여주세요.", "profile_photo", 413); }
      chunks.push(value);
    }
    return await new Response(new Blob(chunks), { headers: { "Content-Type": type } }).formData();
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError("전송 내용을 읽을 수 없습니다.");
  } finally { reader.releaseLock(); }
}
