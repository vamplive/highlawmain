/** 포털 로그인 -- 이메일 또는 전화번호 + 비밀번호 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, fieldStyle } from "./portalStyles";

export default function PortalLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) return setError("이메일(또는 전화번호)과 비밀번호를 입력해주세요");

    setError("");
    setLoading(true);

    try {
      await portalApi.post("/login", { identifier: form.identifier.trim(), password: form.password });
      navigate("/portal", { replace: true });
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f8f8f6 0%, #eee 100%)",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: "#fff",
        borderRadius: 12, padding: 40,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", marginBottom: 8 }}>
            법무법인 하이로
          </h1>
          <p style={{ fontSize: 13, color: T.textSec }}>의뢰인 포털 로그인</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: "block", marginBottom: 6 }}>
              이메일 또는 전화번호
            </label>
            <input
              type="text"
              style={fieldStyle}
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="example@email.com 또는 010-1234-5678"
              autoComplete="username"
              inputMode="email"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: "block", marginBottom: 6 }}>비밀번호</label>
            <input
              type="password"
              style={fieldStyle}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={{
              fontSize: 13,
              color: error.includes("승인 대기") ? "#e65100" : "#c62828",
              marginBottom: 16,
              textAlign: "center",
              background: error.includes("승인 대기") ? "#fff3e0" : "transparent",
              padding: error.includes("승인 대기") ? "10px 12px" : 0,
              borderRadius: 6,
            }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600,
              color: "#fff", background: T.accent, border: "none",
              borderRadius: 6, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 하단 링크 */}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", justifyContent: "center", gap: 16 }}>
          <Link to="/portal/register" style={{ fontSize: 13, color: T.accent, textDecoration: "none" }}>
            회원가입
          </Link>
          <span style={{ fontSize: 13, color: T.textSec }}>|</span>
          <Link to="/portal/reset-password" style={{ fontSize: 13, color: T.textSec, textDecoration: "none" }}>
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}
