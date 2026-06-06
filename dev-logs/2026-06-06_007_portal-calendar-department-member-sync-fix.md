# 포털 캘린더 부서/구성원 일정 미표시 및 일정 등록 오류 수정

날짜: 2026-06-06
요청자: 운영자
배경: 관리자 페이지에는 부서 3개, 직원 4명이 등록되어 있음에도 포털 캘린더(/portal/calendar)에서 부서별 일정과 "회사 전체" 구성원 일정이 0건으로 표시되고, 일정 등록 모달의 시작/종료 시간 입력 영역 레이아웃이 깨지는 문제를 수정합니다.

## 원인 분석
- `lib/auth.js`의 `getPortalSession`이 반환하는 세션 객체에는 `role` 필드가 포함되지 않는데(저장 자체를 하지 않음), `portal.js`의 `/departments`, `/members` 라우트는 `req.portalUser.role`을 직접 참조해 직원 여부(`isEmployee`)를 판별하고 있었음.
- 그 결과 `clientId`가 연결된 직원 계정은 항상 `isEmployee = false`로 판정되어 403(`권한이 없습니다`) 응답을 받았고, 프런트엔드는 이를 `console.error`로만 처리해 `departments`/`members`가 빈 배열로 남아 "부서별 일정 없음", "구성원 일정(0명)" 현상으로 이어짐.
- 동일한 빈 `members` 배열 때문에 일정 등록 모달의 담당자(owner) `<select required>`에 옵션이 전혀 없어 폼 검증 단계에서 등록이 막히는 문제도 함께 발생.
- 시간 입력 영역은 `handleStartTimeChange`/`handleEndTimeChange`가 날짜 미선택 시 하드코딩된 매직 날짜 `"2026-06-06"`로 폴백하던 점, 그리고 시작/종료 행의 날짜·시간 input에 `flexWrap`이나 `minWidth: 0`이 없어 좁은 화면에서 내용이 겹치거나 어색하게 줄바꿈되던 점이 원인.

## 변경 파일
- `backend/services/portal-service.js` — DB에서 최신 `clientId`/`role`을 직접 조회해 직원 여부를 판별하는 `checkIsEmployee(portalUserId)` 헬퍼 추가(기존 `listPortalEvents`가 사용하던 올바른 패턴과 동일하게 통일) 및 `module.exports`에 등록.
- `backend/routes/portal.js` — `/departments`, `/members` 라우트에서 깨져 있던 `req.portalUser.role` 기반 판별을 `await portalService.checkIsEmployee(req.portalUser.userId)` 호출로 교체.
- `frontend/src/pages/portal/PortalCalendar.jsx`
  - `handleStartTimeChange`/`handleEndTimeChange`의 하드코딩된 매직 날짜 `"2026-06-06"`을 기존 `formatDateString(new Date())` 헬퍼 호출로 교체.
  - 일정 등록/수정 모달의 시작·종료 날짜·시간 입력 행에 `flexWrap: "wrap"`, `rowGap`, `minWidth: 0`, 유연한 `flex` 비율을 적용해 좁은 화면에서도 한 줄에 자연스럽게 배치되거나 깔끔하게 줄바꿈되도록 수정.

## 검증 절차
1. **코드 추적 검증**: `listPortalEvents`가 사용하는 "DB에서 최신 사용자 정보를 재조회해 `isEmployee`를 계산"하는 패턴과 신규 `checkIsEmployee`가 동일한 결과를 내는지 비교 확인.
2. **프런트엔드 빌드 환경 기동**: `npm run dev`로 Vite 개발 서버 정상 기동 확인(컴파일 에러 없음).

## 향후 개선
- 포털 세션에 `role`/`clientId`를 캐싱할 경우, 관리자가 권한을 변경했을 때 세션이 갱신되지 않아 동일한 종류의 불일치가 재발할 수 있으므로, `checkIsEmployee`처럼 DB를 직접 조회하는 패턴을 포털 권한 판별 전반에 일관되게 적용하는 것을 검토.
