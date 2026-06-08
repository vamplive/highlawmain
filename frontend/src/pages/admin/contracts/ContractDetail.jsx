/**
 * 계약서 상세 — 관리자
 * - 좌측: 본문 렌더링 + 서명 필드 상태
 * - 우측: 서명자(파티) 패널, 감사로그 타임라인, 액션
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../utils/api";
import { Button } from "../../../components/ui/Button";
import SignatureDisplay from "../../../components/signature/SignatureDisplay";
import SignatureModal from "../../../components/signature/SignatureModal";
import ContractPartiesPanel from "../../../components/admin/ContractPartiesPanel";
import { generateContractPdf } from "../../../utils/contract-pdf";
import { escapeAttr, escapeHtml, escapeRegex, sanitizeContractHtml } from "../../../utils/contract-html";

const STATUS_LABELS = {
  draft: "초안", sent: "발송", partially_signed: "부분서명",
  completed: "완료", cancelled: "취소", expired: "만료",
};

/** contractId prop이 있으면 임베드 모드 — useParams 대신 prop 사용. onBack이 있으면 네비게이션 대신 콜백 호출. */
export default function AdminContractDetail({ contractId: propContractId, onBack }) {
  const params = useParams();
  const id = propContractId || params.id;
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signOpen, setSignOpen] = useState(false);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const bodyRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contracts/${id}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-6 text-gray-500">불러오는 중...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  const { contract, parties, fields, signatures, auditLogs } = data;

  async function handleLawyerSign(payload) {
    if (!payload?.imageData) return;
    try {
      await api.post(`/contracts/${contract.id}/lawyer-sign`, {
        signature: payload,
      });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleCancel() {
    const reason = prompt("취소 사유 (선택):") || null;
    await api.post(`/contracts/${contract.id}/cancel`, { reason });
    load();
  }

  async function handleSendAll() {
    if (!confirm("모든 서명자에게 링크를 발송할까요?")) return;
    await api.post(`/contracts/${contract.id}/send-all`, {});
    load();
  }

  async function handleGeneratePdf() {
    if (!bodyRef.current) return;
    setGeneratingPdf(true);
    try {
      const dataUri = await generateContractPdf(bodyRef.current, contract, parties, auditLogs);
      await api.post(`/contracts/${contract.id}/finalize-pdf`, { pdfDataUri: dataUri });
      alert("PDF가 생성되었습니다.");
      load();
    } catch (e) {
      alert(`PDF 생성 실패: ${e.message}`);
    } finally { setGeneratingPdf(false); }
  }

  function copyInviteLinks() {
    const lines = parties
      .filter((p) => p.role !== "lawyer")
      .map((p) => {
        // 마지막 발송된 invitation 찾기
        const last = (auditLogs || [])
          .filter((l) => l.party_id === p.id && l.action === "link_sent")
          .pop();
        return `${p.display_name}: ${last?.details ? JSON.parse(last.details).url || "-" : "-"}`;
      });
    alert(lines.join("\n"));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => onBack ? onBack() : navigate("/admin/contracts")} className="text-sm text-gray-500 hover:text-gray-800">← 목록</button>
          <div className="flex items-center gap-2">
            <span className={`rounded px-3 py-1 text-xs font-medium ${statusClass(contract.status)}`}>
              {STATUS_LABELS[contract.status] || contract.status}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{contract.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {contract.type === "settlement" ? "합의서" : "위임계약서"}
            {contract.completed_at && ` · 완료 ${contract.completed_at}`}
          </p>
          {contract.final_hash && (
            <p className="mt-1 text-xs text-gray-400 font-mono">해시: {contract.final_hash.slice(0, 24)}…</p>
          )}
        </div>

        <div ref={bodyRef} className="rounded-lg border border-gray-200 bg-white p-6">
          <ContractContent contentHtml={contract.content_html} fields={fields} signatures={signatures} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">서명 현황</h3>
          <div className="flex flex-wrap gap-4">
            {fields.map((f) => {
              const sig = signatures.find((s) => s.field_key === f.field_key);
              return (
                <div key={f.id} className="rounded border border-gray-200 p-3">
                  <p className="mb-1 text-xs font-medium text-gray-700">{f.label || f.role}</p>
                  <SignatureDisplay imageUrl={sig?.image_url} imageData={sig?.image_data_uri}
                    width={180} height={70}
                    meta={sig ? `${new Date(sig.signed_at + "Z").toLocaleString("ko-KR")} (${sig.pointer_type})` : "미서명"} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button onClick={() => setSignOpen(true)} disabled={contract.status === "cancelled"}>
            내가 서명 (변호사)
          </Button>
          <Button variant="outline" onClick={handleSendAll}>전체 서명 링크 발송</Button>
          <Button variant="outline" onClick={copyInviteLinks}>발송 링크 확인</Button>
          {contract.status !== "cancelled" && (
            <Button variant="destructive" onClick={handleCancel}>계약서 취소</Button>
          )}
          {contract.status === "completed" && !contract.final_pdf_url && (
            <Button onClick={handleGeneratePdf} disabled={generatingPdf}>
              {generatingPdf ? "PDF 생성 중..." : "최종 PDF 생성"}
            </Button>
          )}
          {contract.final_pdf_url && (
            <a href={contract.final_pdf_url} download className="inline-block">
              <Button variant="outline" className="w-full">최종 PDF 다운로드</Button>
            </a>
          )}
        </div>

        <ContractPartiesPanel contractId={contract.id} parties={parties} onReload={load} />

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">감사 로그</h3>
          </div>
          <ul className="max-h-[400px] overflow-y-auto p-3 space-y-2">
            {(auditLogs || []).map((log) => (
              <li key={log.id} className="text-xs text-gray-700 border-l-2 border-gray-200 pl-3">
                <div className="font-medium">{actionLabel(log.action)}</div>
                <div className="text-gray-500">
                  {log.actor_type}
                  {log.actor_identifier ? ` (${log.actor_identifier.slice(0, 8)})` : ""}
                  {log.ip_address && ` · ${log.ip_address}`}
                </div>
                <div className="text-gray-400">{fmt(log.created_at)}</div>
              </li>
            ))}
            {(!auditLogs || auditLogs.length === 0) && (
              <li className="text-xs text-gray-400 text-center py-3">로그 없음</li>
            )}
          </ul>
        </div>
      </div>

      <SignatureModal
        open={signOpen}
        title="변호사 서명"
        description="이 계약서에 법무법인 하이로 담당 변호사로서 서명합니다."
        onClose={() => setSignOpen(false)}
        onConfirm={handleLawyerSign}
      />
    </div>
  );
}

function statusClass(status) {
  const map = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    partially_signed: "bg-amber-100 text-amber-800",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100";
}

function actionLabel(a) {
  const m = {
    contract_created: "계약서 생성",
    contract_edited: "계약서 수정",
    party_added: "서명자 추가",
    party_removed: "서명자 제거",
    link_sent: "링크 발송",
    link_opened: "링크 열람",
    otp_requested: "인증번호 요청",
    otp_verified: "본인 확인 완료",
    otp_failed: "인증 실패",
    document_viewed: "문서 열람",
    field_signed: "서명 완료",
    party_completed: "서명자 완료",
    contract_completed: "계약 체결 완료",
    pdf_generated: "PDF 생성",
    pdf_downloaded: "PDF 다운로드",
    contract_cancelled: "취소",
    declined: "서명 거부",
  };
  return m[a] || a;
}

function fmt(s) {
  if (!s) return "-";
  try {
    const d = new Date(s + (s.includes("Z") ? "" : "Z"));
    return d.toLocaleString("ko-KR");
  } catch { return s; }
}

/** 계약서 본문을 HTML로 렌더링 + 서명 필드를 이미지로 치환 */
function ContractContent({ contentHtml, fields, signatures }) {
  if (!contentHtml) {
    return <p className="text-gray-500">본문이 없습니다.</p>;
  }
  // signature-field 태그를 관리자 뷰에서 시각적으로 표시
  let html = contentHtml;
  (fields || []).forEach((f) => {
    const sig = signatures.find((s) => s.field_key === f.field_key);
    const signatureSrc = escapeAttr(sig?.image_url || sig?.image_data_uri || "");
    const label = escapeHtml(f.label || f.role);
    const replacement = sig
      ? `<span class="inline-block border-b-2 border-gray-800 px-2"><img src="${signatureSrc}" alt="서명" style="height:32px;display:inline-block;vertical-align:middle;" /></span>`
      : `<span class="inline-block rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">[${label} 서명 대기]</span>`;
    const regex = new RegExp(`<signature-field[^>]*data-field-key=["']${escapeRegex(f.field_key)}["'][^>]*>[^<]*</signature-field>`, "gi");
    html = html.replace(regex, replacement);
  });
  // 데이터 속성으로 field_key가 없는 경우도 처리 (라벨 매칭)
  html = html.replace(/<signature-field[^>]*data-label=["']([^"']+)["'][^>]*>[^<]*<\/signature-field>/gi, (_, label) => {
    return `<span class="inline-block rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-0.5 text-xs">[${escapeHtml(label)}]</span>`;
  });
  html = sanitizeContractHtml(html);
  return <div className="contract-content prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />;
}
