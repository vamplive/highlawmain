/**
 * 관리자 고객 상세 — 소통 대시보드
 * - 고객 기본 정보 + 통계 요약
 * - 원클릭 액션 (전화/문자/이메일)
 * - 소통 기록 입력 (통화/메모/자료/이메일 등)
 * - 통합 타임라인 (상담 + 메시지 + 예약 + 사건 + 활동)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";
import {
  EmptyState, ErrorBanner, TagInput,
  COLORS, btnStyle, smallBtnStyle, badgeStyle,
} from "../../../components/admin";
import {
  formatDateTime, formatPhone, truncate,
} from "../../../utils/formatters";
import QuickSendDialog from "../messages/QuickSendDialog";

/** 상담 분야 라벨 */
const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

const STATUS_LABELS = {
  pending: "대기", confirmed: "확인", completed: "완료", cancelled: "취소",
  sent: "성공", failed: "실패", booked: "예약됨", available: "가능",
  접수: "접수", 진행: "진행", 완료: "완료",
};
const STATUS_COLORS = {
  pending: COLORS.warning, confirmed: COLORS.success, completed: "#3498db",
  cancelled: COLORS.muted,
  sent: COLORS.success, failed: COLORS.danger,
  booked: "#3498db", available: COLORS.muted,
  접수: COLORS.warning, 진행: "#3498db", 완료: COLORS.success,
};

/** 이벤트 타입별 설정 (이모지 대신 텍스트 아이콘) */
const TYPE_CONFIG = {
  consultation: { icon: "C", label: "상담신청", color: "#3498db" },
  message:      { icon: "M", label: "메시지",   color: "#9b59b6" },
  booking:      { icon: "B", label: "예약",     color: "#e67e22" },
  case:         { icon: "L", label: "사건",     color: COLORS.accent },
  activity:     { icon: "A", label: "활동",     color: "#2c3e50" },
};

/** 활동 유형 */
const ACTIVITY_TYPES = [
  { value: "call_out", label: "발신 통화", icon: "CO" },
  { value: "call_in", label: "수신 통화", icon: "CI" },
  { value: "note", label: "메모", icon: "N" },
  { value: "file", label: "자료 수신", icon: "F" },
  { value: "email_in", label: "이메일 수신", icon: "EI" },
  { value: "visit", label: "내방", icon: "V" },
  { value: "other", label: "기타", icon: "O" },
];

const ACTIVITY_LABELS = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.value, t.label]));

