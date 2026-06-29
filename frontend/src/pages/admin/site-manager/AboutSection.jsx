/** 사무소 소개 편집 — 5개 하위 탭(인사말/핵심가치/오시는길/공익활동/연혁) */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

const SUB_TABS = [
  { key: "greetings", label: "인사말" },
  { key: "values", label: "핵심가치" },
  { key: "directions", label: "오시는 길" },
  { key: "probono", label: "공익활동" },
  { key: "history", label: "연혁" },
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

export default function AboutSection({ settings, update, updateItem, addItem, removeItem }) {
  const [activeTab, setActiveTab] = useState("greetings");
  const s = settings;

  return (
    <>
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* 인사말 — about/hero(히어로) + about/philosophy(인사말 본문) */}
      {activeTab === "greetings" && (
        <>
          <SectionCard title="히어로 배너">
            <FieldRow>
              <FormField label="제목" value={s["about/hero"].heading} onChange={(v) => update("about/hero", "heading", v)} />
              <FormField label="부제목 (영문)" value={s["about/hero"].subheading} onChange={(v) => update("about/hero", "subheading", v)} />
            </FieldRow>
            <div style={{ marginTop: 12 }}>
              <FormField label="설명" type="textarea" minHeight={48} value={s["about/hero"].description} onChange={(v) => update("about/hero", "description", v)} />
            </div>
          </SectionCard>

          <SectionCard title="인사말 본문">
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
              홈페이지 소개 페이지 &gt; 인사말 탭에 표시됩니다. 단락 사이는 빈 줄로 구분하세요.
            </p>
            <FormField
              label="인사말 텍스트"
              type="textarea"
              minHeight={220}
              value={s["about/philosophy"].description}
              onChange={(v) => update("about/philosophy", "description", v)}
            />
          </SectionCard>
        </>
      )}

      {/* 핵심가치 — about/values */}
      {activeTab === "values" && (
        <SectionCard title="핵심가치 항목">
          {s["about/values"].items.map((item, i) => (
            <ItemCard key={i} onRemove={s["about/values"].items.length > 1 ? () => removeItem("about/values", i) : undefined}>
              <FieldRow cols={3}>
                <FormField label="제목" value={item.title} onChange={(v) => updateItem("about/values", i, "title", v)} />
                <FormField label="부제목 (영문)" value={item.subtitle} onChange={(v) => updateItem("about/values", i, "subtitle", v)} />
                <FormField label="설명" value={item.desc} onChange={(v) => updateItem("about/values", i, "desc", v)} />
              </FieldRow>
            </ItemCard>
          ))}
          <AddButton onClick={() => addItem("about/values", { title: "", subtitle: "", desc: "" })} label="가치 추가" />
        </SectionCard>
      )}

      {/* 오시는 길 — 안내 메시지 (주소/교통 정보는 코드에 고정) */}
      {activeTab === "directions" && (
        <SectionCard title="오시는 길">
          <div style={{
            background: "#f8f9fa", border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: 20,
          }}>
            <p style={{ fontSize: 14, color: COLORS.text, fontWeight: 600, marginBottom: 12 }}>
              현재 주소/교통 정보
            </p>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.8 }}>
              <p><strong>주소:</strong> 서울특별시 강남구 테헤란로 141 (역삼KR빌딩) 15층</p>
              <p><strong>지하철:</strong> 2호선 역삼역 4번 출구 도보 1~2분</p>
              <p><strong>버스:</strong> 역삼역.포스코타워역삼 정류장 (147, 242, 350, 3412, 4432)</p>
              <p><strong>주차:</strong> 건물 내 기계식·자주식 지하주차장, 법률 상담 방문 시 2시간 무료</p>
              <p><strong>대표전화:</strong> 02-6925-6757 / 팩스: 02-6925-6758</p>
            </div>
            <div style={{
              marginTop: 16, padding: "10px 14px",
              background: "rgba(26,58,107,0.06)", borderRadius: 6,
              fontSize: 12, color: COLORS.accent,
            }}>
              오시는 길 정보를 변경하려면 개발자에게 요청하거나
              <strong> 공통 (헤더/푸터)</strong> 탭의 연락처 정보를 수정하세요.
            </div>
          </div>
        </SectionCard>
      )}

      {/* 공익활동 — about/probono */}
      {activeTab === "probono" && (
        <>
          <SectionCard title="소개 문구">
            <FormField
              label="공익활동 소개 텍스트"
              type="textarea"
              minHeight={80}
              value={s["about/probono"].intro}
              onChange={(v) => update("about/probono", "intro", v)}
            />
          </SectionCard>

          <SectionCard title="공익활동 항목">
            {s["about/probono"].items.map((item, i) => (
              <ItemCard key={i} onRemove={s["about/probono"].items.length > 1 ? () => removeItem("about/probono", i) : undefined}>
                <FieldRow>
                  <FormField label="배지" value={item.badge} onChange={(v) => updateItem("about/probono", i, "badge", v)} />
                  <FormField label="제목" value={item.title} onChange={(v) => updateItem("about/probono", i, "title", v)} />
                </FieldRow>
                <FormField label="설명" type="textarea" minHeight={72} value={item.desc} onChange={(v) => updateItem("about/probono", i, "desc", v)} />
              </ItemCard>
            ))}
            <AddButton
              onClick={() => addItem("about/probono", { badge: "", title: "", desc: "" })}
              label="공익활동 추가"
            />
          </SectionCard>
        </>
      )}

      {/* 연혁 — about/history (year / title / desc) */}
      {activeTab === "history" && (
        <SectionCard title="연혁 항목">
          {s["about/history"].items.map((item, i) => (
            <ItemCard key={i} onRemove={s["about/history"].items.length > 1 ? () => removeItem("about/history", i) : undefined}>
              <FieldRow>
                <FormField label="연도" value={item.year ?? item.text ?? ""} onChange={(v) => updateItem("about/history", i, "year", v)} placeholder="2025" />
                <FormField label="소제목" value={item.title ?? ""} onChange={(v) => updateItem("about/history", i, "title", v)} placeholder="주요 성과" />
              </FieldRow>
              <FormField label="상세 설명" type="textarea" minHeight={64} value={item.desc ?? ""} onChange={(v) => updateItem("about/history", i, "desc", v)} />
            </ItemCard>
          ))}
          <AddButton onClick={() => addItem("about/history", { year: "", title: "", desc: "" })} label="연혁 추가" />
        </SectionCard>
      )}
    </>
  );
}
