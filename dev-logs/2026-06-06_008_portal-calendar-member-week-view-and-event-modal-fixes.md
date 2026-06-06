# 포털 캘린더 구성원 주간 뷰 개편 및 일정 등록 모달 미작동 버튼 수정

날짜: 2026-06-06
요청자: 운영자
배경: 포털 캘린더(/portal/calendar)에서 (1) "구성원 월간" 뷰를 제거하고, (2) "구성원 주간" 뷰에서 구성원 각각을 Y축(행)에 배치하며, (3) 일정 등록 모달의 "반복 안함", "주소록", "설비 예약", "화상회의 추가", "지도 첨부", "파일 첨부", "범주 수정", "알림" 등 클릭해도 반응이 없던 버튼/선택 항목들을 모두 수정해 달라는 요청. "설비 예약"·"화상회의 추가"처럼 외부 연동 인프라가 전혀 없는 항목은 무리하게 가짜로 동작시키지 않고, 기존 인프라(파일 업로드 multer, 이메일 발송, 구성원 데이터)로 실제 구현 가능한 기능만 동작하도록 범위를 한정함(운영자가 "실제 구현 가능한 것만 기능 구현" 옵션을 선택).

## 변경 사항

### 1) 구성원 월간 뷰 제거
- `frontend/src/pages/portal/PortalCalendar.jsx`의 구성원 탭 옵션에서 `member_month`를 제거, `member_day`/`member_week`만 남김.

### 2) 구성원 주간 뷰 — Y축에 구성원 배치
- 신규 함수 `renderMemberWeeklyView` 추가: 좌측 sticky 열에 구성원(이름+직책)을 행으로, 상단 sticky 헤더에 7일(요일+날짜)을 열로 배치한 그리드. 각 셀은 해당 구성원이 소유자(owner)이거나 참석자(attendee)인 일정만 필터링해 표시(`renderMemberDailyView`와 동일한 `isOwner || isAttendee` 로직 재사용).
- 렌더링 분기를 `viewMode.endsWith(...)` 패턴 기반에서 명시적 모드 매칭으로 교체해 `member_week`가 새 뷰를 사용하도록 연결, 중복 헤더가 그려지지 않도록 기존 요일 헤더 조건에 `viewMode !== "member_week"` 추가.

### 3) 일정 등록 모달 — 미작동 버튼/선택 항목 수정
**DB/백엔드 (실제 구현):**
- `backend/db/schema.js`, `backend/db/init-schema.js` — `portal_events` 테이블에 `location`, `video_conference_url`, `attachment_urls`, `category`, `recurrence_rule`, `reminder_minutes`, `reminded` 컬럼 추가(SQL 인라인 마이그레이션, `ALTER TABLE ... ADD COLUMN` + 알림 조회용 인덱스).
- `backend/services/portal-service.js` — `createPortalEvent`/`updatePortalEvent`를 신규 필드까지 다루도록 재작성. 반복 일정은 즉시 생성 시점에 N개의 개별 레코드로 "선반영"(eager materialization)하는 방식으로 구현(`RECURRENCE_RULES`로 반복 단위/횟수 상한 정의, `shiftDateTimeString`으로 타임존 버그 없이 날짜 이동).
- `backend/routes/portal.js` — `POST /api/portal/calendar/upload-attachment` 라우트 추가(multer 디스크 스토리지, `STORAGE_PATH/uploads/calendar/`, 20MB 제한).
- `backend/lib/portal-event-reminder.js`(신규) — `court-date-reminder.js`를 본뜬 60초 간격 cron. `reminder_minutes` 도래 시 일정 작성자 이메일로 알림 발송 후 `reminded=1`로 마킹해 중복 발송 방지. `backend/index.js`에 cron 등록.