export default function AdminClientDetail() {
  const { id } = useParams();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuickSend, setShowQuickSend] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/clients/${id}/timeline`)
      .then((json) => setTimeline(json.data))
      .catch((err) => setError(err.message || "고객 정보를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) load(); });
    return () => { cancelled = true; };
  }, [load]);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>불러오는 중...</div>;
  if (error || !timeline) {
    return (
      <div>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <EmptyState icon="--" message="고객을 찾을 수 없습니다" />
      </div>
    );
  }

  const { client, summary, events } = timeline;
  const filteredEvents = filterType === "all" ? events : events.filter((e) => e.type === filterType);

  return (
    <div>
      <Link to="/admin/clients"
        style={{ fontSize: 13, color: COLORS.muted, textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
        ← 고객 목록
      </Link>

      {/* 헤더 카드 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#1a1a1a" }}>
              {client.name}
              {!client.isActive && (
                <span style={{ ...badgeStyle(COLORS.muted), marginLeft: 10, fontSize: 11 }}>비활성</span>
              )}
            </h1>
            <div style={{ fontSize: 14, color: COLORS.textSecondary, display: "flex", gap: 16, flexWrap: "wrap" }}>
              {client.phone && <span>{formatPhone(client.phone)}</span>}
              {client.email && <span>{client.email}</span>}
              {client.category && <span>{CATEGORY_LABELS[client.category] || client.category}</span>}
            </div>
            {client.memo && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: COLORS.bgForm, borderRadius: 4, fontSize: 13, color: "#555" }}>
                {client.memo}
              </div>
            )}
            <ClientTagsEditor client={client} onSaved={load} />
            <ClientConsentEditor client={client} onSaved={load} />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {client.phone && (
              <a href={`tel:${client.phone}`} style={{ ...btnStyle("#27ae60"), textDecoration: "none" }}>
                전화
              </a>
            )}
            <button onClick={() => setShowQuickSend(true)}
              disabled={!client.phone && !client.email}
              style={{ ...btnStyle(COLORS.accent), opacity: (!client.phone && !client.email) ? 0.5 : 1 }}>
              문자/이메일
            </button>
          </div>
        </div>
      </div>

      {/* 요약 통계 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
        <StatCard label="상담" value={summary.consultationCount} color="#3498db" />
        <StatCard label="메시지" value={summary.messageCount} color="#9b59b6" />
        <StatCard label="예약" value={summary.bookingCount} color="#e67e22" />
        <StatCard label="사건" value={summary.caseCount} color={COLORS.accent} />
        <StatCard label="소통 기록" value={summary.activityCount || 0} color="#2c3e50" />
      </div>

      {summary.lastContactedAt && (
        <div style={{ marginTop: 10, fontSize: 12, color: COLORS.muted }}>
          마지막 연락: <strong>{formatDateTime(summary.lastContactedAt)}</strong>
        </div>
      )}

      {/* 소통 기록 입력 패널 */}
      <ActivityForm clientId={client.id} onSaved={load} />

      {/* 타임라인 필터 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          소통 타임라인 ({filteredEvents.length}건)
        </h2>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {[
            { value: "all", label: "전체" },
            { value: "activity", label: "활동" },
            { value: "message", label: "메시지" },
            { value: "consultation", label: "상담" },
            { value: "case", label: "사건" },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilterType(f.value)}
              style={{
                padding: "4px 10px", fontSize: 11, borderRadius: 12, border: "1px solid",
                borderColor: filterType === f.value ? COLORS.accent : COLORS.borderLight,
                background: filterType === f.value ? "#f0e9dd" : "#fff",
                color: filterType === f.value ? COLORS.accent : COLORS.textSecondary,
                cursor: "pointer",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState icon="--" message="기록된 이벤트가 없습니다" />
      ) : (
        <div style={{ position: "relative", paddingLeft: 24 }}>
          <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: COLORS.border }} />
          {filteredEvents.map((ev) => (
            <TimelineEvent key={`${ev.type}-${ev.id}`} event={ev} clientId={client.id} onDelete={load} />
          ))}
        </div>
      )}

      {showQuickSend && (
        <QuickSendDialog client={client} onClose={() => setShowQuickSend(false)}
          onSent={() => { showToast("발송 완료"); load(); }} />
      )}
    </div>
  );
}

/** 소통 기록 입력 폼 */
function ActivityForm({ clientId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("call_out");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const isCall = type === "call_out" || type === "call_in";
  const isFile = type === "file";

  async function handleSave() {
    if (!content.trim() && !file) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      if (title.trim()) formData.append("title", title.trim());
      formData.append("content", content.trim());
      if (isCall && duration) formData.append("durationSeconds", String(Number(duration) * 60));
      if (file) formData.append("file", file);

      await api.upload(`/clients/${clientId}/activities`, formData);
      setTitle(""); setContent(""); setDuration(""); setFile(null);
      setOpen(false);
      onSaved();
      showToast("기록 저장됨");
    } catch (e) {
      showToast(e.message || "저장 실패");
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <div style={{ marginTop: 16 }}>
        <button onClick={() => setOpen(true)}
          style={{ ...btnStyle("#2c3e50"), fontSize: 13 }}>
          + 소통 기록 추가
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: 16, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>소통 기록 추가</span>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, fontSize: 18 }}>×</button>
      </div>

      {/* 유형 선택 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {ACTIVITY_TYPES.map((at) => (
          <button key={at.value} onClick={() => setType(at.value)}
            style={{
              padding: "5px 12px", fontSize: 12, borderRadius: 6, cursor: "pointer",
              border: `1px solid ${type === at.value ? COLORS.accent : COLORS.borderLight}`,
              background: type === at.value ? "#f0e9dd" : "#fff",
              color: type === at.value ? COLORS.accent : "#555",
              fontWeight: type === at.value ? 600 : 400,
            }}>
            {at.label}
          </button>
        ))}
      </div>

      {/* 제목 (선택) */}
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (선택)"
        style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, marginBottom: 8, boxSizing: "border-box" }} />

      {/* 내용 */}
      <textarea value={content} onChange={(e) => setContent(e.target.value)}
        placeholder={isCall ? "통화 내용 요약..." : isFile ? "자료 설명..." : "내용..."}
        rows={3}
        style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, resize: "vertical", marginBottom: 8, boxSizing: "border-box" }} />

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* 통화 시간 */}
        {isCall && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>통화 시간:</span>
            <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)}
              placeholder="0" style={{ width: 50, padding: "4px 6px", fontSize: 12, border: `1px solid ${COLORS.borderLight}`, borderRadius: 4 }} />
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>분</span>
          </div>
        )}

        {/* 파일 첨부 */}
        <button onClick={() => fileRef.current?.click()}
          style={{ ...smallBtnStyle(COLORS.textSecondary), padding: "4px 10px", fontSize: 11 }}>
          파일 첨부
        </button>
        <input ref={fileRef} type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
        {file && <span style={{ fontSize: 11, color: "#555" }}>{file.name}</span>}

        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => setOpen(false)} style={{ ...smallBtnStyle(COLORS.muted), marginRight: 6 }}>취소</button>
          <button onClick={handleSave} disabled={saving}
            style={smallBtnStyle(COLORS.accent)}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 태그 인라인 편집 */
function ClientTagsEditor({ client, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(client.tags || []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const startEdit = () => { setDraft(client.tags || []); setErr(null); setEditing(true); };
  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/clients/${client.id}`, { tags: draft });
      setEditing(false);
      onSaved?.();
    } catch (e) { setErr(e.message || "저장 실패"); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div style={{ marginTop: 10 }}>
        <TagInput value={draft} onChange={setDraft} placeholder="예: VIP, 재방문, 소개" />
        {err && <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>{err}</div>}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={save} disabled={saving} style={smallBtnStyle(COLORS.accent)}>{saving ? "저장 중..." : "저장"}</button>
          <button onClick={() => setEditing(false)} style={smallBtnStyle(COLORS.muted)}>취소</button>
        </div>
      </div>
    );
  }

  const tags = client.tags || [];
  return (
    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: COLORS.muted }}>태그:</span>
      {tags.length === 0
        ? <span style={{ fontSize: 12, color: COLORS.muted, fontStyle: "italic" }}>없음</span>
        : tags.map((t) => (
            <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#f0e9dd", color: COLORS.accent, borderRadius: 10 }}>#{t}</span>
          ))
      }
      <button onClick={startEdit} style={{ ...smallBtnStyle(COLORS.textSecondary), padding: "2px 10px", fontSize: 11 }}>편집</button>
    </div>
  );
}

