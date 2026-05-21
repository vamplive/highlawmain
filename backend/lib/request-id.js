/**
 * request-id 미들웨어 — 모든 요청에 고유 ID를 부착한다.
 *
 * - 클라이언트가 X-Request-Id 헤더를 보내면 그 값을 그대로 사용 (분산 추적용)
 * - 없으면 16바이트 hex 무작위 ID 생성
 * - 응답에도 X-Request-Id 헤더를 echo하여 사용자/클라이언트가 문의 시 참조 가능
 * - req.id에 저장되어 logger.child({ reqId }) 등으로 컨텍스트 확장 가능
 */
const crypto = require("crypto");

function requestId(req, res, next) {
  const incoming = req.get("X-Request-Id");
  const id = (incoming && /^[A-Za-z0-9_-]{1,64}$/.test(incoming))
    ? incoming
    : crypto.randomBytes(8).toString("hex");
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = requestId;
