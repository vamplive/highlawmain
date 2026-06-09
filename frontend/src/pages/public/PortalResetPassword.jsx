/**
 * /reset-password?token=xxx — 포털 비밀번호 재설정 페이지
 * - 이메일로 받은 링크에 포함된 token으로 새 비밀번호 설정
 * - 성공 시 /login으로 이동
 */
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import "./LoginPage.css";

export default function PortalResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // 토큰이 없으면 잘못된 접근
  if (!token) {
    return (
      <div className="portal-reset__page">
        <div className="portal-reset__box">
          <div className="portal-reset__icon portal-reset__icon--err">✕</div>
          <h1 className="portal-reset__title">유효하지 않은 링크</h1>
          <p className="portal-reset__desc">
            비밀번호 재설정 링크가 올바르지 않거나 만료되었습니다.
          </p>
          <Link to="/login" className="portal-login__btn" style={{ display: "block", textAlign: "center", marginTop: "24px" }}>
            로그인 화면으로
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다");
    if (password !== passwordConfirm) return setError("비밀번호가 일치하지 않습니다");
    setLoading(true);
    setError("");
    try {
      await portalApi.post("/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.message || "비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-reset__page">
      <div className="portal-reset__box">
        {done ? (
          <>
            <div className="portal-reset__icon portal-reset__icon--ok">✓</div>
            <h1 className="portal-reset__title">비밀번호가 변경되었습니다</h1>
            <p className="portal-reset__desc">
              새 비밀번호로 로그인해주세요.<br />
              기존에 로그인된 모든 기기에서 자동으로 로그아웃됩니다.
            </p>
            <button
              className="portal-login__btn"
              style={{ marginTop: "24px", width: "100%" }}
              onClick={() => navigate("/login", { replace: true })}
            >
              로그인 화면으로
            </button>
          </>
        ) : (
          <>
            <div className="portal-reset__label">HIGHLAW PORTAL</div>
            <h1 className="portal-reset__title">비밀번호 재설정</h1>
            <p className="portal-reset__desc">새 비밀번호를 입력해주세요.</p>

            <form onSubmit={submit}>
              <div className="portal-login__field">
                <label className="portal-login__field-label">새 비밀번호 (8자 이상)</label>
                <input
                  type="password"
                  className={`portal-login__input${error ? " portal-login__input--error" : ""}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="새 비밀번호"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div className="portal-login__field">
                <label className="portal-login__field-label">비밀번호 확인</label>
                <input
                  type="password"
                  className={`portal-login__input${error ? " portal-login__input--error" : ""}`}
                  value={passwordConfirm}
                  onChange={(e) => { setPasswordConfirm(e.target.value); setError(""); }}
                  placeholder="비밀번호 확인"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="portal-login__error portal-login__error--danger">{error}</div>
              )}

              <button type="submit" className="portal-login__btn" disabled={loading} style={{ marginTop: "8px" }}>
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <Link to="/login" className="portal-login__forgot-btn">
                로그인 화면으로
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
