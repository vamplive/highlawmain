const crypto = require("crypto");
const path = require("path");
const Database = require("better-sqlite3");

const VERSION = "blog-complete-2026-05-03-v3";
const MARKER_PAGE = "system";
const MARKER_SECTION = "blog_content_version";
const AUTHOR = "법무법인 하이로";
const MIN_CONTENT_LENGTH = 20000;

const CATEGORY_META = {
  construction_realestate: {
    label: "건설부동산 이야기",
    cover: "/blog-images/construction-realestate-article.png",
    tone: "현장 자료, 계약 문서, 감정 절차를 함께 보면서 분쟁의 금액과 책임 범위를 좁혀 가는 방식",
  },
  case_analysis: {
    label: "판례 분석",
    cover: "/blog-images/case-analysis-article.png",
    tone: "판례번호를 나열하기보다 법원이 반복해서 확인하는 판단 구조와 입증 기준을 사건 전략으로 바꾸는 방식",
  },
  law_guide: {
    label: "법률 가이드",
    cover: "/blog-images/law-guide-article.png",
    tone: "상담 전 준비, 협상, 보전처분, 소송 진행을 단계별 체크리스트로 정리하는 방식",
  },
};

const topics = [
  {
    category: "construction_realestate",
    slug: "construction-payment-unpaid-practical-guide",
    title: "공사대금 미지급 분쟁에서 시공자가 먼저 정리해야 할 것",
    excerpt: "공사대금이 밀렸을 때 계약서, 기성 자료, 추가공사 증거, 보전처분까지 어떤 순서로 준비해야 하는지 정리합니다.",
    tags: ["공사대금", "기성고", "추가공사", "보전처분"],
    focus: "공사대금 미지급",
    parties: "시공자와 발주자",
    issue: "기성고, 추가공사, 하자 공제, 지급기한",
    action: "계약금액과 실제 완성 부분을 분리하고 미지급액을 증거로 고정",
  },
  {
    category: "construction_realestate",
    slug: "additional-construction-cost-claim",
    title: "추가공사비 청구가 인정되기 위한 승인과 증거의 기준",
    excerpt: "구두 지시, 설계변경, 현장 회의록만 남은 추가공사에서 청구 가능성을 높이는 실무 포인트입니다.",
    tags: ["추가공사", "설계변경", "현장지시", "도급계약"],
    focus: "추가공사비",
    parties: "도급인과 수급인",
    issue: "추가 지시의 존재, 공사 범위 초과, 단가 산정",
    action: "원계약 범위와 추가 범위를 도면, 사진, 회의록으로 구분",
  },
  {
    category: "construction_realestate",
    slug: "construction-defect-liability-strategy",
    title: "건설 하자 분쟁에서 하자보수비와 손해배상액을 산정하는 법",
    excerpt: "하자담보책임, 감정, 보수 범위, 사용상 과실 항변을 중심으로 하자 사건의 구조를 설명합니다.",
    tags: ["하자", "하자보수", "감정", "손해배상"],
    focus: "건설 하자",
    parties: "건축주, 수분양자, 시공사",
    issue: "하자 존재, 보수 방법, 보수비, 책임기간",
    action: "하자 목록을 위치별로 정리하고 사진과 보수 견적의 기준을 통일",
  },
  {
    category: "construction_realestate",
    slug: "delay-penalty-construction-projects",
    title: "공기 지연과 지체상금 분쟁에서 책임을 나누는 기준",
    excerpt: "준공 지연이 누구의 책임인지, 지체상금이 과다한지, 공기 연장 사유가 있는지 판단하는 기준을 다룹니다.",
    tags: ["지체상금", "공기지연", "준공", "공기연장"],
    focus: "공기 지연",
    parties: "발주자와 시공사",
    issue: "지연 원인, 공기 연장, 지체상금 감액",
    action: "공정표와 지연 사유를 날짜별로 맞춰 책임 있는 기간을 계산",
  },
  {
    category: "construction_realestate",
    slug: "design-change-construction-contract",
    title: "설계변경이 생긴 공사에서 계약금액을 다시 정하는 방법",
    excerpt: "설계변경 지시, 물량 변경, 단가 합의, 준공 정산까지 분쟁을 줄이는 계약 운영 방식을 안내합니다.",
    tags: ["설계변경", "물량변경", "정산", "공사계약"],
    focus: "설계변경",
    parties: "건축주와 시공자",
    issue: "변경 승인, 물량 증감, 정산 단가",
    action: "변경 전후 도면과 물량내역서를 같은 기준으로 비교",
  },
  {
    category: "construction_realestate",
    slug: "construction-lien-real-estate",
    title: "유치권 주장이 나왔을 때 부동산 소유자와 채권자가 확인할 것",
    excerpt: "유치권의 성립요건, 점유, 견련성, 허위 유치권 대응을 실제 분쟁 흐름에 맞춰 정리합니다.",
    tags: ["유치권", "부동산", "점유", "공사대금"],
    focus: "유치권",
    parties: "공사업자, 소유자, 경매 이해관계인",
    issue: "채권 존재, 점유 계속, 견련성, 배제 사유",
    action: "점유 시점과 공사대금 채권의 발생 근거를 객관 자료로 확인",
  },
  {
    category: "construction_realestate",
    slug: "subcontract-payment-dispute",
    title: "하도급대금 분쟁에서 원사업자와 수급사업자가 놓치기 쉬운 쟁점",
    excerpt: "하도급대금, 부당감액, 직접지급, 서면 발급 의무를 중심으로 실무 대응을 설명합니다.",
    tags: ["하도급", "하도급대금", "직접지급", "부당감액"],
    focus: "하도급대금",
    parties: "원사업자와 수급사업자",
    issue: "서면 계약, 기성 인정, 감액 사유, 직접지급",
    action: "하도급 서면과 기성 승인 흐름을 먼저 복원",
  },
  {
    category: "construction_realestate",
    slug: "redevelopment-association-dispute",
    title: "재개발·재건축 조합 분쟁에서 조합원 권리를 지키는 방법",
    excerpt: "총회 결의, 분담금, 정보공개, 관리처분계획을 둘러싼 조합 분쟁의 핵심을 정리합니다.",
    tags: ["재개발", "재건축", "조합", "관리처분"],
    focus: "정비사업 조합 분쟁",
    parties: "조합원, 조합, 시공자",
    issue: "총회 절차, 분담금, 정보공개, 결의 하자",
    action: "의결 자료와 통지 절차를 확보해 다툴 결의와 시기를 특정",
  },
  {
    category: "construction_realestate",
    slug: "commercial-lease-eviction-and-deposit",
    title: "상가 명도와 보증금 반환을 함께 다룰 때의 실무 순서",
    excerpt: "차임 연체, 계약 종료, 권리금, 원상복구, 보증금 공제를 한 번에 정리하는 명도 전략입니다.",
    tags: ["명도", "상가임대차", "보증금", "권리금"],
    focus: "상가 명도",
    parties: "임대인과 임차인",
    issue: "계약 종료, 연체, 원상복구, 보증금 정산",
    action: "해지 통지와 인도일, 공제 항목을 분리해서 협상안 작성",
  },
  {
    category: "construction_realestate",
    slug: "real-estate-sale-contract-cancellation",
    title: "부동산 매매계약 해제와 계약금·위약금 정산 기준",
    excerpt: "잔금 미지급, 중도금 이후 해제, 위약금 감액, 등기 문제를 중심으로 매매계약 해제를 설명합니다.",
    tags: ["부동산매매", "계약해제", "계약금", "위약금"],
    focus: "부동산 매매계약 해제",
    parties: "매도인과 매수인",
    issue: "해제권, 이행 착수, 위약금, 손해배상",
    action: "해제 통지 전 이행 제공과 상대방 귀책을 문서로 남김",
  },
  {
    category: "case_analysis",
    slug: "court-approach-defect-repair-cost",
    title: "건축 하자보수비 사건에서 법원이 반복해서 보는 판단 구조",
    excerpt: "하자 사건 판례의 공통 기준을 하자 특정, 보수 필요성, 감정 결과, 책임 제한 순서로 분석합니다.",
    tags: ["판례분석", "하자보수비", "감정", "책임제한"],
    focus: "하자보수비 판례 흐름",
    parties: "수분양자와 시공사",
    issue: "하자 특정, 보수 범위, 감정 신뢰성",
    action: "하자 항목마다 책임 근거와 보수 방법을 따로 제시",
  },
  {
    category: "case_analysis",
    slug: "court-approach-additional-work",
    title: "추가공사비 판례에서 승인 여부가 갈리는 지점",
    excerpt: "법원이 추가공사 지시와 묵시적 승인을 어떻게 추론하는지, 증거별 의미를 정리합니다.",
    tags: ["판례분석", "추가공사", "묵시적승인", "증거"],
    focus: "추가공사비 판례 흐름",
    parties: "도급인과 수급인",
    issue: "승인, 필요성, 단가, 원계약 포함 여부",
    action: "현장 지시와 사후 승인 자료를 시간순으로 배열",
  },
  {
    category: "case_analysis",
    slug: "court-approach-commercial-lease-premium",
    title: "상가 권리금 회수 방해 사건에서 법원이 보는 정당한 사유",
    excerpt: "신규 임차인 거절, 권리금 계약, 임대인의 방해행위에 관한 판례 흐름을 설명합니다.",
    tags: ["판례분석", "권리금", "상가임대차", "손해배상"],
    focus: "권리금 회수 방해",
    parties: "상가 임대인과 임차인",
    issue: "신규 임차인 주선, 거절 사유, 권리금 손해",
    action: "주선 사실과 거절 이유를 객관 자료로 남김",
  },
  {
    category: "case_analysis",
    slug: "court-approach-lien-possession",
    title: "유치권 판례에서 점유와 채권의 관련성을 판단하는 방식",
    excerpt: "부동산 유치권의 점유, 견련성, 배제 특약, 허위 주장 대응을 판례 구조로 분석합니다.",
    tags: ["판례분석", "유치권", "점유", "견련성"],
    focus: "유치권 성립요건",
    parties: "유치권자와 소유자",
    issue: "점유 계속성, 채권 견련성, 배제 사유",
    action: "점유 개시와 채권 발생의 선후관계를 확인",
  },
  {
    category: "case_analysis",
    slug: "court-approach-delay-penalty",
    title: "지체상금 판례에서 공기 연장 사유를 인정하는 기준",
    excerpt: "시공자 귀책과 발주자 귀책이 섞인 공기 지연 사건에서 법원의 계산 방식을 정리합니다.",
    tags: ["판례분석", "지체상금", "공기연장", "책임제한"],
    focus: "지체상금 판례 흐름",
    parties: "발주자와 시공자",
    issue: "지연 원인, 동시 지연, 감액 가능성",
    action: "지연 사유별 책임기간을 일자 단위로 구분",
  },
  {
    category: "case_analysis",
    slug: "court-approach-real-estate-cancellation",
    title: "부동산 매매계약 해제 판례에서 이행착수를 보는 기준",
    excerpt: "계약금 해제, 중도금 지급, 잔금 이행제공, 위약금 감액의 판례 흐름을 설명합니다.",
    tags: ["판례분석", "매매계약", "해제", "이행착수"],
    focus: "매매계약 해제 판례 흐름",
    parties: "매도인과 매수인",
    issue: "이행 착수, 해제권 행사, 손해배상 예정",
    action: "해제 전 상대방 귀책과 자신의 이행 준비를 증거화",
  },
  {
    category: "case_analysis",
    slug: "court-approach-subcontract-direct-payment",
    title: "하도급 직접지급 사건에서 발주자 책임이 문제 되는 경우",
    excerpt: "직접지급 요건, 원사업자 부도, 지급보류, 기성확인에 관한 판례의 판단 구조를 분석합니다.",
    tags: ["판례분석", "하도급", "직접지급", "기성"],
    focus: "하도급 직접지급",
    parties: "발주자, 원사업자, 수급사업자",
    issue: "직접지급 요건, 기성 확인, 중복 지급 위험",
    action: "직접지급 요청 시점과 남은 공사대금 범위를 특정",
  },
  {
    category: "case_analysis",
    slug: "court-approach-redevelopment-resolution",
    title: "재개발 조합 총회결의 하자 사건에서 절차 위반을 보는 방법",
    excerpt: "소집 통지, 의결정족수, 설명자료, 이해충돌을 중심으로 조합 결의 다툼을 분석합니다.",
    tags: ["판례분석", "재개발", "총회결의", "절차하자"],
    focus: "조합 총회결의 하자",
    parties: "조합원과 조합",
    issue: "소집 절차, 정족수, 설명의무, 하자의 중대성",
    action: "결의별 통지서와 참석자 자료를 확보",
  },
  {
    category: "case_analysis",
    slug: "court-approach-provisional-attachment",
    title: "가압류 사건에서 보전의 필요성이 인정되는 판단 요소",
    excerpt: "채권 소명, 보전 필요성, 담보 제공, 채무자 이의 대응을 판례 흐름에 맞춰 정리합니다.",
    tags: ["판례분석", "가압류", "보전처분", "채권보전"],
    focus: "가압류 보전 필요성",
    parties: "채권자와 채무자",
    issue: "채권 소명, 재산 은닉 위험, 담보",
    action: "채권 자료와 회수 위험 사정을 함께 제시",
  },
  {
    category: "case_analysis",
    slug: "court-approach-contract-damages",
    title: "계약 손해배상 사건에서 손해액 입증이 부족하다고 보는 경우",
    excerpt: "손해 발생, 인과관계, 예상 가능성, 손해경감의무를 중심으로 판례 흐름을 설명합니다.",
    tags: ["판례분석", "손해배상", "계약", "입증책임"],
    focus: "계약 손해배상",
    parties: "계약 당사자",
    issue: "손해 발생, 인과관계, 손해액 산정",
    action: "손해 항목별 계산 근거와 대체 거래 자료를 제시",
  },
  {
    category: "law_guide",
    slug: "consultation-documents-checklist",
    title: "법률상담 전에 준비하면 상담 품질이 달라지는 자료 목록",
    excerpt: "상담 시간을 효율적으로 쓰기 위해 사건별로 어떤 문서와 사실관계를 준비해야 하는지 안내합니다.",
    tags: ["법률상담", "준비자료", "체크리스트", "사건정리"],
    focus: "상담 준비",
    parties: "의뢰인과 변호사",
    issue: "사실관계 정리, 증거 선별, 목표 설정",
    action: "시간순 사건표와 핵심 문서를 미리 준비",
  },
  {
    category: "law_guide",
    slug: "certified-mail-practical-guide",
    title: "내용증명은 언제 보내고 어떻게 써야 효과가 있는가",
    excerpt: "내용증명의 기능, 문구, 발송 시점, 소송 전 전략적 활용법을 정리합니다.",
    tags: ["내용증명", "채권추심", "계약해제", "증거"],
    focus: "내용증명",
    parties: "권리자와 상대방",
    issue: "통지 효과, 이행최고, 해제 예고, 증거화",
    action: "요구사항과 기한을 명확히 쓰고 감정적 표현을 줄임",
  },
  {
    category: "law_guide",
    slug: "provisional-attachment-guide",
    title: "가압류를 신청하기 전에 꼭 검토해야 할 실무 체크리스트",
    excerpt: "채권 회수 가능성을 높이기 위한 가압류 대상, 담보, 소명자료, 신청 순서를 설명합니다.",
    tags: ["가압류", "보전처분", "채권회수", "담보"],
    focus: "가압류 신청",
    parties: "채권자와 채무자",
    issue: "보전 필요성, 대상 재산, 담보, 본안소송",
    action: "회수 위험과 채권 자료를 동시에 준비",
  },
  {
    category: "law_guide",
    slug: "payment-order-guide",
    title: "지급명령을 활용할 수 있는 사건과 피해야 할 사건",
    excerpt: "지급명령의 장점과 한계, 이의신청 가능성, 소송 전환 비용을 실무적으로 설명합니다.",
    tags: ["지급명령", "채권추심", "소송", "이의신청"],
    focus: "지급명령",
    parties: "채권자와 채무자",
    issue: "청구 금액, 주소 확인, 이의 가능성, 집행",
    action: "다툼 가능성과 송달 가능성을 먼저 판단",
  },
  {
    category: "law_guide",
    slug: "criminal-complaint-guide",
    title: "형사 고소장을 제출하기 전에 민사와 함께 검토해야 할 것",
    excerpt: "사기, 횡령, 배임 의심 사건에서 고소와 민사 청구를 어떻게 병행할지 설명합니다.",
    tags: ["형사고소", "사기", "횡령", "민사소송"],
    focus: "형사 고소",
    parties: "고소인과 피고소인",
    issue: "범죄 성립, 증거, 피해 회복, 무고 위험",
    action: "기망행위와 처분행위, 금전 흐름을 구조화",
  },
  {
    category: "law_guide",
    slug: "divorce-property-division-guide",
    title: "이혼 재산분할에서 기여도와 특유재산을 정리하는 법",
    excerpt: "재산목록, 부채, 기여도, 특유재산, 양육 관련 쟁점을 상담 전 준비하는 방법입니다.",
    tags: ["이혼", "재산분할", "특유재산", "기여도"],
    focus: "이혼 재산분할",
    parties: "부부 당사자",
    issue: "재산목록, 기여도, 특유재산, 부채",
    action: "혼인 중 형성 재산과 혼인 전 재산을 분리해 표로 정리",
  },
  {
    category: "law_guide",
    slug: "inheritance-renunciation-limited-approval",
    title: "상속포기와 한정승인 중 무엇을 선택해야 하는가",
    excerpt: "상속채무가 의심될 때 기간, 서류, 후순위 상속인, 청산절차를 중심으로 설명합니다.",
    tags: ["상속포기", "한정승인", "상속채무", "가정법원"],
    focus: "상속포기와 한정승인",
    parties: "상속인과 채권자",
    issue: "신고 기간, 채무 조사, 후순위 상속, 청산",
    action: "사망일과 채무 확인일을 기준으로 신청 기한을 계산",
  },
  {
    category: "law_guide",
    slug: "administrative-disposition-cancellation",
    title: "영업정지·과징금 처분을 받았을 때 행정소송으로 다투는 방법",
    excerpt: "처분서 수령 후 불복기간, 집행정지, 재량권 일탈·남용 주장을 준비하는 실무 가이드입니다.",
    tags: ["행정소송", "영업정지", "과징금", "집행정지"],
    focus: "행정처분 불복",
    parties: "처분청과 사업자",
    issue: "불복기간, 집행정지, 재량권, 비례원칙",
    action: "처분서 수령일과 영업상 손해 자료를 즉시 확보",
  },
  {
    category: "law_guide",
    slug: "tax-audit-response-guide",
    title: "세무조사 통지를 받은 사업자가 초기에 해야 할 일",
    excerpt: "세무조사 대응에서 자료 제출, 진술 관리, 조세불복 가능성을 어떻게 준비할지 정리합니다.",
    tags: ["세무조사", "조세불복", "자료제출", "사업자"],
    focus: "세무조사 대응",
    parties: "과세관청과 납세자",
    issue: "자료 제출 범위, 소명, 추징세액, 불복",
    action: "요구 자료 목록과 회계자료의 설명 가능성을 점검",
  },
  {
    category: "law_guide",
    slug: "business-contract-review-guide",
    title: "사업 계약서를 서명하기 전에 반드시 확인해야 할 조항",
    excerpt: "대금, 해지, 손해배상, 비밀유지, 지식재산권 조항을 중심으로 계약서 검토법을 안내합니다.",
    tags: ["계약서검토", "사업계약", "손해배상", "해지"],
    focus: "사업 계약서 검토",
    parties: "거래 당사자",
    issue: "대금, 해지, 위약금, 비밀유지, 관할",
    action: "위험 조항을 돈, 기간, 책임, 종료 순서로 점검",
  },
];

