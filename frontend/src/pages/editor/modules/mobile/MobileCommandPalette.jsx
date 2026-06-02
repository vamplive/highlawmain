/**
 * MobileCommandPalette — 모바일 만능 검색 팔레트 (Cmd+K 모바일판)
 *
 * 모든 에디터 명령(서식·삽입·뷰·발행), 사용자 정의 스니펫, 블로그 템플릿, 이모지,
 * 북마크 점프를 한 검색창에서 즉시 호출한다.
 *
 * 탭으로 카테고리를 전환할 수도 있고, 검색어로 모든 카테고리를 한 번에 필터링할 수도 있다.
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, X, Sparkles, FileText, Smile, Bookmark, Zap,
  Hash, List, Quote, Image as ImageIcon, Table2, Minus, Heading1, Heading2,
  Plus, Trash2,
} from "lucide-react";
import { loadSnippets, upsertSnippet, removeSnippet } from "./snippets";
import { useHapticFeedback } from "./mobileHooks";

const TABS = [
  { id: "all", label: "전체", icon: <Search size={14} /> },
  { id: "command", label: "명령", icon: <Zap size={14} /> },
  { id: "template", label: "템플릿", icon: <FileText size={14} /> },
  { id: "snippet", label: "단축어", icon: <Hash size={14} /> },
  { id: "emoji", label: "이모지", icon: <Smile size={14} /> },
  { id: "bookmark", label: "북마크", icon: <Bookmark size={14} /> },
];

/* 블로그 템플릿: 사용자가 모바일에서 한 번 탭으로 글 뼈대를 시작할 수 있게 */
const TEMPLATES = [
  {
    id: "case-analysis",
    title: "판례 분석 템플릿",
    desc: "쟁점 → 판단 → 시사점",
    html: `<h1>사건 개요</h1><p>본 사건의 사실관계를 간결히 요약합니다.</p>
<h2>쟁점</h2><ol><li>쟁점 1</li><li>쟁점 2</li></ol>
<h2>법원의 판단</h2><p>법원이 어떤 기준으로 판단했는지를 설명합니다.</p>
<h2>실무적 시사점</h2><blockquote>의뢰인이 유의해야 할 핵심 결론.</blockquote>
<h2>마무리</h2><p>관련 상담이 필요하시면 준비 중으로 문의해 주세요.</p>`,
  },
  {
    id: "law-guide",
    title: "법률 가이드 템플릿",
    desc: "Q&A 형식 안내",
    html: `<h1>한눈에 보기</h1><p>이 글에서 다루는 핵심을 한 문장으로.</p>
<h2>자주 묻는 질문</h2>
<h3>Q1. 질문 제목</h3><p>답변 본문…</p>
<h3>Q2. 질문 제목</h3><p>답변 본문…</p>
<h2>관련 법령</h2><ul><li>민법 제○조</li></ul>
<h2>마무리</h2><p>추가 문의는 법무법인 하이로로 연락 주세요.</p>`,
  },
  {
    id: "construction",
    title: "건설/하자 분쟁",
    desc: "사실 · 증거 · 청구",
    html: `<h1>사건 개요</h1>
<h2>하자의 종류와 범위</h2><ul><li>구조적 하자</li><li>기능적 하자</li><li>미관상 하자</li></ul>
<h2>증거 수집 체크리스트</h2><ul><li>현장 사진/영상</li><li>전문 업체 견적</li><li>입주자 진술</li></ul>
<h2>법적 청구권</h2><p>손해배상 청구, 보수 청구, 계약 해제 등의 가능 여부.</p>
<h2>해결 절차</h2><ol><li>증거 보전</li><li>내용증명 발송</li><li>조정 또는 소송</li></ol>`,
  },
  {
    id: "real-estate",
    title: "부동산 분쟁",
    desc: "임대차/매매/등기",
    html: `<h1>사건 유형</h1><p>분쟁 성격을 한두 줄로 정의합니다.</p>
<h2>사실관계</h2><ol><li>계약 체결 시점</li><li>분쟁 발생 경위</li></ol>
<h2>법률 쟁점</h2><ul><li>의무 이행 여부</li><li>손해의 범위</li></ul>
<h2>대응 전략</h2><p>의뢰인의 입장에서 우선 취해야 할 조치를 단계별로 제시.</p>`,
  },
  {
    id: "checklist",
    title: "체크리스트 글",
    desc: "조항 · 단계 점검표",
    html: `<h1>○○ 체크리스트</h1>
<ul data-type="taskList">
<li data-checked="false">항목 1</li>
<li data-checked="false">항목 2</li>
<li data-checked="false">항목 3</li>
<li data-checked="false">항목 4</li>
</ul>
<h2>자주 빠뜨리는 부분</h2><blockquote>실제 사례에서 누락되기 쉬운 점을 정리.</blockquote>`,
  },
];

