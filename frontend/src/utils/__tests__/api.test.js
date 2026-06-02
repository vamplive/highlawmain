/**
 * api.js — fetch 래퍼 단위 테스트
 * 메서드 디스패치, 인증/CSRF 헤더 주입, 바디 직렬화, 오류 처리 경로를 검증한다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "../../utils/api.js";

/** fetch Response 흉내 — ok=true면 .json()이 value 반환, 아니면 에러 객체 반환 */
function mockResponse({ ok = true, status = 200, json = {} } = {}) {
  return {
    ok,
    status,
    json: vi.fn(() => Promise.resolve(json)),
  };
}

/** jsdom 쿠키는 빈 문자열 대입으로 지워지지 않으므로 각 쿠키에 과거 만료일을 지정한다 */
function clearAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

describe("api — 메서드 디스패치", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse({ json: { data: "ok" } })));
    clearAllCookies();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET은 /api 접두사로 fetch를 호출한다", async () => {
    await api.get("/documents");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/documents",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("POST는 바디를 JSON 직렬화한다", async () => {
    await api.post("/documents", { title: "문서" });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ title: "문서" }));
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("PATCH/PUT도 JSON 직렬화한다", async () => {
    await api.patch("/documents/1", { title: "수정" });
    expect(global.fetch.mock.calls[0][1].method).toBe("PATCH");
    await api.put("/documents/1", { title: "교체" });
    expect(global.fetch.mock.calls[1][1].method).toBe("PUT");
  });

  it("DELETE는 바디 없이 호출한다 (del과 delete 별칭 둘 다)", async () => {
    await api.del("/documents/1");
    expect(global.fetch.mock.calls[0][1].method).toBe("DELETE");
    expect(global.fetch.mock.calls[0][1].body).toBeUndefined();
    await api.delete("/documents/1");
    expect(global.fetch.mock.calls[1][1].method).toBe("DELETE");
  });

  it("성공 응답은 파싱된 JSON을 반환한다", async () => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse({ json: { data: [1, 2] } })));
    const result = await api.get("/documents");
    expect(result).toEqual({ data: [1, 2] });
  });
});

describe("api — 인증/CSRF 헤더 주입", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse()));
    clearAllCookies();
    sessionStorage.clear();
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it("모든 요청은 credentials: include 로 쿠키를 자동 전송한다", async () => {
    await api.get("/documents");
    expect(global.fetch.mock.calls[0][1].credentials).toBe("include");
  });

  it("Authorization 헤더는 사용하지 않는다 (HttpOnly 쿠키 인증)", async () => {
    await api.get("/documents");
    expect(global.fetch.mock.calls[0][1].headers["Authorization"]).toBeUndefined();
  });

  it("csrf-token 쿠키가 있으면 x-csrf-token 헤더가 붙는다", async () => {
    document.cookie = "csrf-token=xyz123";
    await api.post("/documents", {});
    expect(global.fetch.mock.calls[0][1].headers["x-csrf-token"]).toBe("xyz123");
  });

  it("csrf-token 쿠키가 없으면 x-csrf-token 헤더가 없다", async () => {
    await api.post("/documents", {});
    expect(global.fetch.mock.calls[0][1].headers["x-csrf-token"]).toBeUndefined();
  });

  it("URL 인코딩된 쿠키 값은 디코딩해서 넣는다", async () => {
    document.cookie = "csrf-token=abc%2Fdef";
    await api.get("/documents");
    expect(global.fetch.mock.calls[0][1].headers["x-csrf-token"]).toBe("abc/def");
  });
});

