/**
 * 영수증 OCR + 파서 서비스
 * - 이미지(JPG/PNG/WEBP): tesseract.js (한국어+영어, 워커 재사용)
 * - PDF: pdf-parse v2 (PDFParse 클래스)로 텍스트 레이어 우선 추출
 *
 * 파서 설계 — 한국 영수증의 라벨-값 구조에 맞춘 점수 기반 결정
 *  • 결제 총액 라벨(결제금액/카드승인금액/합계금액 등)에 가까운 금액에 강한 가산점
 *  • 부가세/공급가액/거스름돈/받은금액/포인트/할인 같은 비-결제 라벨은 제외
 *  • 사업자번호/전화번호/카드번호/승인번호는 금액 후보에서 사전 제거
 *  • 화폐 표시(₩/원/won/KRW)가 있는 후보 우선
 *  • 라벨이 없는 경우에만 "₩ 표시 + 가장 큰 금액" 폴백
 */
const fs = require("fs");
const path = require("path");

let _worker = null;
let _workerPromise = null;

/** tesseract 워커를 모듈 단위로 한 번만 생성 — 첫 호출은 traineddata 다운로드로 느릴 수 있음 */
async function getWorker() {
  if (_worker) return _worker;
  if (!_workerPromise) {
    _workerPromise = (async () => {
      const { createWorker } = require("tesseract.js");
      const worker = await createWorker(["kor", "eng"]);
      _worker = worker;
      return worker;
    })();
  }
  return _workerPromise;
}

async function ocrImage(filePath) {
  const worker = await getWorker();
  const { data } = await worker.recognize(filePath);
  return data.text || "";
}

/** PDF 텍스트 추출 — pdf-parse v2 의 PDFParse 클래스 API 사용 */
async function extractPdfText(filePath) {
  let parser;
  try {
    const { PDFParse } = require("pdf-parse");
    const buf = fs.readFileSync(filePath);
    parser = new PDFParse({ data: buf });
    const out = await parser.getText();
    return (out && out.text) || "";
  } catch (err) {
    console.error("[receipt-ocr] PDF 파싱 실패:", err.message);
    return "";
  } finally {
    try { await parser?.destroy?.(); } catch { /* ignore */ }
  }
}

async function extractText({ filePath, mimeType }) {
  const ext = path.extname(filePath).toLowerCase();
  if (mimeType === "application/pdf" || ext === ".pdf") {
    return extractPdfText(filePath);
  }
  return ocrImage(filePath);
}

/* ─────────────── 한국 영수증 파서 ─────────────── */

const CARD_BRANDS = [
  "신한", "삼성", "현대", "롯데", "하나", "우리", "씨티", "BC", "비씨",
  "KB국민", "국민", "NH농협", "농협", "카카오뱅크", "토스",
];
const CARD_BRANDS_EN = {
  "Shinhan": "신한", "SHINHAN": "신한",
  "Samsung": "삼성", "SAMSUNG": "삼성",
  "Hyundai": "현대", "HYUNDAI": "현대",
  "Lotte": "롯데", "LOTTE": "롯데",
  "Hana": "하나", "HANA": "하나",
  "Woori": "우리", "WOORI": "우리",
  "KB": "KB국민", "Kookmin": "KB국민",
  "NH": "NH농협", "Nonghyup": "NH농협",
  "Kakao": "카카오뱅크", "Toss": "토스",
};

/**
 * 라벨 사전 — 점수 가산용
 * primary: 거의 확정적으로 결제 총액 (예: "카드승인금액 12,500")
 * strong : 결제 총액일 가능성 높음 ("받을금액", "총액")
 * weak   : 하위 신호 ("합계", "금액")
 */
const AMOUNT_LABELS = {
  primary: [
    /카드\s*승인\s*금액/, /카드\s*결제\s*금액/, /결제\s*금액/, /합계\s*금액/,
    /총\s*결제\s*금액/, /총\s*결제/, /TOTAL\s*AMOUNT/i, /AMOUNT\s*DUE/i,
  ],
  strong: [
    /받을\s*금액/, /총\s*액/, /총금액/, /판매\s*금액/, /청구\s*금액/, /승인\s*금액/,
    /\bTOTAL\b/i, /\bAMOUNT\b/i, /\bSUBTOTAL\b/i,
  ],
  weak: [
    /합\s*계/, /금\s*액/, /\bSUM\b/i,
  ],
};

/**
 * 비-결제 라벨 — 같은 줄/직전 줄에 있으면 후보 제외
 *  • 부가세·공급가액 등은 결제 총액과 구별되어야 함
 *  • '받은금액'(고객이 낸 현금)은 결제 총액과 다름
 */
const AMOUNT_EXCLUDE_LABELS = [
  /부가\s*세/, /부가\s*가치\s*세/, /공급\s*가액/, /면세\s*금액/, /과세\s*금액/, /\bVAT\b/i, /\bTAX\b/i,
  /거스\s*름?\s*돈/, /받은\s*금액/, /현금\s*받은/, /잔\s*액/, /선결제/,
  /포인트/, /적립/, /할\s*인/, /쿠폰/, /\bDISCOUNT\b/i, /\bPOINT\b/i,
];

