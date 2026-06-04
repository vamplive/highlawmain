# 프로젝트: 법무법인 하이로 홈페이지

## 프로젝트 개요
법무법인 하이로(HIGH & LAW FIRM) 공식 홈페이지. 불법파견·게임사기·노동·군사건 4개 특화 분야 안내,
변호사 프로필, 상담 신청, 관리자용 문서 에디터 및 콘텐츠 관리 기능을 포함한 풀스택 웹 애플리케이션.
프론트엔드(Vite + React)와 백엔드(Express + SQLite)로 구성.

## 기술 스택

### 프론트엔드 (`frontend/`)
- **빌드**: Vite 6 + React 19
- **에디터**: TipTap v3 (ProseMirror 기반) + 커스텀 확장
- **스타일링**: Tailwind CSS v4 + 인라인 스타일
- **라우팅**: React Router v7
- **아이콘**: Lucide React + 유니코드/이모지
- **파일 처리**: docx (Word 생성), mammoth (Word 파싱), jsPDF + html2canvas (PDF)
- **기타**: marked (마크다운), react-leaflet (지도), file-saver

### 백엔드 (`backend/`)
- **서버**: Express 5
- **데이터베이스**: SQLite (better-sqlite3) + Drizzle ORM
- **검색**: FTS5 전문 검색 (한국어 unicode61 토크나이저)
- **파일 업로드**: Multer (메모리 스토리지, 50MB 제한)
- **PDF 파싱**: pdf-parse

## 디렉토리 구조
모든 페이지는 도메인 폴더로 묶여 있고, 각 도메인의 메인 페이지는 `index.jsx`다.
지원 컴포넌트는 같은 폴더 내에서 PascalCase 파일명으로 구분한다.

**로컬 개발 경로**: `C:\Dev\highlaw\` (OneDrive 외부 — 동기화 문제 없음)
**GitHub**: `https://github.com/vamplive/highlawmain`

```
highlaw/                           ← git 루트 / 로컬: C:\Dev\highlaw\
├── CLAUDE.md
├── README.md
├── .gitignore
├── backend/                       # Express 백엔드 (포트 5001)
│   ├── package.json
│   ├── index.js                   # 서버 진입점
│   ├── db/                        # schema.js, init-schema.js, fts.js
│   ├── lib/                       # auth, csrf, email, sms, logger 등
│   ├── routes/                    # API 라우트 (/api/*)
│   ├── services/                  # 도메인 비즈니스 로직
│   ├── tests/                     # vitest 통합·서비스 테스트
│   ├── scripts/                   # 백업, 마이그레이션 스크립트
│   └── seeds/                     # 수동 실행 시드 스크립트
├── frontend/                      # Vite + React 프론트엔드 (포트 5173)
│   ├── package.json
│   ├── vite.config.js             # dev proxy: /api → localhost:5001 (VITE_API_TARGET)
│   ├── index.html
│   ├── public/                    # 정적 자산 (이미지, 비디오, 파비콘 등)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # 라우터 (공개/에디터/관리자/포털)
│       ├── index.css              # Tailwind + 디자인 토큰
│       ├── assets/                # 임포트되는 이미지·로고
│       ├── components/            # 공용 컴포넌트
│       │   ├── Layout.jsx         # 공개 레이아웃
│       │   ├── layout/            # Header, Footer, MobileMenu
│       │   ├── auth/, signature/, lawyer-profile/, ui/, admin/
│       ├── hooks/                 # useCrudForm, useReveal, useSiteSettings 등
│       ├── lib/                   # seo, sentry, a11yDevChecker
│       ├── utils/                 # api 래퍼, formatters, contract-pdf 등
│       └── pages/                 # 페이지 — 도메인별 폴더, 메인 페이지는 index.jsx
│           ├── home/              # / 메인
│           ├── public/            # /about, /privacy, /terms, /reviews, /login
│           ├── lawyers/           # /lawyers, /lawyers/:id, /lectures/:id
│           ├── practice/          # /practice, /practice/:field
│           ├── consultation/      # /consultation
│           ├── blog/              # /blog, /blog/:slug
│           ├── qna/               # /qna, /qna/category/:slug, /qna/question/:slug
│           ├── recruit/           # /recruit
│           ├── editor/            # MS Word 스타일 에디터
│           ├── portal/            # /login, /portal/dashboard, /portal/time-tracking 등
│           └── admin/             # /admin/* 관리자 영역
│               ├── layout/        # 사이드바 레이아웃
│               ├── auth/          # Login.jsx
│               ├── portal-users/  # 포털 회원 승인 관리
│               └── [domain]/      # cases, clients, bookings, contracts, …
├── deploy/                        # Nginx 설정, 배포 스크립트
├── docs/                          # QA 체크리스트 등
└── dev-logs/                      # 개발일지 (gitignore됨, 로컬 전용)
```

