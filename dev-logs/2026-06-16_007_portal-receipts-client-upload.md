# 포털 영수증 페이지 의뢰인 직접 업로드 기능 추가

날짜: 2026-06-16
요청자: 운영자
배경: /portal/receipts 에서 영수증을 넣으려고 하면 "관리자 인증이 필요하다" 오류 발생

## 근본 원인

App.jsx 포털 라우트의 `receipts` 경로가 `<AdminReceipts>` 컴포넌트를 렌더링하고 있었음.
`AdminReceipts` 는 `/api/receipts/*` 를 호출하며 해당 엔드포인트는 모두 `adminAuth` 미들웨어 사용.
포털 사용자는 `portal_session` 쿠키만 보유하므로 401 "관리자 인증이 필요합니다" 반환.

## 해결 방법

의뢰인이 본인 영수증을 직접 업로드·조회·삭제할 수 있는 포털 전용 페이지 및 API 신설.

## 변경 파일

- `backend/db/init-schema.js`
  - `receipts` 테이블에 `portal_user_id TEXT` 컬럼 마이그레이션 추가 (포털 업로드 추적)
  - `receipts` 테이블에 `client_id TEXT` 컬럼 마이그레이션 추가 (의뢰인 연결)
  - 두 컬럼 모두 인덱스 생성

- `backend/routes/portal.js`
  - `const { sqlite } = require("../db")` 추가
  - `GET /api/portal/receipts` — 내 의뢰인 영수증 목록 (portalAuth)
  - `POST /api/portal/receipts` — 파일 업로드 + DB 저장 (portalAuth)
  - `DELETE /api/portal/receipts/:id` — 본인 업로드 영수증 삭제 (portalAuth)

- `frontend/src/pages/portal/PortalReceipts.jsx` (신규)
  - 영수증 목록 조회, 업로드 모달(파일 + 판매처/금액/결제일/메모), 삭제 기능
  - `portalApi.upload()` (FormData) 사용

- `frontend/src/App.jsx`
  - `PortalReceipts` lazy import 추가
  - 포털 `receipts` 라우트: `<AdminReceipts>` → `<PortalReceipts>` 교체

## 검증 절차
- 서버: git push → git pull + npm run build + pm2 restart 완료
