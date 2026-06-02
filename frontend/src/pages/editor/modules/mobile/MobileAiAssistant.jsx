/**
 * MobileAiAssistant — 모바일 AI 도우미 패널
 *
 * 본문(또는 선택 영역)을 받아 다음 작업을 수행한다:
 *  - 요약 (3~5문장)
 *  - 제목 추천 (5개)
 *  - 이어쓰기 (다음 한두 문단)
 *  - 문체 변경 (격식 / 친근 / 간결)
 *  - 맞춤법/오탈자 점검
 *  - SEO 키워드 추출
 *
 * 백엔드에 LLM이 없을 수 있어 다음 두 경로를 순차 시도:
 *   1) `POST /api/editor/ai` (있으면 LLM 결과)
 *   2) 클라이언트 휴리스틱 (첫 문장 추출, 빈도 키워드 등)
 */
import { memo, useCallback, useState } from "react";
import { Sparkles, X, Wand2, ListOrdered, FileSignature, Type, Languages, CheckCircle2 } from "lucide-react";
import { api } from "../../../../utils/api";
import { showEditorAlert } from "../editorToast";

const ICON = 18;

function getEditorText(editor) {
  if (!editor) return "";
  const sel = editor.state.selection;
  if (sel && !sel.empty) {
    return editor.state.doc.textBetween(sel.from, sel.to, "\n");
  }
  return editor.getText() || "";
}

/* ── 클라이언트 휴리스틱 ── */
function clientSummary(text) {
  const sentences = text.split(/(?<=[.!?。])\s+/).filter(Boolean);
  if (sentences.length === 0) return "";
  return sentences.slice(0, Math.min(5, Math.max(2, Math.round(sentences.length * 0.18)))).join(" ");
}

function clientTitleSuggestions(text) {
  const lines = text.split(/\n+/).filter(Boolean);
  const first = lines[0] || "";
  const keywords = clientKeywords(text, 3);
  return [
    first.slice(0, 38).replace(/[.,!?]+$/, ""),
    `${keywords[0] || "법률"}, ${keywords[1] || "사례"}로 본 핵심 정리`,
    `${keywords[0] || "주요 쟁점"} 완전 가이드`,
    `반드시 알아야 할 ${keywords[0] || "포인트"} 5가지`,
    `Q&A로 풀어보는 ${keywords[0] || "이슈"}`,
  ].filter(Boolean);
}

