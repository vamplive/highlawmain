# 군사센터 어드민 신설 / RISK 03 수정 / PracticePage 카드 업데이트

날짜: 2026-06-25
요청자: 운영자
배경: ①군사 페이지 INTEL 03 레이블 오류 수정, ②업무분야 '군형사' 카드를 군사센터 링크로 변경, ③관리자 홈페이지 메뉴 재구성 + 군형사센터 전용 관리 페이지 신설

## 변경 파일

### 1. INTEL 03 → RISK 03
- `frontend/public/military/index.html` 라인 1724 — INTEL 03 → RISK 03
- 서버 `frontend/dist/military/index.html` SCP 배포 완료

### 2. PracticePage 업무분야 카드
- `frontend/src/pages/practice/PracticePage.jsx` 라인 140, 144
  - `to: "/practice/military-criminal"` → `to: "/military"`
  - `title: "군형사"` → `title: "군사센터"`

### 3. 관리자 사이드바 재구성
- `frontend/src/pages/admin/layout/index.jsx`
  - "홈페이지" 그룹: Main Page (`/admin/site-manager`) + 군형사센터 (`/admin/military-site-manager`) 두 항목으로 단순화
  - 기존 챗봇/후기/강의/미디어/자료실/에디터를 "콘텐츠" 그룹으로 분리

### 4. 군형사센터 관리 페이지 (신설)
- `frontend/src/pages/admin/military-site-manager/index.jsx` — 신규
  - 탭: 기본 정보(SEO), 위기 카드(RISK 01/02/03), 연락처, HTML 직접 편집
- `frontend/src/App.jsx` — lazy import + `/admin/military-site-manager` 라우트 추가

### 5. 백엔드 군사 페이지 API (신설)
- `backend/routes/military.js` — 신규
  - GET/PUT `/api/military/content` — 구조화 콘텐츠 (메타, 리스크 카드, 연락처)
  - GET/PUT `/api/military/html` — 전체 HTML 원문
  - NODE_ENV=production 시 dist/military/index.html 대상
- `backend/index.js` — `/api/military` 라우트 등록, `/api/military` large body 경로 추가

## 검증 절차
1. `npm run build` — 빌드 성공 확인
2. SCP 업로드 (military HTML, assets, index.html, backend 파일)
3. pm2 restart → 서버 online 확인
4. 서버에서 `grep 'RISK 03' dist/military/index.html` — 확인 ✓

## 향후 개선
- 군사 관리 페이지에서 변호사 프로필, 히어로 타이틀 등 추가 섹션 편집 지원 확장 가능
- MILITARY_HTML_PATH 환경변수 명시 설정으로 경로 확인 가능
