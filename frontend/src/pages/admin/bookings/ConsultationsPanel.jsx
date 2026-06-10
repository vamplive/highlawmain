/**
 * 관리자 — 상담 신청 패널
 * - 접수된 상담 목록 (상담 방식/예약 방식 뱃지 + 상태)
 * - 확정 액션: 화상 상담이면 Meet 링크 자동 생성 시도 (백엔드), 필요 시 수동 입력 가능
 * - 신청 유형에 따라 슬롯 시간 또는 희망 일정 3개 표시
 */
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { EmptyState } from "../../../components/admin";
import { COLORS, outlineBtnStyle } from "../../../components/admin/styles";
import { showToast } from "../../../utils/showToast";
import { formatPhone, formatDate } from "../../../utils/formatters";

const MEETING_TYPE = {
  in_person: { label: "대면", color: "#6c5ce7" },
  phone: { label: "전화", color: "#00b894" },
  video: { label: "화상", color: "#0984e3" },
};

const STATUS = {
  pending: { label: "대기", bg: "#fff3e0", color: "#e65100" },
  confirmed: { label: "확정", bg: "#e8f5e9", color: "#2e7d32" },
  cancelled: { label: "취소", bg: "#fce4ec", color: "#c62828" },
  completed: { label: "완료", bg: "#eceff1", color: "#455a64" },
};

const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

export default function ConsultationsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/consultations?limit=50")
      .then((j) => setRows(j.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load();
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p style={{ color: COLORS.muted, fontSize: 14 }}>로딩 중...</p>;
  if (rows.length === 0) return <EmptyState icon="📨" message="접수된 상담 신청이 없습니다" />;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((c) => (
          <ConsultationRow key={c.id} consultation={c} onConfirm={() => setConfirmTarget(c)} />
        ))}
      </div>
      {confirmTarget && (
        <ConfirmDialog
          consultation={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onDone={() => { setConfirmTarget(null); load(); }}
        />
      )}
    </>
  );
}

/** 상담 카드 1건 */
function ConsultationRow({ consultation, onConfirm }) {
  const c = consultation;
  const meet = MEETING_TYPE[c.meetingType] || MEETING_TYPE.in_person;
  const status = STATUS[c.status] || STATUS.pending;
  const canConfirm = c.status === "pending";

  const preferredSlots = [1, 2, 3]
    .map((n) => ({ date: c[`preferredDate${n}`], time: c[`preferredTime${n}`] }))
    .filter((s) => s.date);

  return (
    <div style={{
      padding: "16px 20px", background: "#fff", border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 6, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{c.name}</span>
            <Badge text={meet.label} color={meet.color} />
            <Badge text={CATEGORY_LABELS[c.category] || c.category} color="#7f8c8d" />
            <Badge text={c.scheduleMode === "request" ? "일정 협의" : "슬롯 선택"} color="#95a5a6" />
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>{formatPhone(c.phone)}</span>
            {c.email && <span>{c.email}</span>}
            <span>접수 {formatDate(c.createdAt)}</span>
          </div>
        </div>
        {canConfirm && (
          <button onClick={onConfirm} style={outlineBtnStyle(COLORS.accent)}>확정하기</button>
        )}
      </div>

      {/* 슬롯 또는 희망 일정 */}
      {c.scheduleMode === "slot" && c.bookingSlotId && (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, background: "#f7f8fa", padding: "8px 12px", borderRadius: 4 }}>
          예약 슬롯: {c.bookingSlot
            ? `${c.bookingSlot.date} ${c.bookingSlot.startTime}${c.bookingSlot.endTime ? `~${c.bookingSlot.endTime}` : ""}`
            : <code>{c.bookingSlotId.slice(0, 8)}...</code>}
          {c.meetingLink && <span> · Meet: <a href={c.meetingLink} target="_blank" rel="noopener noreferrer">{c.meetingLink}</a></span>}
        </div>
      )}
      {c.scheduleMode === "request" && preferredSlots.length > 0 && (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, background: "#f7f8fa", padding: "8px 12px", borderRadius: 4 }}>
          희망 일정: {preferredSlots.map((s, i) => (
            <span key={i} style={{ marginRight: 12 }}>{i + 1}순위 {s.date} {s.time || ""}</span>
          ))}
        </div>
      )}

      {c.message && (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {c.message}
        </div>
      )}
    </div>
  );
}

/** 확정 다이얼로그 — Meet 링크 수동 입력 가능 */
function ConfirmDialog({ consultation, onClose, onDone }) {
  const c = consultation;
  const isVideo = c.meetingType === "video";
  const [meetingLink, setMeetingLink] = useState(c.meetingLink || "");
  const [adminNote, setAdminNote] = useState(c.adminNote || "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.post(`/consultations/${c.id}/confirm`, {
        meetingLink: meetingLink || undefined,
        adminNote: adminNote || undefined,
      });
      showToast("상담이 확정되었습니다");
      onDone();
    } catch (err) {
      showToast("확정 실패: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 8, padding: 24, maxWidth: 520, width: "100%",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{c.name}님 상담 확정</h3>
        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
          {MEETING_TYPE[c.meetingType]?.label} 상담 · {CATEGORY_LABELS[c.category]}
        </div>

        {isVideo && (
          <div>
            <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              Google Meet 링크 (비우면 서버에서 자동 생성 시도)
            </label>
            <input
              type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.borderField}`, borderRadius: 4, fontSize: 13 }}
            />
            <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
              슬롯 확정 + Google 연동 설정 시 자동으로 Meet 링크가 생성됩니다. 실패 시 수동 입력하세요.
            </p>
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>관리자 메모</label>
          <textarea
            value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.borderField}`, borderRadius: 4, fontSize: 13, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy} style={outlineBtnStyle(COLORS.muted)}>취소</button>
          <button onClick={submit} disabled={busy} style={{
            padding: "8px 20px", background: COLORS.accent, color: "#fff",
            border: "none", borderRadius: 4, cursor: busy ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500,
          }}>
            {busy ? "처리 중..." : "확정"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4,
      background: `${color}15`, color, fontWeight: 500,
    }}>{text}</span>
  );
}
