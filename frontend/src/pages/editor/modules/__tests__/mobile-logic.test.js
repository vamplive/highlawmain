import { describe, expect, it } from "vitest";
import { evaluateSeo } from "../mobile/seoCheck";
import { findMatchesInText } from "../mobile/findMatcher";
import { optimizeImage } from "../mobile/imageOptimize";

describe("evaluateSeo", () => {
  it("returns an error for missing title", () => {
    const checks = evaluateSeo({ title: "", excerpt: "", html: "", thumbnailUrl: "" });
    expect(checks.find((c) => c.id === "title")?.level).toBe("error");
  });

  it("warns when title is too short or too long", () => {
    const short = evaluateSeo({ title: "짧은제목" });
    expect(short.find((c) => c.id === "title-short")?.level).toBe("warn");

    const longTitle = "가".repeat(80);
    const long = evaluateSeo({ title: longTitle });
    expect(long.find((c) => c.id === "title-long")?.level).toBe("warn");
  });

  it("flags missing thumbnail and short excerpt", () => {
    const checks = evaluateSeo({
      title: "충분히 긴 좋은 제목입니다",
      excerpt: "짧음",
      html: "",
      thumbnailUrl: "",
    });
    expect(checks.find((c) => c.id === "thumb")?.level).toBe("warn");
    expect(checks.find((c) => c.id === "excerpt-short")?.level).toBe("warn");
  });

  it("inspects HTML for h1, alts and word count", () => {
    const html = `
      <h1>첫 번째 제목</h1>
      <h1>두 번째 제목</h1>
      <p>${"단어 ".repeat(50)}</p>
      <img src="/a.jpg" />
      <img src="/b.jpg" alt="설명" />
    `;
    const checks = evaluateSeo({ title: "충분히 긴 좋은 제목입니다", excerpt: "x".repeat(80), html, thumbnailUrl: "/t.jpg" });
    expect(checks.find((c) => c.id === "h1-many")?.level).toBe("warn");
    expect(checks.find((c) => c.id === "img-alt")?.level).toBe("warn");
  });
});

describe("findMatchesInText", () => {
  it("returns empty when needle empty", () => {
    expect(findMatchesInText("foo bar", "")).toEqual([]);
  });

  it("finds case-insensitive matches", () => {
    const out = findMatchesInText("Hello hello HELLO", "hello", false);
    expect(out.length).toBe(3);
  });

  it("respects case sensitivity flag", () => {
    expect(findMatchesInText("Hello hello", "hello", true).length).toBe(1);
  });

  it("escapes regex metacharacters in needle", () => {
    const out = findMatchesInText("price is $1.50 here", "$1.50", false);
    expect(out.length).toBe(1);
    // 매치 위치는 ProseMirror 보정으로 +1
    expect(out[0].from).toBe("price is ".length + 1);
  });

  it("handles overlapping needle safely (e.g. aaa with aa)", () => {
    const out = findMatchesInText("aaaaa", "aa", false);
    expect(out.length).toBeGreaterThanOrEqual(2);
    // 무한 루프에 빠지지 않고 정상 종료해야 함
  });
});

describe("optimizeImage (guards)", () => {
  it("returns the original file for non-image types", async () => {
    const file = new File(["plain"], "a.txt", { type: "text/plain" });
    const out = await optimizeImage(file);
    expect(out).toBe(file);
  });

  it("returns original for SVG and GIF (skip path)", async () => {
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    expect(await optimizeImage(svg)).toBe(svg);
    const gif = new File([""], "a.gif", { type: "image/gif" });
    expect(await optimizeImage(gif)).toBe(gif);
  });

  it("returns original when createImageBitmap is unavailable / decode fails", async () => {
    // jsdom에는 createImageBitmap이 없거나 실제 디코딩이 안 됨 → 원본 반환 fallback
    const png = new File([new Uint8Array([0])], "a.png", { type: "image/png" });
    const out = await optimizeImage(png);
    expect(out).toBe(png);
  });
});
