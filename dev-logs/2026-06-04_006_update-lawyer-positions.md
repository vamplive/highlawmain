# 변호사 및 직원 직급 옵션 변경 및 기본값 수정

날짜: 2026-06-04
요청자: 운영자
배경: 변호사 및 직원 등록/수정 시 선택할 수 있는 직급 옵션을 대표변호사, 변호사, 전문위원, 직원으로 간소화하고 이에 맞춰 기본값 및 DB 스키마 구조를 변경하기 위함.

## 변경 파일
- `frontend/src/pages/admin/lawyers/index.jsx`
  - 직급 선택 항목 `POSITIONS`를 `["대표변호사", "변호사", "전문위원", "직원"]`으로 변경.
  - 기본 직급 필드 및 빈 폼 설정의 position 기본값을 `"어소시에이트"`에서 `"변호사"`로 변경.
- `frontend/src/pages/portal/PortalProfile.jsx`
  - 마이페이지 내 프로필 편집 영역의 `POSITION_OPTIONS`를 `["대표변호사", "변호사", "전문위원", "직원"]`으로 변경.
  - 기본값 매핑 및 빈 폼 설정의 position 기본값을 `"어소시에이트"`에서 `"변호사"`로 변경.
- `backend/db/schema.js`
  - `LAWYER_POSITIONS` 상수를 `["대표변호사", "변호사", "전문위원", "직원"]`으로 변경.
  - `lawyers` 테이블의 `position` 컬럼 default 값을 `"어소시에이트"`에서 `"변호사"`로 변경.
- `backend/db/init-schema.js`
  - `lawyers` 테이블 DDL 정의 시 `position` 컬럼의 `DEFAULT` 제약 조건을 `'어소시에이트'`에서 `'변호사'`로 변경.
- `backend/services/portal-service.js`
  - 변호사 프로필 신규 생성 시 전달된 직급이 없을 경우 기본 백필되는 값을 `"어소시에이트"`에서 `"변호사"`로 변경.
- `backend/routes/lawyers.js`
  - 변호사 등록 API(`POST /api/lawyers`) 호출 시 직급 기본값을 `"어소시에이트"`에서 `"변호사"`로 변경.
- `backend/seeds/seed-lawyers.js`
  - 기존 변호사 시드 데이터의 `"파트너변호사"` 직급을 `"변호사"`로 변경.

## 검증 절차
- 로컬 `npm run build` 성공 확인
- Git push 및 서버 자동 배포를 통한 확인 예정
