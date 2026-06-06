# 모바일 화면에서 업무분야 및 상담안내 페이지 상단 헤더 겹침 오류 해결

날짜: 2026-06-06
요청자: 운영자
배경: 모바일 기기 및 좁은 뷰포트에서 업무분야(`PracticePage`) 및 상담안내(`ConsultationPage`) 등 공통 히어로(`PublicHero`)를 사용하는 페이지의 상단 타이틀과 브랜드 헤더 로고가 겹쳐서 표시되는 문제가 발생함. 헤더 높이(총 108px)를 고려하여 히어로 섹션에 적절한 패딩을 추가하여 문제를 해결하고자 함.

## 변경 파일
- `frontend/src/index.css`
  - `.public-hero` 기본 스타일에 `padding-top: 108px` (상단 유틸리티 바 30px + 메인 헤더 78px 합산) 및 `padding-bottom: 48px`, `box-sizing: border-box`를 추가하여 콘텐츠가 헤더 영역 아래로 배치되도록 수정.
  - 모바일 미디어 쿼리(`@media (max-width: 768px)`) 내의 `.public-hero` 스타일에도 `padding-top: 108px`, `padding-bottom: 40px`를 동일하게 적용하고, 최소 높이(`min-height`)를 기존 `460px`에서 `480px`로 확대하여 늘어난 패딩 영역으로 인해 세로 콘텐츠가 잘리지 않도록 공간 확보.

## 검증 절차
- CSS 문법 및 구조 검증
- 모바일 뷰포트에서의 여백 및 위치 계산 확인
