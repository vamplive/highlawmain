/**
 * 공개 수신거부 페이지 — URL의 token 쿼리로 수신동의 상태 조회/업데이트
 * - 관리자 인증 없이 접근 가능
 * - SMS/이메일 각각 on/off 가능
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../utils/api";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("잘못된 접근입니다. 링크의 토큰을 확인해주세요.");
      setLoading(false);
      return;
    }
    api.get(`/clients/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => setInfo(res.data))
      .catch((e) => setError(e.message || "수신거부 정보를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, [token]);

  const toggle = async (field) => {
    if (!info || saving) return;
    const next = !info[field];
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await api.post("/clients/unsubscribe", { token, [field]: next });
      setInfo((prev) => ({ ...prev, ...res.data }));
      setSavedMessage("저장되었습니다");
    } catch (e) {
      setError(e.message || "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const unsubscribeAll = async () => {
    if (!info || saving) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await api.post("/clients/unsubscribe", {
        token, smsConsent: false, emailConsent: false,
      });
      setInfo((prev) => ({ ...prev, ...res.data }));
      setSavedMessage("모든 마케팅 수신이 중단되었습니다");
    } catch (e) {
      setError(e.message || "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={h1}>수신거부 관리</h1>
        <p style={desc}>법무법인 하이로에서 발송하는 안내 메시지의 수신 여부를 관리합니다.</p>

        {loading && <div style={{ textAlign: "center", padding: 20 }}>불러오는 중...</div>}

        {error && !info && (
          <div style={errorBox}>⚠ {error}</div>
        )}

        {info && (
          <>
            <div style={identityBox}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>수신자</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{info.nameInitial}</div>
              {info.phoneMasked && <div style={meta}>📞 {info.phoneMasked}</div>}
              {info.emailMasked && <div style={meta}>✉️ {info.emailMasked}</div>}
            </div>

            {savedMessage && <div style={savedBox}>✓ {savedMessage}</div>}
            {error && <div style={errorBox}>⚠ {error}</div>}

            <div style={{ marginTop: 20 }}>
              <ConsentRow
                icon="💬"
                label="SMS 문자 수신"
                enabled={info.smsConsent}
                onToggle={() => toggle("smsConsent")}
                disabled={saving}
              />
              <ConsentRow
                icon="✉️"
                label="이메일 수신"
                enabled={info.emailConsent}
                onToggle={() => toggle("emailConsent")}
                disabled={saving}
              />
            </div>

            <button
              onClick={unsubscribeAll}
              disabled={saving || (!info.smsConsent && !info.emailConsent)}
              style={{
                ...unsubBtn,
                opacity: (saving || (!info.smsConsent && !info.emailConsent)) ? 0.5 : 1,
                cursor: (saving || (!info.smsConsent && !info.emailConsent)) ? "not-allowed" : "pointer",
              }}
            >
              모든 수신 거부
            </button>

            <p style={footerNote}>
              법률 상담 관련 필수 안내(상담 접수/예약 확인 등)는 수신거부와 별개로 발송될 수 있습니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ConsentRow({ icon, label, enabled, onToggle, disabled }) {
  return (
    <div style={rowStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          ...toggleBtn,
          background: enabled ? "#27ae60" : "#bbb",
        }}
        aria-pressed={enabled}
      >
        <span style={{
          ...toggleKnob,
          transform: enabled ? "translateX(22px)" : "translateX(2px)",
        }} />
      </button>
    </div>
  );
}

const wrap = {
  minHeight: "60vh",
  padding: "40px 20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  background: "#f7f6f2",
};
const card = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  borderRadius: 12,
  padding: "32px 28px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
};
const h1 = { fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 8, color: "#1a1a1a" };
const desc = { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.6 };
const identityBox = {
  padding: 14,
  background: "#f7f6f2",
  borderRadius: 8,
  border: "1px solid #eee",
};
const meta = { fontSize: 13, color: "#666", marginTop: 3 };
const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 4px",
  borderBottom: "1px solid #f0f0f0",
};
const toggleBtn = {
  position: "relative",
  width: 48,
  height: 26,
  borderRadius: 13,
  border: "none",
  cursor: "pointer",
  transition: "background 0.2s",
  padding: 0,
};
const toggleKnob = {
  position: "absolute",
  top: 2,
  left: 0,
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#fff",
  transition: "transform 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
const unsubBtn = {
  marginTop: 24,
  width: "100%",
  padding: "12px",
  border: "1px solid #c0392b",
  background: "#fff",
  color: "#c0392b",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
};
const savedBox = {
  marginTop: 12,
  padding: "10px 12px",
  background: "#e8f8ef",
  color: "#27ae60",
  borderRadius: 6,
  fontSize: 13,
};
const errorBox = {
  marginTop: 12,
  padding: "10px 12px",
  background: "#fdecea",
  color: "#c0392b",
  borderRadius: 6,
  fontSize: 13,
};
const footerNote = {
  marginTop: 20,
  fontSize: 12,
  color: "#999",
  lineHeight: 1.5,
  textAlign: "center",
};
