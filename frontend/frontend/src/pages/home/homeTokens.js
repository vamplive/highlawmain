/**
 * 홈페이지 색상·폰트·반응형 스타일 토큰 + 섹션 데이터 상수.
 * 여러 섹션 컴포넌트가 공유하므로 단일 파일로 분리.
 */

export const C = {
  bg: "#ffffff",
  bgLight: "#f6f8fb",
  navy: "#0a1628",
  navyLight: "rgba(10,22,40,0.06)",
  text: "#1a1a1a",
  textMid: "#555555",
  textMuted: "#999999",
  accent: "#1a3a6b",
  border: "#e5e8ed",
  white: "#ffffff",
};

export const F = {
  sans: "'Pretendard', 'Noto Sans KR', sans-serif",
  serif: "'Cormorant Garamond', 'Noto Serif KR', serif",
  mono: "'JetBrains Mono', monospace",
};

export const PRACTICE_AREAS = [
  { ko: "불법파견", en: "Illegal Dispatch", to: "/practice/illegal-dispatch", desc: "위장도급·파견법 위반·직접고용 청구·차별시정", descEn: "Disguised contracting, dispatch-law violations, direct-hire claims, anti-discrimination remedies" },
  { ko: "게임사기", en: "Game Fraud", to: "/practice/game-fraud", desc: "아이템 거래 사기·계정 도용·게임머니 편취·운영사 제재", descEn: "Item-trade fraud, account theft, in-game currency embezzlement, operator sanctions" },
  { ko: "노동", en: "Labor Law", to: "/practice/labor", desc: "임금체불·부당해고·산업재해·직장 내 괴롭힘", descEn: "Wage claims, wrongful dismissal, industrial accidents, workplace harassment" },
  { ko: "군사건", en: "Military Cases", to: "/practice/military", desc: "군형사·군징계·국가배상·병역 분쟁", descEn: "Military criminal cases, disciplinary appeals, state-compensation and service disputes" },
];

export const SOLUTION_CARDS = [
  { icon: "⚖️", title: "정밀한 법률 분석", titleEn: "Precise Legal Analysis", desc: "사건의 핵심 쟁점을 정확히 파악하고, 축적된 경험과 전문성으로 최적의 전략을 수립합니다.", descEn: "We identify the core issues and build a focused strategy from practical experience." },
  { icon: "📋", title: "체계적 사건 관리", titleEn: "Structured Case Management", desc: "의뢰인의 목표를 정확히 이해하고, 단계별로 투명한 진행 상황을 공유합니다.", descEn: "We manage each matter by clear milestones and keep clients informed throughout." },
  { icon: "🔍", title: "깊이 있는 리서치", titleEn: "In-Depth Research", desc: "깊이 있는 판례 분석과 전문적 접근으로 의뢰인에게 유리한 법률 솔루션을 제시합니다.", descEn: "We combine case-law research with practical judgment to find stronger legal options." },
];

export const HOME_COPY = {
  ko: {
    seoTitle: "법무법인 하이로",
    seoDescription: "법무법인 하이로 — 강남 테헤란로. 불법파견·게임사기·노동·군사건만 전문으로 다루는 특화 로펌. 전문 변호사가 직접 상담합니다.",
    heroPrimary: "30초 무료 사건 진단",
    heroSecondary: "전화 상담 02-594-5583",
    solutionKicker: "How We Work",
    solutionTitle: "특수 분야의 깊이",
    solutionDescription: "절차와 판례를 깊이 이해하는 변호사가 직접 사건을 다룹니다",
    practiceKicker: "Practice Areas",
    practiceTitle: "업무분야",
    peopleKicker: "Our Lawyers",
    peopleTitle: "구성원 소개",
    ctaTitle: "지금 바로 전문 변호사와 상담하세요",
    ctaDescription: "불법파견·게임사기·노동·군사건—초기 대응이 결과를 결정합니다.",
    ctaButton: "상담 신청하기",
  },
  en: {
    seoTitle: "HIGH & LAW FIRM",
    seoDescription: "HIGH & LAW FIRM provides direct attorney consultation focused on illegal dispatch, game fraud, labor disputes, and military cases in Gangnam, Seoul.",
    heroPrimary: "Request Consultation",
    heroSecondary: "View Practice Areas",
    solutionKicker: "How We Work",
    solutionTitle: "Depth in Niche Practice",
    solutionDescription: "Attorneys who actually understand the procedures and precedents in each specialized field",
    practiceKicker: "Practice Areas",
    practiceTitle: "Practice Areas",
    peopleKicker: "Our Lawyers",
    peopleTitle: "Our Lawyers",
    ctaTitle: "Speak Directly With a Specialist Attorney",
    ctaDescription: "Illegal dispatch, game fraud, labor, military cases — early response shapes the outcome.",
    ctaButton: "Request Consultation",
  },
};

