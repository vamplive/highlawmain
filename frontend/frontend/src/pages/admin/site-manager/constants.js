/** 사이트 관리자 탭 정의, 기본 설정값, 공통 상수 */

/* ─── 탭 정의 ─── */
export const TABS = [
  { key: "home", label: "홈페이지" },
  { key: "hero-videos", label: "히어로 영상" },
  { key: "about", label: "소개" },
  { key: "practice", label: "업무분야" },
  { key: "layout", label: "공통 (헤더/푸터)" },
  { key: "theme", label: "테마" },
  { key: "seo", label: "SEO" },
  { key: "announcements", label: "공지/배너" },
  { key: "history", label: "개발 일지" },
];

/* ─── SEO 페이지 목록 ─── */
export const SEO_PAGES = [
  { key: "home", label: "홈페이지", url: "/" },
  { key: "about", label: "사무소 소개", url: "/about" },
  { key: "practice", label: "업무분야", url: "/practice" },
  { key: "lawyers", label: "변호사 소개", url: "/lawyers" },
  { key: "consultation", label: "상담안내", url: "/consultation" },
  { key: "blog", label: "블로그", url: "/blog" },
  { key: "cases", label: "성공 사례", url: "/cases" },
];

/* ─── 공지/배너 상수 ─── */
export const ANNOUNCEMENT_TYPES = [
  { value: "banner", label: "배너" },
  { value: "popup", label: "팝업" },
  { value: "alert", label: "알림" },
];

export const ANNOUNCEMENT_POSITIONS = [
  { value: "top", label: "상단" },
  { value: "bottom", label: "하단" },
  { value: "center", label: "중앙" },
];

export const ANNOUNCEMENT_TYPE_STYLES = {
  banner: { bg: "#dbeafe", color: "#1d4ed8" },
  popup: { bg: "#fef3c7", color: "#92400e" },
  alert: { bg: "#fee2e2", color: "#dc2626" },
};

export const ANNOUNCEMENT_TYPE_LABELS = {
  banner: "배너", popup: "팝업", alert: "알림",
};

export const EMPTY_ANNOUNCEMENT = {
  type: "banner", title: "", content: "", linkUrl: "",
  bgColor: "#3b6ea5", textColor: "#ffffff",
  isActive: true, startDate: "", endDate: "", position: "top",
};

