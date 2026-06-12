/**
 * 변호사 초기 데이터 — 테이블이 비어 있을 때만 삽입 (기존 데이터 보호)
 * db/index.js에서 자동 호출됨
 */
const crypto = require("crypto");
const path = require("path");

const DEFAULT_LAWYERS = [
  {
    name: "조덕재", nameEn: "Jo Deok Jae", position: "대표변호사",
    team: "불법파견·노동팀",
    tagline: "불법파견·노동 사건에서 의뢰인의 실익을 끝까지 챙깁니다.",
    specialties: JSON.stringify(["불법파견", "노동", "게임사기", "군사건"]),
    introduction: "법무법인 하이로 대표변호사. 불법파견·노동 분야 전문.",
    sortOrder: 1,
  },
  {
    name: "김범", nameEn: "Kim Beom", position: "대표변호사",
    team: "게임사기·민사팀",
    tagline: "게임사기·디지털 분쟁을 깊이 이해하는 변호사입니다.",
    specialties: JSON.stringify(["게임사기", "불법파견", "노동", "군사건"]),
    introduction: "법무법인 하이로 대표변호사. 게임사기·디지털 자산 분쟁 전문.",
    sortOrder: 2,
  },
  {
    name: "강민구", nameEn: "Kang Min Gu", position: "대표변호사",
    team: "군사건·형사팀",
    tagline: "군사건과 형사 절차의 특수성을 이해하는 변호사입니다.",
    specialties: JSON.stringify(["군사건", "노동", "불법파견", "게임사기"]),
    introduction: "법무법인 하이로 대표변호사. 군사건과 형사 절차 전문.",
    sortOrder: 3,
  },
];

function seedLawyersIfEmpty(sqlite) {
  const count = sqlite.prepare("SELECT count(*) as c FROM lawyers").get();
  if (count.c > 0) return { inserted: 0 };

  const insert = sqlite.prepare(`
    INSERT INTO lawyers (
      id, name, name_en, position, team, tagline, specialties, introduction,
      sort_order, is_active, created_at, updated_at
    ) VALUES (
      @id, @name, @nameEn, @position, @team, @tagline, @specialties, @introduction,
      @sortOrder, 1, datetime('now'), datetime('now')
    )
  `);

  const txn = sqlite.transaction(() => {
    for (const lawyer of DEFAULT_LAWYERS) {
      insert.run({ ...lawyer, id: crypto.randomUUID() });
    }
  });
  txn();
  return { inserted: DEFAULT_LAWYERS.length };
}

// 직접 실행 시 (node seeds/seed-lawyers-safe-init.js)
if (require.main === module) {
  const { sqlite } = require(path.join(__dirname, "../db"));
  const result = seedLawyersIfEmpty(sqlite);
  console.log(`[seed] 변호사 ${result.inserted}명 삽입 완료`);
  process.exit(0);
}

module.exports = { seedLawyersIfEmpty };
