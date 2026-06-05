/** 사이트 관리자 탭 정의, 기본 설정값, 공통 상수 */

/* ─── 탭 정의 ─── */
export const TABS = [
  { key: "home", label: "홈페이지" },
  { key: "hero-videos", label: "히어로 영상" },
  { key: "layout", label: "공통 (헤더/푸터)" },
  { key: "theme", label: "테마" },
  { key: "seo", label: "SEO" },
  { key: "announcements", label: "공지/배너" },
  { key: "about", label: "소개" },
  { key: "partners", label: "구성원" },
  { key: "practice", label: "업무 분야" },
  { key: "news", label: "소식" },
  { key: "recruit", label: "채용" },
  { key: "consultations", label: "상담문의" },
  { key: "history", label: "개발일지" },
];

/* ─── SEO 페이지 목록 ─── */
export const SEO_PAGES = [
  { key: "home", label: "홈페이지", url: "/" },
  { key: "about", label: "사무소 소개", url: "/about" },
  { key: "practice", label: "업무분야", url: "/practice" },
  { key: "lawyers", label: "구성원", url: "/partners" },
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

/* ─── 기본값: 현재 홈페이지 실제 구조 기반 ─── */
export const DEFAULT_SETTINGS = {
  /* ── 홈페이지 ── */
  "home/hero": {
    ctaPrimary: "사건 진단",
    ctaPrimaryLink: "/consultation",
    ctaSecondary: "전화 상담 02-6925-6757",
    ctaSecondaryLink: "tel:02-6925-6757",
  },
  "home/peopleHeader": {
    kicker: "Partners",
    title: "구성원 소개",
  },
  "home/practiceHeader": {
    kicker: "Practice Areas",
    title: "업무분야",
  },
  "home/newsHeader": {
    kicker: "BLOG & NEWS",
    title: "하이로 소식 & 법률 칼럼",
    description: "전문 변호사들이 직접 분석한 최신 판례 분석과 특화 분야 법률 정보를 제공합니다.",
  },
  "home/cta": {
    title: "지금 바로 전문 변호사와 상담하세요",
    items: [
      "정밀한 분석 후 솔직한 진단을 알려드립니다.",
      "관련 규정에 따른 정직한 비용만을 청구합니다.",
      "신뢰에 대한 헌신으로 고객에게 보답합니다.",
    ],
    buttonText: "상담 신청하기",
    buttonLink: "/consultation",
  },
  /* ── 소개 ── */
  "about/hero": {
    heading: "사무소 소개",
    subheading: "ABOUT HIGHLAW LAWFIRM",
    description: "노무·인사, 기업, 국제, 엔터테인먼트, 게임, 방산 등 각 분야의 인정받은 변호사들이 최적화된 법률 솔루션을 제공합니다."
  },
  "about/greetings": {
    title: "Message from Partners",
    eyebrow: "Introduction",
    content: "법무법인 하이로는 Loyalty, Dignity, Integrity를 핵심 가치로 삼아, 클라이언트에게 최적의 법률 솔루션을 제공하기 위해 설립된 Premium Lawfirm Service 브랜드입니다.\n\n우리는 단순히 법률 지식을 전달하는 데 그치지 않습니다. 각 사안의 본질을 꿰뚫는 전문성을 바탕으로 문제의 이면을 파고들어 그 흐름과 구조를 분석함으로써, 보다 근본적이고 지속 가능한 해결책을 제시하고자 하고 있습니다. 이는 HIGHLAW의 이름이 곧 ‘고객에 충실한 하이엔드 서비스’의 기준이 되고자 하는 우리의 다짐이기도 합니다.\n\n하이로의 구성원들은 모두 대형로펌에서 우수한 성과를 인정받은 전문가로서, 각자의 분야에서 풍부한 실무 경험과 학문적 깊이를 겸비하고 있습니다. 민사·형사소송은 물론 인사·노무, 국제법무, 기업법무, 부동산·건설, 지식재산권, 군사법 등 폭넓은 분야에서 탁월한 역량을 검증받았습니다. 각 분야의 전문 변호사들이 협력해 정밀하고 전략적인 솔루션을 제시하며, 언제나 고객에게 가장 적합한 방식으로 최선의 결과를 제공하는 조력자가 되고자 합니다.\n\n법무법인 하이로는 저희를 신뢰하는 클라이언트들이 언제든지 저희를 다시 찾아올 수 있는 믿음을 제공하고자 합니다. 한결같은 헌신과 지적인 품격, 그리고 변함없는 성실함으로 클라이언트의 신뢰를 지키고, 신뢰와 결과로 보답하는 법률 파트너가 되도록 하겠습니다.\n\n언제나 맞춤형 HIGH-END SERVICE를 제공하기 위해 끊임없는 연구와 정직한 태도로 클라이언트와 여정을 함께하는 파트너가 되어드리도록 하겠습니다.",
    partners: "법무법인 하이로 대표변호사 조덕재 · 김범 · 강민구"
  },
  "about/values": {
    eyebrow: "OUR PHILOSOPHY",
    title: "하이로의 철학",
    items: [
      { title: "신의성실", subtitle: "LOYALTY", desc: "의뢰인의 신뢰를 가장 소중한 가치로 여기며, 어떠한 순간에도 의뢰인의 이익과 권리를 최우선으로 수호합니다." },
      { title: "품격", subtitle: "DIGNITY", desc: "깊이 있는 학문적 성찰과 품위 있는 변론을 통해, 하이엔드 서비스에 걸맞은 차별화된 사법적 결과를 창출합니다." },
      { title: "정직", subtitle: "INTEGRITY", desc: "사건의 실체를 투명하게 공유하고, 흔들림 없는 법조 윤리를 준수하며 타협하지 않는 정의를 지향합니다." },
      { title: "전문성", subtitle: "EXPERTISE", desc: "대형 로펌 출신의 풍부한 실무 경험과 고도의 정밀 법리 분석으로 클라이언트에게 가장 정교한 솔루션을 제시합니다." }
    ]
  },
  "about/directions": {
    title: "법무법인 하이로 서울 사무소",
    eyebrow: "DIRECTIONS",
    address: "서울특별시 강남구 테헤란로 141 (역삼KR빌딩) 15층 (우편번호: 06132)",
    subway: "2호선 역삼역 4번 출구 바로 앞 역삼KR빌딩(KR타워) 15층입니다. (4번 출구에서 도보 약 1분 이내)",
    bus: "역삼역.포스코타워역삼 정류장 하차\n- 간선버스: 147, 242, 350\n- 지선버스: 3412, 4432",
    parking: "건물 내 기계식 및 자주식 지하 주차장을 이용해 주세요.\n법률 상담 방문 차량에 한하여 2시간 무료 주차권을 인포데스크에서 제공해 드립니다.",
    phone: "02-6925-6757",
    fax: "02-6925-6758",
    email: "contact@highlaw.co.kr",
    naverMapUrl: "https://map.naver.com/v5/search/%EB%B2%95%EB%AC%B5%EB%B2%95%EC%9D%B8%20%ED%95%98%EC%9D%B4%EB%A1%9C",
    kakaoMapUrl: "https://map.kakao.com/?q=%EB%B2%95%EB%AC%B5%EB%B2%95%EC%9D%B8%20%ED%95%98%EC%9D%B4%EB%A1%9C"
  },
  "about/probono": {
    title: "사회적 책임과 온기를 채우는 하이로의 공익 활동",
    eyebrow: "PRO BONO",
    description: "법무법인 하이로는 법치주의 확립과 사회 구성원 모두의 보편적 인권 옹호를 중요한 사명으로 여깁니다. 우리가 지닌 법률 전문성을 바탕으로 정의의 온기가 사회 곳곳에 미치도록 지속 가능한 사회공헌 활동을 실천합니다.",
    items: [
      {
        badge: "군장병 무료상담",
        title: "군 장병 권익 및 인권 보호",
        desc: "격오지에 근무하거나 비용 문제로 법적 조력을 받지 못해 부당한 징계나 군형사 위기에 처한 영외 군장병 및 하급 간부들을 위한 무료 소송 지원과 무료 전화 법률 상담 창구를 운영합니다."
      },
      {
        badge: "비정규직 노동법률지원",
        title: "취약 계층 노동자 법률 구조",
        desc: "불법파견의 부당함에 직면한 비정규직 노동자, 그리고 임금 체불과 부당해고 등의 사각지대에 방치된 플랫폼 노동자 및 5인 미만 소규모 사업장 소속 근로자들의 신속한 보상과 법적 안정을 위해 힘씁니다."
      },
      {
        badge: "게임소비자 권익보호",
        title: "청년 게이머 및 디지털 소비자 권익 옹호",
        desc: "대형 플랫폼 및 게임사들의 불공정 거래 조건이나 기만 행위에 처한 청년 게이머 집단의 정당한 권익 보호를 위해, 무료 공익 단체소송 대리 및 관련 법제 개선을 위한 학술 연구와 정책 제안을 정기적으로 추진합니다."
      },
      {
        badge: "무료 교육 나눔",
        title: "지역사회 상생 및 무료 법률 교육",
        desc: "사법 접근성이 낮은 서민 가구와 예비 청년 창업자, 노동 분쟁 예방에 목마른 구직 청년층을 위해 필수적인 기초 노동법 지식과 생활 법률 세미나를 정기적으로 주최하여 지식을 공유합니다."
      }
    ]
  },
  "about/history": {
    title: "어제를 돌아보며 내일을 준비하는 하이로의 발자취",
    eyebrow: "HISTORY",
    items: [
      {
        year: "2026 - 현재",
        events: [
          {
            title: "전문성 공고화 및 디지털 사법지원 시스템 고도화",
            desc: "첫 상담부터 변호사가 모든 서면을 직접 전담하는 책임 상담제 및 인공지능 기반 사법 보조 데이터 분석 시스템을 구축하여 의뢰인 밀착 대응 시스템을 확대 고도화하였습니다."
          }
        ]
      },
      {
        year: "2025",
        events: [
          {
            title: "서울 강남 오피스 확장 이전",
            desc: "서울특별시 강남구 테헤란로 141 (역삼KR빌딩) 15층으로 오피스를 확장 이전하여, 불법파견 및 게임사기 관련 주요 거점 의뢰인들과 소통할 수 있는 프리미엄 컨설팅 룸과 인프라를 확충하였습니다."
          }
        ]
      },
      {
        year: "2024",
        events: [
          {
            title: "동일 분야 최고 실력의 파트너십 완성",
            desc: "노동법 및 불법파견 사건의 권위자인 조덕재 대표변호사, 게임 소송계의 선구자인 김범 대표변호사, 군사 전문 행정 분야의 강민구 대표변호사가 파트너십을 맺어 3대 대표변호사 체제를 정립하였습니다."
          }
        ]
      },
      {
        year: "2023",
        events: [
          {
            title: "법무법인 하이로 공식 출범",
            desc: "불법파견, 게임사기, 노동, 군사건 등 고유의 노하우가 집적된 4대 특수 사법 분야의 독보적인 법률 권익 수호를 기치로 법무법인 하이로가 설립되어 법조계에 첫발을 내디뎠습니다."
          }
        ]
      }
    ]
  },
  /* ── 구성원 ── */
  "partners/hero": {
    heading: "구성원",
    subheading: "PEOPLE",
    description: "각 분야 전문가들이 유기적으로 협력하여\n의뢰인에게 최선의 솔루션을 제공합니다"
  },
  /* ── 업무분야 ── */
  "practice/hero": { heading: "업무 분야", subheading: "Expertise" },
  "practice/intro": { description: "법무법인 하이로는 다양한 법률 분야에서 축적된 경험과 전문성을 바탕으로 의뢰인에게 최적의 법률 솔루션을 제공합니다." },
  "practice/painPoints": {
    items: [
      { text: "복잡한 **민사소송**과 대여금·공사대금·손해배상 청구 문제로 앞날이 막막하다" },
      { text: "갑작스러운 **형사 사건**에 연루되어 경찰·검찰 수사와 구속 및 처벌 위험에 처해 있다" },
      { text: "부당해고, 임금체불 및 취업규칙·근로계약 등 **인사 노무** 관련 규정 정비가 시급하다" },
      { text: "경영권분쟁, **기업 경영** 리스크, 주권 등 법적 리스크 관리 및 해결이 필요하다" },
      { text: "**중대재해**처벌법 및 산업안전보건법 준수를 위한 안전보건확보의무 구축이 어렵다" },
      { text: "**스타트업** 창업, 주주간 계약(SHA), 스톡옵션 등 성장 단계별 전문 자문이 필요하다" },
      { text: "**이혼**, 재산분할, 유산 상속 및 유류분 반환 소송 등으로 심각한 가족 간 갈등을 겪고 있다" },
      { text: "군 조직 내의 특수한 **군형사**사건 수사나 군인·군무원 보통징계위원회 징계에 직면했다" },
      { text: "국가, 지자체 또는 행정기관의 부당한 **행정처분**으로 불이익을 겪고 있다" },
      { text: "**외국** 기업·외국인과의 법적 분쟁이나 출입국 및 이민 장벽에 부딪혔다" },
      { text: "조달 계약상의 지체상금 분쟁 및 **방위사업** 입찰참가제한 처분 위기에 처했다" },
      { text: "전속계약 분쟁, **저작권** 침해, 글로벌 국제 분쟁에 대한 정밀한 조력이 필요하다" }
    ]
  },
  "practice/caseResults": {
    items: [
      { amount: "1:1", unit: "직접상담", label: "담당 전문 변호사 1:1 밀착 케어", category: "DIRECT" },
      { amount: "정밀", unit: "법리분석", label: "판례 빅데이터 기반 심층 분석", category: "LAW" },
      { amount: "신속", unit: "초동대응", label: "골든타임 내 긴급 변호인 개입", category: "SPEED" },
      { amount: "신의", unit: "성실의무", label: "의뢰인의 권익을 끝까지 책임지는 헌신", category: "LOYALTY" }
    ]
  },
  "practice/advantages": {
    items: [
      {
        iconName: "Target",
        title: "분야별 고도의 전문성",
        desc: "각 법률 영역에서 실무 담당자로 근무하였거나 대형로펌에서 오랜 경험과 노하우를 쌓은 전담 변호사가 사건을 맡아 정밀한 판례 분석과 법리 해석을 토대로 맞춤형 해법을 도출합니다."
      },
      {
        iconName: "Shield",
        title: "현장과 절차의 정교한 이해",
        desc: "사실조사와 증거 수집부터 법원, 검찰, 노동위원회, 군사법원, 행정기관 등 각 기관별 특수한 절차적 메커니즘을 정확히 파악하여 빈틈없이 조력합니다."
      },
      {
        iconName: "Clock",
        title: "신속하고 명확한 초기 대응",
        desc: "소송 및 분쟁 해결의 성패는 초기 대응에 달려 있습니다. 하이로는 상담 진행 후 신속하게 사건의 핵심 쟁점과 향후 대응 로드맵을 제공합니다."
      },
      {
        iconName: "Users",
        title: "일관성 있는 통합 해결",
        desc: "자문과 협상부터 소송 수행까지, 민·형사 및 행정 절차가 유기적으로 연계된 복잡한 사건도 전담 변호사가 처음부터 끝까지 일관된 맥락으로 책임지고 해결합니다."
      }
    ]
  },
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
  /* ── 소식 ── */
  "news/hero": {
    heading: "블로그",
    subheading: "BLOG",
    description: "법률 이슈와 판례 분석, 실무 가이드를 제공합니다."
  },
  /* ── 채용 ── */
  "recruit/hero": {
    heading: "인재 채용",
    subheading: "CAREERS AT HIGHLAW",
    description: "신의성실(Loyalty)과 품격(Dignity)을 바탕으로, 탁월한 법률 솔루션을 창출해 나갈 하이로의 인재를 모십니다."
  },
  "recruit/apply": {
    steps: [
      { step: "01", title: "온라인 지원", desc: "공식 채용 시스템을 통해 인적사항 및 이력서를 등록합니다." },
      { step: "02", title: "서류 전형", desc: "제출하신 서류를 바탕으로 종합적인 자격 요건을 정밀 검토합니다." },
      { step: "03", title: "면접 전형", desc: "실무진 및 파트너 면접을 거쳐 전문 역량과 가치관을 평가합니다." },
      { step: "04", title: "최종 합격", desc: "개별 전형 결과를 통보하고 처우 및 근무 조건을 최종 협의합니다." }
    ]
  },
  "recruit/contact": {
    email: "mingukang@highlaw.net"
  },
  /* ── 상담문의 ── */
  "consultations/hero": {
    heading: "상담안내",
    subheading: "CONSULTATION"
  },
  "consultations/steps": {
    items: [
      { step: "01", title: "사건 분석 및 진단", desc: "초기 자료를 신속히 검토하고 핵심 쟁점과 위험요소를 명확히 정리합니다." },
      { step: "02", title: "전략 설계 및 실행", desc: "협상·소송·집행 단계별 목표를 설정하고 일정 중심으로 추진합니다." },
      { step: "03", title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." },
      { step: "04", title: "결과 관리 및 사후 대응", desc: "판결 이후 이행, 추가 분쟁 예방까지 의뢰인의 리스크를 관리합니다." }
    ]
  },
  "consultations/contact": {
    phone: "준비 중",
    email: "준비 중",
    hours: "평일 09:00 - 18:00 (예약 상담 우선)"
  },
  "consultations/faq": {
    items: [
      { q: "상담 비용은 어떻게 되나요?", a: "초기 상담은 사건의 복잡도와 분야에 따라 상이합니다. 카카오톡 또는 상담 신청 폼으로 문의하시면 상담 유형에 맞는 안내를 드립니다." },
      { q: "상담 예약은 어떻게 하나요?", a: "카카오톡 또는 위 상담 신청 폼을 통해 예약하실 수 있습니다. 예약 상담이 우선 진행됩니다." },
      { q: "방문 상담이 가능한가요?", a: "네, 서울특별시 강남구 테헤란로 141, 15층 사무소에서 직접 상담이 가능합니다. 사전 예약을 권장드립니다." },
      { q: "상담 후 수임이 필수인가요?", a: "아닙니다. 상담을 통해 사건의 방향성을 파악하신 후 자유롭게 결정하실 수 있습니다." },
      { q: "어떤 분야를 전문으로 하나요?", a: "민사, 형사, 인사노무, 중대재해, 기업, 방산, 군형사, 엔터테인먼트, 행정, 가사 및 상속, 지적재산권, 이민을 비롯한 주요 분야에 대해 검증된 실무 역량과 정교한 법리 해석을 토대로 최적의 법률 솔루션을 제공합니다." },
      { q: "비밀이 보장되나요?", a: "변호사법에 따라 상담 내용은 철저히 비밀이 보장됩니다. 모든 정보는 안전하게 관리됩니다." }
    ]
  },
  "layout/nav": { items: [{ to: "/about", label: "사무소 소개" }, { to: "/practice", label: "업무분야" }, { to: "/partners", label: "구성원" }, { to: "/consultation", label: "상담안내" }, { to: "/blog", label: "블로그" }, { to: "/cases", label: "성공 사례" }] },
  "layout/footer": { companyName: "법무법인 하이로", tagline: "진실된 마음으로 의뢰인의 목소리에 귀를 기울이며\n최선의 법률적 해법을 제시합니다", address: "서울특별시 서초구 서초대로 327, 5층", tel: "준비 중", fax: "02-594-5584", hours: "평일 09:00 - 18:00", note: "예약 상담 우선 진행", copyright: "© 2025-2026 법무법인 하이로 HIGH & LAW FIRM. All Rights Reserved." },
  "layout/contact": { phone: "02-6925-6757", kakaoUrl: "https://pf.kakao.com/_highlawofficial/chat", telegramUrl: "https://t.me/YounSeHwan", instagramUrl: "https://www.instagram.com/highlaw.official?igsh=ZGg2N3hmaDNkZjJw", naverBlogUrl: "https://blog.naver.com/highlaw", youtubeUrl: "https://www.youtube.com/@%ED%95%98%EC%9D%B4%EB%A1%9C%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4", telegramEnabled: true, kakaoEnabled: true, phoneEnabled: true, instagramEnabled: true, naverBlogEnabled: true, youtubeEnabled: true },
  "theme/colors": { accentGold: "#3b6ea5", accentGoldHover: "#2e588a", heroDark: "#0f1923", textPrimary: "#1a1a1a", textSecondary: "#555" },
  "seo/global": { defaultOgImage: "" },
};

/** 깊은 복사 헬퍼 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
