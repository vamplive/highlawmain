/** 사무소 소개 콘텐츠 편집 탭 */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";
import { COLORS, outlineBtnStyle } from "../../../components/admin/styles";

const SUB_TABS = [
  { key: "hero", label: "히어로" },
  { key: "greetings", label: "인사말" },
  { key: "values", label: "핵심가치" },
  { key: "directions", label: "오시는 길" },
  { key: "probono", label: "공익활동" },
  { key: "history", label: "연혁" },
];

export default function AboutSection({ settings, update, updateItem, addItem, removeItem }) {
  const [activeSubTab, setActiveSubTab] = useState("hero");

  const s = settings;
  const hero = s["about/hero"] || {};
  const greetings = s["about/greetings"] || {};
  const values = s["about/values"] || { items: [] };
  const directions = s["about/directions"] || {};
  const probono = s["about/probono"] || { items: [] };
  const history = s["about/history"] || { items: [] };

  const handleEventChange = (yearIdx, eventIdx, field, value) => {
    const nextItems = [...(history.items || [])];
    const nextEvents = [...(nextItems[yearIdx].events || [])];
    nextEvents[eventIdx] = { ...nextEvents[eventIdx], [field]: value };
    nextItems[yearIdx] = { ...nextItems[yearIdx], events: nextEvents };
    update("about/history", "items", nextItems);
  };

  const addEvent = (yearIdx) => {
    const nextItems = [...(history.items || [])];
    const nextEvents = [...(nextItems[yearIdx].events || [])];
    nextEvents.push({ title: "", desc: "" });
    nextItems[yearIdx] = { ...nextItems[yearIdx], events: nextEvents };
    update("about/history", "items", nextItems);
  };

  const removeEvent = (yearIdx, eventIdx) => {
    const nextItems = [...(history.items || [])];
    const nextEvents = [...(nextItems[yearIdx].events || [])];
    nextEvents.splice(eventIdx, 1);
    nextItems[yearIdx] = { ...nextItems[yearIdx], events: nextEvents };
    update("about/history", "items", nextItems);
  };

  const addYearGroup = () => {
    addItem("about/history", { year: "", events: [{ title: "", desc: "" }] });
  };

  const tabStyle = (isActive) => ({
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? COLORS.accent : COLORS.textSecondary,
    background: isActive ? "rgba(26,58,107,0.08)" : "none",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* 서브 탭 바 */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap",
        borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8
      }}>
        {SUB_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveSubTab(tab.key)} style={tabStyle(activeSubTab === tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeSubTab === "hero" && (
        <SectionCard title="히어로">
          <FieldRow>
            <FormField label="제목" value={hero.heading || ""} onChange={(v) => update("about/hero", "heading", v)} />
            <FormField label="부제목" value={hero.subheading || ""} onChange={(v) => update("about/hero", "subheading", v)} />
          </FieldRow>
          <div style={{ marginTop: 12 }}>
            <FormField label="설명" type="textarea" minHeight={48} value={hero.description || ""} onChange={(v) => update("about/hero", "description", v)} />
          </div>
        </SectionCard>
      )}

      {activeSubTab === "greetings" && (
        <SectionCard title="인사말 설정">
          <FieldRow>
            <FormField label="소제목 (Eyebrow)" value={greetings.eyebrow || ""} onChange={(v) => update("about/greetings", "eyebrow", v)} placeholder="Introduction" />
            <FormField label="대제목 (Title)" value={greetings.title || ""} onChange={(v) => update("about/greetings", "title", v)} placeholder="Message from Partners" />
          </FieldRow>
          <div style={{ marginTop: 12 }}>
            <FormField label="인사말 본문 (문단 구분은 줄바꿈 두 번)" type="textarea" minHeight={240} value={greetings.content || ""} onChange={(v) => update("about/greetings", "content", v)} />
          </div>
          <div style={{ marginTop: 12 }}>
            <FormField label="대표 변호사명 표기" value={greetings.partners || ""} onChange={(v) => update("about/greetings", "partners", v)} placeholder="법무법인 하이로 대표변호사 조덕재 · 김범 · 강민구" />
          </div>
        </SectionCard>
      )}
      {activeSubTab === "values" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SectionCard title="기본 제목 설정">
            <FieldRow>
              <FormField label="소제목 (Eyebrow)" value={values.eyebrow || ""} onChange={(v) => update("about/values", "eyebrow", v)} placeholder="OUR PHILOSOPHY" />
              <FormField label="대제목 (Title)" value={values.title || ""} onChange={(v) => update("about/values", "title", v)} placeholder="하이로의 철학" />
            </FieldRow>
          </SectionCard>
          <SectionCard title="핵심가치 항목">
            {(values.items || []).map((item, i) => (
              <ItemCard key={i} onRemove={values.items.length > 1 ? () => removeItem("about/values", i) : undefined}>
                <FieldRow cols={3}>
                  <FormField label="제목" value={item.title || ""} onChange={(v) => updateItem("about/values", i, "title", v)} />
                  <FormField label="부제목 (영문)" value={item.subtitle || ""} onChange={(v) => updateItem("about/values", i, "subtitle", v)} />
                  <FormField label="설명" value={item.desc || ""} onChange={(v) => updateItem("about/values", i, "desc", v)} />
                </FieldRow>
              </ItemCard>
            ))}
            <AddButton onClick={() => addItem("about/values", { title: "", subtitle: "", desc: "" })} label="가치 추가" />
          </SectionCard>
        </div>
      )}

      {activeSubTab === "directions" && (
        <>
          <SectionCard title="기본 정보 및 주소">
            <FieldRow>
              <FormField label="소제목 (Eyebrow)" value={directions.eyebrow || ""} onChange={(v) => update("about/directions", "eyebrow", v)} placeholder="DIRECTIONS" />
              <FormField label="대제목 (Title)" value={directions.title || ""} onChange={(v) => update("about/directions", "title", v)} placeholder="법무법인 하이로 서울 사무소" />
            </FieldRow>
            <div style={{ marginTop: 12 }}>
              <FormField label="주소" value={directions.address || ""} onChange={(v) => update("about/directions", "address", v)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <FormField label="대표전화" value={directions.phone || ""} onChange={(v) => update("about/directions", "phone", v)} />
              <FormField label="팩스번호" value={directions.fax || ""} onChange={(v) => update("about/directions", "fax", v)} />
              <FormField label="이메일" value={directions.email || ""} onChange={(v) => update("about/directions", "email", v)} />
            </div>
          </SectionCard>

          <SectionCard title="지도 서비스 연동 링크">
            <FieldRow>
              <FormField label="네이버 지도 링크" value={directions.naverMapUrl || ""} onChange={(v) => update("about/directions", "naverMapUrl", v)} placeholder="https://map.naver.com/..." />
              <FormField label="카카오 맵 링크" value={directions.kakaoMapUrl || ""} onChange={(v) => update("about/directions", "kakaoMapUrl", v)} placeholder="https://map.kakao.com/..." />
            </FieldRow>
          </SectionCard>

          <SectionCard title="대중교통 및 주차 안내">
            <FormField label="지하철 이용 안내" type="textarea" minHeight={60} value={directions.subway || ""} onChange={(v) => update("about/directions", "subway", v)} />
            <div style={{ marginTop: 12 }}>
              <FormField label="버스 이용 안내" type="textarea" minHeight={60} value={directions.bus || ""} onChange={(v) => update("about/directions", "bus", v)} />
            </div>
            <div style={{ marginTop: 12 }}>
              <FormField label="주차 안내" type="textarea" minHeight={60} value={directions.parking || ""} onChange={(v) => update("about/directions", "parking", v)} />
            </div>
          </SectionCard>
        </>
      )}

      {activeSubTab === "probono" && (
        <SectionCard title="공익활동 설정">
          <FieldRow>
            <FormField label="소제목 (Eyebrow)" value={probono.eyebrow || ""} onChange={(v) => update("about/probono", "eyebrow", v)} />
            <FormField label="대제목 (Title)" value={probono.title || ""} onChange={(v) => update("about/probono", "title", v)} />
          </FieldRow>
          <div style={{ marginTop: 12, marginBottom: 20 }}>
            <FormField label="공익활동 설명글" type="textarea" minHeight={60} value={probono.description || ""} onChange={(v) => update("about/probono", "description", v)} />
          </div>

          <div style={{ borderBottom: "1px solid #eee", marginBottom: 16 }} />

          {(probono.items || []).map((item, i) => (
            <ItemCard key={i} onRemove={probono.items.length > 1 ? () => removeItem("about/probono", i) : undefined}>
              <FieldRow>
                <FormField label="태그 / 배지" value={item.badge || ""} onChange={(v) => updateItem("about/probono", i, "badge", v)} placeholder="예: 무료상담" />
                <FormField label="활동명 (제목)" value={item.title || ""} onChange={(v) => updateItem("about/probono", i, "title", v)} />
              </FieldRow>
              <div style={{ marginTop: 8 }}>
                <FormField label="설명" type="textarea" minHeight={48} value={item.desc || ""} onChange={(v) => updateItem("about/probono", i, "desc", v)} />
              </div>
            </ItemCard>
          ))}
          <AddButton onClick={() => addItem("about/probono", { badge: "", title: "", desc: "" })} label="활동 추가" />
        </SectionCard>
      )}

      {activeSubTab === "history" && (
        <SectionCard title="연혁 설정">
          <FieldRow>
            <FormField label="소제목 (Eyebrow)" value={history.eyebrow || ""} onChange={(v) => update("about/history", "eyebrow", v)} />
            <FormField label="대제목 (Title)" value={history.title || ""} onChange={(v) => update("about/history", "title", v)} />
          </FieldRow>

          <div style={{ borderBottom: "1px solid #eee", marginBottom: 16, marginTop: 16 }} />

          {(history.items || []).map((item, i) => (
            <ItemCard key={i} onRemove={history.items.length > 1 ? () => removeItem("about/history", i) : undefined}>
              <div style={{ marginBottom: 16 }}>
                <FormField label="연도 / 기간" value={item.year || ""} onChange={(v) => updateItem("about/history", i, "year", v)} placeholder="예: 2026 - 현재" />
              </div>

              <div style={{ paddingLeft: 16, borderLeft: `2px dashed ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                <h5 style={{ margin: 0, fontSize: 12, fontWeight: 600, color: COLORS.accent }}>연혁 상세 항목</h5>
                
                {/* 하위 호환성: 기존 데이터의 단일 연혁 항목 처리 */}
                {!item.events && (
                  <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                    <FieldRow>
                      <FormField label="연혁 제목" value={item.title || ""} onChange={(v) => updateItem("about/history", i, "title", v)} />
                      <FormField label="설명" type="textarea" value={item.desc || ""} onChange={(v) => updateItem("about/history", i, "desc", v)} />
                    </FieldRow>
                    <button
                      type="button"
                      onClick={() => {
                        const nextItems = [...(history.items || [])];
                        nextItems[i] = {
                          year: item.year || "",
                          events: [
                            { title: item.title || "", desc: item.desc || "" },
                            { title: "", desc: "" }
                          ]
                        };
                        update("about/history", "items", nextItems);
                      }}
                      style={{ ...outlineBtnStyle(), alignSelf: "flex-start", fontSize: 11, padding: "2px 8px" }}
                    >
                      + 상세 항목 추가 (다중 등록 변환)
                    </button>
                  </div>
                )}

                {item.events && (item.events || []).map((event, eventIdx) => (
                  <div key={eventIdx} style={{ padding: 12, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, background: "#fafafa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>항목 #{eventIdx + 1}</span>
                      {item.events.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEvent(i, eventIdx)}
                          style={{ ...outlineBtnStyle(COLORS.danger), fontSize: 11, padding: "2px 8px" }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <FieldRow>
                      <FormField label="연혁 제목" value={event.title || ""} onChange={(v) => handleEventChange(i, eventIdx, "title", v)} />
                      <FormField label="설명" type="textarea" value={event.desc || ""} onChange={(v) => handleEventChange(i, eventIdx, "desc", v)} />
                    </FieldRow>
                  </div>
                ))}

                {item.events && (
                  <button
                    type="button"
                    onClick={() => addEvent(i)}
                    style={{ ...outlineBtnStyle(), alignSelf: "flex-start", fontSize: 11, padding: "2px 8px" }}
                  >
                    + 상세 항목 추가
                  </button>
                )}
              </div>
            </ItemCard>
          ))}
          <AddButton onClick={addYearGroup} label="연도 추가" />
        </SectionCard>
      )}
    </div>
  );
}
