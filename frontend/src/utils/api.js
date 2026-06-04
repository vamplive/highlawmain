/**
 * API 통신 래퍼 — fetch 기반 REST 클라이언트
 *
 * 두 가지 도메인을 모두 지원:
 *   - `api`: 어드민/공개 API (`/api/*`)        — `admin_session` 쿠키
 *   - `portalApi`: 의뢰인 포털 API (`/api/portal/*`) — `portal_session` 쿠키
 *
 * 공통 인증 전략:
 *   - 모든 요청에 credentials: "include" 로 same-origin 쿠키 자동 전송
 *   - 상태 변경 요청에 더블 서브밋 CSRF 헤더(`x-csrf-token`) 자동 첨부
 */
const API_BASE = "/api";
const PORTAL_BASE = "/api/portal";
const CSRF_ERROR_MESSAGE = "CSRF 토큰이 유효하지 않습니다";
const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

// 백엔드(Node.js) 프로세스가 다운되거나 Nginx가 업스트림에 도달하지 못할 때
// fetch는 200 미만이 아닌 502/503/504를 반환하지만 응답 본문은 HTML(JSON 아님)이라
// res.json() 단계에서 파싱이 실패한다. 이때 노출되던 "HTTP 502" 같은 raw 메시지는
// 일반 운영자에게는 의미가 약하므로, 친절한 한글 안내로 변환하여 노출한다.
function describeUpstreamStatus(status) {
  if (status === 502 || status === 504) {
    return "서버에 일시적으로 연결할 수 없습니다 (HTTP " + status + "). 잠시 후 다시 시도해주세요.";
  }
  if (status === 503) {
    return "서버가 일시적으로 사용 불가 상태입니다 (HTTP 503). 잠시 후 다시 시도해주세요.";
  }
  return null;
}

/**
 * document.cookie에서 특정 쿠키 값을 읽는다.
 * @param {string} name - 쿠키 이름
 * @returns {string|null} 쿠키 값 또는 null
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function buildJsonOptions(method, body) {
  const opts = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  const csrf = getCookie("csrf-token");
  if (csrf) opts.headers["x-csrf-token"] = csrf;
  if (body) opts.body = JSON.stringify(body);
  return opts;
}

function isCsrfError(res, json) {
  return res.status === 403 && json?.error === CSRF_ERROR_MESSAGE;
}

async function refreshCsrfToken() {
  try {
    await fetch(`${API_BASE}/admin-users/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // 원 요청의 오류 처리가 최종 사용자 메시지를 결정한다.
  }
}

/**
 * 공통 fetch 래퍼. 베이스 URL/CSRF/쿠키 처리를 표준화한다.
 * @param {string} base - 베이스 경로 ("/api" 또는 "/api/portal")
 * @param {"GET"|"POST"|"PATCH"|"PUT"|"DELETE"} method
 * @param {string} path - base 뒤에 붙는 경로 (예: "/documents")
 * @param {object} [body] - JSON 바디
 */
async function request(base, method, path, body, retryOnCsrf = true) {
  let res;
  try {
    res = await fetch(`${base}${path}`, buildJsonOptions(method, body));
  } catch {
    throw new Error("서버에 연결할 수 없습니다");
  }

  let json;
  try {
    json = await res.json();
  } catch {
    if (res.ok) throw new Error("응답 파싱 실패");
    // 5xx 상태에서 JSON 파싱이 실패하면 게이트웨이/리버스 프록시 단계 오류일 확률이
    // 높다 (백엔드 다운 → Nginx가 HTML 5xx 페이지 반환). 이런 경우 운영자가
    // 바로 의미를 알 수 있도록 친절한 한글 메시지로 치환한다.
    const friendly = describeUpstreamStatus(res.status);
    const err = new Error(friendly || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    if (retryOnCsrf && STATE_CHANGING_METHODS.has(method) && isCsrfError(res, json)) {
      await refreshCsrfToken();
      return request(base, method, path, body, false);
    }
    const err = new Error(json.error || describeUpstreamStatus(res.status) || "Request failed");
    err.status = res.status;
    throw err;
  }
  return json;
}

/** 멀티파트 파일 업로드 (Content-Type 은 브라우저가 자동 지정) */
async function uploadFile(base, path, file, retryOnCsrf = true) {
  const body = file instanceof FormData ? file : new FormData();
  if (!(file instanceof FormData)) {
    body.append("file", file);
  }
  const headers = {};
  const csrf = getCookie("csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      credentials: "include",
      body,
      headers,
    });
  } catch {
    throw new Error("서버에 연결할 수 없습니다");
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("Upload response parse failed");
  }
  if (!res.ok) {
    if (retryOnCsrf && isCsrfError(res, json)) {
      await refreshCsrfToken();
      return uploadFile(base, path, file, false);
    }
    const err = new Error(json.error || "Upload failed");
    err.status = res.status;
    throw err;
  }
  return json;
}

/** 어드민/공개 API 클라이언트 (`/api/*`) */
export const api = {
  get: (path) => request(API_BASE, "GET", path),
  post: (path, body) => request(API_BASE, "POST", path, body),
  patch: (path, body) => request(API_BASE, "PATCH", path, body),
  put: (path, body) => request(API_BASE, "PUT", path, body),
  del: (path) => request(API_BASE, "DELETE", path),
  delete: (path) => request(API_BASE, "DELETE", path),
  upload: (path, file) => uploadFile(API_BASE, path, file),
};

/** 의뢰인 포털 API 클라이언트 (`/api/portal/*`) */
export const portalApi = {
  get: (path) => request(PORTAL_BASE, "GET", path),
  post: (path, body) => request(PORTAL_BASE, "POST", path, body),
  put: (path, body) => request(PORTAL_BASE, "PUT", path, body),
  patch: (path, body) => request(PORTAL_BASE, "PATCH", path, body),
  delete: (path) => request(PORTAL_BASE, "DELETE", path),
  upload: (path, file) => uploadFile(PORTAL_BASE, path, file),
};
