/** 한샘이 변호사 프로필 갱신 — 학력·경력·자격·소속·블로그를 실제 정보로 교체. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "yjlaw.db");
const db = new Database(dbPath);

const profile = {
  education: JSON.stringify([
    { period: "", title: "서울 압구정고등학교 졸업" },
    { period: "", title: "연세대학교 법과대학 법학과 졸업" },
  ]),
  career: JSON.stringify([
    { period: "2011", title: "제53회 사법시험 합격" },
    { period: "", title: "사법연수원 제43기 수료" },
    { period: "", title: "제1회 변호사시험 출제검토위원 (법무부 법조인력과)" },
    { period: "", title: "제54회 사법시험 출제검토위원 (법무부 법조인력과)" },
    { period: "", title: "서울중앙지방검찰청 검사직무대리" },
    { period: "", title: "수원지방법원 평택지원 민사조정위원·국선변호인" },
    { period: "", title: "법무법인 골든윈 소속변호사" },
    { period: "", title: "법무법인 길상 소속변호사" },
    { period: "", title: "학교법인 동국대학교 법무총괄 변호사" },
    { period: "", title: "학교법인 동국대학교 법무·노무위원회 위원" },
    { period: "", title: "문화체육관광부 한국만화영상진흥원 전문위원" },
    { period: "", title: "한국농아인협회 고문변호사" },
    { period: "현재", title: "대법원·서울중앙·남부·북부지방법원 국선변호인" },
    { period: "현재", title: "서울특별시 공익변호사" },
    { period: "현재", title: "서울 반원초등학교·예일초등학교·숭실중학교 변호사명예교사" },
    { period: "현재", title: "서울 반원초등학교 교권보호위원회 위원" },
    { period: "현재", title: "국민권익위원회 비실명 대리신고 자문변호사" },
    { period: "현재", title: "중앙행정심판위원회 행정심판 국선대리인" },
    { period: "현재", title: "서울특별시 행정심판위원회 국선대리인" },
    { period: "현재", title: "국가고시 시험위원" },
    { period: "현재", title: "서울북부교육지원청 학교폭력대책심의위원회 위원" },
    { period: "현재", title: "서울특별시교육청 성희롱·성폭력 자문·심의위원" },
    { period: "현재", title: "서울특별시교육청 상급심의위원회 외부위원" },
    { period: "현재", title: "법률사무소 세화 대표변호사" },
  ]),
  specialties: JSON.stringify(["민사", "가사", "행정", "형사"]),
  qualifications: JSON.stringify([
    "변호사 자격취득",
  ]),
  blogUrl: "https://blog.naver.com/lawyer_withyou",
};

const existing = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("한샘이");
if (!existing) {
  console.error("한샘이 변호사 행을 찾지 못했습니다. seed-partners-profiles.js 를 먼저 실행하세요.");
  process.exit(1);
}

const stmt = db.prepare(`
  UPDATE lawyers
     SET education = @education,
         career = @career,
         specialties = @specialties,
         qualifications = @qualifications,
         blog_url = @blogUrl,
         updated_at = datetime('now')
   WHERE id = @id
`);
const r = stmt.run({ ...profile, id: existing.id });
console.log(`UPDATE 한샘이 (${existing.id}): ${r.changes}건`);

db.close();
console.log("완료");
