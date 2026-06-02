/** 공개 레이아웃 공유 상수 — 네비게이션 항목 및 푸터 기본값 */

export const NAV = [
  { to: "/about", label: "소개" },
  { to: "/lawyers", label: "변호사" },
  { to: "/practice", label: "업무분야" },
  { to: "/blog", label: "소식" },
  { to: "/recruit", label: "채용" },
  { to: "/consultation", label: "상담/문의" },
];

export const NAV_EN = [
  { to: "/about", label: "THE FIRM" },
  { to: "/lawyers", label: "PARTNERS" },
  { to: "/practice", label: "PRACTICES" },
  { to: "/blog", label: "NEWS" },
  { to: "/recruit", label: "RECRUIT" },
  { to: "/consultation", label: "INQUIRY" },
];

export const LAYOUT_DEFAULTS = {
  nav: { items: [
    { to: "/about", label: "소개" },
    { to: "/lawyers", label: "변호사" },
    { to: "/practice", label: "업무분야" },
    { to: "/blog", label: "소식" },
    { to: "/recruit", label: "채용" },
    { to: "/consultation", label: "상담/문의" }
  ] },
  footer: { companyName: "법무법인 하이로", tagline: "Loyalty & Dignity\n불법파견·게임사기·노동·군사건 전문 로펌", address: "서울특별시 강남구 테헤란로 141, 15층", tel: "02-594-5583", fax: "02-XXX-XXXX", hours: "평일 09:00 - 18:00", note: "예약 상담 우선 진행", copyright: "© 2026 HIGH & LAW FIRM. ALL RIGHTS RESERVED. ATTORNEY ADVERTISING. PRIOR RESULTS DO NOT GUARANTEE A SIMILAR OUTCOME." },
  contact: {
    phone: "02-594-5583",
    kakaoUrl: "",
    telegramUrl: "",
    instagramUrl: "https://www.instagram.com/highlaw.official?igsh=ZGg2N3hmaDNkZjJw",
    youtubeUrl: "https://www.youtube.com/@%ED%95%98%EC%9D%B4%EB%A1%9C%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4",
    naverBlogUrl: "https://blog.naver.com/highlaw",
    telegramEnabled: false,
    kakaoEnabled: false,
    phoneEnabled: true,
    instagramEnabled: true,
    youtubeEnabled: true,
    naverBlogEnabled: true,
  },
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