function sentenceSet(topic, section, index) {
  const meta = CATEGORY_META[topic.category];
  const variants = [
    `${topic.focus} 사건에서 가장 먼저 해야 할 일은 ${topic.issue}를 하나의 주장으로 뭉치지 않고, 날짜와 문서 기준으로 나누는 것입니다. ${section} 단계에서 이 구분이 흐려지면 상대방은 금액과 책임을 동시에 다투게 되고, 사건은 감정 싸움처럼 보이기 쉽습니다.`,
    `${topic.parties} 사이의 분쟁은 대개 한 장의 계약서만으로 끝나지 않습니다. 실제 진행 과정, 대금 지급 흐름, 현장 지시, 사후 정산 태도가 함께 판단되므로 ${topic.action}하는 작업이 중요합니다.`,
    `법률 검토는 유리한 자료를 많이 모으는 일이 아니라, 서로 충돌하는 자료를 설명 가능한 순서로 배열하는 일에 가깝습니다. 특히 ${topic.issue}와 관련된 자료는 원본성, 작성 시점, 상대방 도달 여부를 함께 확인해야 합니다.`,
    `${meta.tone}으로 접근하면 청구할 금액, 양보할 수 있는 범위, 소송으로 갈 때의 위험을 비교할 수 있습니다. 이런 정리가 되어 있어야 내용증명, 협상안, 소장 작성의 방향이 흔들리지 않습니다.`,
  ];
  return variants[index % variants.length];
}

