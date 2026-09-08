# Supabase 연결 및 운영 준비

현재 대상은 `index.html` / `apply.html`의 **대.세.는 소개팅**입니다.
이전 Expo 실험 앱은 연결 대상이 아닙니다. 작성일: 2026-09-07.

## 현재 상태

- 사진 구도 보정(2026-09-09): 새 신청 화면은 정사각형 1200×1200 JPG를 생성합니다. 배포 시 `submit-application` 함수를 먼저 배포한 뒤 웹을 배포하세요. 서버는 새 규격과 기존 1780×1090을 모두 허용하여 열린 구버전 신청창도 호환합니다. 기존 저장 사진은 변환하지 않습니다. 로컬 서버는 함수 변경을 반영하도록 재시작해야 합니다.

- DB 생성 SQL, 신청 API, 관리자 API·화면, 로컬 서버 연결 코드 작성.
- PostgreSQL 엔진(PGlite)의 로컬 가상 DB 및 API 대역을 사용한 자동 검증 포함.
- Supabase 개발 프로젝트 `daese-sogating-dev` 생성 확인: 서울 리전, 대시보드 상태 Healthy (2026-09-07).
- 프로젝트 URL: `https://mfezbzrseuikeltzdtwe.supabase.co`.
- 가상 신청으로 로컬 제출, 관리자 로그인·승인, DB·비공개 사진 저장과 자동 파기를 실제 개발 프로젝트에서 확인했습니다.
- **2026-09-07 점검 시 배포 API의 `enabled:true`를 발견하여 Supabase의 `APPLICATIONS_ENABLED=false`로 변경하고 공개 GET의 `enabled:false`를 확인했습니다.** 기존 신청 데이터의 존재 여부는 조회하지 않았으며 기존 자료도 삭제하지 않았습니다.
- 48시간·30일 기한 자동 파기, Storage 삭제와 실패 재시도 구조를 개발 프로젝트에 배포하고 가상 신청으로 검증했습니다.
- 자동 파기 실제 삭제·재시도·Cron 실행 확인 후 `RETENTION_AUTOMATION_VERIFIED=true`로 기록했습니다. `APPLICATIONS_ENABLED=false`는 최종 운영 점검 전까지 유지합니다.
- 현재 신청자 로그인/문자 인증/자동 사진 판별/카카오톡 자동 발송/상대방 프로필 공유는 구현하지 않았습니다.

## 1. 사용자 계정과 프로젝트

1. https://supabase.com/dashboard 에서 본인 계정을 생성합니다.
2. 프로젝트를 생성합니다. 이름 예: `daese-matching`. 한국 대상 서비스는 서울 리전이 제공되면 선택합니다.
3. DB 비밀번호는 비밀번호 관리 도구 등에 보관합니다. 대화나 Git에 붙여넣지 않습니다.
4. 프로젝트 URL만 전달하면 이후 설정을 이어갈 수 있습니다.
5. 실제 개인정보 테스트 전 개발 전용 프로젝트인지 확인합니다. 테스트는 가상 정보로 진행합니다.

## 2. 스키마 적용

새 프로젝트에는 다음 파일을 순서대로 적용합니다. 기존 프로젝트에는 적용 이력을 확인한 뒤 아직 적용하지 않은 새 파일만 실행합니다.

1. `supabase/migrations/202609070001_application_intake.sql`
2. `supabase/migrations/202609070002_finalize_consent.sql`
3. `supabase/migrations/202609070003_privacy_policy_v1.sql`
4. `supabase/migrations/202609080001_remove_reviewing_status.sql`
5. `supabase/migrations/202609080002_retention_automation.sql`
6. `supabase/migrations/202609080003_purge_audit_retention.sql`

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
| daese_purge_audit | 개인정보 없이 접수 UUID·파기 사유·완료/실패 상태만 남기는 파기 이력 | 없음 |

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
| RETENTION_CRON_SECRET | 예약 자동 파기 호출 전용 무작위 Secret. Edge Secrets와 Vault에만 저장 |
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
- `js/backend-config.js`는 localhost와 `127.0.0.1`에서만 로컬 `/api/applications`·`/api/admin`을 사용하고, 배포 호스트에서는 Supabase Edge Function을 사용합니다.

## 5. 클라우드 함수와 정적 사이트 연결

아래 명령으로 함수 갱신을 배포합니다. 자동 파기와 관리자 함수는 개발 프로젝트에 배포했으며, 신청 함수는 운영 개방 전 최종 코드로 다시 배포합니다.

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

