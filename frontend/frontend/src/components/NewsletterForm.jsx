/** 뉴스레터 구독 폼 — 푸터 삽입용 이메일 구독 */
import { useState } from "react";
import { api } from "../utils/api";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      await api.post("/newsletter/subscribe", { email: email.trim() });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "구독 처리 중 오류가 발생했습니다");
    }
  };

  if (status === "success") {
    return (
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", padding: "8px 0" }}>
        구독해주셔서 감사합니다!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일 주소"
        required
        style={{
          padding: "8px 14px",
          fontSize: 13,
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontFamily: "inherit",
          outline: "none",
          minWidth: 200,
          boxSizing: "border-box",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 500,
          color: "#0f1d32",
          background: "var(--accent-gold)",
          border: "none",
          borderRadius: 4,
          cursor: status === "loading" ? "default" : "pointer",
          opacity: status === "loading" ? 0.6 : 1,
        }}
      >
        {status === "loading" ? "..." : "구독"}
      </button>
      {status === "error" && (
        <span style={{ fontSize: 12, color: "#ff8a80", width: "100%" }}>{errorMsg}</span>
      )}
    </form>
  );
}