function clientKeywords(text, top = 6) {
  const tokens = (text.toLowerCase().match(/[가-힣a-z]{2,}/g) || []);
  const stop = new Set(["그리고", "그러나", "그러면", "이것", "그것", "있다", "없다", "하다", "the", "and", "for", "with"]);
  const freq = new Map();
  for (const t of tokens) {
    if (stop.has(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([w]) => w);
}

function clientSpellHints(text) {
  // 매우 간단한 한국어 자주 틀리는 표현 사전
  const dict = [
    [/되요\b/g, "돼요"],
    [/안되/g, "안 돼"],
    [/할게요/g, "할게요(맞음)"],
    [/했슴/g, "했음"],
    [/이해할려고/g, "이해하려고"],
    [/뭐에요/g, "뭐예요"],
    [/거에요/g, "거예요"],
  ];
  const hits = [];
  for (const [re, to] of dict) {
    const m = text.match(re);
    if (m) hits.push({ from: m[0], to, count: m.length });
  }
  return hits;
}

const ACTIONS = [
  { id: "summarize", label: "요약", icon: <Wand2 size={ICON} /> },
  { id: "title", label: "제목 추천", icon: <ListOrdered size={ICON} /> },
  { id: "continue", label: "이어쓰기", icon: <FileSignature size={ICON} /> },
  { id: "rewrite-formal", label: "격식 있게", icon: <Type size={ICON} /> },
  { id: "rewrite-simple", label: "간결하게", icon: <Type size={ICON} /> },
  { id: "translate-en", label: "영어 번역", icon: <Languages size={ICON} /> },
  { id: "spell", label: "맞춤법 점검", icon: <CheckCircle2 size={ICON} /> },
  { id: "keywords", label: "SEO 키워드", icon: <Sparkles size={ICON} /> },
];

export const MobileAiAssistant = memo(function MobileAiAssistant({ editor, open, onClose, doc }) {
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);

  const callServer = useCallback(async (action, payload) => {
    try {
      const json = await api.post("/editor/ai", { action, ...payload });
      if (json?.data) return json.data;
    } catch { /* 서버 라우트 없음 → 휴리스틱 */ }
    return null;
  }, []);

  const run = async (id) => {
    if (!editor) return;
    const text = getEditorText(editor);
    if (!text || text.length < 30) {
      showEditorAlert("본문이 너무 짧아 AI 도우미가 작동할 수 없습니다.");
      return;
    }
    setPending(id);
    setResult(null);
    try {
      const server = await callServer(id, { text, title: doc?.title });
      let output;
      if (server) {
        output = server;
      } else if (id === "summarize") {
        output = { type: "text", text: clientSummary(text), label: "요약" };
      } else if (id === "title") {
        output = { type: "list", items: clientTitleSuggestions(text), label: "제목 추천" };
      } else if (id === "keywords") {
        output = { type: "tags", items: clientKeywords(text, 8), label: "SEO 키워드" };
      } else if (id === "spell") {
        const hits = clientSpellHints(text);
        output = hits.length > 0
          ? { type: "list", items: hits.map((h) => `"${h.from}" → "${h.to}" (${h.count}건)`), label: "맞춤법 힌트" }
          : { type: "text", text: "발견된 자주 틀리는 표현이 없습니다.", label: "맞춤법 점검" };
      } else if (id === "continue") {
        output = { type: "text", text: "(LLM 백엔드 미연결) 마지막 문장의 키워드를 활용해 한 단락을 직접 이어서 작성해 주세요.", label: "이어쓰기 안내" };
      } else if (id === "rewrite-formal" || id === "rewrite-simple") {
        output = { type: "text", text: "(LLM 백엔드 미연결) 본문을 직접 다듬어 주세요. 서버 LLM 라우트(`/api/editor/ai`)를 연결하면 자동 처리됩니다.", label: "안내" };
      } else if (id === "translate-en") {
        output = { type: "text", text: "(LLM 백엔드 미연결) 영어 번역은 서버 LLM이 필요합니다.", label: "안내" };
      } else {
        output = { type: "text", text: "지원하지 않는 작업입니다.", label: id };
      }
      setResult(output);
    } finally {
      setPending(null);
    }
  };

  const insertText = () => {
    if (!result || !editor) return;
    const { type, items, text } = result;
    let payload = "";
    if (type === "text") payload = text;
    else if (type === "list") payload = items.map((i) => `- ${i}`).join("\n");
    else if (type === "tags") payload = items.join(", ");
    if (payload) editor.chain().focus().insertContent(payload + "\n").run();
    setResult(null);
    onClose?.();
  };

  if (!open) return null;
  return (
    <>
      <div className="editor-msheet-backdrop" onClick={onClose} />
      <div className="editor-mai editor-mobile-only" role="dialog" aria-label="AI 도우미">
        <div className="mai-header">
          <div className="mai-title"><Sparkles size={18} /> AI 도우미</div>
          <button type="button" onClick={onClose} aria-label="닫기"><X size={20} /></button>
        </div>
        <div className="mai-grid">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`mai-action${pending === a.id ? " loading" : ""}`}
              onClick={() => run(a.id)}
              disabled={pending !== null}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        {pending && (
          <div className="mai-loading">
            <span className="mai-spinner" /> AI가 작업 중...
          </div>
        )}
        {result && (
          <div className="mai-result">
            <div className="mai-result-label">{result.label}</div>
            {result.type === "text" && <p>{result.text}</p>}
            {result.type === "list" && (
              <ol>
                {result.items.map((it, i) => <li key={i}>{it}</li>)}
              </ol>
            )}
            {result.type === "tags" && (
              <div className="mai-tags">
                {result.items.map((tag, i) => <span key={i}>#{tag}</span>)}
              </div>
            )}
            <div className="mai-result-actions">
              <button type="button" className="mmeta-secondary" onClick={() => setResult(null)}>지우기</button>
              <button type="button" className="mmeta-primary" onClick={insertText}>본문에 삽입</button>
            </div>
          </div>
        )}
        <div className="mai-tip">
          서버에 LLM 라우트(<code>POST /api/editor/ai</code>)가 연결되면 결과 품질이 비약적으로 좋아집니다.
        </div>
      </div>
    </>
  );
});

export default MobileAiAssistant;
