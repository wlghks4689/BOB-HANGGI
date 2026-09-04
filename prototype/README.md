# 대.세.는 소개팅 · Onboarding Lab

가입 문구, 태그, 질문, 선택지, 순서와 일부 디자인을 코드 수정 없이 실험하는 기획용 웹 워크벤치입니다. 실제 서비스용 Expo 앱과 분리되어 있으며 백엔드를 사용하지 않습니다.

## 실행

PowerShell 실행 정책 때문에 `npm`이 차단되는 PC에서는 `npm.cmd`를 사용합니다.

```powershell
cd C:\Users\PC21\Documents\ChatGPT\BOBHANGGI\prototype
npm.cmd install
npm.cmd run dev
```

브라우저에서 터미널에 표시된 주소(기본 `http://localhost:5173`)를 엽니다.

## 검증

```powershell
npm.cmd run lint
npm.cmd run build
```

## 데이터

- 초기 기획안: `src/config/default-onboarding-config.ts`
- 타입: `src/types/onboarding.ts`
- 브라우저 저장: `src/storage/prototype-storage.ts`
- JSON 내보내기 파일명: `onboarding-config.json`

Config는 500ms debounce로 LocalStorage에 자동 저장됩니다. 상단의 `초기안으로`는 확인 대화상자를 거친 뒤 초기 Seed로 돌아갑니다.