export const HOME_DEFAULTS = {
  hero: {
    heading: "산재·중대재해, 군사건, 게임사기",
    subheading: "법무법인 하이로",
    tagline: "사건 결과로 증명합니다",
    ctaPrimary: "30초 무료 사건 진단",
    ctaPrimaryLink: "/consultation",
    ctaSecondary: "전화 상담 02-594-5583",
    ctaSecondaryLink: "tel:02-594-5583",
  },
  cta: {
    message: "법률 문제로 고민이 있으신가요?",
    buttonText: "상담 예약하기 →",
    buttonLink: "/consultation",
  },
};

export const RESPONSIVE_STYLES = `
  .hp-section {
    height: 100vh;
    min-height: 720px;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 64px 48px;
    overflow: hidden;
  }
  .hp-section-inner {
    width: 100%;
    max-width: 1160px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .hp-kicker {
    font-family: var(--font-serif);
    font-size: 13px;
    letter-spacing: 0.25em;
    color: var(--accent-gold);
    margin: 0 auto 16px;
    text-transform: uppercase;
    text-align: center !important;
    font-weight: 500;
  }
  .hp-title {
    font-family: var(--font-serif);
    font-size: clamp(1.8rem, 3.4vw, 2.8rem);
    font-weight: 400;
    color: ${C.text};
    line-height: 1.35;
    margin: 0 auto;
    text-align: center !important;
  }
  .hp-copy {
    font-family: ${F.sans};
    font-size: 15px;
    color: ${C.textMid};
    line-height: 1.85;
    margin: 16px auto 0;
    text-align: center !important;
    max-width: 600px;
  }
  .hp-section-centered {
    text-align: center !important;
    margin-bottom: 56px;
  }
  .hp-card {
    border: 1px solid ${C.border};
    border-radius: 8px;
    background: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .hp-card:hover {
    border-color: rgba(26,58,107,0.28);
    box-shadow: 0 18px 45px rgba(10,22,40,0.08);
    transform: translateY(-2px);
  }
  .hp-scroll-indicator {}

  @media (max-width: 768px) {
    .hp-section {
      height: 100vh;
      min-height: 560px;
      padding: 40px 20px;
    }
    .hp-scroll-indicator { display: none !important; }
  }

  @media (max-width: 480px) {
    .hp-cta-buttons { flex-direction: column !important; gap: 16px !important; align-items: center !important; }
  }
`;

export const FALLBACK_LAWYERS = [
  {
    id: "jodeokjae",
    name: "조덕재",
    nameEn: "Cho Deok-Jae",
    position: "대표변호사",
    photoUrl: "/lawyers/jodeokjae.jpg",
    specialties: JSON.stringify(["노동", "중대재해", "형사"]),
  },
  {
    id: "kimbeom",
    name: "김범",
    nameEn: "Kim Beom",
    position: "대표변호사",
    photoUrl: "/lawyers/kimbeom.jpg",
    specialties: JSON.stringify(["송무", "기업자문"]),
  },
  {
    id: "kangmingu",
    name: "강민구",
    nameEn: "Kang Min-Gu",
    position: "대표변호사",
    photoUrl: "/lawyers/kangmingu.jpg",
    specialties: JSON.stringify(["노동", "인사", "중대재해"]),
  },
];

/**
 * 변호사 전문분야 문자열을 배열로 파싱
 * @param {string} raw - 콤마/세미콜론/가운뎃점 구분 문자열
 * @returns {string[]}
 */
export function parseSpecialtyList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {}
  return raw.split(/[,;·]/).map((s) => s.trim()).filter(Boolean);
}
