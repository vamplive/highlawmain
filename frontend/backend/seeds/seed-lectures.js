/**
 * 윤세환 변호사 강의 활동 시드 데이터
 * - 프로덕션 배포 시: node seed-lectures.js
 * - 경력 필드 강의를 자동 마이그레이션하려면: node migrate-career-lectures.js
 */
const crypto = require("crypto");
const Database = require("better-sqlite3");
const path = require("path");

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const DB_PATH = path.join(STORAGE_PATH, "db", "highlaw.db");
const db = new Database(DB_PATH);

// lectures 테이블 생성 (없으면)
db.exec(`
  CREATE TABLE IF NOT EXISTS lectures (
    id TEXT PRIMARY KEY,
    lawyer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    venue TEXT,
    organizer TEXT,
    thumbnail_url TEXT,
    material_url TEXT,
    material_name TEXT,
    is_published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_lectures_lawyer_id ON lectures(lawyer_id);
`);

// thumbnail_url 컬럼 추가 (이미 있으면 무시)
try { db.exec("ALTER TABLE lectures ADD COLUMN thumbnail_url TEXT"); } catch {}

// 윤세환 변호사 찾기
const yoon = db.prepare("SELECT id FROM lawyers WHERE name = '윤세환'").get();
if (!yoon) {
  console.log("윤세환 변호사를 찾을 수 없습니다. seed-lawyers.js를 먼저 실행해주세요.");
  process.exit(1);
}

const lawyerId = yoon.id;

// 기존 강의 확인
const existing = db.prepare("SELECT count(*) as c FROM lectures WHERE lawyer_id = ?").get(lawyerId);
if (existing.c > 0) {
  console.log(`이미 ${existing.c}건의 강의가 등록되어 있습니다. 중복 방지를 위해 건너뜁니다.`);
  console.log("기존 데이터를 삭제하고 다시 넣으려면:");
  console.log("  node -e \"require('better-sqlite3')('./data/db/highlaw.db').exec('DELETE FROM lectures')\"");
  db.close();
  process.exit(0);
}

const lectures = [
  {
    title: "동아대 법전원 민사법 기록형 + 법조윤리 특강",
    description: "동아대학교 법학전문대학원 학생들을 대상으로 민사법 기록형 시험 대비 및 법조윤리 분야의 실무적 관점을 다루는 특강을 진행하였습니다. 변호사시험 기록형 출제 경향 분석과 답안 작성 전략을 포함합니다.",
    organizer: "동아대학교 법학전문대학원",
    thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    sortOrder: 1,
  },
  {
    title: "아주대 법전원 민사법 기록형 특강",
    description: "아주대학교 법학전문대학원에서 민사법 기록형 시험 준비를 위한 집중 특강을 진행하였습니다. 실제 사례를 바탕으로 한 기록형 문제 풀이와 논점 정리 방법을 강의하였습니다.",
    organizer: "아주대학교 법학전문대학원",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    sortOrder: 2,
  },
  {
    title: "경기대 행정복지상담대학원 부동산 사법·공법 강의",
    description: "경기대학교 행정복지상담대학원에서 부동산 관련 사법 및 공법 분야의 체계적인 강의를 진행하였습니다. 부동산 거래의 법적 구조, 등기제도, 건축·도시계획 관련 공법 규제를 다루었습니다.",
    organizer: "경기대학교 행정복지상담대학원",
    thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    sortOrder: 3,
  },
  {
    title: "경찰인재개발원 행정소송법 강의",
    description: "경찰인재개발원에서 경찰 공무원을 대상으로 행정소송법의 기본 체계와 실무적 쟁점을 강의하였습니다. 행정처분의 적법성 판단, 취소소송 절차, 집행정지 등 현장에서 필요한 법률 지식을 전달하였습니다.",
    organizer: "경찰인재개발원",
    thumbnailUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
    sortOrder: 4,
  },
  {
    title: "서울지방변호사회·한국사내변호사회 법률 AI 특강",
    description: "서울지방변호사회와 한국사내변호사회 공동 주최로, 법률 분야에서의 AI 활용 현황과 전망을 다루는 특강을 진행하였습니다. AI 기반 법률 리서치, 계약서 분석 자동화, 리걸테크 트렌드 등을 소개하였습니다.",
    organizer: "서울지방변호사회·한국사내변호사회",
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    sortOrder: 5,
  },
  {
    title: "법무법인(유) 대륙아주 법률 AI 기본·심화강의",
    description: "법무법인(유) 대륙아주 소속 변호사들을 대상으로 법률 AI 도구의 기본 활용법부터 심화 활용 전략까지를 체계적으로 강의하였습니다. ChatGPT, Claude 등 생성형 AI의 법률 실무 적용 사례를 중점적으로 다루었습니다.",
    organizer: "법무법인(유) 대륙아주",
    thumbnailUrl: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80",
    sortOrder: 6,
  },
  {
    title: "법무법인(유) 로고스·(주) 엘박스·서울지방변호사회 기업법무연수원 강의",
    description: "법무법인(유) 로고스, (주) 엘박스, 서울지방변호사회 기업법무연수원 공동 주최 강의를 진행하였습니다. 기업법무 실무에서의 리스크 관리와 효율적인 법률 서비스 제공 방안을 논의하였습니다.",
    organizer: "법무법인(유) 로고스·(주) 엘박스·서울지방변호사회",
    thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    sortOrder: 7,
  },
  {
    title: "2025 세계한인법률가회(IAKL)·법무법인 정세·여성변호사회 강의",
    description: "2025 세계한인법률가회(IAKL), 법무법인 정세, 여성변호사회 공동 행사에서 강의를 진행하였습니다. 한국 법률 시장의 글로벌화와 법률 AI의 역할에 대한 인사이트를 공유하였습니다.",
    date: "2025",
    organizer: "세계한인법률가회(IAKL)·법무법인 정세·여성변호사회",
    thumbnailUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&q=80",
    sortOrder: 8,
  },
];

const stmt = db.prepare(`
  INSERT INTO lectures (id, lawyer_id, title, description, date, venue, organizer, thumbnail_url, is_published, sort_order, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
`);

for (const l of lectures) {
  stmt.run(
    crypto.randomUUID(), lawyerId, l.title, l.description || null,
    l.date || null, l.venue || null, l.organizer || null,
    l.thumbnailUrl || null, l.sortOrder
  );
  console.log("추가:", l.title);
}

db.close();
console.log(`\n완료: ${lectures.length}건의 강의가 등록되었습니다.`);
