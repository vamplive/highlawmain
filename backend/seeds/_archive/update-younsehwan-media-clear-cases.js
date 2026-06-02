/** 윤세환 대표변호사 — 미디어 교체(4건) + 수행사례·논문·저서 비우기. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const media = [
  {
    date: "2025-10-29",
    outlet: "국제신문",
    title: "부산 국제 중재-중재인 양성 프로그램, 법률인 활동 주목",
    url: "https://www.kookje.co.kr/news2011/asp/newsbody.asp?code=0300&key=20251029.99099007547",
  },
  {
    date: "2025-06-02",
    outlet: "서울지방변호사회 회보",
    title: "“AI는 변호사가 더욱 본질적이고 고차원적인 업무에 집중할 수 있도록 돕는 강력한 ‘협력 도구’가 될 것입니다”",
    url: "http://m.news.seoulbar.or.kr/news/articleView.html?idxno=3617",
  },
  {
    date: "2025-01-25",
    outlet: "중앙일보",
    title: "“너 AI 아니거든?”…20년차 전문 변호사 부려먹는 꿀팁",
    url: "https://www.joongang.co.kr/article/25310163",
  },
  {
    date: "2023-09-15",
    outlet: "로스쿨타임즈",
    title: "세계한인법률가회, 17일까지 성균관대서 제30회 총회 개최",
    url: "https://www.lawschooltimes.com/news/articleView.html?idxno=1477",
  },
];

const row = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("윤세환");
if (!row) {
  console.error("윤세환 변호사 행을 찾지 못했습니다.");
  process.exit(1);
}

const r = db.prepare(`
  UPDATE lawyers
     SET media = @media,
         cases = @empty,
         publications = @empty,
         books = @empty,
         updated_at = datetime('now')
   WHERE id = @id
`).run({
  media: JSON.stringify(media),
  empty: JSON.stringify([]),
  id: row.id,
});

console.log(`UPDATE 윤세환 (${row.id}): ${r.changes}건 — media ${media.length}건 / cases·publications·books 비움`);
db.close();
