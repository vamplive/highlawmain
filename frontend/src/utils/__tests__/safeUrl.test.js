import { describe, expect, it } from "vitest";
import { isSafeHttpUrl, safeHttpUrl } from "../safeUrl";

describe("safeUrl", () => {
  it("allows http(s) URLs and same-origin relative paths", () => {
    expect(isSafeHttpUrl("https://pf.kakao.com/_abc/chat")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("/uploads/media/og.jpg")).toBe(true);
  });

  it("blocks executable and protocol-relative URLs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHttpUrl("//evil.example/path")).toBe(false);
  });

  it("returns fallback for unsafe input", () => {
    expect(safeHttpUrl("javascript:alert(1)", "https://safe.example")).toBe("https://safe.example");
  });
});
