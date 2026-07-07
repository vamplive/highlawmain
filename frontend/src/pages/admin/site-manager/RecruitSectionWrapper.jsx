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
        <SectionCard title="채용 문의 연락처">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            채용 페이지 &gt; 채용 문의 탭에 표시됩니다. 저장 버튼으로 적용하세요.
          </p>
          <FieldRow>
            <FormField
              label="이메일"
              value={s["recruit/contact"].email}
              onChange={(v) => update("recruit/contact", "email", v)}
              placeholder="recruit@highlaw.net"
            />
            <FormField
              label="전화번호"
              value={s["recruit/contact"].phone}
              onChange={(v) => update("recruit/contact", "phone", v)}
              placeholder="02-6925-6757"
            />
          </FieldRow>
          <FieldRow>
            <FormField
              label="업무시간"
              value={s["recruit/contact"].hours}
              onChange={(v) => update("recruit/contact", "hours", v)}
              placeholder="평일 09:00 - 18:00"
            />
          </FieldRow>
          <FormField
            label="안내 문구"
            type="textarea"
            minHeight={80}
            value={s["recruit/contact"].note}
            onChange={(v) => update("recruit/contact", "note", v)}
            placeholder="이력서와 자기소개서를 이메일로 보내주세요."
          />
        </SectionCard>
      )}
    </div>
  );
}
