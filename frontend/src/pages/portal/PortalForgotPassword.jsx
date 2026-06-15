/** 포털 비밀번호 찾기 — 전화번호로 재설정 링크 문자 발송 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, fieldStyle } from "./portalStyles";

const PHONE_RE = /^(01[016789]\d{7,8}|01[016789]-\d{3,4}-\d{4})$/;
function cleanPhone(p) { return p.replace(/[\s\-]/g, ""); }

export default function PortalForgotPassword() {
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = cleanPhone(phone);
    if (!PHONE_RE.test(cleaned) && !PHONE_RE.test(phone)) {
      return setError("올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)");
    }
    setError("");
    setLoading(true);
    try {
      await portalApi.post("/forgot-password", { input: cleaned || phone.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message || "오류가 발생했습니다. 다시 시도해주세요.");
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
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", marginBottom: 8 }}>
            법무법인 하이로
          </h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>비밀번호 재설정</p>
          {!sent && (
            <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
              가입 시 등록한 휴대폰 번호를 입력하시면<br />
              문자 메시지로 재설정 링크를 발송해 드립니다.
            </p>
          )}
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#e8f5e9", margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "#2e7d32",
            }}>✓</div>
            <p style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 8 }}>
              문자 메시지를 발송했습니다
            </p>
            <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, marginBottom: 24 }}>
              입력하신 번호로 재설정 링크를 보냈습니다.<br />
              링크는 <strong>30분간</strong> 유효합니다.<br />
              카카오톡 메시지함에서도 확인 가능합니다.
            </p>
            <Link
              to="/login"
              style={{
                display: "block", width: "100%", padding: "12px 0",
                fontSize: 14, fontWeight: 600, color: "#fff",
                background: T.accent, borderRadius: 6,
                textDecoration: "none", textAlign: "center",
              }}
            >
              로그인 화면으로
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: "block", marginBottom: 6 }}>
                휴대폰 번호
              </label>
              <input
                type="tel"
                style={fieldStyle}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                placeholder="010-0000-0000"
                autoFocus
                inputMode="numeric"
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#c62828", marginBottom: 16, textAlign: "center" }}>
                {error}
              </p>
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
              {loading ? "발송 중..." : "재설정 링크 발송"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/login" style={{ fontSize: 13, color: T.textSec, textDecoration: "none" }}>
            로그인 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}
