/**
 * 외부 상대방 서명 페이지 — /sign/:token
 * 3단계 UX:
 *   1) 랜딩: 안내 + "인증번호 받기"
 *   2) OTP 입력: 6자리 + (L4는 이름·생일 추가)
 *   3) 문서 열람 + 서명
 * Layout 없는 풀스크린 집중 모드
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import SignatureModal from "../../components/signature/SignatureModal";
import PhoneOtpVerifier from "../../components/auth/PhoneOtpVerifier";
import { escapeAttr, escapeHtml, escapeRegex, sanitizeContractHtml } from "../../utils/contract-html";

const BASE = "/api/public/sign";

function getCsrf() {
  const m = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}
async function request(method, path, body) {
  const opts = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  const csrf = getCsrf();
  if (csrf) opts.headers["x-csrf-token"] = csrf;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

export default function ExternalSignPage() {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("verify"); // verify | document | completed
  const [doc, setDoc] = useState(null);
  const [devCode, setDevCode] = useState(null);
  const [signingField, setSigningField] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    request("GET", `/${encodeURIComponent(token)}`)
      .then((r) => {
        if (cancelled) return;
        setMeta(r.data);
        if (r.data.alreadySigned) setStep("completed");
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const loadDocument = useCallback(async () => {
    const r = await request("GET", `/${encodeURIComponent(token)}/document`);
    setDoc(r.data);
    setStep("document");
  }, [token]);

  async function handleOtpRequest() {
    const r = await request("POST", `/${encodeURIComponent(token)}/verify/request-otp`, {});
    if (r.data?.devCode) setDevCode(r.data.devCode);
    return r.data;
  }

  async function handleOtpVerify(verificationId, code, extras) {
    const r = await request("POST", `/${encodeURIComponent(token)}/verify/submit-otp`, {
      verificationId, code, ...extras,
    });
    await loadDocument();
    return r.data;
  }

  async function handleSignSubmit(fieldKey, payload) {
    await request("POST", `/${encodeURIComponent(token)}/sign`, {
      fieldKey, signature: payload,
    });
    await loadDocument();
    setSigningField(null);
  }

  async function handleSubmitAll() {
    const remaining = (doc?.mySignFields || []).filter((f) => f.required && !f.signature_id).length;
    if (remaining > 0) { alert(`아직 ${remaining}개의 필수 서명이 남아있습니다.`); return; }
    setStep("completed");
  }

  async function handleDecline() {
    const reason = prompt("서명을 거부하는 사유를 입력하세요 (선택)");
    if (reason === null) return;
    await request("POST", `/${encodeURIComponent(token)}/decline`, { reason });
    alert("서명이 거부되었습니다.");
    setStep("completed");
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner size={40} /></div>;

  if (error) return <FullscreenMessage title="링크를 열 수 없습니다" message={error} />;

  if (!meta) return null;

  if (step === "completed") {
    return (
      <FullscreenMessage
        title="완료되었습니다"
        message="서명이 완료되었습니다. 모든 당사자의 서명이 끝나면 이메일로 최종본을 보내드립니다."
        success
        token={token}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white">
      {/* 모바일에서도 잘 보이는 sticky 헤더 — safe-area 대응 */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-500">법무법인 하이로</p>
            <h1 className="truncate text-[15px] font-semibold text-gray-900 sm:text-lg">{meta.contractTitle || "전자서명 요청"}</h1>
          </div>
          <span className="shrink-0 rounded bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 sm:text-xs">
            {meta.invitationType === "settlement" ? "합의서" : meta.invitationType === "engagement" ? "위임계약서" : "상담신청"}
          </span>
        </div>
        {step === "document" && doc && (
          <div className="px-4 pb-2">
            <ProgressBar fields={doc.mySignFields} />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {step === "verify" && (
          <div className="mx-auto max-w-md">
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[15px] sm:text-sm">
              <p className="font-medium text-amber-900">{meta.displayName}님께 요청된 서명입니다.</p>
              <p className="mt-1 text-amber-800">본인 확인을 위해 휴대폰 인증을 진행해주세요.</p>
            </div>
            {devCode && (
              <div className="mb-3 rounded border border-orange-300 bg-orange-50 p-2 text-xs text-orange-800">
                [개발 모드] 인증번호: <code className="font-mono text-base font-bold">{devCode}</code>
              </div>
            )}
            <PhoneOtpVerifier
              displayPhone={meta.phoneLast4 ? `010-****-${meta.phoneLast4}` : "등록 번호"}
              requireNameBirth={meta.requireNameBirth}
              requestFn={handleOtpRequest}
              verifyFn={handleOtpVerify}
              onVerified={() => { /* 문서 로딩은 verify에서 이미 수행 */ }}
            />
          </div>
        )}

        {step === "document" && doc && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-8">
              <DocumentView
                contract={doc.contract}
                fields={doc.fields}
                mySignFields={doc.mySignFields}
                signatures={doc.signatures}
                onClickField={(field) => setSigningField(field)}
                myRole={doc.party.role}
              />
            </div>

            {/* 모바일: 하단 sticky 액션 바, 데스크톱: 일반 배치 */}
            <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
              <button onClick={handleDecline} className="min-h-[44px] text-sm text-red-600 hover:underline">서명 거부</button>
              <Button onClick={handleSubmitAll} className="min-h-[44px] min-w-[140px]">모든 서명 제출</Button>
            </div>
          </div>
        )}
      </main>

      <SignatureModal
        open={!!signingField}
        title={`${signingField?.label || "서명"} 입력`}
        description="압력·기울기·속도까지 기록되어 위변조가 불가능합니다."
        onClose={() => setSigningField(null)}
        onConfirm={(payload) => signingField && handleSignSubmit(signingField.field_key, payload)}
      />
    </div>
  );
}

