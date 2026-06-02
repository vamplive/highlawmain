/**
 * 자동 트리거 탭 — 조건 기반 자동 메시지 발송 규칙 관리
 * - 상담 접수/확정, 예약 리마인더, 재연결 등 트리거 타입별로 템플릿 + 지연 설정
 */
import useCrudForm from "../../../hooks/useCrudForm";
import {
  PageHeader, EditPanel, FormField, EmptyState, ErrorBanner,
  COLORS, smallBtnStyle, badgeStyle, thStyle, tdStyle,
} from "../../../components/admin";

const TRIGGER_TYPE_LABELS = {
  consultation_received: "상담 접수 직후",
  consultation_confirmed: "상담 확정 시",
  booking_reminder: "예약 리마인더 (예약 시점 기준)",
  reengagement: "장기 미연락 재연결",
};
const TRIGGER_TYPE_OPTIONS = Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS 문자" },
  { value: "email", label: "이메일" },
];

const EMPTY_FORM = {
  triggerType: "consultation_received",
  name: "",
  channel: "sms",
  subject: "",
  content: "",
  delayMinutes: 0,
  thresholdDays: 90,
  isEnabled: true,
};

export default function TriggersTab() {
  const crud = useCrudForm("/triggers", EMPTY_FORM, {
    validate: (form) => {
      if (!form.name.trim()) return "이름을 입력해주세요";
      if (!form.content.trim()) return "메시지 내용을 입력해주세요";
      if (form.channel === "email" && !form.subject.trim()) return "이메일 제목을 입력해주세요";
      return null;
    },
  });

  const toggleEnabled = (item) => {
    crud.patchItem(item.id, { isEnabled: !item.isEnabled });
  };

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      <PageHeader
        title="자동 트리거"
        subtitle="상담 접수·확정·예약 시점에 자동으로 메시지를 예약 발송합니다. 예약 리마인더는 지연을 음수로 입력해 예약 이전에 발송하세요 (예: -60 = 1시간 전)."
        onAdd={crud.openNew}
        addLabel="+ 트리거 추가"
      />

      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="트리거" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <FormField
              label="트리거 종류" required
              value={crud.form.triggerType}
              onChange={(v) => crud.setField("triggerType", v)}
              type="select" options={TRIGGER_TYPE_OPTIONS}
            />
            <FormField
              label="이름" required
              value={crud.form.name}
              onChange={(v) => crud.setField("name", v)}
              placeholder="예: 상담 접수 확인 메시지"
            />
            <FormField
              label="채널" required
              value={crud.form.channel}
              onChange={(v) => crud.setField("channel", v)}
              type="select" options={CHANNEL_OPTIONS}
            />
            <FormField
              label="지연 시간 (분)"
              value={String(crud.form.delayMinutes)}
              onChange={(v) => crud.setField("delayMinutes", Number(v) || 0)}
              type="number"
              placeholder="0 = 즉시, -60 = 예약 1시간 전"
            />
            {crud.form.triggerType === "reengagement" && (
              <FormField
                label="임계 일수 (재참여)"
                value={String(crud.form.thresholdDays)}
                onChange={(v) => crud.setField("thresholdDays", Math.max(1, Number(v) || 90))}
                type="number"
                placeholder="마지막 연락 후 경과 일수 (예: 90)"
              />
            )}
          </div>
          {crud.form.channel === "email" && (
            <div style={{ marginBottom: 16 }}>
              <FormField
                label="이메일 제목" required
                value={crud.form.subject}
                onChange={(v) => crud.setField("subject", v)}
              />
            </div>
          )}
          <FormField
            label="내용" required
            value={crud.form.content}
            onChange={(v) => crud.setField("content", v)}
            type="textarea" minHeight={120}
            placeholder="{name}님, 상담 신청이 접수되었습니다. 담당자가 곧 연락드리겠습니다."
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={crud.form.isEnabled}
              onChange={(e) => crud.setField("isEnabled", e.target.checked)}
            />
            활성화
          </label>
        </EditPanel>
      )}

      {crud.loading ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.muted }}>불러오는 중...</div>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="🤖" message="등록된 트리거가 없습니다" />
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
              <th style={thStyle}>종류</th>
              <th style={thStyle}>이름</th>
              <th style={thStyle}>채널</th>
              <th style={thStyle}>지연</th>
              <th style={thStyle}>내용</th>
              <th style={thStyle}>상태</th>
              <th style={{ ...thStyle, width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {crud.items.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0", opacity: t.isEnabled ? 1 : 0.5 }}>
                <td style={tdStyle}>
                  <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                    {TRIGGER_TYPE_LABELS[t.triggerType] || t.triggerType}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{t.name}</td>
                <td style={tdStyle}>
                  <span style={badgeStyle(t.channel === "sms" ? "#3498db" : "#9b59b6")}>
                    {t.channel === "sms" ? "SMS" : "이메일"}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: 12, color: COLORS.muted }}>
                  {formatDelay(t.delayMinutes)}
                  {t.triggerType === "reengagement" && (
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      {t.thresholdDays || 90}일 미연락 시
                    </div>
                  )}
                </td>
                <td style={{ ...tdStyle, maxWidth: 280, color: COLORS.textSecondary }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.content}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={badgeStyle(t.isEnabled ? COLORS.success : COLORS.muted)}>
                    {t.isEnabled ? "활성" : "비활성"}
                  </span>
                </td>
                <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
                  <button onClick={() => crud.openEdit(t)} style={smallBtnStyle(COLORS.textSecondary)}>수정</button>
                  <button onClick={() => toggleEnabled(t)} style={smallBtnStyle(t.isEnabled ? COLORS.warning : COLORS.success)}>
                    {t.isEnabled ? "끄기" : "켜기"}
                  </button>
                  <button onClick={() => crud.remove(t.id, "이 트리거를 삭제하시겠습니까?")} style={smallBtnStyle(COLORS.danger)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatDelay(minutes) {
  const m = Number(minutes) || 0;
  if (m === 0) return "즉시";
  const abs = Math.abs(m);
  const sign = m < 0 ? "-" : "+";
  if (abs >= 1440) return `${sign}${Math.round(abs / 1440)}일`;
  if (abs >= 60) return `${sign}${Math.round(abs / 60)}시간`;
  return `${sign}${abs}분`;
}
