/** 문서 관리 — 문서 목록 테이블 + 행 컴포넌트 (다중 선택 지원) */
import { COLORS, thStyle, tdStyle, badgeStyle, outlineBtnStyle } from "../../../components/admin";
import { formatDate, truncate } from "../../../utils/formatters";
import { getTypeLabel, getTypeColor } from "../../../utils/document-types";
import { STATUS_OPTIONS } from "../../../utils/constants";

/** 테이블 행 — 체크박스 컬럼 포함 */
export function DocumentRow({ doc, index, selected, onToggleSelect, onEdit, onDelete }) {
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === doc.status)?.label || doc.status;

  return (
    <tr style={{
      borderBottom: `1px solid ${COLORS.borderLight}`,
      background: selected
        ? "#eef4fb"
        : index % 2 === 0 ? "transparent" : COLORS.bgInactive,
    }}>
      <td style={{ ...tdStyle, width: 36, paddingLeft: 12 }}>
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect(doc.id)}
          aria-label={`${doc.title || "문서"} 선택`}
          style={{ width: 16, height: 16, cursor: "pointer" }}
        />
      </td>
      <td style={tdStyle}>
        <span style={badgeStyle(getTypeColor(doc.documentType))}>
          {getTypeLabel(doc.documentType)}
        </span>
      </td>
      <td style={{ ...tdStyle, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, color: COLORS.text, cursor: "pointer" }}
        onClick={onEdit}
      >
        {truncate(doc.title, 60)}
      </td>
      <td style={{ ...tdStyle, color: COLORS.textSecondary, fontSize: 12 }}>
        {statusLabel}
      </td>
      <td style={tdStyle}>
        <span style={{ color: COLORS.primary, fontSize: 12, letterSpacing: "1px" }}>
          {"★".repeat(doc.importance || 0)}
        </span>
        <span style={{ color: "#ddd", fontSize: 12, letterSpacing: "1px" }}>
          {"★".repeat(5 - (doc.importance || 0))}
        </span>
      </td>
      <td style={{ ...tdStyle, color: COLORS.textMuted, fontSize: 11 }}>
        {formatDate(doc.createdAt)}
      </td>
      <td style={{ ...tdStyle, textAlign: "right" }}>
        <div className="flex justify-end gap-1">
          <button onClick={onEdit} style={outlineBtnStyle()}>수정</button>
          <button onClick={onDelete} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
        </div>
      </td>
    </tr>
  );
}

/** 문서 목록 테이블 — 헤더에 전체 선택 체크박스 노출 */
export default function DocumentTable({
  allSelected,
  someSelected,
  onToggleSelectAll,
  children,
}) {
  const headers = ["유형", "제목", "상태", "중요도", "등록일", "관리"];

  return (
    <div style={{
      border: `1px solid ${COLORS.border}`, borderRadius: 8,
      overflow: "hidden", background: "#fff",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: COLORS.bgForm, borderBottom: `1px solid ${COLORS.border}` }}>
            <th style={{ ...thStyle, width: 36, paddingLeft: 12 }}>
              <input
                type="checkbox"
                aria-label="전체 선택"
                checked={!!allSelected}
                ref={(el) => { if (el) el.indeterminate = !allSelected && !!someSelected; }}
                onChange={onToggleSelectAll}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
            </th>
            {headers.map((h, i) => (
              <th key={h} style={{ ...thStyle, textAlign: i === 5 ? "right" : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
