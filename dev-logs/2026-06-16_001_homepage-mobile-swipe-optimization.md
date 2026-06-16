# 홈페이지 모바일 UI 최적화 — 변호사 카드 스와이프 캐러셀

날짜: 2026-06-16
요청자: 운영자
배경: 모바일에서 변호사 프로필 카드가 세로로 쌓여 스크롤이 길어지고, 일부 섹션(신뢰 지표)이 4열 그리드 그대로 유지되어 화면이 잘리는 문제

## 변경 파일
- `frontend/src/pages/home/home.css` — 변호사 캐러셀 `.hp-people-carousel` 및 신뢰 섹션 `.hp-trust-grid` 모바일 스타일 추가
- `frontend/src/pages/home/HomePeopleSection.jsx` — 카드 컨테이너를 `.hp-people-carousel-wrap` + `.hp-people-carousel` 구조로 변경, 인라인 padding 수평값 제거
- `frontend/src/pages/home/HomeTrustSection.jsx` — 4열 그리드를 모바일에서 2열로 변경하기 위해 `.hp-trust-grid` 클래스 적용, 인라인 padding 수평값 수정

## 핵심 변경 사항
- 모바일(≤768px): 변호사 카드가 `overflow-x: auto` + `scroll-snap-type: x mandatory`로 좌우 스와이프 가능
- 오른쪽 페이드 그라데이션으로 더 많은 카드가 있음을 시각적으로 암시
- 신뢰 지표 섹션: 모바일(≤640px)에서 4열 → 2열 전환, 수평 padding 20px로 축소
- 각 섹션의 인라인 `padding: "60~72px 48px"`에서 수평값만 제거해 CSS 반응형이 동작하도록 수정

## 검증 절차
- 빌드 후 서버 배포
- 모바일 뷰포트(375px, 390px) 기준으로 확인

## 향후 개선
- 스와이프 위치를 나타내는 점(dots) 인디케이터 추가 가능
- 자동 스크롤(autoplay) 캐러셀 옵션
