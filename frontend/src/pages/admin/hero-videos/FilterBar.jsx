/**
 * 카테고리 필터 + 검색 바
 */
import { COLORS, fieldStyle } from "../../../components/admin";
import { CATEGORIES } from "./constants";

export default function FilterBar({ filter, onFilterChange, search, onSearchChange }) {
  const allCategories = [
    { key: "", label: "전체" },
    ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v })),
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {allCategories.map((c) => (
          <button
            key={c.key}
            onClick={() => onFilterChange(c.key)}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              background: filter === c.key ? COLORS.primary : "transparent",
              color: filter === c.key ? "#fff" : COLORS.textSecondary,
              border: `1px solid ${filter === c.key ? COLORS.primary : COLORS.border}`,
              transition: "all 0.15s",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="영상 검색..."
        style={{ ...fieldStyle, width: 200, padding: "7px 14px", fontSize: 12 }}
      />
    </div>
  );
}
