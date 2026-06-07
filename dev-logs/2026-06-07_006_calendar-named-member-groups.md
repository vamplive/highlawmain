# 캘린더 — 함께 보고 싶은 구성원을 이름 지어 그룹으로 저장하는 기능

날짜: 2026-06-07
요청자: 운영자
배경: 포털 개선 6개 요청 중 "함께 보고 싶은 구성원의 일정을 개별적으로 저장할 수 있도록 해 줘.
그렇게 지정한 그룹의 이름도 원하는대로 정할 수 있도록 해 줘" 항목.
기존에는 '구성원' 캘린더 모드에서 부서별/회사 전체 모드로 들어가 매번 체크박스로
구성원을 다시 선택해야 했다 — 자주 함께 보는 멤버 조합을 저장해 두고 한 번에 불러오게 한다.

## 변경 파일

### DB 스키마 (신규 테이블 — 반드시 기록)
- `backend/db/schema.js` — `portal_member_groups` 테이블 정의 추가
  (`id`, `portalUserId`(소유자, FK cascade), `name`, `memberIds`(콤마 구분 문자열 — 기존
  `portal_events.attendee_ids`와 동일한 저장 방식), `createdAt`, `updatedAt`).
  `module.exports`에 `portalMemberGroups` 추가
- `backend/db/init-schema.js` — `CREATE TABLE IF NOT EXISTS portal_member_groups` 마이그레이션
  블록 + `idx_portal_member_groups_user` 인덱스 추가

### 백엔드
- `backend/services/portal-service.js`
  - `listMemberGroups(portalUserId)` — 본인이 저장한 그룹만 조회, `memberIds`를 배열로 변환해 반환
  - `createMemberGroup(portalUserId, { name, memberIds })` — 이름/구성원 검증 후 저장
  - `deleteMemberGroup(id, portalUserId)` — 소유자 본인만 삭제 가능 (소유권 검증)
- `backend/routes/portal.js`
  - `GET /member-groups` — 내가 저장한 그룹 목록
  - `POST /member-groups` — 현재 선택한 구성원들을 이름 지어 저장
  - `DELETE /member-groups/:id` — 그룹 삭제 (소유자 전용)

### 프론트엔드
- `frontend/src/pages/portal/PortalCalendar.jsx`
  - 구성원 캘린더 필터 모드에 "⭐ 저장한 그룹" 항목 추가 (기존 내 일정/부서별/회사 전체에 이어)
  - '부서별 일정' / '회사 전체 일정' 모드의 구성원 체크리스트 하단에 "현재 선택을 그룹으로
    저장" 버튼과 이름 입력 모달 추가 → `POST /member-groups` 호출
  - '저장한 그룹' 모드에서는 `GET /member-groups`로 불러온 그룹 목록을 보여주고,
    그룹을 클릭하면 해당 구성원 ID들을 `selectedMemberIds`에 적용해 캘린더를 즉시 필터링,
    각 그룹 옆 휴지통 아이콘으로 삭제(`DELETE /member-groups/:id`) 가능

## 검증 절차
- `npx eslint`로 수정한 4개 백엔드 파일 + `PortalCalendar.jsx` 모두 새로 추가한 코드에는
  이슈 없음 확인 (남은 경고 2건은 이번 변경과 무관한 기존 `useEffect` 의존성 경고)
- Vite 개발 서버에서 `PortalCalendar.jsx`가 컴파일 오류 없이 서빙되는 것을 확인 (HTTP 200)
- 백엔드 서버 재시작 후 `/api/portal/member-groups` 라우트 및 그룹 저장/조회/삭제 흐름은
  브라우저에서 추가 검증 필요 (현재 운영 중인 백엔드 프로세스가 이전 코드로 떠 있어
  새 라우트가 아직 반영되지 않음 — 운영자가 재시작 후 확인 요망)

## 향후 개선
- 그룹 이름 수정(rename) 기능은 아직 없음 — 필요 시 `PUT /member-groups/:id` 추가 검토
- 그룹에 포함된 구성원이 퇴사 등으로 `members` 목록에서 사라지는 경우 별도 정리 로직은 없음
  (캘린더 필터링 시 존재하지 않는 ID는 자연히 무시됨)
