# 잘되면 밥한끼

프라이빗 큐레이션 매칭 서비스 **잘되면 밥한끼**의 기획·검증용 프로젝트입니다.

## 프로젝트 구성

- `index.html` — 프라이빗 매칭 랜딩페이지
- `apply.html` — 멤버십 심사 신청 프로토타입
- `css/style.css`, `js/main.js` — 정적 웹사이트 디자인과 동작
- `App.tsx`, `src/` — Expo 기반 모바일 온보딩 앱
- `prototype/` — 문구·디자인·플로우를 브라우저에서 수정하는 Vite 프로토타입 랩
- `feedback.html`, `css/feedback.css` — 기존 웹 피드백 페이지

현재는 프런트엔드 프로토타입이며 실제 회원 로그인, 데이터베이스, 결제, 본인인증, 예약 API는 연결하지 않습니다.

## 실행 방법

PowerShell의 실행 정책 영향을 피하기 위해 `npm` 대신 `npm.cmd` 명령을 사용할 수 있습니다.

### 정적 웹사이트

```powershell
npm.cmd run website
```

기본 주소: `http://localhost:4174/`

### Expo 앱

```powershell
npm.cmd start
```

### 온보딩 프로토타입 랩

```powershell
npm.cmd --prefix prototype run dev
```

## 검사

```powershell
npm.cmd run typecheck
npm.cmd run test:questions
npm.cmd --prefix prototype run build
npm.cmd --prefix prototype run lint
```

## 주요 편집 위치

- 웹 색상과 간격: `css/style.css` 상단의 CSS 변수 및 반응형 규칙
- 웹 문구: `index.html`, `apply.html`
- 신청서 동작: `js/main.js`
- 앱 디자인 토큰: `src/theme/tokens.ts`
- 프로토타입 기본 문구: `prototype/src/config/default-onboarding-config.ts`