/**
 * 비-금액 컨텍스트 — 줄에 이런 패턴/키워드가 있으면 그 줄의 모든 숫자는 금액 후보에서 즉시 제거
 *  사업자번호 / 전화번호 / 카드번호 / 승인번호 / 거래번호 / 우편번호
 */
const NON_AMOUNT_CONTEXT = [
  /사업자\s*(등록)?\s*번호/, /등록\s*번호/, /\bID\b/, /\bNO\b\.?/i,
  /전화\s*번호?/, /연락처/, /\bTEL\b/i, /\bPhone\b/i, /\bFAX\b/i,
  /카드\s*번호/, /[*xX·•]{3,}/,
  /승인\s*번호/, /거래\s*번호/, /가맹점\s*번호/, /단말\s*번호/,
  /바코드/, /\bSerial\b/i,
  /우편\s*번호/, /\bZIP\b/i,
];

const KEYWORD_VENDOR = /(상호|가맹점\s*명|가맹점|매장명|업소명|사업장명)\s*[:：]?\s*(.+)/;

/** 한 줄에 있는 모든 (가능한) 통화 후보 추출 — 비-금액 컨텍스트 줄은 미리 걸러진 상태 가정 */
function extractAmountTokens(line) {
  const tokens = [];
  // 화폐 표시(₩/원/won/KRW) 또는 천 단위 콤마가 있는 숫자에 우선
  const re = /([₩￦]\s*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,9})\s*(원|won|WON|KRW)?/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    const num = parseInt(m[2].replace(/,/g, ""), 10);
    if (!Number.isFinite(num)) continue;
    if (num < 100 || num > 100_000_000) continue;
    const hasComma = m[2].includes(",");
    const hasCurrency = !!(m[1] || m[3]);
    tokens.push({ amount: num, hasComma, hasCurrency, raw: m[0] });
  }
  return tokens;
}

/** 단일 줄에 비-금액 컨텍스트 키워드가 있는지 */
function hasNonAmountContext(line) {
  return NON_AMOUNT_CONTEXT.some((re) => re.test(line));
}

/** 단일 줄에 제외 라벨이 있는지 (부가세/공급가액 등) */
function hasExcludeLabel(line) {
  return AMOUNT_EXCLUDE_LABELS.some((re) => re.test(line));
}

/**
 * 점수 산출 — 후보 줄 자체와 직전·직후 줄 라벨을 함께 고려
 * 같은 줄: 가산점 100%
 * 직전·직후 줄: 가산점 70% (라벨이 좌측 행, 값이 다음 행에 있는 영수증 레이아웃 대응)
 */
function scoreCandidate({ token, lineIdx, lines }) {
  const line = lines[lineIdx];
  const prev = lines[lineIdx - 1] || "";
  const next = lines[lineIdx + 1] || "";

  // 즉시 제외 — 같은 줄/직전 줄에 부가세 등 제외 라벨
  if (hasExcludeLabel(line)) return -1e9;
  if (hasExcludeLabel(prev) && !hasLabel(line, "primary") && !hasLabel(line, "strong")) {
    // 다음 줄 값일 수도 있어, 같은 줄에 strong 이상이 함께 있을 때는 살림
    return -1e9;
  }

  let score = 0;
  // 라벨 — 같은 줄
  if (hasLabel(line, "primary")) score += 100;
  else if (hasLabel(line, "strong")) score += 60;
  else if (hasLabel(line, "weak")) score += 25;
  // 라벨 — 직전 줄 (영수증에서 라벨/값 분리 행 레이아웃)
  if (hasLabel(prev, "primary")) score += 70;
  else if (hasLabel(prev, "strong")) score += 40;
  // 라벨 — 직후 줄 (값 위에 라벨이 오는 드문 케이스)
  if (hasLabel(next, "primary")) score += 30;

  // 화폐 표시 / 천 단위 콤마는 결제 금액일 가능성 가산
  if (token.hasCurrency) score += 15;
  if (token.hasComma)    score += 5;

  // 단순 4자리 정수(예: 1234)는 금액일 확률 낮음 — 감점
  if (token.amount < 1000 && !token.hasCurrency && !token.hasComma) score -= 30;

  return score;
}

function hasLabel(line, tier) {
  if (!line) return false;
  return AMOUNT_LABELS[tier].some((re) => re.test(line));
}

/** 텍스트 전체에서 결제 금액 결정 */
function pickAmount(lines) {
  const candidates = [];
  lines.forEach((line, idx) => {
    if (hasNonAmountContext(line)) return; // 사업자번호/전화/카드번호/승인번호 줄 통째로 스킵
    const tokens = extractAmountTokens(line);
    for (const t of tokens) {
      const score = scoreCandidate({ token: t, lineIdx: idx, lines });
      if (score <= -1e8) continue;
      candidates.push({ ...t, lineIdx: idx, score });
    }
  });
  if (candidates.length === 0) return null;

  // 점수가 양수인 후보가 있으면 그 안에서 최고 점수 → 같은 점수면 가장 큰 금액
  const positive = candidates.filter((c) => c.score > 0);
  if (positive.length > 0) {
    positive.sort((a, b) => b.score - a.score || b.amount - a.amount);
    return positive[0].amount;
  }
  // 폴백: 화폐 표시가 있는 후보 우선, 그 중 최댓값
  const currency = candidates.filter((c) => c.hasCurrency || c.hasComma);
  const pool = currency.length > 0 ? currency : candidates;
  pool.sort((a, b) => b.amount - a.amount);
  return pool[0].amount;
}

