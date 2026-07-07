/** 상담/문의 편집 — 히어로 + 4개 하위 탭(상담확인/상담수정/진행절차/FAQ) */
import { useState } from "react";
import { FormField } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";
import ConsultationsPanel from "../bookings/ConsultationsPanel";

const SUB_TABS = [
  { key: "review", label: "온라인 상담 신청 확인/승인/거절" },
  { key: "edit", label: "상담 신청 수정" },
  { key: "process", label: "진행 절차" },
  { key: "faq", label: "FAQ" },
  { key: "contact", label: "연락처 및 오시는 길" },
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
              padding: "8px 16px", fontSize: 12,
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

export default function ConsultationSectionWrapper({ settings, update, updateItem, addItem, removeItem }) {
  const [activeTab, setActiveTab] = useState("review");
  const s = settings;

  return (
    <div>
      {/* 히어로 섹션 편집 */}
      <SectionCard title="페이지 히어로">
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
          상담안내 페이지 상단 히어로 배너에 표시됩니다. 저장 버튼으로 적용하세요.
        </p>
        <FieldRow>
          <FormField
            label="제목"
            value={s["consultation/hero"].heading}
            onChange={(v) => update("consultation/hero", "heading", v)}
          />
          <FormField
            label="부제목 (영문)"
            value={s["consultation/hero"].subheading}
            onChange={(v) => update("consultation/hero", "subheading", v)}
          />
        </FieldRow>
        <FormField
          label="설명"
          type="textarea"
          minHeight={56}
          value={s["consultation/hero"].description}
          onChange={(v) => update("consultation/hero", "description", v)}
        />
      </SectionCard>

      {/* 하위 탭 */}
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* 온라인 상담 신청 확인/승인/거절 */}
      {activeTab === "review" && (
        <div>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
            접수된 온라인 상담 신청 목록입니다. 각 신청을 확정하거나 취소 처리할 수 있습니다.
          </p>
          <ConsultationsPanel />
        </div>
      )}

      {/* 상담 신청 수정 */}
      {activeTab === "edit" && (
        <div>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
            접수된 상담 신청 내용을 확인하고 수정하세요. 상태를 변경하거나 담당 변호사를 지정할 수 있습니다.
          </p>
          <ConsultationsPanel />
        </div>
      )}

      {/* 진행 절차 */}
      {activeTab === "process" && (
        <SectionCard title="상담 진행 절차">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            상담안내 페이지 &gt; 진행 절차 탭에 표시됩니다. 저장 버튼으로 적용하세요.
          </p>
          {s["consultation/process"].items.map((item, i) => (
            <ItemCard key={i} onRemove={s["consultation/process"].items.length > 1 ? () => removeItem("consultation/process", i) : undefined}>
              <FieldRow cols={2}>
                <FormField label="단계 번호" value={item.step} onChange={(v) => updateItem("consultation/process", i, "step", v)} placeholder="01" />
                <FormField label="단계 제목" value={item.title} onChange={(v) => updateItem("consultation/process", i, "title", v)} />
              </FieldRow>
              <FormField label="설명" type="textarea" minHeight={64} value={item.desc} onChange={(v) => updateItem("consultation/process", i, "desc", v)} />
            </ItemCard>
          ))}
          <AddButton onClick={() => addItem("consultation/process", { step: "", title: "", desc: "" })} label="절차 추가" />
        </SectionCard>
      )}

      {/* FAQ */}
      {activeTab === "faq" && (
        <SectionCard title="자주 묻는 질문 (FAQ)">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            상담안내 페이지 &gt; FAQ 탭에 표시됩니다. 저장 버튼으로 적용하세요.
          </p>
          {s["consultation/faq"].items.map((item, i) => (
            <ItemCard key={i} onRemove={s["consultation/faq"].items.length > 1 ? () => removeItem("consultation/faq", i) : undefined}>
              <FormField label="질문" value={item.q} onChange={(v) => updateItem("consultation/faq", i, "q", v)} />
              <FormField label="답변" type="textarea" minHeight={80} value={item.a} onChange={(v) => updateItem("consultation/faq", i, "a", v)} />
            </ItemCard>
          ))}
          <AddButton onClick={() => addItem("consultation/faq", { q: "", a: "" })} label="FAQ 추가" />
        </SectionCard>
      )}

      {/* 연락처 및 오시는 길 */}
      {activeTab === "contact" && (
        <SectionCard title="연락처 및 오시는 길">
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            상담안내 페이지에 표시되는 사무소 연락처 정보입니다. 저장 버튼으로 적용하세요.
          </p>
          <FieldRow>
            <FormField
              label="전화번호"
              value={s["consultation/contact"].phone}
              onChange={(v) => update("consultation/contact", "phone", v)}
              placeholder="02-6925-6757"
            />
            <FormField
              label="이메일"
              value={s["consultation/contact"].email}
              onChange={(v) => update("consultation/contact", "email", v)}
              placeholder="info@highlaw.net"
            />
          </FieldRow>
          <FormField
            label="사무소 주소"
            value={s["consultation/contact"].address}
            onChange={(v) => update("consultation/contact", "address", v)}
            placeholder="서울특별시 강남구 테헤란로 141, 15층"
          />
          <FieldRow>
            <FormField
              label="업무시간"
              value={s["consultation/contact"].hours}
              onChange={(v) => update("consultation/contact", "hours", v)}
              placeholder="평일 09:00 - 18:00 (예약 상담 우선)"
            />
            <FormField
              label="사업자등록번호"
              value={s["consultation/contact"].businessNumber}
              onChange={(v) => update("consultation/contact", "businessNumber", v)}
              placeholder="433-86-04078"
            />
          </FieldRow>
        </SectionCard>
      )}
    </div>
  );
}
