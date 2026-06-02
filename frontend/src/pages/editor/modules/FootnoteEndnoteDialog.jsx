/**
 * FootnoteEndnoteDialog — 각주/미주 삽입 대화상자 (Word 스타일)
 *
 * 위치 선택 (각주/미주), 번호 형식, 시작 번호, 번호 매기기 방식 설정.
 * 미리보기를 통해 선택한 형식을 즉시 확인할 수 있다.
 */
import { useState } from "react";
import { formatFootnoteNumber } from "./footnote-extension";

/* ── 번호 형식 옵션 ── */
const FOOTNOTE_FORMATS = [
  { value: "decimal", label: "1, 2, 3, ..." },
  { value: "lowerAlpha", label: "a, b, c, ..." },
  { value: "upperAlpha", label: "A, B, C, ..." },
  { value: "lowerRoman", label: "i, ii, iii, ..." },
  { value: "upperRoman", label: "I, II, III, ..." },
  { value: "symbol", label: "*, †, ‡, ..." },
];

export function FootnoteEndnoteDialog({
  onInsert, onClose,
  numberFormat, setNumberFormat,
  endnoteNumberFormat, setEndnoteNumberFormat,
}) {
  const [location, setLocation] = useState("footnote"); // footnote | endnote
  const [startNumber, setStartNumber] = useState(1);
  const [numbering, setNumbering] = useState("continuous"); // continuous | eachSection | eachPage

  const handleInsert = () => {
    onInsert({
      type: location,
      numberFormat: location === "footnote" ? numberFormat : endnoteNumberFormat,
      startNumber,
      numbering,
    });
    onClose();
  };

  const currentFormat = location === "footnote" ? numberFormat : endnoteNumberFormat;
  const setCurrentFormat = location === "footnote" ? setNumberFormat : setEndnoteNumberFormat;

  return (
    <div className="word-dialog-overlay" onClick={onClose}>
      <div className="word-dialog" style={{ minWidth: 440, maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="word-dialog-title">
          <span>각주 및 미주</span>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
        <div className="word-dialog-body" style={{ padding: "16px 24px" }}>
          {/* 위치 선택 */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <fieldset style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "12px 16px", flex: 1 }}>
              <legend style={{ fontSize: 11, fontWeight: 600, color: "#555", padding: "0 4px" }}>위치</legend>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 12 }}>
                <input type="radio" name="noteType" value="footnote"
                  checked={location === "footnote"} onChange={() => setLocation("footnote")} />
                <span style={{ fontWeight: location === "footnote" ? 600 : 400 }}>각주(F)</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: "auto" }}>페이지 아래쪽</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
                <input type="radio" name="noteType" value="endnote"
                  checked={location === "endnote"} onChange={() => setLocation("endnote")} />
                <span style={{ fontWeight: location === "endnote" ? 600 : 400 }}>미주(E)</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: "auto" }}>문서 끝</span>
              </label>
            </fieldset>
          </div>

          {/* 번호 형식 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="word-dialog-label" style={{ fontSize: 11 }}>번호 형식(N):</label>
              <select className="word-dialog-input" value={currentFormat}
                onChange={(e) => setCurrentFormat(e.target.value)}
                style={{ width: "100%", padding: "4px 8px", fontSize: 12 }}>
                {FOOTNOTE_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="word-dialog-label" style={{ fontSize: 11 }}>시작 번호(S):</label>
              <input type="number" className="word-dialog-input" min={1} value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: "100%", padding: "4px 8px", fontSize: 12 }} />
            </div>
          </div>

          {/* 번호 매기기 */}
          <div style={{ marginBottom: 8 }}>
            <label className="word-dialog-label" style={{ fontSize: 11 }}>번호 매기기(U):</label>
            <select className="word-dialog-input" value={numbering}
              onChange={(e) => setNumbering(e.target.value)}
              style={{ width: "100%", padding: "4px 8px", fontSize: 12 }}>
              <option value="continuous">연속</option>
              <option value="eachSection">각 구역마다 다시 시작</option>
              <option value="eachPage">각 페이지마다 다시 시작</option>
            </select>
          </div>

          {/* 미리보기 */}
          <div style={{
            marginTop: 16, padding: 12, background: "#f8f9fa", border: "1px solid #e5e7eb",
            borderRadius: 4, fontSize: 11, color: "#666",
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>미리보기:</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <sup style={{ color: "#0563C1", fontWeight: 600, fontSize: "0.8em" }}>
                {formatFootnoteNumber(startNumber, currentFormat)}
              </sup>
              <span style={{ fontSize: "9pt", color: "#333" }}>
                {location === "footnote" ? "각주 내용이 여기에 표시됩니다." : "미주 내용이 여기에 표시됩니다."}
              </span>
            </div>
          </div>
        </div>
        <div className="word-dialog-footer">
          <button className="word-dialog-btn primary" onClick={handleInsert}>삽입(I)</button>
          <button className="word-dialog-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
