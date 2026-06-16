/**
 * 윤세환 변호사 데이터 완전 삭제 + 블로그/QnA 작성자 일괄 정리 스크립트
 * node backend/scripts/remove-yoon-sehwan.js
 */
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.STORAGE_PATH
  ? path.join(process.env.STORAGE_PATH, "db", "highlaw.db")
  : path.join(__dirname, "..", "data", "db", "highlaw.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const run = db.transaction(() => {
  // 1. 윤세환 변호사 ID 조회
  const yoon = db.prepare("SELECT id, name FROM lawyers WHERE name = ?").get("윤세환");

  if (yoon) {
    // 2. 강의 삭제
    const delLectures = db.prepare("DELETE FROM lectures WHERE lawyer_id = ?").run(yoon.id);
    console.log(`[lectures] ${delLectures.changes}건 삭제`);

    // 3. 변호사 삭제
    const delLawyer = db.prepare("DELETE FROM lawyers WHERE id = ?").run(yoon.id);
    console.log(`[lawyers] ${delLawyer.changes}건 삭제 (${yoon.name})`);
  } else {
    console.log("[lawyers] 윤세환 레코드 없음 — 이미 삭제된 것으로 보입니다");
  }

  // 4. 블로그 작성자 정리
  const blogRes1 = db.prepare("UPDATE blog_posts SET author = ? WHERE author = ?")
    .run("법무법인 하이로", "윤세환 변호사");
  const blogRes2 = db.prepare("UPDATE blog_posts SET author = ? WHERE author = ?")
    .run("법무법인 하이로", "윤세환");
  console.log(`[blog_posts] 작성자 정리: ${blogRes1.changes + blogRes2.changes}건`);

  // 5. QnA 답변 내 윤세환 이름 교체
  const qnaRows = db.prepare("SELECT id, answer FROM qna_questions WHERE answer LIKE ?").all("%윤세환%");
  let qnaCount = 0;
  const qnaUpdate = db.prepare("UPDATE qna_questions SET answer = ? WHERE id = ?");
  for (const row of qnaRows) {
    const newAnswer = row.answer
      .replace(/윤세환 변호사/g, "법무법인 하이로")
      .replace(/윤세환/g, "법무법인 하이로");
    qnaUpdate.run(newAnswer, row.id);
    qnaCount++;
  }
  console.log(`[qna_questions] 답변 교체: ${qnaCount}건`);
});

try {
  run();
  console.log("완료 — 윤세환 데이터 삭제 및 관련 텍스트 정리");
} catch (e) {
  console.error("오류:", e.message);
  process.exit(1);
} finally {
  db.close();
}
