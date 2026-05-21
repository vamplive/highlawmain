import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");
const siteUrl = (process.env.VITE_SITE_URL || "https://younjeong.com").replace(/\/+$/, "");
const siteName = "윤정 법률사무소";
const defaultImage = `${siteUrl}/og-image.jpg`;

const pages = [
  {
    path: "/",
    title: `${siteName} | YOUNJEONG LAW OFFICE`,
    description: "윤정 법률사무소 - 서초역 3분, 건설·부동산·민사·형사·행정 사건을 변호사가 직접 상담합니다.",
  },
  {
    path: "/about",
    title: `사무소 소개 | ${siteName}`,
    description: "윤정 법률사무소의 업무 원칙, 상담 방식, 사무소 정보를 확인하세요.",
  },
  {
    path: "/practice",
    title: `업무분야 | ${siteName}`,
    description: "건설·부동산·민사·형사·행정·조세 등 윤정 법률사무소의 주요 업무분야를 확인하세요.",
  },
  {
    path: "/practice/construction",
    title: `건설 분쟁 | ${siteName}`,
    description: "공사대금, 하자, 설계·시공 클레임 등 건설 분쟁에 대한 법률 대응 전략을 안내합니다.",
    image: `${siteUrl}/construction-hero4.jpg`,
  },
  {
    path: "/practice/realestate",
    title: `부동산 분쟁 | ${siteName}`,
    description: "개발사업, 분양, 임대차, 부동산 분쟁에 대한 윤정 법률사무소의 업무 범위를 안내합니다.",
    image: `${siteUrl}/realestate-hero.jpg`,
  },
  {
    path: "/lawyers",
    title: `변호사 소개 | ${siteName}`,
    description: "윤정 법률사무소 소속 변호사들의 경력, 전문 분야, 학력 정보를 확인하세요.",
  },
  {
    path: "/consultation",
    title: `상담 신청 | ${siteName}`,
    description: "윤정 법률사무소 상담 신청 페이지입니다. 사건 내용을 남겨주시면 검토 후 연락드립니다.",
  },
  {
    path: "/blog",
    title: `법률칼럼 | ${siteName}`,
    description: "건설·부동산·민사·형사 등 주요 법률 이슈와 실무 해설을 확인하세요.",
  },
  {
    path: "/qna",
    title: `법률 Q&A | ${siteName}`,
    description: "자주 묻는 법률 질문과 윤정 법률사무소의 답변을 분야별로 확인하세요.",
  },
  {
    path: "/reviews",
    title: `후기 | ${siteName}`,
    description: "윤정 법률사무소 상담 및 사건 진행 후기를 확인하세요.",
  },
  {
    path: "/privacy",
    title: `개인정보처리방침 | ${siteName}`,
    description: "윤정 법률사무소 개인정보처리방침입니다.",
  },
  {
    path: "/terms",
    title: `이용약관 | ${siteName}`,
    description: "윤정 법률사무소 홈페이지 이용약관입니다.",
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
