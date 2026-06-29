# 홈페이지 통합 관리 탭 추가 (Highlaw Main + 군사센터)

날짜: 2026-06-27
요청자: 운영자
배경: /admin의 홈페이지 섹션에서 Highlaw Main과 군사센터를 한 페이지에서 탭으로 전환하며 편집할 수 있도록 통합 뷰 요청

## 변경 파일
- `frontend/src/pages/admin/homepage/index.jsx` — 신규 생성. 두 사이트 관리자를 상위 탭으로 묶는 래퍼 컴포넌트
- `frontend/src/App.jsx` — /admin/homepage 라우트 추가
- `frontend/src/pages/admin/layout/index.jsx` — 사이드바 홈페이지 그룹을 /admin/homepage 단일 링크로 수정

## 검증 절차
1. /admin/homepage 접속 → 상단에 "Highlaw Main" / "군사센터" 탭 표시 확인
2. "Highlaw Main" 탭 → 기존 site-manager 탭들(홈페이지, 히어로 영상, 소개 등) 정상 작동 확인
3. "군사센터" 탭 → 기존 military-site-manager 탭들 정상 작동 확인
4. 기존 /admin/site-manager, /admin/military-site-manager URL 직접 접속 → 그대로 동작 확인
5. 사이드바 홈페이지 메뉴 클릭 → /admin/homepage로 이동 확인

## 향후 개선
- 사이트 전환 상태를 URL param(예: ?site=main)으로 관리하면 북마크 가능해짐
  (현재는 useState로 관리 → 새로고침 시 기본값 "main"으로 리셋)
