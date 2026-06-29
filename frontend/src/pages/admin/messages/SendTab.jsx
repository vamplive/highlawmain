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
import { scheduleMessages, sendMessages, checkDuplicates, uploadMessageImage } from "./sendDispatch";
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

  // 직접 입력 수신자 & 이미지
  const [manualRecipients, setManualRecipients] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

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

  // 수신자 출처 변경 시 목록 재조회 (세그먼트는 수동 트리거)
  useEffect(() => {
    setSelectedClients(new Set());
    setManualRecipients([]);
    if (recipientSource === "segment") {
      setRecipientList([]); setSegmentCount(0); setRecipientLoading(false); return;
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
    // SMS로 변경 시 이미지 초기화 (SMS는 이미지 미지원)
    if (ch === "sms") handleImageRemove();
  };

  // 채널·검색어로 수신자 필터링 (해당 채널 정보 없는 사람은 제외)
  const filteredClients = recipientList.filter((c) => {
    if (channel === "sms" && !c.phone) return false;
    if (channel === "kakao" && !c.phone) return false;
    if (channel === "email" && !c.email) return false;
    if (channel === "both" && (!c.phone || !c.email)) return false;
    if (!clientFilter) return true;
    const q = clientFilter.toLowerCase();
    return (c.name || "").toLowerCase().includes(q)
      || (c.phone || "").includes(q)
      || (c.email || "").toLowerCase().includes(q);
  });

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

  // 직접 수신자 추가/삭제
  const addManualRecipient = (recipient) => {
    const contact = recipient.contact?.trim();
    if (!contact) return;
    const alreadyManual = manualRecipients.some((r) => r.contact === contact);
    const alreadyDb = recipientList.some(
      (c) => selectedClients.has(c.id) && (c.phone === contact || c.email === contact)
    );
    if (alreadyManual || alreadyDb) {
      showToast("이미 선택된 연락처입니다");
      return;
    }
    setManualRecipients((prev) => [...prev, { ...recipient, id: `manual_${Date.now()}_${Math.random()}` }]);
  };
  const removeManualRecipient = (id) => {
    setManualRecipients((prev) => prev.filter((r) => r.id !== id));
  };
  const clearAllRecipients = () => {
    setSelectedClients(new Set());
    setManualRecipients([]);
  };

  // 이미지 첨부
  const handleImageChange = (file) => {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };
  const handleImageRemove = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  // 미리보기에 사용할 첫 번째 선택자 정보 (없으면 컴포넌트가 샘플 사용)
  const previewSample = (() => {
    if (selectedClients.size === 0 && manualRecipients.length === 0) return null;
    if (selectedClients.size > 0) {
      const firstId = [...selectedClients][0];
      const c = recipientList.find((x) => x.id === firstId);
      return c ? { name: c.name, category: c.category } : null;
    }
    return { name: manualRecipients[0]?.name, category: null };
  })();

  const channelLabel = channel === "sms" ? "문자" : channel === "email" ? "이메일" : channel === "kakao" ? "카카오톡" : "문자+이메일";
  const byteLen = getByteLength(content);
  const showEmailSubject = channel === "email" || channel === "both";
  const showSmsCounter = channel === "sms" || channel === "both";
  const totalSelected = selectedClients.size + manualRecipients.length;

  const handleSend = async () => {
    if (totalSelected === 0) return showToast("수신자를 선택해주세요");
    if (!content.trim()) return showToast("메시지 내용을 입력해주세요");
    if ((channel === "email" || channel === "both") && !subject.trim())
      return showToast("이메일 제목을 입력해주세요");

    const selectedList = recipientList.filter((c) => selectedClients.has(c.id));
    const contacts = [];
    selectedList.forEach((c) => {
      if (channel === "sms" || channel === "kakao" || channel === "both") c.phone && contacts.push(c.phone);
      if (channel === "email" || channel === "both") c.email && contacts.push(c.email);
    });
    manualRecipients.forEach((r) => r.contact && contacts.push(r.contact));

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
    // 예약 검증은 confirm 전에 (setSending 전에) 수행
    let scheduleWhen = null;
    if (sendMode === "schedule") {
      if (!scheduledAt) return showToast("예약 시각을 입력해주세요");
      scheduleWhen = new Date(scheduledAt);
      if (isNaN(scheduleWhen.getTime()) || scheduleWhen.getTime() < Date.now() + SCHEDULE_MIN_LEAD_MS)
        return showToast("예약 시각은 현재 시각 이후여야 합니다");
    }

    const modeLabel = sendMode === "schedule" ? `${scheduleWhen?.toLocaleString("ko-KR")}에 예약 발송` : "즉시 발송";
    if (!confirm(`${totalSelected}명에게 ${channelLabel}를 ${modeLabel}하시겠습니까?`)) return;

    setSending(true); setResult(null);

    let imageUrl = null;
    if (imageFile && (channel === "kakao" || channel === "email" || channel === "both")) {
      try {
        imageUrl = await uploadMessageImage(imageFile);
      } catch {
        showToast("이미지 업로드에 실패했습니다. 이미지 없이 발송합니다.");
      }
    }

    const payload = {
      channel, finalList: selectedList, excludeContacts,
      selectedTemplate, subject, content,
      manualRecipients, imageUrl,
    };

    if (sendMode === "schedule") {
      try {
        await scheduleMessages({ ...payload, scheduledAt });
        showToast("예약 등록 완료");
        clearAllRecipients();
      } catch (err) { showToast("예약 실패: " + err.message); }
      finally { setSending(false); }
      return;
    }

    try {
      const data = await sendMessages(payload);
      setResult(data);
      clearAllRecipients();
    } catch (err) { showToast("발송 실패: " + err.message); }
    finally { setSending(false); }
  };

  return (
    <div style={{ maxWidth: 1240 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        <SummaryCard label="채널" value={channelLabel} />
        <SummaryCard label="선택 수신자" value={`${totalSelected}명`} accent />
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
            onAddManual={addManualRecipient}
            onRemoveManual={removeManualRecipient}
            onClearAll={clearAllRecipients}
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
            imageFile={imageFile}
            imagePreviewUrl={imagePreviewUrl}
            onImageChange={handleImageChange}
            onImageRemove={handleImageRemove}
            channel={channel}
          />
          <SendActionPanel
            sendMode={sendMode}
            onSendModeChange={setSendMode}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            sending={sending}
            selectedCount={totalSelected}
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