/** 수신동의 인라인 토글 */
function ClientConsentEditor({ client, onSaved }) {
  const [saving, setSaving] = useState(false);
  const toggle = async (field) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.patch(`/clients/${client.id}`, { [field]: client[field] ? false : true });
      onSaved?.();
    } catch (e) { showToast(e.message || "저장 실패"); }
    finally { setSaving(false); }
  };

  const consentBtnStyle = (enabled) => ({
    fontSize: 11, padding: "3px 10px", borderRadius: 10,
    border: `1px solid ${enabled ? COLORS.success : COLORS.danger}`,
    background: enabled ? "#e8f8ef" : "#fdecea",
    color: enabled ? COLORS.success : COLORS.danger,
    cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
  });

  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: COLORS.muted }}>수신동의:</span>
      <button type="button" onClick={() => toggle("smsConsent")} style={consentBtnStyle(client.smsConsent)}>
        SMS {client.smsConsent ? "동의" : "거부"}
      </button>
      <button type="button" onClick={() => toggle("emailConsent")} style={consentBtnStyle(client.emailConsent)}>
        이메일 {client.emailConsent ? "동의" : "거부"}
      </button>
    </div>
  );
}

/** 통계 카드 */
function StatCard({ label, value, color }) {
  return (
    <div style={{ padding: 14, background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.borderLight}`, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

/** 타임라인 이벤트 카드 */
function TimelineEvent({ event, clientId, onDelete }) {
  const cfg = TYPE_CONFIG[event.type] || { icon: "?", label: event.type, color: COLORS.muted };

  async function handleDelete() {
    if (event.type !== "activity") return;
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/clients/${clientId}/activities/${event.id}`);
      onDelete();
    } catch (e) { showToast(e.message); }
  }

  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <div style={{
        position: "absolute", left: -22, top: 8, width: 14, height: 14, borderRadius: "50%",
        background: cfg.color, border: "2px solid #fff", boxShadow: `0 0 0 2px ${cfg.color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 7, fontWeight: 700, color: "#fff",
      }}>
        {cfg.icon}
      </div>
      <div style={{ padding: 12, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
            {event.type === "activity" ? (ACTIVITY_LABELS[event.status] || event.title) : cfg.label}
            {event.status && event.type !== "activity" && (
              <span style={{ ...badgeStyle(STATUS_COLORS[event.status] || COLORS.muted), marginLeft: 8 }}>
                {STATUS_LABELS[event.status] || event.status}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{formatDateTime(event.at)}</span>
            {event.type === "activity" && (
              <button onClick={handleDelete}
                style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 11 }}>
                삭제
              </button>
            )}
          </div>
        </div>
        <EventBody event={event} />
      </div>
    </div>
  );
}

/** 이벤트 타입별 본문 렌더링 */
function EventBody({ event }) {
  const { type, payload } = event;

  if (type === "consultation") {
    return (
      <div style={{ fontSize: 13, color: "#444" }}>
        <span style={{ color: COLORS.muted, marginRight: 6 }}>{CATEGORY_LABELS[payload.category] || payload.category}</span>
        {truncate(payload.message, 120)}
        {payload.adminNote && (
          <div style={{ marginTop: 4, fontSize: 12, color: COLORS.muted, fontStyle: "italic" }}>메모: {payload.adminNote}</div>
        )}
      </div>
    );
  }

  if (type === "message") {
    return (
      <div style={{ fontSize: 13, color: "#444" }}>
        {payload.subject && <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload.subject}</div>}
        <div style={{ whiteSpace: "pre-wrap" }}>{truncate(payload.content, 200)}</div>
        {payload.errorMessage && (
          <div style={{ marginTop: 4, fontSize: 11, color: COLORS.danger }}>! {payload.errorMessage}</div>
        )}
      </div>
    );
  }

  if (type === "booking") {
    return <div style={{ fontSize: 13, color: "#444" }}>{payload.date} {payload.startTime} ~ {payload.endTime}</div>;
  }

  if (type === "case") {
    return (
      <div style={{ fontSize: 13, color: "#444" }}>
        <div style={{ fontWeight: 600 }}>{payload.title}</div>
        {payload.description && <div style={{ marginTop: 2, color: COLORS.textSecondary }}>{truncate(payload.description, 150)}</div>}
      </div>
    );
  }

  if (type === "activity") {
    return (
      <div style={{ fontSize: 13, color: "#444" }}>
        {event.title && event.title !== (ACTIVITY_LABELS[payload.activityType] || "") && (
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{event.title}</div>
        )}
        {payload.content && <div style={{ whiteSpace: "pre-wrap" }}>{payload.content}</div>}
        {payload.durationSeconds > 0 && (
          <div style={{ marginTop: 4, fontSize: 12, color: COLORS.muted }}>
            통화 시간: {Math.round(payload.durationSeconds / 60)}분
          </div>
        )}
        {payload.fileUrl && (
          <div style={{ marginTop: 6 }}>
            <a href={payload.fileUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#3498db", textDecoration: "none" }}>
              {payload.fileName || "첨부파일"} {payload.fileSize ? `(${(payload.fileSize / 1024).toFixed(0)}KB)` : ""}
            </a>
          </div>
        )}
      </div>
    );
  }

  return null;
}

const cardStyle = {
  padding: 20, background: "#fff", borderRadius: 8,
  border: `1px solid ${COLORS.borderLight}`,
};