const EMOJI_GROUPS = [
  { label: "법률", emojis: ["⚖️", "📋", "📝", "🏛️", "🔖", "📌", "🗂️", "💼", "🔒", "🛡️", "📑", "📚"] },
  { label: "감정", emojis: ["👍", "👏", "🙏", "💡", "🔥", "✨", "❤️", "✅", "❌", "⭐", "❓", "❗"] },
  { label: "사람·소통", emojis: ["👨‍⚖️", "👩‍⚖️", "🤝", "👥", "🗣️", "📢", "📞", "📧", "💬", "🧑‍💻", "👤", "👫"] },
  { label: "기호", emojis: ["→", "←", "⇒", "✔", "✗", "•", "①", "②", "③", "※", "「", "」"] },
];

function buildEditorCommands({ editor, onShowFind, onShowReplace, onOpenImage, onOpenTable, onOpenSymbol, onInsertComment, onOpenSeo, onOpenAi, onOpenSchedule, onOpenVersion, onTogglePresence }) {
  if (!editor) return [];
  const cmd = (id, label, icon, run, keywords = "") => ({ id, label, icon, run, keywords });
  return [
    cmd("h1", "큰 제목 (H1)", <Heading1 size={16} />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "title heading"),
    cmd("h2", "중간 제목 (H2)", <Heading2 size={16} />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "title"),
    cmd("ul", "글머리 기호", <List size={16} />, () => editor.chain().focus().toggleBulletList().run(), "list bullet"),
    cmd("quote", "인용", <Quote size={16} />, () => editor.chain().focus().toggleBlockquote().run(), "quote blockquote"),
    cmd("hr", "구분선", <Minus size={16} />, () => editor.chain().focus().setHorizontalRule().run(), "hr divider"),
    cmd("image", "이미지 삽입", <ImageIcon size={16} />, () => onOpenImage?.(), "image picture photo"),
    cmd("table", "표 삽입", <Table2 size={16} />, () => onOpenTable?.(), "table grid"),
    cmd("comment", "댓글 추가", <Sparkles size={16} />, () => onInsertComment?.(), "comment review"),
    cmd("find", "찾기", <Search size={16} />, () => onShowFind?.(), "search find"),
    cmd("replace", "바꾸기", <Search size={16} />, () => onShowReplace?.(), "replace"),
    cmd("symbol", "특수 문자", <Hash size={16} />, () => onOpenSymbol?.(), "symbol special"),
    cmd("seo", "SEO 검사", <Sparkles size={16} />, () => onOpenSeo?.(), "seo publish check"),
    cmd("ai", "AI 도우미", <Sparkles size={16} />, () => onOpenAi?.(), "ai assistant 요약 제목"),
    cmd("schedule", "예약 발행", <FileText size={16} />, () => onOpenSchedule?.(), "schedule publish"),
    cmd("version", "버전 히스토리", <FileText size={16} />, () => onOpenVersion?.(), "version history undo"),
    cmd("presence", "공동 편집 표시", <Sparkles size={16} />, () => onTogglePresence?.(), "presence collab"),
  ];
}

function fuzzyMatch(needle, hay) {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return hay.toLowerCase().includes(n);
}

