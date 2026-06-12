/** 관리자 로그인 — 스플릿 스크린 레이아웃 (좌: 배경영상 히어로, 우: 인증 폼) */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { isSafeHttpUrl } from "../../../utils/safeUrl";
import "./Login.css";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_SEC = 15 * 60;

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [clock, setClock] = useState(new Date());
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockRemain, setLockRemain] = useState(0);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");

  // 활성 히어로 영상 로드 (localStorage 캐시 우선, API 갱신)
  // - 모든 URL은 사용 직전에 isSafeHttpUrl로 javascript:/data: 등 차단
  useEffect(() => {
    const cached = localStorage.getItem("activeHeroVideo");
    if (cached && isSafeHttpUrl(cached)) setHeroVideo(cached);
    fetch("/api/hero-videos/active")
      .then(r => r.json())
      .then(json => {
        const url = json.data?.url;
        if (url && isSafeHttpUrl(url)) {
          setHeroVideo(url);
          localStorage.setItem("activeHeroVideo", url);
        }
      })
      .catch(() => {});
  }, []);

  // 관리자 페이지에서 활성 영상 변경 시 실시간 반영
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "activeHeroVideo" && e.newValue && isSafeHttpUrl(e.newValue)) {
        setHeroVideo(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 실시간 시계 (1초 간격)
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 잠금 카운트다운
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => {
      setLockRemain((prev) => {
        if (prev <= 1) { setLocked(false); setAttempts(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [locked]);

  const hh = String(clock.getHours()).padStart(2, "0");
  const mm = String(clock.getMinutes()).padStart(2, "0");
  const dateStr = `${DAY_NAMES[clock.getDay()]}, ${MONTH_NAMES[clock.getMonth()]} ${clock.getDate()}, ${clock.getFullYear()}`;

  const submit = async (e) => {
    e.preventDefault();
    if (locked || loading) return;
    setLoading(true);
    setErr("");
    try {
      // 서버는 HttpOnly 쿠키로 세션을 발급한다 — 응답 body의 token은 사용하지 않는다
      await api.post("/admin-users/login", { username: username.trim() || "admin", password: pw });
      onLogin();
    } catch (error) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setLocked(true);
        setLockRemain(LOCK_DURATION_SEC);
        setErr("로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.");
      } else {
        setErr(error.message || "아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 분실 — 등록된 이메일로 1회용 재설정 링크 발송 (토큰은 30분 유효).
  // 호출 자체로는 비밀번호/세션을 변경하지 않으므로, 외부에서 username만으로
  // 정상 admin을 강제 로그아웃시키는 DoS는 불가능하다.
  const requestPasswordReset = async () => {
    if (forgotLoading) return;
    const target = (username.trim() || "admin");
    if (!window.confirm(`'${target}' 계정에 등록된 이메일로 비밀번호 재설정 링크를 발송합니다.\n\n계속하시겠습니까?`)) return;
    setForgotLoading(true);
    setForgotMsg("");
    setErr("");
    try {
      await api.post("/admin-users/forgot-password", { username: target });
      setForgotMsg("등록된 이메일로 재설정 링크를 발송했습니다. 메일함을 확인하고 30분 이내에 링크를 클릭해주세요.");
    } catch (error) {
      setForgotMsg(error.message || "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setForgotLoading(false);
    }
  };

  const lockMin = Math.ceil(lockRemain / 60);
  const hasError = !!err;

  return (
    <div className="admin-login">
      {/* ── 좌측 히어로 패널 ── */}
      <div className="admin-login__left">
        <video
          key={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          src={heroVideo}
          className="admin-login__left-video"
        />
        <div className="admin-login__left-overlay" />

        {/* 상단: 버전 배지 + 시계 */}
        <div className="admin-login__top">
          <div className="admin-login__version">1.00</div>
          <div className="admin-login__clock">{hh}:{mm}</div>
          <div className="admin-login__date">{dateStr}</div>
        </div>

        {/* 하단: 브랜딩 */}
        <div className="admin-login__brand">
          <div className="admin-login__brand-name">HIGHLAW</div>
          <div className="admin-login__brand-addr">
            서울 서초구 서초대로 327<br />
            5층
          </div>
          <div className="admin-login__brand-links">
            <span className="admin-login__brand-link">ERP</span>
            <span className="admin-login__brand-sep" />
            <span className="admin-login__brand-link">CMS</span>
            <span className="admin-login__brand-sep" />
            <span className="admin-login__brand-link">ANALYTICS</span>
          </div>
        </div>
      </div>

      {/* ── 우측 인증 폼 패널 ── */}
      <div className="admin-login__right">
        <a href="/" className="admin-login__home-link">홈페이지</a>

        <div className="admin-login__form-wrap">
          <div className="admin-login__label">ADMINISTRATION</div>
          <h1 className="admin-login__heading">관리자 인증</h1>

          {/* 인증 폼 */}
          <form onSubmit={submit}>
            <label htmlFor="admin-username" className="admin-login__pw-label">USERNAME</label>
            <input
              id="admin-username"
              type="text"
              className={`admin-login__input ${hasError ? "admin-login__input--error" : ""}`}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErr(""); }}
              disabled={locked}
              autoFocus
              placeholder="admin"
              autoComplete="off"
            />
            <label htmlFor="admin-password" className="admin-login__pw-label" style={{ marginTop: 16 }}>PASSWORD</label>
            <input
              id="admin-password"
              type="password"
              className={`admin-login__input ${hasError ? "admin-login__input--error" : ""}`}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(""); }}
              disabled={locked}
              autoComplete="new-password"
            />

            {err && (
              <div className="admin-login__error">
                {locked
                  ? `로그인 시도가 너무 많습니다. ${lockMin}분 후 다시 시도해주세요.`
                  : err}
              </div>
            )}

            <button type="submit" className="admin-login__btn" disabled={locked || loading}>
              {loading ? "인증 중..." : "AUTHENTICATE"}
            </button>

            <button
              type="button"
              className="admin-login__forgot"
              onClick={requestPasswordReset}
              disabled={forgotLoading || locked}
            >
              {forgotLoading ? "발송 중..." : "비밀번호를 잊으셨나요?"}
            </button>

            {forgotMsg && (
              <div className="admin-login__forgot-msg">{forgotMsg}</div>
            )}
          </form>

          {/* 하단 푸터 */}
          <div className="admin-login__footer">
            <div className="admin-login__footer-line">HIGH & LAW FIRM</div>
            <div className="admin-login__footer-line">CONFIDENTIAL ACCESS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
