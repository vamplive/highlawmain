# /qna → /inquiry 전면 변경 완성 (관리자 URL, API, nginx 301)

날짜: 2026-06-03
요청자: 운영자
배경: 이전 작업(_003)에서 공개 URL만 변경했고, 관리자 URL·API·nginx SEO 리다이렉트 추가 요청

## 변경 파일

### 관리자 URL (/admin/qna → /admin/inquiry)
- `frontend/src/App.jsx`
  - 관리자 라우트 `path="inquiry"` 로 변경 (AdminQna 컴포넌트 유지)
  - 구버전 `path="qna"` → `/admin/inquiry` 리다이렉트 추가
- `frontend/src/pages/admin/layout/index.jsx`
  - 사이드바 nav 링크 `/admin/qna` → `/admin/inquiry`

### API (/api/qna → /api/inquiry)
- `backend/index.js`
  - LARGE_BODY_PATHS: `"/api/qna"` → `"/api/inquiry"`
  - 라우트 등록: `app.use("/api/qna", ...)` → `app.use("/api/inquiry", ...)`
  - (내부 구현 파일 `routes/qna.js`는 이름 유지)
- `frontend/src/pages/home/HomeHero.jsx` — `/qna/questions` → `/inquiry/questions`
- `frontend/src/pages/qna/QnaHubPage.jsx` — API 호출 3곳 수정
- `frontend/src/pages/qna/QnaDetailPage.jsx` — API 호출 3곳 수정 + 파일 상단 주석
- `frontend/src/pages/qna/QnaAskPage.jsx` — API 호출 2곳 수정
- `frontend/src/pages/admin/qna/index.jsx` — API 호출 5곳 수정

### Nginx 301 서버사이드 리다이렉트 (SEO 점수 100% 보전)
- `deploy/nginx-snippets/highlaw-redirects.conf` 신규 생성
  - `location ~ ^/qna(/|$)` → `rewrite ^/qna/?(.*)$ /inquiry/$1 permanent`
- `.github/workflows/deploy.yml`
  - "Configure nginx URL redirects" 스텝 추가 (멱등, 배포마다 실행)
  - scp로 스니펫 파일 전송 → sudo cp → `location / {` 앞에 include 삽입
  - `sudo nginx -t && sudo systemctl reload nginx` 으로 검증 후 반영

## 검증 절차
- `/admin/inquiry` 접근 시 관리자 Q&A 페이지 렌더 ✓
- `/admin/qna` 접근 시 → `/admin/inquiry` 리다이렉트 ✓
- `/api/inquiry/questions`, `/api/inquiry/categories` API 정상 응답
- 다음 main 배포 시 nginx에 301 리다이렉트 자동 적용

## 변경하지 않은 것
- `routes/qna.js` 파일명 — 내부 구현 파일, 변경 불필요
- 프론트엔드 `pages/qna/` 폴더명 — 변경 불필요

## SEO 보전 전략 (전체 요약)
1. 클라이언트 리다이렉트 (React Navigate, 이전 작업) — 브라우저 사용자 대응
2. nginx 301 서버사이드 리다이렉트 (이번 작업) — 검색엔진 크롤러 대응
3. 사이트맵 /inquiry/* URL (이전 작업) — 크롤러에 새 URL 명시
→ Google Search Console에서 기존 /qna 크롤링 커버리지가 /inquiry로 이전됨을 확인하면 완성