## 라우트 구조
```
공개 페이지
/                          → HomePage
/about, /privacy, /terms   → 회사·정책 페이지
/practice                  → 업무 분야 허브
/practice/illegal-dispatch → 불법파견 상세
/practice/game-fraud       → 게임사기 상세
/practice/labor            → 노동 상세
/practice/military         → 군사건 상세
/lawyers, /lawyers/:id     → 변호사 목록·상세
/lectures/:id              → 강의 상세
/blog, /blog/:slug         → 블로그 목록·상세
/qna                       → 법률 Q&A 허브
/qna/category/:slug        → 카테고리별 Q&A
/qna/question/:slug        → Q&A 상세
/qna/ask                   → Q&A 등록
/reviews                   → 후기 목록
/consultation              → 상담 신청
/unsubscribe               → 마케팅 수신거부
/cases                     → /qna 로 리다이렉트

포털 로그인
/login                     → 통합 로그인/회원가입 페이지 (스플릿 스크린)

포털 (/portal) — 로그인 후 접근, 포털 세션 쿠키 인증
/portal/dashboard          → 사건 목록 + 구글 캘린더 연동
/portal/cases/register     → 사건 등록 (사건번호로 법원 정보 유추)
/portal/cases/:id          → 사건 상세 (문서 + 메시지)
/portal/cases/:id/records  → 사건 기록
/portal/time-tracking      → 타임트래킹 (타이머 + 수동 + 사건별 취합)
/portal/contracts          → 내 계약서 목록
/portal/contracts/:id      → 계약서 서명

초대·서명 링크
/invite/:token             → 초대 진입
/invite/:token/consultation→ 초대 상담 작성
/sign/:token               → 외부 서명자 페이지

에디터 (관리자 인증 필요)
/editor                    → /admin/editor 로 리다이렉트
/editor/:id                → /admin/editor/:id 로 리다이렉트

관리자 (/admin/*) — 쿠키 인증 필수, 도메인별 페이지 폴더 매핑
/admin                     → 대시보드
/admin/analytics           → 페이지뷰 분석
/admin/bookings            → 예약 관리
/admin/clients[/:id]       → 고객·상세
/admin/cases               → 사건 관리
/admin/contracts           → 계약서 목록
/admin/contracts/new-settlement → 합의서 신규
/admin/contracts/:id       → 계약서 상세
/admin/contract-templates  → 계약서 양식
/admin/messages            → SMS·이메일 발송
/admin/site-manager        → 홈페이지 콘텐츠
/admin/media               → 미디어 라이브러리
/admin/lawyers, /admin/lectures
/admin/reviews, /admin/qna
/admin/invitations         → 발송 링크
/admin/documents           → 자료 관리
/admin/settings            → 환경 설정
/admin/editor[/:id]        → Word 스타일 에디터
```

## API 엔드포인트 (백엔드)
모든 API는 `/api/` 접두사. 응답 형식: `{ data, error, meta }`.
세부 라우트는 `backend/routes/*.js` 참고. 주요 도메인:

- `/api/documents`, `/api/blog`, `/api/lawyers`, `/api/lectures`
- `/api/cases`, `/api/clients`, `/api/contracts`, `/api/contract-templates`
- `/api/bookings`, `/api/consultations`, `/api/messages`, `/api/triggers`
- `/api/qna`, `/api/reviews`, `/api/announcements`, `/api/newsletter`
- `/api/site-settings`, `/api/hero-videos`, `/api/media`
- `/api/dashboard`, `/api/analytics`, `/api/dev-logs`
- `/api/invoices`, `/api/invitations`, `/api/privacy-consents`
- `/api/portal/*`           — 의뢰인 포털 (별도 세션 쿠키)
- `/api/public/invite/*`    — 토큰 기반 초대 진입
- `/api/public/sign/*`      — 토큰 기반 외부 서명
- `/api/admin-users`        — 관리자 계정·로그인
- `/api/sitemap`, `/api/docs`, `/api/chatbot`

