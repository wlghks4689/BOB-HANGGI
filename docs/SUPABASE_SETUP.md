# Supabase 연결 및 운영 준비

현재 대상은 `index.html` / `apply.html`의 **대.세.는 소개팅**입니다.
이전 Expo 실험 앱은 연결 대상이 아닙니다. 작성일: 2026-09-07.

## 현재 상태

- DB 생성 SQL, 신청 API, 관리자 API·화면, 로컬 서버 연결 코드 작성.
- PostgreSQL 엔진(PGlite)의 로컬 가상 DB 및 API 대역을 사용한 자동 검증 포함.
- **Supabase 프로젝트 미생성/미연결: 원격 SQL 적용, 실제 Auth 로그인, Storage 업로드·비공개 검증, 배포는 아직 하지 않았습니다.**
- 정책 문서가 초안이므로 기본 접수는 닫혀 있습니다. 서버 연결 없이 저장 완료로 표시하지 않습니다.
- 현재 신청자 로그인/문자 인증/자동 사진 판별/카카오톡 자동 발송/상대방 프로필 공유는 구현하지 않았습니다.

## 1. 사용자 계정과 프로젝트

1. https://supabase.com/dashboard 에서 본인 계정을 생성합니다.
2. 프로젝트를 생성합니다. 이름 예: `daese-matching`. 한국 대상 서비스는 서울 리전이 제공되면 선택합니다.
3. DB 비밀번호는 비밀번호 관리 도구 등에 보관합니다. 대화나 Git에 붙여넣지 않습니다.
4. 프로젝트 URL만 전달하면 이후 설정을 이어갈 수 있습니다.
5. 실제 개인정보 테스트 전 개발 전용 프로젝트인지 확인합니다. 테스트는 가상 정보로 진행합니다.

## 2. 스키마 적용

새 프로젝트의 SQL Editor에서 다음 파일 전체를 실행합니다.

`supabase/migrations/202609070001_application_intake.sql`

한 트랜잭션으로 테이블·함수·버킷을 생성합니다. 성공한 마이그레이션을 다시 실행하지 않습니다.
이미 운영 데이터나 동일 이름의 객체가 있는 프로젝트에는 먼저 적용 상태를 확인합니다.
향후 수정은 기존 적용 파일을 덮어쓰지 않고 새 마이그레이션으로 추가합니다.

| 테이블 | 내용 | 일반 방문자·일반 로그인 계정 권한 |
|---|---|---|
| daese_applications | 기본 정보·매칭 조건·검토 상태·사진 경로·관리자 메모 | 없음 |
| daese_contacts | 전화번호, `phone_verified=false` | 없음 |
| daese_consents | 필수/종교 동의 여부, 문서 버전, 서버 시각 | 없음 |
| daese_sensitive_details | 별도 동의한 종교만 | 없음 |
| daese_admins | 허용된 관리자 Auth 사용자 UUID | 없음 |
| daese_review_events | 검토 변경자·시각·상태 | 없음 |
| daese_intake_jobs | 재시도 요청 ID, 내용 지문, 업로드 작업 상태 | 없음 |
| daese_rate_limits | HMAC 처리한 접속 주소별 요청 수 | 없음 |
| daese_photo_cleanup | 실제 파일 삭제 재시도 대기열 | 없음 |

`application-photos` 버킷은 비공개이며 JPG, 최대 5MB로 제한합니다.
모든 앱 테이블은 RLS 활성화 + `anon`/`authenticated` 권한 회수 상태입니다.
서버 전용 키만 DB 함수와 저장소를 사용합니다. 관리자 웹 화면도 DB를 직접 조회하지 않습니다.

## 3. 관리자 계정

1. 프로젝트 Authentication의 Users에서 관리자 사용자를 생성합니다. 이것은 Supabase 대시보드 로그인 계정과 별개입니다.
2. 관리자 이메일·비밀번호를 설정하고 이메일 확인 상태를 점검합니다. 관리자 비밀번호를 코드나 채팅에 기록하지 않습니다.
3. 공개 회원가입은 현재 사용하지 않으므로 프로젝트 Auth 설정에서 비활성화합니다.
4. 생성한 Auth 사용자 UUID를 다음 SQL에 넣어 SQL Editor에서 실행합니다.

```sql
insert into public.daese_admins(user_id)
values ('여기에-실제-Auth-사용자-UUID');
```

