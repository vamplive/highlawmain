# 포털 직원 기능 추가 — 회원가입 승인, 사건 등록, 구글 캘린더, 타임트래킹

날짜: 2026-06-01
요청자: 운영자
배경: 직원/의뢰인이 포털에서 자신의 사건을 직접 등록하고, 사건별 작업 시간을 기록하며,
      관리자가 회원가입을 승인·거절할 수 있는 워크플로우와 구글 캘린더 연동 기능 추가 요청

## 변경 파일

### 백엔드 (frontend/backend/)

- `db/schema.js`
  - `portal_users`: `isActive` default 1→0(승인 대기), `googleAccessToken/RefreshToken/TokenExpiresAt` 추가
  - 신규 테이블 `portalTimeEntries` — 포털 사용자 사건별 시간 기록

- `db/init-schema.js`
  - `portal_users` Google OAuth2 토큰 컬럼 3개 ALTER TABLE 추가
  - `portal_time_entries` 테이블 + 인덱스 3개 CREATE TABLE IF NOT EXISTS

- `services/portal-service.js` (전면 개편)
  - `registerUser`: isActive=0(승인대기)로 등록
  - `loginUser`: isActive 0(대기)/1(활성)/-1(거절) 분기 오류 메시지
  - 신규: `listPortalUsers`, `approvePortalUser`, `rejectPortalUser`, `deletePortalUser`
  - 신규: `registerPortalCase` — 포털 사용자 직접 사건 등록
  - 신규: 타임트래킹 함수 7개 (list/summary/active/create/start/stop/update/delete)
  - 신규: 관리자 타임트래킹 `listAdminPortalTimeEntries`
  - 신규: 구글 토큰 저장/조회/연결해제

- `routes/portal.js` (전면 개편)
  - `POST /api/portal/cases` — 포털 사용자 직접 사건 등록
  - `GET|POST|PUT|DELETE /api/portal/time-entries/*` — 타임트래킹 CRUD + 타이머
  - `GET /api/portal/google/auth-url` — OAuth2 URL 발급
  - `GET /api/portal/google/callback` — OAuth2 콜백, 토큰 저장
  - `POST /api/portal/google/sync-case/:caseId` — 사건 캘린더 이벤트 생성
  - `DELETE /api/portal/google/disconnect` — 연동 해제
  - `GET|POST|DELETE /api/portal/admin/users/*` — 포털 사용자 관리 (승인/거절/삭제)
  - `GET /api/portal/admin/time-entries` — 전체 타임트래킹 조회 (일자/사건/직원)

- `lib/google-calendar-oauth.js` (신규)
  - 포털 사용자 개인 구글 캘린더 OAuth2 연동 (Service Account 방식과 별도)
  - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` 환경변수 필요
  - 인증 URL 생성, 코드→토큰 교환, 토큰 갱신, 캘린더 이벤트 생성

### 프론트엔드 (frontend/frontend/src/)

- `pages/portal/PortalRegister.jsx` — 성공 메시지를 "관리자 승인 대기" 안내로 변경

- `pages/portal/PortalLogin.jsx` — 승인 대기 403 오류 시 주황색 배경 강조 표시

- `pages/portal/PortalLayout.jsx` — 상단 nav에 "타임트래킹" 링크 추가

- `pages/portal/PortalDashboard.jsx` (전면 개편)
  - 구글 캘린더 연동/해제 버튼
  - "사건 등록" 버튼 → /portal/cases/register
  - 사건 카드에 "📅 캘린더 추가" 버튼 (연동 시)
  - OAuth2 콜백 파라미터 처리 (googleConnected, googleError)

- `pages/portal/PortalCaseRegister.jsx` (신규)
  - 사건 등록 폼 (사건번호, 법원, 유형, 당사자 등)
  - "정보 가져오기" 버튼 — 사건번호 형식 파싱으로 자동 유추
  - 대법원 전자소송 안내 메시지

- `pages/portal/PortalTimeTracking.jsx` (신규)
  - 타이머 시작/종료 패널 (실시간 경과 시간 표시)
  - 수동 입력 폼
  - 기록 목록 탭 (사건 필터, 삭제)
  - 사건별 취합 탭 (합계 시간, 기록 수)

- `pages/admin/portal-users/index.jsx` (신규)
  - 회원 관리 탭: 승인대기/활성/거절 상태별 목록
  - 승인/거절/삭제 액션 버튼
  - 타임트래킹 조회 탭: 일자/직원/사건 필터 + 테이블

- `pages/admin/layout/index.jsx` — 사이드바에 "포털 관리 > 회원 관리" 메뉴 추가

- `App.jsx` — 신규 라우트 등록:
  - `/portal/cases/register`
  - `/portal/time-tracking`
  - `/admin/portal-users`

## 검증 절차

1. 백엔드 서버 재시작 → DB 마이그레이션 자동 적용 (init-schema.js)
2. `/portal/register` → 가입 → "승인 대기" 메시지 확인
3. 승인 전 로그인 시도 → "승인 대기 중" 오류 메시지 확인
4. `/admin/portal-users` → 승인 대기 목록에서 "승인" 클릭
5. 승인 후 로그인 → 대시보드 이동 확인
6. 대시보드 → "사건 등록" → 폼 작성 및 등록 → 목록 확인
7. 타임트래킹 페이지 → 타이머 시작/종료 → 기록 확인
8. 수동 입력 → 사건별 취합 탭 확인
9. 관리자 타임트래킹 조회 → 날짜 필터 적용

## 향후 개선

- 대법원 전자소송 API 연동: 공공데이터포털(data.go.kr)에서 법원 판결 API 승인 후 실제 연동
- 구글 캘린더: 법정 일정(court_dates)을 자동으로 포털 사용자 캘린더에 동기화
- 포털 타임엔트리를 관리자 ERP time_entries와 통합(변호사 연결 시)
- 이메일 알림: 회원가입 승인 시 자동 이메일 발송
- 사건 등록 후 관리자 알림
