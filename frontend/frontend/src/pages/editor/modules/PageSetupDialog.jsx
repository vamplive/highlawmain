/**
 * PageSetupDialog — 페이지 설정 대화상자
 * 여백, 용지 크기, 방향, 머리글/바닥글 레이아웃을 설정한다.
 */
import { useState } from "react";
import { MARGIN_PRESETS, PAGE_SIZES } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

/* ── 레이아웃 탭 (PageSetupDialog 하위) ── */
function PageSetupLayoutTab({ settings, setSettings }) {
  const s = settings || { headerPos: 12.5, footerPos: 12.5, differentFirstPage: false, differentOddEven: false };
  const update = (key, value) => {
    setSettings?.({ ...s, [key]: value });
  };
  return (
    <div style={{ fontSize: 12, color: "#555" }}>
      <div style={{ fontWeight: 600, marginBottom: 12, color: "#333" }}>머리글 및 바닥글</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label className="word-dialog-label">머리글 위치(H):</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="number" step="0.5" min="0" max="50"
              className="word-dialog-input" style={{ width: 80 }}
              value={s.headerPos}
              onChange={e => update("headerPos", parseFloat(e.target.value) || 0)} />
            <span style={{ fontSize: 11, color: "#888" }}>mm</span>
          </div>
        </div>
        <div>
          <label className="word-dialog-label">바닥글 위치(F):</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="number" step="0.5" min="0" max="50"
              className="word-dialog-input" style={{ width: 80 }}
              value={s.footerPos}
              onChange={e => update("footerPos", parseFloat(e.target.value) || 0)} />
            <span style={{ fontSize: 11, color: "#888" }}>mm</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={s.differentFirstPage}
            onChange={e => update("differentFirstPage", e.target.checked)} />
          첫 페이지 다르게(A)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={s.differentOddEven}
            onChange={e => update("differentOddEven", e.target.checked)} />
          짝수/홀수 페이지 다르게(E)
        </label>
      </div>
    </div>
  );
}

export function PageSetupDialog({ margins, setMargins, orientation, setOrientation, pageSize, setPageSize, customMargins, setCustomMargins, onClose, headerFooterSettings, setHeaderFooterSettings }) {
  const [dialogTab, setDialogTab] = useState("margins");
  // Local state for custom margin inputs (in mm, converted to px at 96dpi: 1mm ~ 3.78px)
  const mmToPx = (mm) => Math.round(mm * 3.78);
  const pxToMm = (px) => Math.round(px / 3.78 * 10) / 10;

  const currentPreset = MARGIN_PRESETS.find(m => m.value === margins);
  const [localMargins, setLocalMargins] = useState({
    top: pxToMm(customMargins?.top ?? currentPreset?.top ?? 96),
    bottom: pxToMm(customMargins?.bottom ?? currentPreset?.bottom ?? 96),
    left: pxToMm(customMargins?.left ?? currentPreset?.left ?? 120),
    right: pxToMm(customMargins?.right ?? currentPreset?.right ?? 120),
  });

  const applyCustomMargins = () => {
    const px = {
      top: mmToPx(localMargins.top),
      bottom: mmToPx(localMargins.bottom),
      left: mmToPx(localMargins.left),
      right: mmToPx(localMargins.right),
    };
    setCustomMargins?.(px);
    setMargins("custom");
    onClose();
  };

  const marginField = (label, key) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <label style={{ fontSize: 12, color: "#444", width: 40 }}>{label}:</label>
      <input type="number" step="0.1" min="0" max="100"
        className="word-dialog-input"
        value={localMargins[key]}
        onChange={(e) => setLocalMargins(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
        style={{ width: 80 }} />
      <span style={{ fontSize: 11, color: "#888" }}>mm</span>
    </div>
  );

  return (
    <DialogShell title="페이지 설정" onClose={onClose} width={480}>
      <div className="word-dialog-tabs">
        <button className={`word-dialog-tab${dialogTab === "margins" ? " active" : ""}`} onClick={() => setDialogTab("margins")}>여백</button>
        <button className={`word-dialog-tab${dialogTab === "paper" ? " active" : ""}`} onClick={() => setDialogTab("paper")}>용지</button>
        <button className={`word-dialog-tab${dialogTab === "layout" ? " active" : ""}`} onClick={() => setDialogTab("layout")}>레이아웃</button>
      </div>
      <div className="word-dialog-body">
        {dialogTab === "margins" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label className="word-dialog-label">여백 사전 설정:</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {MARGIN_PRESETS.map(m => (
                  <button key={m.value} type="button"
                    onClick={() => {
                      setMargins(m.value);
                      setLocalMargins({
                        top: pxToMm(m.top), bottom: pxToMm(m.bottom),
                        left: pxToMm(m.left), right: pxToMm(m.right),
                      });
                    }}
                    style={{
                      padding: "8px 12px", fontSize: 11, border: margins === m.value ? "2px solid #0078d4" : "1px solid #ccc",
                      borderRadius: 3, background: margins === m.value ? "#eff6ff" : "#fff", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", flex: 1,
                    }}>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom margin inputs */}
            <div style={{ marginBottom: 16 }}>
              <label className="word-dialog-label" style={{ marginBottom: 8 }}>사용자 지정 여백:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", padding: "12px", background: "#f9f9f9", borderRadius: 4, border: "1px solid #eee" }}>
                {marginField("위", "top")}
                {marginField("아래", "bottom")}
                {marginField("왼쪽", "left")}
                {marginField("오른쪽", "right")}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="word-dialog-label">방향:</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setOrientation("portrait")}
                  style={{
                    padding: "8px 16px", border: orientation === "portrait" ? "2px solid #0078d4" : "1px solid #ccc",
                    borderRadius: 3, background: orientation === "portrait" ? "#eff6ff" : "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                  <span style={{ fontSize: 20 }}>▯</span> 세로
                </button>
                <button type="button" onClick={() => setOrientation("landscape")}
                  style={{
                    padding: "8px 16px", border: orientation === "landscape" ? "2px solid #0078d4" : "1px solid #ccc",
                    borderRadius: 3, background: orientation === "landscape" ? "#eff6ff" : "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                  <span style={{ fontSize: 20, transform: "rotate(90deg)", display: "inline-block" }}>▯</span> 가로
                </button>
              </div>
            </div>
          </>
        )}
        {dialogTab === "paper" && (
          <div>
            <label className="word-dialog-label">용지 크기:</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {PAGE_SIZES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setPageSize(p.value)}
                  style={{
                    padding: "8px 12px", border: pageSize === p.value ? "2px solid #0078d4" : "1px solid #ccc",
                    borderRadius: 3, background: pageSize === p.value ? "#eff6ff" : "#fff", cursor: "pointer",
                    textAlign: "left", display: "flex", justifyContent: "space-between",
                  }}>
                  <span style={{ fontWeight: 500 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {dialogTab === "layout" && (
          <PageSetupLayoutTab settings={headerFooterSettings} setSettings={setHeaderFooterSettings} />
        )}
      </div>
      <DialogFooter onOk={applyCustomMargins} onCancel={onClose} />
    </DialogShell>
  );
}