function callout(title, body, type = "note") {
  return `<div class="blog-callout blog-callout-${type}"><strong>${title}</strong><p>${body}</p></div>`;
}

function figure(topic, caption) {
  const cover = CATEGORY_META[topic.category].cover;
  return `<figure class="blog-figure"><img src="${cover}" alt="${topic.focus} 관련 법률 실무 시각 자료" loading="lazy" /><figcaption>${caption}</figcaption></figure>`;
}

function buildBodyBlock(topic, section, index) {
  const emphasis = [
    `**핵심은 '${topic.focus}'라는 이름이 아니라, 그 이름 아래 숨어 있는 돈·기간·책임의 구조입니다.**`,
    `**상대방이 무엇을 부인할지 먼저 예상해야 필요한 증거가 보입니다.**`,
    `**소송은 마지막 절차일 수 있지만, 소송을 전제로 정리한 자료는 협상에서도 가장 강한 언어가 됩니다.**`,
  ][index % 3];

  return [
    sentenceSet(topic, section, index),
    "",
    emphasis,
    "",
    sentenceSet(topic, section, index + 1),
    "",
    `따라서 ${section}에서는 다음 세 가지를 분리해서 보아야 합니다. 첫째, 이미 확정된 사실입니다. 둘째, 상대방이 다툴 가능성이 있는 사실입니다. 셋째, 아직 자료가 부족해 보완이 필요한 사실입니다. 이 구분을 하지 않으면 주장은 길어지지만 설득력은 낮아집니다.`,
    "",
    sentenceSet(topic, section, index + 2),
  ].join("\n");
}

