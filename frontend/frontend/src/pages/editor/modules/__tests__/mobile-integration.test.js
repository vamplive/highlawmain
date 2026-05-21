/**
 * 모바일 에디터 핵심 통합 테스트 — TipTap 전체를 띄우는 대신 호환되는 가짜 에디터로
 * snippets/markdown paste/bookmarks/HUD 통계 같은 동작을 단위 검증한다.
 *
 * 가짜 에디터는 다음 인터페이스를 흉내 낸다:
 *  - state.selection.{ from, empty }
 *  - state.doc.textBetween(from, to, blockSep, leafSep)
 *  - state.doc.content.size
 *  - on / off / chain().focus()...run()
 *  - getText / getHTML / getJSON
 *
 * 진짜 ProseMirror 트랜잭션을 시뮬레이션하지 않으므로, attach* 핸들러는 직접 호출해
 * 효과(insertContent / deleteRange)가 일어나는지만 확인한다.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import { attachSnippetExpander, saveSnippets } from "../mobile/snippets";
import { attachMarkdownPasteHandler } from "../mobile/markdownPaste";
import { addBookmarkFromEditor, removeBookmark, jumpBookmark } from "../mobile/bookmarks";

beforeEach(() => {
  if (typeof localStorage !== "undefined") localStorage.clear();
});

/* ── 가짜 TipTap 에디터 ── */
function makeFakeEditor(initialText = "") {
  const state = {
    text: initialText,
    // ProseMirror에서 본문 길이 N의 끝 위치는 N+1(1-based, 노드 진입 보정)을 사용
    selection: { from: initialText.length + 1, empty: true, $from: { parentOffset: initialText.length } },
  };
  const listeners = new Map();
  const calls = [];

  const stateProxy = {
    get selection() { return state.selection; },
    get doc() {
      return {
        get content() { return { size: state.text.length + 1 }; },
        textBetween(from, to /* blockSep, leafSep */) {
          // ProseMirror 위치 → 1-based offset 보정
          const start = Math.max(0, from - 1);
          const end = Math.max(start, to - 1);
          return state.text.slice(start, end);
        },
      };
    },
  };

  function makeChain() {
    const ops = [];
    const chain = {
      focus() { return chain; },
      insertContent(content) {
        ops.push({ type: "insert", content });
        const insertPos = Math.max(0, state.selection.from - 1);
        const str = typeof content === "string" ? content : "";
        state.text = state.text.slice(0, insertPos) + str + state.text.slice(insertPos);
        state.selection.from = insertPos + str.length + 1;
        return chain;
      },
      deleteRange({ from, to }) {
        ops.push({ type: "deleteRange", from, to });
        const start = Math.max(0, from - 1);
        const end = Math.max(start, to - 1);
        state.text = state.text.slice(0, start) + state.text.slice(end);
        state.selection.from = start + 1;
        return chain;
      },
      setTextSelection(pos) {
        const target = typeof pos === "number" ? pos : pos.from;
        state.selection.from = target;
        ops.push({ type: "setSelection", from: target });
        return chain;
      },
      scrollIntoView() { ops.push({ type: "scrollIntoView" }); return chain; },
      run() { calls.push(ops); return true; },
    };
    return chain;
  }

  return {
    state: stateProxy,
    view: {
      dom: (() => {
        const el = (typeof document !== "undefined") ? document.createElement("div") : null;
        return el;
      })(),
    },
    on(name, fn) {
      const arr = listeners.get(name) || [];
      arr.push(fn);
      listeners.set(name, arr);
    },
    off(name, fn) {
      const arr = (listeners.get(name) || []).filter((f) => f !== fn);
      listeners.set(name, arr);
    },
    emit(name, payload) {
      for (const fn of listeners.get(name) || []) fn(payload);
    },
    chain: makeChain,
    getText() { return state.text; },
    getHTML() { return `<p>${state.text}</p>`; },
    /* 테스트 유틸 */
    _setText(t) { state.text = t; state.selection.from = t.length + 1; },
    _calls: calls,
  };
}

