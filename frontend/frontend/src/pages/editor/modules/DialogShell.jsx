/**
 * DialogShell — 다이얼로그 공통 래퍼 (백드롭 + 중앙 패널 + 닫기 버튼 + 제목)
 * Dialogs.jsx, NewDialogs.jsx 등에서 공유
 */

/**
 * @param {object} props
 * @param {string} props.title - 다이얼로그 제목
 * @param {number} [props.width=480] - 다이얼로그 폭 (px)
 * @param {function} props.onClose - 닫기 콜백
 * @param {React.ReactNode} props.children - 본문 + 푸터
 */
export function DialogShell({ title, onClose, children, width = 480 }) {
  return (
    <div className="word-dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ width }}>
        <div className="word-dialog-title">
          <span>{title}</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#888", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default DialogShell;
