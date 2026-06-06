/**
 * /login — 포털 로그인/회원가입 통합 페이지 (스플릿 스크린 레이아웃)
 * - 좌측: 영상 배경 + 법인 브랜딩
 * - 우측: 로그인 탭 / 회원가입 탭
 * - 로그인 성공 → /portal/dashboard
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
// 로그인 폼
// ──────────────────────────────────────────────────
function LoginForm({ onSuccess, onForgotClick }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const f = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError("이메일/휴대폰 번호와 비밀번호를 입력해주세요");
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
    <form onSubmit={submit} className="portal-login__form-inner" autoComplete="off">
      {/* 브라우저(크롬 등) 자동완성 방지용 더미 필드 */}
      <input type="text" name="email" style={{ display: "none" }} tabIndex={-1} />
      <input type="password" name="password" style={{ display: "none" }} tabIndex={-1} />

      <div className="portal-login__field">
        <label className="portal-login__field-label">이메일 또는 휴대폰 번호</label>
        <input
          type="text"
          className={`portal-login__input${error && !isPending ? " portal-login__input--error" : ""}`}
          value={form.email}
          onChange={f("email")}
          placeholder="이메일 또는 휴대폰 번호 입력"
          autoComplete="off"
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
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className={`portal-login__error ${isPending ? "portal-login__error--warn" : "portal-login__error--danger"}`}>
          {error}
        </div>
      )}

      <div className="portal-login__forgot-link-container" style={{ display: "flex", justifyContent: "flex-end", marginTop: "-12px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={onForgotClick}
          className="portal-login__forgot-btn"
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>

      <button type="submit" className="portal-login__btn" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────────
// 회원가입 폼
// ──────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ email: "", name: "", phone: "", password: "", passwordConfirm: "", hireDate: "" });
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
        hireDate: form.hireDate || null,
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
        <label className="portal-login__field-label">입사일 (직원의 경우만 기재)</label>
        <input
          type="date"
          className="portal-login__input"
          value={form.hireDate}
          onChange={f("hireDate")}
        />
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
// 비밀번호 재설정 폼 (Forgot / Reset Password)
// ──────────────────────────────────────────────────
function ForgotPasswordForm({ onBackClick }) {
  const [step, setStep] = useState(1); // 1: 입력 및 OTP 요청, 2: OTP 검증 및 새 비밀번호 입력, 3: 완료
  const [form, setForm] = useState({ email: "", phone: "", code: "", newPassword: "", newPasswordConfirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [devCode, setDevCode] = useState("");

  const f = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(""); };

  const requestOtp = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return setError("이메일을 입력해주세요");
    if (!form.phone.trim()) return setError("휴대폰 번호를 입력해주세요");
    setLoading(true);
    setError("");
    try {
      const res = await portalApi.post("/forgot-password", {
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setVerificationId(res.data.verificationId);
      setSentTo(res.data.sentTo);
      if (res.data.devCode) {
        setDevCode(res.data.devCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || "인증번호 발송에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return setError("인증번호를 입력해주세요");
    if (form.newPassword.length < 8) return setError("비밀번호는 8자 이상이어야 합니다");
    if (form.newPassword !== form.newPasswordConfirm) return setError("비밀번호가 일치하지 않습니다");
    setLoading(true);
    setError("");
    try {
      await portalApi.post("/reset-password", {
        verificationId,
        code: form.code.trim(),
        newPassword: form.newPassword,
      });
      setStep(3);
    } catch (err) {
      setError(err.message || "비밀번호 재설정에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={requestOtp} className="portal-login__form-inner">
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

        <div className="portal-login__field">
          <label className="portal-login__field-label">등록된 휴대폰 번호</label>
          <input
            type="tel"
            className="portal-login__input"
            value={form.phone}
            onChange={f("phone")}
            placeholder="010-0000-0000"
            autoComplete="tel"
          />
        </div>

        {error && (
          <div className="portal-login__error portal-login__error--danger">{error}</div>
        )}

        <button type="submit" className="portal-login__btn" disabled={loading}>
          {loading ? "인증 요청 중..." : "인증번호 받기"}
        </button>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            type="button"
            className="portal-login__success-btn"
            onClick={onBackClick}
            style={{ fontSize: "11px", padding: "8px 16px" }}
          >
            로그인 화면으로
          </button>
        </div>
      </form>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={resetPassword} className="portal-login__form-inner">
        <p style={{ fontSize: "13px", color: "#4a5568", marginBottom: "20px", lineHeight: 1.5 }}>
          등록하신 휴대폰 번호(<strong>{sentTo}</strong>)로 인증번호 6자리가 발송되었습니다.
        </p>

        {devCode && (
          <div className="portal-login__error portal-login__error--warn" style={{ marginBottom: "16px" }}>
            [개발 모드] 인증번호: <strong>{devCode}</strong>
          </div>
        )}

        <div className="portal-login__field">
          <label className="portal-login__field-label">인증번호 (6자리)</label>
          <input
            type="text"
            className="portal-login__input"
            value={form.code}
            onChange={f("code")}
            placeholder="000000"
            maxLength={6}
            autoFocus
          />
        </div>

        <div className="portal-login__field">
          <label className="portal-login__field-label">새 비밀번호 (8자 이상)</label>
          <input
            type="password"
            className="portal-login__input"
            value={form.newPassword}
            onChange={f("newPassword")}
            placeholder="새 비밀번호 입력"
            autoComplete="new-password"
          />
        </div>

        <div className="portal-login__field">
          <label className="portal-login__field-label">새 비밀번호 확인</label>
          <input
            type="password"
            className="portal-login__input"
            value={form.newPasswordConfirm}
            onChange={f("newPasswordConfirm")}
            placeholder="새 비밀번호 다시 입력"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="portal-login__error portal-login__error--danger">{error}</div>
        )}

        <button type="submit" className="portal-login__btn" disabled={loading}>
          {loading ? "비밀번호 변경 중..." : "비밀번호 변경 완료"}
        </button>

        <div style={{ marginTop: "24px", textAlign: "center", display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            type="button"
            className="portal-login__success-btn"
            onClick={() => setStep(1)}
            style={{ fontSize: "11px", padding: "8px 16px", color: "#8a97a8", borderColor: "#e8eaef" }}
          >
            이전 단계로
          </button>
        </div>
      </form>
    );
  }

  // step === 3 (완료)
  return (
    <div className="portal-login__success">
      <div className="portal-login__success-icon">✓</div>
      <div className="portal-login__success-title">비밀번호가 변경되었습니다</div>
      <div className="portal-login__success-desc">
        새로운 비밀번호로 다시 로그인해 주세요.
      </div>
      <button className="portal-login__success-btn" onClick={onBackClick}>
        로그인 하러가기
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

  // 이미 로그인되어 있으면 캘린더 일정(홈)으로 이동
  useEffect(() => {
    portalApi.get("/me")
      .then(() => navigate("/portal/calendar", { replace: true }))
      .catch(() => {/* 미인증 — 로그인 페이지 유지 */});
  }, [navigate]);

  const handleLoginSuccess = () => {
    navigate("/portal/calendar", { replace: true });
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
            {registered ? "신청 완료" : tab === "login" ? "로그인" : tab === "register" ? "회원가입" : "비밀번호 재설정"}
          </h1>
          {!registered && (
            <p className="portal-login__subheading">
              {tab === "login"
                ? "포털 계정으로 사건 현황을 확인하세요"
                : tab === "register"
                ? "가입 신청 후 관리자 승인이 필요합니다"
                : "등록하신 이메일과 휴대폰 번호로 인증을 진행합니다"}
            </p>
          )}

          {/* 탭 — 완료 화면 및 비밀번호 재설정 화면에서는 숨김 */}
          {!registered && tab !== "forgot" && (
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
            <LoginForm
              onSuccess={handleLoginSuccess}
              onForgotClick={() => handleTabChange("forgot")}
            />
          ) : tab === "register" ? (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          ) : (
            <ForgotPasswordForm onBackClick={() => handleTabChange("login")} />
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