describe("snippets — attachSnippetExpander", () => {
  it("expands a registered trigger when a space follows", () => {
    saveSnippets([{ id: "s1", trigger: ";테스트", body: "테스트 본문" }]);
    const editor = makeFakeEditor(";테스트 ");
    const detach = attachSnippetExpander(editor);
    editor.emit("transaction", { editor, transaction: { docChanged: true, steps: [{ ok: true }] } });
    detach();
    expect(editor.getText().includes("테스트 본문")).toBe(true);
    expect(editor.getText().includes(";테스트 ")).toBe(false);
  });

  it("does nothing when trigger is not at the end", () => {
    saveSnippets([{ id: "s1", trigger: ";a", body: "AAA" }]);
    const editor = makeFakeEditor("저는 ;a를 좋아해요");
    const detach = attachSnippetExpander(editor);
    editor.emit("transaction", { editor, transaction: { docChanged: true, steps: [{ ok: true }] } });
    detach();
    // 마지막에 공백이 없으므로 expander가 트리거되지 않아야 함
    expect(editor.getText()).toBe("저는 ;a를 좋아해요");
  });

  it("does nothing for transactions without docChanged", () => {
    saveSnippets([{ id: "s1", trigger: ";x", body: "X" }]);
    const editor = makeFakeEditor(";x ");
    const detach = attachSnippetExpander(editor);
    editor.emit("transaction", { editor, transaction: { docChanged: false } });
    detach();
    expect(editor.getText()).toBe(";x ");
  });
});

describe("markdownPaste — attachMarkdownPasteHandler", () => {
  function fakeClipboardEvent(plain, html = "") {
    const ev = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "clipboardData", {
      value: { getData: (k) => (k === "text/plain" ? plain : k === "text/html" ? html : "") },
    });
    return ev;
  }

  it("converts pasted markdown to HTML and inserts", () => {
    const editor = makeFakeEditor("");
    const detach = attachMarkdownPasteHandler(editor);
    const ev = fakeClipboardEvent("# 제목\n\n- 가\n- 나");
    editor.view.dom.dispatchEvent(ev);
    detach();
    const text = editor.getText();
    expect(text).toContain("제목");
    expect(text).toContain("<h1>");
    expect(text).toContain("<ul>");
  });

  it("does not intercept when plain prose is pasted", () => {
    const editor = makeFakeEditor("");
    const detach = attachMarkdownPasteHandler(editor);
    const ev = fakeClipboardEvent("그냥 평문 한 줄입니다");
    editor.view.dom.dispatchEvent(ev);
    detach();
    expect(ev.defaultPrevented).toBe(false);
  });

  it("does not intercept when HTML clipboard is present", () => {
    const editor = makeFakeEditor("");
    const detach = attachMarkdownPasteHandler(editor);
    const ev = fakeClipboardEvent("# 제목", "<p>웹에서 복사한 HTML</p>");
    editor.view.dom.dispatchEvent(ev);
    detach();
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe("bookmarks — addBookmarkFromEditor / jumpBookmark", () => {
  it("captures the current position with text preview", () => {
    const editor = makeFakeEditor("처음 줄입니다 그리고 두 번째 문장이 이어집니다");
    const list = addBookmarkFromEditor(editor, "doc1", "끝부분");
    expect(list.length).toBe(1);
    expect(list[0].label).toBe("끝부분");
    expect(list[0].text.length).toBeGreaterThan(0);
  });

  it("removes a bookmark by id", () => {
    const editor = makeFakeEditor("내용");
    const a = addBookmarkFromEditor(editor, "doc1", "북1");
    expect(a.length).toBe(1);
    const after = removeBookmark("doc1", a[0].id);
    expect(after.length).toBe(0);
  });

  it("jumpBookmark calls editor commands without throwing", () => {
    const editor = makeFakeEditor("Hello world bookmark target here");
    // 텍스트가 있는 위치에 북마크
    const list = addBookmarkFromEditor(editor, "doc1");
    const spy = vi.fn();
    const origChain = editor.chain;
    editor.chain = function patched() {
      const c = origChain.call(this);
      const origRun = c.run;
      c.run = function () { spy(); return origRun.call(this); };
      return c;
    };
    expect(() => jumpBookmark(editor, list[0])).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});
