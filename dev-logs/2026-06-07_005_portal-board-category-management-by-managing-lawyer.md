# 대표변호사 게시판(카테고리) 추가 기능

날짜: 2026-06-07
요청자: 운영자
배경: 포털 개선 6개 요청 중 "대표변호사들은 게시판을 추가할 수 있도록 해 줘" 항목.
기존에는 게시판 카테고리(공지사항/업무 매뉴얼/자유게시판/양식)가 프론트엔드 코드에
하드코딩되어 있어 새 게시판을 만들려면 코드 배포가 필요했다.

## 변경 파일

### DB 스키마 (신규 테이블 — 반드시 기록)
- `backend/db/schema.js` — `portal_board_categories` 테이블 정의 추가
  (`id`, `key`(유니크), `label`, `color`, `sortOrder`, `createdBy`, `createdAt`, `updatedAt`).
  `module.exports`에 `portalBoardCategories` 추가
- `backend/db/init-schema.js` — `CREATE TABLE IF NOT EXISTS portal_board_categories` 마이그레이션
  블록 + 기존 게시글의 카테고리 키(notice/manual/free/template)와 매핑되는 기본 게시판
  4종을 `INSERT OR IGNORE`로 시드 (기존 게시글의 카테고리 표시가 끊기지 않도록)

### 백엔드
- `backend/services/portal-service.js`
  - `checkIsManagingLawyer(portalUserId)` — 포털 계정의 이메일로 `lawyers` 프로필을 찾아
    `position === "대표변호사"` 여부 판별 (기존 `getLawyerProfileByEmail` 패턴 재사용)
  - `listBoardCategories` / `createBoardCategory` / `deleteBoardCategory` — 카테고리 CRUD.
    `key`는 `/^[a-z0-9-]{1,30}$/` 정규식으로 검증, 중복 키 방지, 게시글이 남아있는
    카테고리는 삭제 불가(삭제 가드)
- `backend/routes/portal.js`
  - `GET /lawyers/managing/check` — 현재 로그인한 사용자가 대표변호사인지 확인
  - `GET /board-categories` — 목록 조회 (직원 이상 권한)
  - `POST /board-categories` — 게시판 추가 (대표변호사만, `checkIsManagingLawyer` 가드)
  - `DELETE /board-categories/:id` — 게시판 삭제 (대표변호사만)

### 프론트엔드
- `frontend/src/pages/portal/PortalBoard.jsx`
  - 카테고리 목록을 `GET /board-categories`로 불러와 `categories` 상태에 저장하고,
    `getCategoryLabel`/`getCategoryColor`/`boardTabs`/글쓰기 모달의 카테고리 `<select>`를
    하드코딩된 맵 대신 이 상태 기반으로 동적 렌더링하도록 변경
  - `GET /lawyers/managing/check`로 현재 사용자가 대표변호사인지 확인해 `isManagingLawyer` 저장
  - 대표변호사에게만 보이는 "게시판 추가" 버튼과 모달(`FolderPlus` 아이콘) 추가 —
    이름/식별 키/색상을 입력해 `POST /board-categories` 호출 후 목록을 새로고침
- `frontend/src/pages/portal/PortalLayout.jsx`
  - 사이드바의 게시판 카테고리 목록도 동일하게 하드코딩 배열 대신
    `GET /board-categories`로 불러온 `boardCategories` 상태를 사용하도록 변경

## 검증 절차
- `npx eslint`로 수정한 4개 백엔드 파일과 2개 프론트엔드 파일 모두 새로 추가한 코드에는
  이슈 없음 확인 (PortalBoard.jsx에 남은 5건은 모두 이번 변경과 무관한 기존 이슈)
- 개발 서버(5173/5001)가 이미 기동 중인 것을 확인 (frontend:200, backend:401 — 인증 필요 응답 정상)

## 향후 개선
- 게시판 삭제 UI는 아직 없음 (백엔드 `DELETE /board-categories/:id`만 구현됨) —
  필요 시 사이드바나 게시판 관리 화면에 삭제 버튼 추가 검토
- 카테고리 정렬 순서(`sortOrder`) 수동 조정 UI는 없음 (현재는 추가된 순서대로 자동 증가)
