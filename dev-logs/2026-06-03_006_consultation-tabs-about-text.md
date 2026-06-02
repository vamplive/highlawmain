# 상담 페이지 탭 구조 개편 + 사무소 소개 텍스트 수정

날짜: 2026-06-03
요청자: 운영자
배경:
1. 사무소 소개 > 오시는 길 탭의 "서울 오피스" → "서울 사무소" 표기 통일
2. 상담 문의 페이지를 3개 탭(상담 신청/진행 절차/FAQ)으로 개편하고 오시는 길·지도 삭제

## 변경 파일
- `frontend/src/pages/public/AboutPage.jsx` — "서울 오피스" 2곳 → "서울 사무소"
- `frontend/src/pages/consultation/index.jsx` — 탭 3개(상담 신청/진행 절차/FAQ) 구조로 완전 재편, ConsultationMap 제거
- `frontend/src/pages/consultation/ConsultationForm.jsx` — compact prop 추가 (탭 내 렌더링 시 section/container 래퍼 생략)
- `frontend/src/pages/consultation/ConsultationSteps.jsx` — compact prop 추가 + LocationSection 함수 및 OFFICE_ADDRESS import 제거
- `frontend/src/pages/consultation/ConsultationFAQ.jsx` — compact prop 추가

## 검증 절차
- /about → 오시는 길 탭 → "서울 사무소" 표시 확인
- /consultation → 탭 3개(상담 신청/진행 절차/FAQ) 표시 확인
- 각 탭 전환 시 페이드인 애니메이션 동작 확인
- 오시는 길/지도 완전 제거 확인

## 향후 개선
- FAQ 항목 내용 추가·수정 필요 시 consultationConstants.js의 FAQ_ITEMS 배열 편집