## Word 에디터 기능 (EditorPage)

### 리본 메뉴 (8개 탭)
- **파일**: 백스테이지 뷰 (새로만들기, 열기, 저장, 내보내기, 인쇄, 정보)
- **홈**: 클립보드, 글꼴(12종, 16단계 크기), 단락(목록, 정렬, 줄간격, 들여쓰기), 스타일 갤러리(10종)
- **삽입**: 표 격자 선택(8x10), 이미지(URL/파일), 링크, 특수문자(7개 카테고리)
- **디자인**: 문서 테마, 배경색, 워터마크
- **레이아웃**: 여백 프리셋(4종), 방향, 용지 크기(4종), 단 나누기(1~3단)
- **참조**: 목차 생성, 각주/미주
- **검토**: 댓글 삽입/보기, 변경 추적 토글
- **보기**: 눈금자, 탐색 창, 확대/축소(25~500%)

### 에디터 코어
- A4 용지 레이아웃 (회색 배경 위 흰 용지, 여백 마커, 눈금자)
- TipTap 커스텀 확장: FontSize, LineSpacing, Indent, ParagraphSpacing
- 플로팅 툴바 (텍스트 선택 시 서식 도구)
- 댓글 시스템 (텍스트 마킹, 스레드, 해결)
- 각주 시스템 (인라인 참조 + 하단 영역)
- 자동 저장 (localStorage + 서버)

### 단축키 (Word 호환)
Ctrl+B/I/U (굵게/기울임/밑줄), Ctrl+Z/Y (실행취소/다시실행),
Ctrl+S (저장), Ctrl+F/H (찾기/바꾸기), Ctrl+K (링크),
Ctrl+D (글꼴 대화상자), Ctrl+P (인쇄), Tab/Shift+Tab (들여쓰기)

### 파일 I/O
- .docx 내보내기/불러오기
- .pdf 내보내기 (jsPDF + html2canvas)
- .html 내보내기
- 자동 저장 (localStorage 키: "word-editor-autosave")

## 데이터베이스 스키마 (SQLite)
12개 테이블: documents, tags, document_tags, categories, document_categories,
collections, document_collections, document_relations, highlights,
history_events, documents_fts (FTS5 가상 테이블) + FTS 동기화 트리거

## 개발 실행
> 사람 개발자용 셋업 가이드(환경변수, 테스트, 배포 포함)는 `README.md` 참조. 아래는 AI/빠른 참조용.

**로컬 개발 경로**: `C:\Dev\highlaw\` (OneDrive 외부)

```cmd
# 백엔드 (포트 5001)
cd C:\Dev\highlaw\backend
npm install
node index.js

# 프론트엔드 (포트 5173, /api → localhost:5001 프록시)
cd C:\Dev\highlaw\frontend
npm install
npm run dev
```

**한 번에 시작**: `C:\Dev\highlaw\start-dev.cmd` 실행

## 개발일지 (필수 규칙) ⚠️

모든 의미 있는 작업은 **반드시** `dev-logs/` 디렉토리에 기록한다. 예외 없음.

### 파일명 컨벤션
`YYYY-MM-DD_NNN_slug.md`
- `NNN`은 같은 날짜 내 작업 순번 (001부터)
- 예: `2026-05-01_002_위임계약서-변수화.md`

### 형식
```markdown
# 한 줄 제목 (관리자 화면에서 첫 줄 추출됨)

날짜: YYYY-MM-DD
요청자: 운영자 / 개발자 / (이름)
배경: 왜 이 작업을 했는지

## 변경 파일
- 파일 경로 — 무엇을 어떻게 바꿨는지

## 검증 절차
실제로 동작 확인한 단계

