/**
 * ParagraphDialog — 단락 설정 대화상자
 * 맞춤, 들여쓰기, 줄 간격, 단락 간격, 줄 및 페이지 나누기를 설정한다.
 */
import { useState, useEffect } from "react";
import { LINE_SPACINGS } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

/* ── 줄 및 페이지 나누기 탭 (ParagraphDialog 하위) ── */
function LineBreakTab({ editor }) {
  const [widowOrphan, setWidowOrphan] = useState(false);
  const [keepWithNext, setKeepWithNext] = useState(false);
  const [pageBreakBefore, setPageBreakBefore] = useState(false);
  const [keepLinesTogether, setKeepLinesTogether] = useState(false);

  /* 에디터에서 현재 단락의 속성을 읽어 초기값 설정 */
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const node = editor.state.selection.$from.parent;
      setWidowOrphan(!!node.attrs.widowOrphan);
      setKeepWithNext(!!node.attrs.keepWithNext);
      setPageBreakBefore(!!node.attrs.pageBreakBefore);
      setKeepLinesTogether(!!node.attrs.keepLinesTogether);
    });
    return () => { cancelled = true; };
  }, [editor]);

  /* 변경 시 즉시 에디터에 적용 */
  const applyAttr = (attr, value) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const tr = editor.state.tr;
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === "paragraph" || node.type.name === "heading") {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, [attr]: value });
      }
    });
    editor.view.dispatch(tr);
  };

  const handleWidowOrphan = (v) => { setWidowOrphan(v); applyAttr("widowOrphan", v); };
  const handleKeepWithNext = (v) => { setKeepWithNext(v); applyAttr("keepWithNext", v); };
  const handlePageBreakBefore = (v) => { setPageBreakBefore(v); applyAttr("pageBreakBefore", v); };
  const handleKeepLinesTogether = (v) => { setKeepLinesTogether(v); applyAttr("keepLinesTogether", v); };

  return (
    <div style={{ fontSize: 12, color: "#555" }}>
      <div style={{ fontWeight: 600, marginBottom: 10, color: "#333" }}>페이지 매김</div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={widowOrphan} onChange={e => handleWidowOrphan(e.target.checked)} /> 과부/고아 보호(W)
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={keepWithNext} onChange={e => handleKeepWithNext(e.target.checked)} /> 다음 단락과 함께(K)
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={pageBreakBefore} onChange={e => handlePageBreakBefore(e.target.checked)} /> 단락 앞에서 나누기(B)
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
        <input type="checkbox" checked={keepLinesTogether} onChange={e => handleKeepLinesTogether(e.target.checked)} /> 단락에서 줄 나누지 않기(D)
      </label>
      <div style={{ marginTop: 16, padding: 10, background: "#f5f5f5", borderRadius: 4, fontSize: 11, color: "#777" }}>
        <strong>과부/고아 보호</strong>: 페이지 상단/하단에 한 줄만 남지 않도록 합니다.<br/>
        <strong>다음 단락과 함께</strong>: 현재 단락과 다음 단락이 같은 페이지에 있도록 합니다.<br/>
        <strong>단락 앞에서 나누기</strong>: 현재 단락 앞에 페이지 나누기를 삽입합니다.
      </div>
    </div>
  );
}

export function ParagraphDialog({ editor, onClose }) {
  const [align, setAlign] = useState("left");
  const [lineSpacing, setLineSpacing] = useState("1.75");
  const [spacingBefore, setSpacingBefore] = useState("0");
  const [spacingAfter, setSpacingAfter] = useState("8");
  const [indent, setIndent] = useState("0");
  const [dialogTab, setDialogTab] = useState("indents");

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const node = editor.state.selection.$from.parent;
      if (node.attrs.textAlign) setAlign(node.attrs.textAlign);
      if (node.attrs.lineSpacing) setLineSpacing(node.attrs.lineSpacing);
      if (node.attrs.indent) setIndent(String(node.attrs.indent));
    });
    return () => { cancelled = true; };
  }, [editor]);

  const apply = () => {
    if (!editor) return;
    // Apply alignment and line spacing
    editor.chain().focus()
      .setTextAlign(align)
      .setLineSpacing(lineSpacing)
      .run();
    // Apply paragraph spacing
    if (spacingBefore !== "0") {
      editor.commands.setSpacingBefore(spacingBefore + "pt");
    }
    if (spacingAfter !== "0") {
      editor.commands.setSpacingAfter(spacingAfter + "pt");
    }
    // Apply indent: first reset, then apply desired level
    const currentNode = editor.state.selection.$from.parent;
    const currentIndent = currentNode.attrs.indent || 0;
    const targetIndent = parseInt(indent) || 0;
    const diff = targetIndent - currentIndent;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) editor.commands.increaseIndent();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) editor.commands.decreaseIndent();
    }
    onClose();
  };

  return (
    <DialogShell title="단락" onClose={onClose} width={480}>
      <div className="word-dialog-tabs">
        <button className={`word-dialog-tab${dialogTab === "indents" ? " active" : ""}`} onClick={() => setDialogTab("indents")}>들여쓰기 및 간격</button>
        <button className={`word-dialog-tab${dialogTab === "linebreak" ? " active" : ""}`} onClick={() => setDialogTab("linebreak")}>줄 및 페이지 나누기</button>
      </div>
      <div className="word-dialog-body">
        {dialogTab === "indents" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label className="word-dialog-label">맞춤(A):</label>
              <select className="word-dialog-input" style={{ width: 160 }} value={align} onChange={e => setAlign(e.target.value)}>
                <option value="left">왼쪽</option>
                <option value="center">가운데</option>
                <option value="right">오른쪽</option>
                <option value="justify">양쪽</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="word-dialog-label">왼쪽 들여쓰기(L):</label>
                <select className="word-dialog-input" value={indent} onChange={e => setIndent(e.target.value)}>
                  {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v * 40}px ({v}단계)</option>)}
                </select>
              </div>
              <div>
                <label className="word-dialog-label">줄 간격(N):</label>
                <select className="word-dialog-input" value={lineSpacing} onChange={e => setLineSpacing(e.target.value)}>
                  {LINE_SPACINGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  <option value="1.75">1.75 (기본)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="word-dialog-label">단락 앞(B):</label>
                <select className="word-dialog-input" value={spacingBefore} onChange={e => setSpacingBefore(e.target.value)}>
                  {["0", "6", "8", "12", "18", "24"].map(v => <option key={v} value={v}>{v}pt</option>)}
                </select>
              </div>
              <div>
                <label className="word-dialog-label">단락 뒤(F):</label>
                <select className="word-dialog-input" value={spacingAfter} onChange={e => setSpacingAfter(e.target.value)}>
                  {["0", "6", "8", "12", "18", "24"].map(v => <option key={v} value={v}>{v}pt</option>)}
                </select>
              </div>
            </div>
          </>
        )}
        {dialogTab === "linebreak" && (
          <LineBreakTab editor={editor} />
        )}
      </div>
      <DialogFooter onOk={apply} onCancel={onClose} />
    </DialogShell>
  );
}
