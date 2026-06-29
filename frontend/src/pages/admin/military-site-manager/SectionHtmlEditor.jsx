/**
 * 특정 페이지의 특정 섹션 HTML을 불러오고 저장하는 범용 에디터 컴포넌트
 * Props: page (home|about|...), sectionId, onSaveSuccess
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, fieldStyle } from "../../../components/admin/styles";

export default function SectionHtmlEditor({ page, sectionId, onSaveSuccess }) {
  const [html, setHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!page || !sectionId) return;
    setLoading(true);
    setErrorMsg(null);
    api.get(`/military/${page}/section/${sectionId}`)
      .then(({ data }) => {
        setHtml(data?.html || "");
        setOriginalHtml(data?.html || "");
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [page, sectionId]);

  const isDirty = html !== originalHtml;

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.put(`/military/${page}/section/${sectionId}`, { html });
      setOriginalHtml(html);
      if (onSaveSuccess) onSaveSuccess("저장되었습니다.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;

  return (
    <div>
      {errorMsg && (
        <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: COLORS.textMuted }}>
          {page} / {sectionId} · {(html.length / 1024).toFixed(1)} KB · {html.split("\n").length}줄
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {isDirty && (
            <button
              style={{ ...btnStyle(COLORS.textSecondary), padding: "6px 14px", fontSize: 12 }}
              onClick={() => setHtml(originalHtml)}
              disabled={saving}
            >
              취소
            </button>
          )}
          <button
            style={{ ...btnStyle(), padding: "6px 14px", fontSize: 12, opacity: isDirty ? 1 : 0.35 }}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
      <textarea
        style={{
          ...fieldStyle,
          resize: "vertical",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.65,
        }}
        rows={38}
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
