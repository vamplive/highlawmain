/**
 * 군사센터 서브 페이지 관리 탭 (범용)
 * — 메인 어드민과 동일한 언더라인 탭 UI
 * Props:
 *   page    - API 경로 식별자 (about | practices | info | consultation)
 *   subTabs - [{ id, label }] — 섹션 ID + 표시 이름
 *   pageUrl - 실제 사이트 URL (미리보기 링크용)
 *   onToast - (message: string) => void
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, fieldStyle, labelStyle } from "../../../components/admin/styles";
import SimpleRichEditor from "../../../components/admin/SimpleRichEditor";

/* ──────────────────────────────────────
   공통 소형 UI — 메인 어드민과 동일한 스타일
────────────────────────────────────── */

/** 메인 어드민 AboutSection과 동일한 언더라인 탭 바 */
function SubTabBar({ tabs, active, onChange, pageUrl }) {
  return (
    <div style={{
      display: "flex", gap: 0,
      borderBottom: `2px solid ${COLORS.border}`,
      marginBottom: 24, overflowX: "auto",
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
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
      {pageUrl && (
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: "auto", fontSize: 12, color: COLORS.textMuted,
            alignSelf: "center", textDecoration: "none", paddingRight: 4,
            whiteSpace: "nowrap",
          }}
        >
          페이지 보기 →
        </a>
      )}
    </div>
  );
}

/** 메인 어드민 SectionCard와 동일한 카드 래퍼 */
function SectionCard({ title, children }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: "22px 24px",
      marginBottom: 20,
    }}>
      {title && (
        <p style={{
          fontSize: 12, fontWeight: 700, color: COLORS.textSecondary,
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 16,
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/** 메인 어드민 ItemCard와 동일한 항목 카드 */
function ItemCard({ children, onRemove }) {
  return (
    <div style={{
      background: "#f8f9fa",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      padding: "16px 18px",
      marginBottom: 12,
      position: "relative",
    }}>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            position: "absolute", top: 10, right: 12,
            background: "none", border: "none",
            color: "#dc2626", cursor: "pointer",
            fontSize: 16, lineHeight: 1,
          }}
          title="삭제"
        >×</button>
      )}
      {children}
    </div>
  );
}

/** 메인 어드민 FormField와 동일한 필드 */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
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

/** 저장/취소 버튼 묶음 */
function SaveRow({ onSave, onCancel, saving, disabled }) {
  if (disabled) return null;
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      <button style={btnStyle()} onClick={onSave} disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </button>
      <button style={btnStyle(COLORS.textSecondary)} onClick={onCancel} disabled={saving}>
        취소
      </button>
    </div>
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
    <SectionCard title="히어로 배너">
      {errorMsg && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6,
          padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#b91c1c",
        }}>
          {errorMsg}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="제목 (h1)">
          <TextInput
            value={hero.heading}
            onChange={(v) => setHero({ ...hero, heading: v })}
            placeholder="페이지 대제목"
          />
        </Field>
        <Field label="부제목 (영문)">
          <TextInput
            value={hero.subheading}
            onChange={(v) => setHero({ ...hero, subheading: v })}
            placeholder="영문 또는 짧은 부제목"
          />
        </Field>
      </div>
      <Field label="설명">
        <TextareaInput
          value={hero.description}
          onChange={(v) => setHero({ ...hero, description: v })}
          placeholder="히어로 설명 문구"
          rows={3}
        />
      </Field>
      <SaveRow
        onSave={handleSave}
        onCancel={() => setHero(JSON.parse(savedJson))}
        saving={saving}
        disabled={!isDirty}
      />
    </SectionCard>
  );
}

