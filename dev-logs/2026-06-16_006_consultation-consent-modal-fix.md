# 온라인 상담 동의서 확인 오류 수정

날짜: 2026-06-16
요청자: 운영자
배경: /consultation/?tab=form 에서 "동의서 확인" 버튼을 누르면 계속 오류가 발생

## 근본 원인

1. `window.alert()` 는 모달/다이얼로그 내부에서 일부 모바일 브라우저에 의해 차단됨
2. `engine.toDataURL()` 이 예외를 던질 수 있는데 try/catch 없이 호출 중이었음
3. 모달이 처음 열릴 때 콘텐츠가 화면에 이미 다 들어와 있으면 스크롤 이벤트가 발생하지 않아
   `scrolledToBottom` 이 false 로 유지되어 동의 버튼이 비활성 상태로 남는 경우 발생

## 변경 파일

- `frontend/src/pages/consultation/PrivacyModal.jsx`
  - `const [signError, setSignError] = useState("")` 인라인 오류 상태 추가
  - `window.alert()` → 인라인 `<p role="alert">` 오류 메시지로 교체
  - 마운트 시점에 `scrollHeight <= clientHeight + SCROLL_BOTTOM_THRESHOLD` 이면
    자동으로 `setScrolledToBottom(true)` 처리 (이미 다 보이는 경우 스크롤 불필요)
  - 동의 버튼 disabled 조건: 기존 `!canAgree` → `!scrolledToBottom` 으로 단순화
    (서명 미입력 시 버튼 텍스트로 안내 + 클릭 시 인라인 오류 표시)

- `frontend/src/pages/consultation/useSignaturePad.js`
  - `buildPayload()` 내부에 try/catch 추가
  - `engine.toDataURL()` 결과가 `data:image/` 로 시작하지 않으면 null 반환

- `frontend/src/pages/consultation/ConsultationForm.jsx`
  - `handlePrivacyAgreed()` 에서 `window.alert()` → `setSubmitResult()` 인라인 오류로 교체

## 검증 절차
- 서버: git push → git pull + npm run build 완료
