# 개인정보 처리 운영 문서

이 문서는 대.세.는 소개팅의 운영자·개발자가 개인정보 처리 구조와 남은 작업을 관리하기 위한 내부 문서다. 사용자용 안내는 [`privacy.html`](../privacy.html)을 기준으로 한다.

실제 Secret, 비밀번호, API Key, 신청자 이름·전화번호·사진 등 개인정보를 이 문서나 Git에 기록하지 않는다. 아래에는 환경변수 이름과 구조만 기재한다.

## 1. 현재 개인정보 데이터 흐름

```text
사용자 브라우저
├─ Vercel: HTML·CSS·JavaScript·이미지 제공
├─ Cloudflare Turnstile: 접수 개방 시 자동입력 방지 확인
└─ Supabase Edge Function: 허용 origin·입력·동의·사진·Turnstile 결과 검증
   ├─ PostgreSQL DB: 신청·연락처·동의·검토 및 처리 상태 저장
   └─ 비공개 Storage: 구도 조정된 프로필 JPG 저장
```

정적 페이지는 Vercel에서 제공된다. 브라우저는 공개 설정에 지정된 Supabase Edge Function으로 신청서와 사진을 전송한다. Turnstile이 활성화된 경우 브라우저가 확인 토큰을 받고 Edge Function이 Cloudflare 검증 API로 확인한다. 서버 측 검증을 통과한 데이터만 DB와 Storage에 저장한다.

현재 실제 운영 접수는 `APPLICATIONS_ENABLED=false`로 차단돼 있다. 자동 파기의 실제 DB·Storage 삭제, 재호출 및 5분 Cron 실행을 확인해 코드의 `RETENTION_AUTOMATION_VERIFIED=true`로 기록했지만, 최종 운영 점검 전까지 접수 환경변수는 열지 않는다.

## 2. Supabase 테이블별 개인정보 역할

| 테이블 | 역할 |
| --- | --- |
| `daese_applications` | 신청 기본·매칭 정보, 심사 상태, 사진 경로, 관리자 메모 |
| `daese_contacts` | 전화번호와 `phone_verified=false` 상태. 현재 번호를 고유 식별자로 사용하지 않음 |
| `daese_consents` | 필수 동의, 종교 별도 동의, 동의 문서 버전과 서버 시각 |
| `daese_sensitive_details` | 별도 동의가 있는 신청의 종교만 저장 |
| `daese_admins` | 허용된 관리자 Auth 사용자 UUID와 활성 상태 |
| `daese_review_events` | 검토 관리자, 신청·사진 상태 및 변경 시각 |
| `daese_intake_jobs` | 재전송·중복 저장 제어를 위한 요청 ID, 지문, lease, 사진 경로, 처리 상태 |
| `daese_rate_limits` | HMAC 처리한 접속 주소 식별값, 10분 구간, 요청 횟수 |
| `daese_photo_cleanup` | Storage 사진 삭제 재시도 대상 경로와 등록 시각 |
| `daese_purge_audit` | 신청 내용 없이 접수 UUID·파기 사유·DB/사진 삭제 시각·실패 상태만 기록하는 파기 이력 |

## 3. 민감정보 종교 처리 방식

- 신청 화면에서 종교 선택과 민감정보 동의 체크박스를 분리한다.
- 별도 동의가 없으면 브라우저가 종교 입력을 전송 항목에서 제외한다.
- 서버 검증도 별도 동의가 없으면 종교 값을 `null`로 만든다.
- 별도 동의와 유효한 값이 모두 있을 때만 `daese_sensitive_details`에 저장한다.
- 종교 미동의는 필수 개인정보 동의나 신청 가능 여부에 영향을 주지 않는다.

## 4. 관리자 인증 구조

- 관리자는 Supabase Auth 이메일·비밀번호로 로그인한다.
- Edge Function이 access token으로 Auth 사용자를 확인하고, `daese_admins`의 활성 행을 다시 확인한다.
- 이메일이나 클라이언트의 임의 플래그만으로 관리자 권한을 부여하지 않는다.
- 브라우저는 access token을 메모리에만 보관하고 refresh token을 저장하거나 반환받지 않는다.
- 새로고침, 창 닫기 또는 토큰 만료 시 다시 로그인한다. 관리자 MFA UI는 아직 없다.

## 5. RLS 및 권한 구조

- 모든 `daese_*` 테이블에 RLS가 활성화되어 있다.
- `public`, `anon`, `authenticated` 역할의 테이블 권한과 서비스 RPC 실행 권한을 회수한다.
- 서버 역할만 필요한 테이블·함수·Storage 작업을 실행한다.
- `application-photos` 버킷은 비공개이며, 익명·일반 로그인 계정 접근을 막는 제한 정책이 있다.
- 관리자 브라우저도 DB를 직접 조회하지 않고 관리자 Edge Function을 경유한다.

