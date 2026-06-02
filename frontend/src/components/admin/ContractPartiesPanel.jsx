/**
 * 계약서 파티(서명자) 관리 패널 — 관리자
 * - N명 추가/수정/삭제
 * - 개별 링크 발송 / 전체 발송
 */
import { useState } from "react";
import { api } from "../../utils/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

const ROLES = [
  { value: "our_client", label: "의뢰인" },
  { value: "lawyer", label: "변호사" },
  { value: "counterparty", label: "상대방" },
  { value: "counterparty_rep", label: "상대방 대리인" },
  { value: "witness", label: "증인" },
];

const VERIFICATION_LEVELS = [
  { value: 1, label: "L1 - 링크만" },
  { value: 3, label: "L3 - SMS OTP (권장)" },
  { value: 4, label: "L4 - OTP + 이름·생일 매칭" },
];

const STATUS_LABELS = {
  pending: "대기",
  verified: "인증완료",
  signed: "서명완료",
  declined: "거부",
  expired: "만료",
};

export default function ContractPartiesPanel({ contractId, parties, onReload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [sending, setSending] = useState({});

  async function handleAdd(payload) {
    await api.post(`/contracts/${contractId}/parties`, payload);
    setShowAdd(false);
    onReload?.();
  }
  async function handleDelete(partyId) {
    if (!confirm("이 파티를 삭제할까요?")) return;
    await api.delete(`/contracts/${contractId}/parties/${partyId}`);
    onReload?.();
  }
  async function handleSend(partyId, channels) {
    setSending((s) => ({ ...s, [partyId]: true }));
    try {
      const body = channels ? { channels } : {};
      const res = await api.post(`/contracts/${contractId}/parties/${partyId}/send`, body);
      const channelLabel = channels ? channels.join(" + ") : "등록된 모든 채널";
      alert(`발송 완료 (${channelLabel})\n링크: ${res.data.invitation.url}`);
      onReload?.();
    } catch (e) {
      alert(`발송 실패: ${e.message}`);
    } finally {
      setSending((s) => ({ ...s, [partyId]: false }));
    }
  }
  async function handleSendAll() {
    if (!confirm("모든 파티에게 서명 링크를 발송할까요?")) return;
    await api.post(`/contracts/${contractId}/send-all`, {});
    alert("발송 요청이 처리되었습니다.");
    onReload?.();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="font-semibold text-gray-900">서명자 관리</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSendAll}>전체 발송</Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>+ 서명자 추가</Button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {(!parties || parties.length === 0) && (
          <div className="px-4 py-6 text-center text-sm text-gray-400">아직 서명자가 없습니다.</div>
        )}
        {parties?.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{p.display_name}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {ROLES.find((r) => r.value === p.role)?.label || p.role}
                </span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  L{p.verification_level}
                </span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {p.phone_number || "-"}{p.email ? ` / ${p.email}` : ""}
                {p.legal_name && ` | ${p.legal_name}`}
                {p.birthdate && ` (${p.birthdate})`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {p.role !== "lawyer" && p.status !== "signed" && p.status !== "declined" && (
                <>
                  {p.phone_number && (
                    <button onClick={() => handleSend(p.id, ["sms"])}
                      disabled={sending[p.id]}
                      title={`SMS 링크 발송 → ${p.phone_number}`}
                      className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                      📱 SMS
                    </button>
                  )}
                  {p.email && (
                    <button onClick={() => handleSend(p.id, ["email"])}
                      disabled={sending[p.id]}
                      title={`이메일 링크 발송 → ${p.email}`}
                      className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      ✉️ 이메일
                    </button>
                  )}
                  {p.phone_number && p.email && (
                    <button onClick={() => handleSend(p.id)}
                      disabled={sending[p.id]}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                      둘다
                    </button>
                  )}
                </>
              )}
              <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600 hover:underline">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddPartyDialog onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}

function AddPartyDialog({ onClose, onSave }) {
  const [role, setRole] = useState("counterparty");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verificationLevel, setVerificationLevel] = useState(3);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!displayName) { alert("이름이 필요합니다"); return; }
    setSaving(true);
    try {
      await onSave({ role, displayName, legalName, birthdate, phoneNumber, email, verificationLevel });
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold">서명자 추가</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-600">역할</label>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">표시 이름</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="홍길동" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">인증 수준</label>
            <Select value={verificationLevel} onChange={(e) => setVerificationLevel(Number(e.target.value))}>
              {VERIFICATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
          </div>
          {verificationLevel >= 4 && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-600">법적 이름 (매칭용)</label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">생년월일 (YYYY-MM-DD)</label>
                <Input value={birthdate} onChange={(e) => setBirthdate(e.target.value)} placeholder="1990-01-01" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-600">휴대폰</label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="010-1234-5678" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">이메일 (선택)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "저장 중..." : "추가"}</Button>
        </div>
      </div>
    </div>
  );
}
