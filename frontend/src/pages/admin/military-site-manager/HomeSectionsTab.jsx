/**
 * 군사센터 홈 (/military) 관리 탭
 * — 구조화 편집 (SEO·위기 카드·연락처) + 섹션별 HTML 직접 편집
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, fieldStyle, labelStyle } from "../../../components/admin/styles";
import SectionHtmlEditor from "./SectionHtmlEditor";

/* ── 공용 소형 컴포넌트 ── */
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      style={fieldStyle}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function TextareaInput({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      rows={rows}
      style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.7 }}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ── SEO 구조화 편집 ── */
function MetaEditor({ content, onChange }) {
  const meta = content?.meta || {};
  const update = (key) => (val) => onChange({ ...content, meta: { ...meta, [key]: val } });
  return (
    <div style={{ maxWidth: 640 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 18 }}>SEO · 페이지 기본 정보</h4>
      <FormField label="페이지 제목 (title 태그)">
        <TextInput value={meta.title} onChange={update("title")} placeholder="군 징계·형사 전문 | 법무법인 하이로 HighLaw" />
      </FormField>
      <FormField label="메타 설명 (description)">
        <TextareaInput value={meta.description} onChange={update("description")} placeholder="군 징계·형사 사건 전문..." />
      </FormField>
      <FormField label="OG 제목 (SNS 공유)">
        <TextInput value={meta.ogTitle} onChange={update("ogTitle")} placeholder="군 징계·형사 전문 | 법무법인 하이로" />
      </FormField>
      <FormField label="OG 설명 (SNS 공유)">
        <TextareaInput value={meta.ogDescription} onChange={update("ogDescription")} rows={2} placeholder="전원 군검사 출신 전문가..." />
      </FormField>
    </div>
  );
}

/* ── 위기 카드 편집 ── */
const RISK_CARD_DEFS = [
  { key: "risk01", num: "01", color: "#dc2626", desc: "DANGER (빨간)" },
  { key: "risk02", num: "02", color: "#b8cc2a", desc: "WARNING (골드)" },
  { key: "risk03", num: "03", color: "#86efac", desc: "INFO (초록)" },
];

