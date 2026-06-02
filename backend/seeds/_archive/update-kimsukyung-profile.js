/** 김수경 변호사 프로필 갱신 — 학력/경력/자격/소속/블로그를 실제 정보로 교체. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const profile = {
  education: JSON.stringify([
    { period: "", title: "고려대학교 법과대학 법학과 졸업" },
  ]),
  career: JSON.stringify([
    { period: "", title: "제52회 사법시험 합격" },
    { period: "", title: "사법연수원 제42기 수료" },
  ]),
  qualifications: JSON.stringify([
    "변호사 자격취득",
    "세무사 자격취득",
    "대한변호사협회 인증 가사법 전문변호사 (등록 제2023-679호)",
    "대한변호사협회 인증 형사법 전문변호사 (등록 제2020-754호)",
  ]),
  memberships: JSON.stringify([
    "한국가정법률상담소 백인변호사단",
    "경기가정법률상담소 자문변호사",
    "성폭력피해자 법률지원사업 전문변호사",
    "대한변협법률구조재단 법률구조 수행변호사",
  ]),
  blogUrl: "https://blog.naver.com/lawyerksk",
};

const existing = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("김수경");
if (!existing) {
  console.error("김수경 변호사 행을 찾지 못했습니다. seed-partners-profiles.js 를 먼저 실행하세요.");
  process.exit(1);
}

const stmt = db.prepare(`
  UPDATE lawyers
     SET education = @education,
         career = @career,
         qualifications = @qualifications,
         memberships = @memberships,
         blog_url = @blogUrl,
         updated_at = datetime('now')
   WHERE id = @id
`);
const r = stmt.run({ ...profile, id: existing.id });
console.log(`UPDATE 김수경 (${existing.id}): ${r.changes}건`);

db.close();
console.log("완료");
