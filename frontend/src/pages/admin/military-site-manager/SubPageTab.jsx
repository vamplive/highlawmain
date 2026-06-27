/**
 * 군사센터 서브 페이지 관리 탭 (범용)
 * — 섹션별 하위탭 + HTML 전체 편집 하위탭 제공
 * Props:
 *   page      - API 경로 식별자 (about | practices | info | consultation)
 *   subTabs   - [{ id, label }] — 섹션 ID + 표시 이름
 *   pageUrl   - 실제 사이트 URL (미리보기 링크용)
 *   onToast   - (message: string) => void
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, fieldStyle } from "../../../components/admin/styles";
import SectionHtmlEditor from "./SectionHtmlEditor";

/* ── 전체 HTML 편집기 ── */
function FullHtmlEditor({ page, onSaveSuccess }) {
  const [html, setHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/military/${page}/html`)
      .then(({ data }) => {
        setHtml(data || "");
        setOriginalHtml(data || "");
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const isDirty = html !== originalHtml;

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/military/${page}/html`, { html });
      setOriginalHtml(html);
      if (onSaveSuccess) onSaveSuccess("전체 HTML이 저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <div>
      {errorMsg && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <span style={{
            fontSize: 11, color: "#92400e", background: "#fef3c7",
            padding: "3px 10px", borderRadius: 4, fontWeight: 600,
          }}>
            주의: 잘못 수정하면 페이지가 깨질 수 있습니다
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isDirty && (
            <button style={{ ...btnStyle(COLORS.textSecondary), padding: "6px 14px", fontSize: 12 }}
              onClick={() => setHtml(originalHtml)} disabled={saving}>취소</button>
          )}
          <button style={{ ...btnStyle(), padding: "6px 14px", fontSize: 12, opacity: isDirty ? 1 : 0.35 }}
            onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
        {(html.length / 1024).toFixed(0)} KB · {html.split("\n").length}줄
      </p>
      <textarea
        style={{ ...fieldStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.65 }}
        rows={40}
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

/* ── 서브 탭 바 ── */
function SubTabBar({ tabs, activeId, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            padding: "7px 16px", fontSize: 13, border: "none", borderRadius: 6, cursor: "pointer",
            fontWeight: activeId === tab.id ? 700 : 400,
            color: activeId === tab.id ? "#fff" : COLORS.textSecondary,
            background: activeId === tab.id ? COLORS.primary : COLORS.bgInactive,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── 메인 내보내기 ── */
export default function SubPageTab({ page, subTabs, pageUrl, onToast }) {
  const allTabs = [
    ...subTabs,
    { id: "__full_html__", label: "HTML 전체 편집" },
  ];

  const [activeTabId, setActiveTabId] = useState(subTabs[0]?.id);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <SubTabBar tabs={allTabs} activeId={activeTabId} onSelect={setActiveTabId} />
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", fontSize: 12, color: COLORS.textMuted, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          페이지 보기 →
        </a>
      </div>

      {activeTabId === "__full_html__" ? (
        <FullHtmlEditor page={page} onSaveSuccess={onToast} />
      ) : (
        activeTabId && (
          <SectionHtmlEditor
            key={`${page}/${activeTabId}`}
            page={page}
            sectionId={activeTabId}
            onSaveSuccess={onToast}
          />
        )
      )}
    </div>
  );
}
