# 파트너 이미지 업로드 수정, 게시판 전체화면 글쓰기, 메시지 직접 입력 수신자

날짜: 2026-06-07
요청자: 운영자
배경: 세 가지 이슈 동시 수정.
  1) admin/site-manager?tab=partners 이미지 업로드 여전히 오류 — multer formData 필드 순서 버그
  2) portal/board 글쓰기를 portal/editor?mode=blog와 동일한 전체화면 에디터로 변경
  3) portal/messages에서 수신자 직접 입력 및 저장 기능 추가

## 변경 파일

### Issue 1: 파트너(구 변호사) 이미지 업로드 수정
- `frontend/src/pages/admin/lawyers/index.jsx`
  - formData.append 순서: file → folder(버그) → folder → file(수정)
  - multer의 destination 콜백은 file 파트가 도착할 때 실행되는데,
    이 시점에 뒤에 오는 folder 필드는 아직 req.body에 없음 → general/ 폴더에 저장됨
    그러나 라우트 핸들러에서는 req.body.folder가 lawyers로 올바르게 읽혀 URL이 lawyers/로 반환 → 404
- `backend/routes/media.js`
  - 업로드 후 URL 구성 시 req.body.folder 대신 req.file.destination에서 실제 폴더를 추출
  - 이렇게 하면 필드 순서에 관계없이 항상 파일이 실제로 저장된 폴더를 URL에 반영

### Issue 2: 게시판 글쓰기 전체화면 에디터
- `frontend/src/pages/portal/PortalBoardWriter.jsx` (신규)
  - 전체화면(full-page) 게시글 작성/수정 컴포넌트
  - 좌측: 제목 + PortalRichTextEditor (전체 높이 확장)
  - 우측: 카테고리, 중요/필독 설정 패널
  - 저장 시 portalApi.post('/posts') 또는 put('/posts/:id') 호출 후 /portal/board로 복귀
- `frontend/src/App.jsx`
  - /portal/board/write 및 /portal/board/write/:postId 라우트 추가
- `frontend/src/pages/portal/PortalBoard.jsx`
  - openCreateForm/openEditForm을 모달 대신 navigate('/portal/board/write') 로 변경

### Issue 3: 메시지 수신자 직접 입력 + 저장
- `frontend/src/pages/admin/messages/SendTab.jsx`
  - recipientSource === "manual" 시 API 조회 대신 manualRecipients 상태 사용
  - manualRecipients를 recipientList에 반영
- `frontend/src/pages/admin/messages/SendRecipientPanel.jsx`
  - SOURCE_OPTIONS에 "직접 입력" 추가
  - manual 모드: 이름/전화/이메일 입력폼 + 추가 버튼
  - localStorage에 저장(key: portal_saved_recipients) / 불러오기 기능

## 검증 절차
- 파트너 탭에서 로컬 파일 업로드 → 사진이 lawyers/ 폴더에 저장되고 올바른 URL 반환 확인
- 게시판 글쓰기 버튼 클릭 → 전체화면 에디터 페이지로 이동 확인
- 메시지 발송 탭에서 "직접 입력" 선택 → 수동 추가 및 저장/불러오기 동작 확인

## 향후 개선
- 직접 입력 저장 기능: 현재는 localStorage 기반(디바이스 로컬 저장). 구성원 간 공유가 필요하면 백엔드 API 추가 필요
- 게시판 에디터: 이미지 업로드 미리보기 추가 (현재 PortalRichTextEditor 내 업로드 기능 활용)
