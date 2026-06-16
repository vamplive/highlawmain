# 히어로 헤더 겹침 확정 수정 + 포털 스카이블루 테마 전환

날짜: 2026-06-16
요청자: 운영자
배경:
1. 이전 padding-top:108px 방식이 flex items-center와 조합 시 일부 페이지에서 여전히 겹침 발생 → align-items: flex-start 방식으로 교체.
2. 포털 UI가 보라색 계열이라 눈에 피로감 → 스카이블루(#0ea5e9) 팔레트로 전체 교체.

## 변경 파일

- `frontend/src/index.css`
  - `.public-hero, .practice-hero` 모바일 룰 변경: `align-items: flex-start !important; padding-top: 120px`
  - flex row 방향에서 align-items:flex-start = 콘텐츠가 항상 padding-top 위치(120px)에서 시작
  - Tailwind items-center 클래스를 !important로 오버라이드
  - 모든 public hero 페이지(about, lawyers, blog, recruit, practice, consultation 등) 동일 간격 적용

- `frontend/src/pages/portal/portalStyles.js`
  - `T.accent`: `#6366f1` → `#0ea5e9` (sky-500)
  - `T.accentHover`: `#4f46e5` → `#0284c7` (sky-600)
  - pageHeaderStyle 그라디언트: `#4f46e5→#7c3aed` → `#0ea5e9→#0284c7`
  - primaryBtnStyle 그라디언트: 동일 교체

- `frontend/src/pages/portal/PortalLayout.jsx`
  - THEME.sidebarBg: 보라-인디고 → 딥 네이비블루 그라디언트 (`#0c2340→#0f3460→#0a4a80`)
  - THEME.accent/accentLight/accentText/accentDim: indigo → sky 계열
  - THEME.pageBg: `#f5f6ff`(연보라) → `#f0f9ff`(sky-50)
  - THEME.topbarAccent: `#6366f1` → `#0ea5e9`
  - 검색창 포커스 색상: indigo → sky
  - AVATAR_COLORS 첫 번째 항목: `#7c3aed` → `#0ea5e9`

- `frontend/src/pages/portal/PortalMessenger.jsx`
  - COLORS.accent/msgBubbleSelf: `#7c3aed` → `#0ea5e9`
  - COLORS.accentLight: `#f5f3ff` → `#f0f9ff`
  - Avatar 기본 color: `#7c3aed` → `#0ea5e9`
  - AVATAR_COLORS 교체
  - 그룹 아이콘 배경 `#e0e7ff` → `#e0f2fe`, 아이콘 색 `#4f46e5` → `#0284c7`
  - 파일 드롭존 dashed border/icon/text 색 교체

- `frontend/src/pages/portal/PortalBoard.jsx`
  - FileText 아이콘/버튼 `#8b5cf6` → `#0ea5e9`, hover `#7c3aed` → `#0284c7`

- `frontend/src/pages/portal/PortalBoardWriter.jsx`
  - 저장 버튼: saving `#a78bfa` → `#38bdf8`, 기본 `#8b5cf6` → `#0ea5e9`

- `frontend/src/pages/portal/PortalCalendar.jsx`
  - 모든 `#8b5cf6`, `#6366f1` → `#0ea5e9`
  - 색상 팔레트 레이블 "인디고"→"스카이", "퍼플"→"시안"

- `frontend/src/pages/portal/PortalBookings.jsx`
  - colors 배열에서 `#6366f1`, `#8b5cf6` → sky 계열로 교체

- `frontend/src/pages/portal/PortalAiSettings.jsx`
  - `#7c3aed` → `#0ea5e9`, `#e9d5ff` → `#bae6fd`, `#faf5ff` → `#f0f9ff`

## 검증 절차
- 모바일(375×667)에서 `/practice`, `/consultation`, `/about`, `/recruit` 접속 → 타이틀이 헤더와 겹치지 않고 동일한 상단 간격(120px)으로 표시되는지 확인
- `/portal/dashboard`, `/portal/messenger`, `/portal/calendar` 접속 → 보라색 없이 스카이블루/네이비 테마로 표시되는지 확인

## 향후 개선
- 포털 색상 토큰을 CSS 변수로 통일하면 향후 테마 변경이 훨씬 간편해짐
