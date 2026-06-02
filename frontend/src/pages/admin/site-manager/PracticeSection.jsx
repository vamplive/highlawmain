/** 업무분야 콘텐츠 편집 탭 */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS, fieldStyle, labelStyle, outlineBtnStyle } from "../../../components/admin/styles";
import { SectionCard, AddButton, FieldRow } from "./shared";

export default function PracticeSection({ settings, update, updateItem, addItem, removeItem, updateDetail, addDetail, removeDetail }) {
  const [expandedAreas, setExpandedAreas] = useState({});
  const s = settings;

  const toggleArea = (idx) => {
    setExpandedAreas((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <>
      <SectionCard title="히어로">
        <FieldRow>
          <FormField label="제목" value={s["practice/hero"].heading} onChange={(v) => update("practice/hero", "heading", v)} />
          <FormField label="부제목" value={s["practice/hero"].subheading} onChange={(v) => update("practice/hero", "subheading", v)} />
        </FieldRow>
      </SectionCard>

      <SectionCard title="소개">
        <FormField label="설명" type="textarea" minHeight={72} value={s["practice/intro"].description} onChange={(v) => update("practice/intro", "description", v)} />
      </SectionCard>

      <SectionCard title="업무분야 목록">
        {s["practice/areas"].items.map((item, i) => {
          const isOpen = expandedAreas[i];
          return (
            <div key={i} style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 12,
              background: COLORS.bgForm, overflow: "hidden",
            }}>
              {/* 아코디언 헤더 */}
              <div
                onClick={() => toggleArea(i)}
                style={{
                  padding: "12px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: isOpen ? "rgba(26,58,107,0.08)" : "transparent",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{item.title || "(제목 없음)"}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{item.subtitle}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {s["practice/areas"].items.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeItem("practice/areas", i); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, fontSize: 13, padding: "2px 6px" }}>
                      삭제
                    </button>
                  )}
                  <span style={{ fontSize: 16, color: COLORS.textMuted, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                    &#9662;
                  </span>
                </div>
              </div>

              {/* 아코디언 본문 */}
              {isOpen && (
                <div style={{ padding: 16 }}>
                  <FieldRow>
                    <FormField label="제목" value={item.title} onChange={(v) => updateItem("practice/areas", i, "title", v)} />
                    <FormField label="부제목 (영문)" value={item.subtitle} onChange={(v) => updateItem("practice/areas", i, "subtitle", v)} />
                  </FieldRow>
                  <FormField label="설명" type="textarea" minHeight={48} value={item.desc} onChange={(v) => updateItem("practice/areas", i, "desc", v)} />

                  <div style={{ marginTop: 16 }}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>상세 항목</label>
                    {item.details.map((d, di) => (
                      <div key={di} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input style={{ ...fieldStyle, flex: 1 }} value={d}
                          onChange={(e) => updateDetail(i, di, e.target.value)} />
                        {item.details.length > 1 && (
                          <button onClick={() => removeDetail(i, di)}
                            style={outlineBtnStyle(COLORS.danger)}>
                            x
                          </button>
                        )}
                      </div>
                    ))}
                    <AddButton onClick={() => addDetail(i)} label="상세 추가" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <AddButton
          onClick={() => addItem("practice/areas", { title: "", subtitle: "", desc: "", details: [""] })}
          label="업무분야 추가"
        />
      </SectionCard>
    </>
  );
}
