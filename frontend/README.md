# 법무법인 하이로 홈페이지

법률사무소 공식 웹사이트 + 의뢰인 포털 + 관리자 백오피스 + MS Word 스타일 문서 에디터를 통합한 풀스택 웹 애플리케이션입니다. 프론트엔드(Vite + React)와 백엔드(Express + SQLite)로 구성됩니다.

> 기술 스택, 디렉토리 구조, 라우트, API 엔드포인트, 코딩 규칙 등 아키텍처 전반은 [`CLAUDE.md`](./CLAUDE.md)를 참조하세요. 이 문서는 신규 개발자 온보딩에 필요한 셋업·운영 정보만 다룹니다.

---

## 사전 요구사항

- **Node.js 18+** (better-sqlite3 빌드용 C++ 툴체인 필요)
- **npm**
- macOS / Linux / Windows 모두 동작 (Windows는 Visual Studio Build Tools 필요할 수 있음)

> macOS 사용자: AirPlay Receiver가 5000 포트를 점유하므로 백엔드는 **5001번 포트**를 사용합니다.

---

## 로컬 개발 환경 셋업

### 1. 클론 + 의존성 설치

```bash
git clone <repo-url> highlaw
cd highlaw

# 백엔드
cd backend && npm install

# 프론트엔드
cd ../frontend && npm install
```

### 2. 환경변수 설정

```bash
cd backend
cp .env.example .env
# 에디터로 .env 열어 필수 값 채우기 (아래 표 참조)
```

프론트엔드 `.env`는 기본값으로 동작하지만, 도메인 변경 시 `frontend/.env`에 `VITE_SITE_URL`을 설정합니다.

### 3. 실행

터미널 두 개에서 각각:

```bash
# 터미널 1 — 백엔드 (포트 5001)
cd backend && node index.js
# 또는: npm start

# 터미널 2 — 프론트엔드 (포트 5173)
cd frontend && npm run dev
```

프론트 dev 서버가 `/api/*`, `/uploads/*`, `/data/*` 요청을 백엔드(localhost:5001)로 프록시합니다. 브라우저에서 http://localhost:5173 접속.

데이터베이스는 최초 실행 시 `${STORAGE_PATH:-backend/data}/db/highlaw.db`에 자동 생성됩니다.

---

## 환경변수

### 백엔드 (`backend/.env`)

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `PORT` | 선택 | `5001` | 서버 포트 |
| `ALLOWED_ORIGINS` | **production 필수** | — | 쉼표 구분 CORS 허용 도메인. 미설정 시 프로덕션 부팅 차단 |
| `CSRF_SECRET` | **production 필수** | 개발 임의값 | 32바이트 이상 hex. 미설정 시 재시작마다 토큰 불일치로 403 발생 |
| `ADMIN_INITIAL_USERNAME` | 선택 | `admin` | 초기 관리자 계정 아이디 |
| `ADMIN_INITIAL_PASSWORD` | **production 필수** | — | 8자 이상. 미설정 시 프로덕션 부팅 차단 |
| `SITE_URL` | 선택 | `https://highlaw.co.kr` | sitemap·JSON-LD 등 절대 URL 기준점 |
| `STORAGE_PATH` | 선택 | `backend/data` | DB·업로드 파일 외부 스토리지 경로 |
| `APPS_SCRIPT_WEBHOOK_URL` | 선택 | — | 상담 알림 Google Apps Script 엔드포인트 |
| `LOG_LEVEL` | 선택 | env별 기본 | pino 로그 레벨 (`debug`/`info`/`warn`/`error`) |

CSRF_SECRET 생성 예시:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 프론트엔드 (`frontend/.env`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_SITE_URL` | `https://highlaw.co.kr` | 페이지별 canonical·og:url 계산. 백엔드 `SITE_URL`과 동일하게 유지 |

---

## 테스트 / 린트 / 빌드

```bash
# 백엔드 — vitest 단위 + supertest 통합
cd backend && npm test
cd backend && npm run lint

# 프론트엔드 — 프로덕션 빌드 (dist/ 생성) + 린트 + 테스트
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm test
```

DB 백업(수동 실행):
```bash
cd backend && npm run backup
```

---

## 배포

운영 배포 절차·자동화 스크립트는 [`deploy/`](./deploy/) 폴더를 참조하세요.

- `deploy/setup-server.sh` — 서버 초기 셋업 스크립트
- `deploy/com.highlaw.db-backup.plist` — macOS launchd DB 백업 스케줄러
- `deploy/ops-README.md` — DB 백업 자동화·운영 작업 상세 가이드

프로덕션에서는 `ALLOWED_ORIGINS`, `CSRF_SECRET`, `ADMIN_INITIAL_PASSWORD`가 반드시 설정되어 있어야 합니다(미설정 시 부팅 차단).

---

## 보안·운영 주의사항

### 인증
- 어드민 세션은 HttpOnly 쿠키(`admin_session`)로 관리. `SameSite=Strict` + `secure`(production) + 24h TTL.
- 토큰은 SHA-256 해싱해 DB에 저장됩니다. DB 유출 시에도 활성 세션을 즉시 탈취할 수 없습니다.
- 세션 스키마 변경이 포함된 배포 직후에는 기존 활성 세션이 모두 무효화됩니다(전 사용자 재로그인 필요).
- Swagger·외부 클라이언트는 로그인 응답의 `token` 값을 `Authorization: Bearer`로 그대로 사용 가능.

### CSRF
- 더블 서브밋 쿠키 패턴 — GET 요청은 서버가 `csrf-token` 쿠키를 설정하고, 상태 변경 요청은 `x-csrf-token` 헤더로 동일 값을 돌려보내야 합니다.
- 프론트엔드는 `frontend/src/utils/api.js`의 `request()`가 자동 처리합니다.

### 로깅·관측
- 모든 응답에 `X-Request-Id` 헤더가 echo되며, 로그에도 동일 `reqId`가 붙습니다. 사용자 문의 시 해당 ID로 로그를 빠르게 조회하세요.
- 로그는 NDJSON 포맷. 수집기(Loki/Datadog 등) 연동 시 그대로 파싱 가능.

### SEO
- sitemap은 `/sitemap.xml` → `/api/sitemap`으로 리다이렉트되며 동적 생성됩니다.
- 도메인 변경 시 `SITE_URL`(백엔드)과 `VITE_SITE_URL`(프론트)을 함께 업데이트하세요.

---

## 더 알아보기

- [`CLAUDE.md`](./CLAUDE.md) — 전체 아키텍처, 기술 스택, 디렉토리 구조, 라우트·API 엔드포인트 목록, 에디터 기능 명세, 코딩 규칙
- [`deploy/ops-README.md`](./deploy/ops-README.md) — 운영 자동화·DB 백업
- [`docs/`](./docs/) — QA 체크리스트
- 백엔드 라우트별 상세는 `backend/routes/*.js` 와 `backend/services/*` 참조
