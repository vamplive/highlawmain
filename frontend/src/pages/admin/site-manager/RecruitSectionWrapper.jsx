/** 채용 편집 — 히어로 + 3개 하위 탭(채용공고/지원안내/채용문의) */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";
import { SectionCard, FieldRow } from "./shared";
import AdminRecruit from "../recruit";

const SUB_TABS = [
  { key: "listings", label: "채용 공고" },
  { key: "guide", label: "지원 안내" },
  { key: "contact", label: "채용 문의" },
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

export default function RecruitSectionWrapper({ settings, update }) {
  const [activeTab, setActiveTab] = useState("listings");
  const s = settings;

  return (
    <div>
      {/* 히어로 섹션 편집 */}
      <SectionCard title="페이지 히어로">
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
          채용 페이지 상단 히어로 배너에 표시됩니다. 저장 버튼으로 적용하세요.
        </p>
        <FieldRow>
          <FormField
            label="제목"
            value={s["recruit/hero"].heading}
            onChange={(v) => update("recruit/hero", "heading", v)}
          />
          <FormField
            label="부제목 (영문)"
            value={s["recruit/hero"].subheading}
            onChange={(v) => update("recruit/hero", "subheading", v)}
          />
        </FieldRow>
        <FormField
          label="설명"
          type="textarea"
          minHeight={56}
          value={s["recruit/hero"].description}
          onChange={(v) => update("recruit/hero", "description", v)}
        />
      </SectionCard>

      {/* 하위 탭 */}
      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>
        채용 콘텐츠 관리
      </div>
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* 채용 공고 */}
      {activeTab === "listings" && <AdminRecruit />}

      {/* 지원 안내 */}
      {activeTab === "guide" && (
        <SectionCard title="지원 안내 콘텐츠">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            채용 페이지 &gt; 지원 안내 탭에 표시됩니다. 저장 버튼으로 적용하세요.
          </p>
          <FormField
            label="지원 안내 내용"
            type="textarea"
            minHeight={200}
            value={s["recruit/guide"].content}
            onChange={(v) => update("recruit/guide", "content", v)}
          />
        </SectionCard>
      )}

      {/* 채용 문의 */}
      {activeTab === "contact" && (
        <SectionCard title="채용 문의 안내">
          <div style={{
            background: "#f8f9fa", border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: 20, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.8,
          }}>
            <p style={{ fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>채용 관련 문의 안내</p>
            <p>채용 문의는 이메일 또는 카카오톡으로 접수됩니다.</p>
            <p style={{ marginTop: 8 }}>연락처 정보는 <strong>공통 (헤더/푸터)</strong> 탭 &gt; 연락처 정보에서 수정하세요.</p>
            <div style={{
              marginTop: 16, padding: "10px 14px",
              background: "rgba(26,58,107,0.06)", borderRadius: 6,
              fontSize: 12, color: COLORS.accent,
            }}>
              채용 지원서는 채용 공고 탭에서 개별 공고에 파일을 첨부하여 관리합니다.
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
