# 게시판 글쓰기 — 블로그 관리와 동일한 리치 텍스트 에디터로 교체

날짜: 2026-06-07
요청자: 운영자
배경: 포털 개선 6개 요청 중 "게시판에 글을 쓸 때 블로그 관리 탭과 동일하게 글을 쓸 수 있도록
만들어 줘" 항목. 기존에는 일반 `<textarea>`로 줄바꿈만 지원하는 평문 작성만 가능했는데,
블로그 관리(`/admin/editor?mode=blog`)처럼 굵게/제목/목록/이미지 등 서식 있는 글쓰기를
지원해야 했다.

## 검토 및 설계 결정
- 블로그 관리의 단순 에디터(`BlogSimpleShell.jsx`)를 그대로 재사용하는 방안을 검토했으나,
  발행 예약·AI 글쓰기/삽화·표지 이미지 선택 등 블로그 전용 기능과 `doc`/`setDoc` 상태에
  강하게 결합되어 있어 게시판에 그대로 끼워넣기 어려움 → 핵심 서식 기능만 담은
  가벼운 독립 컴포넌트를 새로 작성하기로 결정
- TipTap v3 관련 패키지(`@tiptap/react`, `starter-kit`, `extension-underline/link/image/
  text-align/placeholder` 등)는 `frontend/package.json`에 이미 설치되어 있어 추가 설치 불필요
- 본문 렌더링은 블로그 상세 페이지(`BlogDetailPage.jsx`)와 동일하게
  `dangerouslySetInnerHTML`로 TipTap이 만든 HTML을 그대로 출력하는 방식을 채택
  (코드베이스에 별도 sanitize 라이브러리는 없음 — 인증된 포털 직원만 글을 쓸 수 있어
  블로그 작성자와 동일한 신뢰 수준으로 간주)

## 변경 파일

### 신규
- `frontend/src/pages/portal/PortalRichTextEditor.jsx`
  - TipTap 기반 단순 WYSIWYG 에디터 컴포넌트 (`value`, `onChange`, `placeholder` props)
  - 툴바: 굵게/기울임/밑줄/취소선, 단락 종류(본문/제목2~4) 드롭다운, 글머리·번호 목록,
    인용구, 구분선, 정렬(좌/중/우), 링크(`window.prompt` 입력), 이미지 업로드
  - 이미지 업로드는 `portalApi.upload("/posts/upload-image", file)` 호출 후
    반환된 URL을 `editor.chain().focus().setImage(...)`로 본문에 삽입
  - 외부에서 `value`가 바뀔 때만(예: 글 수정 모달을 열어 기존 글을 불러올 때)
    `editor.commands.setContent`로 동기화 — 매 입력마다 호출하면 커서가 튐

### 백엔드 (이전 작업에서 추가, 이번에 사용)
- `backend/routes/portal.js`
  - `boardImageUpload` (multer 디스크 스토리지, `STORAGE_PATH/uploads/board/`,
    20MB 제한, 이미지 mimetype 필터)
  - `POST /posts/upload-image` — 직원 권한 확인 후 이미지 저장,
    `{ url: "/uploads/board/${filename}", name, size }` 반환

### 프론트엔드
- `frontend/src/pages/portal/PortalBoard.jsx`
  - 글쓰기/수정 폼의 `<textarea>`를 `<PortalRichTextEditor value={formContent}
    onChange={setFormContent} />`로 교체
  - 글 상세보기의 본문을 `whiteSpace: pre-wrap` 평문 렌더링에서
    `dangerouslySetInnerHTML={{ __html: selectedPost.content }}`로 교체
    (이미지/인용구/링크 등에 대한 보조 스타일을 함께 추가)

## 검증 절차
- `npx eslint`로 `PortalRichTextEditor.jsx` 단독 실행 → 이슈 없음
- `npx eslint`로 `PortalBoard.jsx` 실행 → 새로 추가한 코드에는 이슈 없음.
  남은 5건(`navigate` 미사용, `catch (e)` 미사용 변수 2건, `useEffect` 의존성 경고 2건)은
  `git diff`로 대조해 모두 이번 변경 이전부터 있던 기존 이슈임을 확인
- Vite 개발 서버에서 두 파일 모두 컴파일 오류 없이 서빙되는 것을 확인 (HTTP 200)
- 실제 글 작성/이미지 업로드/조회 플로우는 백엔드 서버 재시작 후 브라우저에서
  추가 검증 필요 (현재 운영 중인 백엔드 프로세스가 `/posts/upload-image` 라우트를
  추가하기 전 코드로 떠 있음 — 운영자가 재시작 후 확인 요망)

## 향후 개선
- 표/코드블록 등 더 풍부한 서식이 필요해지면 `BlogSimpleShell`의 해당 기능을 참고해 추가 가능
- 본문 HTML을 그대로 신뢰하므로, 외부인이 글을 쓸 수 있는 구조로 바뀌면 sanitize 라이브러리
  도입을 검토해야 함 (현재는 인증된 직원만 작성 가능하여 블로그와 동일한 신뢰 모델)
