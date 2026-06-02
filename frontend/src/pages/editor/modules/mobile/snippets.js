/**
 * 모바일 사용자 스니펫 — localStorage 기반 텍스트 매크로
 *
 * 사용자가 ";인사" 같은 단축어를 등록하면 본문에서 ";인사 "(공백/엔터)을 입력할 때
 * 자동으로 등록한 본문으로 치환된다. 글쓰기 속도를 크게 끌어 올리는 핵심 기능.
 *
 * 데이터 형식: [{ id, trigger, body, updatedAt }]
 */
const STORAGE_KEY = "yj-editor-mobile-snippets";

const DEFAULT_SNIPPETS = [
  { id: "default-greeting", trigger: ";인사", body: "안녕하세요. 법무법인 하이로입니다." },
  { id: "default-cta", trigger: ";상담", body: "보다 정확한 상담은 준비 중 또는 [상담 신청](/consultation)으로 문의해 주세요." },
  { id: "default-disclaimer", trigger: ";면책", body: "본 글은 일반적인 정보 제공을 위한 것이며, 구체적 사건은 전문가 상담이 필요합니다." },
];

export function loadSnippets() {
  if (typeof localStorage === "undefined") return DEFAULT_SNIPPETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SNIPPETS;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return DEFAULT_SNIPPETS;
    return arr;
  } catch {
    return DEFAULT_SNIPPETS;
  }
}

export function saveSnippets(snips) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snips));
  } catch { /* quota / disabled */ }
}

export function upsertSnippet(snippet) {
  const list = loadSnippets();
  const idx = list.findIndex((s) => s.id === snippet.id);
  const updated = { ...snippet, updatedAt: Date.now() };
  if (idx >= 0) list[idx] = updated;
  else list.push({ ...updated, id: updated.id || `s_${Date.now()}` });
  saveSnippets(list);
  return list;
}

export function removeSnippet(id) {
  const list = loadSnippets().filter((s) => s.id !== id);
  saveSnippets(list);
  return list;
}

/**
 * 에디터에 스니펫 자동 확장 핸들러를 등록.
 * 사용자가 ";trigger "(공백)을 입력하면 본문이 그 위치를 trigger 길이만큼 지우고 body로 교체.
 */
export function attachSnippetExpander(editor) {
  if (!editor) return () => {};
  const handler = ({ transaction }) => {
    if (!transaction?.docChanged) return;
    const lastStep = transaction.steps?.[transaction.steps.length - 1];
    if (!lastStep) return;
    // 사용자가 마지막에 입력한 단어 1자가 공백이거나 엔터일 때만 트리거
    const sel = editor.state.selection;
    if (!sel.empty) return;
    const pos = sel.from;
    const before = editor.state.doc.textBetween(Math.max(0, pos - 24), pos, "\n", "\0");
    if (!/[\s\n]$/.test(before)) return;
    const list = loadSnippets();
    for (const snip of list) {
      const trig = snip.trigger;
      if (!trig) continue;
      const needle = `${trig} `;
      if (before.endsWith(needle) || before.endsWith(`${trig}\n`)) {
        const start = pos - needle.length;
        editor
          .chain()
          .focus()
          .deleteRange({ from: start, to: pos })
          .insertContent(snip.body + " ")
          .run();
        return;
      }
    }
  };
  editor.on("transaction", handler);
  return () => editor.off("transaction", handler);
}
