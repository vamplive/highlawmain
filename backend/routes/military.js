/**
 * 군사센터 정적 HTML 페이지 관리 API
 *
 * 지원 페이지: home, about, partners, practices, info, consultation
 *
 * GET  /api/military/:page/html              — 전체 HTML 반환
 * PUT  /api/military/:page/html              — 전체 HTML 저장
 * GET  /api/military/:page/sections          — 섹션 목록 (id + name + 미리보기)
 * GET  /api/military/:page/section/:id       — 특정 섹션 HTML 반환
 * PUT  /api/military/:page/section/:id       — 특정 섹션 HTML 저장
 * GET  /api/military/home/content            — 홈 페이지 구조화 콘텐츠 (기존 호환)
 * PUT  /api/military/home/content            — 홈 페이지 구조화 콘텐츠 저장
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const { adminAuth, requireMinRole } = require("../lib/auth");

const router = express.Router();

/* ── 페이지 파일 경로 설정 ── */
const DIST_BASE   = path.join(__dirname, "../../frontend/dist");
const PUBLIC_BASE = path.join(__dirname, "../../frontend/public");

const PAGE_FILES = {
  home:         "military/index.html",
  about:        "military/about/index.html",
  partners:     "military/partners/index.html",
  practices:    "military/practices/index.html",
  info:         "military/info/index.html",
  consultation: "military/consultation/index.html",
};

function getFilePath(page) {
  const rel = PAGE_FILES[page];
  if (!rel) return null;
  if (page === "home" && process.env.MILITARY_HTML_PATH) return process.env.MILITARY_HTML_PATH;
  // 항상 dist/ 에서 읽기 (nginx 서빙 기준)
  return path.join(DIST_BASE, rel);
}

function readPage(page) {
  const fp = getFilePath(page);
  if (!fp) throw new Error(`알 수 없는 페이지: ${page}`);
  return fs.readFileSync(fp, "utf-8");
}

function writePage(page, html) {
  const rel = PAGE_FILES[page];
  if (!rel) throw new Error(`알 수 없는 페이지: ${page}`);
  // dist/ 에 즉시 반영 (nginx가 여기서 서빙)
  const distPath = path.join(DIST_BASE, rel);
  fs.writeFileSync(distPath, html, "utf-8");
  // public/ 에도 저장 → npm run build 후에도 내용 유지
  const pubPath = path.join(PUBLIC_BASE, rel);
  try { fs.writeFileSync(pubPath, html, "utf-8"); } catch (_) { /* public 없어도 무관 */ }
}

/* ── 홈 페이지: 코멘트 마커 기반 섹션 분리 ──
   패턴: <!-- ══...══\n     SECTION NAME\n══...══ -->                      */
const HOME_SECTION_DEFS = [
  { id: "head",        name: "HEAD · 스타일",        marker: null },        // 첫 마커 이전 전체
  { id: "floaters",    name: "플로팅 CTA 버튼",       marker: "FLOATING CTA" },
  { id: "navbar",      name: "네비게이션",            marker: "NAVBAR" },
  { id: "drawer",      name: "모바일 드로어 메뉴",     marker: "모바일 드로어 메뉴" },
  { id: "hero",        name: "1. 히어로 (대문)",       marker: "1. HERO" },
  { id: "ticker",      name: "티커 스트립",            marker: "TICKER STRIP" },
  { id: "why",         name: "2. 위기 카드 (징계위기의 본질)", marker: "2. WHY LAWYER" },
  { id: "stakes",      name: "3. 전역하면 그만?",      marker: "3. STAKES" },
  { id: "atmosphere",  name: "분위기 배너",            marker: "ATMOSPHERE" },
  { id: "price",       name: "4. 가격 혁신",           marker: "4. PRICE INNOVATION" },
  { id: "criminal-title", name: "7a. 군형사 타이틀",   marker: "7a. CRIMINAL TITLE" },
  { id: "why-criminal",   name: "7b. 하이로 선택 이유", marker: "7b. WHY HIGHLAW" },
  { id: "lawyers",     name: "8. 군검사 출신 변호사",   marker: "8. HYBRID LAWYERS" },
  { id: "expertise",   name: "9. 핵심 전문성",          marker: "9. CORE EXPERTISE" },
  { id: "network",     name: "10. 네트워크",            marker: "10. NETWORK" },
  { id: "package",     name: "11. 원스톱 패키지",        marker: "11. ONE-STOP PACKAGE" },
  { id: "care",        name: "12. 감정 케어",            marker: "12. EMOTIONAL CARE" },
  { id: "team",        name: "13. 변호사 팀",            marker: "13. TEAM" },
  { id: "fee",         name: "14. 비용 투명성",          marker: "14. FEE TRANSPARENCY" },
  { id: "process",     name: "15. 진행 프로세스",         marker: "15. PROCESS STEPS" },
];