/* ──────────────────────────────────────
   섹션 텍스트 편집기
   GET/PUT /api/military/:page/section/:id
────────────────────────────────────── */
function SectionContentEditor({ page, sectionId, title, onSaveSuccess }) {
  const [fields, setFields] = useState([]);
  const [savedFields, setSavedFields] = useState([]);
  const [originalHtml, setOriginalHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noElements, setNoElements] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    setNoElements(false);
    api.get(`/military/${page}/section/${sectionId}`)
      .then(({ data }) => {
        const html = data?.html || "";
        setOriginalHtml(html);
        const doc = new DOMParser().parseFromString(html, "text/html");
        const extracted = [];
        let idx = 0;
        doc.body.querySelectorAll("h2, h3, h4, p").forEach((el) => {
          const text = el.textContent?.trim();
          if (text) extracted.push({ tag: el.tagName.toLowerCase(), text, idx: idx++ });
        });
        if (extracted.length === 0) setNoElements(true);
        setFields(extracted);
        setSavedFields(JSON.parse(JSON.stringify(extracted)));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page, sectionId]);

  const isDirty = JSON.stringify(fields) !== JSON.stringify(savedFields);
  const updateField = (idx, text) =>
    setFields((prev) => prev.map((f) => (f.idx === idx ? { ...f, text } : f)));

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const doc = new DOMParser().parseFromString(originalHtml, "text/html");
      const els = Array.from(doc.body.querySelectorAll("h2, h3, h4, p"));
      let fi = 0;
      els.forEach((el) => {
        if (el.textContent?.trim() && fi < fields.length) {
          el.textContent = fields[fi].text;
          fi++;
        }
      });
      const updatedHtml = doc.body?.innerHTML || originalHtml;
      await api.put(`/military/${page}/section/${sectionId}`, { html: updatedHtml });
      setOriginalHtml(updatedHtml);
      setSavedFields(JSON.parse(JSON.stringify(fields)));
      onSaveSuccess?.("저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  const TAG_LABELS = { h2: "제목 (H2)", h3: "소제목 (H3)", h4: "항목 제목 (H4)", p: "본문 단락" };

  return (
    <SectionCard title={title}>
      {errorMsg && (
        <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>
      )}
      {noElements ? (
        <p style={{ fontSize: 13, color: COLORS.textMuted }}>
          편집 가능한 텍스트 요소(h2, h3, p)를 찾지 못했습니다.
          &apos;HTML 직접 편집&apos; 탭에서 직접 수정하세요.
        </p>
      ) : (
        fields.map((f) => (
          <Field key={f.idx} label={TAG_LABELS[f.tag] || f.tag.toUpperCase()}>
            {f.tag === "p"
              ? <TextareaInput value={f.text} onChange={(v) => updateField(f.idx, v)} rows={4} />
              : <TextInput value={f.text} onChange={(v) => updateField(f.idx, v)} />}
          </Field>
        ))
      )}
      {!noElements && (
        <SaveRow
          onSave={handleSave}
          onCancel={() => setFields(JSON.parse(JSON.stringify(savedFields)))}
          saving={saving}
          disabled={!isDirty}
        />
      )}
    </SectionCard>
  );
}

/* ──────────────────────────────────────
   군사센터 연혁 편집기
   military/about/index.html의 id="history" 섹션을 직접 읽고 씀
────────────────────────────────────── */
function MilitaryHistoryEditor({ onSaveSuccess }) {
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [originalSectionHtml, setOriginalSectionHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    api.get("/military/about/section/history")
      .then(({ data }) => {
        const sectionHtml = data?.html || "";
        setOriginalSectionHtml(sectionHtml);
        const doc = new DOMParser().parseFromString(sectionHtml, "text/html");
        const parsed = Array.from(doc.querySelectorAll(".timeline-item")).map((el) => {
          const ps = el.querySelectorAll("p");
          return {
            year:  ps[0]?.textContent?.trim() || "",
            title: ps[1]?.textContent?.trim() || "",
            desc:  ps[2]?.textContent?.trim() || "",
          };
        });
        const its = [...(parsed.length > 0 ? parsed : [])].sort(
          (a, b) => parseInt(b.year) - parseInt(a.year)
        );
        setItems(JSON.parse(JSON.stringify(its)));
        setSavedItems(JSON.parse(JSON.stringify(its)));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    setDirty(true);
  };
  const addItem = () => {
    setItems((prev) => [...prev, { year: "", title: "", desc: "" }]);
    setDirty(true);
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const doc = new DOMParser().parseFromString(originalSectionHtml, "text/html");
      const body = doc.body;
      body.querySelectorAll(".timeline-item").forEach((el) => el.remove());
      const container =
        body.querySelector("[style*='flex-direction:column']") ||
        body.querySelector("[style*='flex-direction: column']") ||
        body.querySelector(".wrap > div:last-child") ||
        body.querySelector(".wrap");
      const sortedItems = [...items].sort((a, b) => parseInt(b.year) - parseInt(a.year));
      if (container) {
        sortedItems.forEach((item, i) => {
          const div = doc.createElement("div");
          div.className = `timeline-item fu d${i + 1}`;
          div.innerHTML = [
            `<p style="font-size:.72rem;letter-spacing:.18em;color:var(--gold);font-weight:700;margin-bottom:6px;">${item.year}</p>`,
            `<p style="font-size:.95rem;font-weight:700;color:#F1F5F9;margin-bottom:6px;">${item.title}</p>`,
            `<p style="font-size:.85rem;color:var(--text-sub);line-height:1.7;">${item.desc}</p>`,
          ].join("\n        ");
          container.appendChild(div);
        });
      }
      const updatedHtml = body.innerHTML;
      await api.put("/military/about/section/history", { html: updatedHtml });
      setOriginalSectionHtml(updatedHtml);
      setSavedItems(JSON.parse(JSON.stringify(items)));
      setDirty(false);
      onSaveSuccess?.("연혁이 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <SectionCard title="연혁 항목">
      {errorMsg && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>}
      {items.map((item, i) => (
        <ItemCard key={i} onRemove={items.length > 1 ? () => removeItem(i) : undefined}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
            <Field label="연도">
              <TextInput
                value={item.year ?? ""}
                placeholder="2025"
                onChange={(v) => updateItem(i, "year", v)}
              />
            </Field>
            <Field label="소제목">
              <TextInput
                value={item.title ?? ""}
                placeholder="주요 성과"
                onChange={(v) => updateItem(i, "title", v)}
              />
            </Field>
          </div>
          <Field label="상세 설명">
            <TextareaInput
              value={item.desc ?? ""}
              rows={3}
              placeholder="상세 내용을 입력하세요."
              onChange={(v) => updateItem(i, "desc", v)}
            />
          </Field>
        </ItemCard>
      ))}
      <button
        onClick={addItem}
        style={{ ...btnStyle(), marginBottom: dirty ? 16 : 0, fontSize: 13 }}
      >
        + 연혁 추가
      </button>
      <SaveRow
        onSave={handleSave}
        onCancel={() => { setItems(JSON.parse(JSON.stringify(savedItems))); setDirty(false); }}
        saving={saving}
        disabled={!dirty}
      />
    </SectionCard>
  );
}

/* ──────────────────────────────────────
   전체 페이지 HTML 직접 편집
   GET/PUT /api/military/:page/html
────────────────────────────────────── */
function FullPageHtmlEditor({ page, pageUrl, onSaveSuccess }) {
  const [html, setHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    api.get(`/military/${page}/html`)
      .then(({ data }) => { setHtml(data || ""); setOriginalHtml(data || ""); })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const isDirty = html !== originalHtml;
  const lineCount = html.split("\n").length;
  const sizeKb = (html.length / 1024).toFixed(1);

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.put(`/military/${page}/html`, { html });
      setOriginalHtml(html);
      onSaveSuccess?.("저장되었습니다. 페이지를 새로고침하면 변경이 반영됩니다.");
    } catch (err) {
      setErrorMsg(err.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>HTML 로딩 중...</p>;

  return (
    <div>
      {errorMsg && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5",
          borderRadius: 6, padding: "10px 14px", marginBottom: 12,
          fontSize: 13, color: "#b91c1c",
        }}>
          {errorMsg}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          {sizeKb} KB · {lineCount.toLocaleString()}줄
          {isDirty && (
            <span style={{ color: "#d97706", marginLeft: 8, fontWeight: 600 }}>
              ● 미저장 변경사항 있음
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isDirty && (
            <button
              style={{ ...btnStyle(COLORS.textSecondary), padding: "7px 16px", fontSize: 12.5 }}
              onClick={() => { setHtml(originalHtml); setErrorMsg(null); }}
              disabled={saving}
            >
              되돌리기
            </button>
          )}
          <button
            style={{
              ...btnStyle(), padding: "7px 20px", fontSize: 12.5,
              opacity: isDirty ? 1 : 0.4,
              cursor: isDirty ? "pointer" : "not-allowed",
            }}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? "저장 중..." : "저장 · 즉시 반영"}
          </button>
        </div>
      </div>
      <div style={{
        background: "#f8fafc", border: `1px solid ${COLORS.border}`,
        borderRadius: 6, overflow: "hidden",
      }}>
        <div style={{
          background: "#1e293b", padding: "8px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
            military/{page}/index.html
          </span>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            저장 즉시 {pageUrl} 에 반영
          </span>
        </div>
        <textarea
          style={{
            width: "100%", minHeight: 640, padding: "14px 16px",
            fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.65,
            border: "none", outline: "none", resize: "vertical",
            background: "#0f172a", color: "#e2e8f0",
            boxSizing: "border-box", display: "block",
          }}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
      <p style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 10 }}>
        ※ 저장 후 브라우저에서 <strong>Ctrl+Shift+R</strong> (강제 새로고침)을 누르면 변경 내용을 바로 확인할 수 있습니다.
      </p>
    </div>
  );
}


/* ──────────────────────────────────────
   인사말 편집기 (히어로 배너 + 리치 텍스트 본문)
   greeting 섹션의 h2 제목 + 왼쪽 컬럼 본문을 직접 수정
────────────────────────────────────── */
function MilitaryGreetingEditor({ page, onSaveSuccess }) {
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [originalSectionHtml, setOriginalSectionHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTitle, setSavedTitle] = useState("");
  const [savedBody, setSavedBody] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    api.get(`/military/${page}/section/greeting`)
      .then(({ data }) => {
        const html = data?.html || "";
        setOriginalSectionHtml(html);
        const doc = new DOMParser().parseFromString(html, "text/html");
        // Extract h2 title
        const h2 = doc.querySelector("h2");
        const titleText = h2?.textContent?.trim() || "";
        setTitle(titleText);
        setSavedTitle(titleText);
        // Extract left-column body (first div inside the grid)
        const grid = doc.querySelector(".greet-grid");
        const leftCol = grid?.children[0];
        const body = leftCol?.innerHTML || "";
        setBodyHtml(body);
        setSavedBody(body);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const isDirty = title !== savedTitle || bodyHtml !== savedBody;

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const doc = new DOMParser().parseFromString(originalSectionHtml, "text/html");
      // Update h2
      const h2 = doc.querySelector("h2");
      if (h2) h2.textContent = title;
      // Update left column
      const grid = doc.querySelector(".greet-grid");
      const leftCol = grid?.children[0];
      if (leftCol) leftCol.innerHTML = bodyHtml;
      const updatedHtml = doc.body.innerHTML;
      await api.put(`/military/${page}/section/greeting`, { html: updatedHtml });
      setOriginalSectionHtml(updatedHtml);
      setSavedTitle(title);
      setSavedBody(bodyHtml);
      onSaveSuccess?.("인사말이 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <>
      {/* 히어로 배너 (섹션 제목) */}
      <SectionCard title="히어로 배너 · 섹션 제목">
        {errorMsg && (
          <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>
        )}
        <Field label="섹션 제목 (H2)">
          <TextInput
            value={title}
            onChange={setTitle}
            placeholder="ABOUT HIGH & LAW FIRM"
          />
        </Field>
      </SectionCard>

      {/* 인사말 본문 (리치 텍스트) */}
      <SectionCard title="인사말 본문">
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
          Bold / Italic / 색상 / 정렬 서식을 지원합니다.
        </p>
        <SimpleRichEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          minHeight={220}
          placeholder="인사말 본문을 입력하세요..."
        />
      </SectionCard>

      {isDirty && (
        <div style={{ display: "flex", gap: 10, marginTop: -8, marginBottom: 20 }}>
          <button style={btnStyle()} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            style={btnStyle(COLORS.textSecondary)}
            onClick={() => { setTitle(savedTitle); setBodyHtml(savedBody); }}
            disabled={saving}
          >
            취소
          </button>
        </div>
      )}
    </>
  );
}


/* ──────────────────────────────────────
   공익활동 편집기
   probono 섹션의 카드들 (이모지 배지 + 제목 + 설명)
────────────────────────────────────── */
function MilitaryProbonoEditor({ onSaveSuccess }) {
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [originalSectionHtml, setOriginalSectionHtml] = useState("");
  const [sectionHeaderHtml, setSectionHeaderHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    api.get("/military/about/section/probono")
      .then(({ data }) => {
        const sectionHtml = data?.html || "";
        setOriginalSectionHtml(sectionHtml);
        const doc = new DOMParser().parseFromString(sectionHtml, "text/html");
        // Parse cards (horizontal layout: circle-div for emoji, h3 for title, last-p for desc)
        const parsed = Array.from(doc.querySelectorAll(".card")).map((card) => {
          const h3 = card.querySelector("h3");
          const allPs = card.querySelectorAll("p");
          const lastP = allPs.length > 0 ? allPs[allPs.length - 1] : null;
          // New layout: emoji in first child div; old layout: emoji in first p
          const firstChild = card.firstElementChild;
          const emoji = firstChild && firstChild.tagName === "DIV"
            ? firstChild.textContent?.trim()
            : allPs[0]?.textContent?.trim();
          return {
            emoji: emoji || "",
            title: h3?.textContent?.trim() || "",
            desc: lastP?.textContent?.trim() || "",
          };
        });
        // Store header HTML (everything before the grid div)
        const gridEl = doc.querySelector(".card")?.parentElement;
        if (gridEl) {
          const sectionBody = doc.body;
          const gridIdx = sectionBody.innerHTML.indexOf(gridEl.outerHTML);
          setSectionHeaderHtml(gridIdx > 0 ? sectionBody.innerHTML.slice(0, gridIdx) : "");
        }
        setItems(parsed);
        setSavedItems(JSON.parse(JSON.stringify(parsed)));
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    setDirty(true);
  };
  const addItem = () => {
    setItems((prev) => [...prev, { emoji: "⭐", title: "", desc: "" }]);
    setDirty(true);
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const doc = new DOMParser().parseFromString(originalSectionHtml, "text/html");
      // Rebuild the grid container with new cards
      const gridEl = doc.querySelector(".card")?.parentElement;
      if (gridEl) {
        gridEl.innerHTML = items.map((item, i) =>
          `<div class="card fu d${i + 1}" style="padding:28px 32px;display:flex;align-items:flex-start;gap:24px;">` +
          `<div style="font-size:1.8rem;flex-shrink:0;width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:rgba(201,168,76,.1);border-radius:50%;border:1px solid rgba(201,168,76,.3);">${item.emoji}</div>` +
          `<div>` +
          `<h3 style="font-size:1rem;font-weight:700;color:#F1F5F9;margin-bottom:8px;">${item.title}</h3>` +
          `<p style="font-size:.88rem;color:var(--text-sub);line-height:1.8;">${item.desc}</p>` +
          `</div>` +
          `</div>`
        ).join("\n      ");
      }
      const updatedHtml = doc.body.innerHTML;
      await api.put("/military/about/section/probono", { html: updatedHtml });
      setOriginalSectionHtml(updatedHtml);
      setSavedItems(JSON.parse(JSON.stringify(items)));
      setDirty(false);
      onSaveSuccess?.("공익활동이 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <SectionCard title="공익활동 항목">
      {errorMsg && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>}
      {items.map((item, i) => (
        <ItemCard key={i} onRemove={items.length > 1 ? () => removeItem(i) : undefined}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
            <Field label="이모지">
              <TextInput
                value={item.emoji}
                placeholder="🎓"
                onChange={(v) => updateItem(i, "emoji", v)}
              />
            </Field>
            <Field label="제목">
              <TextInput
                value={item.title}
                placeholder="활동명"
                onChange={(v) => updateItem(i, "title", v)}
              />
            </Field>
          </div>
          <Field label="설명">
            <TextareaInput
              value={item.desc}
              rows={3}
              placeholder="활동 내용을 입력하세요."
              onChange={(v) => updateItem(i, "desc", v)}
            />
          </Field>
        </ItemCard>
      ))}
      <button
        onClick={addItem}
        style={{ ...btnStyle(), marginBottom: dirty ? 16 : 0, fontSize: 13 }}
      >
        + 활동 추가
      </button>
      <SaveRow
        onSave={handleSave}
        onCancel={() => { setItems(JSON.parse(JSON.stringify(savedItems))); setDirty(false); }}
        saving={saving}
        disabled={!dirty}
      />
    </SectionCard>
  );
}

/* ──────────────────────────────────────
   탭별 콘텐츠 렌더러
────────────────────────────────────── */
function TabContent({ page, tabId, pageUrl, onToast }) {
  // 히어로 배너 탭 (모든 서브 페이지 첫 탭)
  if (tabId === "__hero__") {
    return (
      <HeroEditor
        key={`${page}-hero`}
        page={page}
        onSaveSuccess={onToast}
      />
    );
  }

  // HTML 직접 편집 탭
  if (tabId === "__html__") {
    return (
      <FullPageHtmlEditor
        key={page}
        page={page}
        pageUrl={pageUrl}
        onSaveSuccess={onToast}
      />
    );
  }

  // 인사말 탭: 섹션 제목 + 리치 텍스트 본문
  if (tabId === "greeting") {
    return (
      <MilitaryGreetingEditor
        key={`${page}-greeting`}
        page={page}
        onSaveSuccess={onToast}
      />
    );
  }

  // 연혁 탭 (about 전용)
  if (page === "about" && tabId === "history") {
    return <MilitaryHistoryEditor key="mil-history" onSaveSuccess={onToast} />;
  }

  // 공익활동 탭 (about 전용)
  if (page === "about" && tabId === "probono") {
    return <MilitaryProbonoEditor key="mil-probono" onSaveSuccess={onToast} />;
  }

  // 나머지 탭: 섹션 텍스트 편집
  const titleMap = {
    values:     "핵심가치",
    directions: "오시는 길",
    probono:    "공익활동",
    discipline: "군징계",
    criminal:   "군형사",
    admin:      "행정",
    civil:      "민사",
    news:       "하이로 뉴스",
    guide:      "군법 가이드",
    form:       "상담신청",
    process:    "진행절차",
    faq:        "FAQ",
  };

  return (
    <SectionContentEditor
      key={`${page}/${tabId}`}
      page={page}
      sectionId={tabId}
      title={titleMap[tabId] || tabId}
      onSaveSuccess={onToast}
    />
  );
}

/* ──────────────────────────────────────
   메인 내보내기
────────────────────────────────────── */
export default function SubPageTab({ page, subTabs, pageUrl, onToast }) {
  const allTabs = [
    { id: "__hero__", label: "히어로 배너" },
    ...subTabs,
    { id: "__html__", label: "HTML 직접 편집" },
  ];
  const [activeTab, setActiveTab] = useState("__hero__");

  return (
    <div>
      <SubTabBar
        tabs={allTabs}
        active={activeTab}
        onChange={setActiveTab}
        pageUrl={pageUrl}
      />
      <TabContent
        key={`${page}/${activeTab}`}
        page={page}
        tabId={activeTab}
        pageUrl={pageUrl}
        onToast={onToast}
      />
    </div>
  );
}
