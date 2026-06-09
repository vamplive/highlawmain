# messages 고객 DB 탭 추가 — /portal/clients 연동

날짜: 2026-06-08
요청자: 운영자
배경:
- `/portal/messages`에서 발송 대상 고객 DB를 직접 추가·편집·삭제할 수 없었음
- `/portal/clients`의 고객 데이터와 messages의 수신자 목록이 단방향(조회만) 연동이었음

## 변경 파일

- `frontend/src/pages/admin/messages/ClientsTab.jsx` [신규]
  - `useCrudForm("/clients")` 훅으로 CRUD 구현 (추가·편집·삭제·활성/비활성 토글)
  - 이름·전화·이메일 키워드 검색 + 태그 필터 칩
  - 각 행에 💬 발송 버튼 → `QuickSendDialog` 원클릭 발송 연동
  - `/api/clients` 공유로 `/portal/clients`와 자동 양방향 연동

- `frontend/src/pages/admin/messages/index.jsx` [수정]
  - `Users` 아이콘 + `ClientsTab` import 추가
  - `NAV_ITEMS`에 `고객 DB` 항목 추가 (메시지 발송 다음 위치)
  - `activeView === "clients"` 분기 추가

## 검증 절차

- messages 고객 DB 탭에서 고객 추가 → /portal/clients에서 동일 데이터 확인
- messages 고객 DB 탭에서 수정/삭제 → 발송 탭 고객DB 소스 재조회 시 반영 확인
- 발송 탭 고객DB 소스 → ClientsTab과 동일 API 공유 확인

## 향후 개선

- messages 탭에서 고객 추가 후 발송 탭으로 바로 이동하는 연계 버튼 고려
- 고객 일괄 가져오기(CSV import) 기능 추가 가능성