`user_metadata`의 admin 플래그나 이메일만으로는 관리자 권한을 부여하지 않습니다.
서버는 매 요청마다 Auth의 `/user` 응답과 활성 `daese_admins` 행을 확인합니다.
관리자 해제는 해당 행의 `active=false`로 처리합니다. 기존 검토 이력의 FK가 있어 Auth 사용자 삭제는 바로 되지 않을 수 있습니다.
브라우저는 access token을 메모리에만 보관하며 refresh token은 전달·저장하지 않습니다.
새로고침/창 닫기/토큰 만료 시 재로그인이 필요합니다. 관리자 MFA 로그인 UI는 아직 없습니다.

## 4. 로컬 환경 설정

`.env.example`을 참고해 프로젝트 루트의 `.env.local`에 직접 값을 입력합니다.
파일은 Git에서 제외되고 로컬 웹서버에서도 제공하지 않습니다.

| 환경변수 이름 | 용도 |
|---|---|
| SUPABASE_URL | 프로젝트 URL |
| SUPABASE_SECRET_KEY | 서버 전용 Secret key (`sb_secret_` 형식) |
| SUPABASE_SERVICE_ROLE_KEY | 이전 service_role JWT를 사용하는 경우의 대체 값 |
| APPLICATIONS_ENABLED | 접수 개방 여부. 기본 `false` |
| ALLOWED_ORIGINS | 쉼표로 구분한 정확한 웹사이트 origin. 경로/끝 슬래시 제외 |
| CONSENT_VERSION | 서버·신청서·SQL의 동의 문서 버전과 같아야 함 |
| RATE_LIMIT_SECRET | IP 원문 대신 HMAC을 저장하기 위한 무작위 비밀값. 최소 32자 |
| TURNSTILE_SITE_KEY | 자동입력 방지 공개 site key |
| TURNSTILE_SECRET_KEY | 자동입력 방지 서버 전용 secret |
| ALLOW_LOCAL_TEST_SUBMISSIONS | 로컬 가상 정보 테스트만 허용. Edge에서는 효과 없음 |
| WEBSITE_PORT | 로컬 포트, 기본 4174 |

Secret key와 service_role key 중 하나만 설정하면 됩니다. 브라우저 파일에는 넣지 않습니다.
로컬 설정 변경 후 서버를 재시작합니다.

```powershell
npm run db:check
npm run website
```

- 신청 화면: http://localhost:4174/apply.html
- 관리자 화면: http://localhost:4174/admin.html
- `db:check`는 값이 아닌 연결 여부만 출력하며 데이터를 수정하지 않습니다.
- 로컬 가상 접수 테스트는 `APPLICATIONS_ENABLED=true`, `ALLOW_LOCAL_TEST_SUBMISSIONS=true`와 나머지 연결 설정을 사용합니다.
- 그 상태에서도 DB에는 실제 행이 생깁니다. 본인·타인의 실제 개인정보를 테스트 데이터로 사용하지 않습니다.

## 5. 클라우드 함수와 정적 사이트 연결

프로젝트 준비 후 Supabase CLI의 로그인 및 프로젝트 연결을 거쳐 실행할 명령입니다.
현재 이 명령으로 실제 배포한 상태는 아닙니다.

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy submit-application
npx supabase functions deploy admin-applications
```

이름에 맞는 `verify_jwt=false`가 `supabase/config.toml`에 있습니다.
익명 신청과 관리자 로그인 요청을 받기 위한 설정이며, 관리자 작업은 함수 내부에서 별도로 토큰·권한을 검증합니다.

프로젝트 Edge Functions Secrets에서 런타임 환경변수를 설정합니다.
기본 제공되는 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 활용할 수 있습니다.
로컬 `.env.local`은 자동으로 클라우드에 복사되지 않습니다.

정적 사이트에서는 `js/backend-config.js`의 공개 주소 두 개를 다음 형식으로 지정합니다.

- endpoint: `https://PROJECT_REF.supabase.co/functions/v1/submit-application`
- adminEndpoint: `https://PROJECT_REF.supabase.co/functions/v1/admin-applications`

배포 origin을 `ALLOWED_ORIGINS`에 정확히 등록합니다. 허용 origin은 사용자 인증의 대체 수단이 아닙니다.
일반 웹 공개 파일만 배포합니다: HTML 페이지, `css/`, `js/`, `assets/`.
`.env*`, `.git/`, `supabase/`, `scripts/`, `tests/`, `node_modules/`는 공개 정적 산출물에 포함하지 않습니다.
공개 호스팅의 보안 응답 헤더와 HTTPS 설정도 별도 확인합니다. 로컬 서버 헤더가 자동으로 배포되는 것은 아닙니다.

## 6. 실제 접수를 열기 전 남은 결정

