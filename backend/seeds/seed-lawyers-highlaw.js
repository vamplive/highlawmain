/**
 * 법무법인 하이로 — 대표변호사 3명 시드
 * 기존 변호사 데이터를 비활성화하고 조덕재·김범·강민구 플레이스홀더 프로필을 삽입한다.
 * 실제 학력/경력/언론 데이터는 추후 관리자 페이지에서 입력.
 *
 * 실행: node seeds/seed-lawyers-highlaw.js
 */
const crypto = require("crypto");
const { sqlite } = require("../db");

const SPECIALTIES_ALL = ["불법파견", "게임사기", "노동", "군사건"];
const TBD_HOURS = "준비 중";

const NEW_LAWYERS = [
  {
    name: "조덕재",
    nameEn: "Jo Deok Jae",
    position: "대표변호사",
    team: "불법파견·노동팀",
    tagline: "불법파견·노동 사건에서 의뢰인의 실익을 끝까지 챙깁니다.",
    specialties: ["불법파견", "노동", ...SPECIALTIES_ALL.filter((s) => !["불법파견", "노동"].includes(s))],
    introduction: "법무법인 하이로 대표변호사. 불법파견·노동 분야에서 사건의 구조를 분석해 의뢰인에게 가장 실익이 큰 전략을 제시합니다. 상세 프로필 준비 중.",
    sortOrder: 1,
  },
  {
    name: "김범",
    nameEn: "Kim Beom",
    position: "대표변호사",
    team: "게임사기·민사팀",
    tagline: "게임사기·디지털 분쟁을 깊이 이해하는 변호사입니다.",
    specialties: ["게임사기", "불법파견", "노동", "군사건"],
    introduction: "법무법인 하이로 대표변호사. 게임사기·디지털 자산 분쟁에서 증거 확보부터 판결까지 일관된 대응을 제공합니다. 상세 프로필 준비 중.",
    sortOrder: 2,
  },
  {
    name: "강민구",
    nameEn: "Kang Min Gu",
    position: "대표변호사",
    team: "군사건·형사팀",
    tagline: "군사건과 형사 절차의 특수성을 이해하는 변호사입니다.",
    specialties: ["군사건", "노동", "불법파견", "게임사기"],
    introduction: "법무법인 하이로 대표변호사. 군사건과 형사 절차에서 특수 분야의 판례와 절차를 깊이 이해하고 사건을 다룹니다. 상세 프로필 준비 중.",
    sortOrder: 3,
  },
];

function run() {
  const txn = sqlite.transaction(() => {
    sqlite.prepare("UPDATE lawyers SET is_active = 0, updated_at = datetime('now')").run();

    const insert = sqlite.prepare(`
      INSERT INTO lawyers (
        id, name, name_en, name_hanja, position, team, photo_url, tagline,
        education, career, specialties, qualifications, publications, books,
        media, columns, cases, memberships, consult_hours, blog_url,
        introduction, email, phone, sort_order, is_active, created_at, updated_at
      ) VALUES (
        @id, @name, @name_en, @name_hanja, @position, @team, @photo_url, @tagline,
        @education, @career, @specialties, @qualifications, @publications, @books,
        @media, @columns, @cases, @memberships, @consult_hours, @blog_url,
        @introduction, @email, @phone, @sort_order, 1, datetime('now'), datetime('now')
      )
    `);

    for (const lawyer of NEW_LAWYERS) {
      insert.run({
        id: crypto.randomUUID(),
        name: lawyer.name,
        name_en: lawyer.nameEn,
        name_hanja: null,
        position: lawyer.position,
        team: lawyer.team,
        photo_url: null,
        tagline: lawyer.tagline,
        education: JSON.stringify([]),
        career: JSON.stringify([]),
        specialties: JSON.stringify(lawyer.specialties),
        qualifications: JSON.stringify(["대한민국 변호사"]),
        publications: JSON.stringify([]),
        books: JSON.stringify([]),
        media: JSON.stringify([]),
        columns: JSON.stringify([]),
        cases: JSON.stringify([]),
        memberships: JSON.stringify([]),
        consult_hours: TBD_HOURS,
        blog_url: null,
        introduction: lawyer.introduction,
        email: null,
        phone: null,
        sort_order: lawyer.sortOrder,
      });
    }
  });

  txn();

  const active = sqlite.prepare("SELECT name, position, team, sort_order FROM lawyers WHERE is_active = 1 ORDER BY sort_order").all();
  console.log(`[seed-lawyers-highlaw] 활성 변호사 ${active.length}명:`);
  active.forEach((row) => console.log(`  - ${row.name} (${row.position}, ${row.team})`));
}

run();
