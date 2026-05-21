/**
 * 템플릿 관리 탭 — SMS/이메일 메시지 템플릿 CRUD
 * useCrudForm 훅을 활용하여 목록 조회, 생성, 수정, 삭제 처리
 */
import useCrudForm from "../../../hooks/useCrudForm";
import {
  EditPanel, FormField, EmptyState,
  COLORS, fieldStyle, labelStyle, btnStyle, smallBtnStyle, badgeStyle,
} from "../../../components/admin";
import { getByteLength } from "../../../utils/formatters";
import {
  SMS_BYTE_LIMIT, CHANNEL_COLORS, CHANNEL_OPTIONS, EMPTY_TEMPLATE,
} from "./messageConstants";

export default function TemplatesTab() {
  const crud = useCrudForm("/messages/templates", EMPTY_TEMPLATE, {
    validate: (form) => {
      if (!form.name.trim()) return "템플릿 이름을 입력해주세요";
      if (!form.content.trim()) return "메시지 내용을 입력해주세요";
      return null;
    },
    mapToForm: (t) => ({
      name: t.name, channel: t.channel, subject: t.subject || "",
      content: t.content, isActive: !!t.isActive, sortOrder: t.sortOrder ?? 0,
    }),
  });

  return (
    <div>
      {/* 상단 요약 + 추가 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: COLORS.textMuted }}>{crud.items.length}개 템플릿</span>
        <button onClick={crud.openNew} style={btnStyle()}>+ 새 템플릿</button>
      </div>

      {/* 편집 폼 */}
      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="템플릿" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <FormField
              label="템플릿 이름" value={crud.form.name}
              onChange={(v) => crud.setField("name", v)}
              required placeholder="예: 상담 확인 안내"
            />
            <FormField
              label="채널" value={crud.form.channel}
              onChange={(v) => crud.setField("channel", v)}
              type="select" options={CHANNEL_OPTIONS} required
            />
          </div>

          {crud.form.channel === "email" && (
            <div style={{ marginBottom: 16 }}>
              <FormField
                label="이메일 제목" value={crud.form.subject}
                onChange={(v) => crud.setField("subject", v)}
                placeholder="예: [법무법인 하이로] 상담 일정 안내"
              />
            </div>
          )}

          <TemplateContentField
            value={crud.form.content}
            onChange={(v) => crud.setField("content", v)}
            channel={crud.form.channel}
          />

          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 12 }}>
            <input
              type="checkbox" checked={crud.form.isActive}
              onChange={(e) => crud.setField("isActive", e.target.checked)}
            />
            활성화
          </label>
        </EditPanel>
      )}

      {/* 목록 */}
      {crud.loading ? (
        <EmptyState icon="⏳" message="불러오는 중..." />
      ) : crud.items.length === 0 ? (
        <EmptyState icon="📋" message="등록된 템플릿이 없습니다" />
      ) : (
        <TemplateList items={crud.items} onEdit={crud.openEdit} onRemove={crud.remove} />
      )}
    </div>
  );
}

/** 템플릿 메시지 내용 필드 (바이트 카운터 포함) */
function TemplateContentField({ value, onChange, channel }) {
  const byteLen = getByteLength(value);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        메시지 내용 *
        <span style={{ fontWeight: 400, color: COLORS.muted, marginLeft: 8 }}>
          플레이스홀더: {"{고객명}"} {"{name}"} {"{{고객명}}"} {"{date}"} {"{category}"}
        </span>
      </label>
      <textarea
        style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="안녕하세요 {고객명}님, 법무법인 하이로입니다..."
      />
      {channel === "sms" && (
        <div style={{ fontSize: 11, color: byteLen > SMS_BYTE_LIMIT ? COLORS.danger : COLORS.muted, marginTop: 4 }}>
          {byteLen} / {SMS_BYTE_LIMIT} 바이트
          {byteLen > SMS_BYTE_LIMIT ? " (LMS로 발송됩니다)" : " (SMS)"}
        </div>
      )}
    </div>
  );
}

/** 템플릿 목록 카드 */
function TemplateList({ items, onEdit, onRemove }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((t) => (
        <div key={t.id} style={{
          padding: "14px 20px", background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6,
          display: "flex", alignItems: "center", gap: 16,
          opacity: t.isActive ? 1 : 0.5,
        }}>
          <span style={badgeStyle(CHANNEL_COLORS[t.channel] || COLORS.muted)}>
            {t.channel === "sms" ? "SMS" : "이메일"}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{t.name}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
              {t.content.length > 60 ? t.content.slice(0, 60) + "..." : t.content}
            </div>
          </div>
          <button onClick={() => onEdit(t)} style={smallBtnStyle(COLORS.textSecondary)}>수정</button>
          <button onClick={() => onRemove(t.id, "이 템플릿을 삭제하시겠습니까?")} style={smallBtnStyle(COLORS.danger)}>삭제</button>
        </div>
      ))}
    </div>
  );
}
