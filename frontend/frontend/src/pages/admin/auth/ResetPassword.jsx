/**
 * 관리자 비밀번호 재설정 페이지 — /admin/reset-password?token=...
 * - URL 쿼리에서 reset 토큰을 받아 새 비밀번호와 함께 서버에 제출
 * - 서버는 토큰을 검증하고 비밀번호를 교체한 뒤, 모든 기존 세션을 무효화한다
 * - 인증이 필요 없는 공개 라우트 (App.jsx에서 /admin/* 보호 영역 외부에 등록)
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../utils/api";
import "./Login.css";

export default function AdminResetPassword() {
  const navigate = useNavigate();

  // 토큰은 URL 쿼리에서만 추출 — Hash·hashes 신뢰 안 함
  const token = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("token") || "";
    } catch {
      return "";
    }
  }, []);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");
    if (!token) { setErr("재설정 링크가 유효하지 않습니다."); return; }
    if (pw.length < 8) { setErr("비밀번호는 8자 이상이어야 합니다."); return; }
    if (pw !== pw2) { setErr("비밀번호 확인이 일치하지 않습니다."); return; }

    setLoading(true);
    try {
      await api.post("/admin-users/reset-password", { token, password: pw });
      setDone(true);
    } catch (error) {
      setErr(error.message || "토큰이 유효하지 않거나 만료되었습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__right" style={{ width: "100%" }}>
        <a href="/" className="admin-login__home-link">홈페이지</a>

        <div className="admin-login__form-wrap">
          <div className="admin-login__label">PASSWORD RESET</div>
          <h1 className="admin-login__heading">비밀번호 재설정</h1>

          {done ? (
            <div style={{ marginTop: 24 }}>
              <div className="admin-login__forgot-msg" style={{ marginBottom: 16 }}>
                비밀번호가 변경되었습니다. 다시 로그인해주세요.
              </div>
              <button
                type="button"
                className="admin-login__btn"
                onClick={() => navigate("/admin", { replace: true })}
              >
                로그인 화면으로
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label htmlFor="reset-pw" className="admin-login__pw-label">새 비밀번호</label>
              <input
                id="reset-pw"
                type="password"
                className={`admin-login__input ${err ? "admin-login__input--error" : ""}`}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(""); }}
                autoComplete="new-password"
                autoFocus
              />
              <label htmlFor="reset-pw2" className="admin-login__pw-label" style={{ marginTop: 16 }}>
                비밀번호 확인
              </label>
              <input
                id="reset-pw2"
                type="password"
                className={`admin-login__input ${err ? "admin-login__input--error" : ""}`}
                value={pw2}
                onChange={(e) => { setPw2(e.target.value); setErr(""); }}
                autoComplete="new-password"
              />

              {err && <div className="admin-login__error">{err}</div>}

              <button type="submit" className="admin-login__btn" disabled={loading || !token}>
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>

              {!token && (
                <div className="admin-login__error" style={{ marginTop: 12 }}>
                  재설정 링크가 유효하지 않습니다. 비밀번호 분실 페이지에서 다시 요청해주세요.
                </div>
              )}
            </form>
          )}

          <div className="admin-login__footer">
            <div className="admin-login__footer-line">HIGH & LAW FIRM</div>
            <div className="admin-login__footer-line">CONFIDENTIAL ACCESS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