describe("api — 오류 처리", () => {
  beforeEach(() => {
    clearAllCookies();
    sessionStorage.clear();
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it("네트워크 오류는 '서버에 연결할 수 없습니다'를 던진다", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Failed to fetch")));
    await expect(api.get("/documents")).rejects.toThrow("서버에 연결할 수 없습니다");
  });

  it("HTTP 오류 응답은 json.error를 메시지로, status를 필드로 담아 던진다", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mockResponse({ ok: false, status: 404, json: { error: "Not found" } }))
    );
    try {
      await api.get("/documents/missing");
      expect.fail("에러가 던져져야 함");
    } catch (err) {
      expect(err.message).toBe("Not found");
      expect(err.status).toBe(404);
    }
  });

  it("상태 변경 요청에서 CSRF 토큰이 만료되면 새 토큰을 받고 한 번 재시도한다", async () => {
    document.cookie = "csrf-token=stale";
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockResponse({
        ok: false,
        status: 403,
        json: { error: "CSRF 토큰이 유효하지 않습니다" },
      }))
      .mockImplementationOnce(() => {
        document.cookie = "csrf-token=fresh";
        return Promise.resolve(mockResponse({ ok: false, status: 401, json: { error: "Unauthorized" } }));
      })
      .mockResolvedValueOnce(mockResponse({ json: { data: { sent: 1 } } }));

    const result = await api.post("/messages/send", { channel: "sms" });

    expect(result).toEqual({ data: { sent: 1 } });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[0][1].headers["x-csrf-token"]).toBe("stale");
    expect(global.fetch.mock.calls[1][0]).toBe("/api/admin-users/me");
    expect(global.fetch.mock.calls[2][1].headers["x-csrf-token"]).toBe("fresh");
  });

  it("CSRF가 아닌 403 오류는 재시도하지 않는다", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mockResponse({ ok: false, status: 403, json: { error: "Forbidden" } }))
    );
    await expect(api.post("/messages/send", {})).rejects.toThrow("Forbidden");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("JSON 파싱 실패 + 성공 상태는 '응답 파싱 실패'를 던진다", async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.reject(new Error("Unexpected token")),
    }));
    await expect(api.get("/documents")).rejects.toThrow("응답 파싱 실패");
  });

  it("JSON 파싱 실패 + 오류 상태는 HTTP 상태를 메시지에 담는다", async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false, status: 500,
      json: () => Promise.reject(new Error("bad json")),
    }));
    await expect(api.get("/documents")).rejects.toThrow("HTTP 500");
  });
});

describe("api.upload — 파일 업로드", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse({ json: { data: { id: "doc-1" } } })));
    clearAllCookies();
    sessionStorage.clear();
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it("FormData로 파일을 담아 POST한다", async () => {
    const file = new File(["hello"], "a.txt", { type: "text/plain" });
    await api.upload("/documents/upload", file);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/documents/upload");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    expect(opts.body.get("file")).toBe(file);
  });

  it("upload는 CSRF 헤더와 쿠키 인증을 포함한다", async () => {
    document.cookie = "csrf-token=csrf123";
    await api.upload("/documents/upload", new File(["x"], "x.txt"));
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.credentials).toBe("include");
    expect(opts.headers["x-csrf-token"]).toBe("csrf123");
    // FormData를 쓸 때는 Content-Type을 수동 설정하지 않는다 (브라우저가 boundary 포함 자동 설정)
    expect(opts.headers["Content-Type"]).toBeUndefined();
    expect(opts.headers["Authorization"]).toBeUndefined();
  });

  it("업로드 네트워크 오류는 '서버에 연결할 수 없습니다'를 던진다", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("network down")));
    await expect(api.upload("/x", new File(["x"], "x.txt")))
      .rejects.toThrow("서버에 연결할 수 없습니다");
  });

  it("업로드 HTTP 오류는 status가 담긴 에러를 던진다", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(mockResponse({ ok: false, status: 413, json: { error: "파일이 너무 큼" } }))
    );
    try {
      await api.upload("/x", new File(["x"], "x.txt"));
      expect.fail("에러가 던져져야 함");
    } catch (err) {
      expect(err.message).toBe("파일이 너무 큼");
      expect(err.status).toBe(413);
    }
  });

  it("업로드도 CSRF 토큰 만료 시 갱신 후 재시도한다", async () => {
    document.cookie = "csrf-token=old";
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockResponse({
        ok: false,
        status: 403,
        json: { error: "CSRF 토큰이 유효하지 않습니다" },
      }))
      .mockImplementationOnce(() => {
        document.cookie = "csrf-token=new";
        return Promise.resolve(mockResponse({ ok: false, status: 401, json: { error: "Unauthorized" } }));
      })
      .mockResolvedValueOnce(mockResponse({ json: { data: { id: "file-1" } } }));

    const result = await api.upload("/documents/upload", new File(["x"], "x.txt"));

    expect(result).toEqual({ data: { id: "file-1" } });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[2][1].headers["x-csrf-token"]).toBe("new");
  });
});