/**
 * 홈 HTML을 코멘트 마커 기준으로 섹션 배열로 분리
 * 반환: [{ id, name, html }]
 */
function splitHomeIntoSections(html) {
  const markerPattern = /<!-- ═+\s*\n\s*(.*?)\s*\n\s*═+ -->/g;
  const cuts = [];          // { index, markerEnd, label }
  let m;
  while ((m = markerPattern.exec(html)) !== null) {
    cuts.push({ index: m.index, markerEnd: m.index + m[0].length, label: m[1].trim() });
  }

  const chunks = [];
  // HEAD 섹션 (첫 마커 이전)
  const headEnd = cuts.length > 0 ? cuts[0].index : html.length;
  chunks.push({ id: "head", name: "HEAD · 스타일", html: html.slice(0, headEnd) });

  // 마커별 섹션
  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i];
    const sectionStart = cut.index;
    const sectionEnd = i + 1 < cuts.length ? cuts[i + 1].index : html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);

    // HOME_SECTION_DEFS에서 매칭 id 찾기
    const def = HOME_SECTION_DEFS.find((d) => d.marker && cut.label === d.marker);
    const id = def ? def.id : cut.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const name = def ? def.name : cut.label;

    chunks.push({ id, name, html: sectionHtml });
  }
  return chunks;
}

/**
 * 홈 HTML에서 특정 섹션 교체
 */
function replaceHomeSection(html, sectionId, newHtml) {
  const sections = splitHomeIntoSections(html);
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) throw new Error(`섹션을 찾을 수 없습니다: ${sectionId}`);

  const before = sections.slice(0, idx).map((s) => s.html).join("");
  const after = sections.slice(idx + 1).map((s) => s.html).join("");
  return before + newHtml + after;
}

/* ── 서브 페이지: <section id="..."> 기반 섹션 분리 ── */

/**
 * HTML에서 section id="sectionId" 블록 추출 (중첩 고려)
 */
function extractSectionById(html, sectionId) {
  const openRegex = new RegExp(`<section[^>]+id="${sectionId}"[^>]*>`, "i");
  const openMatch = html.match(openRegex);
  if (!openMatch) return null;

  const start = html.indexOf(openMatch[0]);
  let pos = start + openMatch[0].length;
  let depth = 1;

  while (pos < html.length && depth > 0) {
    const nextOpen  = html.indexOf("<section", pos);
    const nextClose = html.indexOf("</section>", pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 1;
    } else {
      depth--;
      pos = nextClose + "</section>".length;
    }
  }
  return html.slice(start, pos);
}

/**
 * HTML에서 section id="sectionId" 블록을 newHtml로 교체
 */
function replaceSectionById(html, sectionId, newHtml) {
  const original = extractSectionById(html, sectionId);
  if (!original) throw new Error(`섹션 id="${sectionId}"를 찾을 수 없습니다`);
  return html.replace(original, newHtml);
}

/** 서브 페이지 HTML에서 <section id="..."> 목록 추출 */
function listSubPageSections(html) {
  const pattern = /<section[^>]+id="([^"]+)"[^>]*>/gi;
  const sections = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    sections.push(m[1]);
  }
  return sections;
}

