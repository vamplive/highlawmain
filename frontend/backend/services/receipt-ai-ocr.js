/**
 * Claude Vision 기반 영수증 OCR
 *
 * 이미지(또는 PDF 첫 페이지를 이미지로 변환)를 Anthropic Claude API에 전달하여
 * Tool Use 방식으로 구조화된 JSON을 강제 추출한다.
 *
 * - 모델: claude-haiku-4-5 (저비용·고정확도)
 * - 폴백: 호출 실패 시 호출자가 tesseract 기반 receipt-ocr 로 다시 시도
 *
 * 환경변수
 *   ANTHROPIC_API_KEY  — 필수
 *   RECEIPT_AI_MODEL   — 선택 (기본: claude-haiku-4-5)
 */
const fs = require("fs");
const path = require("path");
let sharp = null;
try { sharp = require("sharp"); } catch { /* sharp 없으면 리사이즈 스킵 */ }

// Anthropic Vision 권장: 긴 변 1568px·JPEG 80% — 영수증 글자 가독성 유지하면서 토큰 70~80% 절감.
// 이미지가 이미 작거나 sharp 미설치 시 원본 그대로 전송.
const IMAGE_LONG_EDGE_PX = Number(process.env.RECEIPT_IMAGE_LONG_EDGE || 1568);
const IMAGE_JPEG_QUALITY = Number(process.env.RECEIPT_IMAGE_QUALITY || 82);

