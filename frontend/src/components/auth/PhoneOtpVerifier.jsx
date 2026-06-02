/**
 * 휴대폰 OTP 인증 컴포넌트 (공용)
 * - 단계: 번호 확인 → OTP 발송 → 6자리 입력 → 검증 성공
 * - 서명 요청, 로그인, 계약 접근 등 다양한 곳에서 재사용 가능
 * - onVerified(verificationId, meta) 콜백으로 상위에 완료 통보
 *
 * 요청 API 시그니처 (상위에서 주입):
 *   requestFn(phone) → { verificationId, sentTo, expiresAt }
 *   verifyFn(verificationId, code, { verifiedName? }) → { ok, reason }
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const RESEND_COOLDOWN_SEC = 60;
const OTP_LENGTH = 6;

export default function PhoneOtpVerifier({
  displayPhone,         // 표시용(마스킹) "010-****-1234"
  defaultPhone,         // 실제 발송 대상 (관리자 사전 등록한 값)
  requireNameBirth,     // L4: 이름·생년월일 매칭 요구
  requestFn,
  verifyFn,
  onVerified,
  className = "",
}) {
  const [step, setStep] = useState("landing"); // landing | sent | verified
  const [verificationId, setVerificationId] = useState(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const startCooldown = () => setCooldown(RESEND_COOLDOWN_SEC);

  async function handleRequest() {
    setError(null);
    setLoading(true);
    try {
      const res = await requestFn(defaultPhone);
      setVerificationId(res.verificationId);
      setStep("sent");
      startCooldown();
    } catch (e) {
      setError(e.message || "인증번호 발송에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e?.preventDefault?.();
    setError(null);
    if (code.length !== OTP_LENGTH) { setError(`${OTP_LENGTH}자리 인증번호를 입력하세요`); return; }
    if (requireNameBirth && (!name.trim() || !birthdate.trim())) {
      setError("이름과 생년월일을 입력하세요");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyFn(verificationId, code, {
        verifiedName: name.trim() || undefined,
        birthdate: birthdate.trim() || undefined,
      });
      if (res && res.ok !== false) {
        setStep("verified");
        onVerified?.(verificationId, { name, birthdate });
      } else {
        setError(res?.reason || "인증번호가 일치하지 않습니다");
      }
    } catch (e) {
      setError(e.message || "인증 처리에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (step === "verified") {
    return (
      <div className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}>
        <p className="text-sm font-medium text-green-800">✓ 본인 확인이 완료되었습니다</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-5 ${className}`}>
      <h3 className="text-base font-semibold text-gray-900">본인 확인</h3>
      <p className="mt-1 text-sm text-gray-500">
        등록된 번호 <span className="font-mono text-gray-800">{displayPhone}</span> 로 인증번호를 보내드립니다.
      </p>

      {step === "landing" && (
        <div className="mt-4">
          <Button onClick={handleRequest} disabled={loading}>
            {loading ? "발송 중..." : "인증번호 받기"}
          </Button>
        </div>
      )}

      {step === "sent" && (
        <form onSubmit={handleVerify} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">인증번호 6자리</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
              placeholder="000000"
              className="font-mono text-lg tracking-widest"
            />
          </div>

          {requireNameBirth && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-600">이름</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">생년월일 (YYYY-MM-DD)</label>
                <Input value={birthdate} onChange={(e) => setBirthdate(e.target.value)} placeholder="1990-01-01" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRequest}
              disabled={cooldown > 0 || loading}
              className="text-xs text-gray-500 underline disabled:text-gray-300 disabled:no-underline"
            >
              {cooldown > 0 ? `재발송 (${cooldown}초)` : "재발송"}
            </button>
            <Button type="submit" disabled={loading || code.length !== OTP_LENGTH}>
              {loading ? "확인 중..." : "인증번호 확인"}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
