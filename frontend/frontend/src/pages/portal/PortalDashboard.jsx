/** 포털 대시보드 — 사건 목록, 사건 등록 버튼, 구글 캘린더 연동 */
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";
import { STATUS_MAP } from "./portalConstants";
import { showToast } from "../../utils/showToast";

export default function PortalDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncingCaseId, setSyncingCaseId] = useState(null);

  useEffect(() => {
    // 구글 캘린더 OAuth2 콜백 결과 처리
    const googleConnectedParam = searchParams.get("googleConnected");
    const googleErrorParam = searchParams.get("googleError");
    if (googleConnectedParam === "1") {
      showToast("구글 캘린더가 연동되었습니다", "success");
      setGoogleConnected(true);
      window.history.replaceState({}, "", "/portal/dashboard");
    } else if (googleErrorParam) {
      showToast(`구글 캘린더 연동 실패: ${googleErrorParam}`, "error");
      window.history.replaceState({}, "", "/portal/dashboard");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      portalApi.get("/cases"),
      portalApi.get("/me"),
    ]).then(([casesRes, meRes]) => {
      if (cancelled) return;
      setCases(casesRes.data ?? []);
      const clientName = meRes.data?.client?.name;
      if (clientName) setUserName(clientName);
      setGoogleConnected(Boolean(meRes.data?.user?.googleConnected));
    }).catch(() => {
      if (!cancelled) setCases([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const res = await portalApi.get("/google/auth-url");
      if (!res.data?.configured) {
        showToast("구글 캘린더 연동이 아직 설정되지 않았습니다", "error");
        return;
      }
      window.location.href = res.data.authUrl;
    } catch {
      showToast("구글 캘린더 연동 URL을 가져오지 못했습니다", "error");
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!window.confirm("구글 캘린더 연동을 해제하시겠습니까?")) return;
    try {
      await portalApi.delete("/google/disconnect");
      setGoogleConnected(false);
      showToast("구글 캘린더 연동이 해제되었습니다", "success");
    } catch {
      showToast("연동 해제에 실패했습니다", "error");
    }
  };

  const handleSyncToCalendar = async (caseId, caseTitle) => {
    setSyncingCaseId(caseId);
    try {
      await portalApi.post(`/google/sync-case/${caseId}`);
      showToast(`"${caseTitle}" 사건이 구글 캘린더에 추가되었습니다`, "success");
    } catch (err) {
      showToast(err.message || "캘린더 추가에 실패했습니다", "error");
    } finally {
      setSyncingCaseId(null);
    }
  };

  return (
    <div>
      {/* ==================== 헤더 영역 ==================== */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
            {userName ? `${userName}님, 안녕하세요` : "안녕하세요"}
          </h1>
          <p style={{ fontSize: 14, color: T.textSec }}>
            진행 중인 사건과 관련 문서를 확인하실 수 있습니다
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* 구글 캘린더 연동/해제 버튼 */}
          {googleConnected ? (
            <button
              onClick={handleGoogleDisconnect}
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: 500,
                color: "#555", background: "#f5f5f5",
                border: "1px solid #ddd", borderRadius: 6, cursor: "pointer",
              }}
            >
              📅 구글 캘린더 연동 해제
            </button>
          ) : (
            <button
              onClick={handleGoogleConnect}
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: 500,
                color: "#1a73e8", background: "#e8f0fe",
                border: "1px solid #c5d8f7", borderRadius: 6, cursor: "pointer",
              }}
            >
              📅 구글 캘린더 연동
            </button>
          )}

          {/* 사건 등록 버튼 */}
          <Link
            to="/portal/cases/register"
            style={{
              display: "inline-block",
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              color: "#fff", background: T.accent,
              border: "none", borderRadius: 6, cursor: "pointer",
              textDecoration: "none",
            }}
          >
            + 사건 등록
          </Link>
        </div>
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
          <p style={{ fontSize: 15, color: T.textSec, marginBottom: 8 }}>등록된 사건이 없습니다</p>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>위의 "사건 등록" 버튼으로 사건을 추가하세요</p>
          <Link
            to="/portal/cases/register"
            style={{
              display: "inline-block", padding: "10px 24px", fontSize: 13, fontWeight: 600,
              color: "#fff", background: T.accent, borderRadius: 6, textDecoration: "none",
            }}
          >
            사건 등록하기
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {cases.map((c) => {
            const statusStyle = STATUS_MAP[c.status] || STATUS_MAP["접수"];
            return (
              <div
                key={c.id}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                  padding: 24, transition: "box-shadow 0.2s, transform 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <Link to={`/portal/cases/${c.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
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
                    <p style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{c.court}</p>
                  )}
                  {c.lawyerName && (
                    <p style={{ fontSize: 13, color: T.textSec, marginBottom: 8 }}>담당: {c.lawyerName}</p>
                  )}
                  {c.updatedAt && (
                    <p style={{ fontSize: 12, color: T.textMuted }}>
                      최근 업데이트: {new Date(c.updatedAt).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </Link>

                {/* 구글 캘린더 추가 버튼 */}
                {googleConnected && (
                  <button
                    onClick={() => handleSyncToCalendar(c.id, c.title)}
                    disabled={syncingCaseId === c.id}
                    style={{
                      marginTop: 12, padding: "4px 10px", fontSize: 11, fontWeight: 500,
                      color: "#1a73e8", background: "transparent",
                      border: "1px solid #c5d8f7", borderRadius: 4, cursor: "pointer",
                      opacity: syncingCaseId === c.id ? 0.5 : 1,
                    }}
                  >
                    {syncingCaseId === c.id ? "추가 중..." : "📅 캘린더 추가"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
