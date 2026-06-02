/**
 * 데이터베이스 내의 모든 윤세환 변호사 관련 정보를 '법무법인 하이로'로 일괄 수정하는 마이그레이션 스크립트
 */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
console.log(`connecting to SQLite database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  db.transaction(() => {
    // 1. lawyers 테이블의 이름 변경
    const updateLawyers = db.prepare("UPDATE lawyers SET name = '법무법인 하이로' WHERE name = '윤세환'");
    const resLawyers = updateLawyers.run();
    console.log(`- lawyers 테이블 수정 완료: ${resLawyers.changes}건`);

    // 2. blog_posts 테이블의 작가(author) 변경
    const updateBlog1 = db.prepare("UPDATE blog_posts SET author = '법무법인 하이로' WHERE author = '윤세환 변호사'");
    const resBlog1 = updateBlog1.run();
    const updateBlog2 = db.prepare("UPDATE blog_posts SET author = '법무법인 하이로' WHERE author = '윤세환'");
    const resBlog2 = updateBlog2.run();
    console.log(`- blog_posts 테이블 수정 완료: ${resBlog1.changes + resBlog2.changes}건`);

    // 3. qna_questions 테이블의 답변 내 서명 및 이름 변경
    const qnaRows = db.prepare("SELECT id, answer FROM qna_questions WHERE answer LIKE '%윤세환%'").all();
    let qnaChanges = 0;
    const updateQna = db.prepare("UPDATE qna_questions SET answer = ? WHERE id = ?");
    for (const row of qnaRows) {
      let newAnswer = row.answer;
      newAnswer = newAnswer.replace(/윤세환 변호사/g, "법무법인 하이로");
      newAnswer = newAnswer.replace(/윤세환/g, "법무법인 하이로");
      const resQna = updateQna.run(newAnswer, row.id);
      qnaChanges += resQna.changes;
    }
    console.log(`- qna_questions 테이블 답변 수정 완료: ${qnaChanges}건`);
  })();
  console.log("SUCCESS: 모든 데이터베이스 필드 내 '윤세환' -> '법무법인 하이로' 일괄 수정 성공!");
} catch (err) {
  console.error("FAIL: 데이터베이스 수정 중 오류가 발생했습니다:", err);
} finally {
  db.close();
}