/* ── 홈 페이지 구조화 콘텐츠 파싱 (기존 기능 유지) ── */
function parseHomeContent(html) {
  const extract = (regex, fallback = "") => {
    const m = html.match(regex); return m ? m[1].trim() : fallback;
  };
  return {
    meta: {
      title:         extract(/<title>([^<]+)<\/title>/),
      description:   extract(/<meta name="description" content="([^"]+)"/),
      ogTitle:       extract(/<meta property="og:title" content="([^"]+)"/),
      ogDescription: extract(/<meta property="og:description" content="([^"]+)"/),
    },
    riskCards: {
      risk01: {
        label: extract(/(RISK\s*01)(?=<\/span>)/, "RISK 01"),
        title: extract(/RISK\s*01<\/span>\s*<\/div>\s*<h4[^>]*>([^<]+)<\/h4>/),
        desc:  extract(/RISK\s*01<\/span>\s*<\/div>\s*<h4[^>]*>[^<]+<\/h4>\s*<p[^>]*>([^<]+)<\/p>/),
      },
      risk02: {
        label: extract(/(RISK\s*02)(?=<\/span>)/, "RISK 02"),
        title: extract(/RISK\s*02<\/span>\s*<\/div>\s*<h4[^>]*>([^<]+)<\/h4>/),
        desc:  extract(/RISK\s*02<\/span>\s*<\/div>\s*<h4[^>]*>[^<]+<\/h4>\s*<p[^>]*>([^<]+)<\/p>/),
      },
      risk03: {
        label: extract(/((?:RISK|INTEL)\s*03)(?=<\/span>)/, "RISK 03"),
        title: extract(/(?:RISK|INTEL)\s*03<\/span>\s*<\/div>\s*<h4[^>]*>([^<]+)<\/h4>/),
        desc:  extract(/(?:RISK|INTEL)\s*03<\/span>\s*<\/div>\s*<h4[^>]*>[^<]+<\/h4>\s*<p[^>]*>([^<]+)<\/p>/),
      },
    },
    contact: { phone: extract(/href="tel:([^"]+)"/) },
  };
}

