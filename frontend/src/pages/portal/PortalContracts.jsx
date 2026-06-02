/**
 * 포털(의뢰인) 계약서 목록 페이지
 * - 본인에게 연결된 모든 계약서를 상태별로 표시
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STATUS_LABELS = {
  draft: "준비중",
  sent: "서명 대기",
  partially_signed: "일부 서명",
  completed: "완료",
  cancelled: "취소됨",
};

async function portalFetch(path) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "요청 실패");
  return json;
}

export default function PortalContracts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    portalFetch("/contracts/portal/mine")
      .then((r) => setRows(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">내 계약서</h1>
      {loading && <p className="text-gray-500">불러오는 중...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-gray-500">연결된 계약서가 없습니다.</p>
      )}
      <div className="space-y-2">
        {rows.map((c) => (
          <Link key={c.id} to={`/portal/contracts/${c.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-[#3b6ea5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500">{c.type === "engagement" ? "위임계약서" : c.type === "settlement" ? "합의서" : c.type}</p>
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{STATUS_LABELS[c.status] || c.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