## 6. 확정 정책과 실제 접수 개방 조건

### 2026-09-07 사용자 결정

- 운영 주체: 사용자 본인 명의. 기존 신청서의 김지환 표기를 유지하며 미확정 주소·사업자번호·전화번호는 추가하지 않습니다.
- 사업자등록: 아직 하지 않은 상태(사용자 확인). PASS 제공업체의 사업자 미등록 상태에서의 이용 가능 여부, 계약·심사·요금을 확인해야 함.
- 신청 심사: 신청 접수 후 최대 48시간 이내 심사 완료.
- 장기 미처리 신청: 심사가 완료되지 않은 신청 정보와 프로필 사진도 접수일로부터 30일을 초과하여 보관하지 않음.
- 미승인 신청자: 심사 결과 안내 후 48시간 이내 개인정보와 프로필 사진 파기.
- 승인 회원: 서비스 이용 종료 또는 개인정보 삭제 요청 후 48시간 이내 개인정보와 프로필 사진 파기.
- 관계 법령에서 별도 보존 의무가 발생하면 해당 법령에서 정한 기간 동안 보관할 수 있음. 구체적인 법정 기간을 임의로 정하지 않음.
- 운영 URL: `https://daese-sogating.vercel.app`. Vercel 사용, 별도 도메인 구매 예정 없음.
- 전화번호 인증: 필수 도입. 사용자 후속 결정에 따라 PASS만 제공하는 방향. PASS 지원 방식, 제공업체 및 계약은 미정이며 현재 코드는 미인증 번호를 받음.
- Turnstile: 위젯 `daese-sogating` 생성 완료. 허용 호스트 `daese-sogating.vercel.app`, 모드 `Managed`. 발급 키는 Git에 기록하지 않으며 Supabase 서버 환경변수로 연결.

네 시간 기준은 별개이며 30일 상한이 48시간 심사 기준을 대체하지 않습니다.
공개 방침과 신청 동의, 자동 파기 구조를 동기화했습니다. 본인인증은 아직 미구현입니다.
결과 안내·이용 종료·삭제 요청 시각과 `purge_due_at`을 기록하고, 5분 Cron이 DB 개인정보와 Storage 사진을 정리합니다. 실패한 사진은 대기열에 남아 재시도됩니다.
본인인증 제공업체가 추가되면 실제 수신·저장할 인증 항목을 정하고 동의 문서에 반영합니다.

현재 소스의 방침·동의 버전은 `2026-09-07-v1`입니다. [공개 방침](../privacy.html)과 [새 동의 기록](consent-2026-09-07-v1.md)을 사용합니다.
`consent-2026-09-07-draft.md` 및 `consent-2026-09-07.md`는 과거 기록이며 덮어쓰지 않았습니다. 옛 문의 주소·정책은 당시 기록으로만 보존합니다.
원격 DB 마이그레이션과 자동 파기·관리자 함수는 갱신했습니다. 신청 함수와 정적 사이트는 운영 접수가 닫힌 상태에서 최종 버전으로 함께 배포해야 합니다.

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
- 5분 Cron이 기한 만료 신청과 사진 삭제 대기열을 처리합니다. 10분 넘게 미완료인 업로드와 1일 지난 요청 제한 기록도 함께 정리합니다.
- 사진 삭제까지 완료된 파기 이력은 90일 후 자동 삭제합니다. 해결되지 않은 사진 삭제 실패 기록은 성공할 때까지 유지합니다.
- DB 백업과 사진 파일 백업·복구는 별개입니다. 백업 보관기간 및 삭제 데이터의 백업 처리 방식은 운영 설정에서 확인해야 합니다.

## 8. 검증 범위와 다음 확인

```powershell
npm run test:db
```

로컬 자동 검증: PostgreSQL SQL 실행·권한 차단, 저장 원자성, 재전송, 만료 작업 회수,
관리자 검증·검토 충돌·삭제 대기, 서버 검증, 비밀 파일 요청 차단.
PGlite의 `auth`/`storage`는 구조 대역이므로 실제 Supabase 인증·스토리지·게이트웨이 검증을 대신하지 않습니다.

실제 접수를 열지 않는 격리된 개발 환경에서 가상 신청 1건으로 다음을 추가 확인해야 합니다. 실제 개인정보를 사용하지 않습니다.

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

