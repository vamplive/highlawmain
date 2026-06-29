/**
 * 군사센터 서브 페이지 관리 탭 (범용)
 * — 구조화 편집 (히어로·섹션 텍스트) + 섹션별 HTML 편집 (맨 뒤 배치)
 * Props:
 *   page    - API 경로 식별자 (about | practices | info | consultation)
 *   subTabs - [{ id, label }] — 섹션 ID + 표시 이름
 *   pageUrl - 실제 사이트 URL (미리보기 링크용)
 *   onToast - (message: string) => void
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, fieldStyle, labelStyle } from "../../../components/admin/styles";
import SectionHtmlEditor from "./SectionHtmlEditor";

/* ──────────────────────────────────────
   공통 소형 UI 컴포넌트
────────────────────────────────────── */
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

function TextareaInput({ value, onChange, rows = 4, placeholder }) {
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

/* ──────────────────────────────────────
   히어로 편집기
   GET/PUT /api/military/:page/hero
────────────────────────────────────── */
function HeroEditor({ page, onSaveSuccess }) {
  const [hero, setHero] = useState({ heading: "", subheading: "", description: "" });
  const [savedJson, setSavedJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    api.get(`/military/${page}/hero`)
      .then(({ data }) => {
        const h = data || {};
        const heroData = {
          heading: h.heading || "",
          subheading: h.subheading || "",
          description: h.description || "",
        };
        setHero(heroData);
        setSavedJson(JSON.stringify(heroData));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const isDirty = savedJson !== null && JSON.stringify(hero) !== savedJson;

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const { data } = await api.put(`/military/${page}/hero`, hero);
      const updated = {
        heading: data?.heading || hero.heading,
        subheading: data?.subheading || hero.subheading,
        description: data?.description || hero.description,
      };
      setHero(updated);
      setSavedJson(JSON.stringify(updated));
      onSaveSuccess?.("히어로가 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 18 }}>
        히어로 영역
      </h4>
      {errorMsg && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6,
          padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#b91c1c",
        }}>
          {errorMsg}
          <br />
          <span style={{ fontSize: 11.5 }}>
            히어로 섹션(id=&quot;hero&quot;)이 페이지에 없거나 파싱 실패. &apos;섹션별 HTML 편집&apos; 탭에서 직접 수정하세요.
          </span>
        </div>
      )}
      <FormField label="제목 (h1)">
        <TextInput
          value={hero.heading}
          onChange={(v) => setHero({ ...hero, heading: v })}
          placeholder="페이지 대제목"
        />
      </FormField>
      <FormField label="부제목">
        <TextInput
          value={hero.subheading}
          onChange={(v) => setHero({ ...hero, subheading: v })}
          placeholder="영문 또는 짧은 부제목"
        />
      </FormField>
      <FormField label="설명">
        <TextareaInput
          value={hero.description}
          onChange={(v) => setHero({ ...hero, description: v })}
          placeholder="히어로 설명 문구"
          rows={3}
        />
      </FormField>
      {isDirty && (
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button style={btnStyle()} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            style={btnStyle(COLORS.textSecondary)}
            onClick={() => setHero(JSON.parse(savedJson))}
            disabled={saving}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────
   섹션 콘텐츠 편집기
   — DOMParser로 h2+p 파싱 → 텍스트 필드 제공
   — 저장 시 텍스트 노드만 교체 후 PUT
────────────────────────────────────── */
function SectionContentEditor({ page, sectionId, onSaveSuccess }) {
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [parseWarning, setParseWarning] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    setParseWarning(false);
    api.get(`/military/${page}/section/${sectionId}`)
      .then(({ data }) => {
        const html = data?.html || "";
        setOriginalHtml(html);

        // DOMParser로 h2 제목과 p 본문 추출
        const doc = new DOMParser().parseFromString(html, "text/html");
        const h2El = doc.querySelector("h2");
        const pEls = Array.from(doc.querySelectorAll("p"));

        const title = h2El?.textContent?.trim() || "";
        const content = pEls.map((p) => p.textContent?.trim()).filter(Boolean).join("\n\n");

        setSectionTitle(title);
        setSectionContent(content);
        setSavedTitle(title);
        setSavedContent(content);

        if (!h2El && pEls.length === 0) setParseWarning(true);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page, sectionId]);

  const isDirty = sectionTitle !== savedTitle || sectionContent !== savedContent;

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      // 원본 HTML 파싱 후 텍스트 노드만 교체
      const doc = new DOMParser().parseFromString(originalHtml, "text/html");

      const h2El = doc.querySelector("h2");
      if (h2El) h2El.textContent = sectionTitle;

      const contentParts = sectionContent.split("\n\n");
      const pEls = doc.querySelectorAll("p");
      pEls.forEach((p, i) => {
        if (contentParts[i] !== undefined) p.textContent = contentParts[i];
      });

      const updatedHtml = doc.body?.innerHTML || originalHtml;

      await api.put(`/military/${page}/section/${sectionId}`, { html: updatedHtml });
      setOriginalHtml(updatedHtml);
      setSavedTitle(sectionTitle);
      setSavedContent(sectionContent);
      onSaveSuccess?.("저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      {errorMsg && (
        <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>
      )}
      {parseWarning && (
        <div style={{
          background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 6,
          padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#92400e",
        }}>
          이 섹션에서 편집 가능한 h2·p 요소를 자동으로 찾지 못했습니다.
          <br />
          상세 편집은 <strong>섹션별 HTML 편집</strong> 탭을 사용해 주세요.
        </div>
      )}
      <FormField label="섹션 제목 (h2)">
        <TextInput value={sectionTitle} onChange={setSectionTitle} placeholder="섹션 제목" />
      </FormField>
      <FormField label="본문 내용 (단락은 빈 줄로 구분)">
        <TextareaInput
          value={sectionContent}
          onChange={setSectionContent}
          rows={8}
          placeholder="섹션 본문 내용을 입력하세요."
        />
      </FormField>
      {isDirty && (
        <div style={{ display: "flex", gap: 10 }}>
          <button style={btnStyle()} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            style={btnStyle(COLORS.textSecondary)}
            onClick={() => { setSectionTitle(savedTitle); setSectionContent(savedContent); }}
            disabled={saving}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────
   구조화 편집 (히어로 + 섹션별 콘텐츠 패널)
────────────────────────────────────── */
function StructuredEditor({ page, subTabs, onSaveSuccess }) {
  const panels = [{ id: "__hero__", label: "히어로" }, ...subTabs];
  const [activePanel, setActivePanel] = useState("__hero__");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {panels.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            style={{
              padding: "6px 14px", fontSize: 12.5, border: "none", borderRadius: 5, cursor: "pointer",
              fontWeight: activePanel === p.id ? 700 : 400,
              color: activePanel === p.id ? "#fff" : COLORS.textSecondary,
              background: activePanel === p.id ? COLORS.primary : COLORS.bgInactive,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePanel === "__hero__" && (
        <HeroEditor key={page} page={page} onSaveSuccess={onSaveSuccess} />
      )}
      {subTabs.map((tab) =>
        activePanel === tab.id ? (
          <SectionContentEditor
            key={`${page}/${tab.id}`}
            page={page}
            sectionId={tab.id}
            onSaveSuccess={onSaveSuccess}
          />
        ) : null
      )}
    </div>
  );
}

/* ──────────────────────────────────────
   섹션별 HTML 편집 (사이드바 + HTML 에디터)
   — 페이지 내 모든 <section id="..."> 섹션을 사이드바로 표시
────────────────────────────────────── */
function SectionListPanel({ sections, activeId, onSelect }) {
  return (
    <div style={{
      width: 180, flexShrink: 0,
      borderRight: `1px solid ${COLORS.border}`, paddingRight: 12,
    }}>
      {sections.map((sec) => (
        <button
          key={sec.id}
          onClick={() => onSelect(sec.id)}
          style={{
            display: "block", width: "100%", textAlign: "left",
            padding: "8px 10px", marginBottom: 2, border: "none", borderRadius: 5, cursor: "pointer",
            background: activeId === sec.id ? COLORS.navyLight : "transparent",
            color: activeId === sec.id ? COLORS.primary : COLORS.textSecondary,
            fontWeight: activeId === sec.id ? 700 : 400, fontSize: 12.5,
          }}
        >
          {sec.name}
        </button>
      ))}
    </div>
  );
}

function HtmlSectionEditor({ page, onSaveSuccess }) {
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    api.get(`/military/${page}/sections`)
      .then(({ data }) => {
        setSections(data || []);
        if (data && data.length > 0) setActiveId(data[0].id);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>섹션 목록 로딩 중...</p>;
  if (errorMsg) return <p style={{ color: COLORS.danger, fontSize: 13 }}>{errorMsg}</p>;

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <SectionListPanel sections={sections} activeId={activeId} onSelect={setActiveId} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeId && (
          <SectionHtmlEditor
            key={`${page}/${activeId}`}
            page={page}
            sectionId={activeId}
            onSaveSuccess={onSaveSuccess}
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   메인 내보내기
────────────────────────────────────── */
export default function SubPageTab({ page, subTabs, pageUrl, onToast }) {
  const [mode, setMode] = useState("structured");

  const modes = [
    { key: "structured", label: "구조화 편집" },
    { key: "html", label: "섹션별 HTML 편집" },
  ];

  return (
    <div>
      {/* 모드 선택 탭 — 섹션별 HTML 편집은 맨 뒤 */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 24,
        borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14,
      }}>
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
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", fontSize: 12, color: COLORS.textMuted, alignSelf: "center", textDecoration: "none" }}
        >
          페이지 보기 →
        </a>
      </div>

      {mode === "structured" && (
        <StructuredEditor page={page} subTabs={subTabs} onSaveSuccess={onToast} />
      )}
      {mode === "html" && (
        <HtmlSectionEditor key={page} page={page} onSaveSuccess={onToast} />
      )}
    </div>
  );
}
