/**
 * WatermarkDialog — 워터마크 설정 대화상자
 * 문서에 표시할 워터마크 텍스트, 크기, 색상, 방향을 설정한다.
 */
import { useState } from "react";
import { WATERMARK_PRESETS } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function WatermarkDialog({ watermarkText, setWatermarkText, onClose }) {
  const [text, setText] = useState(watermarkText || "");
  const font = "맑은 고딕";
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState("#cccccc");
  const [diagonal, setDiagonal] = useState(true);

  const handleOk = () => {
    setWatermarkText(text);
    onClose();
  };

  return (
    <DialogShell title="워터마크" onClose={onClose} width={440}>
      <div className="word-dialog-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="word-dialog-label">워터마크 텍스트</label>
            <input className="word-dialog-input" value={text} onChange={e => setText(e.target.value)} placeholder="워터마크 입력..." />
          </div>
          <div>
            <label className="word-dialog-label">빠른 선택</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {WATERMARK_PRESETS.map(p => (
                <button key={p} type="button" onClick={() => setText(p)}
                  style={{
                    padding: "3px 10px", fontSize: 11, border: text === p ? "2px solid #3b82f6" : "1px solid #ddd",
                    borderRadius: 3, cursor: "pointer", background: "#fff",
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="word-dialog-label">글꼴 크기</label>
              <input className="word-dialog-input" type="number" min={20} max={150} value={fontSize}
                onChange={e => setFontSize(parseInt(e.target.value))} style={{ width: 80 }} />
            </div>
            <div>
              <label className="word-dialog-label">색</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 40, height: 24, border: "1px solid #ccc", cursor: "pointer" }} />
            </div>
            <div>
              <label className="word-dialog-label">방향</label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={diagonal} onChange={e => setDiagonal(e.target.checked)} />
                대각선
              </label>
            </div>
          </div>
          {/* 미리보기 */}
          <div style={{
            width: "100%", height: 100, border: "1px solid #ddd", borderRadius: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff", overflow: "hidden", position: "relative",
          }}>
            <span style={{
              fontSize: fontSize * 0.4, fontFamily: font, color, opacity: 0.5,
              transform: diagonal ? "rotate(-30deg)" : "none",
              whiteSpace: "nowrap", userSelect: "none",
            }}>
              {text || "미리 보기"}
            </span>
          </div>
        </div>
      </div>
      <DialogFooter onOk={handleOk} onCancel={onClose} />
    </DialogShell>
  );
}