/* ─── 기본값: 현재 하드코딩된 콘텐츠 ─── */
export const DEFAULT_SETTINGS = {
  "home/hero": { heading: "법무법인 하이로", subheading: "HIGH & LAW FIRM", tagline: "의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다.\n첫 상담부터 판결 이후까지, 리스크를 줄이고 최선의 결론을 만들기 위해 함께합니다.", ctaPrimary: "상담 신청", ctaPrimaryLink: "/consultation", ctaSecondary: "업무분야 보기", ctaSecondaryLink: "/practice" },
  "home/stats": { items: [{ value: "1:1", label: "사건 맞춤 커뮤니케이션" }, { value: "24H", label: "신속한 초기 응답" }, { value: "100%", label: "기밀 보장 원칙" }] },
  "home/approach": { heading: "명확한 전략, 빠른 실행, 책임 있는 결과", description: "법무법인 하이로는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여 의뢰인에게 가장 실익이 큰 선택지를 제시합니다." },
  "home/highlights": { items: [{ title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." }, { title: "신뢰 중심 커뮤니케이션", desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다." }, { title: "풍부한 사건 수행 경험", desc: "민사·형사·가사·행정·조세 등 다양한 분야에서 실무 경험을 축적했습니다." }] },
  "home/cta": { message: "법률 문제로 고민이 있으신가요?", buttonText: "상담 예약하기 →", buttonLink: "/consultation" },
  "about/hero": { heading: "사무소 소개", subheading: "ABOUT HIGH & LAW FIRM", description: "진실된 마음으로 의뢰인의 목소리에 귀를 기울이며,\n최선의 법률적 해법을 제시합니다." },
  "about/philosophy": { heading: "신뢰를 기반으로\n결과를 만드는 로펌", description: "법무법인 하이로는 의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다. 첫 상담부터 판결 이후까지, 리스크를 줄이고 최선의 결론을 만들기 위해 함께합니다." },
  "about/values": { items: [{ title: "신뢰", subtitle: "TRUST", desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다." }, { title: "전문성", subtitle: "EXPERTISE", desc: "민사·형사·가사·행정·조세 등 다양한 분야에서 실무 경험을 축적했습니다." }, { title: "헌신", subtitle: "DEDICATION", desc: "의뢰인의 사건을 비즈니스처럼 정교하게 관리하며, 최선의 결론을 만들기 위해 함께합니다." }, { title: "혁신", subtitle: "INNOVATION", desc: "법률 기술과 데이터 분석을 활용한 선진적 법률 서비스를 지향합니다." }] },
  "about/history": { items: [{ year: "2021", text: "법무법인 하이로 설립" }, { year: "2022", text: "기업자문 전담팀 구성" }, { year: "2023", text: "행정소송 전문 분야 확대" }, { year: "2024", text: "서초대로 327 사무소 이전" }, { year: "2025", text: "디지털 법률 서비스 고도화" }] },
  "practice/hero": { heading: "업무분야", subheading: "PRACTICE AREAS" },
  "practice/intro": { description: "법무법인 하이로는 다양한 법률 분야에서 축적된 경험과 전문성을 바탕으로 의뢰인에게 최적의 법률 솔루션을 제공합니다." },
  "practice/areas": { items: [
    { title: "민사 소송", subtitle: "CIVIL LITIGATION", desc: "손해배상, 계약 분쟁, 부동산, 채권추심 등 민사 전반에 걸친 소송 대리 및 자문 서비스를 제공합니다.", details: ["손해배상 청구", "계약 분쟁 해결", "부동산 관련 소송", "채권추심 및 강제집행"] },
    { title: "형사 변호", subtitle: "CRIMINAL DEFENSE", desc: "수사 단계부터 재판까지 의뢰인의 권리를 보호하며, 최선의 변호를 제공합니다.", details: ["수사 단계 변호", "공판 변호", "피해자 대리", "범죄 피해 구제"] },
    { title: "가사 법률", subtitle: "FAMILY LAW", desc: "이혼, 상속, 양육권 등 가사 분야에서 의뢰인의 권익을 세심하게 보호합니다.", details: ["이혼 소송 및 조정", "재산분할", "양육권·면접교섭", "상속·유언"] },
    { title: "기업 법무", subtitle: "CORPORATE LAW", desc: "기업의 설립부터 운영, M&A까지 기업 활동 전반에 대한 법률 자문을 제공합니다.", details: ["기업 설립 및 구조조정", "M&A 자문", "계약서 검토 및 작성", "컴플라이언스"] },
    { title: "행정 소송", subtitle: "ADMINISTRATIVE LAW", desc: "행정처분 취소, 인허가 쟁송, 국가배상 등 행정법 분야의 전문 법률 서비스를 제공합니다.", details: ["행정처분 취소소송", "인허가 관련 쟁송", "국가배상 청구", "공법상 당사자소송"] },
    { title: "조세 법률", subtitle: "TAX LAW", desc: "세무 조사 대응, 조세 불복, 세금 관련 분쟁 해결 등 조세 분야 법률 서비스를 제공합니다.", details: ["세무 조사 대응", "조세 불복 심판·소송", "세금 관련 분쟁", "절세 컨설팅"] },
    { title: "부동산", subtitle: "REAL ESTATE", desc: "부동산 거래, 임대차, 재개발·재건축 등 부동산 관련 법률 서비스를 제공합니다.", details: ["매매·임대차 분쟁", "재개발·재건축", "등기 관련 소송", "건축 분쟁"] },
    { title: "계약서 작성·검토", subtitle: "CONTRACT REVIEW", desc: "각종 계약서의 작성, 검토, 수정을 통해 법적 리스크를 사전에 차단합니다.", details: ["계약서 작성·검토", "약관 검토", "MOU 작성", "국제 계약"] },
    { title: "내용증명", subtitle: "CERTIFIED MAIL", desc: "채권 추심, 계약 해지 등 법적 효력이 있는 내용증명 작성 및 발송을 대행합니다.", details: ["채권 추심 내용증명", "계약 해지 통보", "권리 주장 서면", "답변서 작성"] },
    { title: "합의 대행", subtitle: "SETTLEMENT NEGOTIATION", desc: "소송 전 합의 및 협상을 통해 의뢰인에게 최적의 결과를 도출합니다.", details: ["소송 전 합의 대행", "손해배상 협상", "분쟁 조정", "화해 절차"] },
    { title: "종합 법률상담", subtitle: "GENERAL CONSULTATION", desc: "다양한 법률 문제에 대한 종합적인 상담 및 자문 서비스를 제공합니다.", details: ["초기 법률 상담", "법률 의견서 작성", "리스크 진단", "분쟁 예방 자문"] },
  ] },
  "layout/nav": { items: [{ to: "/about", label: "사무소 소개" }, { to: "/practice", label: "업무분야" }, { to: "/lawyers", label: "변호사 소개" }, { to: "/consultation", label: "상담안내" }, { to: "/blog", label: "블로그" }, { to: "/cases", label: "성공 사례" }] },
  "layout/footer": { companyName: "법무법인 하이로", tagline: "진실된 마음으로 의뢰인의 목소리에 귀를 기울이며\n최선의 법률적 해법을 제시합니다", address: "서울특별시 서초구 서초대로 327, 5층", tel: "준비 중", fax: "02-594-5584", hours: "평일 09:00 - 18:00", note: "예약 상담 우선 진행", copyright: "© 2025-2026 법무법인 하이로 HIGH & LAW FIRM. All Rights Reserved." },
  "layout/contact": { phone: "준비 중", kakaoUrl: "https://pf.kakao.com/_xfMTxan/chat", telegramUrl: "https://t.me/YounSeHwan", telegramEnabled: true, kakaoEnabled: true, phoneEnabled: true },
  "theme/colors": { accentGold: "#3b6ea5", accentGoldHover: "#2e588a", heroDark: "#0f1923", textPrimary: "#1a1a1a", textSecondary: "#555" },
  "seo/global": { defaultOgImage: "" },
};

/** 깊은 복사 헬퍼 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
