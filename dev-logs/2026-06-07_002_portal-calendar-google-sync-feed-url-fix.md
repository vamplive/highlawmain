# 포털 캘린더 → 구글 캘린더 연동(iCal 피드) URL이 잘못 생성되어 동기화가 되지 않던 문제 수정

날짜: 2026-06-07
요청자: 운영자
배경: 운영자가 `/portal/calendar`에서 일정을 등록하고 안내된 iCal 피드 URL을 구글 캘린더에 "URL로 추가"했지만, 일정이 동기화되지 않는다고 보고함.

## 원인 분석
- `GET /api/portal/calendar/sync-info`(`backend/routes/portal.js`)는 사용자에게 안내할 피드 URL(`feedUrl`)을 다음과 같이 생성하고 있었음:
  ```js
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  ```
- 운영 서버는 Lightsail에서 nginx 리버스 프록시 뒤의 PM2(Node) 프로세스로 동작한다. 이런 구조에서는 `req.protocol`/`req.get("host")`가 nginx의 `proxy_set_header` 설정에 따라 외부에 공개된 도메인(`https://highlaw.co.kr`)이 아닌 내부 주소(예: `http://127.0.0.1:5001`)나 잘못된 프로토콜로 해석될 수 있음.
- 실제로 이 코드베이스는 정확히 이 문제를 이미 인지하고 있었음 — `backend/routes/admin-users.js:164`에 "재설정 페이지 URL — APP_URL 환경변수 기반. **Host 헤더 기반 생성을 의도적으로 회피**."라는 주석과 함께 `process.env.APP_URL || "http://localhost:5173"` 패턴을 사용 중이었고, `google-calendar-oauth.js`/`message-render.js`/`blog-static-renderer.js`/`index.js` 등 베이스 URL이 필요한 모든 곳이 동일하게 `APP_URL` 환경변수 + 고정 기본값 패턴을 사용함. 캘린더 피드의 `req.protocol`/`req.get("host")` 기반 생성은 백엔드 전체에서 유일한 예외였음(grep으로 확인).
- 결론: 운영 서버에 `APP_URL`이 설정되어 있지 않은 상태(`[ENV WARNING] APP_URL 미설정` 경고로도 확인됨)에서, `req.protocol`/`req.get("host")` 폴백이 외부에서 도달 불가능한 내부 주소를 `feedUrl`로 만들어냈을 가능성이 매우 높음. 사용자가 이 URL을 구글 캘린더에 등록했다면 구글 서버가 해당 주소로 피드를 가져올 수 없으므로 "동기화가 안 된다"가 아니라 애초에 동기화가 시작조차 될 수 없는 상태였던 것으로 보임(단순한 구글 측 새로고침 주기 지연 문제가 아님).

## 변경 파일
- `backend/routes/portal.js`
  - `GET /calendar/sync-info`의 `appUrl` 생성을 `req.protocol`/`req.get("host")` 기반에서, 코드베이스 전반의 확립된 패턴과 동일한 `(process.env.APP_URL || "https://highlaw.co.kr").replace(/\/+$/, "")`로 교체. `admin-users.js`와 동일한 "Host 헤더 기반 생성을 의도적으로 회피" 원칙을 명시하는 주석 추가.
  - 운영 서버에 `APP_URL` 환경변수가 설정되어 있지 않아도 항상 올바른 공개 도메인(`https://highlaw.co.kr`)으로 피드 URL이 생성되도록 보강(다른 베이스 URL 생성 코드들이 고정 기본값을 갖는 것과 동일한 방식).

## 검증 절차
1. `npx eslint routes/portal.js` — No issues found.
2. `grep -rn "req.protocol\|req.get(\"host\")"` 로 백엔드 전체를 확인 — 수정 전에는 캘린더 피드가 유일한 사용처였고(베이스 URL 생성에 `Host` 헤더를 쓰지 않는다는 기존 컨벤션과 불일치), 수정 후에는 0건으로 컨벤션과 일치함을 확인.
3. `curl https://highlaw.co.kr/api/portal/calendar/feed?userId=test&token=test` — `403 올바르지 않은 인증 토큰입니다` 정상 응답을 확인해, 피드 라우트 자체는 외부에서 정상적으로 도달 가능함(방화벽/프록시 차단 아님)을 재확인.
4. (제약사항) 실제 사용자 데이터·인증 토큰을 이용한 종단간(end-to-end) 검증은 사용자 PII 조회 및 서버 비밀키를 이용한 인증 토큰 위조가 필요해 보안상 수행하지 않음. 운영자가 `/portal/calendar`의 "구글 캘린더 연동" 안내에서 새로 발급되는 피드 URL이 `https://highlaw.co.kr/api/portal/calendar/feed?...` 형태로 시작하는지 직접 확인 권장.

## 향후 개선
- 운영 서버 `.env`에 `APP_URL=https://highlaw.co.kr`를 명시적으로 설정하면 `[ENV WARNING] APP_URL 미설정` 경고도 함께 해소되고, 비밀번호 재설정·구글 OAuth 콜백·메시지 링크 등 `APP_URL`에 의존하는 다른 기능들의 동작도 더 견고해짐(현재는 각자 고정 기본값으로 동작 중이나 명시적 설정이 더 안전).
- 구글 캘린더의 "URL로 추가" 구독은 자체 새로고침 주기(보통 수 시간~하루)가 있고 수동 새로고침 기능이 없으므로, URL이 올바르게 등록된 이후에도 신규/변경된 일정이 구글 캘린더에 반영되기까지 다소 시간이 걸릴 수 있음(이는 본 수정과 별개의 구글 플랫폼 자체의 한계).
