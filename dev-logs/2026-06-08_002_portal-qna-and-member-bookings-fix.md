# 포털 법률 Q&A 404 및 내부 구성원 예약·고객 관리 접근 제한 수정

날짜: 2026-06-08
요청자: 운영자
배경: 포털 Q&A 관리 진입 시 발생하는 404 에러와 내부 구성원(변호사/직원)이 예약·고객 관리 메뉴에 접근할 때 403 권한 차단이 발생하는 오류 해결

## 변경 파일

### 1. 포털 법률 Q&A 관리 API 경로 수정 (PortalQna.jsx)
- frontend/src/pages/portal/PortalQna.jsx
- API 호출 경로를 기존 `/qna/...`에서 백엔드 라우터 실제 등록 경로인 `/inquiry/...`로 수정.
- 수정 범위:
  - `api.get("/qna/admin/questions...")` → `api.get("/inquiry/admin/questions...")`
  - `api.get("/qna/categories")` → `api.get("/inquiry/categories")`
  - `api.post("/qna/admin/questions", ...)` → `api.post("/inquiry/admin/questions", ...)`
  - `api.patch("/qna/admin/questions/...")` → `api.patch("/inquiry/admin/questions/...", ...)`
  - `api.delete("/qna/admin/questions/...")` → `api.delete("/inquiry/admin/questions/...", ...)`

### 2. 백엔드 구성원 접근 제어 미들웨어 수정 (portal.js)
- backend/routes/portal.js
- `internalMemberOnly` 미들웨어가 단순히 `clientId !== null` 여부로 의뢰인과 내부 구성원을 구분하던 문제 해결.
  - 가입/매칭 과정에서 모든 포털 사용자가 `clientId`를 보유하므로 내부 구성원(변호사/직원)도 403 오류를 반환받았음.
  - `portalService.checkIsEmployee(req.portalUser.userId)` 비동기 함수를 호출하여 DB의 `role` 값을 조회하여 실제 내부 구성원인지 검증하도록 수정.

## 검증 절차
- 로컬 백엔드 테스트 실행: `npm test`를 실행하여 33개 테스트 파일의 410개 테스트 케이스 모두 정상 패스 확인.
- 수정 사항에 대한 코드 리뷰 완료.
