/** 파트너변호사 3인(한샘이/김효림/김수경) 프로필 풍부화 시드.
 *  각 변호사 행이 있으면 UPDATE, 없으면 INSERT. 다른 변호사는 손대지 않는다. */
const crypto = require("crypto");
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "yjlaw.db");
const db = new Database(dbPath);

const profiles = [
  {
    name: "한샘이",
    nameHanja: "韓샘伊",
    nameEn: "Han Saem-I",
    position: "파트너변호사",
    team: "민사·가사팀",
    photoUrl: "/lawyers/hansaemi/hansaemi_profile.png",
    tagline: "복잡한 가사·민사 분쟁을 차분하게 풀어냅니다.",
    introduction:
      "복잡한 법률 문제를 명확하게 풀어내고, 의뢰인과 함께 최적의 해결책을 찾아갑니다. 이혼·상속·후견 등 가사사건과 민사 분쟁에서 의뢰인의 입장을 가장 가까이에서 대변합니다.",
    email: "hansaemi@younjeong.com",
    phone: "02-000-0000",
    consultHours: "평일 09:30 – 18:00",
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
    publications: JSON.stringify([
      { year: 2023, title: "재산분할에서 기여도 산정의 실무 쟁점", journal: "가족법연구 제37권 제2호" },
    ]),
    books: JSON.stringify([]),
    media: JSON.stringify([
      { date: "2025-02-18", outlet: "여성신문", title: "이혼 시 연금분할, 무엇을 챙겨야 하나" },
    ]),
    columns: JSON.stringify([
      { date: "2026-04-10", title: "상속포기와 한정승인 중 무엇을 선택해야 하는가", url: "/blog/inheritance-renunciation-limited-approval" },
    ]),
    cases: JSON.stringify([
      { year: 2024, category: "가사", caseNumber: "OO가정법원 2024드합○○○○", description: "재산분할 및 위자료 청구사건에서 청구인 대리", outcome: "일부인용" },
      { year: 2023, category: "민사", caseNumber: "OO지방법원 2023가합○○○○", description: "공동상속인 사이의 상속재산분할 청구", outcome: "조정성립" },
    ]),
    memberships: JSON.stringify([
      "대한변호사협회",
      "서울지방변호사회",
    ]),
    blogUrl: "https://blog.naver.com/lawyer_withyou",
    sortOrder: 2,
  },
  {
    name: "김효림",
    nameHanja: "金孝林",
    nameEn: "Kim Hyo-Rim",
    position: "파트너변호사",
    team: "건설·부동산팀",
    photoUrl: "/lawyers/kimhyorim/kimhyorim_profile.jpg",
    tagline: "꼼꼼한 분석과 전략적 사고로 부동산·건설 사건을 다룹니다.",
    introduction:
      "꼼꼼한 분석과 전략적 사고로 의뢰인의 권익을 적극 보호합니다. 분양·임대차·재건축 등 부동산 사건과 공사대금·하자 분쟁에서 의뢰인에게 유리한 결과를 만듭니다.",
    email: "kimhyorim@younjeong.com",
    phone: "02-000-0000",
    consultHours: "평일 09:30 – 18:00",
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
    publications: JSON.stringify([]),
    books: JSON.stringify([]),
    media: JSON.stringify([]),
    columns: JSON.stringify([]),
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
    sortOrder: 3,
  },
  {
    name: "김수경",
    nameHanja: "金秀京",
    nameEn: "Kim Su-Kyung",
    position: "파트너변호사",
    team: "형사·기업법무팀",
    photoUrl: "/lawyers/kimsukyung/kimsukyung_profile.jpg",
    tagline: "신속하고 정확한 대응으로 형사·기업 사건을 다룹니다.",
    introduction:
      "신속하고 정확한 대응으로 의뢰인이 안심할 수 있는 법률 서비스를 제공합니다. 형사사건과 기업 자문에서 사건 초기부터 결과까지 일관된 전략으로 의뢰인을 보호합니다.",
    email: "kimsukyung@younjeong.com",
    phone: "02-000-0000",
    consultHours: "평일 09:30 – 18:00",
    education: JSON.stringify([
      { period: "", title: "고려대학교 법과대학 법학과 졸업" },
    ]),
    career: JSON.stringify([
      { period: "", title: "제52회 사법시험 합격" },
      { period: "", title: "사법연수원 제42기 수료" },
    ]),
    specialties: JSON.stringify(["가사", "형사", "민사"]),
    qualifications: JSON.stringify([
      "변호사 자격취득",
      "세무사 자격취득",
      "대한변호사협회 인증 가사법 전문변호사 (등록 제2023-679호)",
      "대한변호사협회 인증 형사법 전문변호사 (등록 제2020-754호)",
    ]),
    publications: JSON.stringify([
      { year: 2024, title: "기업 내부조사와 진술거부권의 관계", journal: "형사법연구 제36권" },
    ]),
    books: JSON.stringify([
      { year: 2022, title: "기업범죄 수사 대응 실무", publisher: "박영사", role: "공저" },
    ]),
    media: JSON.stringify([
      { date: "2025-04-02", outlet: "법률신문", title: "중대재해처벌법 3년, 기업의 대응 전략" },
    ]),
    columns: JSON.stringify([
      { date: "2026-04-15", title: "형사 고소장을 제출하기 전에 민사와 함께 검토해야 할 것", url: "/blog/criminal-complaint-guide" },
    ]),
    cases: JSON.stringify([
      { year: 2024, category: "형사", caseNumber: "OO지방법원 2024고합○○○○", description: "특정경제범죄가중처벌법 위반 사건의 피고인 변호", outcome: "감형" },
      { year: 2023, category: "기업법무", description: "상장사 내부조사 및 검찰 대응 자문", outcome: "비기소 처분" },
    ]),
    memberships: JSON.stringify([
      "한국가정법률상담소 백인변호사단",
      "경기가정법률상담소 자문변호사",
      "성폭력피해자 법률지원사업 전문변호사",
      "대한변협법률구조재단 법률구조 수행변호사",
    ]),
    blogUrl: "https://blog.naver.com/lawyerksk",
    sortOrder: 4,
  },
];

const findStmt = db.prepare("SELECT id FROM lawyers WHERE name = ?");

for (const profile of profiles) {
  const existing = findStmt.get(profile.name);
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
}

db.close();
console.log("완료");

function camelToSnake(s) {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
