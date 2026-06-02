/**
 * 관리자용 초대 발송 다이얼로그 — 공용
 * - 상담초대 / 위임계약서 / 합의서 링크 발송 모두에서 재사용
 * - 필드: 유형, 이름, 전화번호, 이메일, 채널(SMS/이메일), 만료일, 커스텀 SMS 본문
 * - 미리보기로 SMS 최종 내용 확인 후 발송
 */
import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

const TYPE_OPTIONS = [
  { value: "consultation", label: "상담 신청 링크" },
  { value: "engagement", label: "위임계약서 서명" },
  { value: "settlement", label: "합의서 서명" },
];

const DEFAULT_TEMPLATE_BY_TYPE = {
  consultation: "[법무법인 하이로] {name}님, 상담 신청 링크를 보내드립니다: {url} ({expires} 유효)",
  engagement: "[법무법인 하이로] {name}님, 위임계약서 서명을 요청드립니다: {url}",
  settlement: "[법무법인 하이로] {name}님, 합의서 서명을 요청드립니다. 본인 확인 후 서명해주세요: {url}",
};

export default function InviteSendDialog({
  open,
  onClose,
  defaultType = "consultation",
  defaultName = "",
  defaultPhone = "",
  defaultEmail = "",
  defaultCategory = "",
  targetRef,
  contractId,
  partyId,
  title = "링크 발송",
  onSent,
}) {
  const [type, setType] = useState(defaultType);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [category, setCategory] = useState(defaultCategory);
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [smsTemplate, setSmsTemplate] = useState(DEFAULT_TEMPLATE_BY_TYPE[defaultType]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setName(defaultName);
      setPhone(defaultPhone);
      setEmail(defaultEmail);
      setCategory(defaultCategory);
      setSmsTemplate(DEFAULT_TEMPLATE_BY_TYPE[defaultType]);
      setResult(null);
      setSendSms(true);
      setSendEmail(!!defaultEmail);
    }
  }, [open, defaultType, defaultName, defaultPhone, defaultEmail, defaultCategory]);

  useEffect(() => {
    setSmsTemplate(DEFAULT_TEMPLATE_BY_TYPE[type]);
  }, [type]);

  if (!open) return null;

  async function handleSend() {
    setResult(null);
    if (!name?.trim()) { setResult({ type: "error", msg: "이름이 필요합니다" }); return; }
    if (sendSms && !phone?.trim()) { setResult({ type: "error", msg: "SMS 발송 시 전화번호가 필요합니다" }); return; }
    if (sendEmail && !email?.trim()) { setResult({ type: "error", msg: "이메일 발송 시 이메일 주소가 필요합니다" }); return; }
    const channels = [];
    if (sendSms) channels.push("sms");
    if (sendEmail) channels.push("email");
    if (channels.length === 0) { setResult({ type: "error", msg: "최소 한 개 이상의 채널을 선택하세요" }); return; }

    setSending(true);
    try {
      const body = {
        type,
        name,
        phone: phone || undefined,
        email: email || undefined,
        category: type === "consultation" ? (category || undefined) : undefined,
        channels,
        expiresInDays: Number(expiresInDays) || 14,
        smsTemplate,
        targetRef,
        contractId,
        partyId,
      };
      const res = await api.post("/invitations", body);
      setResult({ type: "success", data: res.data });
      onSent?.(res.data);
    } catch (e) {
      setResult({ type: "error", msg: e.message || "발송 실패" });
    } finally {
      setSending(false);
    }
  }

  // 미리보기 본문 생성 (치환)
  const previewVars = {
    name: name || "홍길동",
    url: "https://yj.law/invite/{token}",
    expires: `${expiresInDays || 14}일`,
    firm: "법무법인 하이로",
  };
  const previewText = smsTemplate
    .replace(/\{name\}/g, previewVars.name)
    .replace(/\{url\}/g, previewVars.url)
    .replace(/\{expires\}/g, previewVars.expires)
    .replace(/\{firm\}/g, previewVars.firm);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="닫기" className="rounded p-1 text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">유형</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">이름</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">전화번호</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">이메일 (선택)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" type="email" />
            </div>
          </div>

          {type === "consultation" && (
            <div>
              <label className="mb-1 block text-xs text-gray-600">상담 분야 (선택)</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="민사 / 형사 / ..." />
            </div>
          )}

          <div className="flex items-center gap-4 rounded border border-gray-200 bg-gray-50 px-3 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
              SMS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              이메일
            </label>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">만료</span>
              <Input type="number" min="1" max="60" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} style={{ width: 70 }} />
              <span className="text-xs text-gray-500">일</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">SMS 본문 (플레이스홀더: {`{name}, {url}, {expires}, {firm}`})</label>
            <Textarea rows={3} value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} />
          </div>

          <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs">
            <p className="font-medium text-blue-900">미리보기</p>
            <p className="mt-1 text-blue-800">{previewText}</p>
          </div>

          {result?.type === "error" && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{result.msg}</div>
          )}
          {result?.type === "success" && (
            <div className="rounded border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              <p className="font-medium">✓ 발송 완료</p>
              <p className="mt-1 break-all">링크: {result.data?.invitation?.url}</p>
              {result.data?.smsResult && (
                <p className="mt-1">SMS: {result.data.smsResult.success ? "성공" : `실패 - ${result.data.smsResult.error}`}</p>
              )}
              {result.data?.emailResult && (
                <p className="mt-1">이메일: {result.data.emailResult.success ? "성공" : `실패 - ${result.data.emailResult.error}`}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button onClick={handleSend} disabled={sending}>{sending ? "발송 중..." : "발송"}</Button>
        </div>
      </div>
    </div>
  );
}
