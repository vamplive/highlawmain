/**
 * 삭제 확인 모달
 */
import { COLORS, btnStyle, outlineBtnStyle } from "../../../components/admin";
import Overlay from "./Overlay";

export default function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <Overlay onClose={onCancel}>
      <div style={{ background: "#fff", maxWidth: 400, width: "90%", padding: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, letterSpacing: "0.15em", marginBottom: 12 }}>
          DELETE CONFIRMATION
        </div>
        <p style={{ fontSize: 14, color: COLORS.text, marginBottom: 24 }}>
          이 영상을 삭제하시겠습니까?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={outlineBtnStyle()}>
            취소
          </button>
          <button onClick={onConfirm} style={btnStyle(COLORS.danger)}>
            삭제
          </button>
        </div>
      </div>
    </Overlay>
  );
}
