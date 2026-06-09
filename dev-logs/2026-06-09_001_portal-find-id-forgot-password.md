# 포털 로그인 — 아이디 찾기 / 비밀번호 찾기 구현

날짜: 2026-06-09
요청자: 운영자
배경: /login 페이지의 "아이디 찾기"·"비밀번호 찾기" 링크가 카카오톡 채널로 연결되어 있었음.
      등록한 이메일 또는 전화번호로 직접 찾을 수 있도록 인앱 기능으로 교체 요청.

## 변경 파일
- `backend/db/schema.js` — portal_users 테이블에 resetTokenHash, resetTokenExpiresAt 컬럼 추가
- `backend/db/init-schema.js` — portal_users ALTER TABLE 마이그레이션 추가
- `backend/services/portal-service.js` — findEmailByPhone, createPortalResetToken, resetPortalPassword 함수 추가
- `backend/routes/portal.js` — POST /find-id, /forgot-password, /reset-password 라우트 추가
- `frontend/src/pages/public/LoginPage.jsx` — 카카오 링크 제거, 아이디/비밀번호 찾기 모달 추가
- `frontend/src/pages/public/PortalResetPassword.jsx` — 비밀번호 재설정 페이지 신규 생성
- `frontend/src/App.jsx` — /reset-password 라우트 등록

## 동작 방식
- 아이디 찾기: 휴대폰 번호 입력 → clients 테이블에서 매칭 → portal_users 이메일 마스킹(ab****@gmail.com) 노출
- 비밀번호 찾기: 이메일 또는 휴대폰 번호 입력 → 일치 계정에 재설정 링크 이메일 발송 (30분 유효)
- 비밀번호 재설정: /reset-password?token=xxx 페이지에서 새 비밀번호 설정, 기존 세션 전체 무효화

## 보안 고려
- 사용자 존재 여부를 응답에서 노출하지 않음 (아이디 찾기는 예외 — 결과 자체가 목적)
- 재설정 토큰은 SHA-256 해시 저장, 평문은 메일에만 담김
- 토큰 검증은 timing-safe 비교 사용

## 검증 절차
- [ ] 아이디 찾기: 등록된 전화번호 입력 → 마스킹된 이메일 표시
- [ ] 아이디 찾기: 미등록 번호 입력 → "일치하는 계정 없음" 메시지
- [ ] 비밀번호 찾기: 이메일 입력 → 재설정 메일 수신 확인
- [ ] 비밀번호 찾기: 전화번호 입력 → 재설정 메일 수신 확인
- [ ] /reset-password?token=xxx 접속 → 새 비밀번호 입력 → 로그인 성공

## 향후 개선
- SMS 기반 인증번호 발송으로 비밀번호 찾기 보완 가능
