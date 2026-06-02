/** 윤세환 대표변호사 프로필 풍부화 시드.
 *  기존 행이 있으면 UPDATE, 없으면 INSERT. 다른 변호사는 손대지 않는다. */
const crypto = require("crypto");
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const profile = {
  name: "윤세환",
  nameHanja: "尹世煥",
  nameEn: "Youn Se Hwan",
  position: "대표변호사",
  team: "건설·부동산팀",
  photoUrl: "/lawyers/younsehwan/younsehwan_profile.jpg",
  tagline: "건설과 부동산, 사람과 계약 사이의 법률 문제를 다룹니다.",
  introduction:
    "의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다. 건설·부동산 분쟁에서 축적한 실무 경험을 바탕으로, 리스크를 줄이고 최선의 결론을 이끌어냅니다.",
  email: "younsehwan@highlaw.co.kr",
  phone: "02-000-0000",
  consultHours: "평일 09:30 – 18:00",
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
  specialties: JSON.stringify(["건설", "부동산", "민사", "형사", "행정"]),
  qualifications: JSON.stringify([
    "대한민국 변호사 (변호사 등록 제○○○○○호)",
    "대한변호사협회 건설부동산 전문변호사",
  ]),
  publications: JSON.stringify([
    { year: 2024, title: "건설계약의 위험분담에 관한 연구", journal: "건설법학회지 제15권 제2호" },
    { year: 2022, title: "공동주택 하자담보책임의 법적 쟁점", journal: "부동산법연구 제18집" },
  ]),
  books: JSON.stringify([
    { year: 2023, title: "실무자를 위한 건설분쟁 해설", publisher: "법문사", role: "공저" },
  ]),
  media: JSON.stringify([
    { date: "2025-03-12", outlet: "법률신문", title: "건설현장 산재, 원수급인 책임 어디까지" },
    { date: "2024-11-04", outlet: "조선비즈", title: "재건축 초과이익환수제 합헌 결정의 의미" },
  ]),
  columns: JSON.stringify([
    { date: "2026-04-22", title: "건설 하자 분쟁에서 하자보수비와 손해배상액을 산정하는 법", url: "/blog/construction-defect-liability-strategy" },
    { date: "2026-03-15", title: "부동산 매매계약 해제와 계약금·위약금 정산 기준", url: "/blog/real-estate-sale-contract-cancellation" },
  ]),
  cases: JSON.stringify([
    { year: 2024, category: "건설", caseNumber: "OO지방법원 2024가합○○○○", description: "시공사를 대리하여 추가공사대금 청구", outcome: "일부승소" },
    { year: 2023, category: "부동산", caseNumber: "OO지방법원 2023가단○○○○", description: "임차인을 대리한 권리금 회수 방해 손해배상", outcome: "조정성립" },
    { year: 2023, category: "행정", caseNumber: "서울행정법원 2023구합○○○○", description: "건축허가 취소처분 취소소송", outcome: "인용(확정)" },
  ]),
  memberships: JSON.stringify([
    "대한변호사협회",
    "서울지방변호사회",
    "한국건설법학회",
    "한국부동산법학회",
  ]),
  sortOrder: 1,
};

const existing = db.prepare("SELECT id FROM lawyers WHERE name = ?").get(profile.name);
const cols = Object.keys(profile);

if (existing) {
  const set = cols.map((c) => `${camelToSnake(c)} = @${c}`).join(", ");
  db.prepare(`UPDATE lawyers SET ${set}, updated_at = datetime('now') WHERE id = @id`).run({ ...profile, id: existing.id });
  console.log("UPDATE:", profile.name, existing.id);
} else {
  const id = crypto.randomUUID();
  const colNames = cols.map(camelToSnake).concat(["id", "is_active", "created_at", "updated_at"]).join(", ");
  const placeholders = cols.map((c) => `@${c}`).concat(["@id", "1", "datetime('now')", "datetime('now')"]).join(", ");
  db.prepare(`INSERT INTO lawyers (${colNames}) VALUES (${placeholders})`).run({ ...profile, id });
  console.log("INSERT:", profile.name, id);
}

db.close();
console.log("완료");

function camelToSnake(s) {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
