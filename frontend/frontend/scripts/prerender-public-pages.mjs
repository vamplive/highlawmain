import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");
const siteUrl = (process.env.VITE_SITE_URL || "https://highlaw.co.kr").replace(/\/+$/, "");
const siteName = "법무법인 하이로";
const defaultImage = `${siteUrl}/og-image.jpg`;

const pages = [
  {
    path: "/",
    title: `${siteName} | HIGHLAW LAW FIRM`,
    description: "법무법인 하이로 - 불법파견·게임사기·노동·군사건 전문 로펌. 강남 테헤란로, 전문 변호사가 직접 상담합니다.",
  },
  {
    path: "/about",
    title: `사무소 소개 | ${siteName}`,
    description: "법무법인 하이로의 핵심 가치 — 신뢰·전문성·헌신·혁신. 불법파견·게임사기·노동·군사건 특수 분야에 집중하는 로펌입니다.",
  },
  {
    path: "/about/greetings",
    title: `인사말 | ${siteName}`,
    description: "법무법인 하이로 대표변호사의 인사말. Loyalty, Dignity, Integrity를 핵심 가치로 삼아 하이엔드 서비스를 제공합니다.",
  },
  {
    path: "/about/values",
    title: `핵심가치 | ${siteName}`,
    description: "신뢰, 전문성, 헌신, 혁신. 법무법인 하이로의 4대 약속과 로펌 철학을 소개합니다.",
  },
  {
    path: "/about/directions",
    title: `오시는 길 | ${siteName}`,
    description: "법무법인 하이로 서울 오피스 찾아오시는 길. 역삼역 4번 출구 도보 1분거리, 주차 및 대중교통 안내.",
  },
  {
    path: "/about/probono",
    title: `공익활동 | ${siteName}`,
    description: "사회적 책임과 온기를 채우는 하이로의 공익 활동. 군장병 권익 보호, 비정규직 노동자 법률 구조 등 실천 사례.",
  },
  {
    path: "/about/history",
    title: `연혁 | ${siteName}`,
    description: "법무법인 하이로의 발자취와 주요 역사. 설립부터 오피스 확장 및 최고 파트너십 구축 과정.",
  },
  {
    path: "/practice",
    title: `업무분야 | ${siteName}`,
    description: "불법파견·게임사기·노동·군사건 등 법무법인 하이로의 주요 업무분야를 확인하세요.",
  },
  {
    path: "/practice/illegal-dispatch",
    title: `불법파견 | ${siteName}`,
    description: "불법파견·위장도급 분쟁에 대한 법무법인 하이로의 법률 대응 전략을 안내합니다.",
    image: `${siteUrl}/construction-hero4.jpg`,
  },
  {
    path: "/practice/game-fraud",
    title: `게임사기 | ${siteName}`,
    description: "게임 아이템 사기, 계정 분쟁에 대한 법무법인 하이로의 업무 범위를 안내합니다.",
    image: `${siteUrl}/realestate-hero.jpg`,
  },
  {
    path: "/practice/construction",
    title: `불법파견 (구) | ${siteName}`,
    description: "불법파견 분쟁에 대한 법무법인 하이로의 법률 대응 전략을 안내합니다.",
    image: `${siteUrl}/construction-hero4.jpg`,
  },
  {
    path: "/practice/realestate",
    title: `게임사기 (구) | ${siteName}`,
    description: "게임사기 분쟁에 대한 법무법인 하이로의 업무 범위를 안내합니다.",
    image: `${siteUrl}/realestate-hero.jpg`,
  },
  {
    path: "/lawyers",
    title: `변호사 소개 | ${siteName}`,
    description: "법무법인 하이로 소속 변호사들의 경력, 전문 분야, 학력 정보를 확인하세요.",
  },
  {
    path: "/consultation",
    title: `상담 신청 | ${siteName}`,
    description: "법무법인 하이로 상담 신청 페이지입니다. 사건 내용을 남겨주시면 검토 후 연락드립니다.",
  },
  {
    path: "/blog",
    title: `법률칼럼 | ${siteName}`,
    description: "불법파견·게임사기·노동·군사건 등 주요 법률 이슈와 실무 해설을 확인하세요.",
  },
  {
    path: "/qna",
    title: `법률 Q&A | ${siteName}`,
    description: "자주 묻는 법률 질문과 법무법인 하이로의 답변을 분야별로 확인하세요.",
  },
  {
    path: "/reviews",
    title: `후기 | ${siteName}`,
    description: "법무법인 하이로 상담 및 사건 진행 후기를 확인하세요.",
  },
  {
    path: "/privacy",
    title: `개인정보처리방침 | ${siteName}`,
    description: "법무법인 하이로 개인정보처리방침입니다.",
  },
  {
    path: "/terms",
    title: `이용약관 | ${siteName}`,
    description: "법무법인 하이로 홈페이지 이용약관입니다.",
  },
  {
    path: "/recruit",
    title: `인재채용 | ${siteName}`,
    description: "법무법인 하이로와 함께할 유능한 인재를 모십니다. 신입 및 경력 변호사, 군법무관, 행정직원 공고를 확인하세요.",
  },
  {
    path: "/recruit/apply-form",
    title: `온라인 입사지원 | ${siteName}`,
    description: "법무법인 하이로 온라인 입사지원 시스템. 약관 동의 및 입사지원 서식 업로드 단계로 지원할 수 있습니다.",
  },
];

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceOrInsertMeta(html, selector, tag) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta\\s+${escapedSelector}[^>]*>`, "i");
  return regex.test(html) ? html.replace(regex, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function applyMetadata(template, page) {
  const canonical = `${siteUrl}${page.path === "/" ? "/" : page.path}`;
  const title = escapeAttr(page.title);
  const description = escapeAttr(page.description);
  const image = escapeAttr(page.image || defaultImage);
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);

  html = replaceOrInsertMeta(html, 'name="description"', `<meta name="description" content="${description}" />`);
  html = replaceOrInsertMeta(html, 'property="og:title"', `<meta property="og:title" content="${title}" />`);
  html = replaceOrInsertMeta(html, 'property="og:description"', `<meta property="og:description" content="${description}" />`);
  html = replaceOrInsertMeta(html, 'property="og:url"', `<meta property="og:url" content="${canonical}" />`);
  html = replaceOrInsertMeta(html, 'property="og:image"', `<meta property="og:image" content="${image}" />`);
  html = replaceOrInsertMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${title}" />`);
  html = replaceOrInsertMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${description}" />`);
  html = replaceOrInsertMeta(html, 'name="twitter:image"', `<meta name="twitter:image" content="${image}" />`);
  return html;
}

async function writePage(template, page) {
  const html = applyMetadata(template, page);
  if (page.path === "/") {
    await writeFile(indexPath, html, "utf8");
    return;
  }
  const outDir = path.join(dist, ...page.path.split("/").filter(Boolean));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), html, "utf8");
}

const template = await readFile(indexPath, "utf8");
await Promise.all(pages.map((page) => writePage(template, page)));
console.log(`Generated route metadata for ${pages.length} public pages.`);
