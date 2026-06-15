# 군 징계·형사 전문 랜딩 페이지 신규 생성 (/military)

날짜: 2026-06-11
요청자: 운영자
배경: highlaw.co.kr/military 전용 랜딩 페이지 필요. 카카오톡 채널 3개 포스트 콘텐츠(비대면 징계대리, 군 형사사건, 정서 케어)를 하나의 고품질 랜딩 페이지로 통합. 독립 HTML 파일로 제작.

## 변경 파일
- `frontend/public/military/index.html` — 신규 생성 (71KB, 1257줄)
  - 16개 섹션 랜딩 페이지: Hero → 문제제기 → Stakes → 가격 혁신 → 솔루션 → 품질보장 → 형사 전문성 → 하이브리드 → 핵심역량 → 네트워크 → 원스톱패키지 → 정서케어 → 팀소개 → 수임정책 → 프로세스 → 최종CTA
  - 디자인 시스템: Navy Deep (#0B1829) + Gold (#D4AF37), Noto Serif KR + Noto Sans KR + EB Garamond
  - 애니메이션: IntersectionObserver fade-up, 가격 카운터 (0→390,000), 비교 progress bar, prefers-reduced-motion 지원
  - CTA: 카카오톡 채널 (pf.kakao.com/_GxebGX), floating CTA 버튼
  - Tailwind CDN Play 방식, 외부 JS 라이브러리 없음 (바닐라 JS 전용)
  - 완전 반응형: 375px / 768px / 1024px / 1440px
  - 접근성: WCAG AA 대비비, focus-visible, aria-label, alt text, 키보드 탐색

## 콘텐츠 출처
카카오톡 채널 포스트 3개:
1. 비대면 징계대리 서비스 (39만원 정찰제, 4단계 솔루션)
2. 군 형사사건 케어 (하이브리드 변호사, 원스톱 패키지, 수임 정책)
3. 정서 케어 서비스 (SOS, 입체 케어, 부모님 안심)

## 배포 시 주의
Vite 빌드 시 `public/military/index.html` → `dist/military/index.html`으로 복사됨.
Nginx의 `try_files $uri $uri/ /index.html` 설정에서 `/military` 접근 시
`dist/military/index.html`이 먼저 서빙되므로 React 라우터 우회. 추가 Nginx 설정 불필요.
단, 배포 후 `highlaw.co.kr/military/` (슬래시 포함)로 접근되는 점 확인 필요.

## 향후 개선
- 변호사 실사진 추가 (/lawyers/kang.jpg, /lawyers/jo.jpg, /lawyers/kim.jpg, /lawyers/team.jpg)
- 카카오톡 상담 전환율 트래킹 (GA4 이벤트)
- 실제 후기/성공사례 섹션 추가 가능
- 군 형사 / 비대면 징계 두 서비스를 탭으로 분리하는 옵션 검토
