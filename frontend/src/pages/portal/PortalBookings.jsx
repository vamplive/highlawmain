import { useState, useEffect, useCallback } from "react";
import { portalApi } from "../../api/portalApi";

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 32 }) {
  const initials = name
    ? name.replace(/\s/g, "").slice(0, 2).toUpperCase()
    : "?";
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
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size, borderRadius: "50%", background: bg,
        color: "#fff", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </span>
  );
}

// ─── MemberPicker ─────────────────────────────────────────────────────────────
function MemberPicker({ members, selected, onChange, myId }) {
  const [query, setQuery] = useState("");
  const filtered = members.filter(
    m => m.id !== myId &&
      !selected.find(s => s.id === m.id) &&
      (m.name?.toLowerCase().includes(query.toLowerCase()) ||
       m.email?.toLowerCase().includes(query.toLowerCase()))
  );

  function add(m) { onChange([...selected, m]); setQuery(""); }
  function remove(id) { onChange(selected.filter(s => s.id !== id)); }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
        {selected.map(m => (
          <span key={m.id} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "#eff6ff", color: "#1d4ed8", borderRadius: 20,
            padding: "3px 8px", fontSize: 13,
          }}>
            <Avatar name={m.name} photoUrl={m.photo_url} size={18} />
            {m.name}
            <button onClick={() => remove(m.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2,
            }}>×</button>
          </span>
        ))}
      </div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="구성원 검색..."
        style={{
          width: "100%", padding: "6px 10px", border: "1px solid #e2e8f0",
          borderRadius: 6, fontSize: 14, boxSizing: "border-box",
        }}
      />
      {query && filtered.length > 0 && (
        <ul style={{
          margin: "4px 0 0", padding: 0, listStyle: "none",
          border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff",
          maxHeight: 160, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,.1)",
        }}>
          {filtered.map(m => (
            <li key={m.id}>
              <button onClick={() => add(m)} style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 12px", background: "none",
                border: "none", cursor: "pointer", textAlign: "left", fontSize: 14,
              }}
                onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseOut={e => e.currentTarget.style.background = "none"}
              >
                <Avatar name={m.name} photoUrl={m.photo_url} size={24} />
                <span>{m.name}</span>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{m.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query && filtered.length === 0 && (
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>검색 결과 없음</p>
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
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
              📍 {booking.location}
            </div>
          )}
          {booking.description && (
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{booking.description}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
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
function CreateModal({ members, myId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "", startsAt: "", endsAt: "", location: "", description: "",
  });
  const [attendees, setAttendees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

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

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
  const box = { background: "#fff", borderRadius: 12, padding: "28px 32px", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" };
  const label = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 };
  const input = { width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>새 예약</h3>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>제목 *</label>
            <input style={input} value={form.title} onChange={e => set("title", e.target.value)} placeholder="회의 제목" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={label}>시작 시간 *</label>
              <input style={input} type="datetime-local" value={form.startsAt} onChange={e => set("startsAt", e.target.value)} />
            </div>
            <div>
              <label style={label}>종료 시간</label>
              <input style={input} type="datetime-local" value={form.endsAt} onChange={e => set("endsAt", e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>장소</label>
            <input style={input} value={form.location} onChange={e => set("location", e.target.value)} placeholder="회의실 A, 화상회의 등" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>설명</label>
            <textarea
              style={{ ...input, minHeight: 70, resize: "vertical" }}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="안건, 준비사항 등"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>참석자</label>
            <MemberPicker members={members} selected={attendees} onChange={setAttendees} myId={myId} />
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              padding: "8px 18px", border: "1px solid #e2e8f0", borderRadius: 6,
              background: "#fff", fontSize: 14, cursor: "pointer",
            }}>
              취소
            </button>
            <button type="submit" disabled={saving} style={{
              padding: "8px 18px", border: "none", borderRadius: 6,
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
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("upcoming"); // "upcoming" | "past"

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, mRes] = await Promise.all([
        portalApi.get("/bookings"),
        portalApi.get("/members"),
      ]);
      setBookings(bRes.data || []);
      setMyId(bRes.myId || mRes.myId || null);
      setMembers(mRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    setBookings(b => [booking, ...b]);
    setShowModal(false);
    setTab("upcoming");
  }

  const now = new Date();
  const upcoming = bookings.filter(b => !b.startsAt || new Date(b.startsAt.replace(" ", "T")) >= now);
  const past = bookings.filter(b => b.startsAt && new Date(b.startsAt.replace(" ", "T")) < now);
  const display = tab === "upcoming" ? upcoming : past;

  const tabStyle = (active) => ({
    padding: "6px 16px", border: "none", borderRadius: 20,
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
          myId={myId}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
