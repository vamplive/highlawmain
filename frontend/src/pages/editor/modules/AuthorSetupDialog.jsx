/**
 * AuthorSetupDialog — 사용자 이름/이니셜 설정 대화상자
 *
 * 댓글 작성 전 사용자 정보를 입력받는 Word 스타일 대화상자.
 */
import { useState, useEffect, useRef } from "react";

export function AuthorSetupDialog({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), initials.trim() || name.trim().charAt(0));
  };

  return (
    <div className="word-dialog-overlay" onClick={onCancel}>
      <div className="word-dialog" style={{ minWidth: 360, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="word-dialog-title">
          <span>사용자 정보 설정</span>
          <button type="button" onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
        <div className="word-dialog-body" style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label className="word-dialog-label">이름(N):</label>
            <input ref={nameRef} className="word-dialog-input" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="예: 조덕재" />
          </div>
          <div>
            <label className="word-dialog-label">이니셜(I):</label>
            <input className="word-dialog-input" value={initials} onChange={(e) => setInitials(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="예: 윤" style={{ width: 100 }} />
          </div>
        </div>
        <div className="word-dialog-footer">
          <button className="word-dialog-btn primary" onClick={handleSave}>확인</button>
          <button className="word-dialog-btn" onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
}
