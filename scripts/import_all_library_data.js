import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { importCsvData } from '../library-system/server/importCsvData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../library-system/server/data/library.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📖 Running CSV Data Import on:', dbPath);
const result = importCsvData(db);
console.log('Result:', result);

const summary = {
  books: db.prepare('SELECT count(*) as c FROM books').get().c,
  borrowers: db.prepare('SELECT count(*) as c FROM borrowers').get().c,
  activeLoans: db.prepare("SELECT count(*) as c FROM loans WHERE status = 'active'").get().c,
  overdueLoans: db.prepare("SELECT count(*) as c FROM loans WHERE status = 'overdue'").get().c,
  returnedLoans: db.prepare("SELECT count(*) as c FROM loans WHERE status = 'returned'").get().c,
  totalLoans: db.prepare('SELECT count(*) as c FROM loans').get().c
};
console.log('Current DB Counts:', summary);