/** 이미지 버퍼를 토큰 효율적인 형태로 리사이즈. PDF는 그대로 통과시킴. */
async function preprocessImage(buf) {
  if (!sharp) return { buf, mediaType: null, resized: false };
  try {
    const meta = await sharp(buf).metadata();
    if (!meta || !meta.width || !meta.height) return { buf, mediaType: null, resized: false };
    const longEdge = Math.max(meta.width, meta.height);
    if (longEdge <= IMAGE_LONG_EDGE_PX) {
      // 이미 충분히 작음 — 원본 그대로
      return { buf, mediaType: null, resized: false };
    }
    const out = await sharp(buf)
      .rotate() // EXIF 방향 자동 보정 (스마트폰 사진)
      .resize({ width: IMAGE_LONG_EDGE_PX, height: IMAGE_LONG_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { buf: out, mediaType: "image/jpeg", resized: true, before: buf.length, after: out.length };
  } catch (err) {
    console.warn("[receipt-ai-ocr] 이미지 리사이즈 실패, 원본 사용:", err.message);
    return { buf, mediaType: null, resized: false };
  }
}

// 영수증 OCR은 작은 한국어 글자·낮은 해상도가 많아 Sonnet 4.6 권장 (Haiku 4.5는 카드사·금액 오인식)
const DEFAULT_MODEL = process.env.RECEIPT_AI_MODEL || "claude-sonnet-4-6";

// USD → KRW 환율 (대략. 정확한 회계용은 아니고 운영자 모니터링용)
const USD_TO_KRW = Number(process.env.USD_TO_KRW || 1380);

/**
 * Anthropic 공식 가격 (USD per 1,000,000 tokens) — 2025-10 기준
 * 정확한 청구는 Anthropic 콘솔의 사용량 페이지를 봐야 하지만,
 * 영수증 화면에 대략적 비용을 보여주기 위한 추정치.
 */
const MODEL_PRICING = {
  "claude-sonnet-4-6":          { input: 3.00,  output: 15.00 },
  "claude-sonnet-4-6-20250514": { input: 3.00,  output: 15.00 },
  "claude-haiku-4-5":           { input: 0.25,  output: 1.25  },
  "claude-haiku-4-5-20251001":  { input: 0.25,  output: 1.25  },
  "claude-opus-4-7":            { input: 15.00, output: 75.00 },
};

function calculateCost(modelId, inputTokens, outputTokens, cacheReadTokens = 0, cacheCreateTokens = 0) {
  // 모델 ID는 정확한 versioned ID(예: claude-sonnet-4-6-20250514) 또는 alias
  // 둘 다 매칭 시도, 없으면 prefix 매칭
  let pricing = MODEL_PRICING[modelId];
  if (!pricing) {
    const matchKey = Object.keys(MODEL_PRICING).find((k) => modelId && modelId.startsWith(k));
    pricing = matchKey ? MODEL_PRICING[matchKey] : null;
  }
  if (!pricing) return { usd: null, krw: null };
  // Anthropic 정책: cache write = 1.25× 입력, cache read = 0.1× 입력
  const usd =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output +
    (cacheCreateTokens / 1_000_000) * pricing.input * 1.25 +
    (cacheReadTokens   / 1_000_000) * pricing.input * 0.1;
  return { usd, krw: usd * USD_TO_KRW };
}

const TOOL_SCHEMA = {
  name: "extract_receipt",
  description: "영수증 이미지에서 결제 정보를 추출합니다. 추출할 수 없는 필드는 null로 둡니다.",
  input_schema: {
    type: "object",
    properties: {
      vendor:    { type: ["string", "null"], description: "가맹점·매장명 (예: '스타벅스 강남점')" },
      amount:    { type: ["integer", "null"], description: "결제 총액(원). 부가세·공급가액·받은금액·거스름돈이 아닌 실제 결제 총액" },
      paidAt:    { type: ["string", "null"], description: "결제 일시 (YYYY-MM-DD HH:mm:ss). 시간 미상이면 00:00:00" },
      cardName:  { type: ["string", "null"], description: "카드사 이름 (예: '신한카드', 'KB국민카드'). 현금이면 '현금'" },
      cardFirst4:{ type: ["string", "null"], description: "카드번호 앞 4자리 숫자. 1234-****-****-**** 또는 1234********9999 처럼 앞자리가 노출된 경우만. 없으면 null" },
      cardLast4: { type: ["string", "null"], description: "카드번호 끝 4자리 숫자. ****-****-****-1234 처럼 끝자리가 노출된 경우만. 없으면 null" },
      category:  { type: ["string", "null"], description: "지출 분류 추정 (식대/교통/사무/접대/기타). 모르면 null" },
      items:     {
        type: "array",
        description: "구매 품목 목록. 영수증에 품목이 한 줄이라도 적혀 있으면 모두 추출하세요. 품목 라인이 전혀 없으면 빈 배열.",
        items: {
          type: "object",
          properties: {
            name:     { type: "string", description: "품목명 (예: '아메리카노 Tall', '프린터 토너')" },
            quantity: { type: ["integer", "null"], description: "수량. 영수증에 명시된 경우만." },
            price:    { type: ["integer", "null"], description: "해당 품목의 합계 금액(원). 단가가 아니라 수량×단가." },
          },
          required: ["name"],
        },
      },
      confidence: { type: "number", description: "추출 신뢰도 0.0–1.0. 흐림·잘림으로 자신 없으면 낮게." },
      notes:      { type: ["string", "null"], description: "사람이 확인할 만한 특이사항 (옵션)" },
    },
    required: ["vendor", "amount", "paidAt", "cardName", "cardLast4", "confidence", "items"],
  },
};

const SYSTEM_PROMPT = `당신은 한국 영수증 분석 전문가입니다.

규칙:
1. 결제 총액(amount)은 "카드승인금액", "결제금액", "총결제", "합계금액" 등 최종 결제 라벨의 숫자입니다.
   부가세, 공급가액, 받은금액(현금), 거스름돈, 포인트, 할인, 카드번호, 사업자번호, 승인번호는 절대 amount로 쓰지 마세요.
   카드번호처럼 보이는 8자리 이상 숫자(예: 41299400)는 절대 amount가 아닙니다.
2. 가맹점명(vendor)은 영수증 상단의 큰 글씨 상호이거나, "상호:", "가맹점명:" 라벨 뒤 값,
   또는 사업자번호 바로 위에 적힌 회사명입니다. "번호 xxxxxx" 같이 숫자가 섞인 텍스트는 vendor가 아닙니다.
   광고 문구, 인사말, 영수증 헤더 텍스트("MEMBER COPY", "EDC매출표" 등)는 제외하세요.
3. 날짜(paidAt)는 "거래일시", "승인일시"가 우선. 형식은 정확히 "YYYY-MM-DD HH:mm:ss". 시간이 없으면 00:00:00.
4. 카드사(cardName)는 영수증에 명시된 카드 발급사 이름 뒤에 "카드"를 붙입니다.
   - "신한카드", "삼성카드", "현대카드", "롯데카드", "하나카드", "우리카드", "BC카드", "씨티카드"
   - "KB국민카드", "NH농협카드"는 그대로 (뒤에 추가 "카드" 안 붙임)
   - 영수증에 카드사명이 안 보이거나 "신용승인"만 있으면 null (절대 "신용카드"라고 쓰지 마세요)
   - 현금 결제면 "현금"
5. 카드번호 자리(cardFirst4 / cardLast4):
   - 앞 4자리(cardFirst4): "1234-****-****-****" 또는 "1234********9999"의 앞 "1234". 보이지 않으면 null.
   - 끝 4자리(cardLast4): "****-****-****-1234"의 끝 "1234". 보이지 않으면 null.
   - 둘 다 보이는 영수증이면 둘 다 추출. 둘 중 하나만 마스킹 해제된 경우가 더 흔하므로, 보이는 쪽만 추출하고 다른 쪽은 null.
   - 정확히 4자리 숫자만. 별표(*)·하이픈은 절대 포함 금지.
6. 추출 불가능하거나 자신 없는 필드는 null로 두고 confidence를 낮추세요. 추측하지 마세요.
7. 품목(items)은 영수증에 적힌 모든 구매 품목을 빠짐없이 추출하세요.
   - "수량 단가 금액" 표 형태는 그대로 매핑.
   - "옵션:샷추가" 같은 부속행은 직전 품목의 부가설명으로 보고, 별도 품목으로 만들지 마세요.
   - 부가세·할인·합계·받은금액 등 라벨 행은 절대 품목이 아닙니다.
8. 반드시 extract_receipt 도구를 사용해 응답하세요. 자유 텍스트 응답 금지.`;

function getClient() {
  const Anthropic = require("@anthropic-ai/sdk");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error("ANTHROPIC_API_KEY 미설정");
    err.code = "NO_API_KEY";
    throw err;
  }
  return new Anthropic.default({ apiKey });
}

function detectKind(filePath, mimeType) {
  const mt = (mimeType || "").toLowerCase();
  const ext = path.extname(filePath).toLowerCase();
  if (mt === "application/pdf" || ext === ".pdf") {
    return { kind: "pdf", mediaType: "application/pdf" };
  }
  if (mt === "image/jpeg" || ext === ".jpg" || ext === ".jpeg") return { kind: "image", mediaType: "image/jpeg" };
  if (mt === "image/png"  || ext === ".png")  return { kind: "image", mediaType: "image/png" };
  if (mt === "image/webp" || ext === ".webp") return { kind: "image", mediaType: "image/webp" };
  if (mt === "image/gif"  || ext === ".gif")  return { kind: "image", mediaType: "image/gif" };
  return null;
}

/**
 * 이미지 또는 PDF 영수증을 Claude Vision으로 분석한다.
 * - 이미지: type: "image"
 * - PDF:   type: "document" (Claude API 네이티브 PDF 지원, 페이지를 이미지로 자동 렌더링)
 * @returns {Promise<{ vendor, amount, paidAt, cardName, cardLast4, category, items, confidence, notes, ocrStatus, ocrText, model }>}
 */
async function processReceiptWithAI({ filePath, mimeType }) {
  const detected = detectKind(filePath, mimeType);
  if (!detected) {
    const err = new Error(`AI OCR이 지원하지 않는 형식: ${mimeType || path.extname(filePath)}`);
    err.code = "UNSUPPORTED_MIME";
    throw err;
  }

  const client = getClient();
  let buf = fs.readFileSync(filePath);
  let mediaType = detected.mediaType;
  let resizeInfo = null;

  // 이미지면 토큰 절감을 위해 리사이즈 (PDF는 통과)
  if (detected.kind === "image") {
    const r = await preprocessImage(buf);
    buf = r.buf;
    if (r.mediaType) mediaType = r.mediaType;
    if (r.resized) resizeInfo = { before: r.before, after: r.after };
  }
  const base64 = buf.toString("base64");

  // 이미지는 image 블록, PDF는 document 블록으로 전송
  const sourceBlock = detected.kind === "pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image",    source: { type: "base64", media_type: mediaType, data: base64 } };

  // 시스템 프롬프트에 cache_control 적용 → 5분 TTL 동안 후속 영수증 호출의 입력 토큰 90% 할인.
  // 50건 일괄 업로드 시 시스템 프롬프트 (~700 tok)가 1회만 풀 가격, 나머지는 캐시 히트.
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "tool", name: "extract_receipt" },
    messages: [
      {
        role: "user",
        content: [
          sourceBlock,
          {
            type: "text",
            text: "이 영수증에서 결제 정보를 추출해 extract_receipt 도구로 응답하세요. " +
                  "items 배열에는 영수증에 표시된 모든 구매 품목(이름·수량·금액)을 빠짐없이 담아야 합니다. " +
                  "영수증에 품목이 보이는데도 items를 비워서 응답하면 안 됩니다. " +
                  "여러 페이지가 있으면 첫 페이지의 영수증 정보만 추출합니다.",
          },
        ],
      },
    ],
  });
  if (resizeInfo) {
    console.log(`[receipt-ai-ocr] 이미지 리사이즈: ${(resizeInfo.before/1024).toFixed(0)}KB → ${(resizeInfo.after/1024).toFixed(0)}KB`);
  }

  const toolUse = (response.content || []).find((c) => c.type === "tool_use");
  if (!toolUse || !toolUse.input) {
    const err = new Error("Claude가 도구를 호출하지 않았습니다");
    err.code = "NO_TOOL_USE";
    throw err;
  }

  const data = toolUse.input;
  const confidence = typeof data.confidence === "number" ? data.confidence : null;
  const inputTokens  = response.usage?.input_tokens  || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  const cacheReadTokens   = response.usage?.cache_read_input_tokens     || 0;
  const cacheCreateTokens = response.usage?.cache_creation_input_tokens || 0;
  const cost = calculateCost(response.model, inputTokens, outputTokens, cacheReadTokens, cacheCreateTokens);

  return {
    vendor:    data.vendor    || null,
    amount:    Number.isFinite(data.amount) ? data.amount : null,
    paidAt:    data.paidAt    || null,
    cardName:  data.cardName  || null,
    cardFirst4:data.cardFirst4|| null,
    cardLast4: data.cardLast4 || null,
    category:  data.category  || null,
    items:     Array.isArray(data.items) ? data.items : [],
    notes:     data.notes     || null,
    confidence,
    ocrStatus: confidence != null && confidence < 0.5 ? "low_confidence" : "done",
    ocrText:   JSON.stringify({ ...data, _model: response.model }, null, 2),
    model:     response.model,
    usage:     response.usage,
    inputTokens,
    outputTokens,
    costUsd: cost.usd,
    costKrw: cost.krw,
  };
}

function isAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

module.exports = { processReceiptWithAI, isAvailable, DEFAULT_MODEL };
