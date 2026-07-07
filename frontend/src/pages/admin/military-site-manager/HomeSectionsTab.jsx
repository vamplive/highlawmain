/**
 * 군사센터 홈 (/military) 관리 탭
 * — SEO · 구조화 편집 (히어로/이미지, SEO, 위기카드, 연락처)
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, fieldStyle, labelStyle } from "../../../components/admin/styles";

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

/* ── 홈 히어로 섹션 파서/적용기 (프론트엔드 전용) ── */
function parseHeroHtml(html) {
  const slideMatches = [...html.matchAll(/background-image:url\('([^']+)'\)/g)];
  const slides = slideMatches.map((m) => m[1]);
  while (slides.length < 5) slides.push("");
  const heroL1 = html.match(/<span class="hero-l1">([^<]+)<\/span>/)?.[1]?.trim() || "";
  const heroL3 = html.match(/<p class="hero-l3[^"]*"[^>]*>([^<]+)<\/p>/)?.[1]?.trim() || "";
  return { slides, heroL1, heroL3 };
}

function applyHeroHtml(html, data) {
  let result = html;
  if (data.slides) {
    let i = 0;
    result = result.replace(/background-image:url\('[^']*'\)/g, () => {
      const url = data.slides[i] !== undefined ? data.slides[i] : "";
      i++;
      return `background-image:url('${url}')`;
    });
  }
  if (data.heroL1 !== undefined) {
    result = result.replace(
      /(<span class="hero-l1">)[^<]+(<\/span>)/,
      (_, o, c) => `${o}${data.heroL1}${c}`
    );
  }
  if (data.heroL3 !== undefined) {
    result = result.replace(
      /(<p class="hero-l3[^"]*"[^>]*>)[^<]+(<\/p>)/,
      (_, o, c) => `${o}${data.heroL3}${c}`
    );
  }
  return result;
}

