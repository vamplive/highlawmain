/**
 * 부동산 분야 페이지 콘텐츠 데이터 — 라이프사이클·실무영역·실적·후기 등.
 */
import {
  Landmark, FileCheck, Home, MapPin,
  Scale, TrendingUp, Award, Users,
} from "lucide-react";

export const LIFECYCLE = [
  {
    phase: "01",
    title: "개발·인허가 단계",
    subtitle: "DEVELOPMENT & PERMITS",
    desc: "부동산 개발 사업의 법적 기반을 구축하고, 인허가 과정에서 발생하는 행정 쟁송을 대리합니다.",
    services: [
      "개발사업 인허가 자문·행정소송 대리",
      "재개발·재건축 조합 설립·인가 쟁송",
      "개발행위허가·지구단위계획 취소소송",
      "시행사·시공사 간 법률관계 자문",
      "PF·프로젝트 파이낸싱 법률 검토",
      "환경영향평가·토지이용규제 대응",
    ],
  },
  {
    phase: "02",
    title: "운영·관리 단계",
    subtitle: "MANAGEMENT & OPERATIONS",
    desc: "부동산 운영 과정에서 발생하는 법률 이슈에 대응합니다.",
    services: [
      "상가·주택 임대차 계약 관리",
      "임차인 분쟁 해결·명도",
      "관리비·수선 분쟁",
      "공유물 분할·공동소유 분쟁",
      "부동산 신탁·자산 관리",
      "건물 하자 보수 청구",
    ],
  },
  {
    phase: "03",
    title: "처분·분쟁해결 단계",
    subtitle: "DISPOSITION & DISPUTES",
    desc: "부동산 처분과 권리 분쟁을 법적으로 해결합니다.",
    services: [
      "매매 관련 분쟁·계약 해제",
      "등기 말소·회복 소송",
      "명의신탁 분쟁 해결",
      "경매·공매 대리",
      "토지수용·보상 분쟁",
      "부동산 관련 형사 사건",
    ],
  },
];

export const PRACTICES = [
  {
    icon: Landmark,
    title: "재개발·재건축",
    subtitle: "URBAN REDEVELOPMENT",
    desc: "조합 설립부터 관리처분, 이전고시까지 정비사업 전 과정의 법률 자문을 수행합니다.",
    details: ["조합 설립·운영 자문", "관리처분계획 인가", "시행인가·사업시행계획", "분양 관련 법률 자문", "조합원 분쟁 해결", "도정법·도시개발법 쟁송"],
  },
  {
    icon: FileCheck,
    title: "부동산 거래·투자",
    subtitle: "TRANSACTIONS & INVESTMENT",
    desc: "매매, 경매, 투자 구조 설계 등 부동산 거래 전반의 법적 안전성을 확보합니다.",
    details: ["매매 계약 검토·체결", "부동산 경매·공매 대리", "부동산 투자 구조 자문", "PF·프로젝트 파이낸싱", "부동산 실사(Due Diligence)", "분양권·입주권 거래"],
  },
  {
    icon: Home,
    title: "임대차·관리",
    subtitle: "LEASING & MANAGEMENT",
    desc: "상가·주택 임대차 관련 분쟁부터 건물 관리 이슈까지 종합적으로 해결합니다.",
    details: ["상가 임대차 보호법 자문", "주택 임대차 분쟁", "보증금 반환 청구", "명도 소송·강제집행", "관리비 분쟁 해결", "전월세 분쟁 조정"],
  },
  {
    icon: MapPin,
    title: "등기·수용·보상",
    subtitle: "REGISTRATION & COMPENSATION",
    desc: "소유권 분쟁, 토지수용, 보상금 산정 등 권리 보전과 재산 보호를 전문적으로 수행합니다.",
    details: ["등기 말소·회복 소송", "소유권·용익물권 분쟁", "토지수용 재결 불복", "보상금 증액 소송", "명의신탁 해지·반환", "경계·면적 분쟁"],
  },
];

export const STATS = [
  { value: "200+", label: "부동산 사건 수행", icon: Scale },
  { value: "95%", label: "클라이언트 만족도", icon: TrendingUp },
  { value: "150억+", label: "누적 부동산 분쟁 규모", icon: Award },
  { value: "10년+", label: "부동산 분야 전문 경력", icon: Users },
];

export const TRACK_RECORDS = [
  { category: "재개발", text: "도시정비사업 관련 조합원 권익 보호 소송 다수 수행" },
  { category: "임대차", text: "상업시설 임대차 분쟁 — 임차인·임대인 양측 대리 경험" },
  { category: "매매분쟁", text: "부동산 매매 계약 해제·이행 소송 전문 대리" },
  { category: "토지수용", text: "공공사업 토지수용 보상금 관련 소송 수행" },
  { category: "등기분쟁", text: "명의신탁 해지 및 소유권 이전등기 청구 대리" },
  { category: "경매", text: "부동산 경매 절차 대리 및 배당이의 소송 수행" },
];

export const CASE_RESULTS = [
  { amount: "토지수용", unit: "분쟁", label: "보상금 관련 소송 수행", detail: "공익사업 토지수용에서 적정 보상을 위한 법률 대리" },
  { amount: "매매분쟁", unit: "대리", label: "부동산 매매 계약 분쟁", detail: "매매 계약의 이행·해제·손해배상 관련 전문 소송 수행" },
  { amount: "등기소송", unit: "수행", label: "소유권·명의신탁 분쟁", detail: "명의신탁 해지, 소유권 이전등기 청구 소송 대리" },
  { amount: "재개발", unit: "자문", label: "재개발·재건축 법률 자문", detail: "도시정비사업 관련 조합원 권익 보호 및 법률 자문" },
];

export const PAIN_POINTS = [
  "재개발 조합에서 불합리한 관리처분을 통보받았다",
  "부동산 매매 후 예상치 못한 하자가 발견되었다",
  "임차인이 보증금 반환을 거부하고 있다",
  "토지가 수용되는데 보상금이 너무 적다",
  "부동산 개발 인허가가 반려되어 사업이 중단되었다",
  "공유 부동산 지분 분쟁이 해결되지 않고 있다",
];

export const TESTIMONIALS = [
  {
    quote: "재개발 조합 설립 과정에서 발생한 복잡한 법적 쟁점을 명쾌하게 정리해주어, 사업이 순조롭게 진행될 수 있었습니다.",
    author: "재개발 조합 이사",
  },
  {
    quote: "부동산 매매 계약서 검토에서 치명적인 리스크를 발견해주어 큰 손실을 피할 수 있었습니다. 부동산 전문이라는 것이 확실히 달랐습니다.",
    author: "부동산 투자법인 대표",
  },
];

export const INSIGHTS = [
  { tag: "재개발", title: "재개발 조합원 분쟁 — 관리처분계획 인가 취소의 요건과 실무", date: "2026.03" },
  { tag: "임대차", title: "상가임대차보호법 개정 — 권리금 회수 기회 보호의 실무 쟁점", date: "2026.02" },
  { tag: "토지수용", title: "공익사업 토지수용 보상금 산정, 감정평가 절차의 핵심", date: "2026.01" },
];