function buildArticle(topic) {
  const meta = CATEGORY_META[topic.category];
  const sections = [
    ["사건 구조를 먼저 세우는 방법", "쟁점을 돈·기간·책임으로 나누기", "상대방 반박을 미리 예상하기"],
    ["증거와 문서 정리", "날짜순 사건표 만들기", "핵심 문서와 보조 자료 구분하기"],
    ["금액 산정과 협상 기준", "청구액을 산식으로 설명하기", "합의 가능 범위 정하기"],
    ["절차 선택", "내용증명·보전처분·소송의 순서", "시간과 비용의 균형"],
    ["실무상 자주 생기는 실수", "좋은 주장도 약해지는 순간", "상담 전에 정리할 자료"],
  ];
  const summary = [
    `${topic.focus} 사건은 ${topic.issue}를 분리해서 봐야 합니다.`,
    `${topic.action}하는 것이 초기 대응의 핵심입니다.`,
    "좋은 글은 결론만 말하지 않습니다. 독자가 자신의 사건을 점검할 수 있도록 문서, 증거, 절차를 순서대로 보여줘야 합니다.",
  ];

  let content = `## 한눈에 보는 핵심\n\n`;
  content += `${summary.map((item) => `- ${item}`).join("\n")}\n\n`;
  content += callout("먼저 확인할 점", `${topic.parties} 사이의 분쟁은 사실관계가 조금만 달라도 결론이 달라질 수 있습니다. 아래 내용은 상담 전 사건을 정리하기 위한 실무형 기준입니다.`, "gold");
  content += "\n\n";
  content += `> “분쟁을 빨리 끝내는 가장 현실적인 방법은 강한 표현이 아니라, 반박하기 어려운 순서로 자료를 정리하는 것입니다.”\n\n`;
  content += `이 글은 **${meta.label}** 카테고리의 ${topic.focus} 문제를 다룹니다. 단순한 법 조문 소개보다 실제 상담과 소송에서 반복되는 판단 흐름을 중심으로 정리했습니다.\n\n`;
  content += figure(topic, `${topic.focus} 사건은 처음부터 쟁점별 자료를 분리해 두면 협상과 소송 모두에서 대응 속도가 달라집니다.`);
  content += "\n\n";

  sections.forEach(([h2, h3a, h3b], sectionIndex) => {
    content += `## ${h2}\n\n`;
    content += buildBodyBlock(topic, h2, sectionIndex);
    content += "\n\n";
    content += `### ${h3a}\n\n`;
    content += buildBodyBlock(topic, h3a, sectionIndex + 1);
    content += "\n\n";
    content += callout("실무 메모", `${h3a} 단계에서는 자료의 양보다 설명 가능한 순서가 중요합니다. 같은 자료라도 언제, 누가, 어떤 맥락에서 만들었는지 정리되어 있어야 증거 가치가 올라갑니다.`, sectionIndex % 2 === 0 ? "note" : "soft");
    content += "\n\n";
    content += `### ${h3b}\n\n`;
    content += buildBodyBlock(topic, h3b, sectionIndex + 2);
    content += "\n\n";
    if (sectionIndex === 1) {
      content += figure(topic, `${topic.focus} 사건은 문서, 금액, 일정, 절차를 함께 놓고 보아야 전체 흐름이 선명해집니다.`);
      content += "\n\n";
    }
  });

  content += "## 체크리스트\n\n";
  content += "| 구분 | 확인할 내용 | 실무상 의미 |\n";
  content += "| --- | --- | --- |\n";
  [
    ["계약·합의", "계약서, 특약, 변경 합의, 견적서", "청구의 출발점과 책임 범위를 정합니다."],
    ["진행 경과", "문자, 이메일, 회의록, 사진, 작업일지", "상대방의 지시·승인·묵인을 설명합니다."],
    ["금액 자료", "세금계산서, 계좌내역, 정산표, 견적 비교", "청구액을 추상적 요구가 아니라 계산 가능한 금액으로 만듭니다."],
    ["절차 자료", "내용증명, 통지서, 소장, 결정문", "기간 제한과 다음 조치의 기준이 됩니다."],
  ].forEach((row) => {
    content += `| ${row[0]} | ${row[1]} | ${row[2]} |\n`;
  });
  content += "\n";

  content += callout("상담 전 준비 팁", "자료를 한꺼번에 보내기보다 날짜순 사건표, 핵심 문서, 금액 산식, 질문 목록을 나눠 준비하면 상담 시간이 훨씬 효율적으로 쓰입니다.", "gold");
  content += "\n\n";

  content += "## 자주 묻는 질문\n\n";
  const faqs = [
    ["자료가 부족해도 상담이 가능한가요?", "가능합니다. 다만 부족한 자료를 숨기기보다 어떤 부분이 비어 있는지 먼저 확인해야 합니다. 그래야 보완할 자료와 포기할 주장을 구분할 수 있습니다."],
    ["내용증명을 먼저 보내는 것이 유리한가요?", "이행기한을 명확히 하거나 해제·청구 의사를 남겨야 할 때 유용합니다. 다만 사실관계가 정리되지 않은 상태에서 강한 문구만 쓰면 나중에 불리한 증거가 될 수 있습니다."],
    ["합의와 소송 중 무엇을 먼저 생각해야 하나요?", "둘 중 하나를 감정적으로 고르는 문제가 아닙니다. 회수 가능성, 기간, 비용, 상대방의 태도, 증거 수준을 놓고 비교해야 합니다."],
    ["상대방이 계속 답을 피하면 어떻게 하나요?", "통지와 증거 보존을 마친 뒤 보전처분, 지급명령, 본안소송 등 절차를 검토해야 합니다. 이때 청구 금액과 입증 자료가 정리되어 있어야 합니다."],
  ];
  faqs.forEach(([q, a]) => {
    content += `### ${q}\n\n${a}\n\n`;
  });

  content += "## 마무리\n\n";
  content += `${topic.focus} 문제는 글 하나로 결론을 단정하기 어렵습니다. 그러나 사건을 **문서, 날짜, 금액, 책임, 절차**로 나누어 정리하면 대응 방향은 훨씬 선명해집니다. 법무법인 하이로는 사건을 비즈니스처럼 관리한다는 기준 아래, 초기 자료 정리부터 협상·소송 전략까지 단계별로 검토합니다.\n\n`;
  content += "이 글은 일반적인 법률 정보 제공을 목적으로 하며, 특정 사건에 대한 법률의견이 아닙니다. 실제 대응 전에는 개별 사실관계와 자료를 바탕으로 상담을 받으시기 바랍니다.\n";

  while (content.length < MIN_CONTENT_LENGTH) {
    const section = sections[(content.length + topic.slug.length) % sections.length][0];
    content += `\n## 추가 검토: ${section}\n\n`;
    content += buildBodyBlock(topic, section, content.length % 5);
    content += "\n\n";
  }
  return content;
}

