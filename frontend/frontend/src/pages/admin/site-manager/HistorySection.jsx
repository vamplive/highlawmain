/** 개발 일지 뷰어 탭 — 마크다운 로그 목록 + 상세 보기 */
import { useState, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { api } from "../../../utils/api";
import { COLORS, btnStyle, badgeStyle } from "../../../components/admin/styles";
import { showToast } from "../../../utils/showToast";

/**
 * 입력 문자열의 HTML 메타문자를 이스케이프
 * WHY: markdownToHtml의 정규식 치환이 사용자 입력의 <, > 등을 그대로 통과시키면
 *      DOMPurify 통과 전 단계에서 의도치 않은 태그가 생성된다.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 마크다운을 간단히 HTML로 변환 (입력은 사전에 이스케이프됨) */
function markdownToHtml(text) {
  if (!text) return "";
  return escapeHtml(text)
    .replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;color:#1a1a1a;margin:16px 0 8px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:#1a1a1a;margin:20px 0 10px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:17px;font-weight:600;color:#1a1a1a;margin:0 0 12px">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent-gold);padding:4px 12px;margin:8px 0;color:#555;background:#f7f8fa">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:16px;margin:2px 0">&bull; $1</div>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.replace(/^\| ?| ?\|$/g, "").split(" | ");
      return '<div style="display:grid;grid-template-columns:repeat(' + cells.length + ',1fr);gap:0;border-bottom:1px solid #e5e8ed;font-size:12px">' +
        cells.map(c => '<span style="padding:6px 8px">' + c.trim() + '</span>').join("") + '</div>';
    })
    .replace(/^\|[-| ]+\|$/gm, "")
    .replace(/\n/g, "<br/>");
}

export default function HistorySection() {
  const [entries, setEntries] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logContent, setLogContent] = useState("");

  const loadHistory = useCallback(() => {
    api.get("/dev-logs").then((json) => {
      setEntries(json.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const openLog = async (filename) => {
    try {
      const json = await api.get(`/dev-logs/${filename}`);
      setSelectedLog(filename);
      setLogContent(json.data?.content || "");
    } catch {
      showToast("파일을 불러올 수 없습니다.");
    }
  };

  /* 상세 보기 모드 */
  if (selectedLog) {
    const entry = entries.find(e => e.filename === selectedLog);
    return (
      <>
        <button onClick={() => { setSelectedLog(null); setLogContent(""); }}
          style={{ ...btnStyle("#666"), marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          &larr; 목록으로
        </button>
        <div style={{
          background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10,
          padding: "28px 32px",
        }}>
          <div style={{ marginBottom: 16 }}>
            <span style={badgeStyle(COLORS.accent)}>#{entry?.number || ""}</span>
            <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 10 }}>{entry?.date || ""}</span>
          </div>
          <div
            style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(markdownToHtml(logContent)) }}
          />
        </div>
      </>
    );
  }

  /* 목록 보기 */
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>개발 일지</h3>
        <p style={{ fontSize: 13, color: COLORS.textMuted }}>
          홈페이지 개발 과정에서 어떤 프롬프트로 어떤 변경이 이루어졌는지 기록합니다. ({entries.length}건)
        </p>
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>
          개발 일지가 없습니다.
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 28 }}>
          {/* 세로 타임라인 선 */}
          <div style={{
            position: "absolute", left: 9, top: 0, bottom: 0,
            width: 2, background: COLORS.border,
          }} />

          {entries.map((entry, idx) => (
            <div key={entry.filename} style={{ position: "relative", marginBottom: 16, paddingLeft: 20 }}>
              {/* 타임라인 점 */}
              <div style={{
                position: "absolute", left: -22, top: 8,
                width: 12, height: 12, borderRadius: 6,
                background: idx === 0 ? COLORS.accent : COLORS.border,
                border: "2px solid #fff",
                boxShadow: `0 0 0 2px ${idx === 0 ? COLORS.accent : COLORS.border}`,
              }} />

              <div
                onClick={() => openLog(entry.filename)}
                style={{
                  background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  padding: "14px 18px", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,58,107,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={badgeStyle(COLORS.accent)}>#{entry.number}</span>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{entry.date}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>
                  {entry.title || entry.slug}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
