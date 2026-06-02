/**
 * 관리자 초대 현황 페이지 — 발송된 상담/위임/합의 링크 모아보기
 * - 타입별 탭, 상태 뱃지, 재발송/취소 액션
 * - 상담 안내 문구 복사 (레퍼럴 링크 + 클릭 추적)
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { Button } from "../../../components/ui/Button";
import InviteSendDialog from "../../../components/admin/InviteSendDialog";
import { PageHeader } from "../../../components/admin";
import { showToast } from "../../../utils/showToast";

const TABS = [
  { value: "all", label: "전체" },
  { value: "consultation", label: "상담초대" },
  { value: "engagement", label: "위임계약서" },
  { value: "settlement", label: "합의서" },
];

const STATUS_COLORS = {
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  sent: "발송",
  opened: "열람",
  completed: "완료",
  expired: "만료",
  cancelled: "취소",
};

const TYPE_LABELS = {
  consultation: "상담초대",
  engagement: "위임",
  settlement: "합의",
};

export default function AdminInvitations() {
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [error, setError] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = tab === "all" ? "" : `?type=${tab}`;
      const res = await api.get(`/invitations${qs}`);
      setRows(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function handleResend(id) {
    if (!confirm("이 초대를 재발송할까요?")) return;
    try {
      await api.post(`/invitations/${id}/resend`, {});
      showToast("재발송 완료");
      load();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function handleCancel(id) {
    if (!confirm("취소하면 해당 링크로 접속할 수 없게 됩니다. 진행할까요?")) return;
    try {
      await api.post(`/invitations/${id}/cancel`, {});
      load();
    } catch (e) {
      showToast(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="발송 링크 현황"
        subtitle="상담 신청 · 위임계약서 · 합의서 초대 링크를 한 곳에서 관리합니다."
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            상담 안내 문구 복사
          </Button>
          <Button onClick={() => setSendOpen(true)}>새 초대 발송</Button>
        </div>
      </PageHeader>

      {/* 상담 안내 문구 복사 패널 */}
      {shareOpen && <ReferralSharePanel onClose={() => setShareOpen(false)} />}

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.value ? "border-b-2 border-[#3b6ea5] text-[#2e588a]" : "text-gray-500 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">유형</th>
              <th className="px-4 py-3 text-left">대상</th>
              <th className="px-4 py-3 text-left">연락처</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">발송일</th>
              <th className="px-4 py-3 text-left">만료일</th>
              <th className="px-4 py-3 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">발송된 초대가 없습니다</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{TYPE_LABELS[r.type] || r.type}</td>
                <td className="px-4 py-3 text-gray-900">{r.prefilled_name || "-"}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {r.prefilled_phone || ""}{r.prefilled_email ? ` / ${r.prefilled_email}` : ""}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[r.status] || "bg-gray-100"}`}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmt(r.sent_at || r.created_at)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmt(r.expires_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {r.status !== "cancelled" && r.status !== "completed" && (
                      <button onClick={() => handleResend(r.id)} className="text-xs text-blue-600 hover:underline">재발송</button>
                    )}
                    {r.status !== "cancelled" && (
                      <button onClick={() => handleCancel(r.id)} className="text-xs text-red-600 hover:underline">취소</button>
                    )}
                    <button
                      onClick={() => copyInviteLink(r.token)}
                      className="text-xs text-gray-600 hover:underline"
                    >링크복사</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteSendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSent={() => { setSendOpen(false); load(); }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────
 * 상담 안내 문구 복사 패널 (레퍼럴 링크 + 클릭 통계)
 * ──────────────────────────────────────────── */
function ReferralSharePanel({ onClose }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");

  const loadLinks = useCallback(async () => {
    try {
      const res = await api.get("/referral-links");
      setLinks(res.data || []);
    } catch { /* 무시 */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function createLink() {
    setCreating(true);
    try {
      await api.post("/referral-links", { label: label || "상담 안내" });
      setLabel("");
      await loadLinks();
      showToast("새 추적 링크가 생성되었습니다");
    } catch (e) {
      showToast(e.message, "error");
    }
    setCreating(false);
  }

  async function deactivateLink(id) {
    if (!confirm("이 링크를 비활성화할까요?")) return;
    try {
      await api.delete(`/referral-links/${id}`);
      await loadLinks();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function buildShareUrl(code) {
    return `${window.location.origin}/r/${code}`;
  }

  function buildMessage(code) {
    const url = buildShareUrl(code);
    return `[법무법인 하이로] 법률 상담 안내

안녕하세요, 법무법인 하이로입니다.

경험이 풍부한 변호사가 1:1 맞춤 상담을 도와드립니다. 아래 링크를 통해 간편하게 상담을 신청하실 수 있습니다.

${url}

- 서초대로 327, 5층 (교대역 4번 출구 도보 200m)
- 전화 상담: 준비 중
- 카카오톡 상담: "법무법인 하이로" 검색

감사합니다.`;
  }

  function copyMessage(code) {
    const msg = buildMessage(code);
    navigator.clipboard?.writeText(msg);
    showToast("상담 안내 문구가 복사되었습니다");
  }

  function copyLinkOnly(code) {
    navigator.clipboard?.writeText(buildShareUrl(code));
    showToast("링크가 복사되었습니다");
  }

  const activeLinks = links.filter((l) => l.is_active);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">상담 안내 문구 공유</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            추적 링크를 생성하고, 안내 문구를 복사하여 지인에게 전달하세요. 클릭 수가 자동으로 집계됩니다.
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      {/* 새 링크 생성 */}
      <div className="mb-4 flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600">링크 별칭 (선택)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 김철수 소개, 네이버카페, 블로그 등"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <button
          onClick={createLink}
          disabled={creating}
          className="rounded bg-[#3b6ea5] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e588a] disabled:opacity-50"
        >
          {creating ? "생성 중..." : "추적 링크 생성"}
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}

      {/* 기존 링크 목록 */}
      {activeLinks.length > 0 && (
        <div className="space-y-3">
          {activeLinks.map((link) => (
            <div key={link.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{link.label || "상담 안내"}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-500">{link.code}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>총 클릭 <strong className="text-blue-700">{link.total_clicks || 0}</strong>회</span>
                    <span>방문자 <strong className="text-green-700">{link.unique_visitors || 0}</strong>명</span>
                    {link.last_clicked_at && (
                      <span>마지막 클릭: {fmt(link.last_clicked_at)}</span>
                    )}
                    <span>생성: {fmt(link.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => copyMessage(link.code)}
                    className="rounded bg-[#3b6ea5] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2e588a]"
                  >
                    문구 복사
                  </button>
                  <button
                    onClick={() => copyLinkOnly(link.code)}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    링크만 복사
                  </button>
                  <button
                    onClick={() => deactivateLink(link.id)}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    비활성화
                  </button>
                </div>
              </div>

              {/* 문구 미리보기 */}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">문구 미리보기</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-700 leading-relaxed border border-gray-100">
                  {buildMessage(link.code)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {!loading && activeLinks.length === 0 && (
        <p className="text-sm text-gray-400">아직 생성된 추적 링크가 없습니다. 위에서 새로 만들어보세요.</p>
      )}
    </div>
  );
}

function fmt(s) {
  if (!s) return "-";
  try {
    const d = new Date(s + (s.includes("Z") ? "" : "Z"));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return s; }
}

function copyInviteLink(token) {
  const url = `${window.location.origin}/invite/${token}`;
  navigator.clipboard?.writeText(url);
  showToast("링크가 복사되었습니다");
}
