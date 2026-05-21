import { describe, expect, it, beforeEach } from "vitest";
import { looksLikeMarkdown } from "../mobile/markdownPaste";
import {
  loadSnippets, saveSnippets, upsertSnippet, removeSnippet,
} from "../mobile/snippets";
import {
  loadVersions, pushVersion, clearVersions,
} from "../mobile/versionStore";
import {
  loadBookmarks, saveBookmarks,
} from "../mobile/bookmarks";

beforeEach(() => {
  // 각 테스트 전 localStorage 깨끗이 비우기
  if (typeof localStorage !== "undefined") localStorage.clear();
});

describe("markdownPaste.looksLikeMarkdown", () => {
  it("detects heading and lists", () => {
    expect(looksLikeMarkdown("# 제목\n\n본문 한 줄")).toBe(true);
    expect(looksLikeMarkdown("- a\n- b\n- c")).toBe(true);
    expect(looksLikeMarkdown("1. 첫째\n2. 둘째")).toBe(true);
  });

  it("detects bold/links/quote/code-fence", () => {
    expect(looksLikeMarkdown("**굵게** 표시")).toBe(true);
    expect(looksLikeMarkdown("[클릭](https://example.com)")).toBe(true);
    expect(looksLikeMarkdown("> 인용")).toBe(true);
    expect(looksLikeMarkdown("```js\nconst x=1;\n```")).toBe(true);
  });

  it("ignores plain prose without markdown signals", () => {
    expect(looksLikeMarkdown("그냥 평범한 한국어 문장입니다")).toBe(false);
    expect(looksLikeMarkdown("")).toBe(false);
    expect(looksLikeMarkdown("ab")).toBe(false);
  });
});

describe("mobile/snippets", () => {
  it("returns defaults when storage is empty", () => {
    const list = loadSnippets();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list.find((s) => s.trigger === ";인사")).toBeTruthy();
  });

  it("upserts and removes snippets", () => {
    saveSnippets([]);
    const after = upsertSnippet({ trigger: ";새것", body: "안녕" });
    expect(after.length).toBe(1);
    expect(after[0].trigger).toBe(";새것");
    const id = after[0].id;
    const removed = removeSnippet(id);
    expect(removed.length).toBe(0);
  });

  it("updates an existing snippet by id", () => {
    saveSnippets([]);
    const a = upsertSnippet({ id: "x1", trigger: ";a", body: "A" });
    expect(a.length).toBe(1);
    const b = upsertSnippet({ id: "x1", trigger: ";a", body: "AAA" });
    expect(b.length).toBe(1);
    expect(b[0].body).toBe("AAA");
  });
});

describe("mobile/versionStore", () => {
  it("starts empty and pushes new versions", () => {
    expect(loadVersions("doc1")).toEqual([]);
    const v1 = pushVersion("doc1", { html: "<p>A</p>", label: "first" });
    expect(v1.length).toBe(1);
    expect(v1[0].label).toBe("first");
    expect(v1[0].ts).toBeTypeOf("number");
  });

  it("ignores duplicate consecutive html", () => {
    pushVersion("doc1", { html: "<p>A</p>" });
    const list = pushVersion("doc1", { html: "<p>A</p>" });
    expect(list.length).toBe(1);
  });

  it("caps history at 30", () => {
    for (let i = 0; i < 40; i += 1) {
      pushVersion("doc1", { html: `<p>${i}</p>` });
    }
    expect(loadVersions("doc1").length).toBeLessThanOrEqual(30);
  });

  it("clears history per docId", () => {
    pushVersion("doc1", { html: "<p>A</p>" });
    pushVersion("doc2", { html: "<p>B</p>" });
    clearVersions("doc1");
    expect(loadVersions("doc1")).toEqual([]);
    expect(loadVersions("doc2").length).toBe(1);
  });
});

describe("mobile/bookmarks store", () => {
  it("persists per docId without bleeding", () => {
    saveBookmarks("doc1", [{ id: "b1", pos: 10, text: "abc" }]);
    saveBookmarks("doc2", [{ id: "b2", pos: 20, text: "xyz" }]);
    expect(loadBookmarks("doc1").length).toBe(1);
    expect(loadBookmarks("doc2").length).toBe(1);
    expect(loadBookmarks("doc1")[0].id).toBe("b1");
  });

  it("returns empty list when not set", () => {
    expect(loadBookmarks("missing")).toEqual([]);
  });
});
