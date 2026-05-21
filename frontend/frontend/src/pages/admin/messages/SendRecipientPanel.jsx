/**
 * 발송 탭 1단계 — 수신자 선택 패널.
 * 채널 선택, 출처 선택, 세그먼트 빌더, 검색, 수신자 리스트, 카운트 바.
 */
import { COLORS } from "../../../components/admin";
import { formatPhone } from "../../../utils/formatters";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS } from "./messageConstants";
import SegmentBuilder from "./SegmentBuilder";
import {
  SectionLabel, SegmentedControl, EmptyBlock,
} from "./sendTabPrimitives";
import { countBarStyle, linkBtnStyle, listContainerStyle, searchInputStyle } from "./sendTabStyles";

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "이메일" },
  { value: "both", label: "둘 다" },
];

const SOURCE_OPTIONS = [
  { value: "clients", label: "고객 DB" },
  { value: "consultations", label: "상담 신청" },
  { value: "segment", label: "세그먼트" },
];

export default function SendRecipientPanel({
  channel, onChannelChange,
  recipientSource, onSourceChange,
  recipientLoading, setRecipientLoading,
  filteredClients, selectedClients, onToggleClient, onToggleAll,
  clientFilter, onFilterChange,
  onSegmentResult, segmentCount,
}) {
  const smsReady = filteredClients.filter((c) => c.phone).length;
  const emailReady = filteredClients.filter((c) => c.email).length;
  const selectedItems = filteredClients.filter((c) => selectedClients.has(c.id));
  const selectedSms = selectedItems.filter((c) => c.phone).length;
  const selectedEmail = selectedItems.filter((c) => c.email).length;

  return (
    <div style={{ minWidth: 0 }}>
      <SectionLabel step="1" title="받는 사람" />

      <SegmentedControl
        value={channel}
        onChange={onChannelChange}
        options={CHANNEL_OPTIONS}
      />

      <div style={{ height: 12 }} />

      <SegmentedControl
        value={recipientSource}
        onChange={onSourceChange}
        options={SOURCE_OPTIONS}
        size="sm"
      />

      {recipientSource === "segment" && (
        <div style={{ marginTop: 12 }}>
          <SegmentBuilder
            channel={channel}
            onResult={onSegmentResult}
            loading={recipientLoading}
            setLoading={setRecipientLoading}
          />
          {segmentCount > 0 && (
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
              조건 매칭 <strong style={{ color: COLORS.accent }}>{segmentCount}명</strong>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
        <StatCard label="선택" value={`${selectedClients.size}명`} accent />
        <StatCard label="문자 가능" value={`${selectedSms || smsReady}명`} />
        <StatCard label="이메일 가능" value={`${selectedEmail || emailReady}명`} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={searchInputStyle}
          value={clientFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="이름·전화·이메일 검색"
        />
        <button onClick={onToggleAll} style={linkBtnStyle}>
          {selectedClients.size === filteredClients.length && filteredClients.length > 0 ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      <div style={listContainerStyle}>
        {recipientLoading ? (
          <EmptyBlock text="불러오는 중..." />
        ) : filteredClients.length === 0 ? (
          <EmptyBlock text="해당하는 수신자가 없습니다" />
        ) : (
          filteredClients.map((c) => (
            <RecipientRow
              key={c.id} client={c} channel={channel}
              source={recipientSource}
              selected={selectedClients.has(c.id)}
              onToggle={() => onToggleClient(c.id)}
            />
          ))
        )}
      </div>

      <div style={countBarStyle}>
        <span>{selectedClients.size}명 선택됨</span>
        <span style={{ color: COLORS.muted }}>· 전체 {filteredClients.length}명</span>
      </div>
    </div>
  );
}

function RecipientRow({ client: c, channel, source, selected, onToggle }) {
  const phone = formatPhone(c.phone);
  const contact = channel === "both"
    ? `${phone} · ${c.email || "-"}`
    : channel === "sms" ? phone : (c.email || "-");
  const statusColor = c.status ? (STATUS_COLORS[c.status] || COLORS.muted) : null;

  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
      cursor: "pointer", background: selected ? "#eff6ff" : "transparent",
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle}
        style={{ accentColor: COLORS.accent, width: 14, height: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: COLORS.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {c.name || "-"}
        </div>
        <div style={{
          fontSize: 11, color: COLORS.textMuted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {contact}
        </div>
      </div>
      {source === "consultations" && c.status && (
        <span style={{
          fontSize: 10, fontWeight: 500, color: statusColor,
          padding: "2px 8px", borderRadius: 10,
          background: `${statusColor}15`, flexShrink: 0,
        }}>
          {STATUS_LABELS[c.status] || c.status}
        </span>
      )}
      {c.category && (
        <span style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {CATEGORY_LABELS[c.category] || c.category}
        </span>
      )}
    </label>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div style={{
      border: `1px solid ${accent ? "#bfdbfe" : "#e2e8f0"}`,
      background: accent ? "#eff6ff" : "#f8fafc",
      borderRadius: 7,
      padding: "9px 10px",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: accent ? "#1d4ed8" : "#64748b", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: accent ? "#1d4ed8" : COLORS.text }}>{value}</div>
    </div>
  );
}
