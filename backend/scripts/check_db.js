const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../data/db/highlaw.db'));

// Check portal_users
try {
  const users = db.prepare('SELECT id, email, role, client_id FROM portal_users').all();
  console.log('\nportal_users:', JSON.stringify(users, null, 2));
} catch(e) { console.log('portal_users error:', e.message); }

// Check lawyers
try {
  const lawyersList = db.prepare('SELECT id, name, email, position FROM lawyers').all();
  console.log('\nlawyers:', JSON.stringify(lawyersList, null, 2));
} catch(e) { console.log('lawyers error:', e.message); }
