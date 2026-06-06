const Database = require('better-sqlite3');
const db = new Database('./data/db/highlaw.db');

// 1. Delete dummy documents (all documents with title 't')
try {
  // First check what we'll delete
  const dummyDocs = db.prepare("SELECT id, title FROM documents WHERE title = 't' OR title = ''").all();
  console.log('Dummy documents to delete:', dummyDocs.length, JSON.stringify(dummyDocs, null, 2));
  
  if (dummyDocs.length > 0) {
    // Delete from document_categories first (foreign key)
    try {
      db.prepare("DELETE FROM document_categories WHERE document_id IN (SELECT id FROM documents WHERE title = 't' OR title = '')").run();
    } catch(e) { console.log('document_categories cleanup:', e.message); }
    
    // Delete from document_collections (foreign key)
    try {
      db.prepare("DELETE FROM document_collections WHERE document_id IN (SELECT id FROM documents WHERE title = 't' OR title = '')").run();
    } catch(e) { console.log('document_collections cleanup:', e.message); }
    
    // Delete from document_relations (foreign key)
    try {
      db.prepare("DELETE FROM document_relations WHERE document_id IN (SELECT id FROM documents WHERE title = 't' OR title = '') OR related_id IN (SELECT id FROM documents WHERE title = 't' OR title = '')").run();
    } catch(e) { console.log('document_relations cleanup:', e.message); }
    
    const result = db.prepare("DELETE FROM documents WHERE title = 't' OR title = ''").run();
    console.log('Deleted documents:', result.changes);
  }
} catch(e) { console.log('documents delete error:', e.message); }

// 2. Delete dummy consultations (name = '홍길동' with test emails)
try {
  const dummyCons = db.prepare("SELECT id, name, email, created_at FROM consultations WHERE name = '홍길동'").all();
  console.log('\nDummy consultations to delete:', dummyCons.length, JSON.stringify(dummyCons, null, 2));
  
  if (dummyCons.length > 0) {
    const result = db.prepare("DELETE FROM consultations WHERE name = '홍길동'").run();
    console.log('Deleted consultations:', result.changes);
  }
} catch(e) { console.log('consultations delete error:', e.message); }

// Verify
try {
  const remainingDocs = db.prepare('SELECT COUNT(*) as c FROM documents').get();
  console.log('\nRemaining documents:', remainingDocs.c);
  const remainingCons = db.prepare('SELECT COUNT(*) as c FROM consultations').get();
  console.log('Remaining consultations:', remainingCons.c);
} catch(e) { console.log('verify error:', e.message); }

console.log('\nDone!');
