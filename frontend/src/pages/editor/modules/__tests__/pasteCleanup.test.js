import { describe, expect, it } from "vitest";
import { plainTextToPasteHtml, sanitizeEditorPasteHtml } from "../pasteCleanup";

describe("sanitizeEditorPasteHtml", () => {
  it("removes Word/web inline styles and classes while preserving semantic tags", () => {
    const html = `
      <p class="MsoNormal" style="margin:0;color:red">
        <span style="font-family:Calibri">Before </span>
        <strong>bold</strong><em> italic</em><u> underline</u>
      </p>
    `;

    const out = sanitizeEditorPasteHtml(html);

    expect(out).toContain("<p>");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em> italic</em>");
    expect(out).toContain("<u> underline</u>");
    expect(out).not.toMatch(/\bstyle=/i);
    expect(out).not.toMatch(/\bclass=/i);
    expect(out).not.toMatch(/<span/i);
  });

  it("drops unsafe tags, event handlers, and javascript links", () => {
    const out = sanitizeEditorPasteHtml(`
      <p onclick="alert(1)">safe<script>alert(1)</script></p>
      <a href="javascript:alert(1)" style="color:red">bad link</a>
      <img src="x" onerror="alert(1)" alt="image">
    `);

    expect(out).toContain("<p>safe</p>");
    expect(out).toContain("bad link");
    expect(out).toContain('<img src="x" alt="image">');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|style=/i);
  });

  it("preserves lists and table structure from pasted HTML", () => {
    const out = sanitizeEditorPasteHtml(`
      <ul style="margin-left:40px"><li><span>One</span></li><li>Two</li></ul>
      <table style="width:100%"><tr><th>A</th><td colspan="2">B</td></tr></table>
    `);

    expect(out).toContain("<ul><li>One</li><li>Two</li></ul>");
    expect(out).toContain("<table><tbody><tr><th>A</th><td colspan=\"2\">B</td></tr></tbody></table>");
    expect(out).not.toMatch(/\bstyle=/i);
  });
});

describe("plainTextToPasteHtml", () => {
  it("escapes plain text before converting newlines to breaks", () => {
    expect(plainTextToPasteHtml("<b>A</b>\nB & C")).toBe("&lt;b&gt;A&lt;/b&gt;<br>B &amp; C");
  });
});
