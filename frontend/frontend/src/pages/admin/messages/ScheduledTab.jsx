/**
 * 예약 발송 탭 — 예약된 메시지 목록 조회 + 취소
 * - 60초마다 자동 새로고침 (백엔드 스케줄러 주기와 동일)
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  EmptyState, Pagination,
  COLORS, fieldStyle, badgeStyle, thStyle, tdStyle, smallBtnStyle,
} from "../../../components/admin";
import { formatDateTime, formatContact, maskName } from "../../../utils/formatters";
import { showToast } from "../../../utils/showToast";
import { CHANNEL_COLORS } from "./messageConstants";

const STATUS_LABELS = {
  pending: "대기", processing: "처리중", sent: "완료",
  failed: "실패", cancelled: "취소",
};
const STATUS_COLORS = {
  pending: COLORS.warning, processing: "#3498db", sent: COLORS.success,
  failed: COLORS.danger, cancelled: COLORS.muted,
};

export default function ScheduledTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState("pending");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filterStatus) params.set("status", filterStatus);
    api.get(`/messages/scheduled?${params}`)
      .then((json) => {
        setItems(json.data ?? []);
        setMeta(json.meta ?? { total: 0, totalPages: 0 });
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load();
    });
    return () => { cancelled = true; };
  }, [load]);

  // 60초마다 자동 새로고침 — 스케줄러가 처리한 결과를 반영
  useEffect(() => {
    const timer = setInterval(load, 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  const cancel = async (id) => {
    if (!confirm("이 예약을 취소하시겠습니까?")) return;
    try {
      await api.delete(`/messages/scheduled/${id}`);
      showToast("예약이 취소되었습니다");
      load();
    } catch (err) {
      showToast("취소 실패: " + err.message);
    }
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <select style={{ ...fieldStyle, width: 160 }} value={filterStatus} onChange={handleFilterChange}>
          <option value="">전체 상태</option>
          <option value="pending">대기</option>
          <option value="processing">처리중</option>
          <option value="sent">완료</option>
          <option value="failed">실패</option>
          <option value="cancelled">취소</option>
        </select>
        <span style={{ fontSize: 13, color: COLORS.muted }}>총 {meta.total}건</span>
        <button onClick={load} style={{ ...smallBtnStyle(COLORS.textSecondary), marginLeft: "auto" }}>
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <EmptyState icon="⏳" message="불러오는 중..." />
      ) : items.length === 0 ? (
        <EmptyState icon="📭" message="예약된 메시지가 없습니다" />
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.border}`, textAlign: "left" }}>
              <th style={thStyle}>예약 시각</th>
              <th style={thStyle}>채널</th>
              <th style={thStyle}>수신자</th>
              <th style={thStyle}>내용</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>출처</th>
              <th style={{ ...thStyle, width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <ScheduleRow key={it.id} item={it} onCancel={cancel} />
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

/** 예약 행 */
function ScheduleRow({ item, onCancel }) {
  const recipients = Array.isArray(item.recipients) ? item.recipients : [];
  const firstRecipient = recipients[0];
  const displayContact = firstRecipient
    ? `${maskName(firstRecipient.name)} ${formatContact(firstRecipient.contact, true)}`
    : "-";
  const extraCount = recipients.length - 1;

  return (
    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
        <strong>{formatDateTime(item.scheduledAt)}</strong>
      </td>
      <td style={tdStyle}>
        <span style={badgeStyle(CHANNEL_COLORS[item.channel] || COLORS.muted)}>
          {item.channel === "sms" ? "SMS" : "이메일"}
        </span>
      </td>
      <td style={tdStyle}>
        <div>{displayContact}</div>
        {extraCount > 0 && (
          <div style={{ fontSize: 11, color: COLORS.muted }}>외 {extraCount}명</div>
        )}
      </td>
      <td style={{ ...tdStyle, color: COLORS.textSecondary, maxWidth: 260 }}>
        {item.subject && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "#444", marginBottom: 2 }}>{item.subject}</div>
        )}
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.content.length > 50 ? item.content.slice(0, 50) + "..." : item.content}
        </div>
      </td>
      <td style={tdStyle}>
        <span style={badgeStyle(STATUS_COLORS[item.status] || COLORS.muted)}>
          {STATUS_LABELS[item.status] || item.status}
        </span>
        {item.errorMessage && (
          <div style={{ fontSize: 10, color: COLORS.danger, marginTop: 2 }}>{item.errorMessage}</div>
        )}
      </td>
      <td style={{ ...tdStyle, fontSize: 11, color: COLORS.muted }}>
        {item.source === "trigger" ? "🤖 자동" : "👤 수동"}
      </td>
      <td style={tdStyle}>
        {item.status === "pending" ? (
          <button onClick={() => onCancel(item.id)} style={smallBtnStyle(COLORS.danger)}>
            취소
          </button>
        ) : "-"}
      </td>
    </tr>
  );
}