/* ── 히어로 편집 패널 ── */
function HomeHeroEditor({ onSaveSuccess }) {
  const [heroData, setHeroData] = useState({ slides: ["", "", "", "", ""], heroL1: "", heroL3: "" });
  const [savedJson, setSavedJson] = useState(null);
  const [originalHtml, setOriginalHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    api
      .get("/military/home/section/hero")
      .then(({ data }) => {
        const html = data?.html || "";
        setOriginalHtml(html);
        const parsed = parseHeroHtml(html);
        setHeroData(parsed);
        setSavedJson(JSON.stringify(parsed));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = savedJson !== null && JSON.stringify(heroData) !== savedJson;

  const updateSlide = (i, url) =>
    setHeroData((d) => {
      const slides = [...d.slides];
      slides[i] = url;
      return { ...d, slides };
    });

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const newHtml = applyHeroHtml(originalHtml, heroData);
      await api.put("/military/home/section/hero", { html: newHtml });
      setOriginalHtml(newHtml);
      setSavedJson(JSON.stringify(heroData));
      onSaveSuccess?.("히어로가 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <div style={{ maxWidth: 680 }}>
      {errorMsg && (
        <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>
      )}

      <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
        슬라이드 배경 이미지 URL
      </h4>
      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
        사진 1~5의 이미지 URL을 입력하세요. 빈 칸은 해당 슬라이드를 제거합니다.
      </p>
      {heroData.slides.map((url, i) => (
        <FormField key={i} label={`사진 ${i + 1}`}>
          <TextInput
            value={url}
            onChange={(v) => updateSlide(i, v)}
            placeholder={`https://highlaw.co.kr/military/photos/photo${i + 1}.jpg`}
          />
        </FormField>
      ))}

      <div style={{ height: 1, background: COLORS.border, margin: "20px 0" }} />

      <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>
        히어로 텍스트
      </h4>
      <FormField label="메인 제목 첫 번째 줄 (금색 하이라이트 앞)">
        <TextInput
          value={heroData.heroL1}
          onChange={(v) => setHeroData((d) => ({ ...d, heroL1: v }))}
          placeholder="군 징계·형사 사건의"
        />
      </FormField>
      <FormField label="서브 문구 (메인 제목 아래)">
        <TextInput
          value={heroData.heroL3}
          onChange={(v) => setHeroData((d) => ({ ...d, heroL3: v }))}
          placeholder="전원 군검사 출신 · 징계·형사 전문가"
        />
      </FormField>

      {isDirty && (
        <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
          <button style={btnStyle()} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            style={btnStyle(COLORS.textSecondary)}
            onClick={() => setHeroData(JSON.parse(savedJson))}
            disabled={saving}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}

/* ── SEO 편집 패널 ── */
function MetaEditor({ content, onChange }) {
  const meta = content?.meta || {};
  const update = (key) => (val) => onChange({ ...content, meta: { ...meta, [key]: val } });
  return (
    <div style={{ maxWidth: 640 }}>
      <FormField label="페이지 제목 (title 태그)">
        <TextInput
          value={meta.title}
          onChange={update("title")}
          placeholder="군 징계·형사 전문 | 법무법인 하이로 HighLaw"
        />
      </FormField>
      <FormField label="메타 설명 (description)">
        <TextareaInput
          value={meta.description}
          onChange={update("description")}
          placeholder="군 징계·형사 사건 전문..."
        />
      </FormField>
      <FormField label="OG 제목 (SNS 공유)">
        <TextInput
          value={meta.ogTitle}
          onChange={update("ogTitle")}
          placeholder="군 징계·형사 전문 | 법무법인 하이로"
        />
      </FormField>
      <FormField label="OG 설명 (SNS 공유)">
        <TextareaInput
          value={meta.ogDescription}
          onChange={update("ogDescription")}
          rows={2}
          placeholder="전원 군검사 출신 전문가..."
        />
      </FormField>
    </div>
  );
}

/* ── 위기 카드 편집 패널 ── */
const RISK_CARD_DEFS = [
  { key: "risk01", num: "01", color: "#dc2626", desc: "DANGER (빨간)" },
  { key: "risk02", num: "02", color: "#b8cc2a", desc: "WARNING (골드)" },
  { key: "risk03", num: "03", color: "#86efac", desc: "INFO (초록)" },
];

function RiskCardEditor({ content, onChange }) {
  const cards = content?.riskCards || {};
  const updateCard = (cardKey, field) => (val) =>
    onChange({
      ...content,
      riskCards: { ...cards, [cardKey]: { ...(cards[cardKey] || {}), [field]: val } },
    });
  return (
    <div style={{ maxWidth: 680 }}>
      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>
        '징계위기의 본질' 섹션의 3개 카드 레이블·제목·설명을 수정합니다.
      </p>
      {RISK_CARD_DEFS.map(({ key, num, color, desc }) => {
        const card = cards[key] || {};
        return (
          <div
            key={key}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderLeft: `4px solid ${color}`,
              borderRadius: 8,
              padding: "18px 22px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color,
                letterSpacing: "0.1em",
                marginBottom: 14,
              }}
            >
              카드 {num} — {desc}
            </p>
            <FormField label="레이블">
              <TextInput
                value={card.label}
                onChange={updateCard(key, "label")}
                placeholder={`RISK ${num}`}
              />
            </FormField>
            <FormField label="제목">
              <TextInput
                value={card.title}
                onChange={updateCard(key, "title")}
                placeholder="카드 제목"
              />
            </FormField>
            <FormField label="설명">
              <TextareaInput
                value={card.desc}
                onChange={updateCard(key, "desc")}
                placeholder="카드 설명"
              />
            </FormField>
          </div>
        );
      })}
    </div>
  );
}

/* ── 연락처 편집 패널 ── */
function ContactEditor({ content, onChange }) {
  const contact = content?.contact || {};
  const update = (key) => (val) => onChange({ ...content, contact: { ...contact, [key]: val } });
  return (
    <div style={{ maxWidth: 440 }}>
      <FormField label="전화번호 (tel: 링크)">
        <TextInput
          value={contact.phone}
          onChange={update("phone")}
          placeholder="02-6925-6757"
        />
      </FormField>
    </div>
  );
}

/* ── 통합 구조화 편집기 ── */
function StructuredEditor({ onSaveSuccess }) {
  const [content, setContent] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [subPanel, setSubPanel] = useState("hero");

  const loadContent = useCallback(() => {
    setContentLoading(true);
    api
      .get("/military/home/content")
      .then(({ data }) => {
        setContent(data);
        setOriginalContent(JSON.parse(JSON.stringify(data)));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setContentLoading(false));
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const isDirty =
    subPanel !== "hero" &&
    content &&
    JSON.stringify(content) !== JSON.stringify(originalContent);

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const { data } = await api.put("/military/home/content", content);
      setContent(data);
      setOriginalContent(JSON.parse(JSON.stringify(data)));
      onSaveSuccess?.("구조화 콘텐츠가 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const subPanels = [
    { key: "hero",    label: "히어로 · 대문 사진" },
    { key: "meta",    label: "SEO · 기본 정보" },
    { key: "risk",    label: "위기 카드" },
    { key: "contact", label: "연락처" },
  ];

  return (
    <div>
      {errorMsg && (
        <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>
      )}

      {/* 언더라인 탭 바 */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: `2px solid ${COLORS.border}`,
          overflowX: "auto",
        }}
      >
        {subPanels.map((p) => {
          const isActive = subPanel === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setSubPanel(p.key)}
              style={{
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? COLORS.accent : COLORS.textSecondary,
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: isActive
                  ? `2px solid ${COLORS.accent}`
                  : "2px solid transparent",
                marginBottom: -2,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 히어로 패널: 독립 로딩 */}
      {subPanel === "hero" && <HomeHeroEditor onSaveSuccess={onSaveSuccess} />}

      {/* 나머지 패널: content 공유 */}
      {subPanel !== "hero" && contentLoading && (
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>
      )}
      {subPanel === "meta" && !contentLoading && content && (
        <MetaEditor content={content} onChange={setContent} />
      )}
      {subPanel === "risk" && !contentLoading && content && (
        <RiskCardEditor content={content} onChange={setContent} />
      )}
      {subPanel === "contact" && !contentLoading && content && (
        <ContactEditor content={content} onChange={setContent} />
      )}

      {isDirty && (
        <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
          <button style={btnStyle()} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            style={btnStyle(COLORS.textSecondary)}
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

/* ── 메인 내보내기 ── */
export default function HomeSectionsTab({ onToast }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <a
          href="https://highlaw.co.kr/military"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: COLORS.textMuted, textDecoration: "none" }}
        >
          페이지 보기 →
        </a>
      </div>
      <StructuredEditor onSaveSuccess={onToast} />
    </div>
  );
}
