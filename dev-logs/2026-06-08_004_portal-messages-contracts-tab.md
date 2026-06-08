# 포털 메시지 페이지에 전자계약서 발송 시스템 통합

날짜: 2026-06-08
요청자: 운영자
배경: /admin/contracts의 전자계약서 발송 시스템을 포털 /portal/messages 에서 사용할 수 있도록 이전. 관리자 페이지에서는 별도로 사용하지 않아도 됨.

## 변경 파일
- `frontend/src/pages/admin/contracts/EngagementNew.jsx` — onCancel/onCreated 콜백 prop 추가 (라우트 버전 하위 호환 유지)
- `frontend/src/pages/admin/contracts/SettlementNew.jsx` — onCancel/onCreated 콜백 prop 추가
- `frontend/src/pages/admin/contracts/ContractDetail.jsx` — contractId prop + onBack 콜백 추가 (임베드 모드 지원)
- `frontend/src/pages/admin/messages/ContractsTab.jsx` — 신규: 포털 메시지 내 계약서 탭 (목록→상세→신규작성 한 탭에서 처리)
- `frontend/src/pages/admin/messages/index.jsx` — "전자계약서" 네비 항목 추가

## 검증 절차
- /portal/messages 접속 → 좌측 사이드바에 "전자계약서" 메뉴 항목 확인
- 전자계약서 탭 클릭 → 계약서 목록 표시 확인
- "새 위임계약서" / "새 합의서" 버튼 클릭 → 인라인 폼으로 전환 확인
- 계약서 생성 후 상세 화면으로 자동 전환 확인
- 상세에서 서명자 추가/발송/변호사 서명 등 모든 기능 동작 확인

## 향후 개선
- /admin/contracts 경로는 그대로 유지됨 (북마크 호환). 필요하면 별도로 제거 가능.
- 계약서 양식 관리(/admin/contract-templates)는 포털에 아직 없음