**프런트엔드 (`frontend/src/pages/portal/PortalCalendar.jsx`):**
- "반복 안함" → `recurrenceOptions`(반복 안 함/매일/매주/매월/매년) 선택 가능한 select로 교체. 신규 등록 시에만 적용 가능(수정 시 비활성화 + 안내 툴팁).
- "주소록" → 입력란을 검색 가능한 텍스트 필드로 전환(이름/직책 검색), "주소록" 버튼은 검색어 초기화 기능으로 연결. 참석자 목록은 검색어로 실시간 필터링.
- "화상회의 추가" → 비활성 select를 체크박스 토글 + URL 입력란으로 교체. 활성화 시 URL을 저장하고 알림 메일에도 포함.
- "설비 예약" → 백엔드에 시설/회의실 예약 데이터·인프라가 전혀 없어 가짜로 동작시키지 않고 섹션 자체를 제거(미사용된 `Monitor` 아이콘 import도 함께 정리).
- "지도 첨부" → 장소 입력란을 활성화하고, 입력된 장소명으로 카카오맵 검색 링크를 새 창으로 여는 "지도에서 보기" 버튼으로 교체.
- "파일 첨부"("내 PC") → 실제 파일 선택 input + 업로드 진행 상태 표시. 업로드된 파일은 목록으로 표시되고 개별 삭제 가능(`handleAttachmentUpload`가 `portalApi.upload`로 신규 라우트 호출, 응답 URL/이름/용량을 폼 상태에 저장). 용량 표시용 `formatFileSize` 헬퍼 추가.
- "범주 수정" → 비활성 select와 버튼을 `categoryOptions`(회의/재판·기일/외부 일정/교육·세미나/휴가/기타 등) 선택 가능한 select로 교체(문서/블로그용 기존 `categories` 테이블과는 도메인이 달라 재사용하지 않고 고정 프리셋 사용).
- "알림" → 비활성 select와 의미 없는 라디오를 `reminderOptions`(10분 전/30분 전/1시간 전/1일 전/사용 안 함) 선택 가능한 select로 교체. 발송 채널은 이메일만 존재하므로 라디오 선택 없이 "이메일로 알림을 보내드립니다" 안내 문구로 단순화.
- `handleOpenCreateModal`/`handleOpenEditModal`/`handleSaveEvent`를 신규 폼 상태(`formRecurrence`, `formVideoEnabled`, `formVideoUrl`, `formLocation`, `formCategory`, `formReminderMinutes`, `formAttachments`, `attendeeSearch`)의 초기화/채움/저장 페이로드에 연결.
- (부수 정리) `handleDeleteEvent`의 미사용 `catch (err)` 변수를 `catch`로 정리(no-unused-vars lint 오류 해소).

## 검증 절차
1. `npx eslint src/pages/portal/PortalCalendar.jsx` — 0 errors, 2 warnings(둘 다 본 작업과 무관한 기존 `react-hooks/exhaustive-deps` 경고).
2. 백엔드(`node index.js`)를 기동해 신규 컬럼 마이그레이션이 오류 없이 적용되고 `portal-event-reminder` cron이 정상 등록되는 것을 로그로 확인.
3. `require()`로 `db/schema.js`, `lib/portal-event-reminder.js` 모듈이 문법 오류 없이 로드되는 것을 확인.

## 향후 개선
- 반복 일정은 "선반영" 방식이라 한도(매일 60회/매주 26회/매월 12회/매년 5회)를 넘는 장기 반복은 지원하지 않음 — 필요 시 RRULE 기반 온더플라이 전개로 전환 검토.
- "설비 예약"·"화상회의 자동 생성"(Google Meet/Zoom API 연동) 등은 외부 연동이 필요하므로, 운영자가 실제 도입을 원할 경우 별도 작업으로 분리해 진행.
- 브라우저에서 모달 클릭 동작을 직접 확인하지 못했으므로(자동화된 브라우저 도구 부재), 운영자가 실제 화면에서 각 버튼의 동작을 1차 확인해보는 것을 권장.