/** 결제일/시간 — 결제 컨텍스트(거래일시·승인일시 등)에 가까운 날짜 우선 */
function pickPaidAt(lines, fullText) {
  const dateRe = /(20\d{2})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})|(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/;
  const timeRe = /(\d{1,2}):(\d{2})(?::\d{2})?/;
  const dateLabels = /(거래\s*일시|승인\s*일시|결제\s*일시|일시|판매\s*일자|결제\s*일자|거래\s*일자|영수\s*일자)/;

  let best = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dm = line.match(dateRe);
    if (!dm) continue;
    const y  = dm[1] || dm[4];
    const mo = String(dm[2] || dm[5]).padStart(2, "0");
    const d  = String(dm[3] || dm[6]).padStart(2, "0");
    if (!y) continue;
    const tm = line.match(timeRe) || lines[i + 1]?.match(timeRe) || null;
    const hh = tm ? String(tm[1]).padStart(2, "0") : "00";
    const mm = tm ? tm[2] : "00";
    const score = (dateLabels.test(line) || dateLabels.test(lines[i - 1] || "")) ? 100 : 10;
    const result = `${y}-${mo}-${d} ${hh}:${mm}:00`;
    if (!best || score > best.score) best = { result, score };
  }
  if (best) return best.result;
  // 폴백 — 첫 매칭
  const m = fullText.match(dateRe);
  if (!m) return null;
  const y  = m[1] || m[4];
  const mo = String(m[2] || m[5]).padStart(2, "0");
  const d  = String(m[3] || m[6]).padStart(2, "0");
  const tm = fullText.match(timeRe);
  const hh = tm ? String(tm[1]).padStart(2, "0") : "00";
  const mm = tm ? tm[2] : "00";
  return `${y}-${mo}-${d} ${hh}:${mm}:00`;
}

/** 카드사 + 끝 4자리 — 카드번호 마스킹 패턴 (****1234) 안에서만 끝 4자리 추출 */
function pickCard(text) {
  let cardName = null;
  for (const brand of CARD_BRANDS) {
    if (text.includes(brand)) {
      cardName = brand.startsWith("KB") || brand === "NH농협" ? brand : `${brand}카드`;
      if (text.includes(`${brand}카드`)) cardName = `${brand}카드`;
      break;
    }
  }
  if (!cardName) {
    for (const [en, ko] of Object.entries(CARD_BRANDS_EN)) {
      if (new RegExp(`\\b${en}\\b`, "i").test(text)) {
        cardName = ko.startsWith("KB") || ko === "NH농협" ? ko : `${ko}카드`;
        break;
      }
    }
  }
  // ****-****-****-1234 / **** **** **** 1234 / ******-1234 등
  const last4Match = text.match(/(?:[*xX·•]{2,}[\s-]*){2,3}(\d{4})\b/);
  return { cardName, cardLast4: last4Match ? last4Match[1] : null };
}

/** 가맹점명 — 라벨 우선 → 사업자번호 직전 줄 → 첫 의미 있는 줄 */
function pickVendor(lines) {
  for (const line of lines) {
    const m = line.match(KEYWORD_VENDOR);
    if (m && m[2]) return m[2].trim().replace(/[:：].*$/, "").slice(0, 80);
  }
  for (let i = 1; i < lines.length; i++) {
    if (/사업자\s*(등록)?\s*번호/.test(lines[i])) {
      const candidate = lines[i - 1].trim();
      if (candidate.length >= 2 && /[가-힣A-Za-z]/.test(candidate)) return candidate.slice(0, 80);
    }
  }
  for (const line of lines.slice(0, 8)) {
    const t = line.trim();
    if (t.length >= 2 && t.length <= 60 && /[가-힣A-Za-z]/.test(t) && !/^\d+$/.test(t)) {
      return t;
    }
  }
  return null;
}

/** 추출된 raw 텍스트에서 영수증 메타 필드 파싱 */
function parseReceiptText(text) {
  if (!text || !text.trim()) {
    return { vendor: null, amount: null, paidAt: null, cardName: null, cardLast4: null };
  }
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  return {
    vendor: pickVendor(lines),
    amount: pickAmount(lines),
    paidAt: pickPaidAt(lines, text),
    ...pickCard(text),
  };
}

/** 통합 진입점 */
async function processReceiptFile({ filePath, mimeType }) {
  const text = await extractText({ filePath, mimeType });
  const parsed = parseReceiptText(text);
  const ocrStatus = text && text.trim() ? "done" : "manual";
  return { ocrText: text, ocrStatus, ...parsed };
}

module.exports = { processReceiptFile, parseReceiptText };
