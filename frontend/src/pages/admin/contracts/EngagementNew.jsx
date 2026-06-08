/**
 * 새 위임계약서 작성 — 관리자
 * - 의뢰인(갑) 선택 → 자동 채움
 * - 개별 조항 편집 + 하위 조항 추가/삭제
 * - 실시간 미리보기
 * - 생성 후 상세 페이지 → 변호사 서명 + 의뢰인 링크 발송
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../utils/api";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";

/* ── 승소가액 정의 선택지 ── */
const SUCCESS_DEFINITIONS = [
  {
    key: "default",
    label: "경제적 이익 총액 (표준)",
    description: "판결, 화해, 조정 등에 의하여 「갑」이 실질적으로 얻은 경제적 이익의 총액",
    text: "승소가액이란 판결, 화해, 조정 등에 의하여 「갑」이 실질적으로 얻은 경제적 이익의 총액을 의미한다.",
  },
  {
    key: "received",
    label: "실제 수령액 기준",
    description: "판결·화해·조정 후 「갑」이 실제로 수령(회수)한 금액",
    text: "승소가액이란 판결, 화해, 조정 등의 결과에 따라 「갑」이 실제로 수령(회수)한 금액을 의미한다.",
  },
  {
    key: "recognized",
    label: "인용(인정)금액 기준",
    description: "법원이 인용(인정)한 청구금액 — 실제 회수 여부와 무관",
    text: "승소가액이란 법원이 인용(인정)한 청구금액을 의미하며, 실제 회수 여부와 무관하다.",
  },
  {
    key: "reduced",
    label: "감액(방어) 기준 — 피고 측",
    description: "상대방 청구금액에서 실제 인용금액을 뺀 차액 (피고 방어 성공분)",
    text: "승소가액이란 상대방이 청구한 금액에서 법원이 최종 인용한 금액을 공제한 차액(방어 성공 금액)을 의미한다.",
  },
  {
    key: "custom",
    label: "직접 입력",
    description: "승소가액 정의를 직접 작성합니다",
    text: "",
  },
];

/* ── 사무소 고정 정보 ── */
const FIRM = {
  name: "법무법인 하이로",
  representative: "윤  세  환",
  address: "서울 서초구 서초대로 327, SH키움스퀘어 5층",
  tel: "02-594-5593",
  fax: "02-594-5584",
  email: "info@HIGHLAW.com",
  bankAccount: "우리은행   1005-604-257444  예금주  조덕재(법무법인 하이로)",
};

