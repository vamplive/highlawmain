# 조직도 기반 전자결재 및 연차 자동 누적 시스템 구현

날짜: 2026-06-06
요청자: 운영자
배경: 포털 사용자(임직원)가 휴가(연가), 지출결의, 경비청구를 신청하고 결재받을 수 있는 전자결재 시스템을 구현하며, 조직도 설정에 따라 상향 결재선이 자동 생성되고, 연차 휴가는 근로기준법 규칙에 맞게 자동 발생 및 차감되도록 보완함.

## 변경 파일
- `backend/db/schema.js` (이전 수정 완료)
  - `departments` (조직 부서), `portalApprovals` (전자결재 요청) 테이블 정의
  - `portalUsers` 테이블에 `hireDate` (입사일), `departmentId` (소속 부서), `position` (직급) 컬럼 추가
- `backend/db/init-schema.js`
  - 데이터베이스 초기화 함수(`initTables`) 마지막에 `departments` 및 `portal_approvals` 테이블 생성 DDL 추가
  - 기존 `portal_users` 테이블에 입사일, 부서, 직급 관련 컬럼 추가를 위한 `ALTER TABLE` 구문 추가
- `backend/services/approval-service.js` (신규 파일)
  - `calculateLeaveAllowance`: 입사일 기준 근로기준법에 맞는 연차 휴가 일수(1년 미만: 1개월당 1일(최대 11일), 1년 완료: 15일, 3년 완료 시점부터 2년마다 1일씩 가산, 최대 25일)를 발생 시간으로 변환해 주는 로직 구현
  - `getUserLeaveStatus`: 총 누적 시간에서 승인된 연가 신청 시간의 합을 구한 후, 남은 잔여 휴가 현황을 계산해 주는 함수 구현
  - `buildApprovalLine`: 사용자 부서를 따라 부서장 및 상위 부서장 계통으로 결재선을 생성해 주는 함수 구현
  - `submitApproval`: 연차 휴가 신청 시 잔여 시간 검증 로직 및 지출/경비 관련 필드 검증을 거친 후 자동 생성된 결재선 정보와 함께 결재 상신 처리
  - `approveApproval` / `rejectApproval`: 결재선 내 결재 순서 검증 및 승인/반려 시 상태 업데이트 로직 구현
- `backend/routes/approvals.js` (신규 파일)
  - 휴가/지출/경비 결재의 상신, 목록(내 기안함, 결재 대기함, 완료 수신함), 상세 보기 및 승인/반려 처리를 수행하는 API 구현
- `backend/routes/organization.js` (신규 파일)
  - 부서의 등록/수정/삭제와 구성원들의 부서 지정, 직급 설정, 입사일 수정을 수행하는 관리자 API 구현
- `backend/index.js`
  - `/api/portal/approvals` 및 `/api/admin/organization` API 라우터 등록
- `backend/services/portal-service.js`
  - `registerUser` 가입 신청 시 입력받은 입사일(`hireDate`)도 DB에 보관되도록 필드 추가
- `frontend/src/pages/public/LoginPage.jsx`
  - 회원가입 신청 시 임직원(직원) 구분을 위해 `입사일 (직원의 경우만 기재)` 입력란 추가 및 가입 API 요청에 탑재
- `frontend/src/pages/portal/PortalApprovals.jsx` (신규 파일)
  - 근로기준법 연차 현황판(발생, 사용, 잔여 일수 및 시간), 결재 대시보드(요약 정보), 기안함 탭, 새 기안서 상신 모달(연가 종류별 신청 시간, 지출결의 영수증 입력 등), 결재선 현황 및 승인/반려 의견 처리 기능을 포함하는 프리미엄 UI 설계
- `frontend/src/pages/admin/organization/AdminOrganization.jsx` (신규 파일)
  - 부서 계층 생성, 부서장 임명 및 사원 인사 정보(소속 부서 지정, 직급, 입사일 입력 및 회원 권한 변경)를 실시간 반영할 수 있는 프리미엄 관리 화면 설계
- `frontend/src/App.jsx`
  - `/portal/approvals` 경로와 `/admin/organization` 경로에 신규 컴포넌트 Lazy-loading 적용 및 라우트 연결
- `frontend/src/pages/portal/PortalLayout.jsx`
  - 포털 사이드바 내비게이션 메뉴에 "전자결재 시스템" 메뉴 링크 추가
- `frontend/src/pages/admin/layout/index.jsx`
  - 관리자 사이드바 메뉴 트리(포털 관리 그룹) 내에 "조직도 & 결재 관리" 메뉴 링크 추가

## 검증 절차
- 프론트엔드 빌드 검증 (`cmd.exe /c "npm run build"`) 완료
