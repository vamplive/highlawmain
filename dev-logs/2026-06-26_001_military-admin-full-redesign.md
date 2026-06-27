# 군형사센터 관리 페이지 전면 재설계 (6탭 + 서브탭 + 섹션 편집)

날짜: 2026-06-26
요청자: 운영자
배경: 기존 /admin/military-site-manager는 홈 페이지만 4탭으로 관리하던 수준이었음. 군사센터 하위 페이지(about, partners, practices, info, consultation) 전체를 관리할 수 있도록 6탭 구조로 전면 재설계 요청.

## 요구사항
1. 6개 메인 탭: 군사센터 홈, 하이로 군사센터, 구성원, 업무분야, 하이로 소식, 상담문의
2. 각 탭에서 해당 정적 HTML 페이지의 모든 것 (이미지, 문구, 순서) 관리 가능
3. 하위 탭 구성:
   - 하이로 군사센터: 인사말, 핵심가치, 오시는 길, 공익활동, 연혁
   - 업무분야: 군징계, 군형사, 행정, 민사
   - 하이로 소식: 하이로 뉴스, 군법 가이드
   - 상담문의: 상담신청, 진행절차, FAQ
4. 구성원 탭: /admin/site-manager?tab=members 연동 안내

## 변경 파일

### 백엔드
- `backend/routes/military.js` — 전면 재작성
  - GET/PUT `/:page/html` — 페이지 전체 HTML 읽기/쓰기 (6개 페이지)
  - GET `/:page/sections` — 섹션 목록 반환
  - GET/PUT `/:page/section/:id` — 특정 섹션 HTML 읽기/쓰기
  - 홈 페이지: 코멘트 마커(`<!-- ═...═ -->`) 기반 섹션 분리
  - 서브 페이지: `<section id="...">` 기반 섹션 추출/교체
  - 기존 `/home/content`, `/content`, `/html` 경로 하위 호환 유지

### 프론트엔드
- `frontend/src/pages/admin/military-site-manager/index.jsx` — 전면 재작성
  - 6개 메인 탭 라우팅
  - Toast 알림 컴포넌트
  - MembersTab: site-manager 링크 안내 UI

- `frontend/src/pages/admin/military-site-manager/SectionHtmlEditor.jsx` — 신규
  - 특정 페이지의 특정 섹션 HTML 불러와 편집·저장하는 범용 컴포넌트
  - props: page, sectionId, onSaveSuccess

- `frontend/src/pages/admin/military-site-manager/HomeSectionsTab.jsx` — 신규
  - 군사센터 홈 탭 전용: 구조화 편집(SEO·위기카드·연락처) + 섹션별 HTML 편집
  - 섹션 목록 좌측 패널 + 우측 SectionHtmlEditor 2패널 레이아웃

- `frontend/src/pages/admin/military-site-manager/SubPageTab.jsx` — 신규
  - 서브 페이지 범용 탭: 하위 탭 바 + SectionHtmlEditor + HTML 전체 편집 탭

## 검증 절차
1. `npm run build` — 빌드 성공 ✓
2. SCP 업로드 — backend/routes/military.js, dist/index.html, dist/assets/ ✓
3. pm2 restart → status online ✓
4. `curl localhost:5001/api/military/home/sections` → 401 (인증 필요) 정상 확인 ✓

## 향후 개선
- 섹션 순서 변경 (드래그앤드롭) 기능 추가 시 backend replaceHomeSection 로직 확장 필요
- 이미지 업로드 UI (현재는 HTML 직접 편집으로만 가능)
- partners 페이지에 section id가 없는 경우 대비 — 전체 HTML 편집만 지원