function RiskCardEditor({ content, onChange }) {
  const cards = content?.riskCards || {};
  const updateCard = (cardKey, field) => (val) => onChange({
    ...content,
    riskCards: { ...cards, [cardKey]: { ...(cards[cardKey] || {}), [field]: val } },
  });
  return (
    <div style={{ maxWidth: 680 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
        '징계위기의 본질' 섹션 — 3개 카드
      </h4>
      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>
        레이블(예: RISK 01)·제목·설명을 각각 수정합니다.
      </p>
      {RISK_CARD_DEFS.map(({ key, num, color, desc }) => {
        const card = cards[key] || {};
        return (
          <div key={key} style={{ border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: "18px 22px", marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.1em", marginBottom: 14 }}>
              카드 {num} — {desc}
            </p>
            <FormField label="레이블">
              <TextInput value={card.label} onChange={updateCard(key, "label")} placeholder={`RISK ${num}`} />
            </FormField>
            <FormField label="제목">
              <TextInput value={card.title} onChange={updateCard(key, "title")} placeholder="카드 제목" />
            </FormField>
            <FormField label="설명">
              <TextareaInput value={card.desc} onChange={updateCard(key, "desc")} placeholder="카드 설명" />
            </FormField>
          </div>
        );
      })}
    </div>
  );
}

/* ── 연락처 편집 ── */
function ContactEditor({ content, onChange }) {
  const contact = content?.contact || {};
  const update = (key) => (val) => onChange({ ...content, contact: { ...contact, [key]: val } });
  return (
    <div style={{ maxWidth: 440 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 18 }}>연락처 정보</h4>
      <FormField label="전화번호 (tel: 링크)">
        <TextInput value={contact.phone} onChange={update("phone")} placeholder="02-6925-6757" />
      </FormField>
    </div>
  );
}

/* ── 구조화 편집 (SEO+카드+연락처 통합) ── */
function StructuredEditor({ onSaveSuccess }) {
  const [content, setContent] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [subPanel, setSubPanel] = useState("meta");

  const loadContent = useCallback(() => {
    setLoading(true);
    api.get("/military/home/content")
      .then(({ data }) => {
        setContent(data);
        setOriginalContent(JSON.parse(JSON.stringify(data)));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  const isDirty = content && JSON.stringify(content) !== JSON.stringify(originalContent);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.put("/military/home/content", content);
      setContent(data);
      setOriginalContent(JSON.parse(JSON.stringify(data)));
      if (onSaveSuccess) onSaveSuccess("구조화 콘텐츠가 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  const subPanels = [
    { key: "meta",    label: "SEO · 기본 정보" },
    { key: "risk",    label: "위기 카드" },
    { key: "contact", label: "연락처" },
  ];

  return (
    <div>
      {errorMsg && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {subPanels.map((p) => (
          <button
            key={p.key}
            onClick={() => setSubPanel(p.key)}
            style={{
              padding: "6px 14px", fontSize: 12.5, border: "none", borderRadius: 5, cursor: "pointer",
              fontWeight: subPanel === p.key ? 700 : 400,
              color: subPanel === p.key ? "#fff" : COLORS.textSecondary,
              background: subPanel === p.key ? COLORS.primary : COLORS.bgInactive,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {subPanel === "meta"    && content && <MetaEditor     content={content} onChange={setContent} />}
      {subPanel === "risk"    && content && <RiskCardEditor  content={content} onChange={setContent} />}
      {subPanel === "contact" && content && <ContactEditor   content={content} onChange={setContent} />}
      {isDirty && (
        <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
          <button style={btnStyle()} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            style={{ ...btnStyle(COLORS.textSecondary) }}
            onClick={() => setContent(JSON.parse(JSON.stringify(originalContent)))}
            disabled={saving}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 섹션 목록 패널 ── */
function SectionListPanel({ sections, activeSectionId, onSelect }) {
  return (
    <div style={{
      width: 200, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`,
      overflowY: "auto", maxHeight: 700, paddingRight: 12,
    }}>
      {sections.map((sec) => (
        <button
          key={sec.id}
          onClick={() => onSelect(sec.id)}
          style={{
            display: "block", width: "100%", textAlign: "left",
            padding: "8px 10px", marginBottom: 2, border: "none", borderRadius: 5, cursor: "pointer",
            background: activeSectionId === sec.id ? COLORS.navyLight : "transparent",
            color: activeSectionId === sec.id ? COLORS.primary : COLORS.textSecondary,
            fontWeight: activeSectionId === sec.id ? 700 : 400,
            fontSize: 12.5,
          }}
        >
          {sec.name}
        </button>
      ))}
    </div>
  );
}

/* ── 홈 섹션 편집 탭 ── */
function HomeSectionEditor({ onSaveSuccess }) {
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    api.get("/military/home/sections")
      .then(({ data }) => {
        setSections(data || []);
        if (data && data.length > 0) setActiveSectionId(data[0].id);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>섹션 목록 로딩 중...</p>;
  if (errorMsg) return <p style={{ color: COLORS.danger, fontSize: 13 }}>{errorMsg}</p>;

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <SectionListPanel sections={sections} activeSectionId={activeSectionId} onSelect={setActiveSectionId} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeSectionId && (
          <SectionHtmlEditor page="home" sectionId={activeSectionId} onSaveSuccess={onSaveSuccess} />
        )}
      </div>
    </div>
  );
}

/* ── 메인 내보내기 ── */
export default function HomeSectionsTab({ onToast }) {
  const [mode, setMode] = useState("structured");

  const modes = [
    { key: "structured", label: "구조화 편집 (SEO·카드·연락처)" },
    { key: "sections",   label: "섹션별 HTML 편집" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14 }}>
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              padding: "8px 18px", fontSize: 13, border: "none", borderRadius: 6, cursor: "pointer",
              fontWeight: mode === m.key ? 700 : 400,
              color: mode === m.key ? "#fff" : COLORS.textSecondary,
              background: mode === m.key ? COLORS.primary : COLORS.bgInactive,
            }}
          >
            {m.label}
          </button>
        ))}
        <a
          href="https://highlaw.co.kr/military"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", fontSize: 12, color: COLORS.textMuted, alignSelf: "center", textDecoration: "none" }}
        >
          페이지 보기 →
        </a>
      </div>

      {mode === "structured" && <StructuredEditor onSaveSuccess={onToast} />}
      {mode === "sections"   && <HomeSectionEditor onSaveSuccess={onToast} />}
    </div>
  );
}
