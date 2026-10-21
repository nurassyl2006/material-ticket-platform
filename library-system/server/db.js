import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { importCsvData } from './importCsvData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath = path.resolve(dataDir, 'library.db');
const db = new Database(dbPath);

// Enable WAL mode & foreign keys for high performance & integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Initialize database schema
export function initSchema() {
  db.exec(`
    -- 1. Books Table
    CREATE TABLE IF NOT EXISTS books (
      barcode TEXT PRIMARY KEY,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      genre TEXT DEFAULT '',
      book_type TEXT NOT NULL CHECK (book_type IN ('Fiction', 'Nonfiction', 'Textbooks')),
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      cover_url TEXT DEFAULT '',
      published_year INTEGER,
      shelf_location TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_books_type ON books(book_type);
    CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);

    -- 2. Borrowers Table
    CREATE TABLE IF NOT EXISTS borrowers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'staff')),
      class TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_borrowers_name ON borrowers(name);
    CREATE INDEX IF NOT EXISTS idx_borrowers_role ON borrowers(role);
    CREATE INDEX IF NOT EXISTS idx_borrowers_class ON borrowers(class);

    -- 3. Loans Table
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      book_barcode TEXT NOT NULL,
      borrower_id TEXT NOT NULL,
      loan_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT DEFAULT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
      notes TEXT DEFAULT '',
      renewed_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (book_barcode) REFERENCES books(barcode) ON DELETE RESTRICT,
      FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_barcode);
    CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);

    -- 4. Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- 5. Users Table (Librarian & Admin Authentication)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'librarian' CHECK (role IN ('admin', 'librarian')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    -- 6. Sessions Table (Auth Tokens)
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  // Default Loan Settings
  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('fiction_loan_days', '14');
  insertSetting.run('nonfiction_loan_days', '21');
  insertSetting.run('textbooks_loan_days', '120');
  insertSetting.run('library_name', 'Ardingly Central Library');
  insertSetting.run('max_loans_student', '3');
  insertSetting.run('max_loans_teacher', '10');
  insertSetting.run('max_loans_staff', '5');
}

// Password hashing & verification
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  try {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Generate human-friendly random Loan ID (e.g. LN-8B39FA)
export function generateLoanId() {
  const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LN-${hex}`;
}

// Seed initial realistic data if DB is empty
export function seedInitialData() {
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
  if (bookCount > 0) return;

  console.log('🌱 Seeding initial library books, borrowers, and sample loans...');

  const insertBook = db.prepare(`
    INSERT INTO books (barcode, isbn, title, author, genre, book_type, total_copies, available_copies, published_year, shelf_location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialBooks = [
    // Fiction
    ['BK-1001', '978-0439708180', 'Harry Potter and the Sorcerer\'s Stone', 'J.K. Rowling', 'Fantasy', 'Fiction', 3, 2, 1997, 'Rowling / A-12', 'A young wizard discovers his magical heritage at Hogwarts School.'],
    ['BK-1002', '978-0451524935', '1984', 'George Orwell', 'Dystopian', 'Fiction', 2, 1, 1949, 'Orwell / B-04', 'A chilling prophecy about the future and totalitarian rule.'],
    ['BK-1003', '978-0061120084', 'To Kill a Mockingbird', 'Harper Lee', 'Classic', 'Fiction', 2, 2, 1960, 'Lee / A-08', 'A compassionate, dramatic exploration of justice and racial inequality.'],
    ['BK-1004', '978-0743273565', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Classic', 'Fiction', 3, 3, 1925, 'Fitzgerald / A-05', 'A story of obsession, wealth, and the elusive American Dream.'],
    ['BK-1005', '978-0547928227', 'The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 'Fiction', 2, 1, 1937, 'Tolkien / A-14', 'Bilbo Baggins embarks on an unexpected journey across Middle-earth.'],

    // Nonfiction
    ['BK-2001', '978-0062316097', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'History & Anthropology', 'Nonfiction', 2, 1, 2015, 'Non-Fiction / C-01', 'Explores how an insignificant ape became the ruler of planet Earth.'],
    ['BK-2002', '978-0385534246', 'Atomic Habits', 'James Clear', 'Self-Development', 'Nonfiction', 3, 2, 2018, 'Non-Fiction / C-05', 'Tiny changes leading to remarkable results and healthy daily habits.'],
    ['BK-2003', '978-0393609394', 'Astrophysics for People in a Hurry', 'Neil deGrasse Tyson', 'Science', 'Nonfiction', 2, 2, 2017, 'Science / D-02', 'Essential universe concepts distilled into quick, mind-expanding chapters.'],
    ['BK-2004', '978-0307476463', 'The Immortal Life of Henrietta Lacks', 'Rebecca Skloot', 'Science & Bioethics', 'Nonfiction', 1, 1, 2010, 'Science / D-06', 'The story of HeLa cells and their impact on medicine and human lives.'],

    // Textbooks
    ['BK-3001', '978-0134093413', 'Campbell Biology (11th Edition)', 'Lisa A. Urry et al.', 'Biology', 'Textbooks', 5, 4, 2016, 'Textbooks / Science-01', 'Comprehensive biology curriculum for high school and university prep.'],
    ['BK-3002', '978-1285740621', 'Calculus: Early Transcendentals (8th Ed)', 'James Stewart', 'Mathematics', 'Textbooks', 6, 4, 2015, 'Textbooks / Math-03', 'Standard calculus textbook for advanced mathematics and sciences.'],
    ['BK-3003', '978-1305957404', 'Physics for Scientists and Engineers', 'Raymond A. Serway', 'Physics', 'Textbooks', 4, 3, 2018, 'Textbooks / Science-04', 'Core physics concepts, Newtonian mechanics, and electromagnetic theory.'],
    ['BK-3004', '978-0134444581', 'Introduction to Algorithms (4th Edition)', 'Thomas H. Cormen', 'Computer Science', 'Textbooks', 3, 2, 2022, 'Textbooks / CS-02', 'The authoritative reference work for algorithms and computer science fundamentals.']
  ];

  for (const b of initialBooks) {
    insertBook.run(...b);
  }

  // Insert initial borrowers (Students, Teachers, Staff)
  const insertBorrower = db.prepare(`
    INSERT INTO borrowers (id, name, role, class, email, phone, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialBorrowers = [
    ['STU-1001', 'Amina Omarova', 'student', 'Grade 10A', 'amina.o@ardingly.kz', '+7 701 555 1001', 'active', 'Avid fiction reader, library prefect'],
    ['STU-1002', 'Daniyar Sadykov', 'student', 'Grade 11B', 'daniyar.s@ardingly.kz', '+7 702 555 1002', 'active', 'Physics Olympiad team'],
    ['STU-1003', 'Sofia Chen', 'student', 'Grade 9C', 'sofia.c@ardingly.kz', '+7 705 555 1003', 'active', ''],
    ['STU-1004', 'Maxim Ivanov', 'student', 'Grade 12A', 'maxim.i@ardingly.kz', '+7 707 555 1004', 'active', 'Graduating senior'],
    ['TEA-2001', 'Mr. Robert Campbell', 'teacher', 'Science Faculty', 'r.campbell@ardingly.kz', '+7 700 555 2001', 'active', 'Head of Science Department'],
    ['TEA-2002', 'Ms. Laura Davis', 'teacher', 'English Literature', 'l.davis@ardingly.kz', '+7 700 555 2002', 'active', 'Literature and creative writing'],
    ['STF-3001', 'Sarah Jenkins', 'staff', 'Administration', 's.jenkins@ardingly.kz', '+7 700 555 3001', 'active', 'Academic coordinator']
  ];

  for (const b of initialBorrowers) {
    insertBorrower.run(...b);
  }

  // Seed sample loans (1 active Fiction, 1 active Nonfiction, 1 active Textbook, 1 overdue loan, 1 returned loan)
  const insertLoan = db.prepare(`
    INSERT INTO loans (id, book_barcode, borrower_id, loan_date, due_date, return_date, status, notes, renewed_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const dateSubDays = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return formatDate(d);
  };

  const dateAddDays = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };

  // 1. Active Fiction loan (due in 10 days)
  insertLoan.run(
    'LN-F10492',
    'BK-1001',
    'STU-1001',
    dateSubDays(4),
    dateAddDays(10),
    null,
    'active',
    'Standard 14-day checkout for student',
    0
  );

  // 2. Active Nonfiction loan (due in 16 days)
  insertLoan.run(
    'LN-N20831',
    'BK-2001',
    'TEA-2002',
    dateSubDays(5),
    dateAddDays(16),
    null,
    'active',
    'Curriculum prep reading',
    0
  );

  // 3. Active Textbook loan (due in 110 days)
  insertLoan.run(
    'LN-T30948',
    'BK-3001',
    'STU-1002',
    dateSubDays(10),
    dateAddDays(110),
    null,
    'active',
    'Semester textbook loan',
    0
  );

  // 4. Overdue loan (borrowed 25 days ago, due 11 days ago)
  insertLoan.run(
    'LN-O40192',
    'BK-1002',
    'STU-1003',
    dateSubDays(25),
    dateSubDays(11),
    null,
    'overdue',
    'Reminder email sent to student',
    0
  );

  // 5. Returned loan
  insertLoan.run(
    'LN-R50284',
    'BK-1005',
    'TEA-2001',
    dateSubDays(30),
    dateSubDays(16),
    dateSubDays(18),
    'returned',
    'Returned in pristine condition',
    0
  );

  // 6. Active CS textbook loan
  insertLoan.run(
    'LN-T60381',
    'BK-3004',
    'STU-1004',
    dateSubDays(15),
    dateAddDays(105),
    null,
    'active',
    'Final year algorithms coursework',
    0
  );

  // 7. Active Calculus textbook loan
  insertLoan.run(
    'LN-T70211',
    'BK-3002',
    'STU-1002',
    dateSubDays(12),
    dateAddDays(108),
    null,
    'active',
    'Calculus prep',
    0
  );

  // 8. Active Atomic Habits
  insertLoan.run(
    'LN-N80412',
    'BK-2002',
    'STF-3001',
    dateSubDays(3),
    dateAddDays(18),
    null,
    'active',
    'Staff professional development',
    0
  );

  console.log('✅ Initial library seed data loaded successfully!');
}

// Seed authorized admin & librarian users (nurassyl & librarian)
export function seedInitialUsers() {
  initSchema();

  console.log('👤 Ensuring authorized library accounts (nurassyl & librarian)...');
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, salt, full_name, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 1. Ensure 'nurassyl' account (Administrator)
  const existingNurassyl = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get('nurassyl');
  if (!existingNurassyl) {
    const nurAuth = hashPassword('nurassyl2026');
    insertUser.run('USR-NURASSYL', 'nurassyl', nurAuth.hash, nurAuth.salt, 'Nurassyl (Administrator)', 'admin');
    console.log('✅ Created administrator account: nurassyl');
  }

  // 2. Ensure 'librarian' account
  const existingLibrarian = db.prepare('SELECT id, password_hash, salt FROM users WHERE LOWER(username) = LOWER(?)').get('librarian');
  if (!existingLibrarian) {
    const libAuth = hashPassword('library2026');
    insertUser.run('USR-LIB01', 'librarian', libAuth.hash, libAuth.salt, 'Head Librarian', 'librarian');
    console.log('✅ Created librarian account: librarian');
  } else {
    // If librarian still had old default password 'library123', upgrade it to 'library2026'
    if (verifyPassword('library123', existingLibrarian.password_hash, existingLibrarian.salt)) {
      const libAuth = hashPassword('library2026');
      db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(libAuth.hash, libAuth.salt, existingLibrarian.id);
      console.log('🔒 Upgraded librarian password to secure password');
    }
  }

  // 3. Remove old generic 'admin' account and revoke its sessions
  const oldAdmin = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get('admin');
  if (oldAdmin) {
    db.prepare('DELETE FROM users WHERE id = ?').run(oldAdmin.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(oldAdmin.id);
    console.log('🔒 Removed legacy generic admin account');
  }
}

// Ensure CSV staff & student circulation loans and book catalog are seeded
export function seedCsvDataIfNeeded() {
  try {
    const loanCount = db.prepare('SELECT COUNT(*) as count FROM loans').get().count;
    if (loanCount < 50) {
      console.log(`📚 Current loan count (${loanCount}) is under 50. Auto-importing full CSV catalog...`);
      importCsvData(db);
    }
  } catch (err) {
    console.error('⚠️ Could not check/seed CSV loans:', err.message);
  }
}

// Auto-run schema & seed
initSchema();
seedInitialData();
seedCsvDataIfNeeded();
seedInitialUsers();

export default db;
