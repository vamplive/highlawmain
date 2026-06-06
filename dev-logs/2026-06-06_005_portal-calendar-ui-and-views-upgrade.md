# 포털 캘린더 UI 개선 및 네이버 캘린더식 뷰 토글 추가

날짜: 2026-06-06
요청자: 운영자
배경: 의뢰인/사원 포털 내 캘린더(/portal/calendar)의 UI를 관리자 테마(네이비/골드)로 일치시키고, 네이버 캘린더와 동일하게 개인(일간, 주간, 월간) 및 구성원(일간, 월간) 일정 뷰 토글 기능을 추가하며, 여러 구성원을 공동 일정에 지정할 수 있는 기능을 강화합니다.

## 변경 파일
- `frontend/src/pages/portal/PortalCalendar.jsx` — 신규 viewMode(personal_day, personal_week, personal_month, member_day, member_month) 추가, 상단 뷰 스위처 네이버 캘린더 스타일로 변경, 시간대별/구성원별 가로형 timeline 컬럼 비교 뷰(`renderMemberDailyView`) 구현, 클릭 슬롯 위치(사원 ID 및 시작 시간) 연동, Navy/Gold 테마 적용 및 모달의 다중 참석자 선택 기능 개선.

## 검증 절차
1. **빌드 검증**:
   - `frontend` 폴더에서 `npm run build`를 성공적으로 완료하여 코드 컴파일 경고나 에러가 없음을 확인.
2. **백엔드 테스트 검증**:
   - `backend` 폴더에서 `npm test`를 수행하여 410개 전체 테스트 케이스가 100% 통과함을 확인.

## 향후 개선
- 구성원 일간 뷰에서 비교할 대상 사원이 너무 많아질 경우 가로 스크롤 레이아웃 반응형 최적화 확인.
