# AI 연동 설정(API 키 등록) 시 "CSRF 토큰이 유효하지 않습니다" 오류 수정

날짜: 2026-06-07
요청자: 운영자
배경: 포털의 AI 연동 설정 페이지(/portal/ai-settings 등, `PortalAiSettings.jsx`)에서 새 AI를 등록(API 키 입력 후 저장)하면 "CSRF 토큰이 유효하지 않습니다" 오류가 발생해 등록이 불가능했습니다.

## 원인 분석
- 백엔드 `lib/csrf.js`는 더블 서브밋 쿠키 패턴으로 모든 상태 변경 요청(POST/PUT/PATCH/DELETE)에 대해 `x-csrf-token` 헤더의 서명을 검증한다. 이 헤더가 없거나 서명이 일치하지 않으면 403과 함께 "CSRF 토큰이 유효하지 않습니다"를 반환.
- `PortalAiSettings.jsx`는 공용 `utils/api.js`의 `portalApi` 래퍼를 사용하지 않고, 자체 `apiFetch` 헬퍼로 직접 `fetch`를 호출하고 있었는데, 이 헬퍼는 `Content-Type`/`Authorization` 헤더만 첨부하고 `x-csrf-token` 헤더를 전혀 보내지 않았음(또한 `credentials: "include"`도 누락). 그 결과 AI 등록·수정·삭제·기본 AI 지정 등 모든 상태 변경 요청이 CSRF 검증에서 거부됨.
- `curl`로 재현: 쿠키만 보내고 `x-csrf-token` 헤더를 생략하면 정확히 동일한 "CSRF 토큰이 유효하지 않습니다" 오류가 재현되고, 헤더를 포함하면 CSRF 검증을 통과해 그 다음 단계(인증 확인)로 진행됨을 확인.

## 변경 파일
- `frontend/src/pages/portal/PortalAiSettings.jsx`
  - `apiFetch` 헬퍼에 `getCsrfToken()`(쿠키 `csrf-token` 파싱, `utils/api.js`의 `getCookie` 패턴과 동일)을 추가하고, POST/PUT/PATCH/DELETE 요청에 `x-csrf-token` 헤더를 동봉하도록 수정. `credentials: "include"`도 함께 추가해 공용 래퍼와 동일한 쿠키 전송 방식으로 통일.
  - (부수 정리) lint에서 발견된 미사용 상태 `providerExpanded`/`setProviderExpanded`를 제거(no-unused-vars 오류 해소, 본 작업과 무관하게 이미 미사용 상태였음).

## 검증 절차
1. `curl`로 GET `/api/ai-configs/providers`를 호출해 서버가 발급하는 `csrf-token` 쿠키를 획득.
2. 동일 쿠키로 POST `/api/ai-configs`를 호출했을 때:
   - `x-csrf-token` 헤더 누락 시 → `"CSRF 토큰이 유효하지 않습니다"` (버그 재현)
   - `x-csrf-token` 헤더 포함 시 → CSRF 검증 통과, 다음 단계인 `"인증이 필요합니다"` 응답으로 진행 (수정 확인)
3. `npx eslint src/pages/portal/PortalAiSettings.jsx` — No issues found.

## 향후 개선
- `PortalAiSettings.jsx`처럼 공용 `portalApi` 래퍼 대신 자체 `fetch` 헬퍼를 사용하는 페이지가 또 있는지 점검해, 동일한 CSRF 누락 문제가 잠재되어 있지 않은지 확인 권장. 가능하면 공용 래퍼로 통일하는 것이 향후 동일 버그 재발을 막는 가장 확실한 방법.
