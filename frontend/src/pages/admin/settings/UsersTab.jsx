/** 사용자 관리 탭 — useCrudForm 기반 CRUD */
import useCrudForm from "../../../hooks/useCrudForm";
import {
  EditPanel, FormField, EmptyState,
  COLORS, btnStyle, outlineBtnStyle, badgeStyle, thStyle, tdStyle,
} from "../../../components/admin";
import { formatDateTime } from "../../../utils/formatters";

// 백엔드 VALID_ROLES와 동기. editor는 manager의 레거시 별칭(권한 동일).
// 신규 생성 시 viewer는 사용하지 않으므로 제거 — 대신 staff(일상 운영)로 대체.
const ROLES = ["admin", "manager", "staff", "editor"];
const ROLE_LABELS = {
  admin:   "최고관리자",
  manager: "매니저",
  staff:   "운영자",
  editor:  "편집자(레거시)",
};
const ROLE_COLORS = {
  admin:   COLORS.danger,
  manager: "#3498db",
  staff:   "#16a085",
  editor:  COLORS.muted,
};
const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

const EMPTY_USER = {
  username: "", name: "", password: "", role: "staff", email: "", isActive: 1,
};

/** 사용자 편집 폼 */
function UserEditForm({ crud, onSave }) {
  const { form, setField, isNew, cancelEdit } = crud;

  return (
    <EditPanel isNew={isNew} entityName="사용자" onSave={onSave} onCancel={cancelEdit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField
          label="아이디" required value={form.username}
          onChange={(v) => setField("username", v)}
          placeholder="admin01" disabled={!isNew}
        />
        <FormField
          label="이름" required value={form.name}
          onChange={(v) => setField("name", v)}
          placeholder="홍길동"
        />
        <FormField
          label={isNew ? "비밀번호" : "비밀번호 (변경 시 입력)"}
          required={isNew} type="password" value={form.password}
          onChange={(v) => setField("password", v)}
          placeholder={isNew ? "비밀번호 입력" : "변경하지 않으려면 비워두세요"}
        />
        <FormField
          label="역할" required type="select" value={form.role}
          onChange={(v) => setField("role", v)}
          options={ROLE_OPTIONS}
        />
        <FormField
          label="이메일" type="email" value={form.email}
          onChange={(v) => setField("email", v)}
          placeholder="user@example.com"
        />
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox" checked={form.isActive === 1}
              onChange={(e) => setField("isActive", e.target.checked ? 1 : 0)}
            />
            활성 상태
          </label>
        </div>
      </div>
    </EditPanel>
  );
}

/** 사용자 테이블 */
function UserTable({ users, onEdit, onRemove }) {
  const headers = ["아이디", "이름", "역할", "이메일", "마지막 로그인", "상태", ""];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
            {headers.map((h) => (
              <th key={h} style={{ ...thStyle, fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}`, opacity: u.isActive ? 1 : 0.5 }}>
              <td style={{ ...tdStyle, fontWeight: 500 }}>{u.username}</td>
              <td style={tdStyle}>{u.name}</td>
              <td style={tdStyle}>
                <span style={badgeStyle(ROLE_COLORS[u.role] || COLORS.muted)}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </td>
              <td style={{ ...tdStyle, color: COLORS.textMuted }}>{u.email || "-"}</td>
              <td style={{ ...tdStyle, color: COLORS.textMuted, fontSize: 12 }}>
                {formatDateTime(u.lastLogin)}
              </td>
              <td style={tdStyle}>
                <span style={badgeStyle(u.isActive ? COLORS.success : COLORS.danger)}>
                  {u.isActive ? "활성" : "비활성"}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => onEdit(u)} style={outlineBtnStyle()}>수정</button>
                  <button onClick={() => onRemove(u.id)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersTab() {
  const crud = useCrudForm("/admin-users", EMPTY_USER, {
    validate: (form) => {
      if (!form.username.trim()) return "아이디를 입력해주세요";
      if (!form.name.trim()) return "이름을 입력해주세요";
      if (crud.isNew && !form.password) return "비밀번호를 입력해주세요";
      return null;
    },
    mapToForm: (user) => ({
      username: user.username || "",
      name: user.name || "",
      password: "",
      role: user.role || "staff",
      email: user.email || "",
      isActive: user.isActive ?? 1,
    }),
  });

  /** 수정 시 비밀번호가 비어있으면 전송하지 않음 */
  const handleSave = async () => {
    if (!crud.isNew && !crud.form.password) {
      const { password: _pw, ...rest } = crud.form;
      void _pw;
      crud.setForm(rest);
    }
    await crud.save();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text }}>사용자 목록</h2>
        <button onClick={() => crud.openNew()} style={btnStyle()}>+ 사용자 등록</button>
      </div>

      {crud.isEditing && (
        <UserEditForm crud={crud} onSave={handleSave} />
      )}

      {crud.loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="👤" message="등록된 사용자가 없습니다" />
      ) : (
        <UserTable
          users={crud.items}
          onEdit={crud.openEdit}
          onRemove={(id) => crud.remove(id, "이 사용자를 비활성화하시겠습니까?")}
        />
      )}
    </div>
  );
}
