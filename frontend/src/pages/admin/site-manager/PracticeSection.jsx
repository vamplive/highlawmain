/** 업무분야 편집 — 3개 하위 탭(상담점검/하이로의강점/업무분야) */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS, fieldStyle, labelStyle, outlineBtnStyle } from "../../../components/admin/styles";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

const SUB_TABS = [
  { key: "pain-points", label: "상담점검" },
  { key: "advantages", label: "하이로의 강점" },
  { key: "areas", label: "업무 분야" },
];

/** 하위 탭 바 */
function SubTabBar({ active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 0,
      borderBottom: `2px solid ${COLORS.border}`,
      marginBottom: 24, overflowX: "auto",
    }}>
      {SUB_TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              padding: "8px 18px", fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? COLORS.accent : COLORS.textSecondary,
              background: "none", border: "none", cursor: "pointer",
              borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap", transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** 업무 분야 아코디언 (기존 PracticeSection 로직 분리) */
function AreasEditor({ settings, update, updateItem, addItem, removeItem, updateDetail, addDetail, removeDetail }) {
  const [expandedAreas, setExpandedAreas] = useState({});
  const s = settings;

  const toggleArea = (idx) => {
    setExpandedAreas((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <>
      <SectionCard title="소개 텍스트">
        <FormField
          label="설명"
          type="textarea"
          minHeight={72}
          value={s["practice/intro"].description}
          onChange={(v) => update("practice/intro", "description", v)}
        />
      </SectionCard>

      <SectionCard title="업무분야 목록">
        {s["practice/areas"].items.map((item, i) => {
          const isOpen = expandedAreas[i];
          return (
            <div key={i} style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 12,
              background: COLORS.bgForm, overflow: "hidden",
            }}>
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

              {isOpen && (
                <div style={{ padding: 16 }}>
                  <FieldRow>
                    <FormField label="제목" value={item.title} onChange={(v) => updateItem("practice/areas", i, "title", v)} />
                    <FormField label="부제목 (영문)" value={item.subtitle} onChange={(v) => updateItem("practice/areas", i, "subtitle", v)} />
                  </FieldRow>
                  <FormField label="설명" type="textarea" minHeight={48} value={item.desc} onChange={(v) => updateItem("practice/areas", i, "desc", v)} />
                  <FormField label="페이지 URL (연동 주소)" value={item.url || ""} onChange={(v) => updateItem("practice/areas", i, "url", v)} placeholder="/practice/..." />

                  <div style={{ marginTop: 16 }}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>상세 항목</label>
                    {item.details.map((d, di) => (
                      <div key={di} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input style={{ ...fieldStyle, flex: 1 }} value={d}
                          onChange={(e) => updateDetail(i, di, e.target.value)} />
                        {item.details.length > 1 && (
                          <button onClick={() => removeDetail(i, di)} style={outlineBtnStyle(COLORS.danger)}>x</button>
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
          onClick={() => addItem("practice/areas", { title: "", subtitle: "", desc: "", url: "", details: [""] })}
          label="업무분야 추가"
        />
      </SectionCard>
    </>
  );
}

export default function PracticeSection({ settings, update, updateItem, addItem, removeItem, updateDetail, addDetail, removeDetail }) {
  const [activeTab, setActiveTab] = useState("pain-points");
  const s = settings;

  return (
    <>
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* 상담점검 — practice/hero + practice/pain_points */}
      {activeTab === "pain-points" && (
        <>
          <SectionCard title="히어로 배너">
            <FieldRow>
              <FormField label="제목" value={s["practice/hero"].heading} onChange={(v) => update("practice/hero", "heading", v)} />
              <FormField label="부제목 (영문)" value={s["practice/hero"].subheading} onChange={(v) => update("practice/hero", "subheading", v)} />
            </FieldRow>
            <FormField
              label="설명 (홈페이지 히어로 배너 본문)"
              type="textarea"
              minHeight={60}
              value={s["practice/hero"].description || ""}
              onChange={(v) => update("practice/hero", "description", v)}
            />
          </SectionCard>

          <SectionCard title="의뢰인 고민 항목 (상담점검)">
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
              업무분야 페이지 첫 번째 탭에 표시됩니다.
            </p>
            {s["practice/pain_points"].items.map((item, i) => (
              <ItemCard key={i} onRemove={s["practice/pain_points"].items.length > 1 ? () => removeItem("practice/pain_points", i) : undefined}>
                <FormField
                  label={`항목 ${i + 1}`}
                  value={item.text}
                  onChange={(v) => updateItem("practice/pain_points", i, "text", v)}
                />
              </ItemCard>
            ))}
            <AddButton onClick={() => addItem("practice/pain_points", { text: "" })} label="항목 추가" />
          </SectionCard>
        </>
      )}

      {/* 하이로의 강점 — practice/advantages */}
      {activeTab === "advantages" && (
        <SectionCard title="하이로의 강점 항목">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            업무분야 페이지 두 번째 탭에 표시됩니다. 아이콘은 코드에서 순서대로 자동 지정됩니다.
          </p>
          {s["practice/advantages"].items.map((item, i) => (
            <ItemCard key={i} onRemove={s["practice/advantages"].items.length > 1 ? () => removeItem("practice/advantages", i) : undefined}>
              <FieldRow>
                <FormField label="제목" value={item.title} onChange={(v) => updateItem("practice/advantages", i, "title", v)} />
              </FieldRow>
              <FormField label="설명" type="textarea" minHeight={72} value={item.desc} onChange={(v) => updateItem("practice/advantages", i, "desc", v)} />
            </ItemCard>
          ))}
          <AddButton onClick={() => addItem("practice/advantages", { title: "", desc: "" })} label="강점 추가" />
        </SectionCard>
      )}

      {/* 업무 분야 — practice/intro + practice/areas */}
      {activeTab === "areas" && (
        <AreasEditor
          settings={settings}
          update={update}
          updateItem={updateItem}
          addItem={addItem}
          removeItem={removeItem}
          updateDetail={updateDetail}
          addDetail={addDetail}
          removeDetail={removeDetail}
        />
      )}
    </>
  );
}
