/** 업무분야 콘텐츠 편집 탭 */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS, fieldStyle, labelStyle, outlineBtnStyle } from "../../../components/admin/styles";
import { SectionCard, AddButton, FieldRow } from "./shared";

const SUB_TABS = [
  { key: "hero", label: "히어로" },
  { key: "painPoints", label: "상담점검" },
  { key: "advantages", label: "하이로의 강점" },
  { key: "areas", label: "업무분야" }
];

export default function PracticeSection({ settings, update, updateItem, addItem, removeItem, updateDetail, addDetail, removeDetail }) {
  const [activeSubTab, setActiveSubTab] = useState("hero");
  const [expandedAreas, setExpandedAreas] = useState({});
  const s = settings;

  const toggleArea = (idx) => {
    setExpandedAreas((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div>
      {/* 하위 탭 */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${COLORS.borderLight}`, marginBottom: 20 }}>
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              style={{
                padding: "10px 22px", fontSize: 13, fontWeight: isActive ? 600 : 400,
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

      {/* ── 1. 히어로 탭 ── */}
      {activeSubTab === "hero" && (
        <>
          <SectionCard title="히어로">
            <FieldRow>
              <FormField label="제목" value={s["practice/hero"]?.heading || ""} onChange={(v) => update("practice/hero", "heading", v)} />
              <FormField label="부제목" value={s["practice/hero"]?.subheading || ""} onChange={(v) => update("practice/hero", "subheading", v)} />
            </FieldRow>
          </SectionCard>
          <SectionCard title="소개 설명">
            <FormField label="설명" type="textarea" minHeight={72} value={s["practice/intro"]?.description || ""} onChange={(v) => update("practice/intro", "description", v)} />
          </SectionCard>
        </>
      )}

      {/* ── 2. 상담점검 탭 ── */}
      {activeSubTab === "painPoints" && (
        <SectionCard title="상담점검 항목 (자가 진단 질문)">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            * 강조하고 싶은 텍스트는 <code>**강조할단어**</code> 처럼 감싸주세요 (예: 복잡한 **민사소송**으로 고민이다).
          </p>
          {(s["practice/painPoints"]?.items || []).map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary, minWidth: 24 }}>#{idx + 1}</span>
              <div style={{ flex: 1 }}>
                <input
                  style={fieldStyle}
                  value={item.text}
                  onChange={(e) => updateItem("practice/painPoints", idx, "text", e.target.value)}
                  placeholder="예: 부당해고 처리에 대한 법적 자문이 시급하다."
                />
              </div>
              <button
                onClick={() => removeItem("practice/painPoints", idx)}
                style={outlineBtnStyle(COLORS.danger)}
                title="삭제"
              >
                삭제
              </button>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <AddButton
              onClick={() => addItem("practice/painPoints", { text: "" })}
              label="진단 항목 추가"
            />
          </div>
        </SectionCard>
      )}

      {/* ── 3. 하이로의 강점 탭 ── */}
      {activeSubTab === "advantages" && (
        <>
          <SectionCard title="핵심 지표 (4개 카드)">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {(s["practice/caseResults"]?.items || []).map((item, idx) => (
                <div key={idx} style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bgForm }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent }}>지표 #{idx + 1} ({item.category})</span>
                  </div>
                  <FieldRow>
                    <FormField label="숫자/텍스트 (예: 1:1, 정밀, 신속)" value={item.amount} onChange={(v) => updateItem("practice/caseResults", idx, "amount", v)} />
                    <FormField label="단위/설명 (예: 직접상담, 법리분석)" value={item.unit} onChange={(v) => updateItem("practice/caseResults", idx, "unit", v)} />
                  </FieldRow>
                  <FormField label="상세 설명" value={item.label} onChange={(v) => updateItem("practice/caseResults", idx, "label", v)} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="특화 강점 (Advantages)">
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
              아이콘 이름 종류: Target, Shield, Clock, Users, Scale, Landmark 등
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {(s["practice/advantages"]?.items || []).map((item, idx) => (
                <div key={idx} style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bgForm }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent }}>강점 #{idx + 1}</span>
                    <button
                      onClick={() => removeItem("practice/advantages", idx)}
                      style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 12 }}
                    >
                      삭제
                    </button>
                  </div>
                  <FieldRow>
                    <FormField label="아이콘명 (Lucide)" value={item.iconName} onChange={(v) => updateItem("practice/advantages", idx, "iconName", v)} />
                    <FormField label="제목" value={item.title} onChange={(v) => updateItem("practice/advantages", idx, "title", v)} />
                  </FieldRow>
                  <FormField label="설명" type="textarea" value={item.desc} onChange={(v) => updateItem("practice/advantages", idx, "desc", v)} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <AddButton
                onClick={() => addItem("practice/advantages", { iconName: "Target", title: "", desc: "" })}
                label="강점 추가"
              />
            </div>
          </SectionCard>
        </>
      )}

      {/* ── 4. 업무분야 목록 탭 ── */}
      {activeSubTab === "areas" && (
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
      )}
    </div>
  );
}
