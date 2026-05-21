/**
 * API 문서 라우트 — OpenAPI JSON 스펙 및 Swagger UI 서빙
 * - /api/docs/ 에서 Swagger UI 제공 (CDN 기반, npm 의존성 없음)
 * - /api/docs/openapi.json 에서 OpenAPI 3.0 스펙 제공
 */
const { Router } = require("express");
const path = require("path");
const { adminAuth } = require("../lib/auth");

const router = Router();

router.use(adminAuth);

// OpenAPI JSON 스펙 서빙
router.get("/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "../docs/openapi.json"));
});

// Swagger UI (CDN 기반, 별도 npm 패키지 불필요)
router.get("/", (req, res) => {
  const nonce = res.locals.cspNonce || "";
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>법무법인 하이로 API 문서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style nonce="${nonce}">
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script nonce="${nonce}">
    SwaggerUIBundle({
      url: "/api/docs/openapi.json",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
    });
  </script>
</body>
</html>`);
});

module.exports = router;
