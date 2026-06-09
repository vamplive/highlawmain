import { useState, useEffect, useCallback, useRef } from "react";
import { portalApi } from "../../utils/api";

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 32 }) {
  const initials = name ? name.replace(/\s/g, "").slice(0, 2).toUpperCase() : "?";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  const colors = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", background: bg,
      color: "#fff", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
      userSelect: "none",
    }}>
      {initials}
    </span>
  );
}

// ─── MemberPicker ─────────────────────────────────────────────────────────────
function MemberPicker({ members, selected, onChange, myId }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // 포커스 바깥 클릭 시 닫기
  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = members.filter(
    m => m.id !== myId &&
      !selected.find(s => s.id === m.id) &&
      (!query ||
        m.name?.toLowerCase().includes(query.toLowerCase()) ||
        m.email?.toLowerCase().includes(query.toLowerCase()))
  );

  function add(m) {
    onChange([...selected, m]);
    setQuery("");
    // 다음 선택을 위해 입력창에 포커스 유지
  }
  function remove(id) { onChange(selected.filter(s => s.id !== id)); }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* 선택된 구성원 칩 */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {selected.map(m => (
            <span key={m.id} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "#eff6ff", color: "#1d4ed8", borderRadius: 20,
              padding: "3px 10px 3px 6px", fontSize: 13,
            }}>
              <Avatar name={m.name} photoUrl={m.photo_url} size={18} />
              {m.name}
              <button
                type="button"
                onClick={() => remove(m.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 15, lineHeight: 1, padding: 0, marginLeft: 2 }}
              >×</button>
            </span>
          ))}
        </div>
      )}

      {/* 검색 입력 */}
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={members.length === 0 ? "구성원 목록 불러오는 중..." : "이름 또는 이메일로 검색..."}
        disabled={members.length === 0}
        style={{
          width: "100%", padding: "8px 10px",
          border: `1px solid ${open ? "#3b82f6" : "#e2e8f0"}`,
          borderRadius: 6, fontSize: 14, boxSizing: "border-box",
          outline: "none", transition: "border-color 0.15s",
        }}
      />

      {/* 드롭다운 — 포커스 시 전체 목록, 입력 시 필터 */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff",
          maxHeight: 200, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
              {query ? "검색 결과 없음" : (members.length === 0 ? "구성원이 없습니다" : "선택할 구성원이 없습니다")}
            </div>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); add(m); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 14px", background: "none",
                  border: "none", borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer", textAlign: "left",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseOut={e => e.currentTarget.style.background = "none"}
              >
                <Avatar name={m.name} photoUrl={m.photo_url} size={28} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{m.email}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────
