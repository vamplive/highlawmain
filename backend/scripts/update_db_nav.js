/**
 * 데이터베이스(SQLite) GNB 메뉴 순서 및 라벨 동기화 스크립트
 *
 * 이 스크립트는 `site_settings` 테이블에서 page = 'layout', section = 'nav'인 레코드를
 * 찾아 사용자가 요청한 최신 순서와 라벨로 강제 업데이트합니다.
 * 또한 변경 이력을 남기기 위해 `site_settings_history` 테이블에도 백업 레코드를 기록합니다.
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// 데이터베이스 절대 경로 설정
const dbPath = path.join(__dirname, '..', 'data', 'db', 'highlaw.db');
console.log(`[DB Sync] 연결할 데이터베이스 경로: ${dbPath}`);

let db;
try {
  db = new Database(dbPath, { fileMustExist: true });
} catch (error) {
  console.error(`[DB Sync] 데이터베이스 파일이 존재하지 않거나 연결에 실패했습니다: ${error.message}`);
  process.exit(1);
}

// 1. 현재 설정 값 조회
const selectStmt = db.prepare("SELECT * FROM site_settings WHERE page = ? AND section = ?");
const currentRecord = selectStmt.get('layout', 'nav');

// 새로운 내비게이션 항목 배열 설정
const newNavItems = {
  items: [
    { to: "/about", label: "사무소 소개" },
    { to: "/lawyers", label: "변호사 소개" },
    { to: "/practice", label: "업무 분야" },
    { to: "/blog", label: "소식" },
    { to: "/recruit", label: "채용" },
    { to: "/consultation", label: "상담문의" }
  ]
};
const newContentString = JSON.stringify(newNavItems);

console.log('[DB Sync] 신규 적용될 GNB 설정:', JSON.stringify(newNavItems, null, 2));

try {
  // 트랜잭션 실행
  db.transaction(() => {
    let previousContent = null;
    if (currentRecord) {
      previousContent = currentRecord.content;
      console.log('[DB Sync] 기존 GNB 설정 백업용 데이터 확인 완료.');
    }

    // 2. 이력 테이블(site_settings_history)에 기록 추가
    const insertHistoryStmt = db.prepare(`
      INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const historyId = crypto.randomUUID();
    insertHistoryStmt.run(historyId, 'layout', 'nav', newContentString, previousContent, '시스템 스크립트');
    console.log(`[DB Sync] 설정 변경 이력 기록 완료 (ID: ${historyId}).`);

    // 3. 실제 설정 테이블(site_settings) 업데이트 또는 삽입
    const insertOrReplaceStmt = db.prepare(`
      INSERT INTO site_settings (id, page, section, content, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
    `);
    
    const recordId = currentRecord ? currentRecord.id : crypto.randomUUID();
    insertOrReplaceStmt.run(recordId, 'layout', 'nav', newContentString);
    console.log(`[DB Sync] site_settings 테이블 업데이트 완료 (ID: ${recordId}).`);
  })();

  console.log('[DB Sync] GNB 메뉴 데이터베이스 동기화가 성공적으로 완료되었습니다.');
} catch (err) {
  console.error('[DB Sync] 동기화 작업 실패:', err.message);
  process.exit(1);
} finally {
  if (db) {
    db.close();
    console.log('[DB Sync] 데이터베이스 연결을 닫았습니다.');
  }
}
