# 포털 페이지 전반 모바일 최적화

날짜: 2026-06-07
요청자: 운영자
배경: "포털도 모바일 최적화를 해 줘" — 의뢰인·임직원이 휴대폰으로 포털(대시보드, 캘린더, 게시판, 사건 관리 등)에
접속했을 때 다단 그리드와 고정폭 표가 화면 밖으로 밀려나거나 입력 필드가 짤리는 문제를 정리.

## 적용 패턴
- 공용 훅 `frontend/src/hooks/useMediaQuery.js`(`useMediaQuery(query)`)를 각 페이지에서 호출해
  `isMobile` 플래그를 만들고, `gridTemplateColumns`를 `isMobile ? "1fr" : "<원래 컬럼>"` 형태로 분기.
- 폭이 넓은 `<table>`은 `<div style={{ overflowX: "auto" }}>`로 감싸고 `minWidth`를 줘서
  좁은 화면에서도 가로 스크롤로 데이터를 확인할 수 있게 함 (찌그러뜨리지 않음).
- 가로로 늘어선 정보 행(메타 정보, 필터바 등)에는 `flexWrap: "wrap"` + `gap`을 추가해 줄바꿈 허용.
- 브레이크포인트는 기존 코드 관례를 따라 레이아웃 단위는 768px, 폼 필드 단위는 640px 사용
  (관리자 레이아웃은 899px, PortalLayout/PortalCalendar는 `window.innerWidth < 768` 사용 중이었음).

## 변경 파일
- `PortalTimeTracking.jsx` — 입력/요약 그리드 단일 컬럼화, 항목 리스트 행을 `column` 방향으로 전환
- `PortalCaseDetail.jsx` — 문서 목록 행에 `flexWrap`/`minWidth: 0`/`wordBreak` 적용 (그리드는 기존 `auto-fill`로 충분)
- `PortalApprovals.jsx` — 대시보드/폼/모달의 2열 그리드 4곳을 단일 컬럼으로 분기
- `PortalQna.jsx` — 7열 질문 테이블을 가로 스크롤 컨테이너로 감싸고, 질문 편집 폼 그리드 분기
- `PortalProfile.jsx` — 프로필 정보 그리드 3곳 분기 + 패딩 축소
- `PortalBlog.jsx` — 필터/통계/게시글 테이블/분석 모달 등 다단 레이아웃을 모바일에서 단일·2열로 재배치,
  넓은 표는 가로 스크롤 컨테이너로 감쌈
- `PortalCaseRecords.jsx` — 좌(목록)/우(뷰어) 2패널 그리드를 모바일에서 세로 스택으로 전환,
  좌측 목록에 `maxHeight` 부여(스크롤), 뷰어에 `minHeight` 전달
- `PortalCaseRegister.jsx` — 사건 정보/당사자 입력 그리드 2곳 단일 컬럼화
- `PortalAiSettings.jsx` — 설정 폼 그리드 단일 컬럼화
- `PortalCalendar.jsx`:
  - 월간 뷰 그리드: `gridAutoRows`/일(day) 셀 `minHeight` 90→60(모바일)
  - 주간 뷰 그리드: 컨테이너 `minHeight` 480→360, 일별 칼럼 `minHeight` 450→280(모바일)
  - 기존에 있던 로컬 `isMobile` 상태(`window.innerWidth < 768`)를 그대로 재사용 — 별도 훅 호출 없음
- `PortalBoard.jsx`:
  - 게시글 목록 표를 가로 스크롤 컨테이너로 감싸고 `minWidth: 600` 부여
  - 검색바를 모바일에서 전체 폭으로 전환, 상단 액션바/필터바에 `flexWrap` 추가, 패딩 축소
  - 게시글 상세 모달의 작성자 메타 정보 행에 `flexWrap` 추가

## 변경하지 않은 파일 (이미 모바일 친화적으로 확인)
- `PortalDashboard.jsx`, `PortalLogin.jsx`, `PortalRegister.jsx` — `repeat(auto-fill, minmax(...))` /
  `width: 100%, maxWidth` 패턴으로 이미 반응형
- `PortalContracts.jsx`, `PortalContractSign.jsx`, `PortalReviews.jsx` — 고정폭 그리드/표 없음
- `PortalLayout.jsx` — 이미 `isMobile` 기반 사이드바 접힘/펼침 로직이 광범위하게 구현됨
  (게시판 모드 사이드바도 `width: "100%"`로 반응형)
- `PortalRichTextEditor.jsx` 툴바 — 이미 `flexWrap: "wrap"` 적용되어 좁은 화면에서 자동 줄바꿈

## 검증 절차
- 수정한 모든 파일에 대해 `npx eslint`(로컬 바이너리) 실행 — 신규 오류/경고 없음 확인
  (사전에 존재하던 경고/오류는 `git diff`로 라인 매칭하여 본 작업과 무관함을 확인)
- 브라우저 DevTools 반응형 모드(가로폭 ~360–414px)로 직접 렌더링 확인은 진행하지 못함 —
  백엔드 서버(PID 11064) 재시작이 필요한 상태라 라이브 검증은 운영자가 직접 진행 필요

## 향후 개선
- 캘린더 월간/주간 뷰는 7열 그리드 구조상 모바일에서도 칸이 좁아질 수밖에 없음 — 추후
  "일정 목록(아젠다)" 형태의 별도 모바일 전용 뷰를 고려할 만함
- 가로 스크롤 표(`PortalBoard`, `PortalQna`, `PortalBlog`)는 임시방편이며, 우선순위가 높은 컬럼만
  남기고 나머지는 "더보기" 형태로 접는 카드형 레이아웃으로 전환하면 더 나은 모바일 경험 가능
