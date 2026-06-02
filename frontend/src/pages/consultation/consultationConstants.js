/** 상담안내 페이지에서 사용하는 상수 데이터 — 카테고리, 시간대, FAQ, 연락처, 지도 설정 등 */
import { Phone, MessageCircle, AtSign, Clock } from "lucide-react";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

/* ── 사무실 좌표 (강남 테헤란로 141) ── */
export const OFFICE_LAT = 37.5006;
export const OFFICE_LNG = 127.0364;
export const OFFICE_ADDRESS = "서울특별시 강남구 테헤란로 141, 15층";
export const OFFICE_BUSINESS_NUMBER = "433-86-04078";

/** 상담 절차 단계 */
export const STEPS = [
  { step: "01", title: "사건 분석 및 진단", desc: "초기 자료를 신속히 검토하고 핵심 쟁점과 위험요소를 명확히 정리합니다." },
  { step: "02", title: "전략 설계 및 실행", desc: "협상·소송·집행 단계별 목표를 설정하고 일정 중심으로 추진합니다." },
  { step: "03", title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." },
  { step: "04", title: "결과 관리 및 사후 대응", desc: "판결 이후 이행, 추가 분쟁 예방까지 의뢰인의 리스크를 관리합니다." },
];

/** 연락처 정보 (TBD 플레이스홀더 — 실제 정보 확정 시 교체) */
export const CONTACT_INFO = [
  { label: "전화", value: "준비 중", icon: Phone, href: null },
  { label: "카카오톡 상담", value: "카카오톡으로 빠른 상담", icon: MessageCircle, href: KAKAO_CHANNEL_CHAT },
  { label: "이메일", value: "준비 중", icon: AtSign, href: null },
  { label: "영업시간", value: "평일 09:00 - 18:00 (예약 상담 우선)", icon: Clock, href: null },
];

/** 핵심 지표 */
export const STATS = [
  { value: "1:1", label: "사건 맞춤 커뮤니케이션" },
  { value: "24H", label: "신속한 초기 응답" },
  { value: "100%", label: "기밀 보장 원칙" },
];

/** 지도 탭 */
export const MAP_TABS = [
  { id: "kakao", label: "카카오맵" },
  { id: "naver", label: "네이버지도" },
  { id: "google", label: "구글지도" },
];

/** 상담 분야 옵션 */
export const CONSULTATION_CATEGORIES = [
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "labor", label: "인사노무" },
  { value: "serious-accident", label: "중대재해" },
  { value: "corporate", label: "기업" },
  { value: "defense", label: "방산" },
  { value: "military-criminal", label: "군형사" },
  { value: "entertainment", label: "엔터테인먼트" },
  { value: "administrative", label: "행정" },
  { value: "family", label: "가사 및 상속" },
  { value: "intellectual-property", label: "지적재산권" },
  { value: "immigration", label: "이민" },
  { value: "other", label: "기타" },
];

/** 희망 시간대 옵션 */
export const TIME_SLOTS = [
  { value: "", label: "선택해주세요" },
  { value: "09:00~10:00", label: "오전 9시~10시" },
  { value: "10:00~11:00", label: "오전 10시~11시" },
  { value: "11:00~12:00", label: "오전 11시~12시" },
  { value: "13:00~14:00", label: "오후 1시~2시" },
  { value: "14:00~15:00", label: "오후 2시~3시" },
  { value: "15:00~16:00", label: "오후 3시~4시" },
  { value: "16:00~17:00", label: "오후 4시~5시" },
  { value: "17:00~18:00", label: "오후 5시~6시" },
];

/** 상담 방식 옵션 — 대면 / 전화 / 화상 */
export const MEETING_TYPE_OPTIONS = [
  { value: "in_person", label: "대면 상담", description: "사무소 방문" },
  { value: "phone", label: "전화 상담", description: "예약 시각에 연락" },
  { value: "video", label: "화상 상담", description: "Google Meet 자동 생성" },
];

/** 예약 방식 — 공개 슬롯에서 선택 vs 일정 협의 요청 */
export const SCHEDULE_MODE_OPTIONS = [
  { value: "slot", label: "예약 가능 시간에서 선택" },
  { value: "request", label: "일정 협의 요청" },
];

/** 상담 폼 초기값 */
export const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  category: "civil",
  message: "",
  meetingType: "in_person",
  scheduleMode: "slot",
  bookingSlotId: "",
  preferredSlots: [
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" },
  ],
  agreed: false,
};

/** 자주 묻는 질문 */
export const FAQ_ITEMS = [
  { q: "상담 비용은 어떻게 되나요?", a: "초기 상담은 사건의 복잡도와 분야에 따라 상이합니다. 카카오톡 또는 상담 신청 폼으로 문의하시면 상담 유형에 맞는 안내를 드립니다." },
  { q: "상담 예약은 어떻게 하나요?", a: "카카오톡 또는 위 상담 신청 폼을 통해 예약하실 수 있습니다. 예약 상담이 우선 진행됩니다." },
  { q: "방문 상담이 가능한가요?", a: "네, 서울특별시 강남구 테헤란로 141, 15층 사무소에서 직접 상담이 가능합니다. 사전 예약을 권장드립니다." },
  { q: "상담 후 수임이 필수인가요?", a: "아닙니다. 상담을 통해 사건의 방향성을 파악하신 후 자유롭게 결정하실 수 있습니다." },
  { q: "어떤 분야를 전문으로 하나요?", a: "민사, 형사, 인사노무, 중대재해, 기업, 방산, 군형사, 엔터테인먼트, 행정, 가사 및 상속, 지적재산권, 이민을 비롯한 주요 분야에 대해 검증된 실무 역량과 정교한 법리 해석을 토대로 최적의 법률 솔루션을 제공합니다." },
  { q: "비밀이 보장되나요?", a: "변호사법에 따라 상담 내용은 철저히 비밀이 보장됩니다. 모든 정보는 안전하게 관리됩니다." },
];

/**
 * 각 지도 서비스의 임베드/링크 URL 생성
 * @param {"kakao"|"naver"|"google"} type - 지도 서비스 종류
 */
export function getMapUrl(type) {
  switch (type) {
    case "kakao":
      return `https://map.kakao.com/link/map/법무법인하이로,${OFFICE_LAT},${OFFICE_LNG}`;
    case "naver":
      return `https://map.naver.com/p/search/법무법인%20하이로`;
    case "google":
      return `https://www.google.com/maps?q=${OFFICE_LAT},${OFFICE_LNG}&z=17&output=embed`;
    default:
      return "";
  }
}

/**
 * 각 지도 서비스의 외부 링크 URL
 * @param {"kakao"|"naver"|"google"} type - 지도 서비스 종류
 */
export function getMapExternalUrl(type) {
  switch (type) {
    case "kakao":
      return `https://map.kakao.com/link/map/법무법인하이로,${OFFICE_LAT},${OFFICE_LNG}`;
    case "naver":
      return `https://map.naver.com/p/search/법무법인%20하이로`;
    case "google":
      return `https://www.google.com/maps/search/?api=1&query=${OFFICE_LAT},${OFFICE_LNG}`;
    default:
      return "";
  }
}
