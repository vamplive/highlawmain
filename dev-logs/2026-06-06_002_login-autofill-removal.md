# 로그인 및 관리자 인증 페이지 자동 완성(Autofill) 비활성화

날짜: 2026-06-06
요청자: 운영자
배경: `/login` (의뢰인 포털 로그인) 및 `/admin` (관리자 인증) 페이지를 열었을 때 브라우저에 저장되어 있는 아이디와 패스워드가 자동으로 세팅되어 보안상 우려가 있거나 지우고 다시 입력해야 하는 번거로움이 발생함. 브라우저의 자동 완성(Autofill) 동작을 제어하기 위해 인풋의 자동완성 속성을 비활성화하고 가이드성 플레이스홀더를 개선함.

## 변경 파일
- `frontend/src/pages/public/LoginPage.jsx`
  - 로그인 폼(`LoginForm`) 내의 이메일 입력 필드의 `autoComplete` 속성을 `"email"`에서 `"off"`로 변경.
  - 비밀번호 입력 필드의 `autoComplete` 속성을 `"current-password"`에서 `"new-password"`로 변경하여 브라우저의 자동 입력을 방지.
- `frontend/src/pages/admin/auth/Login.jsx`
  - 관리자 인증 폼 내의 사용자명(USERNAME) 입력 필드의 `autoComplete` 속성을 `"username"`에서 `"off"`로 변경하고, 실제 값처럼 보여 헷갈릴 수 있는 `placeholder="admin"`을 `placeholder="아이디를 입력하세요"`로 수정.
  - 비밀번호(PASSWORD) 입력 필드의 `autoComplete` 속성을 `"current-password"`에서 `"new-password"`로 변경하여 자동 입력을 방지.

## 검증 절차
- 로컬 빌드 수행 및 정상 컴파일 확인
