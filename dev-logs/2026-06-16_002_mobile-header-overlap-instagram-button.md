# 모바일 헤더 겹침 수정 + 플로팅 메뉴 인스타그램 버튼 교체

날짜: 2026-06-16
요청자: 운영자
배경: 모바일에서 업무분야/상담문의 페이지 히어로 콘텐츠가 고정 헤더(108px) 아래 가려지는 문제 수정.
       텔레그램 버튼을 인스타그램(@highlaw.official)으로 교체 요청.

## 변경 파일

- `frontend/src/index.css`
  - `.public-hero` (모바일 768px 이하) 에 `padding-top: 108px` 추가
  - `.practice-hero` 동일 룰 적용 (PublicHero를 쓰지 않는 업무분야 상세 히어로)
  - 고정 헤더 높이(유틸바 30px + 메인 78px = 108px)만큼 히어로 내부 flex center를 아래로 밀어냄

- `frontend/src/pages/practice/PracticeHero.jsx`
  - `<section>` 에 `className="practice-hero"` 추가 (CSS 타겟팅용)

- `frontend/src/components/FloatingContact.jsx`
  - `TELEGRAM_CONTACT_URL` import 제거
  - `telegramUrl` → `instagramUrl` 변수로 교체 (`contact.instagramUrl` 우선, fallback `LAYOUT_DEFAULTS.contact.instagramUrl`)
  - Item 3 텔레그램 버튼 → 인스타그램 버튼으로 교체 (Instagram SVG 아이콘, `instagramEnabled` 조건부 렌더)

## 검증 절차
- 모바일 뷰포트(375×667)에서 `/practice`, `/practice/military`, `/consultation` 접속 시 히어로 타이틀이 헤더 아래에 표시되는지 확인 필요
- 플로팅 퀵메뉴 Item 3이 인스타그램 아이콘 + "인스타그램" 레이블로 표시되고, 클릭 시 @highlaw.official 인스타그램으로 열리는지 확인 필요

## 향후 개선
- 헤더 높이를 CSS 변수(`--header-height`)로 통일하면 향후 헤더 높이 변경 시 한 곳만 수정하면 됨
