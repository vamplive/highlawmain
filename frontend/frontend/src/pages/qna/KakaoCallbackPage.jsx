/**
 * 카카오 OAuth 콜백 페이지 — 인가 코드를 백엔드로 전달하고 세션 생성 후 리다이렉트
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../utils/api";

export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("인가 코드가 없습니다");
      return;
    }
    api.post("/auth/kakao/callback", { code })
      .then(() => {
        const returnUrl = sessionStorage.getItem("kakao_return_url") || "/qna";
        sessionStorage.removeItem("kakao_return_url");
        navigate(returnUrl, { replace: true });
      })
      .catch((e) => setError(e.message || "카카오 로그인에 실패했습니다"));
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 16, color: "#c0392b", marginBottom: 20 }}>{error}</p>
        <button onClick={() => navigate("/qna")} style={{
          padding: "10px 24px", fontSize: 13, border: "1px solid var(--border-color)",
          background: "#fff", cursor: "pointer",
        }}>
          Q&A로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "120px 24px", textAlign: "center", color: "var(--text-muted)" }}>
      카카오 로그인 처리 중...
    </div>
  );
}