function BookingCard({ booking, myId, onCancel }) {
  const isOrganizer = booking.organizerId === myId;
  const start = booking.startsAt ? new Date(booking.startsAt.replace(" ", "T")) : null;
  const end = booking.endsAt ? new Date(booking.endsAt.replace(" ", "T")) : null;
  const isPast = start && start < new Date();

  function fmt(d) {
    if (!d) return "";
    return d.toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
      padding: "16px 20px", opacity: isPast ? 0.65 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{booking.title}</div>
          <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>
            {fmt(start)}{end && ` ~ ${end.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`}
          </div>
          {booking.location && (
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>📍 {booking.location}</div>
          )}
          {booking.description && (
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{booking.description}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>주최:</span>
            <Avatar name={booking.organizerName} photoUrl={booking.organizerPhoto} size={22} />
            <span style={{ fontSize: 13 }}>{booking.organizerName}</span>
            {booking.attendees?.length > 0 && (
              <>
                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>참석자:</span>
                {booking.attendees.map(a => (
                  <span key={a.id} title={a.name} style={{ display: "inline-flex" }}>
                    <Avatar name={a.name} photoUrl={a.photo_url} size={22} />
                  </span>
                ))}
                <span style={{ fontSize: 13, color: "#475569" }}>
                  {booking.attendees.map(a => a.name).join(", ")}
                </span>
              </>
            )}
          </div>
        </div>
        {isOrganizer && !isPast && (
          <button
            onClick={() => onCancel(booking.id)}
            style={{
              padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 6,
              background: "#fff", color: "#ef4444", fontSize: 13, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CreateModal ──────────────────────────────────────────────────────────────
function CreateModal({ members, membersErr, onRetryMembers, myId, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", startsAt: "", endsAt: "", location: "", description: "" });
  const [attendees, setAttendees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("제목을 입력해주세요"); return; }
    if (!form.startsAt) { setErr("시작 시간을 입력해주세요"); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await portalApi.post("/bookings", {
        title: form.title.trim(),
        description: form.description.trim() || null,
        startsAt: form.startsAt.replace("T", " ") + ":00",
        endsAt: form.endsAt ? form.endsAt.replace("T", " ") + ":00" : null,
        location: form.location.trim() || null,
        attendeeIds: attendees.map(a => a.id),
      });
      onCreated(res.data);
    } catch (e) {
      setErr(e?.message || "예약 생성에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  const s = {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    box: { background: "#fff", borderRadius: 14, padding: "28px 28px 24px", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.22)" },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
    input: { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, boxSizing: "border-box", outline: "none" },
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.box}>
        <h3 style={{ margin: "0 0 22px", fontSize: 18, fontWeight: 700 }}>새 예약</h3>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>제목 *</label>
            <input style={s.input} value={form.title} onChange={e => setField("title", e.target.value)} placeholder="회의 제목" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>시작 시간 *</label>
              <input style={s.input} type="datetime-local" value={form.startsAt} onChange={e => setField("startsAt", e.target.value)} />
            </div>
            <div>
              <label style={s.label}>종료 시간</label>
              <input style={s.input} type="datetime-local" value={form.endsAt} onChange={e => setField("endsAt", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>장소</label>
            <input style={s.input} value={form.location} onChange={e => setField("location", e.target.value)} placeholder="회의실 A, 화상회의 등" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>설명</label>
            <textarea
              style={{ ...s.input, minHeight: 68, resize: "vertical" }}
              value={form.description}
              onChange={e => setField("description", e.target.value)}
              placeholder="안건, 준비사항 등"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>
              참석자
              {attendees.length > 0 && (
                <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: 6 }}>({attendees.length}명 선택됨)</span>
              )}
            </label>
            {membersErr ? (
              <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 13, color: "#dc2626" }}>
                {membersErr}
                <button type="button" onClick={onRetryMembers} style={{ marginLeft: 10, fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  다시 시도
                </button>
              </div>
            ) : (
              <MemberPicker members={members} selected={attendees} onChange={setAttendees} myId={myId} />
            )}
            {attendees.length > 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>
                선택된 구성원의 캘린더에 자동으로 일정이 추가됩니다.
              </p>
            )}
          </div>

          {err && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 7,
              background: "#fff", fontSize: 14, cursor: "pointer",
            }}>취소</button>
            <button type="submit" disabled={saving} style={{
              padding: "8px 20px", border: "none", borderRadius: 7,
              background: saving ? "#93c5fd" : "#2563eb", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "저장 중..." : "예약 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortalBookings() {
  const [bookings, setBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersErr, setMembersErr] = useState("");
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("upcoming");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portalApi.get("/bookings");
      setBookings(res.data || []);
      if (res.myId) setMyId(res.myId);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersErr("");
    try {
      const res = await portalApi.get("/members");
      setMembers(res.data || []);
      if (res.myId) setMyId(prev => prev || res.myId);
    } catch (e) {
      setMembersErr(e?.message || "구성원 목록을 불러오지 못했습니다");
    }
  }, []);

  useEffect(() => {
    loadBookings();
    loadMembers();
  }, [loadBookings, loadMembers]);

  async function handleCancel(id) {
    if (!window.confirm("이 예약을 취소하시겠습니까?")) return;
    try {
      await portalApi.post(`/bookings/${id}/cancel`);
      setBookings(b => b.filter(x => x.id !== id));
    } catch (e) {
      alert(e?.message || "취소에 실패했습니다");
    }
  }

  function handleCreated(booking) {
    setBookings(b => [booking, ...b].sort((a, b) => (a.startsAt || "") > (b.startsAt || "") ? 1 : -1));
    setShowModal(false);
    setTab("upcoming");
  }

  const now = new Date();
  const upcoming = bookings.filter(b => !b.startsAt || new Date(b.startsAt.replace(" ", "T")) >= now);
  const past = bookings.filter(b => b.startsAt && new Date(b.startsAt.replace(" ", "T")) < now);
  const display = tab === "upcoming" ? upcoming : past;

  const tabStyle = active => ({
    padding: "6px 18px", border: "none", borderRadius: 20,
    background: active ? "#2563eb" : "transparent",
    color: active ? "#fff" : "#64748b",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>예약</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "8px 18px", border: "none", borderRadius: 8,
            background: "#2563eb", color: "#fff", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          + 새 예약
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 24, padding: 4, width: "fit-content" }}>
        <button style={tabStyle(tab === "upcoming")} onClick={() => setTab("upcoming")}>
          예정 {upcoming.length > 0 && `(${upcoming.length})`}
        </button>
        <button style={tabStyle(tab === "past")} onClick={() => setTab("past")}>
          지난 {past.length > 0 && `(${past.length})`}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 40 }}>불러오는 중...</p>
      ) : display.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 40 }}>
          {tab === "upcoming" ? "예정된 예약이 없습니다" : "지난 예약이 없습니다"}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {display.map(b => (
            <BookingCard key={b.id} booking={b} myId={myId} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateModal
          members={members}
          membersErr={membersErr}
          onRetryMembers={loadMembers}
          myId={myId}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
