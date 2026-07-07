/** 포털 — 소송위임계약서 목록 페이지 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, pageHeaderStyle, pageHeaderIconStyle, fieldStyle, labelStyle } from "./portalStyles";

const fmtDate = (s) => {
  if (!s) return "-";
  return s.slice(0, 10);
};

const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function PortalLitigationAgreements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    portalApi.get(`/cases/litigation-agreements?${params}`)
      .then(r => setItems(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [search, from, to]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const download = async (item) => {
    try {
      const res = await portalApi.get(`/cases/documents/${item.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = item.originalName || item.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
      {/* 헤더 */}
      <div style={pageHeaderStyle}>
        <div style={{ ...pageHeaderIconStyle, background: "rgba(255,255,255,0.15)", fontSize: 22 }}>📄</div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>소송위임계약서</h1>
          <p style={{ fontSize: 13, opacity: 0.85, margin: "4px 0 0" }}>등록된 소송위임계약서를 날짜 및 사건별로 조회합니다</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link to="/portal/dashboard" style={{ color: "#fff", opacity: 0.75, fontSize: 13, textDecoration: "none" }}>← 대시보드</Link>
        </div>
      </div>

      {/* 검색 필터 */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 180px" }}>
            <span style={labelStyle}>검색 (파일명 / 사건명)</span>
            <input
              style={{ ...fieldStyle, padding: "8px 12px", fontSize: 13 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="파일명 또는 사건명 검색..."
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 130px" }}>
            <span style={labelStyle}>시작일</span>
            <input type="date" style={{ ...fieldStyle, padding: "8px 12px", fontSize: 13 }}
              value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 130px" }}>
            <span style={labelStyle}>종료일</span>
            <input type="date" style={{ ...fieldStyle, padding: "8px 12px", fontSize: 13 }}
              value={to} onChange={e => setTo(e.target.value)} />
          </label>
          <button type="submit" style={{
            padding: "9px 20px", background: T.accent, color: "#fff",
            border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer",
            flexShrink: 0,
          }}>검색</button>
          {(search || from || to) && (
            <button type="button" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}
              style={{ padding: "9px 14px", background: "#f1f5f9", color: T.textSec, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
              초기화
            </button>
          )}
        </form>
      </div>

      {/* 목록 */}
      {loading ? (
        <p style={{ textAlign: "center", color: T.textMuted, padding: 40, fontSize: 14 }}>로딩 중...</p>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
          <p style={{ fontSize: 15, color: T.textSec }}>등록된 소송위임계약서가 없습니다</p>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>사건 상세 페이지에서 소송위임계약서를 첨부하세요</p>
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textMuted }}>
            총 {items.length}건
          </div>
          {items.map((item, idx) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
              borderBottom: idx < items.length - 1 ? `1px solid ${T.border}` : "none",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>📋</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.originalName || item.filename}
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                  {item.caseTitle && (
                    <Link to={`/portal/cases/${item.caseFileId}`}
                      style={{ fontSize: 12, color: T.accent, textDecoration: "none", fontWeight: 500 }}>
                      {item.caseTitle}
                    </Link>
                  )}
                  <span style={{ fontSize: 12, color: T.textMuted }}>
                    {fmtDate(item.createdAt)}
                  </span>
                  {item.fileSize && (
                    <span style={{ fontSize: 12, color: T.textMuted }}>
                      {fmtSize(item.fileSize)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => download(item)}
                style={{
                  padding: "7px 14px", background: "#f0f9ff", border: `1px solid ${T.accent}`,
                  color: T.accent, borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                다운로드
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