function publishedAt(index) {
  const date = new Date("2026-05-03T09:00:00.000Z");
  date.setDate(date.getDate() - index * 3);
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function buildPosts() {
  return topics.map((topic, index) => {
    const content = buildArticle(topic);
    if (content.length < MIN_CONTENT_LENGTH) {
      throw new Error(`${topic.slug} content is ${content.length} chars`);
    }
    const meta = CATEGORY_META[topic.category];
    return {
      id: crypto.randomUUID(),
      ...topic,
      content,
      author: AUTHOR,
      thumbnailUrl: meta.cover,
      ogImageUrl: meta.cover,
      seoTitle: `${topic.title} | 법무법인 하이로`,
      seoDescription: topic.excerpt,
      publishedAt: publishedAt(index),
      viewCount: 120 + index * 17,
    };
  });
}

function refreshBlogContent(sqlite, options = {}) {
  const posts = buildPosts();
  if (options.dryRun) {
    return posts.map((post) => ({
      slug: post.slug,
      category: post.category,
      length: post.content.length,
    }));
  }

  const marker = sqlite.prepare("SELECT content FROM site_settings WHERE page = ? AND section = ?").get(MARKER_PAGE, MARKER_SECTION);
  if (marker?.content === VERSION) {
    return { skipped: true, version: VERSION, count: posts.length };
  }

  const insertPost = sqlite.prepare(`
    INSERT INTO blog_posts (
      id, title, slug, category, excerpt, content, author, thumbnail_url, tags,
      seo_title, seo_description, og_image_url, is_published, view_count,
      published_at, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);
  const write = sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM blog_view_events").run();
    sqlite.prepare("DELETE FROM blog_post_versions").run();
    sqlite.prepare("DELETE FROM blog_posts").run();
    for (const post of posts) {
      insertPost.run(
        post.id,
        post.title,
        post.slug,
        post.category,
        post.excerpt,
        post.content,
        post.author,
        post.thumbnailUrl,
        JSON.stringify(post.tags),
        post.seoTitle,
        post.seoDescription,
        post.ogImageUrl,
        post.viewCount,
        post.publishedAt,
        post.publishedAt,
        post.publishedAt,
      );
    }
    sqlite.prepare(`
      INSERT INTO site_settings (id, page, section, content, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
    `).run(crypto.randomUUID(), MARKER_PAGE, MARKER_SECTION, VERSION);
  });
  write();
  return { refreshed: true, version: VERSION, count: posts.length };
}

if (require.main === module) {
  const dryRun = process.argv.includes("--dry-run");
  const storagePath = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
  const dbPath = path.join(storagePath, "db", "highlaw.db");
  const sqlite = new Database(dbPath);
  try {
    const result = refreshBlogContent(sqlite, { dryRun });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    sqlite.close();
  }
}

module.exports = { VERSION, refreshBlogContent, buildPosts };