function applyHomeContent(html, content) {
  let result = html;
  const rep = (regex, val) => { if (val) result = result.replace(regex, val); };

  if (content.meta) {
    const { title, description, ogTitle, ogDescription } = content.meta;
    if (title) rep(/<title>[^<]+<\/title>/, `<title>${title}</title>`);
    if (description) rep(/(<meta name="description" content=")[^"]+(")/,`$1${description}$2`);
    if (ogTitle)     rep(/(<meta property="og:title" content=")[^"]+(")/,`$1${ogTitle}$2`);
    if (ogDescription) rep(/(<meta property="og:description" content=")[^"]+(")/,`$1${ogDescription}$2`);
  }
  if (content.riskCards) {
    const { risk01, risk02, risk03 } = content.riskCards;
    if (risk01?.title) result = result.replace(/(RISK\s*01<\/span>\s*<\/div>\s*<h4[^>]*>)[^<]+(<\/h4>)/,`$1${risk01.title}$2`);
    if (risk01?.desc)  result = result.replace(/(RISK\s*01<\/span>\s*<\/div>\s*<h4[^>]*>[^<]+<\/h4>\s*<p[^>]*>)[^<]+(<\/p>)/,`$1${risk01.desc}$2`);
    if (risk02?.title) result = result.replace(/(RISK\s*02<\/span>\s*<\/div>\s*<h4[^>]*>)[^<]+(<\/h4>)/,`$1${risk02.title}$2`);
    if (risk02?.desc)  result = result.replace(/(RISK\s*02<\/span>\s*<\/div>\s*<h4[^>]*>[^<]+<\/h4>\s*<p[^>]*>)[^<]+(<\/p>)/,`$1${risk02.desc}$2`);
    if (risk03?.label) result = result.replace(/(<span[^>]*>)(?:RISK|INTEL)\s*03(<\/span>)/,`$1${risk03.label}$2`);
    if (risk03?.title) result = result.replace(/((?:RISK|INTEL)\s*03<\/span>\s*<\/div>\s*<h4[^>]*>)[^<]+(<\/h4>)/,`$1${risk03.title}$2`);
    if (risk03?.desc)  result = result.replace(/((?:RISK|INTEL)\s*03<\/span>\s*<\/div>\s*<h4[^>]*>[^<]+<\/h4>\s*<p[^>]*>)[^<]+(<\/p>)/,`$1${risk03.desc}$2`);
  }
  if (content.contact?.phone) result = result.replace(/(href="tel:)[^"]+(")/,`$1${content.contact.phone}$2`);
  return result;
}

/* ── 서브 페이지 히어로 콘텐츠 파싱 ── */

/**
 * 서브 페이지 HTML에서 hero 정보 추출
 * — <div class="page-hero"> 우선, fallback: <section id="hero">
 */
function parseSubPageHero(html) {
  // ── <div class="page-hero"> 패턴 우선 ──
  const heroStart = html.indexOf('<div class="page-hero">');
  if (heroStart !== -1) {
    let pos = heroStart + '<div class="page-hero">'.length;
    let depth = 1;
    while (pos < html.length && depth > 0) {
      const o = html.indexOf("<div", pos);
      const c = html.indexOf("</div>", pos);
      if (c === -1) break;
      if (o !== -1 && o < c) { depth++; pos = o + 1; }
      else { depth--; pos = c + "</div>".length; }
    }
    const block = html.slice(heroStart, pos);
    // 첫 번째 <p>: 아이브로우 (eyebrow)
    const eyebrow = (block.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "";
    // <h1>
    const heading = (block.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
    // 두 번째 <p>: 설명
    const allPs = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const description = allPs.length > 1 ? allPs[1][1] : "";
    return {
      heading: heading.replace(/<[^>]+>/g, "").trim(),
      subheading: eyebrow.replace(/<[^>]+>/g, "").trim(),
      description: description.replace(/<[^>]+>/g, "").trim(),
    };
  }

  // ── fallback: <section id="hero"> ──
  const heroSection = extractSectionById(html, "hero");
  if (!heroSection) return { heading: "", subheading: "", description: "" };
  const heading = (heroSection.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
    .replace(/<[^>]+>/g, "").trim();
  const subheading = (
    heroSection.match(/<(?:p|span)[^>]+class="[^"]*(?:eyebrow|subtitle|sub-title|sub)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span)>/i)?.[1]
    || heroSection.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]
    || ""
  ).replace(/<[^>]+>/g, "").trim();
  const description = (
    heroSection.match(/<p[^>]+class="[^"]*(?:desc|description|lead|intro)[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1]
    || ""
  ).replace(/<[^>]+>/g, "").trim();
  return { heading, subheading, description };
}

/**
 * 서브 페이지 HTML의 hero 정보 반영
 * — <div class="page-hero"> 우선, fallback: <section id="hero">
 */
function applySubPageHero(html, heroData) {
  // ── <div class="page-hero"> 패턴 우선 ──
  const heroStart = html.indexOf('<div class="page-hero">');
  if (heroStart !== -1) {
    let pos = heroStart + '<div class="page-hero">'.length;
    let depth = 1;
    while (pos < html.length && depth > 0) {
      const o = html.indexOf("<div", pos);
      const c = html.indexOf("</div>", pos);
      if (c === -1) break;
      if (o !== -1 && o < c) { depth++; pos = o + 1; }
      else { depth--; pos = c + "</div>".length; }
    }
    let block = html.slice(heroStart, pos);
    const after = html.slice(pos);

    if (heroData.heading !== undefined) {
      block = block.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i,
        (_, o, _2, c) => `${o}${heroData.heading}${c}`);
    }
    if (heroData.subheading !== undefined) {
      // 첫 번째 <p> (아이브로우)
      block = block.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/i,
        (_, o, _2, c) => `${o}${heroData.subheading}${c}`);
    }
    if (heroData.description !== undefined) {
      // 두 번째 <p> (설명)
      let count = 0;
      block = block.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/gi,
        (match, o, content, c) => {
          count++;
          if (count === 2) return `${o}${heroData.description}${c}`;
          return match;
        });
    }
    return html.slice(0, heroStart) + block + after;
  }

  // ── fallback: <section id="hero"> ──
  const heroSection = extractSectionById(html, "hero");
  function replaceFirst(src, regex, newText) {
    const m = src.match(regex);
    if (!m) return src;
    return src.replace(m[0], () => m[1] + newText + m[3]);
  }
  if (heroSection) {
    let updated = heroSection;
    if (heroData.heading !== undefined)
      updated = replaceFirst(updated, /(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i, heroData.heading);
    if (heroData.subheading !== undefined) {
      const sub = updated.match(/(<(?:p|span)[^>]+class="[^"]*(?:eyebrow|subtitle|sub-title|sub)[^"]*"[^>]*>)([\s\S]*?)(<\/(?:p|span)>)/i);
      if (sub) updated = updated.replace(sub[0], () => sub[1] + heroData.subheading + sub[3]);
      else updated = replaceFirst(updated, /(<h2[^>]*>)([\s\S]*?)(<\/h2>)/i, heroData.subheading);
    }
    if (heroData.description !== undefined)
      updated = replaceFirst(updated, /(<p[^>]+class="[^"]*(?:desc|description|lead|intro)[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/i, heroData.description);
    return replaceSectionById(html, "hero", updated);
  }
  // 최종 fallback
  let result = html;
  if (heroData.heading !== undefined)
    result = result.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i, (_, o, _2, c) => `${o}${heroData.heading}${c}`);
  return result;
}

/* ── 미들웨어: 페이지 유효성 검사 ── */
function requirePage(req, res, next) {
  const { page } = req.params;
  if (!PAGE_FILES[page]) {
    return res.status(404).json({ data: null, error: `페이지를 찾을 수 없습니다: ${page}`, meta: null });
  }
  next();
}

/* ══════════════════════════════════════
   라우트 정의
══════════════════════════════════════ */

/** GET /api/military/:page/html */
router.get("/:page/html", adminAuth, requirePage, (req, res) => {
  try {
    const html = readPage(req.params.page);
    res.json({ data: html, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/** PUT /api/military/:page/html */
router.put("/:page/html", adminAuth, requireMinRole("staff"), requirePage, (req, res) => {
  try {
    const { html } = req.body;
    if (typeof html !== "string" || !html.trim()) {
      return res.status(400).json({ data: null, error: "html 필드가 필요합니다", meta: null });
    }
    writePage(req.params.page, html);
    res.json({ data: null, error: null, meta: { message: "저장되었습니다" } });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/** GET /api/military/:page/sections — 섹션 목록 반환 */
router.get("/:page/sections", adminAuth, requirePage, (req, res) => {
  try {
    const { page } = req.params;
    const html = readPage(page);
    let sections;
    if (page === "home") {
      sections = splitHomeIntoSections(html).map((s) => ({
        id: s.id,
        name: s.name,
        preview: s.html.slice(0, 120).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        size: s.html.length,
      }));
    } else {
      const ids = listSubPageSections(html);
      sections = ids.map((id) => {
        const html2 = extractSectionById(html, id) || "";
        return {
          id,
          name: id,
          preview: html2.slice(0, 120).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
          size: html2.length,
        };
      });
    }
    res.json({ data: sections, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/** GET /api/military/:page/section/:id */
router.get("/:page/section/:id", adminAuth, requirePage, (req, res) => {
  try {
    const { page, id } = req.params;
    const html = readPage(page);
    let sectionHtml;
    if (page === "home") {
      const sections = splitHomeIntoSections(html);
      const found = sections.find((s) => s.id === id);
      sectionHtml = found ? found.html : null;
    } else {
      sectionHtml = extractSectionById(html, id);
    }
    if (!sectionHtml) {
      return res.status(404).json({ data: null, error: `섹션 "${id}"을 찾을 수 없습니다`, meta: null });
    }
    res.json({ data: { id, html: sectionHtml }, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/** PUT /api/military/:page/section/:id */
router.put("/:page/section/:id", adminAuth, requireMinRole("staff"), requirePage, (req, res) => {
  try {
    const { page, id } = req.params;
    const { html: newSectionHtml } = req.body;
    if (typeof newSectionHtml !== "string") {
      return res.status(400).json({ data: null, error: "html 필드가 필요합니다", meta: null });
    }
    let fullHtml = readPage(page);
    if (page === "home") {
      fullHtml = replaceHomeSection(fullHtml, id, newSectionHtml);
    } else {
      fullHtml = replaceSectionById(fullHtml, id, newSectionHtml);
    }
    writePage(page, fullHtml);
    res.json({ data: { id }, error: null, meta: { message: "저장되었습니다" } });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/* ── 기존 구조화 콘텐츠 API (홈) 유지 ── */
router.get("/home/content", adminAuth, (req, res) => {
  try {
    const html = readPage("home");
    res.json({ data: parseHomeContent(html), error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

router.put("/home/content", adminAuth, requireMinRole("staff"), (req, res) => {
  try {
    const html = readPage("home");
    const updated = applyHomeContent(html, req.body);
    writePage("home", updated);
    res.json({ data: parseHomeContent(updated), error: null, meta: { message: "저장되었습니다" } });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/* 기존 경로 호환 (/api/military/content, /api/military/html) */
router.get("/content", adminAuth, (req, res) => res.redirect("/api/military/home/content"));
router.get("/html",    adminAuth, (req, res) => res.redirect("/api/military/home/html"));

/* ── 서브 페이지 히어로 구조화 콘텐츠 ── */

/** GET /api/military/:page/hero */
router.get("/:page/hero", adminAuth, requirePage, (req, res) => {
  try {
    const html = readPage(req.params.page);
    res.json({ data: parseSubPageHero(html), error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

/** PUT /api/military/:page/hero */
router.put("/:page/hero", adminAuth, requireMinRole("staff"), requirePage, (req, res) => {
  try {
    const html = readPage(req.params.page);
    const updated = applySubPageHero(html, req.body);
    writePage(req.params.page, updated);
    res.json({ data: parseSubPageHero(updated), error: null, meta: { message: "히어로가 저장되었습니다" } });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

module.exports = router;