function ProgressBar({ fields }) {
  const total = (fields || []).filter((f) => f.required).length;
  const done = (fields || []).filter((f) => f.required && f.signature_id).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span>내 서명 진행</span>
        <span className="font-medium">{done} / {total}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-[#3b6ea5] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DocumentView({ contract, fields, mySignFields, signatures, onClickField, myRole }) {
  let html = contract.contentHtml || "";
  (fields || []).forEach((f) => {
    const sig = signatures.find((s) => s.field_key === f.field_key);
    const isMine = f.role === myRole;
    const id = `signfield-${escapeAttr(f.field_key)}`;
    const fieldKey = escapeAttr(f.field_key);
    const label = escapeHtml(f.label || "");
    let replacement;
    if (sig) {
      const signatureSrc = escapeAttr(sig.image_url || sig.image_data_uri || "");
      replacement = `<span id="${id}" class="yj-sig-done">
        <img src="${signatureSrc}" alt="서명" />
      </span>`;
    } else if (isMine) {
      replacement = `<button type="button" id="${id}" class="yj-sig-empty" data-field-key="${fieldKey}">여기에 서명 ${label}</button>`;
    } else {
      replacement = `<span id="${id}" class="yj-sig-other">${escapeHtml(f.label || "상대 서명 대기")}</span>`;
    }
    const regex = new RegExp(`<signature-field[^>]*data-field-key=["']${escapeRegex(f.field_key)}["'][^>]*>[^<]*</signature-field>`, "gi");
    html = html.replace(regex, replacement);
  });
  // 잔여 signature-field (field_key 없음) 안전 치환
  html = html.replace(/<signature-field[^>]*data-label=["']([^"']+)["'][^>]*>[^<]*<\/signature-field>/gi,
    (_, label) => `<span class="yj-sig-other">${escapeHtml(label)}</span>`);
  html = sanitizeContractHtml(html);

  const containerRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      const btn = e.target.closest("button.yj-sig-empty");
      if (!btn) return;
      const key = btn.getAttribute("data-field-key");
      const field = mySignFields.find((f) => f.field_key === key);
      if (field) onClickField(field);
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [mySignFields, onClickField]);

  return (
    <>
      <style>{`
        .yj-doc { font-size: 17px; line-height: 1.85; color: #1a1f2c; word-break: keep-all; }
        @media (min-width: 640px) { .yj-doc { font-size: 16px; } }
        .yj-doc p { margin: 0 0 14px; }
        .yj-sig-done { display: inline-block; border-bottom: 2px solid #1a1f2c; padding: 2px 6px; vertical-align: middle; }
        .yj-sig-done img { height: 44px; display: inline-block; vertical-align: middle; }
        .yj-sig-empty {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 48px; min-width: 160px;
          padding: 6px 16px; margin: 4px 0;
          background: #fffbeb; border: 2px dashed #f59e0b; color: #92400e;
          border-radius: 6px; font-size: 14px; font-weight: 600;
          cursor: pointer; -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .yj-sig-empty:active { background: #fef3c7; transform: scale(0.98); }
        .yj-sig-empty::before { content: "✍️ "; margin-right: 4px; }
        .yj-sig-other {
          display: inline-block; padding: 4px 10px;
          background: #f3f4f6; border: 1px dashed #d1d5db; color: #6b7280;
          border-radius: 4px; font-size: 13px;
        }
      `}</style>
      <div ref={containerRef} className="yj-doc whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

function FullscreenMessage({ title, message, success, token }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${success ? "bg-green-100" : "bg-gray-100"}`}>
          <span className={`text-2xl ${success ? "text-green-600" : "text-gray-500"}`}>{success ? "✓" : "!"}</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
        {success && token && (
          <a href={`/api/public/sign/${encodeURIComponent(token)}/download-pdf`}
            className="mt-5 inline-block rounded bg-[#3b6ea5] px-4 py-2 text-sm text-white">
            서명된 계약서 다운로드
          </a>
        )}
        <p className="mt-5 text-xs text-gray-400">법무법인 하이로</p>
      </div>
    </div>
  );
}
