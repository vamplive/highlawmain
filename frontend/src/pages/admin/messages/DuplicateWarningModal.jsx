/**
 * 중복 발송 경고 모달
 * - 최근 24시간 내 동일 연락처로 발송된 수신자 목록을 보여주고
 *   제외 발송 / 그대로 발송 / 취소 중 선택하게 한다
 */
import { COLORS, btnStyle } from "../../../components/admin";
import { formatDateTime, formatPhone, maskPhone, maskEmail } from "../../../utils/formatters";

/**
 * @param {object} props
 * @param {Array<{contact, lastSentAt, channel}>} props.duplicates
 * @param {() => void} props.onCancel - 모달 닫기 (발송 중단)
 * @param {() => void} props.onExclude - 중복 수신자만 제외하고 발송
 * @param {() => void} props.onSendAnyway - 모두 포함해 그대로 발송
 */
export default function DuplicateWarningModal({ duplicates, onCancel, onExclude, onSendAnyway }) {
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8, color: COLORS.warning }}>
          ⚠ 중복 발송 감지
        </h2>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 0, marginBottom: 16 }}>
          최근 24시간 내 동일 연락처로 이미 발송된 이력이 있는 수신자가 <strong>{duplicates.length}명</strong> 있습니다.
        </p>

        <div style={{ maxHeight: 260, overflowY: "auto", border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, marginBottom: 16 }}>
          {duplicates.map((d) => {
            const isEmail = String(d.contact).includes("@");
            const display = isEmail ? maskEmail(d.contact) : formatPhone(maskPhone(d.contact));
            return (
              <div key={d.contact} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${COLORS.borderLight}`, fontSize: 12 }}>
                <span style={{ fontWeight: 500 }}>
                  {isEmail ? "✉️" : "📞"} {display}
                </span>
                <span style={{ color: COLORS.muted }}>
                  {formatDateTime(d.lastSentAt)} · {d.channel === "sms" ? "SMS" : "이메일"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={onCancel} style={btnStyle(COLORS.muted)}>취소</button>
          <button onClick={onSendAnyway} style={btnStyle(COLORS.warning)}>⚠ 그대로 발송</button>
          <button onClick={onExclude} style={btnStyle(COLORS.success)}>✓ 중복 제외 발송</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 20,
};

const modalStyle = {
  background: "#fff", borderRadius: 8, padding: 24,
  maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto",
  boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
};
