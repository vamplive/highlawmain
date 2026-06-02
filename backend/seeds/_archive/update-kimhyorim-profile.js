/** 김효림 변호사 프로필 갱신 — 학력·경력·자격·수행사례·블로그를 실제 정보로 교체. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const profile = {
  education: JSON.stringify([
    { period: "", title: "한양대학교 법학과 졸업" },
  ]),
  career: JSON.stringify([
    { period: "", title: "제52회 사법시험 합격" },
    { period: "", title: "사법연수원 제42기 수료" },
    { period: "2015", title: "대법원 국선변호인" },
    { period: "2016", title: "대한변호사협회 법률구조변호사단" },
    { period: "2019", title: "서울행정법원 소송구조 변호사" },
    { period: "현재", title: "광명제9알구역 재개발정비사업조합 고문변호사" },
    { period: "현재", title: "소사3구역 재개발정비사업조합 고문변호사" },
  ]),
  specialties: JSON.stringify(["재개발", "재건축", "행정", "민사"]),
  qualifications: JSON.stringify([
    "변호사 자격취득",
    "대한변호사협회 인증 재개발·재건축 전문변호사 (등록 제2019-1224호)",
  ]),
  cases: JSON.stringify([
    {
      category: "재개발",
      description: "미아제4구역, 가재울뉴타운5구역, 응암제1·제10구역, 수색제9구역, 광명제16·14·10·9알구역 등 10개 이상 주택재개발정비사업조합의 건물인도소송, 주거이전비 등 청구소송, 수용보상금증액 사건",
    },
    {
      category: "재건축",
      description: "후평제2아파트, 개포시영아파트 등 재건축정비사업조합의 건물인도소송",
    },
    {
      category: "재개발·재건축 (기타)",
      description: "조합장직무집행정지 및 직무대행자선임 가처분, 학교용지분담금 무효확인, 사업시행인가 취소·무효확인, 관리처분계획인가 취소·무효, 조합설립인가취소, 분양권확인, 일조권 소송",
    },
    {
      category: "민사",
      description: "이혼 소송, 상가 권리금 소송, 보험금 청구사건",
    },
  ]),
  memberships: JSON.stringify([
    "대한변호사협회",
    "서울지방변호사회",
  ]),
  blogUrl: "https://blog.naver.com/lawyerkrim",
};

const existing = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("김효림");
if (!existing) {
  console.error("김효림 변호사 행을 찾지 못했습니다. seed-partners-profiles.js 를 먼저 실행하세요.");
  process.exit(1);
}

const stmt = db.prepare(`
  UPDATE lawyers
     SET education = @education,
         career = @career,
         specialties = @specialties,
         qualifications = @qualifications,
         cases = @cases,
         memberships = @memberships,
         blog_url = @blogUrl,
         updated_at = datetime('now')
   WHERE id = @id
`);
const r = stmt.run({ ...profile, id: existing.id });
console.log(`UPDATE 김효림 (${existing.id}): ${r.changes}건`);

db.close();
console.log("완료");
