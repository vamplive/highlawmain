/** 관리자 블로그 관리 — 게시글 목록, 분류/상태 필터, 삭제, 에디터 진입 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState, Pagination, COLORS, badgeStyle, fieldStyle, outlineBtnStyle, thStyle, tdStyle } from "../../../components/admin";
import { BLOG_CATEGORIES, DOC_STATUS_META } from "../../editor/modules/constants";
import { api } from "../../../utils/api";
import { formatDate, truncate } from "../../../utils/formatters";
import { showToast } from "../../../utils/showToast";

const PAGE_SIZE = 20;
const ANALYTICS_PERIOD = "90d";
const CATEGORY_OPTIONS = [
  { value: "", label: "전체 분류" },
  ...BLOG_CATEGORIES,
  { value: "__uncategorized", label: "기타" },
];
const STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "published", label: "발행" },
  { value: "scheduled", label: "예약" },
  { value: "draft", label: "초안" },
];

function isFuture(value) {
  if (!value) return false;
  const date = new Date(String(value).replace(" ", "T"));
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function getPostStatus(post) {
  if (post.isPublished) return "published";
  if (isFuture(post.scheduledPublishAt)) return "scheduled";
  return "draft";
}

function getCategoryLabel(value) {
  return BLOG_CATEGORIES.find((category) => category.value === value)?.label || "기타";
}

function getStatusLabel(status) {
  return DOC_STATUS_META[status]?.label || status;
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(tags).split(",").map((tag) => tag.trim()).filter(Boolean);
  }
}

function SelectAllCheckbox({ checked, indeterminate, onChange, disabled = false, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={onChange}
      style={{ width: 16, height: 16, cursor: disabled ? "default" : "pointer" }}
    />
  );
}

function BlogFilters({ category, setCategory, status, setStatus, search, setSearch }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(220px, 1fr) 180px 180px",
      gap: 12,
      marginBottom: 18,
      padding: 16,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      background: "#fff",
    }}>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="제목, 요약, 태그 검색"
        style={fieldStyle}
      />
      <select value={category} onChange={(event) => setCategory(event.target.value)} style={fieldStyle}>
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} style={fieldStyle}>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function BlogStats({ posts }) {
  const stats = useMemo(() => {
    const base = { total: posts.length, published: 0, scheduled: 0, draft: 0 };
    for (const post of posts) base[getPostStatus(post)] += 1;
    return base;
  }, [posts]);

  const items = [
    ["전체", stats.total],
    ["발행", stats.published],
    ["예약", stats.scheduled],
    ["초안", stats.draft],
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 12, marginBottom: 18 }}>
      {items.map(([label, value]) => (
        <div key={label} style={{
          padding: "14px 16px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          background: "#fff",
        }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function BlogTable({
  posts,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onTogglePost,
  onTogglePage,
  onDelete,
  onOpenAnalytics,
}) {
  const headers = ["분류", "제목", "상태", "태그", "발행/예약일", "조회", "관리"];

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: COLORS.bgForm, borderBottom: `1px solid ${COLORS.border}` }}>
            <th style={{ ...thStyle, width: 44, textAlign: "center" }}>
              <SelectAllCheckbox
                checked={allPageSelected}
                indeterminate={somePageSelected}
                disabled={posts.length === 0}
                label="현재 페이지 게시글 전체 선택"
                onChange={(event) => onTogglePage(event.target.checked)}
              />
            </th>
            {headers.map((header, index) => (
              <th key={header} style={{ ...thStyle, textAlign: index === headers.length - 1 ? "right" : "left" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => {
            const status = getPostStatus(post);
            const statusMeta = DOC_STATUS_META[status];
            const tags = parseTags(post.tags);
            const editorUrl = `${basePath}/editor/blog:${post.id}`;
            const selected = selectedIds.has(post.id);

            return (
              <tr
                key={post.id}
                style={{
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  background: selected ? "rgba(26,58,107,0.07)" : index % 2 === 0 ? "transparent" : COLORS.bgInactive,
                }}
              >
                <td style={{ ...tdStyle, textAlign: "center", width: 44 }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    aria-label={`${post.title || "제목 없음"} 선택`}
                    onChange={(event) => onTogglePost(post.id, event.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                </td>
                <td style={tdStyle}>
                  <span style={badgeStyle("#1a3a6b")}>{getCategoryLabel(post.category)}</span>
                </td>
                <td style={{ ...tdStyle, maxWidth: 360 }}>
                  <Link to={editorUrl} style={{ display: "block", fontWeight: 600, color: COLORS.text, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {truncate(post.title || "제목 없음", 64)}
                  </Link>
                  <div style={{ marginTop: 4, color: COLORS.textMuted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    /blog/{post.slug}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                    color: statusMeta?.color || COLORS.textSecondary,
                    background: statusMeta?.background || COLORS.bgInactive,
                    border: `1px solid ${statusMeta?.border || COLORS.border}`,
                  }}>
                    {getStatusLabel(status)}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: COLORS.textSecondary, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tags.length ? tags.slice(0, 3).map((tag) => `#${tag}`).join(" ") : "-"}
                </td>
                <td style={{ ...tdStyle, color: COLORS.textMuted, fontSize: 11 }}>
                  {formatDate(post.scheduledPublishAt || post.publishedAt || post.createdAt)}
                </td>
                <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>
                  <button
                    onClick={() => onOpenAnalytics(post)}
                    title="조회수 분석"
                    style={{
                      padding: "3px 8px",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 4,
                      background: "#fff",
                      color: COLORS.accent,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {post.viewCount ?? 0}
                  </button>
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <div className="flex justify-end gap-1">
                    <Link to={editorUrl} style={{ ...outlineBtnStyle(), textDecoration: "none" }}>편집</Link>
                    <button onClick={() => onOpenAnalytics(post)} style={outlineBtnStyle("#1a3a6b")}>분석</button>
                    {post.slug && post.isPublished ? (
                      <Link to={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={{ ...outlineBtnStyle(), textDecoration: "none" }}>보기</Link>
                    ) : null}
                    <button onClick={() => onDelete(post)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BlogAnalyticsModal({ post, data, loading, onClose }) {
  if (!post) return null;
  const readers = data?.readers || [];
  const keywords = data?.searchKeywords || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "min(1080px, 100%)", maxHeight: "86vh", overflow: "auto", background: "#fff", borderRadius: 8, boxShadow: "0 24px 80px rgba(15,23,42,0.22)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>조회 분석</h2>
            <p style={{ margin: "6px 0 0", color: COLORS.textMuted, fontSize: 12 }}>{truncate(post.title || "제목 없음", 90)}</p>
          </div>
          <button onClick={onClose} style={outlineBtnStyle()}>닫기</button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>분석 데이터를 불러오는 중...</div>
        ) : (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                ["누적 조회수", data?.cumulativeViewCount ?? post.viewCount ?? 0],
                ["동의 기반 로그", data?.totalLoggedViews ?? 0],
                ["방문자 단위", data?.uniqueReaders ?? 0],
                ["검색어 수", keywords.length],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.bgForm }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
              <section>
                <h3 style={{ fontSize: 14, margin: "0 0 10px", color: COLORS.text }}>검색 유입 키워드</h3>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                  {keywords.length === 0 ? (
                    <div style={{ padding: 18, color: COLORS.textMuted, fontSize: 13 }}>확인된 검색어가 없습니다.</div>
                  ) : keywords.map((item) => (
                    <div key={item.keyword} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: `1px solid ${COLORS.borderLight}` }}>
                      <span style={{ color: COLORS.text, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.keyword}</span>
                      <strong style={{ color: COLORS.accent, fontSize: 13 }}>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 14, margin: "0 0 10px", color: COLORS.text }}>읽은 방문자</h3>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: COLORS.bgForm }}>
                        {["방문자 근거", "환경", "유입/검색어", "읽은 횟수", "최근 열람"].map((header, index) => (
                          <th key={header} style={{ ...thStyle, textAlign: index >= 3 ? "right" : "left" }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {readers.length === 0 ? (
                        <tr><td colSpan={5} style={{ ...tdStyle, color: COLORS.textMuted, textAlign: "center", padding: 24 }}>동의 기반 방문 로그가 없습니다.</td></tr>
                      ) : readers.map((reader) => (
                        <tr key={`${reader.sessionId}-${reader.lastReadAt}`} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                          <td style={tdStyle}>
                            <div style={{ color: COLORS.text, fontWeight: 600 }}>{reader.visitorId || reader.sessionId || "방문자 ID 없음"}</div>
                            <div style={{ color: COLORS.textMuted, marginTop: 2 }}>IP {reader.ip || "없음"}</div>
                            {reader.ipHash && (
                              <div style={{ color: COLORS.textMuted, marginTop: 2 }}>hash {reader.ipHash.slice(0, 12)}...</div>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: COLORS.textSecondary }}>{reader.userAgent}</td>
                          <td style={{ ...tdStyle, maxWidth: 280 }}>
                            <div style={{ color: reader.keyword ? COLORS.accent : COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {reader.keyword || "검색어 없음"}
                            </div>
                            {reader.referrer && (
                              <div style={{ color: COLORS.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {reader.referrer}
                              </div>
                            )}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", color: COLORS.text }}>{reader.reads}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: COLORS.textMuted }}>{formatDate(reader.lastReadAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ margin: "10px 0 0", color: COLORS.textMuted, fontSize: 11 }}>
                  실명 독자는 공개 블로그 방문만으로 식별할 수 없어 방문자 쿠키, 마스킹 IP, IP 해시, 브라우저 기준으로 근거를 남깁니다.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogOverallAnalyticsModal({ data, loading, onClose, onOpenPost }) {
  const keywords = data?.searchKeywords || [];
  const topPosts = data?.topPosts || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "min(1120px, 100%)", maxHeight: "86vh", overflow: "auto", background: "#fff", borderRadius: 8, boxShadow: "0 24px 80px rgba(15,23,42,0.22)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>전체 블로그 조회 분석</h2>
            <p style={{ margin: "6px 0 0", color: COLORS.textMuted, fontSize: 12 }}>최근 90일 동의 기반 방문 로그와 누적 조회수를 함께 봅니다.</p>
          </div>
          <button onClick={onClose} style={outlineBtnStyle()}>닫기</button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: COLORS.textMuted }}>전체 분석 데이터를 불러오는 중...</div>
        ) : (
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                ["게시글", data?.totalPosts ?? 0],
                ["누적 조회수", data?.cumulativeViewCount ?? 0],
                ["동의 기반 로그", data?.totalLoggedViews ?? 0],
                ["방문자 단위", data?.uniqueReaders ?? 0],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.bgForm }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
              <section>
                <h3 style={{ fontSize: 14, margin: "0 0 10px", color: COLORS.text }}>게시글별 조회수</h3>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: COLORS.bgForm }}>
                        {["게시글", "누적 조회", "동의 로그", "방문자"].map((header, index) => (
                          <th key={header} style={{ ...thStyle, textAlign: index === 0 ? "left" : "right" }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topPosts.length === 0 ? (
                        <tr><td colSpan={4} style={{ ...tdStyle, color: COLORS.textMuted, textAlign: "center", padding: 24 }}>분석할 게시글이 없습니다.</td></tr>
                      ) : topPosts.map((post) => (
                        <tr key={post.id} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                          <td style={tdStyle}>
                            <button onClick={() => onOpenPost(post)} style={{ border: "none", background: "transparent", padding: 0, color: COLORS.text, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                              {truncate(post.title || "제목 없음", 72)}
                            </button>
                            <div style={{ color: COLORS.textMuted, marginTop: 2 }}>/blog/{post.slug}</div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", color: COLORS.text }}>{post.cumulativeViewCount ?? 0}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: COLORS.textSecondary }}>{post.loggedViews ?? 0}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: COLORS.textSecondary }}>{post.uniqueReaders ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 14, margin: "0 0 10px", color: COLORS.text }}>전체 검색 유입 키워드</h3>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                  {keywords.length === 0 ? (
                    <div style={{ padding: 18, color: COLORS.textMuted, fontSize: 13 }}>확인된 검색어가 없습니다.</div>
                  ) : keywords.map((item) => (
                    <div key={item.keyword} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: `1px solid ${COLORS.borderLight}` }}>
                      <span style={{ color: COLORS.text, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.keyword}</span>
                      <strong style={{ color: COLORS.accent, fontSize: 13 }}>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBlog({ basePath = "/admin" }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [analyticsPost, setAnalyticsPost] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [overallOpen, setOverallOpen] = useState(false);
  const [overallData, setOverallData] = useState(null);
  const [overallLoading, setOverallLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const first = await api.get("/blog?all=true&limit=200&page=1");
      const items = [...(first.data || [])];
      const totalPages = first.meta?.totalPages || 1;
      for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
        const res = await api.get(`/blog?all=true&limit=200&page=${nextPage}`);
        items.push(...(res.data || []));
      }
      setPosts(items);
    } catch (error) {
      showToast("블로그 목록 조회 실패: " + error.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    setPage(1);
  }, [category, status, search]);

  useEffect(() => {
    setSelectedIds((current) => {
      const liveIds = new Set(posts.map((post) => post.id));
      let changed = false;
      const next = new Set();
      for (const id of current) {
        if (liveIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return posts.filter((post) => {
      const postStatus = getPostStatus(post);
      const categoryMatches = !category
        || (category === "__uncategorized" ? !BLOG_CATEGORIES.some((item) => item.value === post.category) : post.category === category);
      const statusMatches = !status || postStatus === status;
      if (!categoryMatches || !statusMatches) return false;
      if (!keyword) return true;
      const text = [
        post.title,
        post.excerpt,
        post.slug,
        post.author,
        getCategoryLabel(post.category),
        ...parseTags(post.tags),
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [posts, category, status, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const pagePosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedPosts = useMemo(
    () => posts.filter((post) => selectedIds.has(post.id)),
    [posts, selectedIds],
  );
  const selectedCount = selectedIds.size;
  const selectedOnPageCount = pagePosts.filter((post) => selectedIds.has(post.id)).length;
  const allPageSelected = pagePosts.length > 0 && selectedOnPageCount === pagePosts.length;
  const somePageSelected = selectedOnPageCount > 0 && selectedOnPageCount < pagePosts.length;

  const handleTogglePost = useCallback((id, checked) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleTogglePage = useCallback((checked) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const post of pagePosts) {
        if (checked) next.add(post.id);
        else next.delete(post.id);
      }
      return next;
    });
  }, [pagePosts]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDelete = async (post) => {
    if (!window.confirm(`"${post.title || "제목 없음"}" 블로그 게시글을 삭제할까요?`)) return;
    try {
      await api.delete(`/blog/${post.id}`);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(post.id);
        return next;
      });
      showToast("블로그 게시글을 삭제했습니다", "success");
    } catch (error) {
      showToast("삭제 실패: " + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0 || bulkDeleting) return;
    if (!window.confirm(`선택한 블로그 게시글 ${selectedPosts.length}개를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;

    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedPosts.map(async (post) => {
          await api.delete(`/blog/${post.id}`);
          return post.id;
        }),
      );
      const deletedIds = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      const failedCount = results.length - deletedIds.length;

      if (deletedIds.length > 0) {
        const deletedSet = new Set(deletedIds);
        setPosts((current) => current.filter((post) => !deletedSet.has(post.id)));
        setSelectedIds((current) => {
          const next = new Set(current);
          for (const id of deletedSet) next.delete(id);
          return next;
        });
      }

      if (failedCount > 0) {
        showToast(`${deletedIds.length}개 삭제, ${failedCount}개 실패했습니다`);
      } else {
        showToast(`선택한 게시글 ${deletedIds.length}개를 삭제했습니다`, "success");
      }
    } catch (error) {
      showToast("선택 삭제 실패: " + error.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleOpenAnalytics = async (post) => {
    setAnalyticsPost(post);
    setAnalyticsData(null);
    setAnalyticsLoading(true);
    try {
      const res = await api.get(`/analytics/blog-posts/${post.id}?period=${ANALYTICS_PERIOD}`);
      setAnalyticsData(res.data || null);
    } catch (error) {
      showToast("조회 분석 로드 실패: " + error.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleOpenOverallAnalytics = async () => {
    setOverallOpen(true);
    setOverallData(null);
    setOverallLoading(true);
    try {
      const res = await api.get(`/analytics/blog-overview?period=${ANALYTICS_PERIOD}`);
      setOverallData(res.data || null);
    } catch (error) {
      showToast("전체 조회 분석 로드 실패: " + error.message);
    } finally {
      setOverallLoading(false);
    }
  };

  const handleOpenPostFromOverall = (postSummary) => {
    const post = posts.find((item) => item.id === postSummary.id) || postSummary;
    setOverallOpen(false);
    handleOpenAnalytics(post);
  };

  return (
    <div>
      <PageHeader
        title="블로그 관리"
        subtitle={`전체 ${posts.length}개 · 검색 결과 ${filteredPosts.length}개`}
      >
        <button onClick={handleOpenOverallAnalytics} style={outlineBtnStyle("#1a3a6b")}>
          전체 조회 분석
        </button>
        <Link to={`${basePath}/editor`} style={{ ...outlineBtnStyle(), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          에디터 열기
        </Link>
        <Link to={`${basePath}/editor?mode=blog`} style={{ ...outlineBtnStyle("#1a3a6b"), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          + 새 블로그 작성
        </Link>
      </PageHeader>

      <BlogStats posts={posts} />
      <BlogFilters
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        search={search}
        setSearch={setSearch}
      />

      {selectedCount > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
          padding: "12px 14px",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          background: "#fff",
        }}>
          <div style={{ fontSize: 13, color: COLORS.text }}>
            <strong>{selectedCount}개</strong> 게시글 선택됨
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={clearSelection}
              disabled={bulkDeleting}
              style={outlineBtnStyle()}
            >
              선택 해제
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              style={outlineBtnStyle(COLORS.danger)}
            >
              {bulkDeleting ? "삭제 중..." : "선택 삭제"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>블로그 게시글 조회 중...</p>
      ) : pagePosts.length === 0 ? (
        <EmptyState icon="📝" message="검색 결과가 없습니다" />
      ) : (
        <BlogTable
          posts={pagePosts}
          selectedIds={selectedIds}
          allPageSelected={allPageSelected}
          somePageSelected={somePageSelected}
          onTogglePost={handleTogglePost}
          onTogglePage={handleTogglePage}
          onDelete={handleDelete}
          onOpenAnalytics={handleOpenAnalytics}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BlogAnalyticsModal
        post={analyticsPost}
        data={analyticsData}
        loading={analyticsLoading}
        onClose={() => setAnalyticsPost(null)}
      />
      {overallOpen && (
        <BlogOverallAnalyticsModal
          data={overallData}
          loading={overallLoading}
          onClose={() => setOverallOpen(false)}
          onOpenPost={handleOpenPostFromOverall}
        />
      )}
    </div>
  );
}
