/**
 * 원클릭 메시지 발송 다이얼로그
 * - 고객 목록/상세에서 호출해 바로 SMS/이메일 발송
 * - 템플릿 선택 + 플레이스홀더 실시간 치환 미리보기 + 바이트 카운터
 */
import { useState, useEffect, useMemo } from "react";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";
import {
  COLORS, fieldStyle, labelStyle, btnStyle,
} from "../../../components/admin";
import {
  getByteLength, renderPlaceholders, formatPhone,
} from "../../../utils/formatters";
import {
  SMS_BYTE_LIMIT, CHANNEL_OPTIONS, CHANNEL_COLORS,
} from "./messageConstants";

/**
 * @param {object} props
 * @param {{ id, name, phone, email, category }} props.client - 대상 고객
 * @param {() => void} props.onClose - 닫기 콜백
 * @param {() => void} [props.onSent] - 발송 성공 시 콜백 (목록 갱신 등)
 */
export default function QuickSendDialog({ client, onClose, onSent }) {
  const hasPhone = Boolean(client?.phone);
  const hasEmail = Boolean(client?.email);
  const defaultChannel = hasPhone ? "sms" : "email";

  const [channel, setChannel] = useState(defaultChannel);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  /** 채널에 맞는 템플릿 목록 로드 */
  useEffect(() => {
    api.get(`/messages/templates?channel=${channel}`)
      .then((json) => setTemplates(json.data ?? []))
      .catch(() => setTemplates([]));
  }, [channel]);

  /** 템플릿 선택 시 내용 채우기 */
  const handleTemplateSelect = (e) => {
    const id = e.target.value;
    setSelectedTemplate(id);
    if (!id) return;
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setContent(tpl.content);
      if (tpl.subject) setSubject(tpl.subject);
    }
  };

  /** 플레이스홀더 치환 미리보기 (실제 고객 데이터로) */
  const preview = useMemo(() => ({
    subject: renderPlaceholders(subject, client),
    content: renderPlaceholders(content, client),
  }), [subject, content, client]);

  const byteLen = getByteLength(preview.content);
  const isEmail = channel === "email";

  /** 발송 실행 */
  const handleSend = async () => {
    if (!content.trim()) return showToast("메시지 내용을 입력해주세요");
    if (isEmail && !subject.trim()) return showToast("이메일 제목을 입력해주세요");
    const contact = isEmail ? client.email : client.phone;
    if (!contact) return showToast(isEmail ? "이메일 주소가 없습니다" : "전화번호가 없습니다");

    if (!confirm(`${client.name}님에게 ${isEmail ? "이메일" : "문자"}를 발송하시겠습니까?`)) return;

    setSending(true);
    setResult(null);
    try {
      const res = await api.post("/messages/send", {
        channel,
        recipients: [{
          name: client.name, contact,
          consultationId: client.consultationId || null,
          category: client.category,
        }],
        templateId: selectedTemplate || undefined,
        subject: isEmail ? subject : undefined,
        content,
      });
      setResult(res.data);
      if (res.data?.sent > 0 && onSent) onSent();
    } catch (err) {
      showToast("발송 실패: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              📱 바로 보내기
            </h2>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
              <strong>{client.name}</strong>
              {hasPhone && <span style={{ marginLeft: 8 }}>{formatPhone(client.phone)}</span>}
              {hasEmail && <span style={{ marginLeft: 8 }}>{client.email}</span>}
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* 채널 토글 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {CHANNEL_OPTIONS.map((opt) => {
            const disabled = (opt.value === "sms" && !hasPhone) || (opt.value === "email" && !hasEmail);
            const active = channel === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !disabled && setChannel(opt.value)}
                disabled={disabled}
                style={{
                  padding: "6px 14px", fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : disabled ? "#bbb" : "#555",
                  background: active ? (CHANNEL_COLORS[opt.value] || COLORS.accent) : "#f3f3f3",
                  border: "none", borderRadius: 4,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {opt.label}{disabled && " (연락처 없음)"}
              </button>
            );
          })}
        </div>

        {/* 템플릿 선택 */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>템플릿</label>
          <select value={selectedTemplate} onChange={handleTemplateSelect} style={fieldStyle}>
            <option value="">직접 입력</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* 이메일 제목 */}
        {isEmail && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>제목 *</label>
            <input
              style={fieldStyle}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="[법무법인 하이로] …"
            />
          </div>
        )}

        {/* 내용 */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>
            내용 *
            <span style={{ fontWeight: 400, color: COLORS.muted, marginLeft: 8, fontSize: 11 }}>
              {"{name}"} {"{date}"} {"{category}"} 사용 가능
            </span>
          </label>
          <textarea
            style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`안녕하세요 {name}님, 법무법인 하이로입니다…`}
          />
          {!isEmail && (
            <div style={{
              fontSize: 11, marginTop: 4,
              color: byteLen > SMS_BYTE_LIMIT ? COLORS.danger : COLORS.muted,
            }}>
              {byteLen} / {SMS_BYTE_LIMIT} 바이트
              {byteLen > SMS_BYTE_LIMIT ? " (LMS로 발송)" : " (SMS)"}
            </div>
          )}
        </div>

        {/* 실시간 치환 미리보기 */}
        {content && (
          <div style={previewBoxStyle}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>
              📲 {client.name}님에게 전달되는 내용
            </div>
            {isEmail && preview.subject && (
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#222" }}>
                {preview.subject}
              </div>
            )}
            <div style={{ fontSize: 13, color: "#333", whiteSpace: "pre-wrap" }}>
              {preview.content}
            </div>
          </div>
        )}

        {/* 발송 결과 */}
        {result && (
          <div style={{
            marginTop: 12, padding: 10, borderRadius: 4, fontSize: 13,
            background: result.failed > 0 ? "#fef0e7" : "#e8f8ef",
            color: result.failed > 0 ? COLORS.danger : COLORS.success,
          }}>
            {result.failed > 0
              ? `발송 실패: ${result.results?.[0]?.error || "알 수 없는 오류"}`
              : "✅ 발송 성공"}
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={{ ...btnStyle("#888"), padding: "10px 20px" }}>
            닫기
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            style={{
              ...btnStyle(sending ? COLORS.muted : COLORS.success),
              padding: "10px 20px",
              opacity: sending || !content.trim() ? 0.6 : 1,
            }}
          >
            {sending ? "발송 중…" : `${isEmail ? "이메일" : "문자"} 발송`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 스타일 ── */
const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0, 0, 0, 0.45)",
  display: "flex", justifyContent: "center", alignItems: "flex-start",
  paddingTop: 80, zIndex: 1000,
};
const dialogStyle = {
  background: "#fff", borderRadius: 8, padding: 24,
  width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
};
const closeBtnStyle = {
  background: "none", border: "none", fontSize: 20,
  color: COLORS.muted, cursor: "pointer", padding: 4,
};
const previewBoxStyle = {
  padding: 12, background: COLORS.bgForm,
  border: `1px solid ${COLORS.border}`, borderRadius: 6,
};
