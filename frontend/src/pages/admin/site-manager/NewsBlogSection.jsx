/** 소식/블로그 편집 — 히어로 + 3개 카테고리 하위 탭 */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";
import { SectionCard, FieldRow } from "./shared";
import AdminBlog from "../blog";

const SUB_TABS = [
  { key: "news", label: "하이로 뉴스", category: "construction_realestate" },
  { key: "analysis", label: "판례 분석", category: "case_analysis" },
  { key: "guide", label: "법률 가이드", category: "law_guide" },
];

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

export default function NewsBlogSection({ settings, update }) {
  const [activeTab, setActiveTab] = useState("news");
  const s = settings;
  const activeSubTab = SUB_TABS.find((t) => t.key === activeTab);

  return (
    <div>
      {/* 히어로 섹션 편집 */}
      <SectionCard title="페이지 히어로">
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
          블로그 페이지 상단 히어로 배너에 표시됩니다. 저장 버튼으로 적용하세요.
        </p>
        <FieldRow>
          <FormField
            label="제목"
            value={s["news/hero"].heading}
            onChange={(v) => update("news/hero", "heading", v)}
          />
          <FormField
            label="부제목 (영문)"
            value={s["news/hero"].subheading}
            onChange={(v) => update("news/hero", "subheading", v)}
          />
        </FieldRow>
        <FormField
          label="설명"
          type="textarea"
          minHeight={56}
          value={s["news/hero"].description}
          onChange={(v) => update("news/hero", "description", v)}
        />
      </SectionCard>

      {/* 카테고리별 블로그 게시글 관리 */}
      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>
        카테고리별 게시글 관리
      </div>
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* key를 이용해 탭 전환 시 AdminBlog를 리마운트하여 defaultCategory 초기화 */}
      <AdminBlog key={activeTab} defaultCategory={activeSubTab?.category ?? ""} />
    </div>
  );
}
