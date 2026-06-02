/** 문서 관리 — 필터 바 (유형, 상태, 검색) */
import { COLORS, fieldStyle } from "../../../components/admin";
import { ALL_DOCUMENT_TYPES, getTypeLabel } from "../../../utils/document-types";
import { STATUS_OPTIONS } from "../../../utils/constants";

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "모든 유형" },
  ...ALL_DOCUMENT_TYPES.map((t) => ({ value: t, label: getTypeLabel(t) })),
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "모든 상태" },
  ...STATUS_OPTIONS,
];

/** 문서 목록 필터 바 */
export default function DocumentFilters({ typeFilter, setTypeFilter, statusFilter, setStatusFilter, searchQuery, setSearchQuery }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      marginBottom: 24, padding: "14px 20px",
      background: COLORS.bgForm, border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, letterSpacing: "0.08em" }}>
        필터:
      </span>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...fieldStyle, width: 130, padding: "6px 10px", fontSize: 13 }}>
        {TYPE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...fieldStyle, width: 130, padding: "6px 10px", fontSize: 13 }}>
        {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input
        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="문서 검색..."
        style={{ ...fieldStyle, width: 220, padding: "6px 10px", fontSize: 13 }}
      />
    </div>
  );
}
