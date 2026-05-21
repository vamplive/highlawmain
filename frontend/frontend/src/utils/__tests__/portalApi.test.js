/**
 * portalApi (api.js) — 포털 fetch 래퍼 단위 테스트
 * `/api/portal` 베이스 경로, x-csrf-token 주입, 바디 직렬화, 오류 처리 경로를 검증한다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { portalApi } from "../api";

function mockResponse({ ok = true, status = 200, json = {} } = {}) {
  return {
    ok,
    status,
    json: vi.fn(() => Promise.resolve(json)),
  };
}

function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

describe("portalApi — 메서드 및 경로", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse()));
    clearAllCookies();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("/api/portal 접두사로 호출한다", async () => {
    await portalApi.get("/login");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/portal/login",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("body가 있으면 JSON 직렬화한다", async () => {
    await portalApi.post("/login", { email: "a@b.com" });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ email: "a@b.com" }));
  });

  it("body가 없으면 opts.body도 없다", async () => {
    await portalApi.get("/me");
    expect(global.fetch.mock.calls[0][1].body).toBeUndefined();
  });

  it("get/post/patch/delete 가 각 HTTP 메서드로 매핑된다", async () => {
    await portalApi.get("/me");
    await portalApi.post("/login", { email: "a@b.com" });
    await portalApi.patch("/profile", { name: "x" });
    await portalApi.delete("/session");
    expect(global.fetch.mock.calls[0][1].method).toBe("GET");
    expect(global.fetch.mock.calls[1][1].method).toBe("POST");
    expect(global.fetch.mock.calls[2][1].method).toBe("PATCH");
    expect(global.fetch.mock.calls[3][1].method).toBe("DELETE");
  });
});

describe("portalApi — 헤더 주입", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse()));
    clearAllCookies();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("Content-Type은 application/json", async () => {
    await portalApi.post("/x", { a: 1 });
    expect(global.fetch.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  });

  it("csrf-token 쿠키가 있으면 x-csrf-token 헤더가 추가된다", async () => {
    document.cookie = "csrf-token=abc";
    await portalApi.post("/x", {});
    expect(global.fetch.mock.calls[0][1].headers["x-csrf-token"]).toBe("abc");
  });

  it("csrf-token이 없으면 x-csrf-token 헤더도 없다", async () => {
    await portalApi.post("/x", {});
    expect(global.fetch.mock.calls[0][1].headers["x-csrf-token"]).toBeUndefined();
  });
});

describe("portalApi — 오류 처리", () => {
  beforeEach(() => {
    clearAllCookies();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("네트워크 실패 시 '서버에 연결할 수 없습니다' 에러를 던진다", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("fail")));
    await expect(portalApi.get("/me")).rejects.toThrow("서버에 연결할 수 없습니다");
  });

  it("HTTP 오류 시 json.error를 메시지로 던진다", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mockResponse({ ok: false, status: 401, json: { error: "인증 실패" } }))
    );
    await expect(portalApi.post("/login", {})).rejects.toThrow("인증 실패");
  });

  it("HTTP 오류에 error 필드가 없으면 기본 'Request failed' 메시지", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mockResponse({ ok: false, status: 500, json: {} }))
    );
    await expect(portalApi.post("/login", {})).rejects.toThrow("Request failed");
  });

  it("성공 응답은 파싱된 JSON을 반환한다", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mockResponse({ json: { data: { id: "u1" } } }))
    );
    const result = await portalApi.get("/me");
    expect(result).toEqual({ data: { id: "u1" } });
  });
});
