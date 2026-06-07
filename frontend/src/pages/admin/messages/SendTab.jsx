/**
 * 메시지 발송 탭 오케스트레이터 — 단계형 발송 흐름.
 * 받는 사람(좌) → 메시지 + 발송(우) 2열 레이아웃.
 * 상태 관리·중복 체크·발송/예약 트리거만 담당하고
 * UI는 SendRecipientPanel · SendComposerPanel · SendActionPanel에,
 * API 호출은 sendDispatch에 위임.
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";
import { getByteLength } from "../../../utils/formatters";
import DuplicateWarningModal from "./DuplicateWarningModal";
import SendRecipientPanel from "./SendRecipientPanel";
import SendComposerPanel from "./SendComposerPanel";
import SendActionPanel from "./SendActionPanel";
import { scheduleMessages, sendMessages, checkDuplicates } from "./sendDispatch";
import useMediaQuery from "../../../hooks/useMediaQuery";

const SCHEDULE_MIN_LEAD_MS = 30 * 1000;

export default function SendTab() {
  const isMobile = useMediaQuery("(max-width: 899px)");
  const [channel, setChannel] = useState("sms");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [recipientSource, setRecipientSource] = useState("clients");
  const [recipientList, setRecipientList] = useState([]);
  const [recipientLoading, setRecipientLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [clientFilter, setClientFilter] = useState("");
  const [segmentCount, setSegmentCount] = useState(0);

  // 직접 입력 모드 상태
  const [manualRecipients, setManualRecipients] = useState([]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingDuplicates, setPendingDuplicates] = useState(null);
  const [sendMode, setSendMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");

  // 채널 변경 시 해당 채널의 템플릿 재조회
  useEffect(() => {
    const url = channel === "both"
      ? "/messages/templates"
      : `/messages/templates?channel=${channel}`;
    api.get(url).then((j) => setTemplates(j.data ?? [])).catch(() => setTemplates([]));
  }, [channel]);

  // 수신자 출처 변경 시 목록 재조회 (세그먼트·직접 입력은 수동 트리거)
  useEffect(() => {
    setSelectedClients(new Set());
    if (recipientSource === "segment") {
      setRecipientList([]); setSegmentCount(0); setRecipientLoading(false); return;
    }
    if (recipientSource === "manual") {
      setRecipientLoading(false); return;
    }
    setRecipientLoading(true);
    const url = recipientSource === "clients"
      ? "/clients?limit=100&active=true"
      : "/consultations?limit=100";
    api.get(url).then((j) => setRecipientList(j.data ?? []))
      .catch(() => setRecipientList([]))
      .finally(() => setRecipientLoading(false));
  }, [recipientSource]);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setContent(tpl.content);
      if (tpl.subject) setSubject(tpl.subject);
    }
  };

  const handleChannelChange = (ch) => {
    setChannel(ch); setSelectedTemplate(""); setContent(""); setSubject("");
  };

  // 채널·검색어로 수신자 필터링 (해당 채널 정보 없는 사람은 제외)
  // 직접 입력 모드: manualRecipients를 소스로 사용
  const activeList = recipientSource === "manual" ? manualRecipients : recipientList;
  const filteredClients = activeList.filter((c) => {
    if (channel === "sms" && !c.phone) return false;
    if (channel === "email" && !c.email) return false;
    if (channel === "both" && (!c.phone || !c.email)) return false;
    if (!clientFilter) return true;
    const q = clientFilter.toLowerCase();
    return (c.name || "").toLowerCase().includes(q)
      || (c.phone || "").includes(q)
      || (c.email || "").toLowerCase().includes(q);
  });

  const handleAddManualRecipient = (recipient) => {
    setManualRecipients((prev) => {
      if (prev.some((r) => r.id === recipient.id)) return prev;
      return [...prev, recipient];
    });
  };

  const handleRemoveManualRecipient = (id) => {
    setManualRecipients((prev) => prev.filter((r) => r.id !== id));
    setSelectedClients((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const toggleClient = (id) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedClients.size === filteredClients.length) setSelectedClients(new Set());
    else setSelectedClients(new Set(filteredClients.map((c) => c.id)));
  };

  const handleSegmentResult = (items, count) => {
    setRecipientList(items); setSegmentCount(count);
    setSelectedClients(new Set(items.map((c) => c.id)));
  };

  // 미리보기에 사용할 첫 번째 선택자 정보 (없으면 컴포넌트가 샘플 사용)
  const previewSample = (() => {
    if (selectedClients.size === 0) return null;
    const firstId = [...selectedClients][0];
    const c = activeList.find((x) => x.id === firstId);
    return c ? { name: c.name, category: c.category } : null;
  })();

  const channelLabel = channel === "sms" ? "문자" : channel === "email" ? "이메일" : "문자+이메일";
  const byteLen = getByteLength(content);
  const showEmailSubject = channel === "email" || channel === "both";
  const showSmsCounter = channel === "sms" || channel === "both";

  const handleSend = async () => {
    if (selectedClients.size === 0) return showToast("수신자를 선택해주세요");
    if (!content.trim()) return showToast("메시지 내용을 입력해주세요");
    if ((channel === "email" || channel === "both") && !subject.trim())
      return showToast("이메일 제목을 입력해주세요");

    const selectedList = activeList.filter((c) => selectedClients.has(c.id));
    const contacts = [];
    selectedList.forEach((c) => {
      if (channel === "sms" || channel === "both") c.phone && contacts.push(c.phone);
      if (channel === "email" || channel === "both") c.email && contacts.push(c.email);
    });
    try {
      const duplicates = await checkDuplicates(contacts);
      if (duplicates.length > 0) {
        setPendingDuplicates({ duplicates, selectedList });
        return;
      }
    } catch { /* 중복 체크 실패는 무시하고 발송 진행 */ }
    await confirmAndSend(selectedList, new Set());
  };

  const proceedAfterDup = async (exclude) => {
    const ctx = pendingDuplicates;
    setPendingDuplicates(null);
    if (!ctx) return;
    await confirmAndSend(ctx.selectedList, exclude || new Set());
  };

  const confirmAndSend = async (selectedList, excludeContacts) => {
    const finalList = selectedList.filter((c) => {
      if (channel === "sms" && excludeContacts.has(c.phone)) return false;
      if (channel === "email" && excludeContacts.has(c.email)) return false;
      if (channel === "both" && excludeContacts.has(c.phone) && excludeContacts.has(c.email)) return false;
      return true;
    });
    if (finalList.length === 0) return showToast("발송 가능한 수신자가 없습니다");

    const payload = {
      channel, finalList, excludeContacts,
      selectedTemplate, subject, content,
    };

    if (sendMode === "schedule") {
      if (!scheduledAt) return showToast("예약 시각을 입력해주세요");
      const when = new Date(scheduledAt);
      if (isNaN(when.getTime()) || when.getTime() < Date.now() + SCHEDULE_MIN_LEAD_MS)
        return showToast("예약 시각은 현재 시각 이후여야 합니다");
      if (!confirm(`${finalList.length}명에게 ${when.toLocaleString("ko-KR")}에 ${channelLabel}를 예약 발송하시겠습니까?`)) return;
      setSending(true);
      try {
        await scheduleMessages({ ...payload, scheduledAt });
        showToast("예약 등록 완료");
        setSelectedClients(new Set());
      } catch (err) { showToast("예약 실패: " + err.message); }
      finally { setSending(false); }
      return;
    }

    if (!confirm(`${finalList.length}명에게 ${channelLabel}를 발송하시겠습니까?`)) return;
    setSending(true); setResult(null);
    try {
      const data = await sendMessages(payload);
      setResult(data);
      setSelectedClients(new Set());
    } catch (err) { showToast("발송 실패: " + err.message); }
    finally { setSending(false); }
  };

  return (
    <div style={{ maxWidth: 1240 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        <SummaryCard label="채널" value={channelLabel} />
        <SummaryCard label="선택 수신자" value={`${selectedClients.size}명`} accent />
        <SummaryCard label="내용 길이" value={showSmsCounter ? `${byteLen}B` : `${content.length}자`} />
        <SummaryCard label="발송 방식" value={sendMode === "schedule" ? "예약 발송" : "즉시 발송"} />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(340px, 420px) minmax(0, 1fr)",
        gap: isMobile ? 18 : 24,
      }}>
        <section style={panelStyle}>
          <SendRecipientPanel
            channel={channel}
            onChannelChange={handleChannelChange}
            recipientSource={recipientSource}
            onSourceChange={setRecipientSource}
            recipientLoading={recipientLoading}
            setRecipientLoading={setRecipientLoading}
            filteredClients={filteredClients}
            selectedClients={selectedClients}
            onToggleClient={toggleClient}
            onToggleAll={toggleAll}
            clientFilter={clientFilter}
            onFilterChange={setClientFilter}
            onSegmentResult={handleSegmentResult}
            segmentCount={segmentCount}
            manualRecipients={manualRecipients}
            onAddManualRecipient={handleAddManualRecipient}
            onRemoveManualRecipient={handleRemoveManualRecipient}
          />
        </section>

        <section style={panelStyle}>
          <SendComposerPanel
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            showEmailSubject={showEmailSubject}
            subject={subject}
            onSubjectChange={setSubject}
            content={content}
            onContentChange={setContent}
            byteLen={byteLen}
            showSmsCounter={showSmsCounter}
            previewSample={previewSample}
          />
          <SendActionPanel
            sendMode={sendMode}
            onSendModeChange={setSendMode}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            sending={sending}
            selectedCount={selectedClients.size}
            channelLabel={channelLabel}
            onSend={handleSend}
            result={result}
            content={content}
            subject={subject}
            showEmailSubject={showEmailSubject}
          />
        </section>
      </div>

      {pendingDuplicates && (
        <DuplicateWarningModal
          duplicates={pendingDuplicates.duplicates}
          onCancel={() => setPendingDuplicates(null)}
          onExclude={() => proceedAfterDup(new Set(pendingDuplicates.duplicates.map((d) => d.contact)))}
          onSendAnyway={() => proceedAfterDup(new Set())}
        />
      )}
    </div>
  );
}

const panelStyle = {
  minWidth: 0,
  background: "#fff",
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  padding: 18,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

function SummaryCard({ label, value, accent = false }) {
  return (
    <div style={{
      border: `1px solid ${accent ? "#bfdbfe" : "#dbe3ef"}`,
      background: accent ? "#eff6ff" : "#fff",
      borderRadius: 8,
      padding: "13px 14px",
    }}>
      <div style={{ fontSize: 11, color: accent ? "#1d4ed8" : "#64748b", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent ? "#1d4ed8" : "#0f172a" }}>{value}</div>
    </div>
  );
}