## 6. 서버 Secret 관리 원칙

- 서버 전용 값은 Supabase Edge Function Secrets 또는 로컬의 Git 제외 환경 파일에서만 관리한다.
- 브라우저 파일·HTML·README·Git·대화·오류 응답에 실제 값을 기록하지 않는다.
- 사용 환경변수 이름: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`, `APPLICATIONS_ENABLED`, `ALLOWED_ORIGINS`, `CONSENT_VERSION`, `RATE_LIMIT_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, 로컬 전용 `ALLOW_LOCAL_TEST_SUBMISSIONS`.
- 공개 가능한 것은 Supabase 함수 endpoint와 접수 개방 시 전달하는 Turnstile site key다. 서버 전용 key와 rate-limit secret은 브라우저에 전달하지 않는다.
- 노출이 의심되면 해당 credential을 폐기·재발급하고 배포 설정을 갱신한 뒤 접근 기록을 확인한다.

## 7. HMAC 기반 요청 제한 구조

- Edge Function이 요청의 접속 주소와 `RATE_LIMIT_SECRET`으로 HMAC-SHA-256 식별값을 만든다.
- DB에는 원문 접속 주소 대신 이 식별값, 10분 시간 구간과 요청 횟수를 저장한다.
- 새 신청은 한 시간 구간 내 다섯 건까지 허용하며 여섯 번째 요청을 제한한다.
- 요청 제한 기록은 `daese_prepare_cleanup` 실행 시 1일이 지난 구간을 정리한다. 해당 함수의 자동 스케줄은 아직 없다.

## 8. request ID, fingerprint 및 intake job 구조

- 브라우저는 신청 시 UUID 형식의 request ID를 만들고 같은 전송의 재시도에 재사용한다.
- 서버는 검증한 신청 payload와 사진 바이트 각각의 해시를 조합해 fingerprint를 만든다.
- `daese_claim_intake`는 request ID 단위 자문 잠금, fingerprint 비교, 요청 제한 증가와 lease 발급을 한 트랜잭션에서 처리한다.
- 같은 ID·같은 fingerprint가 이미 제출됐으면 기존 성공을 반환한다. 같은 ID에 다른 내용이면 충돌로 거절한다.
- `receiving` 작업은 일정 시간이 지나면 새 사진 경로와 lease로 회수할 수 있고 이전 사진 경로를 정리 대기열에 넣는다.
- 사진 업로드 뒤 `daese_finish_intake`가 사진 존재·동의 버전·출생연도를 확인하고 신청·연락처·동의·종교 행을 한 DB 트랜잭션으로 저장한다.

## 9. 프로필 사진 Storage 및 임시 URL 구조

- 브라우저의 크롭 결과를 JPG로 만들며 서버는 파일 크기, JPEG signature와 예상 크기를 검증한다. 자동 얼굴 판별이나 본인인증은 아니다.
- 사진은 비공개 `application-photos` 버킷에 request ID별 경로로 저장한다. 덮어쓰기는 허용하지 않는다.
- 관리자 상세 조회 시 서버가 60초 유효한 임시 URL을 발급한다.
- API 응답에서는 영구 사진 경로를 제거하고 임시 URL만 전달한다.
- 사진의 정면 얼굴 여부는 관리자가 직접 심사하며, 사진 승인 전 신청 승인은 허용하지 않는다.

## 10. 관리자 삭제 흐름

```text
관리자 삭제 확인
→ daese_delete_application
→ 신청 DB 행과 cascade 연결 정보 삭제
→ photo cleanup queue 등록
→ Storage API로 실제 파일 삭제
→ 성공한 queue 행 삭제
```

관리자는 삭제 대상 접수번호를 다시 입력해야 한다. DB 함수는 활성 관리자 여부를 확인한 뒤 신청·연락처·동의·종교·검토 이력 등 연결 정보를 삭제하고 사진 경로를 `daese_photo_cleanup`에 등록한다. 이후 관리자 API가 Storage 파일 삭제를 시도한다.

## 11. 사진 삭제 실패 및 재시도

- DB 삭제와 Storage 파일 삭제는 하나의 원자적 작업이 아니다.
- Storage 삭제에 실패하면 queue 행을 지우지 않고 관리자 화면에 사진 삭제 대기 상태를 알린다.
- 관리자는 `삭제 대기 사진 재시도` 동작으로 queue를 다시 처리할 수 있다.
- 성공한 사진 경로만 queue에서 제거한다.
- queue가 비었다는 사실과 실제 Storage 부재를 통합 환경에서 함께 확인해야 한다.

