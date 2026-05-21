import { BLOG_CATEGORIES } from "./constants";
import { parseTags } from "../../blog/blogContent";

export function htmlToPlainText(html = "") {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function trimToSentence(text = "", maxLength = 150) {
  const normalized = String(text).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(sliced.lastIndexOf("."), sliced.lastIndexOf("다."), sliced.lastIndexOf("?"), sliced.lastIndexOf("!"));
  if (sentenceEnd >= 40) return sliced.slice(0, sentenceEnd + 1).trim();
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function slugifyBlogTitle(title = "") {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function isValidFutureSchedule(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

export function suggestBlogTags(doc = {}, html = "", limit = 6) {
  const existing = parseTags(doc.tags);
  if (existing.length >= limit) return existing.slice(0, limit);

  const source = `${doc.title || ""} ${htmlToPlainText(html)}`;
  const stopWords = new Set([
    "그리고", "그러나", "대한", "관련", "경우", "사항", "위해", "통해", "에서", "으로", "있습니다", "합니다",
    "법률", "블로그", "게시글", "하이로", "법률사무소",
  ]);
  const candidates = source
    .match(/[가-힣A-Za-z0-9]{2,20}/g)
    ?.map((word) => word.trim())
    .filter((word) => !stopWords.has(word) && !/^\d+$/.test(word)) || [];
  const counts = new Map();
  candidates.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  const generated = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word);
  return [...new Set([...existing, ...generated])].slice(0, limit);
}

export function deriveBlogPublishMetadata(doc = {}, html = "") {
  const plainText = htmlToPlainText(html);
  const excerpt = trimToSentence(plainText, 140);
  const seoDescription = trimToSentence(plainText, 155);
  const tags = suggestBlogTags(doc, html);
  const title = doc.title || "";
  const geoFaq = title && excerpt
    ? JSON.stringify([
      { question: `${title}에서 가장 중요한 쟁점은 무엇인가요?`, answer: excerpt },
      { question: "이 글은 어떤 상황의 독자에게 도움이 되나요?", answer: trimToSentence(plainText, 220) },
    ])
    : "";
  return {
    summary: doc.summary?.trim() ? doc.summary : excerpt,
    seoDescription: doc.seoDescription?.trim() ? doc.seoDescription : seoDescription,
    seoTitle: doc.seoTitle?.trim() ? doc.seoTitle : title,
    slug: doc.slug?.trim() ? doc.slug : slugifyBlogTitle(title),
    tags: parseTags(doc.tags).length ? doc.tags : tags.join(", "),
    ogImageUrl: doc.ogImageUrl?.trim() ? doc.ogImageUrl : (doc.thumbnailUrl || ""),
    geoSummary: doc.geoSummary?.trim() ? doc.geoSummary : trimToSentence(plainText, 220),
    geoFaq: doc.geoFaq?.trim() ? doc.geoFaq : geoFaq,
    geoKeywords: doc.geoKeywords?.trim() ? doc.geoKeywords : tags.join(", "),
  };
}

export function getBlogPublishChecks(doc = {}, html = "") {
  const plainText = htmlToPlainText(html);
  const hasSummary = Boolean((doc.summary || doc.excerpt || "").trim());
  const hasThumbnail = Boolean((doc.thumbnailUrl || doc.ogImageUrl || "").trim());
  const hasSeoDescription = Boolean((doc.seoDescription || "").trim());
  const hasTags = parseTags(doc.tags).length > 0;
  const needsSchedule = doc.status === "scheduled";

  const checks = [
    { id: "title", label: "제목", required: true, done: Boolean((doc.title || "").trim()) },
    { id: "body", label: "본문", required: true, done: plainText.length > 0 },
    { id: "category", label: "카테고리", required: true, done: Boolean(doc.blogCategory || doc.category) },
    { id: "summary", label: "발췌/요약", required: false, done: hasSummary },
    { id: "thumbnail", label: "대표 이미지", required: false, done: hasThumbnail },
    { id: "seoDescription", label: "SEO 설명", required: false, done: hasSeoDescription },
    { id: "tags", label: "태그", required: false, done: hasTags },
  ];
  if (needsSchedule) {
    checks.splice(3, 0, {
      id: "scheduledPublishAt",
      label: "미래 예약 일시",
      required: true,
      done: isValidFutureSchedule(doc.scheduledPublishAt),
    });
  }
  return checks;
}

export function getBlogPublishStatus(doc = {}, html = "") {
  const checks = getBlogPublishChecks(doc, html);
  const required = checks.filter((item) => item.required);
  const recommended = checks.filter((item) => !item.required);
  const requiredDone = required.filter((item) => item.done).length;
  const recommendedDone = recommended.filter((item) => item.done).length;
  return {
    checks,
    requiredDone,
    requiredTotal: required.length,
    recommendedDone,
    recommendedTotal: recommended.length,
    ready: requiredDone === required.length,
  };
}

export const BLOG_CATEGORY_LABELS = BLOG_CATEGORIES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});
