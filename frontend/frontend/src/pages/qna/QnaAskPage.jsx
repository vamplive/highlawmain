/**
 * 법률 Q&A 질문 제출 페이지 — 3단계 카테고리 선택 + 익명 3티어 + PII 경고
 * 제출 시 상태 pending으로 생성, 관리자 승인 후 공개.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { findNodeBySlug } from "./qnaUtils";
import useKakaoAuth from "../../hooks/useKakaoAuth";

const ANONYMITY_OPTIONS = [
  { value: 2, label: "완전 익명", desc: "자동 닉네임으로 표시 (예: 답답한 시공자)" },
  { value: 1, label: "닉네임", desc: "직접 입력한 닉네임으로 표시" },
  { value: 0, label: "실명 공개", desc: "입력한 이름으로 표시" },
];

export default function QnaAskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCategorySlug = location.state?.categorySlug;

  const [tree, setTree] = useState([]);
  const [topId, setTopId] = useState("");
  const [midId, setMidId] = useState("");
  const [subId, setSubId] = useState(""); // 실제 제출되는 categoryId (소분류)
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymityTier, setAnonymityTier] = useState(2);
  const [nickname, setNickname] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterContact, setSubmitterContact] = useState("");
  const [submitterRegion, setSubmitterRegion] = useState("");
  const kakao = useKakaoAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => { document.title = "질문 남기기 | 법무법인 하이로 법률 Q&A"; }, []);

  useEffect(() => {
    api.get("/qna/categories")
      .then((res) => {
        const t = res.data || [];
        setTree(t);
        // 초기 카테고리 프리셋 — 허브에서 넘어온 경우 해당 카테고리 자동 선택
        if (initialCategorySlug) {
          const found = findNodeBySlug(t, initialCategorySlug);
          if (found.node) {
            const [top, mid, sub] = found.path;
            if (top) setTopId(top.id);
            if (mid) setMidId(mid.id);
            if (sub) setSubId(sub.id);
          }
        }
      })
      .catch(() => setTree([]));
  }, [initialCategorySlug]);

  const topCategories = tree;
  const midCategories = useMemo(() => {
    const top = tree.find((t) => t.id === topId);
    return top?.children || [];
  }, [tree, topId]);
  const subCategories = useMemo(() => {
    const mid = midCategories.find((m) => m.id === midId);
    return mid?.children || [];
  }, [midCategories, midId]);

  function handleTopChange(id) {
    setTopId(id);
    setMidId("");
    setSubId("");
  }
  function handleMidChange(id) {
    setMidId(id);
    setSubId("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!subId) { setError("세부 카테고리까지 선택해 주세요"); return; }
    if (!title.trim()) { setError("제목을 입력해 주세요"); return; }
    if (!body.trim()) { setError("내용을 입력해 주세요"); return; }
    if (title.length > 120) { setError("제목은 120자 이하로 입력해 주세요"); return; }
    if (body.length > 5000) { setError("내용은 5000자 이하로 입력해 주세요"); return; }
    if (anonymityTier === 1 && !nickname.trim()) { setError("닉네임을 입력해 주세요"); return; }
    if (anonymityTier === 0 && !submitterName.trim()) { setError("이름을 입력해 주세요"); return; }
    if (isPrivate && !password && !kakao.user) { setError("비밀글은 비밀번호를 설정하거나 카카오 로그인이 필요합니다"); return; }
    if (isPrivate && password && (password.length < 4 || password.length > 20)) { setError("비밀번호는 4~20자로 입력해 주세요"); return; }
    if (!agreed) { setError("개인정보 처리 및 공개 동의가 필요합니다"); return; }

    setSubmitting(true);
    try {
      const res = await api.post("/qna/questions", {
        categoryId: subId,
        title: title.trim(),
        body: body.trim(),
        anonymityTier,
        nickname: anonymityTier === 1 ? nickname.trim() : undefined,
        submitterName: anonymityTier === 0 ? submitterName.trim() : (submitterName.trim() || undefined),
        submitterContact: submitterContact.trim() || undefined,
        submitterRegion: submitterRegion.trim() || undefined,
        isPrivate: isPrivate ? 1 : 0,
        password: isPrivate ? password : undefined,
      });
      setSuccess(res.data?.message || "질문이 접수되었습니다. 검토 후 공개됩니다.");
    } catch (e) {
      setError(e.message || "제출 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", minHeight: "60vh" }}>
        <h1 className="font-serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 16 }}>질문이 접수되었습니다</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.9, marginBottom: 32 }}>
          {success}<br />
          관리자 검토 후 공개되며, 공개 시점에 답변도 함께 등록됩니다.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link to="/qna" className="font-en" style={{
            padding: "12px 28px", fontSize: 12, letterSpacing: "0.15em",
            border: "1px solid var(--accent-gold)", background: "var(--accent-gold)", color: "#fff",
            textDecoration: "none",
          }}>
            Q&A 목록으로
          </Link>
          <Link to="/consultation" className="font-en" style={{
            padding: "12px 28px", fontSize: 12, letterSpacing: "0.15em",
            border: "1px solid var(--text-muted)", color: "var(--text-primary)",
            textDecoration: "none",
          }}>
            상담 예약하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <section style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 100%)",
        padding: "72px 24px 56px", textAlign: "center",
      }}>
        <h1 className="font-serif" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 12 }}>
          질문 남기기
        </h1>
        <p style={{ fontSize: 13, color: "var(--white-60)", lineHeight: 1.8 }}>
          건설·부동산 관련 질문을 남겨주세요. 변호사가 직접 검토 후 답변드립니다.
        </p>
      </section>

      {/* 폼 */}
      <section className="section" style={{ background: "#fff", paddingTop: 48, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          {/* PII 경고 */}
          <div style={{
            background: "#fff8e1", border: "1px solid #e6c97a",
            padding: "14px 18px", borderRadius: 4, fontSize: 12, lineHeight: 1.8,
            color: "#6a5520", marginBottom: 28,
          }}>
            <strong>개인정보 안내</strong><br />
            주민등록번호, 계좌번호, 실명 제3자 정보는 입력하지 마세요.
            휴대폰번호·사업자번호는 자동으로 일부 마스킹되어 저장됩니다.
          </div>

          {/* 카카오 로그인 상태 — 설정된 경우에만 표시 */}
          {kakao.enabled && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", marginBottom: 20,
              border: "1px solid #fae100", borderRadius: 4,
              background: kakao.user ? "#fffde7" : "#fff",
              fontSize: 13,
            }}>
              {kakao.user ? (
                <>
                  <span><strong>{kakao.user.nickname}</strong>님으로 로그인됨 — 비밀글을 비밀번호 없이 관리할 수 있습니다</span>
                  <button type="button" onClick={kakao.logout} style={{
                    fontSize: 12, color: "var(--text-muted)", background: "none",
                    border: "none", cursor: "pointer", textDecoration: "underline",
                  }}>로그아웃</button>
                </>
              ) : (
                <>
                  <span style={{ color: "var(--text-muted)" }}>카카오 로그인하면 비밀글을 비밀번호 없이 관리할 수 있습니다</span>
                  <button type="button" onClick={kakao.login} style={{
                    padding: "6px 14px", fontSize: 12, fontWeight: 500,
                    background: "#fae100", color: "#3c1e1e", border: "none",
                    borderRadius: 3, cursor: "pointer",
                  }}>카카오 로그인</button>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 카테고리 — 3단계 */}
            <FieldGroup label="카테고리" required>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 8 }}>
                <Select value={topId} onChange={(e) => handleTopChange(e.target.value)}>
                  <option value="">대분류</option>
                  {topCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select value={midId} onChange={(e) => handleMidChange(e.target.value)} disabled={!topId}>
                  <option value="">중분류</option>
                  {midCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select value={subId} onChange={(e) => setSubId(e.target.value)} disabled={!midId}>
                  <option value="">세부분류</option>
                  {subCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
            </FieldGroup>

            {/* 제목 */}
            <FieldGroup label="제목" required>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="예: 공사대금을 못 받고 있습니다. 유치권을 행사할 수 있을까요?"
              />
              <HelpText>{title.length} / 120</HelpText>
            </FieldGroup>

            {/* 내용 */}
            <FieldGroup label="내용" required>
              <Textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                placeholder={"구체적 사실관계를 적어주실수록 정확한 답변이 가능합니다.\n- 계약 체결 시기, 계약서 유무\n- 금액 / 시공 범위 / 하자 내용\n- 상대방과의 대응 경위"}
              />
              <HelpText>{body.length} / 5000</HelpText>
            </FieldGroup>

            {/* 공개 방식 */}
            <FieldGroup label="공개 방식" required>
              <div style={{ display: "grid", gap: 8 }}>
                {ANONYMITY_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: 12, border: "1px solid var(--border-color)", borderRadius: 4,
                    cursor: "pointer",
                    background: anonymityTier === opt.value ? "#f7f8fa" : "#fff",
                    borderColor: anonymityTier === opt.value ? "var(--accent-gold)" : "var(--border-color)",
                  }}>
                    <input
                      type="radio"
                      name="anonymity"
                      value={opt.value}
                      checked={anonymityTier === opt.value}
                      onChange={() => setAnonymityTier(opt.value)}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </FieldGroup>

            {/* 티어별 추가 입력 */}
            {anonymityTier === 1 && (
              <FieldGroup label="닉네임" required>
                <Input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder="예: 강동구공사자" />
              </FieldGroup>
            )}
            {anonymityTier === 0 && (
              <FieldGroup label="이름" required>
                <Input type="text" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} maxLength={30} placeholder="실명" />
              </FieldGroup>
            )}

            {/* 연락처(선택) — 답변 알림용 */}
            <FieldGroup label="연락처 (선택)" hint="답변 등록 시 알림을 받고 싶으시면 입력해 주세요. 공개되지 않습니다.">
              <Input type="text" value={submitterContact} onChange={(e) => setSubmitterContact(e.target.value)} maxLength={100} placeholder="이메일 또는 휴대폰" />
            </FieldGroup>

            {/* 지역(선택) */}
            <FieldGroup label="지역 (선택)" hint="분쟁지 관할 법원 확인용. 공개되지 않습니다.">
              <Input type="text" value={submitterRegion} onChange={(e) => setSubmitterRegion(e.target.value)} maxLength={60} placeholder="예: 서울 강남구, 인천 부평구" />
            </FieldGroup>

            {/* 비밀글 */}
            <div style={{
              marginTop: 24, marginBottom: 8, padding: "16px 18px",
              border: "1px solid var(--border-color)", borderRadius: 4,
              background: isPrivate ? "#f0f4ff" : "#fff",
              borderColor: isPrivate ? "#7ba4d9" : "var(--border-color)",
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => { setIsPrivate(e.target.checked); if (!e.target.checked) setPassword(""); }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>비밀글로 등록</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>나와 관리자만 볼 수 있습니다. {kakao.user ? "카카오 로그인 상태라 비밀번호는 선택입니다." : "비밀번호를 설정해야 합니다."}</div>
                </div>
              </label>
              {isPrivate && (
                <div style={{ marginTop: 12 }}>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={20}
                    placeholder="비밀번호 (4~20자)"
                    autoComplete="new-password"
                  />
                  <HelpText>이 비밀번호로 나중에 비밀글을 열람할 수 있습니다.</HelpText>
                </div>
              )}
            </div>

            {/* 동의 */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 24, fontSize: 13, lineHeight: 1.8, color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4 }} />
              <span>
                질문 내용이 마케팅 목적으로 블로그/홈페이지에 공개될 수 있음에 동의합니다.
                연락처·지역 등 비공개 필드는 답변 안내 및 상담 연결 용도로만 사용됩니다.
              </span>
            </label>

            {error && (
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#fdecea", border: "1px solid #e6a6a0", color: "#8e3b31", fontSize: 13, borderRadius: 4 }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" onClick={() => navigate(-1)} style={{
                padding: "12px 24px", fontSize: 13, border: "1px solid var(--border-color)",
                background: "#fff", color: "var(--text-secondary)", cursor: "pointer",
              }}>
                취소
              </button>
              <button type="submit" disabled={submitting} style={{
                padding: "12px 32px", fontSize: 13, border: "none",
                background: submitting ? "var(--text-muted)" : "var(--accent-gold)",
                color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 500,
              }}>
                {submitting ? "제출 중..." : "질문 제출"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function FieldGroup({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
        {label}
        {required && <span style={{ color: "#c0392b", marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && <HelpText>{hint}</HelpText>}
    </div>
  );
}

function HelpText({ children }) {
  return <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{children}</div>;
}

const fieldStyle = {
  width: "100%", padding: "10px 12px", fontSize: 14,
  border: "1px solid var(--border-color)", borderRadius: 3,
  background: "#fff", color: "var(--text-primary)",
  fontFamily: "inherit", lineHeight: 1.6,
};

function Input(props) {
  return <input {...props} style={fieldStyle} />;
}
function Textarea(props) {
  return <textarea {...props} style={{ ...fieldStyle, resize: "vertical" }} />;
}
function Select({ children, ...props }) {
  return <select {...props} style={fieldStyle}>{children}</select>;
}
