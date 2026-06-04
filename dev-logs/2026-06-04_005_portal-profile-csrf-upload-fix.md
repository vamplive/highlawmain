# 포털 프로필 사진 업로드 CSRF 토큰 오류 수정

날짜: 2026-06-04
요청자: 운영자
배경: 클라이언트 포털 프로필 페이지(`https://highlaw.co.kr/portal/profile`)에서 사진을 등록할 때 "CSRF 토큰이 유효하지 않습니다" 오류가 발생하는 문제를 해결하고, 안전한 CSRF 토큰 검증 및 업로드 처리를 하도록 수정하기 위함.

## 변경 파일
- `frontend/src/utils/api.js`
  - `uploadFile` 헬퍼 함수에서 `file` 인수가 `FormData` 인스턴스인 경우, 새로 랩핑하지 않고 해당 `FormData` 객체를 그대로 body로 전송하여 사용자 정의 필드명(예: `"photo"`)이 백엔드(Multer)와 정상적으로 연동되도록 개선.
  - `portalApi` 객체에 누락되었던 `put`과 `upload` 메서드를 추가 정의하여 포털 영역 내 파일 업로드 및 PUT 요청이 가능하도록 개선.
- `frontend/src/pages/portal/PortalProfile.jsx`
  - 기존의 로우 `fetch` 호출을 통한 파일 업로드 방식을 공통 `portalApi.upload`를 사용하도록 수정.
  - 이를 통해 브라우저 쿠키에 보관된 CSRF 토큰이 `x-csrf-token` 헤더에 자동 첨부되며, 실패 시 리트라이 등의 에러 핸들링이 일관성 있게 적용되도록 함.

## 검증 절차
- 로컬 `npm run build` 성공 확인
- Git push 후 GitHub Actions를 통한 서버 배포 모니터링 예정

## 향후 개선
- 추가 없음
