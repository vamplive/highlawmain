/** 윤세환 대표변호사 프로필 갱신 v2 — 학력·경력 운영자 제공 정보로 교체 + 강의경력은 lectures 테이블로 별도 등록.
 *  멱등: lawyers 행은 UPDATE, lectures는 (lawyer_id, title) 기준으로 INSERT-OR-IGNORE. */
const crypto = require("crypto");
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const profile = {
  education: JSON.stringify([
    { period: "", title: "Emory University, BA/MA (Political Science)" },
    { period: "", title: "동아대학교 법학전문대학원, 법학전문석사" },
    { period: "", title: "서울대학교 법학전문대학원, 법학박사수료 (행정법 전공)" },
  ]),
  career: JSON.stringify([
    { period: "前", title: "DSD삼호주식회사 법무실 변호사" },
    { period: "現", title: "㈜윤정종합건설 기획이사" },
    { period: "現", title: "법무법인 하이로 대표변호사" },
  ]),
};

const lawyerRow = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("윤세환");
if (!lawyerRow) {
  console.error("윤세환 변호사 행을 찾지 못했습니다. seed-younsehwan-profile.js 를 먼저 실행하세요.");
  process.exit(1);
}

const updateRes = db.prepare(`
  UPDATE lawyers
     SET education = @education,
         career = @career,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ ...profile, id: lawyerRow.id });
console.log(`UPDATE 윤세환 (${lawyerRow.id}): ${updateRes.changes}건`);

// 강의경력 — lectures 테이블에 등록 (조직별 1행)
const lectures = [
  // 법학강의
  { title: "민사법 기록형 + 법조윤리 특강", organizer: "동아대학교 법학전문대학원" },
  { title: "민사법 기록형 특강", organizer: "아주대학교 법학전문대학원" },
  { title: "부동산 사법·공법 강의", organizer: "경기대학교 행정복지상담대학원" },
  { title: "행정소송법 강의 (외래강사)", organizer: "경찰인재개발원" },
  // 법률 AI 전문강의
  { title: "법률 AI 특강", organizer: "서울지방변호사회 / 한국사내변호사회" },
  { title: "법률 AI 기본강의 + 심화강의", organizer: "법무법인(유) 대륙아주" },
  { title: "법률 AI 강의", organizer: "법무법인(유) 로고스 / ㈜엘박스 / 서울지방변호사회 기업법무연수원" },
  { title: "법률 AI 강의 (2025)", organizer: "세계한인법률가회(IAKL) / 법무법인정세 / 여성변호사회" },
];

const insertLec = db.prepare(`
  INSERT INTO lectures (id, lawyer_id, title, organizer, is_published, sort_order, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
`);
const findLec = db.prepare("SELECT id FROM lectures WHERE lawyer_id = ? AND title = ?");

let inserted = 0;
let skipped = 0;
lectures.forEach((lec, idx) => {
  if (findLec.get(lawyerRow.id, lec.title)) {
    skipped++;
    return;
  }
  insertLec.run(crypto.randomUUID(), lawyerRow.id, lec.title, lec.organizer, idx);
  inserted++;
});
console.log(`강의 등록: 신규 ${inserted}건, 기존 ${skipped}건 (lawyer_id=${lawyerRow.id})`);

db.close();
console.log("완료");
