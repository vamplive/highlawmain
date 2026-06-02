# 공개 URL /qna → /inquiry 변경

날짜: 2026-06-03
요청자: 운영자
배경: highlaw.co.kr/qna 페이지를 highlaw.co.kr/inquiry로 URL 변경 요청

## 변경 파일

### 프론트엔드 라우팅
- `frontend/src/App.jsx`
  - `/inquiry` 신규 라우트 등록 (QnaHubPage, QnaDetailPage, QnaAskPage)
  - `/qna`, `/qna/category/:slug`, `/qna/question/:slug`, `/qna/ask` → 각각 `/inquiry/*` 로 301 리다이렉트
  - `/cases` → `/inquiry` 리다이렉트 (기존 `/qna`에서 대상 변경)
  - `QnaCategoryRedirect`, `QnaQuestionRedirect` 헬퍼 컴포넌트 추가

### 프론트엔드 내부 링크
- `frontend/src/components/Layout.jsx` — `isQna` 경로 감지를 `/inquiry`로 수정
- `frontend/src/pages/home/HomeHero.jsx` — Q&A 질문 링크 `/inquiry/question/...`
- `frontend/src/pages/qna/qnaUtils.js` — `qnaDetailUrl`, `qnaCategoryUrl` 반환 경로 수정
- `frontend/src/pages/qna/QnaHubPage.jsx` — navigate, Link 경로 수정
- `frontend/src/pages/qna/QnaDetailPage.jsx` — navigate, Link 경로 4곳 수정
- `frontend/src/pages/qna/QnaAskPage.jsx` — Link 경로 수정
- `frontend/src/pages/qna/KakaoCallbackPage.jsx` — 로그인 후 리다이렉트 대상 수정

### 백엔드 SEO / 사이트맵
- `backend/index.js` — routeSeo 맵 `/qna` → `/inquiry`, pathname 매처 수정 (구 경로도 함께 처리)
- `backend/routes/sitemap.js` — 정적 경로 + 동적 카테고리/질문 URL `/inquiry/*`

## 변경하지 않은 것
- `/api/qna` 백엔드 API — 내부 API 경로이므로 변경 불필요
- `/admin/qna` 관리자 URL — 관리자 내부 URL, 변경 불필요
- `pages/qna/` 폴더명 — 라우트 URL과 무관, 변경 불필요

## 검증 절차
- /qna 접속 시 /inquiry 리다이렉트 ← App.jsx Navigate
- /qna/category/:slug, /qna/question/:slug, /qna/ask 각각 리다이렉트 ← 동적 헬퍼
- /inquiry, /inquiry/category/:slug, /inquiry/question/:slug, /inquiry/ask 정상 렌더 ← 신규 라우트
- 사이트맵에 /inquiry 경로 출력 확인

## 향후 개선
- Google Search Console에서 기존 /qna/* URL 크롤링 커버리지 모니터링
- 필요시 nginx에서 /qna → /inquiry 서버사이드 301 리다이렉트 추가 (SEO 점수 보존)
