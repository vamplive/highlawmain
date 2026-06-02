/**
 * 초대 진입 공통 페이지 — /invite/:token
 * - 토큰 메타 조회 → 타입(type)에 따라 적절한 페이지로 리다이렉트
 *   - consultation → /invite/:token/consultation (상담 신청 폼)
 *   - engagement   → /sign/:token               (서명 페이지, 위임계약서)
 *   - settlement   → /sign/:token               (서명 페이지, 합의서)
 * - 만료/취소된 링크는 안내 화면
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinner from "../../components/ui/Spinner";

export default function InviteEntryPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!token) { setError("유효하지 않은 링크입니다"); return; }
      (async () => {
        try {
          const res = await fetch(`/api/public/invite/${encodeURIComponent(token)}`);
          const json = await res.json();
          if (cancelled) return;
          if (!res.ok) { setError(json?.error || "링크를 불러올 수 없습니다"); return; }
          const type = json.data?.type;
          if (type === "consultation") {
            navigate(`/invite/${encodeURIComponent(token)}/consultation`, { replace: true });
          } else if (type === "engagement" || type === "settlement") {
            navigate(`/sign/${encodeURIComponent(token)}`, { replace: true });
          } else {
            setError("알 수 없는 초대 유형입니다");
          }
        } catch {
          if (!cancelled) setError("링크를 불러올 수 없습니다");
        }
      })();
    });
    return () => { cancelled = true; };
  }, [token, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-semibold text-gray-900">링크를 열 수 없습니다</h1>
          <p className="mt-3 text-sm text-gray-600">{error}</p>
          <p className="mt-5 text-xs text-gray-400">법무법인 하이로</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size={40} label="링크 확인 중" />
    </div>
  );
}
