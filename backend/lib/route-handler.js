/**
 * 라우트 핸들러 공통 유틸 — ServiceError의 status를 보존해 정확한 HTTP 코드를 응답한다.
 *
 * 왜 필요한가:
 *  - 라우트마다 catch 블록을 직접 쓰면 대부분 500으로 묶여 400/401/403/404/409 같은
 *    의미 있는 코드가 사라진다. 클라이언트와 운영자가 원인을 알 수 없게 된다.
 *  - ServiceError(message, status)에서 status를 그대로 응답하고, 그 외 예외만 500.
 */
const logger = require("./logger");

/**
 * Express 비동기 핸들러를 감싸 ServiceError를 자동 처리한다.
 * @template T
 * @param {(req, res) => Promise<T>} handler
 * @returns {(req, res) => Promise<void>}
 */
function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      handleError(res, e);
    }
  };
}

/**
 * 예외를 적절한 HTTP 응답으로 변환한다.
 *  - ServiceError: e.status, e.message 그대로 응답.
 *  - 그 외: 500 + 일반 메시지. 원본은 logger로만 기록.
 * @param {import('express').Response} res
 * @param {Error} e
 */
function handleError(res, e) {
  if (e && e.name === "ServiceError" && Number.isInteger(e.status)) {
    return res.status(e.status).json({ data: null, error: e.message, meta: null });
  }
  logger.error({ err: e }, "route error");
  res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
}

module.exports = { wrap, handleError };