## 12. 자동 보유기간 파기 상태

접수 시 `purge_due_at`을 30일보다 1시간 이른 시각으로 설정한다. 미승인 결과 안내, 서비스 이용 종료 또는 확인된 삭제 요청을 관리자가 기록하면 기한을 47시간 뒤로 앞당긴다. 실행 지연과 재시도 시간을 확보해 공개 방침의 30일·48시간 이내 기준을 넘기지 않기 위한 여유다.

5분 Cron이 Vault의 전용 Secret으로 `retention-cleanup` Edge Function을 호출한다. DB 함수는 기한 만료 신청의 연결 개인정보를 삭제하고 사진을 대기열로 옮기며, Edge Function은 Storage API로 파일을 삭제한다. 실패한 사진은 시도 횟수·시각·오류를 남기고 다음 Cron에서 재시도한다. 관리자 수동 재시도도 유지한다.

가상 신청으로 신청·연락처·동의 DB 행과 비공개 사진의 실제 삭제, 파기 이력, 두 번째 호출의 안전한 무작업 결과를 확인했다. `daese_prepare_cleanup`은 미완료 업로드와 요청 제한 기록을 정리하고, `daese_prepare_retention_purge`가 보유기한 파기를 담당한다.

## 13. 자동 파기 정책

- 미처리 신청: 접수일로부터 30일을 초과하기 전에 개인정보와 사진 삭제.
- 미승인 신청자: 심사 결과를 실제로 안내한 시각부터 48시간 이내 개인정보와 사진 삭제.
- 승인 회원: 서비스 이용 종료 또는 확인된 삭제 요청 시각부터 48시간 이내 개인정보와 사진 삭제.
- 별도로 유지되는 신청 심사 운영 기준: 접수 후 최대 48시간 이내 심사. 이 기준은 미처리 신청 30일 상한과 다르다.

Cron 실행 이력과 실패 queue는 운영 중 계속 점검한다. 외부 실패 알림, 백업과 로그의 삭제·보유 방식은 별도로 확인한다.

## 14. 개인정보 사고 대응 기본 체크리스트

- [ ] 실제 접수와 관련 배포를 즉시 제한하고 추가 수집·노출 가능성을 차단한다.
- [ ] 원본을 임의로 변경하지 않는 범위에서 발생 시각, 영향 시스템, 노출 가능 항목과 대상 범위를 확인한다.
- [ ] 노출 가능성이 있는 Secret·관리자 세션을 폐기하고 필요한 credential을 재발급한다.
- [ ] Supabase Auth, DB, Storage, Edge Function, Cloudflare와 Vercel 설정·로그를 필요한 범위에서 확인한다.
- [ ] 사진 임시 URL, RLS, 관리자 목록, 허용 origin과 배포 산출물을 점검한다.
- [ ] 필요한 경우 개인정보·보안 전문가와 관계 기관 안내를 확인하여 통지·신고 의무와 방법을 결정한다. 확인 전 법적 의무나 완료 여부를 단정하지 않는다.
- [ ] 이용자 안내가 필요하면 확인된 사실, 영향 범위, 대응 조치와 문의 창구를 명확하게 전달한다.
- [ ] 원인·조치·재발 방지 작업을 기록하고 수정 후 권한 및 데이터 흐름을 재검증한다.

## 15. 외부 서비스 계약·국외이전 검토 TODO

Supabase, Cloudflare Turnstile, Vercel 각각에 대해 운영 전 계약 및 실제 데이터 흐름 확인이 필요하다. 현재 코드 구조만으로 처리위탁 또는 국외이전 여부를 단정하지 않는다.

- [ ] 계약 주체와 적용 약관·데이터 처리 계약 확인.
- [ ] 실제 처리 항목, 목적, 수신자, 처리 위치·국가, 전송 시기와 방법 확인.
- [ ] 각 서비스와 하위 처리자의 보유기간, 로그·백업·삭제 방법 확인.
- [ ] 필요한 공개 고지·별도 동의 여부를 확인하고 `privacy.html`과 신청 동의를 갱신.
- [ ] 서울 DB 리전이 인증·함수·봇 방지·호스팅을 포함한 모든 처리를 국내로 한정한다는 뜻인지 별도 확인.
- [ ] 공개 방침을 변경하면 문서 버전, 신청 화면, 브라우저·서버 상수와 새 마이그레이션을 함께 갱신. 기존 동의 기록과 마이그레이션은 덮어쓰지 않는다.
