/** 공개 레이아웃 공유 상수 — 네비게이션 항목 및 푸터 기본값 */

export const NAV = [
  { to: "/about", label: "소개" },
  { to: "/partners", label: "구성원" },
  { to: "/practice", label: "업무분야" },
  { to: "/blog", label: "소식" },
  { to: "/recruit", label: "채용" },
  { to: "/consultation", label: "상담/문의" },
];

export const NAV_EN = [
  { to: "/about", label: "THE FIRM" },
  { to: "/partners", label: "PARTNERS" },
  { to: "/practice", label: "PRACTICES" },
  { to: "/blog", label: "NEWS" },
  { to: "/recruit", label: "RECRUIT" },
  { to: "/consultation", label: "INQUIRY" },
];

export const LAYOUT_DEFAULTS = {
  nav: { items: [
    { to: "/about", label: "소개" },
    { to: "/partners", label: "구성원" },
    { to: "/practice", label: "업무분야" },
    { to: "/blog", label: "소식" },
    { to: "/recruit", label: "채용" },
    { to: "/consultation", label: "상담/문의" }
  ] },
  footer: { companyName: "법무법인 하이로", tagline: "Loyalty & Dignity\n불법파견·게임사기·노동·군사건 전문 로펌", address: "서울특별시 강남구 테헤란로 141, 15층", tel: "02-594-5583", fax: "02-XXX-XXXX", hours: "평일 09:00 - 18:00", note: "예약 상담 우선 진행", copyright: "© 2026 HIGH & LAW FIRM. ALL RIGHTS RESERVED. ATTORNEY ADVERTISING. PRIOR RESULTS DO NOT GUARANTEE A SIMILAR OUTCOME." },
  contact: {
    phone: "02-6925-6757",
    kakaoUrl: "http://pf.kakao.com/_GxebGX/chat",
    telegramUrl: "",
    instagramUrl: "https://www.instagram.com/highlaw.official?igsh=ZGg2N3hmaDNkZjJw",
    youtubeUrl: "https://www.youtube.com/@%ED%95%98%EC%9D%B4%EB%A1%9C%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4",
    naverBlogUrl: "https://blog.naver.com/highlaw",
    telegramEnabled: false,
    kakaoEnabled: true,
    phoneEnabled: true,
    instagramEnabled: true,
    youtubeEnabled: true,
    naverBlogEnabled: true,
  },
};

/** 네비게이션 hover 시 노출할 하위 탭 목록 (to 경로를 key로 매핑)
 *  - 순서·이름은 각 페이지의 TABS 배열과 반드시 일치시킨다
 *  - ?tab=xxx 방식 페이지: URL이 단일 진실 소스 (useSearchParams 직접 참조)
 *  - pathname 방식 페이지(about): 실제 경로와 정확히 일치
 */
export const NAV_DROPDOWN = {
  "/partners": [
    { to: "/partners",          label: "구성원" },
    { to: "/partners#lectures", label: "강의 활동" },
  ],
  "/about": [
    { to: "/about",            label: "인사말" },
    { to: "/about/values",     label: "핵심가치" },
    { to: "/about/directions", label: "오시는 길" },
    { to: "/about/probono",    label: "공익활동" },
    { to: "/about/history",    label: "연혁" },
  ],
  "/practice": [
    { to: "/practice?tab=pain-points", label: "상담점검" },
    { to: "/practice?tab=advantages",  label: "하이로의 강점" },
    { to: "/practice?tab=areas",       label: "업무 분야" },
  ],
  "/blog": [
    { to: "/blog",                                  label: "전체" },
    { to: "/blog?category=construction_realestate", label: "하이로 뉴스" },
    { to: "/blog?category=case_analysis",           label: "판례 분석" },
    { to: "/blog?category=law_guide",               label: "법률 가이드" },
  ],
  "/recruit": [
    { to: "/recruit?tab=recruit", label: "채용 공고" },
    { to: "/recruit?tab=apply",   label: "지원 안내" },
    { to: "/recruit?tab=contact", label: "채용 문의" },
  ],
  "/consultation": [
    { to: "/consultation?tab=form",    label: "상담 신청" },
    { to: "/consultation?tab=process", label: "진행 절차" },
    { to: "/consultation?tab=faq",     label: "FAQ" },
  ],
};

export const FOOTER_LINKS = [
  { to: "/privacy", label: "개인정보처리방침" },
  { to: "/terms", label: "이용약관" },
  { to: "/consultation", label: "오시는길" },
];

export const FOOTER_LINKS_EN = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Use" },
  { to: "/consultation", label: "Location" },
];
