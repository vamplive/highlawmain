import { describe, expect, it } from "vitest";
import { escapeAttr, escapeHtml, escapeRegex, sanitizeContractHtml } from "../contract-html";

describe("contract-html utilities", () => {
  it("removes executable HTML while preserving contract formatting tags", () => {
    const html = sanitizeContractHtml(`
      <p style="text-align:center">계약서</p>
      <script>alert(1)</script>
      <img src="javascript:alert(1)" onerror="alert(2)" alt="bad">
      <a href="https://example.com" onclick="alert(3)">link</a>
    `);

    expect(html).toContain('style="text-align:center"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("onclick");
    expect(html).toContain('href="https://example.com"');
  });

  it("preserves public signing controls and safe signature images", () => {
    const html = sanitizeContractHtml(`
      <button type="button" class="yj-sig-empty" data-field-key="client">서명</button>
      <img src="data:image/png;base64,abc123" alt="서명">
    `);

    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
    expect(html).toContain('data-field-key="client"');
    expect(html).toContain("data:image/png;base64,abc123");
  });

  it("escapes generated replacement values", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(escapeAttr('" onmouseover="alert(1)')).toBe("&quot; onmouseover=&quot;alert(1)");
    expect(new RegExp(escapeRegex("a.b[1]")).test("a.b[1]")).toBe(true);
  });

  it("removes risky inline CSS while preserving ordinary inline styles", () => {
    const html = sanitizeContractHtml(`
      <span style="font-weight:700">ok</span>
      <span style="background-image:url(javascript:alert(1))">bad</span>
    `);

    expect(html).toContain('style="font-weight:700"');
    expect(html).not.toContain("background-image");
    expect(html).not.toContain("javascript:");
  });
});
