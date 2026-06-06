const Database = require('better-sqlite3');
const db = new Database('./data/db/highlaw.db');

// Check portal_users columns
try {
  const schema = db.prepare("PRAGMA table_info(portal_users)").all();
  console.log('portal_users columns:', schema.map(c => c.name).join(', '));
  const users = db.prepare('SELECT id, email, name, role FROM portal_users LIMIT 5').all();
  console.log('\nportal_users:', JSON.stringify(users, null, 2));
} catch(e) { console.log('portal_users error:', e.message); }

// Check lawyers columns
try {
  const schema = db.prepare("PRAGMA table_info(lawyers)").all();
  console.log('\nlawyers columns:', schema.map(c => c.name).join(', '));
} catch(e) { console.log('lawyers error:', e.message); }

// Check consultations
try {
  const cons = db.prepare('SELECT * FROM consultations LIMIT 5').all();
  console.log('\nconsultations count:', cons.length, JSON.stringify(cons, null, 2));
} catch(e) { console.log('consultations error:', e.message); }

// Check documents - count all
try {
  const count = db.prepare('SELECT COUNT(*) as c FROM documents').get();
  console.log('\nTotal documents:', count.c);
} catch(e) { console.log('documents error:', e.message); }
