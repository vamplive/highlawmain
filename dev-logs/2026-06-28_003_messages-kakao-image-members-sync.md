# 메시지 발송 개편 + 군사센터 구성원 동기화

날짜: 2026-06-28
요청자: 운영자

## 변경 개요

### Task 1 — 군사센터 관리 구성원 탭 동기화

- `/admin/military-site-manager` → 구성원 탭이 `/admin/site-manager?tab=members`로 리다이렉트하는 카드를 표시하고 있었음
- `AdminLawyers` 컴포넌트를 직접 렌더링하도록 변경 → 양쪽 모두 동일한 컴포넌트 + 동일한 API → 자동 동기화

### Task 2 — 메시지 발송 페이지 개편

1. 카카오톡(친구톡) 채널 추가
2. 고객DB 외 수신자 직접 추가
3. 선택된 수신자 별도 표시 + 개별·전체 삭제
4. 이미지 첨부 기능

## 변경 파일

### 백엔드

**`backend/lib/kakao-friendtalk-service.js`** (신규)
- 알리고 카카오 채널 친구톡 API(`https://kakaoapi.aligo.in/akv10/friend/send/`) 연동
- `sendFriendTalk(to, message, { name, imageUrl })` 함수
- SMS 서비스와 동일하게 native `fetch` + URLSearchParams 사용
- 환경변수: `ALIGO_API_KEY`, `ALIGO_USER_ID`, `KAKAO_SENDER_KEY`, `ALIGO_TEST_MODE`

**`backend/routes/messages.js`**
- `sendFriendTalk` import 추가
- multer 이미지 업로드 설정 (`uploads/messages/` 디렉토리)
- `POST /messages/upload-image` 엔드포인트 — 이미지 저장 후 URL 반환
- 채널 유효성 검증에 `"kakao"` 추가 (POST /send, POST /schedule, PATCH /templates, POST /templates)
- 발송 루프: kakao 채널은 `sendFriendTalk` 호출, `imageUrl`은 `req.body.imageUrl`로 전달
- `channelUsesPhone()` 헬퍼 추가

**`backend/index.js`**
- 서버 시작 시 `uploads/messages` 디렉토리 자동 생성 목록에 추가

### 프론트엔드

**`frontend/src/pages/admin/military-site-manager/index.jsx`**
- `MembersTab` 컴포넌트 제거
- `AdminLawyers` import 추가 및 구성원 탭에 직접 렌더링

**`frontend/src/pages/admin/messages/messageConstants.js`**
- `CHANNEL_OPTIONS`에 `{ value: "kakao", label: "카카오톡" }` 추가
- `CHANNEL_COLORS`에 `kakao: "#f9e000"` 추가

**`frontend/src/pages/admin/messages/SendRecipientPanel.jsx`** (대폭 수정)
- 채널 옵션에 카카오톡 추가
- `ManualRecipientForm` 컴포넌트: 이름 + 연락처(전화/이메일) 직접 입력, 추가 버튼
- `SelectedRecipientsPanel` 컴포넌트: 선택된 수신자 전체 표시
  - DB 수신자(파란 배지)와 직접 추가 수신자(노란 배지) 구분
  - 개별 ×(삭제) 버튼 + "전체 삭제" 버튼
- Props 추가: `manualRecipients`, `onAddManual`, `onRemoveManual`, `onClearAll`
- 카카오톡 채널도 전화번호 기반으로 필터링

**`frontend/src/pages/admin/messages/SendComposerPanel.jsx`**
- 이미지 첨부 UI (kakao, email, both 채널에서 표시)
- 이미지 선택 → 미리보기 + ×(제거) 버튼
- 카카오톡 채널 시 미리보기 배경을 노란색으로 구분
- Props 추가: `imageFile`, `imagePreviewUrl`, `onImageChange`, `onImageRemove`, `channel`

**`frontend/src/pages/admin/messages/sendDispatch.js`**
- `uploadMessageImage(imageFile)` 함수 신규 export — 이미지 업로드 후 fullUrl 반환
- 모든 함수에 `manualRecipients`, `imageUrl` 파라미터 추가
- 카카오 채널: contactKey = `"phone"`
- `buildRecipients`: `consultationId` 폴백으로 `c.id` 사용

**`frontend/src/pages/admin/messages/SendTab.jsx`**
- 상태 추가: `manualRecipients`, `imageFile`, `imagePreviewUrl`
- 핸들러: `addManualRecipient`, `removeManualRecipient`, `clearAllRecipients`, `handleImageChange`, `handleImageRemove`
- `totalSelected` = DB 선택 + 직접 추가 합산
- 카카오 채널 수신자 필터링 (phone 기준)
- SMS 채널 전환 시 이미지 초기화
- 이미지 업로드 → 발송 전 서버 업로드 후 imageUrl 취득
- 예약 검증을 `setSending(true)` 이전에 수행 (버그 수정)

## 설정 필요 사항

```
# .env에 추가 필요
KAKAO_SENDER_KEY=발신프로필키  # 알리고 카카오 채널 친구톡 발신프로필 키
```

## 주의 사항

- 친구톡은 해당 카카오채널을 추가한 수신자에게만 발송됨 — 미추가 시 발송 실패로 표시
- 이미지형 친구톡의 경우 `imageUrl`은 반드시 공개 접근 가능한 URL이어야 함 (업로드된 파일은 `/uploads/messages/` 경로로 서빙)
- `APP_URL` 환경변수 설정 시 `fullUrl`에 도메인 포함 — 카카오 이미지 URL로 사용
- `/portal/messages` 경로는 `AdminMessages` 컴포넌트를 공유하므로 별도 수정 없이 포털에서도 동일하게 동작

## 검증 절차

- [ ] 군사센터 관리 → 구성원 탭에서 변호사 목록 표시 및 CRUD 동작
- [ ] 메인 사이트 관리 → 구성원 탭과 동일한 내용 표시 (동기화 확인)
- [ ] 메시지 발송 → 채널 선택에 카카오톡 표시
- [ ] 카카오톡 채널 선택 후 수신자 목록(전화번호 보유자)만 필터링 확인
- [ ] 직접 수신자 추가 → 이름 + 전화번호 입력 후 추가 → 선택된 수신자 패널 표시
- [ ] 선택된 수신자 개별 × 삭제 동작
- [ ] 선택된 수신자 전체 삭제 동작
- [ ] 이미지 첨부 (kakao/email 채널) → 미리보기 표시 → × 제거 동작
- [ ] 이미지 포함 발송 시 업로드 후 imageUrl 전달 확인 (네트워크 탭)
