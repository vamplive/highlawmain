/**
 * 포털 메시지 페이지 내 전자계약서 탭
 * - 목록 / 상세 / 새 위임계약서 / 새 합의서 를 페이지 이동 없이 탭 내부에서 처리
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { Button } from "../../../components/ui/Button";
import AdminContractDetail from "../contracts/ContractDetail";
import AdminEngagementNew from "../contracts/EngagementNew";
import AdminSettlementNew from "../contracts/SettlementNew";
import { Link } from "react-router-dom";

const TABS = [
  { value: "all", label: "전체" },
  { value: "engagement", label: "위임계약서" },
  { value: "settlement", label: "합의서" },
];

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  partially_signed: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS = {
  draft: "초안",
  sent: "발송",
  partially_signed: "부분서명",
  completed: "완료",
  cancelled: "취소",
  expired: "만료",
};

/** 현재 서브뷰: list | detail | new-engagement | new-settlement */
export default function ContractsTab() {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [typeTab, setTypeTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const qs = typeTab === "all" ? "" : `?type=${typeTab}`;
      const res = await api.get(`/contracts${qs}`);
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [typeTab]);

  useEffect(() => {
    if (view === "list") loadList();
  }, [view, loadList]);

  function openDetail(id) {
    setSelectedId(id);
    setView("detail");
  }

  function backToList() {
    setSelectedId(null);
    setView("list");
  }

  function handleCreated(contractId) {
    setSelectedId(contractId);
    setView("detail");
  }

  if (view === "new-engagement") {
    return (
      <AdminEngagementNew
        onCancel={backToList}
        onCreated={handleCreated}
      />
    );
  }

  if (view === "new-settlement") {
    return (
      <AdminSettlementNew
        onCancel={backToList}
        onCreated={handleCreated}
      />
    );
  }

  if (view === "detail" && selectedId) {
    return (
      <AdminContractDetail
        contractId={selectedId}
        onBack={backToList}
      />
    );
  }

  /* 목록 뷰 */
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">전자계약서</h2>
          <p className="text-sm text-gray-500">위임계약서, 합의서를 발행하고 서명 진행을 추적합니다.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/contract-templates" target="_blank">
            <Button variant="outline" size="sm">양식 관리</Button>
          </Link>
          <Button size="sm" onClick={() => setView("new-engagement")}>새 위임계약서</Button>
          <Button variant="outline" size="sm" onClick={() => setView("new-settlement")}>새 합의서</Button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeTab(t.value)}
            className={`px-4 py-2 text-sm font-medium ${typeTab === t.value ? "border-b-2 border-[#3b6ea5] text-[#2e588a]" : "text-gray-500 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">제목</th>
              <th className="px-4 py-3 text-left">유형</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">생성일</th>
              <th className="px-4 py-3 text-left">완료일</th>
              <th className="px-4 py-3 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                계약서가 없습니다. 새 위임계약서 또는 합의서를 작성하세요.
              </td></tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => openDetail(r.id)}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {r.type === "engagement" ? "위임계약서" : r.type === "settlement" ? "합의서" : r.type}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[r.status] || "bg-gray-100"}`}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmt(r.created_at)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmt(r.completed_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => { e.stopPropagation(); openDetail(r.id); }}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmt(s) {
  if (!s) return "-";
  try {
    const d = new Date(s + (s.includes("Z") ? "" : "Z"));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return s; }
}
