/**
 * 블로그 excerpt 재생성 (1회성 마이그레이션)
 *
 * 배경: 에디터에서 자동 생성된 excerpt 가 본문을 정확히 160자에서 잘라
 * 한글 단어/문장 중간에서 끊기는 현상이 있었다. 새 헤로 영역에서는 절대로
 * 잘려서는 안 된다는 운영자 요청에 따라, 본문 기반 자동 excerpt 를 문장
 * 종결 단위로 재계산해 DB 에 반영한다.
 *
 * 대상 선정:
 *  - excerpt 가 비어있는 글
 *  - excerpt 끝이 문장 종결부호(. ? ! 다. 요. 까.)가 아닌 글 — "잘림" 후보
 *  - excerpt 가 너무 길거나(>= 320) 너무 짧지(<= 10) 않으면서 잘림 후보로 판단된 글
 * 운영자가 직접 작성한 깔끔한 excerpt(문장 종결로 끝나는 짧은 문장)는 그대로 둔다.
 *
 * 실행: node seeds/rebuild-blog-excerpts.js [--all]
 *      --all: 잘림 여부 무관 모든 글 재생성
 */
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "db", "highlaw.db");
const REGEN_ALL = process.argv.includes("--all");

function htmlToPlainText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** 본문 일부를 문장 단위로 누적해 maxLen 직전까지의 완전한 문장만 반환. */
function buildExcerpt(plainText, maxLen = 240) {
  const text = String(plainText || "").trim();
  if (!text) return null;
  if (text.length <= maxLen) return text;

  const parts = text.split(/(?<=[.?!])\s+/);
  let out = "";
  for (const part of parts) {
    const candidate = out ? `${out} ${part}` : part;
    if (candidate.length > maxLen && out.length > 0) break;
    out = candidate;
    if (out.length >= maxLen) break;
  }
  return (out || text).trim();
}

/** 자동 생성으로 인해 잘린 것으로 추정되는 excerpt 인지 검사. */
function isLikelyTruncated(excerpt) {
  if (!excerpt) return true;
  const trimmed = excerpt.trim();
  if (trimmed.length === 0) return true;
  // 정확히 160 자: 기존 slice(0,160) 자동 생성 흔적
  if (trimmed.length === 160) return true;
  // 종결부호로 끝나면 OK
  if (/[.?!]$/.test(trimmed)) return false;
  // 한글 종결 어미 + 마침표(다., 요., 까.) 가 보통 패턴
  if (/[다요까]\.$/.test(trimmed)) return false;
  // 그 외에는 잘림 후보
  return true;
}

function main() {
  const db = new Database(DB_PATH);
  console.log("DB:", DB_PATH);

  const rows = db.prepare("SELECT id, slug, title, excerpt, content FROM blog_posts").all();
  console.log(`총 게시글: ${rows.length}건`);

  const update = db.prepare("UPDATE blog_posts SET excerpt=? WHERE id=?");
  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  const tx = db.transaction(() => {
    for (const r of rows) {
      scanned += 1;
      if (!REGEN_ALL && !isLikelyTruncated(r.excerpt)) {
        skipped += 1;
        continue;
      }
      const plain = htmlToPlainText(r.content);
      const next = buildExcerpt(plain);
      if (!next || next === r.excerpt) {
        skipped += 1;
        continue;
      }
      update.run(next, r.id);
      updated += 1;
      console.log(`  · ${r.slug}\n      before: ${(r.excerpt || "").slice(0, 60)}…\n      after : ${next.slice(0, 60)}…`);
    }
  });
  tx();

  console.log(`\n결과: 검사 ${scanned} / 업데이트 ${updated} / 변경없음 ${skipped}`);
  db.close();
}

main();
