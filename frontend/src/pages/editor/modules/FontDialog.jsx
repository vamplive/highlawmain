/**
 * FontDialog — 글꼴 설정 대화상자
 * 글꼴, 크기, 스타일, 색상을 변경한다.
 */
import { useState, useEffect } from "react";
import { FONT_LIST, FONT_SIZES } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function FontDialog({ editor, onClose }) {
  const [font, setFont] = useState("malgun");
  const [size, setSize] = useState("11");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike] = useState(false);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const attrs = editor.getAttributes("textStyle");
      if (attrs.fontFamily) {
        const found = FONT_LIST.find(f => attrs.fontFamily.includes(f.label));
        if (found) setFont(found.value);
      }
      if (attrs.fontSize) setSize(attrs.fontSize.replace("pt", ""));
      if (attrs.color) setColor(attrs.color);
      setBold(editor.isActive("bold"));
      setItalic(editor.isActive("italic"));
      setUnderline(editor.isActive("underline"));
      setStrike(editor.isActive("strike"));
    });
    return () => { cancelled = true; };
  }, [editor]);

  const apply = () => {
    if (!editor) return;
    const fontObj = FONT_LIST.find(f => f.value === font);
    let chain = editor.chain().focus();
    if (fontObj) chain = chain.setFontFamily(fontObj.family);
    chain = chain.setFontSize(size + "pt");
    chain = chain.setColor(color);
    // Toggle marks
    if (bold !== editor.isActive("bold")) chain = chain.toggleBold();
    if (italic !== editor.isActive("italic")) chain = chain.toggleItalic();
    if (underline !== editor.isActive("underline")) chain = chain.toggleUnderline();
    if (strike !== editor.isActive("strike")) chain = chain.toggleStrike();
    chain.run();
    onClose();
  };

  const previewStyle = {
    fontFamily: FONT_LIST.find(f => f.value === font)?.family || "sans-serif",
    fontSize: Math.min(parseInt(size) || 11, 24) + "pt",
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? "italic" : "normal",
    textDecoration: [underline && "underline", strike && "line-through"].filter(Boolean).join(" ") || "none",
    color: color,
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    minHeight: 40,
    textAlign: "center",
  };

  return (
    <DialogShell title="글꼴" onClose={onClose} width={520}>
      <div className="word-dialog-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Font family */}
          <div>
            <label className="word-dialog-label">글꼴(F):</label>
            <select className="word-dialog-input" value={font} onChange={e => setFont(e.target.value)}>
              {FONT_LIST.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.family }}>{f.label}</option>
              ))}
            </select>
          </div>
          {/* Font style */}
          <div>
            <label className="word-dialog-label">글꼴 스타일(Y):</label>
            <select className="word-dialog-input" value={`${bold ? "bold" : ""}${italic ? "italic" : ""}` || "normal"} onChange={e => {
              const v = e.target.value;
              setBold(v.includes("bold"));
              setItalic(v.includes("italic"));
            }}>
              <option value="normal">보통</option>
              <option value="italic">기울임꼴</option>
              <option value="bold">굵게</option>
              <option value="bolditalic">굵은 기울임꼴</option>
            </select>
          </div>
          {/* Font size */}
          <div>
            <label className="word-dialog-label">크기(S):</label>
            <select className="word-dialog-input" value={size} onChange={e => setSize(e.target.value)}>
              {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={underline} onChange={e => setUnderline(e.target.checked)} /> 밑줄
          </label>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={strike} onChange={e => setStrike(e.target.checked)} /> 취소선
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12 }}>글꼴 색:</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 28, height: 22, padding: 0, border: "1px solid #ccc", cursor: "pointer" }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="word-dialog-label">미리 보기:</label>
          <div style={previewStyle}>가나다라 AaBbCcYyZz 0123</div>
        </div>
      </div>
      <DialogFooter onOk={apply} onCancel={onClose} />
    </DialogShell>
  );
}
