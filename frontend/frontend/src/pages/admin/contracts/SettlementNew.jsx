/**
 * 새 합의서 작성 — 관리자
 * - 본문을 텍스트로 작성 ({{sign:역할}} 플레이스홀더로 서명 위치 지정)
 * - 생성 후 상세 페이지로 이동 → 파티 추가 및 발송 진행
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../utils/api";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";

const DEFAULT_BODY = `합의서

아래 당사자들은 분쟁을 원만히 해결하기 위하여 다음과 같이 합의한다.

제1조 (합의의 대상)
본 합의의 대상은 [사건 내용]이며, 본 합의로써 관련 청구가 종결됨을 확인한다.

제2조 (합의금)
합의금은 [금액]원으로 하며, 지급 방법과 기일은 [내용]으로 한다.

제3조 (비밀유지)
본 합의의 내용은 법령에 의한 경우를 제외하고 외부에 공개하지 않는다.

제4조 (부제소)
당사자들은 본 합의 대상에 대해 향후 어떠한 민·형사상 청구나 고소·고발도 하지 않는다.


갑 (의뢰인): {{sign:의뢰인}}

을 (상대방): {{sign:상대방}}

대리인(법무법인 하이로): {{sign:변호사}}
`;

export default function AdminSettlementNew() {
  const [title, setTitle] = useState("합의서");
  const [body, setBody] = useState(DEFAULT_BODY);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/contract-templates").then((r) => {
      const ts = (r.data || []).filter(t => t.category === "settlement");
      setTemplates(ts);
    }).catch(() => {});
  }, []);

  async function loadTemplate(t) {
    const res = await api.get(`/contract-templates/${t.id}`);
    setTitle(t.title);
    try {
      const json = JSON.parse(res.data.content_json);
      setBody(extractPlainText(json));
    } catch { /* noop */ }
  }

  async function handleCreate() {
    if (!title.trim()) { setError("제목이 필요합니다"); return; }
    if (!body.trim()) { setError("본문이 필요합니다"); return; }
    setSaving(true);
    setError(null);
    try {
      const contentJson = buildJson(body);
      const contentHtml = buildHtml(body);
      const res = await api.post("/contracts", {
        type: "settlement",
        title,
        contentJson,
        contentHtml,
      });
      const contractId = res.data.contract.id;

      // 본문에서 추출한 역할들로 서명필드 생성
      const roles = Array.from(new Set(extractRoles(body)));
      for (const _role of roles) {
        await api.patch(`/contracts/${contractId}`, {
          // 필드 생성은 별도 API가 아직 없으므로 sqlite 직접 접근 대신
          // 에디터가 contentJson에 서명필드 노드를 이미 포함시킴 → 별도 처리 불필요
        });
      }
      // contentJson에 포함된 서명 필드를 contract_signature_fields 로 동기화
      await syncSignatureFields(contractId, body);

      navigate(`/admin/contracts/${contractId}`);
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">새 합의서 작성</h1>
          <p className="text-sm text-gray-500">본문에 {`{{sign:의뢰인}}`}, {`{{sign:상대방}}`}처럼 서명 위치를 지정하세요.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/contracts")}>취소</Button>
      </div>

      {templates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-medium text-amber-900">기존 양식에서 시작</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button key={t.id} onClick={() => loadTemplate(t)}
                className="rounded border border-amber-300 bg-white px-3 py-1 text-xs hover:bg-amber-100">
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-gray-600">제목</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-600">본문</label>
        <Textarea rows={22} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-sm" />
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/admin/contracts")}>취소</Button>
        <Button onClick={handleCreate} disabled={saving}>{saving ? "생성 중..." : "생성 → 서명자 등록"}</Button>
      </div>
    </div>
  );
}

function extractRoles(body) {
  const out = [];
  const regex = /\{\{sign:([^}]+)\}\}/g;
  let m;
  while ((m = regex.exec(body))) out.push(m[1]);
  return out;
}

function buildJson(text) {
  const lines = (text || "").split(/\n/);
  return {
    type: "doc",
    content: lines.map((line) => {
      if (!line.trim()) return { type: "paragraph" };
      const children = [];
      const regex = /\{\{sign:([^}]+)\}\}/g;
      let last = 0;
      let m;
      while ((m = regex.exec(line))) {
        if (m.index > last) children.push({ type: "text", text: line.slice(last, m.index) });
        children.push({
          type: "signatureField",
          attrs: {
            fieldKey: `sig-${m[1]}-${Math.random().toString(36).slice(2, 8)}`,
            role: mapRole(m[1]), label: m[1], required: true,
          },
        });
        last = m.index + m[0].length;
      }
      if (last < line.length) children.push({ type: "text", text: line.slice(last) });
      return { type: "paragraph", content: children };
    }),
  };
}

function buildHtml(text) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (text || "").split(/\n/).map((line) => {
    if (!line.trim()) return "<p></p>";
    return "<p>" + line.replace(/\{\{sign:([^}]+)\}\}/g, (_, role) => {
      const key = `sig-${role}-${Math.random().toString(36).slice(2, 8)}`;
      return `<signature-field data-role="${mapRole(role)}" data-label="${esc(role)}" data-required="1" data-field-key="${key}">${esc(role)}</signature-field>`;
    }) + "</p>";
  }).join("\n");
}

function mapRole(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("의뢰")) return "our_client";
  if (s.includes("변호")) return "lawyer";
  if (s.includes("대리")) return "counterparty_rep";
  if (s.includes("상대")) return "counterparty";
  if (s.includes("증인")) return "witness";
  return "counterparty";
}

function extractPlainText(json) {
  if (!json) return "";
  const lines = [];
  (json.content || []).forEach((node) => {
    if (node.type !== "paragraph") { lines.push(""); return; }
    let line = "";
    (node.content || []).forEach((c) => {
      if (c.type === "text") line += c.text || "";
      else if (c.type === "signatureField") line += `{{sign:${c.attrs?.label || c.attrs?.role || "서명"}}}`;
    });
    lines.push(line);
  });
  return lines.join("\n");
}

async function syncSignatureFields(contractId, body) {
  // 본문 내 {{sign:role}} 을 파싱해서 contract_signature_fields 테이블에 insert
  const roles = [];
  const regex = /\{\{sign:([^}]+)\}\}/g;
  let m, idx = 0;
  while ((m = regex.exec(body))) {
    roles.push({ label: m[1], role: mapRole(m[1]), orderIndex: idx++ });
  }
  // 백엔드는 contentJson 기반이지만, 필드 테이블에 미리 등록해둬야 서명/파티 매칭이 됨
  for (const r of roles) {
    await api.post(`/contracts/${contractId}/signature-fields`, {
      fieldKey: `sig-${r.label}-${Math.random().toString(36).slice(2, 8)}`,
      role: r.role,
      label: r.label,
      required: true,
      orderIndex: r.orderIndex,
    }).catch(() => {});
  }
}
