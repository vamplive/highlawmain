/**
 * 포털(의뢰인) 계약서 상세/서명 페이지
 * - 본인 계약서를 읽고, 필요한 서명 필드를 진행한다
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { escapeAttr, escapeHtml, escapeRegex, sanitizeContractHtml } from "../../utils/contract-html";

async function portalFetch(path) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "요청 실패");
  return json;
}

export default function PortalContractSign() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    portalFetch(`/contracts/portal/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-gray-500">불러오는 중...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  const { contract, fields, signatures, parties } = data;

  return (
    <div className="p-6 space-y-4">
      <Link to="/portal/contracts" className="text-sm text-gray-500 hover:text-gray-800">← 내 계약서</Link>
      <h1 className="text-2xl font-semibold text-gray-900">{contract.title}</h1>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
        <p className="font-medium text-blue-900">서명 진행 상황</p>
        <ul className="mt-2 space-y-1 text-blue-800">
          {(parties || []).map((p) => (
            <li key={p.id}>• {p.display_name} ({p.role}) — {p.status}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ContractPreview html={contract.content_html} fields={fields} signatures={signatures} />
      </div>

      {contract.final_pdf_url && (
        <a href={contract.final_pdf_url} download className="inline-block rounded bg-[#3b6ea5] px-4 py-2 text-sm text-white">
          서명 완료된 PDF 다운로드
        </a>
      )}

      {contract.status !== "completed" && contract.status !== "cancelled" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          추가 서명이 필요하면 사무실에서 안내드린 문자 링크를 통해 진행해주세요.
        </div>
      )}
    </div>
  );
}

function ContractPreview({ html, fields, signatures }) {
  if (!html) return <p className="text-gray-500">본문이 없습니다.</p>;
  let rendered = html;
  (fields || []).forEach((f) => {
    const sig = signatures.find((s) => s.field_key === f.field_key);
    const signatureSrc = escapeAttr(sig?.image_url || sig?.image_data_uri || "");
    const label = escapeHtml(f.label || f.role);
    const repl = sig
      ? `<span class="inline-block border-b-2 border-gray-800 px-2"><img src="${signatureSrc}" alt="서명" style="height:32px;vertical-align:middle" /></span>`
      : `<span class="inline-block rounded border border-dashed border-gray-400 bg-gray-50 px-2 py-0.5 text-xs">[${label} 서명 대기]</span>`;
    const regex = new RegExp(`<signature-field[^>]*data-field-key=["']${escapeRegex(f.field_key)}["'][^>]*>[^<]*</signature-field>`, "gi");
    rendered = rendered.replace(regex, repl);
  });
  rendered = rendered.replace(/<signature-field[^>]*data-label=["']([^"']+)["'][^>]*>[^<]*<\/signature-field>/gi,
    (_, label) => `<span class="inline-block rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-0.5 text-xs">[${escapeHtml(label)}]</span>`);
  rendered = sanitizeContractHtml(rendered);
  return <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
