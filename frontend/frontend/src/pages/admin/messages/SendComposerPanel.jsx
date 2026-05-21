/**
 * 발송 탭 2단계 — 메시지 작성 패널.
 * 템플릿 선택, 이메일 제목, 본문, 바이트 카운터, 미리보기.
 */
import { COLORS } from "../../../components/admin";
import { renderPlaceholders } from "../../../utils/formatters";
import { SMS_BYTE_LIMIT } from "./messageConstants";
import {
  SectionLabel, Label,
} from "./sendTabPrimitives";
import { inputStyle, selectStyle } from "./sendTabStyles";

export default function SendComposerPanel({
  templates, selectedTemplate, onTemplateSelect,
  showEmailSubject, subject, onSubjectChange,
  content, onContentChange, byteLen, showSmsCounter,
  previewSample,
}) {
  const insertToken = (token) => onContentChange(content ? `${content}${token}` : token);
  const applyPreset = (text) => onContentChange(text);

  return (
    <>
      <SectionLabel step="2" title="메시지" />

      {templates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Label>템플릿</Label>
          <select
            style={selectStyle}
            value={selectedTemplate}
            onChange={(e) => onTemplateSelect(e.target.value)}
          >
            <option value="">직접 입력</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {showEmailSubject && (
        <div style={{ marginBottom: 16 }}>
          <Label>이메일 제목</Label>
          <input
            style={inputStyle}
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="[법무법인 하이로] 상담 일정 안내"
          />
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <Label hint="{name} {고객명} {{고객명}} {date} {category} 사용 가능">
          내용
        </Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {[
            ["상담 안내", "안녕하세요 {name}님, 법무법인 하이로입니다.\n상담 일정과 준비사항을 안내드립니다."],
            ["방문 전 안내", "{name}님, 방문 전 관련 자료와 신분증을 지참해 주세요.\n주소: 서울 서초구 서초대로 327, 5층"],
            ["예약 확인", "{name}님, 예약하신 상담 일정이 확인되었습니다.\n변경이 필요하시면 본 번호로 회신 부탁드립니다."],
          ].map(([label, text]) => (
            <button key={label} type="button" onClick={() => applyPreset(text)} style={chipStyle}>
              {label}
            </button>
          ))}
          {["{고객명}", "{name}", "{date}", "{category}"].map((token) => (
            <button key={token} type="button" onClick={() => insertToken(token)} style={{ ...chipStyle, color: "#1d4ed8", borderColor: "#bfdbfe", background: "#eff6ff" }}>
              {token}
            </button>
          ))}
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: 200, resize: "vertical", lineHeight: 1.6 }}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="안녕하세요 {name}님,&#10;법무법인 하이로입니다..."
        />
        {showSmsCounter && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6, alignItems: "center" }}>
            <div style={{ height: 5, flex: 1, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(100, Math.round((byteLen / SMS_BYTE_LIMIT) * 100))}%`,
                height: "100%",
                background: byteLen > SMS_BYTE_LIMIT ? COLORS.warning : COLORS.accent,
              }} />
            </div>
            <div style={{ fontSize: 11, color: byteLen > SMS_BYTE_LIMIT ? COLORS.danger : COLORS.muted, minWidth: 92, textAlign: "right" }}>
              {byteLen} / {SMS_BYTE_LIMIT}B · {byteLen > SMS_BYTE_LIMIT ? "LMS" : "SMS"}
            </div>
          </div>
        )}
      </div>

      {content && (
        <Preview
          content={content}
          subject={subject}
          showSubject={showEmailSubject}
          sample={previewSample}
        />
      )}
    </>
  );
}

const chipStyle = {
  border: "1px solid #dbe3ef",
  background: "#fff",
  color: "#334155",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  cursor: "pointer",
};

function Preview({ content, subject, showSubject, sample }) {
  const sampleData = sample || { name: "홍길동", category: "civil" };
  const previewSubject = renderPlaceholders(subject || "", sampleData);
  const previewContent = renderPlaceholders(content, sampleData);
  return (
    <div style={{
      marginTop: 16, padding: 14, background: "#faf9f6",
      borderLeft: `2px solid ${COLORS.accent}`, borderRadius: 4,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.muted, marginBottom: 6, letterSpacing: 0.5 }}>
        미리보기 · {sampleData.name}님
        {!sample && <span style={{ color: COLORS.warning, marginLeft: 6, fontWeight: 400 }}>(샘플)</span>}
      </div>
      {showSubject && previewSubject && (
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
          {previewSubject}
        </div>
      )}
      <div style={{ fontSize: 13, color: COLORS.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
        {previewContent}
      </div>
    </div>
  );
}
