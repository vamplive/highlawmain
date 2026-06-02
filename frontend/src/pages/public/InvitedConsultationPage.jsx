/**
 * 초대 토큰으로 진입한 상담 신청 페이지 — /invite/:token/consultation
 * - 토큰에서 사전 채움 값(이름, 전화, 분야) 받아 폼 자동 입력
 * - 제출 시 invitationToken 함께 전달 → 백엔드가 invitation completed 처리
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinner from "../../components/ui/Spinner";
import ConsultationForm from "../consultation/ConsultationForm";

export default function InvitedConsultationPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/invite/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(json?.error || "링크를 불러올 수 없습니다"); setLoading(false); return; }
        setMeta(json.data);
      } catch {
        if (!cancelled) setError("링크를 불러올 수 없습니다");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner size={40} /></div>;
  if (error) return <ErrorView message={error} />;

  const initialValues = {
    name: meta?.prefilledName || "",
    phone: meta?.prefilledPhone ? "" : "",  // 마스킹된 값은 표시만, 사용자가 직접 입력
    category: meta?.category || "general",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            법무법인 하이로에서 보내드린 상담 신청 링크입니다.
          </p>
          {meta?.prefilledPhone && (
            <p className="mt-1 text-xs text-amber-800">등록된 번호 {meta.prefilledPhone} 로 안내드렸습니다.</p>
          )}
        </div>
        <ConsultationForm invitationToken={token} initialValues={initialValues} />
      </div>
    </div>
  );
}

function ErrorView({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-xl font-semibold text-gray-900">링크를 열 수 없습니다</h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