export const MobileCommandPalette = memo(function MobileCommandPalette({
  open, onClose, editor,
  onShowFind, onShowReplace,
  onOpenImage, onOpenTable, onOpenSymbol, onInsertComment,
  onOpenSeo, onOpenAi, onOpenSchedule, onOpenVersion, onTogglePresence,
  bookmarks = [], onJumpBookmark, onAddBookmark, onRemoveBookmark,
}) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState(() => loadSnippets());
  const [editingSnip, setEditingSnip] = useState(null);
  const inputRef = useRef(null);
  const haptic = useHapticFeedback();

  useEffect(() => {
    if (!open) { setQuery(""); setEditingSnip(null); return; }
    setSnippets(loadSnippets());
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const editorCommands = useMemo(() => buildEditorCommands({
    editor, onShowFind, onShowReplace, onOpenImage, onOpenTable, onOpenSymbol,
    onInsertComment, onOpenSeo, onOpenAi, onOpenSchedule, onOpenVersion, onTogglePresence,
  }), [editor, onShowFind, onShowReplace, onOpenImage, onOpenTable, onOpenSymbol,
       onInsertComment, onOpenSeo, onOpenAi, onOpenSchedule, onOpenVersion, onTogglePresence]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const sections = [];
    if (tab === "all" || tab === "command") {
      const list = editorCommands.filter((c) => fuzzyMatch(q, `${c.label} ${c.keywords}`));
      if (list.length) sections.push({ id: "command", label: "명령", items: list });
    }
    if (tab === "all" || tab === "template") {
      const list = TEMPLATES.filter((t) => fuzzyMatch(q, `${t.title} ${t.desc}`));
      if (list.length) sections.push({ id: "template", label: "템플릿", items: list });
    }
    if (tab === "all" || tab === "snippet") {
      const list = snippets.filter((s) => fuzzyMatch(q, `${s.trigger} ${s.body}`));
      if (list.length) sections.push({ id: "snippet", label: "단축어", items: list });
    }
    if (tab === "all" || tab === "emoji") {
      const items = EMOJI_GROUPS.flatMap((g) => g.emojis.map((e) => ({ id: `${g.label}-${e}`, emoji: e, label: g.label })));
      const list = q ? items.filter((e) => fuzzyMatch(q, e.label)) : items;
      if (list.length) sections.push({ id: "emoji", label: "이모지", items: list });
    }
    if (tab === "all" || tab === "bookmark") {
      const list = bookmarks.filter((b) => fuzzyMatch(q, b.label || b.text));
      sections.push({ id: "bookmark", label: "북마크", items: list });
    }
    return sections;
  }, [query, tab, editorCommands, snippets, bookmarks]);

  const close = () => { haptic(8); onClose?.(); };

  const handleCommand = (cmd) => {
    haptic(10);
    cmd.run?.();
    close();
  };

  const handleTemplate = (tpl) => {
    haptic(12);
    if (!editor) return;
    if (window.confirm(`"${tpl.title}"으로 본문을 시작할까요? 현재 내용은 유지되며 끝에 추가됩니다.`)) {
      editor.chain().focus().insertContent(tpl.html).run();
      close();
    }
  };

  const handleSnippetInsert = (snip) => {
    haptic(8);
    editor?.chain().focus().insertContent(snip.body + " ").run();
    close();
  };

  const handleEmoji = (emoji) => {
    haptic(6);
    editor?.chain().focus().insertContent(emoji).run();
    close();
  };

  const handleSnipSave = () => {
    if (!editingSnip || !editingSnip.trigger || !editingSnip.body) return;
    const updated = upsertSnippet(editingSnip);
    setSnippets(updated);
    setEditingSnip(null);
  };

  const handleSnipDelete = (id) => {
    if (!window.confirm("단축어를 삭제할까요?")) return;
    const updated = removeSnippet(id);
    setSnippets(updated);
  };

  if (!open) return null;

  return (
    <>
      <div className="editor-msheet-backdrop" onClick={close} />
      <div className="editor-mpalette editor-mobile-only" role="dialog" aria-label="명령 팔레트">
        <div className="mpalette-header">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기능·템플릿·이모지·단축어 검색…"
            className="mpalette-input"
          />
          <button type="button" onClick={close} aria-label="닫기"><X size={20} /></button>
        </div>
        <div className="mpalette-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`mpalette-tab${tab === t.id ? " active" : ""}`}
              onClick={() => { haptic(6); setTab(t.id); }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <div className="mpalette-body">
          {/* 단축어 편집 모드 */}
          {editingSnip && (
            <div className="mpalette-snip-edit">
              <input
                type="text"
                className="mmeta-input"
                placeholder=";단축어"
                value={editingSnip.trigger || ""}
                onChange={(e) => setEditingSnip({ ...editingSnip, trigger: e.target.value })}
              />
              <textarea
                className="mmeta-input"
                rows={4}
                placeholder="확장될 본문"
                value={editingSnip.body || ""}
                onChange={(e) => setEditingSnip({ ...editingSnip, body: e.target.value })}
              />
              <div className="mpalette-snip-actions">
                <button type="button" className="mmeta-secondary" onClick={() => setEditingSnip(null)}>취소</button>
                <button type="button" className="mmeta-primary" onClick={handleSnipSave}>저장</button>
              </div>
            </div>
          )}

          {!editingSnip && filtered.map((sec) => (
            <div key={sec.id} className="mpalette-section">
              <div className="mpalette-section-title">
                <span>{sec.label}</span>
                {sec.id === "snippet" && (
                  <button
                    type="button"
                    className="mpalette-add-snip"
                    onClick={() => setEditingSnip({ id: `s_${Date.now()}`, trigger: ";", body: "" })}
                  >
                    <Plus size={14} /> 추가
                  </button>
                )}
                {sec.id === "bookmark" && onAddBookmark && (
                  <button
                    type="button"
                    className="mpalette-add-snip"
                    onClick={() => { onAddBookmark(); close(); }}
                  >
                    <Plus size={14} /> 현재 위치
                  </button>
                )}
              </div>
              <div className={sec.id === "emoji" ? "mpalette-emoji-grid" : "mpalette-list"}>
                {sec.id === "command" && sec.items.map((c) => (
                  <button key={c.id} type="button" className="mpalette-row" onClick={() => handleCommand(c)}>
                    <span className="mpalette-icon">{c.icon}</span>
                    <span className="mpalette-text"><span>{c.label}</span></span>
                  </button>
                ))}
                {sec.id === "template" && sec.items.map((t) => (
                  <button key={t.id} type="button" className="mpalette-row" onClick={() => handleTemplate(t)}>
                    <span className="mpalette-icon"><FileText size={16} /></span>
                    <span className="mpalette-text">
                      <span>{t.title}</span>
                      <small>{t.desc}</small>
                    </span>
                  </button>
                ))}
                {sec.id === "snippet" && sec.items.length === 0 && (
                  <div className="mpalette-empty">아직 단축어가 없어요. 자주 쓰는 문장을 등록해 보세요.</div>
                )}
                {sec.id === "snippet" && sec.items.map((s) => (
                  <div key={s.id} className="mpalette-row" style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={() => handleSnippetInsert(s)}
                    >
                      <span className="mpalette-icon"><Hash size={16} /></span>
                      <span className="mpalette-text">
                        <span>{s.trigger}</span>
                        <small>{s.body.slice(0, 60)}</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSnip(s)}
                      style={{ width: 36, height: 36, border: "none", background: "transparent", cursor: "pointer", color: "#475569" }}
                    >편집</button>
                    <button
                      type="button"
                      onClick={() => handleSnipDelete(s.id)}
                      style={{ width: 36, height: 36, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
                      aria-label="삭제"
                    ><Trash2 size={16} /></button>
                  </div>
                ))}
                {sec.id === "emoji" && sec.items.map((e) => (
                  <button key={e.id} type="button" className="mpalette-emoji" onClick={() => handleEmoji(e.emoji)}>
                    {e.emoji}
                  </button>
                ))}
                {sec.id === "bookmark" && sec.items.length === 0 && (
                  <div className="mpalette-empty">북마크가 없습니다. 본문에서 위치를 마크해 보세요.</div>
                )}
                {sec.id === "bookmark" && sec.items.map((b) => (
                  <div key={b.id} className="mpalette-row" style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={() => { onJumpBookmark?.(b); close(); }}
                    >
                      <span className="mpalette-icon"><Bookmark size={16} /></span>
                      <span className="mpalette-text">
                        <span>{b.label || "(레이블 없음)"}</span>
                        <small>{(b.text || "").slice(0, 60)}</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark?.(b.id)}
                      style={{ width: 36, height: 36, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
                      aria-label="삭제"
                    ><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!editingSnip && filtered.length === 0 && (
            <div className="mpalette-empty">결과 없음</div>
          )}
        </div>
      </div>
    </>
  );
});

export default MobileCommandPalette;