## 9. 외부 서비스 데이터 흐름 및 운영 전 개인정보 TODO

| 서비스 | 코드상 역할 및 흐름 | 이번 확인 범위 |
|---|---|---|
| Supabase | `js/backend-config.js` → Edge 신청 API → 검증 후 PostgreSQL/비공개 Storage. 관리자 API → Auth 및 `daese_admins` 권한 확인 → 조회·심사·삭제. | 배포 공개 GET 응답과 콘솔 프로젝트·함수·마이그레이션 목록 확인. 실제 신청자 정보는 열람하지 않음. Auth·Storage 실제 성공/실패 통합 검증은 별도 필요. |
| Cloudflare Turnstile | `js/main.js`에서 접수가 열린 경우 위젯 스크립트 로드 → 확인 토큰 → Edge의 siteverify 요청. 서버는 토큰과 서버 키만 보내며 신청서·사진은 보내지 않음. 브라우저 접속 신호는 위젯에서 처리될 수 있음. | 배포 API의 site key 설정 존재를 확인. 실환경 위젯 성공/실패 검증은 이번에 실행하지 않음. 접수 닫힌 상태에서는 위젯을 로드하지 않음. |
| Vercel | 정적 HTML/CSS/JS/이미지 제공. 신청서·사진은 브라우저에서 Supabase로 직접 전송. 현재 별도 Vercel 신청 저장 API는 없음. 호스팅 요청·로그와 신청 DB는 별개. | 공개 사이트 HTTP 200 및 서비스 제목 확인. 플랫폼 로그 내용·보관 설정·배포 산출물 전체는 별도 확인 필요. |

**운영 전 계약 및 실제 데이터 흐름 확인 필요.** 위 기술 역할만으로 법적 위탁/국외이전 관계를 단정하지 않습니다.

- [ ] Supabase·Cloudflare·Vercel 계약 주체, 처리위탁/국외이전 여부, 실제 이전 항목·목적·국가·시기/방법·수신자·보유기간, 필요한 고지/동의 여부를 확인하고 공개 방침 보완. 서울 DB 리전이 모든 처리의 국내 한정을 의미하지 않음.
- [ ] Cron 실행 이력과 사진 실패 대기열을 운영 중 점검하고 외부 실패 알림 연결. 사진이 삭제 대기열에 남은 것을 삭제 완료로 취급하지 않음.
- [ ] 결과 안내·이용 종료·삭제 요청의 신뢰할 수 있는 기준 시각 및 실제 안내 기록 구현. 미승인 후 결과 안내가 누락되어 무기한 보관되지 않도록 운영 절차 확정.
- [ ] 기존 원격 신청 자료가 있다면 운영자가 보유기한과 파기 상태를 확인. 이번 작업은 신청 자료를 조회하거나 일괄 삭제하지 않았음.
- [ ] DB 백업/복구본, Storage, 플랫폼 로그, 문의 이메일 및 수동 연락 채널의 자료 보유·삭제 절차 확인. 법정 보존이 실제로 필요한 항목과 기간이 있는지도 확인. 특정 기간·법률검토 완료 여부를 임의로 쓰지 않음.
- [ ] 열람·정정·삭제·처리정지·철회 요청자의 확인 절차 및 처리 기록을 필요한 범위로 정리. 이메일 창구의 실제 수신 가능 여부 확인.
- [ ] 향후 특정 상대방별 제3자 제공 동의 UI/버전/기록과 허용 항목 필터 구현. 기존 신청 동의를 재사용하지 않음.
- [ ] PASS 도입 시 실제 수집·저장 인증 항목과 계약 조건을 먼저 확인하여 코드·문서 동기화. 현재 `phone_verified=false` 유지.
- [ ] Firebase 전화번호 인증을 선택하면 Blaze 결제, SMS 지역 정책, 운영 도메인, Google의 전화번호 처리 고지를 확인. Spark 요금제에서는 실제 인증 SMS를 발송할 수 없음.
- [ ] 공개 파일만 포함한 배포 산출물, RLS·비공개 사진·관리자 권한·Turnstile·허용 origin 및 새 동의 버전 정합성을 실환경에서 확인.

새 방침 페이지는 서비스 현황 안내이며 법률 검토 완료나 보안 인증을 의미하지 않습니다. 시행 예정일은 실제 접수 개방일로 남겨둡니다.

## 공식 참고 문서

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/functions/function-configuration
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/management/delete-objects
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
