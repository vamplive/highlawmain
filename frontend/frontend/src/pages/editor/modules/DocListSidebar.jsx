/**
 * DocListSidebar — 에디터 좌측 문서 탐색기 패널
 * - 문서 유형별 트리 구조로 표시
 * - 검색, 접기/펼치기, 새 문서 생성 버튼
 */
import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { BLOG_CATEGORIES, DOC_SOURCE_META, DOC_STATUS_META, DOC_TYPES, TYPE_NUMBERS } from "./constants";

const docTypeLabelMap = DOC_TYPES.reduce((acc, type) => {
  acc[type.value] = type.label;
  return acc;
}, {});

const blogCategoryLabelMap = BLOG_CATEGORIES.reduce((acc, category) => {
  acc[category.value] = category.label;
  return acc;
}, {});

function Badge({ label, meta }) {
  return (
    <span
      style={{
        flexShrink: 0,
        maxWidth: 48,
        padding: "1px 4px",
        border: `1px solid ${meta.border}`,
        borderRadius: 3,
        background: meta.background,
        color: meta.color,
        fontSize: 9,
        lineHeight: "13px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      title={label}
    >
      {label}
    </span>
  );
}

export function DocListSidebar({ documents, onSelect, currentId, onNew, onNewBlog, onDelete, search, setSearch, collapsed, setCollapsed }) {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [mode, setMode] = useState("all");
  const toggleFolder = (key) => setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    const scoped = mode === "blog"
      ? documents.filter((d) => d._source === "blog" || d.documentType === "blog")
      : mode === "document"
        ? documents.filter((d) => !(d._source === "blog" || d.documentType === "blog"))
        : documents;
    if (!search) return scoped;
    return scoped.filter(d => (d.title || "").toLowerCase().includes(search.toLowerCase()));
  }, [documents, mode, search]);

  const tree = useMemo(() => {
    const folders = [];
    const blogDocs = filtered.filter((d) => d._source === "blog" || d.documentType === "blog");
    if (blogDocs.length > 0) {
      const categoryGroups = BLOG_CATEGORIES
        .map((category) => {
          const docs = blogDocs
            .filter((d) => (d.blogCategory || d._blogCategory || "construction_realestate") === category.value)
            .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
          return {
            key: `blog_${category.value}`,
            label: category.label,
            count: docs.length,
            docs,
          };
        })
        .filter((group) => group.docs.length > 0);
      const uncategorized = blogDocs
        .filter((d) => !blogCategoryLabelMap[d.blogCategory || d._blogCategory])
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      if (uncategorized.length > 0) {
        categoryGroups.push({ key: "blog_uncategorized", label: "기타", count: uncategorized.length, docs: uncategorized });
      }
      folders.push({
        key: "blog",
        label: `${TYPE_NUMBERS.blog || "000"}_${docTypeLabelMap.blog || "블로그"}`,
        count: blogDocs.length,
        children: categoryGroups,
      });
    }

    const byType = {};
    for (const d of filtered) {
      if (d._source === "blog" || d.documentType === "blog") continue;
      const type = d.documentType || "article";
      if (!byType[type]) byType[type] = [];
      byType[type].push(d);
    }
    const primaryTypeOrder = ["news", "statute", "case_law", "paper", "textbook", "book"];
    const typeOrder = [...primaryTypeOrder, ...DOC_TYPES.map(t => t.value).filter(type => !primaryTypeOrder.includes(type))];
    for (const type of typeOrder) {
      const docs = byType[type];
      if (!docs || docs.length === 0) continue;
      const typeNum = TYPE_NUMBERS[type] || "900";
      const typeLabel = docTypeLabelMap[type] || type;

      const sorted = [...docs].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      const numbered = sorted.map((d, i) => ({ ...d, _num: `${typeNum}.${String(i + 1).padStart(3, "0")}` }));
      folders.push({ key: type, label: `${typeNum}_${typeLabel}`, docs: numbered, count: docs.length });
    }
    return folders;
  }, [filtered]);

  const renderDoc = (d) => {
    const sourceKey = d._source === "blog" || d.documentType === "blog" ? "blog" : "document";
    const sourceMeta = DOC_SOURCE_META[sourceKey] || DOC_SOURCE_META.document;
    const statusMeta = DOC_STATUS_META[d.status || "draft"] || DOC_STATUS_META.draft;
    const typeLabel = docTypeLabelMap[d.documentType] || d.documentType || "문서";
    const sourceTypeLabel = sourceKey === "blog" ? sourceMeta.label : typeLabel;

    return (
      <div key={d.id} onClick={(e) => { e.stopPropagation(); onSelect(d.id); }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 8px 3px 14px", cursor: "pointer",
          background: d.id === currentId ? "rgba(59,130,246,0.08)" : "transparent",
        }}
        onMouseEnter={e => { if (d.id !== currentId) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={e => { if (d.id !== currentId) e.currentTarget.style.background = d.id === currentId ? "rgba(59,130,246,0.08)" : "transparent"; }}
      >
        <span style={{ fontSize: 11, opacity: 0.4, flexShrink: 0 }}>▪</span>
        <span style={{
          flex: 1, minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: d.id === currentId ? "#1e293b" : "#4b5563",
          fontWeight: d.id === currentId ? 500 : 400,
        }}>
          {(d.title || "(제목 없음)").replace("[세계사] ", "")}
        </span>
        <Badge label={sourceTypeLabel} meta={sourceMeta} />
        <Badge label={statusMeta.label} meta={statusMeta} />
        {sourceKey === "blog" && (
          <button
            type="button"
            title="게시글 삭제"
            onClick={(e) => {
              e.stopPropagation();
              const title = d.title || "제목 없음";
              if (window.confirm(`블로그 게시글 "${title}"을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) {
                onDelete?.(d);
              }
            }}
            style={{
              width: 22,
              height: 22,
              border: "1px solid transparent",
              borderRadius: 3,
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fee2e2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    );
  };

  const renderFolder = (label, key, count, depth, children) => {
    const isOpen = expandedFolders[key] !== undefined ? expandedFolders[key] : depth < 2;
    return (
      <div key={key}>
        <div onClick={() => toggleFolder(key)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: `3px 8px 3px ${8 + depth * 14}px`,
            cursor: "pointer", userSelect: "none",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontSize: 9, color: "#9ca3af", width: 10, flexShrink: 0, transition: "transform 0.12s", transform: isOpen ? "rotate(90deg)" : "rotate(0)" }}>▶</span>
          <span style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: depth === 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        </div>
        {isOpen && <div>{children}</div>}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div style={{ width: 36, flexShrink: 0, background: "#eae6e1", borderRight: "1px solid #d5d0ca", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10 }}>
        <button onClick={() => setCollapsed(false)} title="탐색기 열기"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 4 }}>▶</button>
      </div>
    );
  }

  return (
    <div style={{ width: 270, flexShrink: 0, background: "#eae6e1", borderRight: "1px solid #d5d0ca", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #d5d0ca", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={onNew}
          title="새 문서 만들기"
          style={{
            height: 28,
            padding: "0 10px",
            border: "1px solid #b8b0a7",
            borderRadius: 3,
            background: "#f8f6f3",
            cursor: "pointer",
            fontSize: 12,
            color: "#374151",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          새 문서
        </button>
        <button
          onClick={onNewBlog}
          title="블로그 글쓰기"
          style={{
            height: 28,
            padding: "0 9px",
            border: "1px solid #93c5fd",
            borderRadius: 3,
            background: "#dbeafe",
            cursor: "pointer",
            fontSize: 12,
            color: "#1d4ed8",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 600,
          }}
        >
          블로그
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setCollapsed(true)} title="접기" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#666", padding: "0 2px" }}>◀</button>
      </div>
      <div style={{ padding: "6px 8px 4px", borderBottom: "1px solid #d5d0ca", flexShrink: 0, display: "flex", gap: 4 }}>
        {[
          ["all", "전체"],
          ["blog", "블로그"],
          ["document", "문서"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            style={{
              height: 24,
              flex: 1,
              border: `1px solid ${mode === key ? "#93c5fd" : "#c5c0ba"}`,
              borderRadius: 3,
              background: mode === key ? "#dbeafe" : "#f5f2ee",
              color: mode === key ? "#1d4ed8" : "#475569",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: mode === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ padding: "4px 8px 6px", borderBottom: "1px solid #d5d0ca", flexShrink: 0 }}>
        <input type="text" placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "4px 6px", fontSize: 11, border: "1px solid #c5c0ba", borderRadius: 3, outline: "none", background: "#f5f2ee", color: "#333", boxSizing: "border-box" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
        {filtered.length === 0 && <p style={{ color: "#999", fontSize: 11, padding: "12px 10px" }}>문서가 없습니다.</p>}
        {tree.map(group => (
          renderFolder(group.label, group.key, group.count, 0,
            <>
              {group.children && group.children.map(region =>
                renderFolder(region.label, `${group.key}_${region.label}`, region.count, 1,
                  <>
                    {region.docs && region.docs.map(renderDoc)}
                    {region.children && region.children.map(country =>
                      renderFolder(country.label, `${group.key}_${region.label}_${country.label}`, country.count, 2,
                        <>{country.docs.map(renderDoc)}</>
                      )
                    )}
                  </>
                )
              )}
              {group.docs && group.docs.map(renderDoc)}
            </>
          )
        ))}
      </div>
      <div style={{ padding: "5px 10px", borderTop: "1px solid #d5d0ca", fontSize: 10, color: "#999", flexShrink: 0 }}>
        {filtered.length}개 문서
      </div>
    </div>
  );
}