/* ── 표준 조항 (docx 원본 그대로) ── */
const DEFAULT_ARTICLES = [
  {
    id: 1, title: "수임의 범위",
    intro: "「갑」은 「을」에게 다음 사건의 처리(이하 「위임사무」라 한다)를 위임하고, 「을」은 이를 수임한다.",
    subs: [
      { key: "caseName", prefix: "사 건 명 :", value: "" },
      { key: "counterparty", prefix: "상 대 방 :", value: "" },
      { key: "court", prefix: "관할 법원 :", value: "" },
      { key: "scope", prefix: "위임사무의 내용 :", value: "" },
    ],
    useCaseFields: true,
  },
  {
    id: 2, title: "위임의 한계",
    intro: "「을」이 위임받는 사무의 범위는 해당 심급 및 본 사건에 한한다. 환송심, 상소의 제기 및 그 수행, 강제집행, 다른 보전처분, 이의신청 및 별소의 제기 등은 별개의 위임사무로 보아 별도의 위임계약을 체결한다.",
    subs: [],
  },
  {
    id: 3, title: "성실의무",
    intro: "",
    subs: [
      { key: "3-1", value: "「을」은 변호사법 및 위임의 본지에 따라 선량한 관리자의 주의로써 위임사무를 처리한다." },
      { key: "3-2", value: "「갑」은 위임사무의 처리에 필요한 자료의 제출, 사실관계의 진술, 조회에 대한 회신 등 협조의무를 성실히 이행하여야 한다." },
      { key: "3-3", value: "「갑」이 성실의무를 위반하거나 신뢰관계가 훼손되어 사건 수행에 장애가 발생한 경우, 「을」은 「갑」에게 상당한 기간을 정하여 그 시정을 요구할 수 있고, 그 기간 내에 시정되지 아니하는 때에는 본 위임계약을 해지할 수 있으며, 이로 인한 책임을 지지 아니한다." },
    ],
  },
  {
    id: 4, title: "보  수",
    intro: "",
    subs: [
      { key: "fee", prefix: "", value: "본 사건에 관한 착수보수는 금 {retainerFee}원(부가가치세 별도)으로 한다." },
      { key: "4-2", value: "착수보수의 지급시기는 본 계약 체결 시로 한다." },
      { key: "4-3", value: "「갑」은 착수보수 및 관련 비용을 다음의 보수계좌로 지급한다." },
    ],
    hasBankAccount: true,
  },
  {
    id: 5, title: "착수보수 지급의 지체",
    intro: "「갑」이 착수보수 또는 위임사무 처리에 필요한 비용 등의 지급을 지체하는 경우, 「을」은 위임사무에 착수하지 아니하거나 본 위임계약을 해제할 수 있다.",
    subs: [],
  },
  {
    id: 6, title: "착수보수의 반환",
    intro: "",
    subs: [
      { key: "6-1", value: "「갑」은 원칙적으로 「을」에게 지급한 착수보수의 반환을 청구할 수 없다." },
      { key: "6-2", value: "다만, 「을」이 위임사무에 전혀 착수하지 아니한 경우에는 착수보수 전액을, 일부 착수한 경우에는 그 진행 정도에 상응하는 금액을 공제한 잔액을 「갑」에게 반환한다." },
      { key: "6-3", value: "「을」의 개인적 사유로 위임사무를 처리할 수 없게 된 때에는 위 ②항에 준하여 반환한다." },
    ],
  },
  {
    id: 7, title: "성공보수",
    intro: "",
    subs: [
      { key: "success", value: "{successFee}" },
      { key: "7-2", value: "{successDefinition}" },
      { key: "7-3", value: "성공보수의 지급시기는 1심 판결 선고일로부터 2주 이내 또는 화해·조정 성립일로 한다." },
      { key: "7-4", value: "「갑」은 성공보수를 제4조 제3항의 보수계좌로 지급한다." },
    ],
  },
  {
    id: 8, title: "비용의 부담 및 정산",
    intro: "",
    subs: [
      { key: "8-1", value: "인지대, 송달료 등 법원 및 관계기관에 납부하여야 할 비용은 모두 「갑」이 부담한다." },
      { key: "8-2", value: "「을」이 위 비용을 부득이 선납한 경우, 「갑」은 「을」의 청구를 받은 날로부터 7일 이내에 이를 정산·지급하여야 한다." },
    ],
  },
  {
    id: 9, title: "계약 해지",
    intro: "「갑」이 본 위임계약상의 의무를 이행하지 아니하거나, 위임사무의 내용에 관하여 「갑」이 진술한 사실이 허위이거나 중요사항을 은폐한 것으로 밝혀진 때에는, 「을」은 본 계약을 해지하고 사임할 수 있다.",
    subs: [],
  },
  {
    id: 10, title: "통지의무",
    intro: "「을」은 위임사무 처리의 중요한 진행상황 및 그 결과를 「갑」에게 지체 없이 통지하며, 위임사무가 종료된 때에는 그 결과를 「갑」에게 신속히 통지하여야 한다.",
    subs: [],
  },
  {
    id: 11, title: "자료의 보관 및 폐기",
    intro: "「을」이 위임사무의 처리를 위하여 「갑」으로부터 제공받은 자료는 위임 종료 시 「갑」에게 수령할 것을 통지한 후 3개월 내에 별다른 의사표시가 없는 경우 「을」이 임의로 폐기할 수 있다.",
    subs: [],
  },
  {
    id: 12, title: "지급 보장",
    intro: "",
    subs: [
      { key: "12-1", value: "「을」은 본 계약에서 정한 비용 또는 보수의 지급을 확보하기 위하여 「갑」에게 필요한 조치를 요구할 수 있다." },
      { key: "12-2", value: "「갑」이 비용 또는 보수의 지급의무를 이행하지 아니하는 경우, 「을」은 위임사무의 처리를 위하여 보관하고 있는 금전, 문서 또는 자료 등을 유치하거나 사무처리를 거부할 수 있다." },
      { key: "12-3", value: "위 ②항의 경우, 「을」은 신속히 「갑」에게 그 취지를 통지하여야 한다." },
    ],
  },
  {
    id: 13, title: "인감의 사용",
    intro: "본 위임사무의 수행을 위하여 필요한 경우, 「을」은 「갑」으로부터 당사자의 인감을 교부받아 사용할 수 있다. 이 경우 「을」은 인감의 보관 및 사용내역을 「갑」에게 통지하여야 한다.",
    subs: [],
  },
  {
    id: 14, title: "비밀유지",
    intro: "「을」은 업무상 취득한 「갑」의 모든 비밀정보를 비밀로 유지하며, 업무수행의 범위를 벗어나거나 법령상 요구되는 경우를 제외하고는 「갑」의 동의 없이 이를 제3자에게 공개하여서는 아니 된다.",
    subs: [],
  },
  {
    id: 15, title: "광 고",
    intro: "「을」은 본 계약에 의한 위임사건을 「을」의 업무 실적 광고에 활용할 수 있다. 다만, 「갑」을 특정할 수 있는 정보는 공개하지 아니한다.",
    subs: [],
  },
  {
    id: 16, title: "관 할",
    intro: "본 계약으로 인하여 발생하는 일체의 분쟁에 관한 소송의 관할법원은 서울중앙지방법원으로 한다.",
    subs: [],
  },
  {
    id: 17, title: "민법과의 관계",
    intro: "본 위임계약서에 특별히 규정되어 있지 아니한 사항에 관하여는 민법상 위임에 관한 규정이 정하는 바에 따른다.",
    subs: [],
  },
];

