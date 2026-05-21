/**
 * 반복 항목 에디터 — 학력/경력/논문 등 배열 필드를 행 단위로 추가·삭제·이동.
 *
 * @param {string} label - 섹션 라벨 (예: "학력")
 * @param {Array} value - 현재 행 배열. 단순 문자열 배열 또는 객체 배열.
 * @param {function} onChange - 변경된 배열을 인자로 호출
 * @param {Array<{key, label, placeholder, type, width}>} fields
 *   객체형: 한 행이 여러 필드. 단순 문자열형이면 fields = [{ key: "value", label: "...", textarea: true }] 처럼 단일 필드 사용
 * @param {boolean} simple - true 면 value 가 단순 문자열 배열로 처리됨
 * @param {string} addLabel - 추가 버튼 라벨 (기본: "+ 항목 추가")
 */
import { COLORS } from "./styles";

export default function RepeatableEditor({
  label,
  value,
  onChange,
  fields,
  simple = false,
  addLabel = "+ 항목 추가",
}) {
  const rows = Array.isArray(value) ? value : [];

  const update = (idx, key, val) => {
    const next = rows.slice();
    if (simple) {
      next[idx] = val;
    } else {
      next[idx] = { ...(next[idx] || {}), [key]: val };
    }
    onChange(next);
  };

  const add = () => {
    const blank = simple ? "" : Object.fromEntries(fields.map((f) => [f.key, ""]));
    onChange([...rows, blank]);
  };

  const remove = (idx) => {
    const next = rows.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    const next = rows.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <label style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>{label}</label>
        <button type="button" onClick={add} style={addBtnStyle}>{addLabel}</button>
      </div>

      {rows.length === 0 ? (
        <div style={emptyHintStyle}>등록된 항목이 없습니다. 우측 상단의 "추가" 버튼을 누르세요.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row, idx) => (
            <li key={idx} style={rowStyle}>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: simple ? "1fr" : buildGridTemplate(fields), gap: 8 }}>
                {simple ? (
                  <FieldInput
                    field={fields[0]}
                    value={typeof row === "string" ? row : ""}
                    onChange={(v) => update(idx, "value", v)}
                  />
                ) : (
                  fields.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      value={(row && row[f.key]) || ""}
                      onChange={(v) => update(idx, f.key, v)}
                    />
                  ))
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} style={iconBtnStyle} title="위로">▲</button>
                <button type="button" onClick={() => move(idx, +1)} disabled={idx === rows.length - 1} style={iconBtnStyle} title="아래로">▼</button>
                <button type="button" onClick={() => remove(idx)} style={{ ...iconBtnStyle, color: "#c00" }} title="삭제">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const common = {
    value,
    onChange: (e) => onChange(e.target.value),
    placeholder: field.placeholder || "",
    style: {
      width: "100%",
      padding: "8px 10px",
      fontSize: 13,
      border: `1px solid ${COLORS.borderField}`,
      borderRadius: 4,
      background: "#fff",
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
    },
  };
  if (field.type === "textarea") {
    return <textarea {...common} rows={field.rows || 2} style={{ ...common.style, resize: "vertical", minHeight: 56 }} />;
  }
  return <input type={field.type || "text"} {...common} aria-label={field.label} />;
}

function buildGridTemplate(fields) {
  return fields.map((f) => f.width || "1fr").join(" ");
}

const rowStyle = {
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
  padding: 10,
  background: "#fff",
  border: `1px solid ${COLORS.borderLight}`,
  borderRadius: 6,
};

const iconBtnStyle = {
  width: 28,
  height: 24,
  fontSize: 11,
  border: `1px solid ${COLORS.borderLight}`,
  background: "#fff",
  borderRadius: 4,
  cursor: "pointer",
  padding: 0,
  lineHeight: 1,
};

const addBtnStyle = {
  fontSize: 12,
  padding: "5px 12px",
  border: `1px solid ${COLORS.borderField}`,
  background: "#fff",
  borderRadius: 4,
  cursor: "pointer",
  color: COLORS.text,
};

const emptyHintStyle = {
  fontSize: 12,
  color: COLORS.muted,
  padding: "12px 14px",
  background: "#fafaf9",
  border: `1px dashed ${COLORS.border}`,
  borderRadius: 6,
};
