
import { useEffect, useState, useCallback } from "react";
import { api } from "../../utils/api";
import { PageHeader, ErrorBanner, EmptyState, COLORS, badgeStyle, btnStyle, smallBtnStyle, fieldStyle, labelStyle, formContainerStyle, thStyle, tdStyle } from "../../components/admin";
import { formatDate } from "../../utils/formatters";
import useMediaQuery from "../../hooks/useMediaQuery";

const STATUS_TABS = [
  { value: "pending", label: "승인 대기", color: COLORS.warning },
  { value: "published", label: "공개됨", color: COLORS.success },
  { value: "rejected", label: "거절됨", color: COLORS.danger },
  { value: "hidden", label: "숨김", color: COLORS.muted },
];

const STATUS_LABEL = {
  pending: "승인 대기", published: "공개됨", rejected: "거절됨", hidden: "숨김",
};
const STATUS_COLOR = {
  pending: COLORS.warning, published: COLORS.success, rejected: COLORS.danger, hidden: COLORS.muted,
};

export default function PortalQna() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // 선택된 질문 (편집 패널)
  const [categories, setCategories] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/qna/admin/questions?status=${status}&limit=50`);
      setItems(res.data || []);
    } catch (e) {
      setError(e.message || "목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get("/qna/categories")
      .then((res) => {
        // 트리를 평면화하고 소분류만 추출 (depth=2)
        const flat = [];
        const walk = (nodes, chain) => {
          for (const n of nodes) {
            flat.push({ id: n.id, name: [...chain, n.name].join(" > "), depth: n.depth });
            if (n.children?.length) walk(n.children, [...chain, n.name]);
          }
        };
        walk(res.data || [], []);
        setCategories(flat);
      })
      .catch(() => setCategories([]));
  }, []);

  async function handleSave(id, updates) {
    try {
      if (id === "new") {
        await api.post("/qna/admin/questions", updates);
      } else {
        await api.patch(`/qna/admin/questions/${id}`, updates);
      }
      setSelected(null);
      await load();
    } catch (e) {
      setError(e.message || "저장 실패");
    }
  }

  async function handleDelete(id) {
    if (!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    try {
      await api.delete(`/qna/admin/questions/${id}`);
      setSelected(null);
      await load();
    } catch (e) {
      setError(e.message || "삭제 실패");
    }
  }

  async function toggleFeatured(item) {
    try {
      await api.patch(`/qna/admin/questions/${item.id}`, { isFeatured: item.isFeatured ? 0 : 1 });
      await load();
    } catch (e) {
      setError(e.message || "변경 실패");
    }
  }

  return (
    <div>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <PageHeader title="법률 Q&A 관리">
        <button
          onClick={() => setSelected({
            id: "new",
            status: "published",
            title: "",
            body: "",
            categoryId: "",
            answer: "",
            answeredBy: "법무법인 하이로",
            displayName: "관리자",
            isPrivate: 0,
            isFeatured: 0,
            metaDescription: "",
          })}
          style={btnStyle(COLORS.primary)}
        >
          + 새 Q&A 작성
        </button>
      </PageHeader>

      {/* 상태 탭 */}
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setSelected(null); }}
            style={{
              padding: "10px 18px", fontSize: 13, fontWeight: 500,
              background: "none", border: "none", cursor: "pointer",
              color: status === tab.value ? COLORS.text : COLORS.textMuted,
              borderBottom: `2px solid ${status === tab.value ? tab.color : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 편집 패널 */}
      {selected && (
        <QuestionEditor
          key={selected.id}
          question={selected}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setSelected(null)}
        />
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>불러오는 중...</div>
      ) : items.length === 0 ? (
        <EmptyState message={`${STATUS_LABEL[status]} 상태의 질문이 없습니다`} />
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: 13, background: "#fff", border: `1px solid ${COLORS.borderLight}` }}>
          <thead style={{ background: "#f7f8fa", borderBottom: `1px solid ${COLORS.border}` }}>
            <tr>
              <th style={{ ...thStyle, width: 90 }}>상태</th>
              <th style={thStyle}>제목</th>
              <th style={{ ...thStyle, width: 120 }}>작성자</th>
              <th style={{ ...thStyle, width: 110 }}>접수일</th>
              <th style={{ ...thStyle, width: 60 }}>대표</th>
              <th style={{ ...thStyle, width: 60, textAlign: "right" }}>조회</th>
              <th style={{ ...thStyle, width: 140, textAlign: "right" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                <td style={tdStyle}>
                  <span style={badgeStyle(STATUS_COLOR[q.status])}>{STATUS_LABEL[q.status]}</span>
                </td>
                <td style={{ ...tdStyle, maxWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {q.title}
                  </div>
                  {q.answer && <span style={{ fontSize: 11, color: COLORS.accent, marginRight: 8 }}>답변 작성됨</span>}
                </td>
                <td style={tdStyle}>
                  <div style={{ color: COLORS.textSecondary }}>{q.displayName || "익명"}</div>
                  {q.submitterContact && <div style={{ fontSize: 11, color: COLORS.textMuted }}>{q.submitterContact}</div>}
                </td>
                <td style={{ ...tdStyle, color: COLORS.textMuted }}>{formatDate(q.createdAt)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => toggleFeatured(q)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 16, color: q.isFeatured ? COLORS.accent : "#ddd", padding: 0,
                    }}
                    title={q.isFeatured ? "대표 해제" : "대표 지정"}
                  >
                    {q.isFeatured ? "\u2605" : "\u2606"}
                  </button>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", color: COLORS.textMuted }}>{q.viewCount || 0}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <button onClick={() => setSelected(q)} style={smallBtnStyle(COLORS.primary)}>편집</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

/** 질문 편집/답변 패널 */
function QuestionEditor({ question, categories, onSave, onDelete, onCancel }) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [title, setTitle] = useState(question.title || "");
  const [body, setBody] = useState(question.body || "");
  const [categoryId, setCategoryId] = useState(() => {
    if (question.categoryId) return question.categoryId;
    const subcats = categories.filter((c) => c.depth === 2);
    return subcats.length > 0 ? subcats[0].id : "";
  });
  const [answer, setAnswer] = useState(question.answer || "");
  const [answeredBy, setAnsweredBy] = useState(question.answeredBy || "법무법인 하이로");
  const [displayName, setDisplayName] = useState(question.displayName || "");
  const [rejectReason, setRejectReason] = useState(question.rejectReason || "");
  const [metaDescription, setMetaDescription] = useState(question.metaDescription || "");
  const [saving, setSaving] = useState(false);

  async function submit(nextStatus) {
    if (nextStatus === "published" && !answer.trim()) {
      if (!confirm("답변이 비어있습니다. 그래도 공개하시겠습니까?")) return;
    }
    if (nextStatus === "rejected" && !rejectReason.trim()) {
      alert("거절 사유를 입력해 주세요");
      return;
    }
    setSaving(true);
    const updates = {
      title, body, categoryId, displayName,
      answer, answeredBy,
      metaDescription,
      status: nextStatus,
    };
    if (nextStatus === "rejected") updates.rejectReason = rejectReason;
    await onSave(question.id, updates);
    setSaving(false);
  }

  async function saveOnly() {
    setSaving(true);
    await onSave(question.id, {
      title, body, categoryId, displayName,
      answer, answeredBy, metaDescription,
      status: question.status,
    });
    setSaving(false);
  }

  return (
    <div style={formContainerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>질문 편집</h3>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          현재 상태: <span style={badgeStyle(STATUS_COLOR[question.status])}>{STATUS_LABEL[question.status]}</span>
        </div>
      </div>

      {/* PII 섹션 (관리자만) */}
      {(question.submitterName || question.submitterContact || question.submitterRegion) && (
        <div style={{ background: "#fff8e1", border: "1px solid #e6c97a", padding: "10px 14px", borderRadius: 4, fontSize: 12, marginBottom: 16 }}>
          <strong>제출자 정보 (비공개)</strong><br />
          {question.submitterName && <>이름: {question.submitterName} · </>}
          {question.submitterContact && <>연락처: {question.submitterContact} · </>}
          {question.submitterRegion && <>지역: {question.submitterRegion}</>}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>카테고리 (소분류)</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={fieldStyle}>
          {categories.filter((c) => c.depth === 2).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>제목</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={fieldStyle} maxLength={120} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>내용 (질문 본문)</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ ...fieldStyle, resize: "vertical" }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>표시 이름</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={fieldStyle} maxLength={40} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>답변 (변호사)</label>
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={10} style={{ ...fieldStyle, resize: "vertical" }} placeholder="관련 법령/판례 + 구체적 조언 + 상담 유도..." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>답변자</label>
          <input type="text" value={answeredBy} onChange={(e) => setAnsweredBy(e.target.value)} style={fieldStyle} maxLength={80} />
        </div>
        <div>
          <label style={labelStyle}>SEO 요약 (metaDescription)</label>
          <input type="text" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} style={fieldStyle} maxLength={160} placeholder="검색 결과에 노출될 요약" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>거절 사유 (거절 시에만 입력)</label>
        <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={fieldStyle} placeholder="부적절한 내용, 광고성, 중복 등" />
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        {question.id !== "new" ? (
          <button onClick={() => onDelete(question.id)} disabled={saving} style={smallBtnStyle(COLORS.danger)}>
            삭제
          </button>
        ) : <div />}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} disabled={saving} style={{ ...btnStyle(), background: "#fff", color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>취소</button>
          <button onClick={saveOnly} disabled={saving} style={btnStyle(COLORS.textSecondary)}>임시 저장</button>
          {question.status !== "hidden" && (
            <button onClick={() => submit("hidden")} disabled={saving} style={btnStyle(COLORS.muted)}>숨기기</button>
          )}
          {question.status !== "rejected" && (
            <button onClick={() => submit("rejected")} disabled={saving} style={btnStyle(COLORS.danger)}>거절</button>
          )}
          <button onClick={() => submit("published")} disabled={saving} style={btnStyle(COLORS.success)}>
            {question.status === "published" ? "수정 공개" : "승인·공개"}
          </button>
        </div>
      </div>
    </div>
  );
}
