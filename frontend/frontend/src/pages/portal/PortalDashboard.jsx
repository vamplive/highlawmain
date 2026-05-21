/** 포털 대시보드 -- 의뢰인 사건 목록, 환영 메시지 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";
import { STATUS_MAP } from "./portalConstants";

export default function PortalDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      portalApi.get("/cases")
        .then((json) => {
          if (cancelled) return;
          setCases(json.data ?? []);
          if (json.meta?.userName) setUserName(json.meta.userName);
        })
        .catch(() => { if (!cancelled) setCases([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      {/* ==================== 환영 메시지 ==================== */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
          {userName ? `${userName}님, 안녕하세요` : "안녕하세요"}
        </h1>
        <p style={{ fontSize: 14, color: T.textSec }}>
          진행 중인 사건과 관련 문서를 확인하실 수 있습니다
        </p>
      </div>

      {/* ==================== 사건 목록 ==================== */}
      {loading ? (
        <p style={{ color: T.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>로딩 중...</p>
      ) : cases.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 80, background: T.card,
          border: `1px solid ${T.border}`, borderRadius: 10,
        }}>
          <p style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#x1F4C1;</p>
          <p style={{ fontSize: 15, color: T.textSec, marginBottom: 8 }}>진행 중인 사건이 없습니다</p>
          <p style={{ fontSize: 13, color: T.textMuted }}>사건이 등록되면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {cases.map((c) => {
            const statusStyle = STATUS_MAP[c.status] || STATUS_MAP["접수"];
            return (
              <Link
                key={c.id}
                to={`/portal/cases/${c.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                  padding: 24, transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>{c.title}</h3>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 10,
                      background: statusStyle.bg, color: statusStyle.color, fontWeight: 500,
                    }}>
                      {c.status}
                    </span>
                  </div>
                  {c.caseNumber && (
                    <p style={{ fontSize: 12, color: T.textMuted, fontFamily: "monospace", marginBottom: 4 }}>
                      {c.caseNumber}
                    </p>
                  )}
                  {c.court && (
                    <p style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>
                      {c.court}
                    </p>
                  )}
                  {c.lawyerName && (
                    <p style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>
                      담당: {c.lawyerName}
                    </p>
                  )}
                  {c.updatedAt && (
                    <p style={{ fontSize: 12, color: T.textMuted }}>
                      최근 업데이트: {new Date(c.updatedAt).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
