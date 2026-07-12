const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/vritti.db');
const db = new Database(DB_PATH);

// Performance + correctness pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// Run migration
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'migrations/001_init.sql'),
  'utf-8'
);
db.exec(migrationSQL);

console.log('✓ Database initialized at', DB_PATH);

module.exports = db;
