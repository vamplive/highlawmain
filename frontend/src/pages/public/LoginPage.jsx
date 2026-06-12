/**
 * /login — 포털 로그인/회원가입 통합 페이지 (스플릿 스크린 레이아웃)
 * - 좌측: 영상 배경 + 법인 브랜딩
 * - 우측: 로그인 탭 / 회원가입 탭
 * - 로그인 성공 → /portal/calendar
 * - 회원가입 성공 → 승인 대기 안내 화면
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { isSafeHttpUrl } from "../../utils/safeUrl";
import "./LoginPage.css";

const KOREAN_PHONE_RE = /^(01[016789]{1}|02|0[3-9]{1}[0-9]{1})\d{3,4}\d{4}$/;

function cleanPhone(p) { return p.replace(/[\s-]/g, ""); }

// ──────────────────────────────────────────────────
// 아이디 찾기 모달
// ──────────────────────────────────────────────────
function FindIdModal({ onClose }) {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null); // { maskedEmail } | "notfound"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const cleaned = cleanPhone(phone);
    if (!KOREAN_PHONE_RE.test(cleaned)) {
      return setError("올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)");
    }
    setLoading(true);
    setError("");
    try {
      const res = await portalApi.post("/find-id", { phone: cleaned });
      setResult(res.data || "notfound");
    } catch (err) {
      setError(err.message || "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-modal__backdrop" onClick={onClose}>
      <div className="portal-modal__box" onClick={(e) => e.stopPropagation()}>
        <button className="portal-modal__close" onClick={onClose}>✕</button>
        <h2 className="portal-modal__title">아이디 찾기</h2>
        <p className="portal-modal__desc">가입 시 등록한 휴대폰 번호를 입력해주세요.</p>

        {!result ? (
          <form onSubmit={submit}>
            <div className="portal-login__field">
              <label className="portal-login__field-label">휴대폰 번호</label>
              <input
                type="tel"
                className={`portal-login__input${error ? " portal-login__input--error" : ""}`}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                placeholder="010-0000-0000"
                autoFocus
              />
            </div>
            {error && <div className="portal-login__error portal-login__error--danger">{error}</div>}
            <button type="submit" className="portal-login__btn" disabled={loading}>
              {loading ? "조회 중..." : "아이디 찾기"}
            </button>
          </form>
        ) : result === "notfound" || !result.maskedEmail ? (
          <div className="portal-modal__result portal-modal__result--warn">
            입력하신 번호로 가입된 계정을 찾을 수 없습니다.<br />
            번호를 확인하거나 새로 회원가입 해주세요.
          </div>
        ) : (
          <div className="portal-modal__result portal-modal__result--ok">
            가입된 이메일(아이디):&nbsp;
            <strong>{result.maskedEmail}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 비밀번호 찾기 모달
// ──────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [input, setInput] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return setError("이메일 또는 휴대폰 번호를 입력해주세요");
    setLoading(true);
    setError("");
    try {
      await portalApi.post("/forgot-password", { input: input.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message || "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-modal__backdrop" onClick={onClose}>
      <div className="portal-modal__box" onClick={(e) => e.stopPropagation()}>
        <button className="portal-modal__close" onClick={onClose}>✕</button>
        <h2 className="portal-modal__title">비밀번호 찾기</h2>

        {!sent ? (
          <>
            <p className="portal-modal__desc">
              가입 시 등록한 이메일 또는 휴대폰 번호를 입력하시면<br />
              비밀번호 재설정 링크를 이메일로 발송해 드립니다.
            </p>
            <form onSubmit={submit}>
              <div className="portal-login__field">
                <label className="portal-login__field-label">이메일 또는 휴대폰 번호</label>
                <input
                  type="text"
                  className={`portal-login__input${error ? " portal-login__input--error" : ""}`}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  placeholder="이메일 또는 010-0000-0000"
                  autoFocus
                />
              </div>
              {error && <div className="portal-login__error portal-login__error--danger">{error}</div>}
              <button type="submit" className="portal-login__btn" disabled={loading}>
                {loading ? "발송 중..." : "재설정 링크 발송"}
              </button>
            </form>
          </>
        ) : (
          <div className="portal-modal__result portal-modal__result--ok">
            입력하신 이메일 주소로 비밀번호 재설정 링크를 발송했습니다.<br />
            <span style={{ color: "#888", fontSize: "13px", marginTop: "8px", display: "block" }}>
              메일이 도착하지 않으면 스팸함을 확인해주세요. 링크는 30분간 유효합니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 로그인 폼
// ──────────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // "findId" | "forgotPassword" | null

  const f = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError("이메일과 비밀번호를 입력해주세요");
    setLoading(true);
    setError("");
    try {
      await portalApi.post("/login", form);
      onSuccess();
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const isPending = error.includes("승인 대기");

  return (
    <form onSubmit={submit} className="portal-login__form-inner">
      <div className="portal-login__field">
        <label className="portal-login__field-label">이메일</label>
        <input
          type="email"
          className={`portal-login__input${error && !isPending ? " portal-login__input--error" : ""}`}
          value={form.email}
          onChange={f("email")}
          placeholder="example@email.com"
          autoComplete="email"
          autoFocus
        />
      </div>

      <div className="portal-login__field">
        <label className="portal-login__field-label">비밀번호</label>
        <input
          type="password"
          className={`portal-login__input${error && !isPending ? " portal-login__input--error" : ""}`}
          value={form.password}
          onChange={f("password")}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className={`portal-login__error ${isPending ? "portal-login__error--warn" : "portal-login__error--danger"}`}>
          {error}
        </div>
      )}

      <div className="portal-login__forgot-link-container" style={{ display: "flex", justifyContent: "space-between", marginTop: "-12px", marginBottom: "20px" }}>
        <button
          type="button"
          className="portal-login__forgot-btn"
          style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => setModal("findId")}
        >
          아이디 찾기
        </button>
        <button
          type="button"
          className="portal-login__forgot-btn"
          style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={() => setModal("forgotPassword")}
        >
          비밀번호 찾기
        </button>
      </div>

      <button type="submit" className="portal-login__btn" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {modal === "findId" && <FindIdModal onClose={() => setModal(null)} />}
      {modal === "forgotPassword" && <ForgotPasswordModal onClose={() => setModal(null)} />}
    </form>
  );
}

// ──────────────────────────────────────────────────
// 회원가입 폼
// ──────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ email: "", name: "", phone: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const f = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(""); };

  const validate = () => {
    if (!form.email.trim()) return "이메일을 입력해주세요";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "올바른 이메일 형식이 아닙니다";
    if (!form.name.trim()) return "이름을 입력해주세요";
    if (!form.phone.trim()) return "연락처를 입력해주세요";
    if (!KOREAN_PHONE_RE.test(cleanPhone(form.phone))) return "올바른 연락처를 입력해주세요 (예: 010-1234-5678)";
    if (form.password.length < 8) return "비밀번호는 8자 이상이어야 합니다";
    if (form.password !== form.passwordConfirm) return "비밀번호가 일치하지 않습니다";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setError("");
    try {
      await portalApi.post("/register", {
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      onSuccess(form.name.trim());
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="portal-login__form-inner">
      <div className="portal-login__field">
        <label className="portal-login__field-label">이메일</label>
        <input
          type="email"
          className="portal-login__input"
          value={form.email}
          onChange={f("email")}
          placeholder="example@email.com"
          autoComplete="email"
          autoFocus
        />
      </div>

      <div className="portal-login__field-row">
        <div className="portal-login__field" style={{ marginBottom: 0 }}>
          <label className="portal-login__field-label">이름</label>
          <input
            className="portal-login__input"
            value={form.name}
            onChange={f("name")}
            placeholder="홍길동"
            autoComplete="name"
          />
        </div>
        <div className="portal-login__field" style={{ marginBottom: 0 }}>
          <label className="portal-login__field-label">연락처</label>
          <input
            type="tel"
            className="portal-login__input"
            value={form.phone}
            onChange={f("phone")}
            placeholder="010-0000-0000"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="portal-login__field">
        <label className="portal-login__field-label">비밀번호 (8자 이상)</label>
        <input
          type="password"
          className="portal-login__input"
          value={form.password}
          onChange={f("password")}
          placeholder="비밀번호"
          autoComplete="new-password"
        />
      </div>

      <div className="portal-login__field">
        <label className="portal-login__field-label">비밀번호 확인</label>
        <input
          type="password"
          className="portal-login__input"
          value={form.passwordConfirm}
          onChange={f("passwordConfirm")}
          placeholder="비밀번호 확인"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="portal-login__error portal-login__error--danger">{error}</div>
      )}

      <button type="submit" className="portal-login__btn" disabled={loading}>
        {loading ? "가입 신청 중..." : "회원가입 신청"}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────────
// 회원가입 완료 화면
// ──────────────────────────────────────────────────
function RegisterSuccess({ name, onLoginClick }) {
  return (
    <div className="portal-login__success">
      <div className="portal-login__success-icon">✓</div>
      <div className="portal-login__success-title">가입 신청이 완료되었습니다</div>
      <div className="portal-login__success-desc">
        {name ? `${name}님의 ` : ""}회원가입 신청을 받았습니다.<br />
        관리자가 계정을 승인하면 로그인하실 수 있습니다.
      </div>
      <div className="portal-login__success-note">
        📬 승인은 보통 영업일 기준 1~2일 내에 처리됩니다.<br />
        승인 후 등록하신 이메일로 안내 드립니다.
      </div>
      <button className="portal-login__success-btn" onClick={onLoginClick}>
        로그인 화면으로
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [registered, setRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [heroVideo, setHeroVideo] = useState(() => {
    const cached = localStorage.getItem("activeHeroVideo");
    return cached && isSafeHttpUrl(cached) ? cached : "/videos/manhattan-panoramic.mp4";
  });

  // 활성 히어로 영상 로드 (관리자 설정 반영)
  useEffect(() => {
    fetch("/api/hero-videos/active")
      .then((r) => r.json())
      .then((json) => {
        const url = json.data?.url;
        if (url && isSafeHttpUrl(url)) {
          setHeroVideo(url);
          localStorage.setItem("activeHeroVideo", url);
        }
      })
      .catch(() => {});
  }, []);

  // 이미 로그인되어 있으면 대시보드로 이동
  useEffect(() => {
    portalApi.get("/me")
      .then(() => navigate("/portal/dashboard", { replace: true }))
      .catch(() => {/* 미인증 — 로그인 페이지 유지 */});
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate("/portal/dashboard", { replace: true });
  };

  const handleRegisterSuccess = (name) => {
    setRegisteredName(name);
    setRegistered(true);
  };

  const handleTabChange = (t) => {
    setTab(t);
    setRegistered(false);
  };

  return (
    <div className="portal-login">

      {/* ── 좌측 히어로 패널 ── */}
      <div className="portal-login__left">
        <video
          key={heroVideo}
          autoPlay muted loop playsInline
          src={heroVideo}
          className="portal-login__left-video"
        />
        <div className="portal-login__left-overlay" />

        {/* 상단 배지 */}
        <div className="portal-login__top">
          <div className="portal-login__badge">
            <span className="portal-login__badge-dot" />
            CLIENT PORTAL
          </div>
        </div>

        {/* 중단 인용구 */}
        <div className="portal-login__hero-text">
          <div className="portal-login__hero-quote">
            의뢰인과 변호사<br />
            사이의 <em>신뢰</em>를<br />
            기술로 잇습니다.
          </div>
          <div className="portal-login__hero-sub">
            사건 현황 실시간 확인 · 문서 공유<br />
            법정 일정 알림 · 직접 소통
          </div>
        </div>

        {/* 하단 브랜딩 */}
        <div className="portal-login__brand">
          <div className="portal-login__brand-divider" />
          <div className="portal-login__brand-name">HIGHLAW</div>
          <div className="portal-login__brand-sub">HIGH & LAW FIRM</div>
          <div className="portal-login__brand-addr">
            서울 서초구 서초대로 327, 5층
          </div>
        </div>
      </div>

      {/* ── 우측 폼 패널 ── */}
      <div className="portal-login__right">
        <a href="/" className="portal-login__home-link">← 홈페이지</a>

        <div className="portal-login__form-wrap">
          {/* 상단 레이블 */}
          <div className="portal-login__label">HIGHLAW PORTAL</div>
          <h1 className="portal-login__heading">
            {registered ? "신청 완료" : tab === "login" ? "로그인" : "회원가입"}
          </h1>
          {!registered && (
            <p className="portal-login__subheading">
              {tab === "login"
                ? "포털 계정으로 사건 현황을 확인하세요"
                : "가입 신청 후 관리자 승인이 필요합니다"}
            </p>
          )}

          {/* 탭 — 완료 화면에서는 숨김 */}
          {!registered && (
            <div className="portal-login__tabs">
              <button
                type="button"
                className={`portal-login__tab ${tab === "login" ? "portal-login__tab--active" : "portal-login__tab--inactive"}`}
                onClick={() => handleTabChange("login")}
              >
                로그인
              </button>
              <button
                type="button"
                className={`portal-login__tab ${tab === "register" ? "portal-login__tab--active" : "portal-login__tab--inactive"}`}
                onClick={() => handleTabChange("register")}
              >
                회원가입
              </button>
            </div>
          )}

          {/* 콘텐츠 */}
          {registered ? (
            <RegisterSuccess
              name={registeredName}
              onLoginClick={() => handleTabChange("login")}
            />
          ) : tab === "login" ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}

          {/* 하단 푸터 */}
          {!registered && (
            <div className="portal-login__footer">
              <span className="portal-login__footer-text">HIGH & LAW FIRM</span>
              <Link to="/privacy" className="portal-login__footer-link">개인정보처리방침</Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
