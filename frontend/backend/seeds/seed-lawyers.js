/** 변호사 시드 데이터 */
const crypto = require("crypto");
const Database = require("better-sqlite3");
const db = new Database(require("path").join(__dirname,"..","data","db","highlaw.db"));

const lawyers = [
  {
    name: "윤세환",
    nameEn: "Yoon Se-Hwan",
    position: "대표변호사",
    photoUrl: "/lawyers/younsehwan/younsehwan_profile.png",
    education: JSON.stringify(["서울대학교 법학전문대학원 졸업", "서울대학교 졸업"]),
    career: JSON.stringify(["대한변호사협회 등록", "법무법인 하이로 대표"]),
    specialties: JSON.stringify(["건설", "부동산", "민사", "형사", "행정"]),
    introduction: "의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다. 건설·부동산 분쟁에서 축적한 실무 경험을 바탕으로, 리스크를 줄이고 최선의 결론을 이끌어냅니다.",
    sortOrder: 1,
  },
  {
    name: "한샘이",
    nameEn: "Han Saem-I",
    position: "파트너변호사",
    education: JSON.stringify([]),
    career: JSON.stringify(["대한변호사협회 등록", "법무법인 하이로 파트너"]),
    specialties: JSON.stringify(["민사", "가사", "행정"]),
    introduction: "복잡한 법률 문제를 명확하게 풀어내고, 의뢰인과 함께 최적의 해결책을 찾아갑니다.",
    sortOrder: 2,
  },
  {
    name: "김효림",
    nameEn: "Kim Hyo-Rim",
    position: "파트너변호사",
    education: JSON.stringify([]),
    career: JSON.stringify(["대한변호사협회 등록", "법무법인 하이로 파트너"]),
    specialties: JSON.stringify(["부동산", "건설", "민사"]),
    introduction: "꼼꼼한 분석과 전략적 사고로 의뢰인의 권익을 적극 보호합니다.",
    sortOrder: 3,
  },
  {
    name: "김수경",
    nameEn: "Kim Su-Kyung",
    position: "파트너변호사",
    education: JSON.stringify([]),
    career: JSON.stringify(["대한변호사협회 등록", "법무법인 하이로 파트너"]),
    specialties: JSON.stringify(["형사", "민사", "기업법무"]),
    introduction: "신속하고 정확한 대응으로 의뢰인이 안심할 수 있는 법률 서비스를 제공합니다.",
    sortOrder: 4,
  },
];

const stmt = db.prepare(
  `INSERT INTO lawyers (id, name, name_en, position, photo_url, education, career, specialties, introduction, sort_order, is_active, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
);

for (const l of lawyers) {
  stmt.run(
    crypto.randomUUID(),
    l.name,
    l.nameEn,
    l.position,
    l.photoUrl || null,
    l.education,
    l.career,
    l.specialties,
    l.introduction,
    l.sortOrder
  );
  console.log("추가:", l.name, "-", l.position);
}

db.close();
console.log("완료");
