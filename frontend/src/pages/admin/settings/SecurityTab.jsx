/** 보안 탭 — 비밀번호 변경 + 현재 사용자 정보 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { formatDateTime } from "../../../utils/formatters";
import { FormField, COLORS, btnStyle, badgeStyle } from "../../../components/admin";
import { showToast } from "../../../utils/showToast";

const ROLE_LABELS = { admin: "관리자", editor: "편집자", viewer: "뷰어" };
const ROLE_COLORS = { admin: COLORS.danger, editor: "#3498db", viewer: COLORS.muted };

/** 현재 로그인 정보 표시 */
function CurrentUserInfo({ user }) {
  return (
    <div style={{ marginBottom: 28, padding: 20, background: COLORS.bgPage, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>현재 로그인 정보</h3>
      {user ? (
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 16px", fontSize: 13 }}>
          <span style={{ color: COLORS.textMuted }}>아이디</span>
          <span style={{ fontWeight: 500 }}>{user.username}</span>
          <span style={{ color: COLORS.textMuted }}>이름</span>
          <span>{user.name}</span>
          <span style={{ color: COLORS.textMuted }}>역할</span>
          <span>
            <span style={badgeStyle(ROLE_COLORS[user.role])}>{ROLE_LABELS[user.role]}</span>
          </span>
          <span style={{ color: COLORS.textMuted }}>이메일</span>
          <span>{user.email || "-"}</span>
          <span style={{ color: COLORS.textMuted }}>마지막 로그인</span>
          <span>{formatDateTime(user.lastLogin)}</span>
        </div>
      ) : (
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>로그인 정보를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}

/** 비밀번호 변경 폼 */
function PasswordChangeForm({ pwForm, setPwForm, msg, onSubmit }) {
  const setPwField = (key, value) => setPwForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ padding: 20, background: COLORS.bgPage, border: `1px solid ${COLORS.border}`, borderRadius: 8, maxWidth: 420 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>비밀번호 변경</h3>

      {msg && (
        <div style={{
          marginBottom: 14, padding: "8px 14px", borderRadius: 6, fontSize: 13,
          background: msg.type === "success" ? "#d4edda" : "#f8d7da",
          color: msg.type === "success" ? "#155724" : "#721c24",
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <FormField
          label="현재 비밀번호" type="password" value={pwForm.current}
          onChange={(v) => setPwField("current", v)}
          placeholder="현재 비밀번호 입력"
        />
        <FormField
          label="새 비밀번호" type="password" value={pwForm.newPw}
          onChange={(v) => setPwField("newPw", v)}
          placeholder="새 비밀번호 입력"
        />
        <FormField
          label="새 비밀번호 확인" type="password" value={pwForm.confirm}
          onChange={(v) => setPwField("confirm", v)}
          placeholder="새 비밀번호 다시 입력"
        />
      </div>
      <button onClick={onSubmit} style={btnStyle(COLORS.accent)}>비밀번호 변경</button>
    </div>
  );
}

export default function SecurityTab() {
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [msg, setMsg] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api.get("/admin-users/me")
      .then((json) => setCurrentUser(json.data ?? null))
      .catch(() => setCurrentUser(null));
  }, []);

  const changePassword = async () => {
    if (!pwForm.current) return showToast("현재 비밀번호를 입력해주세요");
    if (!pwForm.newPw) return showToast("새 비밀번호를 입력해주세요");
    if (pwForm.newPw.length < 4) return showToast("비밀번호는 4자 이상이어야 합니다");
    if (pwForm.newPw !== pwForm.confirm) return showToast("새 비밀번호가 일치하지 않습니다");

    try {
      await api.post("/admin-users/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setMsg({ type: "success", text: "비밀번호가 변경되었습니다." });
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      setMsg({ type: "error", text: "변경 실패: " + err.message });
    }
  };

  return (
    <div>
      <CurrentUserInfo user={currentUser} />
      <PasswordChangeForm
        pwForm={pwForm}
        setPwForm={setPwForm}
        msg={msg}
        onSubmit={changePassword}
      />
    </div>
  );
}
