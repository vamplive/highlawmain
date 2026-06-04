# 변호사 소개 페이지를 구성원 페이지로 변경 및 탭별 필터 기능 추가

날짜: 2026-06-04
요청자: 운영자
배경: "변호사 소개" 페이지의 명칭을 "구성원"으로 수정하고 접근 URL 주소를 `/lawyers`에서 `/partners`로 갱신하며, 구성원 페이지 내에 "변호사", "전문위원", "직원" 탭 필터를 추가하여 직급군별로 나누어 조회할 수 있도록 개선하기 위함.

## 변경 파일
- `frontend/src/App.jsx`
  - `/partners` 및 `/partners/:id` 신규 경로를 정의하고 기존 `LawyersPage` 및 `LawyerDetailPage`를 매핑.
  - 기존 경로 북마크 및 링크 유지를 위해 `/lawyers` 호출 시 `/partners`로, `/lawyers/:id` 호출 시 `/partners/:id`로 리다이렉트 처리하는 `NavigateToPartnerDetail` 정의.
- `frontend/src/components/layout/layoutConfig.js`
  - GNB 메뉴 라벨을 `"변호사"`에서 `"구성원"`으로 변경하고 경로를 `/partners`로 갱신.
  - GNB hover 드롭다운 설정을 `/lawyers`에서 `/partners`로 변경.
- `frontend/src/pages/admin/site-manager/constants.js`
  - SEO 설정 대상 페이지 및 기본 GNB 설정 목록에서 `/lawyers`를 `/partners`로 변경하고 명칭을 `"구성원"`으로 갱신.
- `backend/scripts/update_db_nav.js`
  - 데이터베이스 GNB 메뉴 동기화 스크립트 내 초기 데이터의 `/lawyers` 경로 및 라벨을 `/partners` 및 `"구성원"`으로 갱신.
- `frontend/src/pages/public/NotFoundPage.jsx`
  - 404 페이지 하단 연관 링크 중 변호사 소개 링크를 `/partners` 및 `"구성원"`으로 변경.
- `frontend/src/components/Layout.jsx`
  - 헤더 스타일 투명도 처리용 경로 검사 로직(`isLawyers`, `isLawyerDetail`)을 `/partners` 경로 기준으로 수정.
- `frontend/src/pages/lawyers/LawyersPage.jsx`
  - SEO 메타, PublicHero 제목 및 헤더를 `"구성원"`으로 갱신.
  - 상단 탭 컨트롤("변호사", "전문위원", "직원")을 배치하고 `activeTab` 상태에 따라 로딩된 구성원을 로컬 필터링하여 렌더링하도록 수정.
  - 리스 배열 변경 시 reveal 애니메이션이 재동작되도록 `useRevealOnChange` 훅의 의존성을 필터링된 배열(`filteredLawyers`)로 변경.
- `frontend/src/pages/lawyers/LawyerDetailPage.jsx`
  - 캐노니컬 URL 경로, 브레드크럼 및 목록 이동 버튼 링크를 `/partners`로 갱신.
- `frontend/src/pages/lawyers/LectureDetailPage.jsx`
  - 강사 프로필 및 뒤로가기/브레드크럼 링크를 `/partners`, `"구성원"`으로 변경.
- `frontend/src/pages/home/HomePeopleSection.jsx`
  - 메인화면 하단 구성원 섹션 내 전체보기 버튼 및 카드 클릭 이동 주소를 `/partners`로 변경.
- `frontend/src/pages/home/HomeHero.jsx`
  - 실시간 통합 검색 결과 패널의 변호사 매칭 링크를 `/partners`로 변경.

## 검증 절차
- 로컬 `npm run build` 성공 확인
- Git push 및 서버 자동 배포를 통한 확인 예정
