/**
 * 메시지 발송 관련 공유 상수 — 채널 설정, 상태 라벨, 바이트 제한
 */
import { COLORS } from "../../../components/admin";

/** SMS 바이트 제한 (초과 시 LMS로 발송) */
export const SMS_BYTE_LIMIT = 90;

/** 상담 분야 한국어 라벨 */
export const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/** 상담 상태 라벨 */
export const STATUS_LABELS = {
  pending: "대기", confirmed: "확인", completed: "완료", cancelled: "취소",
};

/** 상담 상태별 색상 */
export const STATUS_COLORS = {
  pending: COLORS.warning, confirmed: COLORS.success,
  completed: "#3498db", cancelled: COLORS.muted,
};

/** 채널 배지 색상 */
export const CHANNEL_COLORS = { sms: "#3498db", email: "#9b59b6" };

/** 채널 선택 드롭다운 옵션 */
export const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS 문자" },
  { value: "email", label: "이메일" },
];

/** 빈 템플릿 초기값 */
export const EMPTY_TEMPLATE = {
  name: "", channel: "sms", subject: "", content: "", isActive: true, sortOrder: 0,
};

/** 발송 이력 상태 라벨 */
export const LOG_STATUS_LABELS = { sent: "성공", failed: "실패", pending: "대기" };

/** 발송 이력 상태별 색상 */
export const LOG_STATUS_COLORS = {
  sent: COLORS.success, failed: COLORS.danger, pending: COLORS.warning,
};

/** 탭 버튼 스타일 생성 */
export const tabStyle = (active) => ({
  padding: "10px 24px", fontSize: 14, fontWeight: active ? 600 : 400,
  color: active ? COLORS.accent : "#666", background: "none", border: "none",
  borderBottom: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
  cursor: "pointer", transition: "all 0.2s",
});
