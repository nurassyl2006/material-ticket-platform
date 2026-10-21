import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import rawData from './raw_library_loans.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../library-system/server/data/library.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function cleanStr(s) {
  if (!s) return '';
  return s.trim().replace(/^["']|["']$/g, '').trim();
}

function parseDate(dStr, defaultYear = 2026) {
  if (!dStr) return null;
  let s = cleanStr(dStr).replace(/,/g, '.').replace(/\//g, '.').replace(/\s+/g, '');
  if (s.toLowerCase() === 'renewed') return null;

  // e.g. 20.10.2026 or 1.10.2026
  let match = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;

  // e.g. 08.10.26 or 08.1026
  match = s.match(/^(\d{1,2})\.(\d{1,2})\.?(\d{2})$/);
  if (match) return `20${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;

  // e.g. 05.10 or 29.09 or 009.10
  match = s.match(/^(\d{1,3})\.(\d{1,2})$/);
  if (match) {
    let dayNum = parseInt(match[1], 10);
    return `${defaultYear}-${String(parseInt(match[2], 10)).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  }

  // e.g. 10.8.2026
  match = s.match(/^10\.8\.2026$/);
  if (match) return '2026-10-08';

  return null;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function generateBarcode(title, isbn, index) {
  if (isbn && isbn.length >= 6) {
    const cleanIsbn = isbn.replace(/[^\dXx]/g, '');
    const shortIsbn = cleanIsbn.slice(-6);
    return `BK-${shortIsbn}`;
  }
  return `BK-${4000 + index}`;
}

function determineBookType(title) {
  const lower = title.toLowerCase();
  if (
    lower.includes('дәптер') ||
    lower.includes('әліппе') ||
    lower.includes('үйренеміз') ||
    lower.includes('dictionary') ||
    lower.includes('thesaurus') ||
    lower.includes('dic')
  ) {
    return 'Textbooks';
  }
  if (
    lower.includes('encyclopedia') ||
    lower.includes('animalium') ||
    lower.includes('above and below') ||
    lower.includes('wild animals') ||
    lower.includes('sea below my toes') ||
    lower.includes('шахматы') ||
    lower.includes('гравитации') ||
    lower.includes('ғарыш') ||
    lower.includes('кайзен') ||
    lower.includes('musical instruments')
  ) {
    return 'Nonfiction';
  }
  return 'Fiction';
}

function determineGenre(title, bookType) {
  const lower = title.toLowerCase();
  if (lower.includes('harry potter') || lower.includes('witches') || lower.includes('hobbit') || lower.includes('magic')) return 'Fantasy';
  if (lower.includes('iron man') || lower.includes('spider-man') || lower.includes('roblox')) return 'Comics & Sci-Fi';
  if (lower.includes('salah') || lower.includes('rashford') || lower.includes('football')) return 'Sports & Biography';
  if (lower.includes('ханзада') || lower.includes('қожа') || lower.includes('сүйекші') || lower.includes('гаухартас')) return 'Kazakh Literature';
  if (lower.includes('dictionary') || lower.includes('thesaurus') || lower.includes('дәптер')) return 'Language & Education';
  if (lower.includes('wild animals') || lower.includes('sea') || lower.includes('space') || lower.includes('ғарыш') || lower.includes('гравитаци')) return 'Science & Nature';
  return bookType === 'Fiction' ? "Children's Fiction" : 'General';
}

// 1. Parse CSV into records
let normalized = rawData.replace(/,FALSE,Student Name,Title/g, ',FALSE\nStudent Name,Title');
const lines = normalized.split(/\r?\n/);

let currentSection = 'staff';
let currentStaff = '';
let currentStudent = '';

const rawStaffLoans = [];
const rawStudentLoans = [];
const allKnownStudents = new Set();
const allKnownStaff = new Set();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const cols = parseCsvLine(line);

  if (line.includes('Staff Loans 2026-2027') || line.includes('Name,Book Title,ISBN')) {
    currentSection = 'staff';
    continue;
  }
  if (line.includes('Student Name,Title')) {
    currentSection = 'student';
    currentStudent = '';
    continue;
  }
  if (cols[0] === 'Ms. Price' || (cols[1] && cols[1] === 'The boy with the butterfly mind')) {
    currentSection = 'staff_ms_price';
    currentStaff = 'Ms. Price';
  }

  if (currentSection === 'staff') {
    let name = cleanStr(cols[1]);
    let title = cleanStr(cols[2]);
    let isbn = cleanStr(cols[3]);
    let qty = cleanStr(cols[4]);
    let loanDateStr = cleanStr(cols[5]);
    let dueDateStr = cleanStr(cols[6]);
    let returnedStr = cleanStr(cols[7]);
    let notes = cleanStr(cols[8] || '');

    if (name) {
      currentStaff = name;
      allKnownStaff.add(name);
    }
    if (!title) continue;

    let isReturned = returnedStr.toUpperCase() === 'TRUE';
    let parsedLoanDate = parseDate(loanDateStr) || '2026-10-05';
    let parsedDueDate = parseDate(dueDateStr);
    let parsedReturnDate = isReturned ? (parsedDueDate || parsedLoanDate) : null;

    rawStaffLoans.push({
      borrowerName: currentStaff,
      role: 'teacher',
      title,
      isbn,
      qty: parseInt(qty, 10) || 1,
      loanDate: parsedLoanDate,
      dueDate: parsedDueDate,
      returnDate: parsedReturnDate,
      isReturned,
      notes
    });
  } else if (currentSection === 'staff_ms_price') {
    let name = cleanStr(cols[0]);
    let title = cleanStr(cols[1]);
    let isbn = cleanStr(cols[2]);
    let qty = cleanStr(cols[3]);
    if (name) {
      currentStaff = name;
      allKnownStaff.add(name);
    }
    if (!title || title.includes('Title') || title.includes('15/10') || title.includes('08/10')) continue;

    let date = line.includes('15/10') ? '2026-10-15' : '2026-10-08';
    rawStaffLoans.push({
      borrowerName: currentStaff || 'Ms. Price',
      role: 'teacher',
      title,
      isbn,
      qty: parseInt(qty, 10) || 1,
      loanDate: date,
      dueDate: null,
      returnDate: null,
      isReturned: false,
      notes: qty && isNaN(parseInt(qty, 10)) ? qty : ''
    });
  } else if (currentSection === 'student') {
    let rawName = cleanStr(cols[0]);
    if (rawName && !rawName.includes('Student Name')) {
      currentStudent = rawName;
      allKnownStudents.add(rawName);
    }

    const slots = [
      { title: cleanStr(cols[1]), isbn: cleanStr(cols[2]), d1: cleanStr(cols[3]), d2: cleanStr(cols[4]) },
      { title: cleanStr(cols[6]), isbn: cleanStr(cols[7]), d1: cleanStr(cols[8]), d2: cleanStr(cols[9]) },
      { title: cleanStr(cols[11]), isbn: cleanStr(cols[12]), d1: cleanStr(cols[13]), d2: cleanStr(cols[14]) }
    ];

    for (const slot of slots) {
      if (!slot.title || slot.title.toLowerCase() === 'title') continue;

      let isRenewed = slot.d1.toLowerCase().includes('renewed') || slot.d2.toLowerCase().includes('renewed');
      let d1Date = parseDate(slot.d1);
      let d2Date = parseDate(slot.d2);

      let isReturned = false;
      let returnDate = null;
      let dueDate = null;
      let loanDate = d1Date || '2026-10-15';

      if (slot.d2.includes('10/8') || slot.d2.includes('10.8') || (slot.d1.includes('1/10') && slot.d2)) {
        isReturned = true;
        returnDate = parseDate(slot.d2) || '2026-10-08';
      } else {
        dueDate = d2Date;
      }

      rawStudentLoans.push({
        borrowerName: currentStudent,
        role: 'student',
        title: slot.title,
        isbn: slot.isbn,
        qty: 1,
        loanDate,
        dueDate,
        returnDate,
        isReturned,
        notes: isRenewed ? 'Renewed by student' : ''
      });
    }
  }
}

console.log(`Extracted: ${rawStaffLoans.length} staff loans, ${rawStudentLoans.length} student loans.`);
console.log(`Staff count: ${allKnownStaff.size}, Student count: ${allKnownStudents.size}`);

// Combine all loans
const allParsedLoans = [...rawStaffLoans, ...rawStudentLoans];

// Database operations inside a transaction
const runImport = db.transaction(() => {
  // Statements
  const findBorrowerByName = db.prepare('SELECT * FROM borrowers WHERE LOWER(name) = LOWER(?)');
  const insertBorrower = db.prepare(`
    INSERT INTO borrowers (id, name, role, class, email, phone, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `);

  const findBookByTitle = db.prepare('SELECT * FROM books WHERE LOWER(title) = LOWER(?)');
  const findBookByIsbn = db.prepare("SELECT * FROM books WHERE isbn = ? AND isbn != ''");
  const insertBook = db.prepare(`
    INSERT INTO books (barcode, isbn, title, author, genre, book_type, total_copies, available_copies, published_year, shelf_location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateBookCopies = db.prepare(`
    UPDATE books
    SET total_copies = ?, available_copies = ?
    WHERE barcode = ?
  `);

  const insertLoan = db.prepare(`
    INSERT INTO loans (id, book_barcode, borrower_id, loan_date, due_date, return_date, status, notes, renewed_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Ensure all Staff are in borrowers
  let nextStaffNum = 2010;
  for (const staffName of allKnownStaff) {
    let existing = findBorrowerByName.get(staffName);
    if (!existing) {
      const id = `TEA-${nextStaffNum++}`;
      const email = `${staffName.toLowerCase().replace(/[^a-z]/g, '.')}@ardingly.kz`;
      insertBorrower.run(id, staffName, 'teacher', 'Faculty / Staff', email, '', 'Teaching Faculty / Staff');
      console.log(`+ Added Staff Borrower: ${staffName} (${id})`);
    }
  }

  // 2. Ensure all Students are in borrowers
  let nextStuNum = 5001;
  for (const stuName of allKnownStudents) {
    let existing = findBorrowerByName.get(stuName);
    if (!existing) {
      const id = `STU-${nextStuNum++}`;
      const email = `${stuName.toLowerCase().replace(/[^a-z]/g, '.')}@student.ardingly.kz`;
      insertBorrower.run(id, stuName, 'student', 'Secondary / Primary School', email, '', 'Student Patron');
      console.log(`+ Added Student Borrower: ${stuName} (${id})`);
    }
  }

  // 3. Process Books
  // Count needed copies for each unique book
  const bookStats = new Map();

  for (const loan of allParsedLoans) {
    const key = cleanStr(loan.title);
    if (!bookStats.has(key)) {
      bookStats.set(key, {
        title: key,
        isbn: cleanStr(loan.isbn),
        totalNeeded: 0,
        activeNeeded: 0
      });
    }
    const stat = bookStats.get(key);
    if (!stat.isbn && loan.isbn) stat.isbn = cleanStr(loan.isbn);
    const qty = loan.qty || 1;
    stat.totalNeeded += qty;
    if (!loan.isReturned) {
      stat.activeNeeded += qty;
    }
  }

  let bookCounter = 1;
  const barcodeByTitle = new Map();

  for (const [title, stat] of bookStats.entries()) {
    let existing = findBookByTitle.get(title);
    if (!existing && stat.isbn) {
      existing = findBookByIsbn.get(stat.isbn);
    }

    const bType = determineBookType(title);
    const genre = determineGenre(title, bType);
    const totalCopies = Math.max(stat.totalNeeded + 2, stat.activeNeeded + 1);
    const availCopies = Math.max(0, totalCopies - stat.activeNeeded);

    if (existing) {
      barcodeByTitle.set(title, existing.barcode);
      // Update copies if needed
      const newTotal = Math.max(existing.total_copies, totalCopies);
      const newAvail = Math.max(0, newTotal - stat.activeNeeded);
      updateBookCopies.run(newTotal, newAvail, existing.barcode);
    } else {
      let barcode = generateBarcode(title, stat.isbn, bookCounter++);
      // Ensure barcode uniqueness
      let checkBarcode = db.prepare('SELECT barcode FROM books WHERE barcode = ?').get(barcode);
      let subIdx = 1;
      while (checkBarcode) {
        barcode = `${generateBarcode(title, stat.isbn, bookCounter++)}-${subIdx++}`;
        checkBarcode = db.prepare('SELECT barcode FROM books WHERE barcode = ?').get(barcode);
      }

      insertBook.run(
        barcode,
        stat.isbn || '',
        title,
        'Various Authors',
        genre,
        bType,
        totalCopies,
        availCopies,
        2022,
        `${bType === 'Fiction' ? 'Fiction' : bType === 'Textbooks' ? 'Textbooks' : 'Non-Fiction'} / Shelf`,
        `School library edition of "${title}"`
      );
      barcodeByTitle.set(title, barcode);
      console.log(`+ Added Book: ${title} [${barcode}] (Total: ${totalCopies}, Available: ${availCopies})`);
    }
  }

  // 4. Insert Loans
  let insertedLoanCount = 0;
  const today = '2026-10-21';

  for (const loan of allParsedLoans) {
    const borrower = findBorrowerByName.get(loan.borrowerName);
    if (!borrower) {
      console.warn(`Borrower not found for: ${loan.borrowerName}`);
      continue;
    }

    const barcode = barcodeByTitle.get(cleanStr(loan.title));
    if (!barcode) {
      console.warn(`Barcode not found for: ${loan.title}`);
      continue;
    }

    // Determine due date
    let dueDate = loan.dueDate;
    if (!dueDate) {
      // 14 days for student, 28 days for teacher
      const d = new Date(loan.loanDate);
      d.setDate(d.getDate() + (loan.role === 'teacher' ? 28 : 14));
      dueDate = d.toISOString().split('T')[0];
    }

    // Determine status
    let status = 'active';
    if (loan.isReturned) {
      status = 'returned';
    } else if (dueDate < today) {
      status = 'overdue';
    }

    // Build loan ID
    const loanId = `LN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    let notes = loan.notes || '';
    if (loan.qty > 1) {
      notes = `Class/Group set: ${loan.qty} copies. ${notes}`.trim();
    }

    insertLoan.run(
      loanId,
      barcode,
      borrower.id,
      loan.loanDate,
      dueDate,
      loan.returnDate,
      status,
      notes,
      loan.notes && loan.notes.includes('Renewed') ? 1 : 0
    );
    insertedLoanCount++;
  }

  console.log(`🎉 Successfully imported ${insertedLoanCount} loans into library system!`);
});

runImport();

const finalCounts = {
  books: db.prepare('SELECT count(*) as c FROM books').get().c,
  borrowers: db.prepare('SELECT count(*) as c FROM borrowers').get().c,
  activeLoans: db.prepare('SELECT count(*) as c FROM loans WHERE status = "active"').get().c,
  overdueLoans: db.prepare('SELECT count(*) as c FROM loans WHERE status = "overdue"').get().c,
  returnedLoans: db.prepare('SELECT count(*) as c FROM loans WHERE status = "returned"').get().c,
  totalLoans: db.prepare('SELECT count(*) as c FROM loans').get().c
};

console.log('Database Summary after import:', finalCounts);
