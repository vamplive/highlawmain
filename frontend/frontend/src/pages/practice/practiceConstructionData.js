/**
 * 건설 분야 페이지 콘텐츠 데이터 — 라이프사이클·실무영역·실적·후기 등.
 * 페이지 컴포넌트가 호출하기 좋게 모듈로 분리.
 */
import {
  Building2, HardHat, Shield, Gavel,
  Scale, TrendingUp, Award, Users,
} from "lucide-react";

export const LIFECYCLE = [
  {
    phase: "01",
    title: "계획·계약 단계",
    subtitle: "PLANNING & CONTRACTS",
    desc: "프로젝트 착수 전 법률 리스크를 선제적으로 차단합니다.",
    services: [
      "공사도급계약서 검토·작성",
      "EPC / 턴키 / CM 계약 자문",
      "하도급 계약 구조 설계",
      "FIDIC 조건 분석·협상",
      "건설 보증·보험 검토",
      "인허가·환경영향평가 대응",
    ],
  },
  {
    phase: "02",
    title: "시공·이행 단계",
    subtitle: "PERFORMANCE & EXECUTION",
    desc: "시공 과정에서 발생하는 법률 이슈에 실시간으로 대응합니다.",
    services: [
      "설계변경·추가공사 클레임",
      "공기연장(EOT) 청구 대리",
      "원·하도급 대금 분쟁",
      "현장 안전사고 법적 대응",
      "계약 이행 보증 실행·방어",
      "중간정산·기성금 분쟁",
    ],
  },
  {
    phase: "03",
    title: "준공·분쟁해결 단계",
    subtitle: "COMPLETION & DISPUTES",
    desc: "준공 후 하자, 정산, 중재 등 최종 단계의 분쟁을 해결합니다.",
    services: [
      "하자보수 및 손해배상 청구",
      "최종 정산·공사대금 소송",
      "건설 중재 (KCAB, ICC, SIAC)",
      "건축물 하자 감정 연계",
      "준공 관련 행정 쟁송",
      "Cross-border 국제 분쟁",
    ],
  },
];

export const PRACTICES = [
  {
    icon: Building2,
    title: "건설 소송·클레임",
    subtitle: "CONSTRUCTION LITIGATION",
    desc: "공사대금, 하자보수, 공기연장 등 건설 현장의 복잡한 분쟁을 체계적으로 해결합니다.",
    details: ["공사대금 청구·지급 분쟁", "하자보수 손해배상", "공기연장 클레임(EOT)", "설계변경·추가공사 분쟁", "원·하도급 분쟁", "건설 중재·조정"],
  },
  {
    icon: HardHat,
    title: "건설 계약·자문",
    subtitle: "CONSTRUCTION ADVISORY",
    desc: "계약 단계의 리스크 사전 차단으로 분쟁을 예방하고, 프로젝트의 법적 안정성을 확보합니다.",
    details: ["공사도급계약 검토·작성", "EPC / 턴키 계약", "FIDIC 계약 조건 분석", "건설 보증·보험 자문", "하도급 계약 관리", "설계 용역 계약"],
  },
  {
    icon: Shield,
    title: "건설 행정·인허가",
    subtitle: "PERMITS & REGULATORY",
    desc: "건축허가, 개발행위허가, 토지수용 등 건설 관련 행정 절차와 인허가 쟁송을 전문적으로 수행합니다.",
    details: ["건축허가·개발행위허가", "행정처분 취소 소송", "토지수용·보상 분쟁", "환경영향평가 대응", "건설업 등록·면허", "산업안전보건법 대응"],
  },
  {
    icon: Gavel,
    title: "국제 건설·중재",
    subtitle: "INTERNATIONAL & ARBITRATION",
    desc: "해외 건설 프로젝트와 국제 중재에서 풍부한 경험을 바탕으로 최적의 전략을 수립합니다.",
    details: ["국내 건설 중재(KCAB)", "ICC / SIAC 국제 중재", "해외 EPC 클레임", "Cross-border 분쟁", "해외 건설 프로젝트 자문", "국제 건설계약 검토"],
  },
];

export const STATS = [
  { value: "300+", label: "건설 사건 수행", icon: Scale },
  { value: "95%", label: "클라이언트 만족도", icon: TrendingUp },
  { value: "200억+", label: "누적 클레임 청구 규모", icon: Award },
  { value: "10년+", label: "건설 분야 전문 경력", icon: Users },
];

export const TRACK_RECORDS = [
  { category: "공사대금", text: "공사대금 청구·기성금 정산 분쟁 다수 수행" },
  { category: "하자분쟁", text: "공동주택·상업시설 하자보수 손해배상 소송 대리" },
  { category: "국제중재", text: "해외 플랜트 EPC 공기연장 클레임 — 국제중재(ICC) 수행" },
  { category: "행정소송", text: "공공발주 공사 관련 행정처분 취소소송 대리" },
  { category: "클레임", text: "설계변경·추가공사 클레임 대리 및 방어" },
  { category: "안전사고", text: "건설 현장 중대재해 — 산업안전보건법 대응" },
];

export const CASE_RESULTS = [
  { amount: "공사대금", unit: "분쟁", label: "기성금·추가공사 대금 청구", detail: "공사대금 정산 및 기성금 분쟁에서 체계적 법률 대리" },
  { amount: "하자보수", unit: "소송", label: "건축물 하자 손해배상", detail: "공동주택·상업시설 하자에 대한 감정 연계 소송 전략" },
  { amount: "안전관리", unit: "대응", label: "중대재해처벌법 대응", detail: "건설 현장 안전사고 발생 시 신속한 법률 대응" },
  { amount: "국제중재", unit: "수행", label: "해외 건설 분쟁 중재", detail: "해외 EPC 프로젝트 클레임 및 국제중재 수행" },
];

export const PAIN_POINTS = [
  "발주자가 기성금 지급을 계속 미루고 있다",
  "하도급 업체와 공사대금 분쟁이 발생했다",
  "준공 후 하자보수 책임 범위를 둘러싼 갈등이 있다",
  "공기연장에 따른 추가 비용을 청구하고 싶다",
  "건축허가가 반려되어 공사 착공이 불가능하다",
  "현장 안전사고로 법적 책임 문제에 처해 있다",
];

export const TESTIMONIALS = [
  {
    quote: "건설 현장의 실무를 깊이 이해하는 변호사라 기술적 쟁점까지 정확하게 파악해주었습니다. 다른 로펌에서는 받지 못했던 실질적인 조언이었습니다.",
    author: "대형 건설사 법무팀장",
  },
  {
    quote: "EPC 계약 검토 단계에서 잠재적 리스크를 사전에 발견해 수억 원의 손실을 예방할 수 있었습니다.",
    author: "해외 플랜트 시공사 임원",
  },
];

export const INSIGHTS = [
  { tag: "건설 계약", title: "FIDIC 계약 조건에서 시공사가 주의해야 할 핵심 조항", date: "2026.03" },
  { tag: "하자분쟁", title: "공동주택 하자보수 청구, 감정 결과를 유리하게 이끄는 전략", date: "2026.02" },
  { tag: "클레임", title: "공기연장(EOT) 클레임의 입증 방법과 실무 쟁점", date: "2026.01" },
];
