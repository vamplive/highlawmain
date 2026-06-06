const Database = require('better-sqlite3');
const path = require('path');

const STORAGE_BASE = process.env.STORAGE_PATH || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(STORAGE_BASE, 'db', 'highlaw.db');

console.log('[Migration] Database path:', DB_PATH);

let db;
try {
  db = new Database(DB_PATH);
} catch (err) {
  console.error('[Migration] Failed to open database:', err.message);
  process.exit(0); // exit safely so it doesn't block deployment
}

// 1. Delete dummy consultations (name = '홍길동' or email = 'test@example.com')
try {
  const dummyCons = db.prepare("SELECT id, name, email FROM consultations WHERE name = '홍길동' OR email = 'test@example.com'").all();
  console.log('[Migration] Dummy consultations found:', dummyCons.length);
  if (dummyCons.length > 0) {
    // Delete associated booking slots if any
    const consIds = dummyCons.map(c => c.id);
    const placeHolders = consIds.map(() => '?').join(',');
    db.prepare(`UPDATE booking_slots SET is_available = 1, consultation_id = NULL WHERE consultation_id IN (${placeHolders})`).run(...consIds);
    const result = db.prepare(`DELETE FROM consultations WHERE id IN (${placeHolders})`).run(...consIds);
    console.log('[Migration] Deleted consultations count:', result.changes);
  }
} catch (e) {
  console.error('[Migration] consultations delete error:', e.message);
}

// 2. Delete dummy documents (title = 't' or title = '' or title = '제목 없음')
try {
  const dummyDocs = db.prepare("SELECT id, title FROM documents WHERE title = 't' OR title = '' OR title = '제목 없음'").all();
  console.log('[Migration] Dummy documents found:', dummyDocs.length);
  if (dummyDocs.length > 0) {
    const docIds = dummyDocs.map(d => d.id);
    const placeHolders = docIds.map(() => '?').join(',');
    
    // Delete foreign keys
    try {
      db.prepare(`DELETE FROM document_categories WHERE document_id IN (${placeHolders})`).run(...docIds);
    } catch(e) { console.log('[Migration] document_categories cleanup:', e.message); }
    
    try {
      db.prepare(`DELETE FROM document_collections WHERE document_id IN (${placeHolders})`).run(...docIds);
    } catch(e) { console.log('[Migration] document_collections cleanup:', e.message); }
    
    try {
      db.prepare(`DELETE FROM document_relations WHERE source_id IN (${placeHolders}) OR target_id IN (${placeHolders})`).run(...[...docIds, ...docIds]);
    } catch(e) { console.log('[Migration] document_relations cleanup:', e.message); }

    const result = db.prepare(`DELETE FROM documents WHERE id IN (${placeHolders})`).run(...docIds);
    console.log('[Migration] Deleted documents count:', result.changes);
  }
} catch (e) {
  console.error('[Migration] documents delete error:', e.message);
}

console.log('[Migration] Done!');
db.close();