## 향후 개선
남은 TODO / 후속 과제
```

### 기록 시점
- 사용자(운영자)가 새 기능·수정·이슈를 요청 → 작업 시작 전 entry 생성, 끝나면 보강
- 외부 의존성 추가, DB 스키마 변경, 보안에 영향이 있는 변경은 반드시 기록
- 단순 문구 변경, 색상 조정 등 trivia는 묶어서 한 entry로 일괄 기록 가능

### Claude Code (AI 개발 에이전트) 규칙
- 작업을 시작할 때 항상 `dev-logs/`에 entry를 만든다
- 다중 단계 작업은 작업 도중에도 entry를 보강하며 진행
- 작업 완료 후에는 "검증 절차"와 "향후 개선" 섹션을 채워 commit/저장

## 코딩 규칙
- JavaScript (JSX) — TypeScript 미사용
- 함수형 컴포넌트 + React hooks
- 주석은 한국어로 작성
- API 응답은 항상 `{ data, error, meta }` 형식
- 프론트엔드 API 호출은 `utils/api.js` 래퍼 사용 권장
- 에디터 관련 로직은 `pages/editor/modules/` 내 모듈로 분리
- 기본 글꼴: 맑은 고딕 11pt

# 코드 작성 원칙

## 가독성 & 유지보수성 우선
- 모든 코드는 경력 3년차 주니어 개발자가 읽고 수정할 수 있어야 한다.
- "영리한(clever)" 코드보다 "명백한(obvious)" 코드를 작성한다.
- 하나의 함수는 하나의 일만 한다. 함수 길이는 30줄 이내를 목표로 한다.

## 네이밍
- 변수명, 함수명, 컴포넌트명은 역할이 즉시 드러나는 서술적 이름을 사용한다.
  - Bad: `d`, `tmp`, `handleIt`, `processData`
  - Good: `userLoginDate`, `filteredCaseList`, `handleFormSubmit`
- 한 프로젝트 안에서 네이밍 컨벤션을 통일한다 (camelCase / PascalCase 등).

## 파일 구조
- 하나의 파일에 하나의 관심사만 둔다.
- 파일 하나가 200줄을 넘으면 분리를 검토한다.
- 폴더 구조는 기능(feature) 단위로 정리한다.
  예시: /components, /hooks, /utils, /services, /types

## 주석 & 문서화
- 각 파일 상단에 해당 파일의 목적을 1-2줄로 설명하는 주석을 단다.
- 비즈니스 로직이 복잡한 부분에는 "왜(why)" 이렇게 했는지 주석을 단다.
- JSDoc 또는 TSDoc 형식으로 함수의 파라미터와 반환값을 문서화한다.
- 자명한 코드에는 주석을 달지 않는다.

## 패턴 일관성
- 동일한 문제에는 프로젝트 전체에서 동일한 패턴을 사용한다.
- 새로운 라이브러리나 패턴 도입 전에 기존 코드에서 이미 사용 중인
  방식이 있는지 확인한다.
- 상태관리, API 호출, 에러 처리 등의 패턴을 통일한다.

## 코드 변경 시 규칙
- 기존 코드를 수정할 때, 주변 코드의 스타일과 패턴을 따른다.
- 대규모 리팩토링은 기능 변경과 분리하여 별도 커밋으로 한다.
- 새 코드 작성 시 관련 기존 코드도 같은 수준으로 정리한다.

## 금지 사항
- 하드코딩된 매직넘버 사용 금지 → 상수(const)로 분리
- any 타입 남용 금지 (TypeScript 사용 시)
- console.log 디버깅 코드를 커밋에 포함하지 않는다
- 하나의 컴포넌트/함수에 3단계 이상 중첩(nesting) 금지

---

## 이미 만들어진 코드를 정리하고 싶다면

Claude Code에 이렇게 요청하세요:
```
현재 프로젝트의 코드를 리팩토링해줘. 목표는 다음과 같아:

1. 각 파일 상단에 파일의 목적을 설명하는 주석 추가
2. 복잡한 비즈니스 로직에 "왜 이렇게 했는지" 주석 추가
3. 의미 불명확한 변수명/함수명을 서술적 이름으로 변경
4. 200줄 넘는 파일은 논리적 단위로 분리
5. 반복되는 코드는 공통 유틸 함수로 추출
6. README.md에 프로젝트 구조와 각 폴더/파일의 역할 설명 추가

기능 변경은 하지 말고, 코드 구조와 가독성만 개선해.
기존에 동작하던 것이 리팩토링 후에도 동일하게 동작해야 해.
```

---

## 실무 팁

**개발자에게 넘기기 전 체크리스트도 요청할 수 있습니다:**
```
이 프로젝트를 외부 개발자에게 인수인계한다고 가정하고,
개발자 온보딩 문서를 만들어줘:
- 프로젝트 구조 설명
- 로컬 개발 환경 셋업 방법
- 주요 아키텍처 결정 사항과 그 이유
- 데이터 흐름 다이어그램
- 환경변수 설명
- 배포 프로세스
```
