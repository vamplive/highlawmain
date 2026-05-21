/**
 * 윤세환 변호사 AI 강의 리스트 정리 (1회성 마이그레이션)
 *
 * 운영자 요청:
 *  - 묶음 카드(서울/사내, 대륙아주 합본, 로고스/엘박스/연수원, IAKL/정세/여성)는 모두
 *    삭제하고 기관 단위로 개별 카드를 만든다.
 *  - 대륙아주는 기본강의 / 심화강의 두 건으로 분리한다.
 *  - 이미 단독 카드가 존재하는 항목(로고스/엘박스/연수원/2026 여성/2026 의무연수)은 유지.
 *
 * 실행: node seeds/restructure-yousehwan-ai-lectures.js
 */
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "db", "yjlaw.db");
const LAWYER_ID = "c761d3da-9111-40e8-a60a-68812542ade2"; // 윤세환

// 합본 카드 4건 — 삭제 대상
const REMOVE_IDS = [
  "ee3015ba-6290-4947-846e-7284cb227b2c", // 법률 AI 특강 (서울/사내 합본)
  "5781fe86-cc51-413c-8ed1-64b7ce746767", // 법률 AI 기본+심화 (대륙아주 합본)
  "23332e3c-faba-462c-b550-0fd3fb9d25f0", // 법률 AI 강의 (로고스/엘박스/연수원 합본)
  "319d2ad3-7512-47c1-bfc2-6d90c5e1a5c1", // 법률 AI 강의 2025 (IAKL/정세/여성 합본)
];

// 새로 생성할 카드 — 기관별 1건
const NEW_LECTURES = [
  { title: "서울지방변호사회 법률 AI 특강",       organizer: "서울지방변호사회",                date: null   },
  { title: "한국사내변호사회 법률 AI 특강",       organizer: "한국사내변호사회",                date: null   },
  { title: "대륙아주 법률 AI 기본강의",           organizer: "법무법인(유) 대륙아주",            date: null   },
  { title: "대륙아주 법률 AI 심화강의",           organizer: "법무법인(유) 대륙아주",            date: null   },
  { title: "IAKL 법률 AI 강의",                   organizer: "세계한인법률가회(IAKL)",           date: "2025" },
  { title: "정세 법률 AI 강의",                   organizer: "법무법인 정세",                    date: "2025" },
  { title: "여성변호사회 법률 AI 강의",           organizer: "대한변호사협회 여성변호사회",       date: "2025" },
];

function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function main() {
  const db = new Database(DB_PATH);
  console.log("DB:", DB_PATH);

  const before = db.prepare("SELECT COUNT(*) AS n FROM lectures WHERE lawyer_id=?").get(LAWYER_ID);
  console.log(`[before] 윤세환 강의 수: ${before.n}`);

  const tx = db.transaction(() => {
    // 1) 합본 카드 삭제
    const del = db.prepare("DELETE FROM lectures WHERE id=?");
    let removed = 0;
    for (const id of REMOVE_IDS) {
      const info = del.run(id);
      if (info.changes > 0) removed += 1;
    }
    console.log(`삭제: ${removed} / ${REMOVE_IDS.length}건`);

    // 2) 기존 정렬 순서 끝 다음부터 새로 추가
    const maxRow = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM lectures WHERE lawyer_id=?").get(LAWYER_ID);
    let nextOrder = (maxRow.m ?? -1) + 1;

    const insert = db.prepare(`
      INSERT INTO lectures (id, lawyer_id, title, description, date, venue, organizer,
                            thumbnail_url, material_url, material_name, is_published, sort_order,
                            created_at, updated_at)
      VALUES (@id, @lawyer_id, @title, @description, @date, @venue, @organizer,
              @thumbnail_url, @material_url, @material_name, @is_published, @sort_order,
              @created_at, @updated_at)
    `);

    let added = 0;
    for (const l of NEW_LECTURES) {
      // 같은 제목이 이미 있으면 (재실행 안전) 건너뜀
      const dup = db.prepare("SELECT id FROM lectures WHERE lawyer_id=? AND title=?").get(LAWYER_ID, l.title);
      if (dup) {
        console.log(`  · 이미 존재: ${l.title}`);
        continue;
      }
      const ts = nowIso();
      insert.run({
        id: crypto.randomUUID(),
        lawyer_id: LAWYER_ID,
        title: l.title,
        description: null,
        date: l.date,
        venue: null,
        organizer: l.organizer,
        thumbnail_url: null,
        material_url: null,
        material_name: null,
        is_published: 1,
        sort_order: nextOrder++,
        created_at: ts,
        updated_at: ts,
      });
      added += 1;
      console.log(`  + 추가: ${l.title} (${l.organizer})`);
    }
    console.log(`신규: ${added}건`);
  });
  tx();

  const after = db.prepare("SELECT COUNT(*) AS n FROM lectures WHERE lawyer_id=?").get(LAWYER_ID);
  console.log(`[after] 윤세환 강의 수: ${after.n}`);
  db.close();
}

main();