- 미승인 신청서: 결과 안내 후 보관할 일수.
- 승인 회원: 이용 종료·삭제 요청 처리 기준 및 기한.
- 운영 주체·문의 및 삭제 요청 창구·확정 동의 문서.
- 신청자 로그인·전화번호 인증 추가 여부. 현재는 미인증 번호를 받습니다.
- 운영 URL, Turnstile 계정·키·허용 도메인.

현재 버전 `2026-09-07-draft`는 초안입니다. Edge API는 이 버전으로 실제 접수를 열 수 없게 막습니다.
정책 확정 후 신청서 문구와 `docs/consent-2026-09-07-draft.md`를 기반으로 새 문서를 만들고,
프런트/서버의 버전 상수, 서버 환경변수, DB 함수 버전 허용 조건을 **새 마이그레이션**으로 함께 갱신해야 합니다.
변수만 바꿔 실제 접수를 개방하지 않습니다. 보관 기간 자동 삭제는 미구현이며, 정책 확정 후 추가해야 합니다.

## 7. 저장·실패·삭제 동작

- 서버가 필수 항목, 지역 조합, 연도·나이 범위, 전화번호 형식, 크롭 JPG 크기·헤더·치수를 검사합니다.
- 사진 형식 검사는 얼굴 인식이 아닙니다. 관리자가 직접 정면 얼굴 사진을 심사합니다.
- 신청은 `submitted`/사진 `pending`으로 시작합니다. 사진 승인 없이 신청 승인은 불가능합니다.
- 별도 동의 없는 종교는 브라우저와 서버에서 제외합니다.
- 같은 요청 ID/같은 내용의 재전송은 한 번만 저장합니다. 다른 내용으로 같은 ID를 쓰면 거절합니다.
- 새로고침·입력 수정에 따른 새 요청까지 동일인으로 판단하지 않습니다. 전화번호가 같아도 기존 신청서를 덮어쓰지 않습니다.
- 사진 업로드 후 신청·연락처·동의 기록을 한 DB 트랜잭션으로 저장합니다.
- 업로드/DB 응답 시간 초과 시 성공 여부가 불명확하므로 사진을 즉시 지우지 않고 재시도 ID로 복구합니다.
- 만료된 업로드 작업은 다른 경로로 재시도하며 이전 파일은 삭제 대기열로 옮깁니다.
- 관리자 삭제는 개인정보 행을 트랜잭션으로 삭제하고 실제 사진은 Storage API로 삭제합니다.
- 사진 삭제 실패는 관리자 화면에 **삭제 대기**로 표시됩니다. 관리자 화면의 재시도 버튼으로 처리합니다.
- **테이블 행만 직접 삭제하지 마세요.** 관리자 화면을 사용해야 사진이 삭제 대기열에 들어갑니다.
- 정리 함수는 10분 넘게 미완료인 작업, 1일 지난 요청 제한 기록을 정리합니다. 자동 스케줄은 아직 없으므로 운영 시 정기 실행 방식이 필요합니다.
- DB 백업과 사진 파일 백업·복구는 별개입니다. 백업 보관기간 및 삭제 데이터의 백업 처리 방식은 운영 설정에서 확인해야 합니다.

## 8. 검증 범위와 다음 확인

```powershell
npm run test:db
```

로컬 자동 검증: PostgreSQL SQL 실행·권한 차단, 저장 원자성, 재전송, 만료 작업 회수,
관리자 검증·검토 충돌·삭제 대기, 서버 검증, 비밀 파일 요청 차단.
PGlite의 `auth`/`storage`는 구조 대역이므로 실제 Supabase 인증·스토리지·게이트웨이 검증을 대신하지 않습니다.

프로젝트 연결 후 실제 가상 신청 1건을 생성하여 다음을 추가 확인해야 합니다.

1. 관리자 로그인 성공 / 비관리자·변조·만료 토큰 실패.
2. 익명 키·일반 사용자로 테이블 조회·수정·RPC 실행 불가.
3. 공개 사진 URL 접근 불가 / 관리자 임시 URL만 접근 가능.
4. 신청 후 프로필·연락처·동의 행과 실제 사진 일치.
5. 같은 요청 재전송 / 응답 중단 후 재시도에서 한 건 유지.
6. 검토·사진 승인·새로고침 후 저장 상태 유지.
7. 관리자 삭제 후 DB와 Storage 양쪽에서 가상 자료 제거.
8. 실제 배포 origin/CORS/Turnstile 성공·실패·토큰 만료 확인.
9. Edge 게이트웨이의 `x-forwarded-for` 제공 방식과 요청 제한을 실제 환경에서 확인.
10. 정책 확정·개방 전 원격 마이그레이션·함수·정적 사이트의 버전 일치 확인.

## 공식 참고 문서

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/functions/function-configuration
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/management/delete-objects
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