/** onCancel/onCreated 콜백이 없으면 기존 라우트 동작 그대로 유지 */
export default function AdminEngagementNew({ onCancel, onCreated }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  /* 의뢰인(갑) 필드 */
  const [clientName, setClientName] = useState("");
  const [clientRrn, setClientRrn] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  /* 사건 기본 정보 */
  const [caseName, setCaseName] = useState("");
  const [caseDetail, setCaseDetail] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [court, setCourt] = useState("서울중앙지방법원");
  const [scopeDescription, setScopeDescription] = useState("");
  const [retainerFee, setRetainerFee] = useState("5,000,000");
  const [successType, setSuccessType] = useState("rate"); // "rate" | "fixed"
  const [successRate, setSuccessRate] = useState("4");
  const [customRate, setCustomRate] = useState("");
  const [successFixedAmount, setSuccessFixedAmount] = useState("");
  const [successDefinition, setSuccessDefinition] = useState("default");
  const [successDefinitionCustom, setSuccessDefinitionCustom] = useState("");
  const [stampDuty, setStampDuty] = useState("");

  /* 조항 편집 상태 — 딥 클론으로 초기화 */
  const [articles, setArticles] = useState(() => JSON.parse(JSON.stringify(DEFAULT_ARTICLES)));
  const [editingArticle, setEditingArticle] = useState(null);

  /* 특약사항 */
  const [specialTerms, setSpecialTerms] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  /* 의뢰인 목록 로드 */
  useEffect(() => {
    api.get("/clients?limit=500&is_active=1")
      .then((r) => setClients(r.data || []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 20);
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 20);
  }, [clients, clientSearch]);

  const selectClient = useCallback((c) => {
    setSelectedClient(c);
    setClientName(c.name || "");
    setClientPhone(formatPhone(c.phone || ""));
    setClientEmail(c.email || "");
    setClientAddress(c.address || "");
    setClientRrn(c.birthdate ? birthToRrn(c.birthdate) : "");
    setClientSearch("");
    setShowClientDropdown(false);
  }, []);

  /* 제목 자동 생성 */
  const title = useMemo(() => {
    const n = clientName || "___";
    const c = caseName || "위임계약서";
    return `위임계약서_${n}_${c}`;
  }, [clientName, caseName]);

  /* 조항 수정 */
  function updateArticle(articleId, field, value) {
    setArticles((prev) => prev.map((a) =>
      a.id === articleId ? { ...a, [field]: value } : a
    ));
  }

  function updateSub(articleId, subIdx, value) {
    setArticles((prev) => prev.map((a) => {
      if (a.id !== articleId) return a;
      const subs = [...a.subs];
      subs[subIdx] = { ...subs[subIdx], value };
      return { ...a, subs };
    }));
  }

  function addSub(articleId) {
    setArticles((prev) => prev.map((a) => {
      if (a.id !== articleId) return a;
      const newKey = `${a.id}-${a.subs.length + 1}`;
      return { ...a, subs: [...a.subs, { key: newKey, value: "" }] };
    }));
  }

  function removeSub(articleId, subIdx) {
    setArticles((prev) => prev.map((a) => {
      if (a.id !== articleId) return a;
      return { ...a, subs: a.subs.filter((_, i) => i !== subIdx) };
    }));
  }

  /* 계약서 생성 */
  async function handleCreate() {
    if (!clientName.trim()) { setError("위임인(갑) 이름을 입력하세요"); return; }
    if (!caseName.trim()) { setError("사건명을 입력하세요"); return; }

    setSaving(true);
    setError(null);
    try {
      /* 신규 의뢰인이면 clients 테이블에 먼저 등록 */
      let clientId = selectedClient?.id || null;
      if (!clientId && clientName.trim()) {
        const phone = clientPhone.replace(/\D/g, "");
        const newClient = await api.post("/clients", {
          name: clientName.trim(),
          phone: phone || undefined,
          email: clientEmail || undefined,
          source: "manual",
        }).catch(() => null);
        if (newClient?.data?.id) clientId = newClient.data.id;
      }

      const html = buildEngagementHtml({
        client: { name: clientName, rrn: clientRrn, address: clientAddress, phone: clientPhone },
        firm: FIRM, caseName, caseDetail, counterparty, court, scopeDescription,
        retainerFee, successType, successRate, customRate, successFixedAmount, successDefinition, successDefinitionCustom, stampDuty, specialTerms, articles,
      });
      const contentJson = buildEngagementJson(html);

      const res = await api.post("/contracts", {
        type: "engagement",
        title,
        contentJson,
        contentHtml: html,
        clientId,
      });
      const contractId = res.data.contract.id;

      /* 서명 필드 등록 */
      for (const sf of [
        { label: "위임인", role: "our_client", orderIndex: 0 },
        { label: "수임인", role: "lawyer", orderIndex: 1 },
      ]) {
        await api.post(`/contracts/${contractId}/signature-fields`, {
          fieldKey: `sig-${sf.label}-${Math.random().toString(36).slice(2, 8)}`,
          role: sf.role, label: sf.label, required: true, orderIndex: sf.orderIndex,
        }).catch(() => {});
      }

      /* 파티 자동 등록 */
      await api.post(`/contracts/${contractId}/parties`, {
        role: "our_client", displayName: clientName,
        phoneNumber: clientPhone.replace(/\D/g, ""),
        email: clientEmail || null, verificationLevel: 3, orderIndex: 0,
      }).catch(() => {});
      await api.post(`/contracts/${contractId}/parties`, {
        role: "lawyer", displayName: `${FIRM.name} 대표변호사 조덕재`,
        phoneNumber: "", verificationLevel: 1, orderIndex: 1,
      }).catch(() => {});

      if (onCreated) onCreated(contractId);
      else navigate(`/admin/contracts/${contractId}`);
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  /* 미리보기 HTML */
  const previewHtml = useMemo(() => buildEngagementHtml({
    client: { name: clientName, rrn: clientRrn, address: clientAddress, phone: clientPhone },
    firm: FIRM, caseName, caseDetail, counterparty, court, scopeDescription,
    retainerFee, successRate, stampDuty, specialTerms, articles,
  }), [clientName, clientRrn, clientAddress, clientPhone, caseName, caseDetail, counterparty, court, scopeDescription, retainerFee, successType, successRate, customRate, successFixedAmount, successDefinition, successDefinitionCustom, stampDuty, specialTerms, articles]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">새 위임계약서 작성</h1>
          <p className="text-sm text-gray-500">의뢰인을 선택하면 정보가 자동으로 채워집니다.</p>
        </div>
        <Button variant="outline" onClick={() => onCancel ? onCancel() : navigate("/admin/contracts")}>취소</Button>
      </div>

      {/* 의뢰인(갑) */}
      <Section title="위임인 (갑)">
        <div className="relative mb-3">
          <label className="mb-1 block text-xs text-gray-600">의뢰인 검색</label>
          <Input placeholder="이름 또는 전화번호로 검색..."
            value={clientSearch}
            onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
            onFocus={() => setShowClientDropdown(true)} />
          {showClientDropdown && filtered.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filtered.map((c) => (
                <li key={c.id} className="cursor-pointer px-3 py-2 text-sm hover:bg-amber-50 flex justify-between"
                  onClick={() => selectClient(c)}>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-gray-500">{formatPhone(c.phone || "")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedClient && (
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 mb-3">
            <strong>{selectedClient.name}</strong> 의뢰인 선택됨
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="이름" required><Input value={clientName} onChange={(e) => setClientName(e.target.value)} /></Field>
          <Field label="주민등록번호"><Input value={clientRrn} onChange={(e) => setClientRrn(e.target.value)} /></Field>
          <Field label="주소" className="md:col-span-2"><Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} /></Field>
          <Field label="전화번호"><Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} /></Field>
          <Field label="이메일"><Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></Field>
        </div>
      </Section>

      {/* 사건 정보 */}
      <Section title="사건 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="사건명" required><Input value={caseName} onChange={(e) => setCaseName(e.target.value)} /></Field>
          <Field label="사건 부가 설명"><Input value={caseDetail} onChange={(e) => setCaseDetail(e.target.value)} /></Field>
          <Field label="상대방"><Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} /></Field>
          <Field label="관할법원"><Input value={court} onChange={(e) => setCourt(e.target.value)} /></Field>
          <Field label="위임사무 내용 (제1조 ④)" className="md:col-span-2">
            <Textarea rows={2} value={scopeDescription} onChange={(e) => setScopeDescription(e.target.value)}
              />
          </Field>
        </div>
      </Section>

      {/* 보수 조건 */}
      <Section title="보수 조건">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="착수보수 (원, 부가세 별도)"><Input value={retainerFee} onChange={(e) => setRetainerFee(e.target.value)} /></Field>
          <Field label="인지대 (예상, 원)"><Input value={stampDuty} onChange={(e) => setStampDuty(e.target.value)} /></Field>
        </div>

        {/* 성공보수 유형 선택 */}
        <div className="mt-4">
          <label className="mb-2 block text-xs text-gray-600">성공보수 방식</label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setSuccessType("rate")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${successType === "rate" ? "bg-[var(--accent-gold)] text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              정률 (승소가액의 %)
            </button>
            <button type="button" onClick={() => setSuccessType("fixed")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${successType === "fixed" ? "bg-[var(--accent-gold)] text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              정액
            </button>
          </div>

          {successType === "rate" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="성공보수율 (승소가액의 %)">
                  <select value={successRate} onChange={(e) => setSuccessRate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]">
                    {[1,2,3,4,5,6,7,8,9,10,12,15,20].map((v) => (
                      <option key={v} value={String(v)}>{v}%</option>
                    ))}
                    <option value="custom">직접 입력</option>
                  </select>
                </Field>
                {successRate === "custom" && (
                  <Field label="직접 입력 (%)">
                    <Input value={customRate} onChange={(e) => setCustomRate(e.target.value)} />
                  </Field>
                )}
              </div>

              <Field label="승소가액의 정의 (제7조 ②항)">
                <div className="space-y-2 mt-1">
                  {SUCCESS_DEFINITIONS.map((def) => (
                    <label key={def.key} className={`flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                      successDefinition === def.key ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <input type="radio" name="successDef" value={def.key} checked={successDefinition === def.key}
                        onChange={() => setSuccessDefinition(def.key)}
                        className="mt-0.5 accent-amber-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{def.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{def.description}</p>
                      </div>
                    </label>
                  ))}
                  {successDefinition === "custom" && (
                    <Textarea rows={2} value={successDefinitionCustom} onChange={(e) => setSuccessDefinitionCustom(e.target.value)}
                      className="mt-1 text-sm" />
                  )}
                </div>
              </Field>
            </div>
          )}

          {successType === "fixed" && (
            <Field label="성공보수 금액 (원, 부가세 별도)">
              <Input value={successFixedAmount} onChange={(e) => setSuccessFixedAmount(e.target.value)} />
            </Field>
          )}
        </div>
      </Section>

      {/* 조항 편집 */}
      <Section title="계약 조항 편집">
        <p className="text-xs text-gray-500 mb-3">각 조항을 클릭하면 내용을 편집하고 하위 조항을 추가/삭제할 수 있습니다.</p>
        <div className="space-y-1">
          {articles.map((art) => (
            <ArticleEditor
              key={art.id}
              article={art}
              isEditing={editingArticle === art.id}
              onToggle={() => setEditingArticle(editingArticle === art.id ? null : art.id)}
              onUpdateIntro={(v) => updateArticle(art.id, "intro", v)}
              onUpdateTitle={(v) => updateArticle(art.id, "title", v)}
              onUpdateSub={(idx, v) => updateSub(art.id, idx, v)}
              onAddSub={() => addSub(art.id)}
              onRemoveSub={(idx) => removeSub(art.id, idx)}
            />
          ))}
        </div>
      </Section>

      {/* 특약사항 */}
      <Section title="특약사항">
        <Textarea rows={4} value={specialTerms} onChange={(e) => setSpecialTerms(e.target.value)}
          />
      </Section>

      {/* 미리보기 토글 */}
      <div className="flex justify-center">
        <button onClick={() => setShowPreview(!showPreview)} className="text-sm text-blue-600 hover:underline">
          {showPreview ? "미리보기 접기" : "계약서 미리보기 펼치기"}
        </button>
      </div>
      {showPreview && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 overflow-x-auto">
          <div style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,.08)", maxWidth: "100%", overflow: "hidden" }}
            dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => onCancel ? onCancel() : navigate("/admin/contracts")}>취소</Button>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? "생성 중..." : "위임계약서 생성 → 서명 진행"}
        </Button>
      </div>
    </div>
  );
}

/* ── 조항 편집기 ── */
function ArticleEditor({ article, isEditing, onToggle, onUpdateIntro, onUpdateTitle, onUpdateSub, onAddSub, onRemoveSub }) {
  const subCount = article.subs?.length || 0;
  const preview = article.intro
    ? article.intro.slice(0, 60) + (article.intro.length > 60 ? "…" : "")
    : (subCount > 0 ? `하위 조항 ${subCount}개` : "(내용 없음)");

  if (!isEditing) {
    return (
      <button onClick={onToggle}
        className="w-full text-left px-3 py-2 rounded border border-gray-100 hover:border-amber-300 hover:bg-amber-50 transition-colors">
        <span className="text-sm font-medium text-gray-900">제 {article.id} 조 &nbsp; [{article.title}]</span>
        <span className="ml-2 text-xs text-gray-500">{preview}</span>
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">제 {article.id} 조</span>
        <button onClick={onToggle} className="text-xs text-gray-500 hover:text-gray-800">접기</button>
      </div>

      <Field label="조항 제목">
        <Input value={article.title} onChange={(e) => onUpdateTitle(e.target.value)} />
      </Field>

      {!article.useCaseFields && (
        <Field label="본문 (항이 없는 경우)">
          <Textarea rows={3} value={article.intro} onChange={(e) => onUpdateIntro(e.target.value)} />
        </Field>
      )}

      {/* 하위 조항 목록 — 제1조(사건 필드)는 읽기전용 */}
      {!article.useCaseFields && article.subs.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs text-gray-600">하위 조항</label>
          {article.subs.map((sub, idx) => (
            <div key={sub.key} className="flex gap-2 items-start">
              <span className="mt-2 text-xs text-gray-500 w-6 shrink-0">{"①②③④⑤⑥⑦⑧⑨⑩"[idx] || `(${idx + 1})`}</span>
              <Textarea rows={2} value={sub.value}
                onChange={(e) => onUpdateSub(idx, e.target.value)}
                className="flex-1 text-sm" />
              <button onClick={() => onRemoveSub(idx)}
                className="mt-2 text-xs text-red-500 hover:text-red-700 shrink-0">삭제</button>
            </div>
          ))}
        </div>
      )}

      {!article.useCaseFields && (
        <button onClick={onAddSub}
          className="text-xs text-blue-600 hover:underline">
          + 하위 조항 추가
        </button>
      )}
    </div>
  );
}

/* ── UI 컴포넌트 ── */
function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, required, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── 유틸 ── */
function formatPhone(p) {
  const d = (p || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

function birthToRrn(b) {
  if (!b) return "";
  const d = b.replace(/\D/g, "");
  if (d.length >= 6) return `${d.slice(0, 6)}-*******`;
  return b;
}

function todayKr() {
  const d = new Date();
  return `${d.getFullYear()}년 &nbsp; &nbsp; ${d.getMonth() + 1}월 &nbsp; &nbsp; &nbsp; ${d.getDate()}일`;
}

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function spaceChars(str) {
  return (str || "").split("").join(" &nbsp; ");
}

/* 하위 조항 번호 */
const SUB_NUMS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮";

/**
 * 위임계약서 HTML 빌더
 * - docx 원본(위임계약서_박성재_투자금반환소송_260422.docx) 레이아웃을 완전 재현
 * - 표지 → 본문(당사자표 + 제1~17조 + 특약) → 서명란 순서
 */
function buildEngagementHtml({ client, firm, caseName, caseDetail, counterparty, court, scopeDescription, retainerFee, successType, successRate, customRate, successFixedAmount, successDefinition, successDefinitionCustom, stampDuty, specialTerms, articles }) {
  const clientNameSpaced = spaceChars(client.name || "___");
  const date = todayKr();

  /* 특약사항 */
  const defaultSpecial = [
    "1.  항소심, 상고심은 별도의 위임계약에 의한다.",
    stampDuty
      ? `2.  인지대(약 ${stampDuty}원), 송달료 등 법원 납부 비용은 「갑」이 별도로 부담한다.`
      : "2.  인지대, 송달료 등 법원 납부 비용은 「갑」이 별도로 부담한다.",
    "3.  본 계약서는 2부를 작성하여 「갑」과 「을」이 각 1부씩 보관한다.",
  ];
  const specials = specialTerms?.trim() ? specialTerms.split("\n").filter(Boolean) : defaultSpecial;

  /* 스타일 변수 */
  const S = {
    wrap: "font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;max-width:100%;margin:0 auto;color:#1a1a1a;line-height:1.85;font-size:10.5pt;box-sizing:border-box",
    cover: "background:#fff;padding:60px 36px 48px;margin-bottom:2px",
    body: "background:#fff;padding:48px 36px 40px",
    eng: "font-family:'Times New Roman',Georgia,serif",
    gold: "#9e8054",
  };

  /* 실제 성공보수율 값 */
  const actualRate = successRate === "custom" ? (customRate || "___") : successRate;

  /* 성공보수 ①항 텍스트 — 정률 vs 정액 */
  const successFeeText = successType === "fixed"
    ? `성공보수는 금 ${successFixedAmount || "___"}원(부가가치세 별도)으로 한다.`
    : `성공보수는 승소가액의 ${actualRate}%로 한다.`;

  /* 승소가액 정의 텍스트 (정률일 때만 사용) */
  const successDefText = (() => {
    if (successType === "fixed") return "";
    const def = SUCCESS_DEFINITIONS.find((d) => d.key === successDefinition);
    if (!def) return SUCCESS_DEFINITIONS[0].text;
    if (def.key === "custom") return successDefinitionCustom || "___";
    return def.text;
  })();

  /* 조문 변환 — 플레이스홀더 치환 */
  function resolveSub(text) {
    return esc(text || "")
      .replace(/\{retainerFee\}/g, esc(retainerFee || "___"))
      .replace(/\{successRate\}/g, esc(actualRate))
      .replace(/\{successFee\}/g, esc(successFeeText))
      .replace(/\{successDefinition\}/g, esc(successDefText));
  }

  /* 조항 HTML 생성 */
  function renderArticles() {
    return articles.map((art) => {
      let html = `\n  <p style="font-weight:700;margin:28px 0 8px">제 ${art.id} 조 &nbsp; [${esc(art.title)}]</p>\n`;

      /* 제1조: 사건 정보 필드 사용 */
      if (art.useCaseFields) {
        html += `  <p style="margin:0 0 8px">${esc(art.intro)}</p>\n`;
        html += `  <p style="margin:0 0 4px;padding-left:1.5em">① &nbsp; 사 건 명 : &nbsp; ${esc(caseName)}${caseDetail ? ` (${esc(caseDetail)})` : ""}</p>\n`;
        html += `  <p style="margin:0 0 4px;padding-left:1.5em">② &nbsp; 상 대 방 : &nbsp; ${esc(counterparty || "___")}</p>\n`;
        html += `  <p style="margin:0 0 4px;padding-left:1.5em">③ &nbsp; 관할 법원 : &nbsp; ${esc(court || "___")}</p>\n`;
        html += `  <p style="margin:0 0 4px;padding-left:1.5em">④ &nbsp; 위임사무의 내용 : &nbsp; ${esc(scopeDescription || "소장 작성 및 제출, 준비서면 작성, 변론기일 출석 및 변론, 증거 수집·제출, 감정 신청, 화해·조정 교섭 등 1심 판결 선고에 이르기까지의 일체의 소송 업무")}</p>\n`;
        return html;
      }

      /* 본문(intro)만 있는 조항 */
      if (art.intro && art.subs.length === 0) {
        html += `  <p style="margin:0 0 4px">${esc(art.intro)}</p>\n`;
        return html;
      }

      /* intro + 하위조항 */
      if (art.intro) {
        html += `  <p style="margin:0 0 8px">${esc(art.intro)}</p>\n`;
      }
      art.subs.forEach((sub, idx) => {
        const num = SUB_NUMS[idx] || `(${idx + 1})`;
        const resolved = resolveSub(sub.value);
        if (!resolved) return; // 정액 방식 시 승소가액 정의 등 빈 항목 건너뜀
        html += `  <p style="margin:0 0 4px;padding-left:1.5em">${num} &nbsp; ${resolved}</p>\n`;
      });

      /* 보수계좌 표시 (제4조) */
      if (art.hasBankAccount) {
        html += `  <p style="margin:8px 0 4px;padding-left:1.5em;font-weight:700">보수계좌 &nbsp; &nbsp; ${esc(firm.bankAccount)}</p>\n`;
      }

      return html;
    }).join("");
  }

  return `
<div style="${S.wrap}">

<!-- ═══════════ 표지 ═══════════ -->
<div style="${S.cover}">
  <div style="text-align:center;padding:24px 0 16px">
    <p style="${S.eng};font-size:13pt;letter-spacing:10px;font-weight:700;margin:0;color:#1a1a1a">Y O U N J E O N G &nbsp; L A W &nbsp; O F F I C E</p>
    <p style="font-size:10.5pt;letter-spacing:7px;margin:6px 0 0;color:#555">윤 정 법 률 사 무 소</p>
  </div>

  <div style="border-top:2px solid ${S.gold};border-bottom:1px solid #ccc;margin:28px 0;padding:20px 0;text-align:center">
    <p style="${S.eng};font-size:9pt;letter-spacing:5px;color:#888;margin:0 0 6px">ENGAGEMENT &nbsp; LETTER</p>
    <p style="font-size:20pt;font-weight:700;letter-spacing:6px;margin:0">위 임 계 약 서</p>
    <p style="${S.eng};font-size:8pt;color:#999;margin:6px 0 0">— &nbsp; ATTORNEY &nbsp; RETAINER &nbsp; AGREEMENT &nbsp; —</p>
  </div>

  <div style="text-align:center;margin:36px 0 12px">
    <p style="${S.eng};font-size:8.5pt;letter-spacing:4px;color:#999;margin:0">R E :</p>
    <p style="font-size:14pt;font-weight:700;margin:12px 0 4px">${esc(caseName || "___")}</p>
    ${caseDetail ? `<p style="font-size:9.5pt;color:#555;margin:0">(${esc(caseDetail)})</p>` : ""}
  </div>

  <div style="text-align:center;margin:36px 0;line-height:2.2">
    <p style="${S.eng};font-size:8.5pt;letter-spacing:4px;color:#999;margin:0">B E T W E E N</p>
    <p style="font-size:14pt;font-weight:700;margin:14px 0">${clientNameSpaced}</p>
    <p style="${S.eng};font-size:8.5pt;letter-spacing:4px;color:#999;margin:0">A N D</p>
    <p style="font-size:14pt;font-weight:700;margin:14px 0">윤 정 법 률 사 무 소</p>
    <p style="font-size:10.5pt;margin:2px 0">대표변호사 &nbsp; 윤 &nbsp; 세 &nbsp; 환</p>
  </div>

  <div style="text-align:center;margin:40px 0 0;${S.eng};font-size:9pt;letter-spacing:5px;color:#999">
    S E O U L &nbsp; &nbsp; · &nbsp; &nbsp; 2 0 ${String(new Date().getFullYear()).slice(2).split("").join(" ")}
  </div>
</div>

<!-- ═══════════ 본문 ═══════════ -->
<div style="${S.body}">

  <div style="text-align:center;margin:0 0 28px">
    <p style="font-size:16pt;font-weight:700;letter-spacing:5px;margin:0 0 4px">위 임 계 약 서</p>
    <p style="${S.eng};font-size:8.5pt;letter-spacing:3px;color:#888;margin:0">ATTORNEY &nbsp; RETAINER &nbsp; AGREEMENT</p>
  </div>

  <!-- 당사자 표 -->
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:10pt;border:1.5px solid #333;table-layout:fixed;word-break:break-word">
    <tr>
      <td style="width:108px;padding:14px 12px;border:1px solid #999;font-weight:700;vertical-align:top;text-align:center;background:#f7f6f4">위임인 (갑)</td>
      <td style="padding:14px 16px;border:1px solid #999;line-height:1.9">
        <p style="margin:0 0 4px;font-weight:700;font-size:11pt">${esc(client.name || "___")}</p>
        ${client.rrn ? `<p style="margin:0 0 3px">주민등록번호 &nbsp; ${esc(client.rrn)}</p>` : ""}
        ${client.address ? `<p style="margin:0 0 3px">${esc(client.address)}</p>` : ""}
        ${client.phone ? `<p style="margin:0">전화 &nbsp; ${esc(client.phone)}</p>` : ""}
      </td>
    </tr>
    <tr>
      <td style="width:108px;padding:14px 12px;border:1px solid #999;font-weight:700;vertical-align:top;text-align:center;background:#f7f6f4">수임인 (을)</td>
      <td style="padding:14px 16px;border:1px solid #999;line-height:1.9">
        <p style="margin:0 0 4px;font-weight:700;font-size:11pt">${esc(firm.name)}</p>
        <p style="margin:0 0 3px">대표변호사 &nbsp; ${esc(firm.representative)}</p>
        <p style="margin:0 0 3px">${esc(firm.address)}</p>
        <p style="margin:0 0 3px">전화 &nbsp; ${esc(firm.tel)} &nbsp; &nbsp; &nbsp; 팩스 &nbsp; ${esc(firm.fax)}</p>
        <p style="margin:0">이메일 &nbsp; ${esc(firm.email)}</p>
      </td>
    </tr>
  </table>

  <p style="margin:20px 0 24px;text-indent:1em">위 위임인(이하 「갑」이라 한다)과 수임인(이하 「을」이라 한다)은 아래 사건의 처리에 관하여 다음과 같이 위임계약을 체결한다.</p>

  <!-- 조항 -->
${renderArticles()}

  <div style="border-top:1px solid #ccc;margin:36px 0 20px"></div>

  <p style="font-weight:700;font-size:11pt;letter-spacing:3px;margin:0 0 12px">특 &nbsp; 약 &nbsp; 사 &nbsp; 항</p>
${specials.map((s) => `  <p style="margin:0 0 6px">${esc(s)}</p>`).join("\n")}

  <p style="margin:36px 0 0;text-align:center;font-size:11pt">${date}</p>

  <!-- 서명란 -->
  <table style="width:100%;border-collapse:collapse;margin:36px 0 0;font-size:10pt;border:1.5px solid #333;table-layout:fixed;word-break:break-word">
    <tr>
      <td style="width:50%;padding:20px;border:1px solid #999;vertical-align:top">
        <p style="margin:0 0 10px;font-weight:700;font-size:10.5pt">위 임 인 &nbsp; (갑)</p>
        <p style="margin:0 0 6px;font-weight:700;font-size:11pt">${esc(client.name || "___")}</p>
        ${client.address ? `<p style="margin:0 0 4px;font-size:9pt;color:#444">${esc(client.address)}</p>` : ""}
        ${client.phone ? `<p style="margin:0 0 16px;font-size:9pt;color:#444">${esc(client.phone)}</p>` : "<p style='margin:0 0 16px'></p>"}
        <p style="margin:0"><signature-field data-role="our_client" data-label="위임인" data-required="1" data-field-key="sig-위임인">서명 / 인</signature-field></p>
      </td>
      <td style="width:50%;padding:20px;border:1px solid #999;vertical-align:top">
        <p style="margin:0 0 10px;font-weight:700;font-size:10.5pt">수 임 인 &nbsp; (을)</p>
        <p style="margin:0 0 6px;font-weight:700;font-size:11pt">${esc(firm.name)}</p>
        <p style="margin:0 0 4px;font-size:9pt;color:#444">대표변호사 &nbsp; ${esc(firm.representative)}</p>
        <p style="margin:0 0 4px;font-size:9pt;color:#444">${esc(firm.address)}</p>
        <p style="margin:0 0 16px;font-size:9pt;color:#444">T. ${esc(firm.tel)} &nbsp; &nbsp; F. ${esc(firm.fax)}</p>
        <p style="margin:0"><signature-field data-role="lawyer" data-label="수임인" data-required="1" data-field-key="sig-수임인">서명 / 인</signature-field></p>
      </td>
    </tr>
  </table>

</div>
</div>
`.trim();
}

/* content_json — HTML 기반 문서이므로 최소 JSON 구조 */
function buildEngagementJson(_html) {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "[위임계약서 — HTML 기반 문서]" }] }],
    _htmlSource: true,
  });
}
