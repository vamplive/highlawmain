# 관리자 사이트 관리 탭에 하위 탭 추가 및 공개 페이지 설정 연동

날짜: 2026-06-28
요청자: 운영자
배경: /admin/homepage의 about, practice, news-edit, recruit-edit, consultation-edit 5개 탭에 하위 탭을 추가하고, 관리자에서 편집한 내용이 실제 공개 페이지에 반영되도록 연동 요청

## 변경 파일

### 관리자 사이트 관리 (admin/site-manager/)

- `constants.js` — DEFAULT_SETTINGS에 신규 키 추가
  - `about/philosophy`: 5단락 인사말 전문 텍스트 (`\n\n` 구분)
  - `about/history`: `{year, text}` → `{year, title, desc}` 구조 변경
  - `about/probono`: intro + 4개 items (badge/title/desc)
  - `practice/pain_points`: 12개 고민 항목
  - `practice/advantages`: 4개 강점 항목 (title/desc)
  - `news/hero`, `recruit/hero`, `recruit/guide`, `consultation/hero`, `consultation/process`, `consultation/faq` 추가

- `AboutSection.jsx` — 완전 재작성, 5개 하위 탭 (인사말/핵심가치/오시는 길/공익활동/연혁)
- `PracticeSection.jsx` — 완전 재작성, 3개 하위 탭 (상담점검/하이로의 강점/업무 분야)
- `NewsBlogSection.jsx` — 신규 생성, 뉴스/히어로 편집 + 3개 블로그 카테고리 하위 탭
- `RecruitSectionWrapper.jsx` — 신규 생성, 채용/히어로 편집 + 3개 하위 탭
- `ConsultationSectionWrapper.jsx` — 신규 생성, 상담/히어로 편집 + 4개 하위 탭
- `index.jsx` — news-edit/recruit-edit/consultation-edit을 SELF_SAVING_TABS에서 제거, 새 래퍼 컴포넌트로 교체

### 관리자 블로그 (admin/blog/)

- `index.jsx` — `defaultCategory` prop 추가, `useState(defaultCategory)` 로 카테고리 초기화 가능

### 공개 페이지 연동

- `pages/public/AboutPage.jsx`
  - `ABOUT_DEFAULTS`에 `probono` 키 추가, `history` 구조를 `{year, title, desc}`로 변경
  - 인사말 탭: 하드코딩 5단락 → `settings.philosophy.description.split("\n\n").map(...)` (마지막 단락 서명 스타일 자동 적용)
  - 공익활동 탭: 하드코딩 4항목 → `settings.probono.intro` + `settings.probono.items`
  - 연혁 탭: 하드코딩 타임라인 → `settings.history.items`

- `pages/practice/PracticePage.jsx`
  - `useSiteSettingsPage("practice", PRACTICE_DEFAULTS)` 추가
  - 히어로: `settings.hero.heading/subheading` 사용
  - 상담점검 탭: 설정값 있으면 사용, 없으면 하드코딩 PAIN_POINTS 폴백
  - 하이로의 강점 탭: 설정값 있으면 사용, 없으면 하드코딩 ADVANTAGES 폴백 (아이콘 순서 자동 지정)

- `pages/blog/BlogPage.jsx`
  - `useSiteSettingsPage("news", NEWS_DEFAULTS)` 추가
  - PublicHero: `settings.hero.*` 사용

- `pages/recruit/RecruitPage.jsx`
  - `useSiteSettingsPage("recruit", RECRUIT_DEFAULTS)` 추가
  - PublicHero: `settings.hero.*` 사용

- `pages/consultation/ConsultationHero.jsx`
  - `useSiteSettingsPage("consultation", CONSULTATION_HERO_DEFAULTS)` 추가
  - PublicHero eyebrow/title: `consultationSettings.hero.*` 사용

- `pages/consultation/ConsultationSteps.jsx`
  - `useSiteSettingsPage("consultation", CONSULTATION_STEPS_DEFAULTS)` 추가
  - 절차 카드: `settings.process.items` 사용 (폴백: 하드코딩 STEPS)

- `pages/consultation/ConsultationFAQ.jsx`
  - `useSiteSettingsPage("consultation", CONSULTATION_FAQ_DEFAULTS)` 추가
  - FAQ 항목: `settings.faq.items` 사용 (폴백: 하드코딩 FAQ_ITEMS)

## 검증 절차

- 관리자 /admin/homepage?tab=about → 5개 하위 탭 정상 렌더 확인 필요
- 관리자 /admin/homepage?tab=practice → 3개 하위 탭 정상 렌더 확인 필요
- 관리자 /admin/homepage?tab=news-edit → 히어로 편집 + 3개 블로그 카테고리 탭 확인 필요
- 관리자 /admin/homepage?tab=recruit-edit → 히어로 편집 + 3개 탭 확인 필요
- 관리자 /admin/homepage?tab=consultation-edit → 히어로/절차/FAQ 편집 + 4개 탭 확인 필요
- 설정 저장 후 공개 페이지에서 변경사항 반영 확인
- ConsultationSteps/FAQ: 설정 미입력 시 하드코딩 폴백 동작 확인

## 향후 개선

- PracticePage: 상담점검 항목이 설정값으로 대체될 경우 bold 키워드 강조 표현 불가 (현재 plain text만 지원) — 향후 마크다운 렌더링 검토
- 오시는 길 탭: 현재 하드코딩 정보만 표시 — 주소/교통정보를 layout/contact 설정에서 읽어오도록 개선 가능
