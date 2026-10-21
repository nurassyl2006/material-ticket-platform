import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db, { generateLoanId, hashPassword, verifyPassword } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.LIBRARY_PORT || 5002;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: sync overdue status for active loans whose due_date < current date
function syncOverdueLoans() {
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    UPDATE loans
    SET status = 'overdue'
    WHERE status = 'active' AND due_date < ?
  `).run(today);
}

// Clean up expired sessions periodically
function cleanExpiredSessions() {
  try {
    db.prepare(`DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')`).run();
  } catch (e) {
    // ignore
  }
}
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
  }

  const session = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.username, u.full_name, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
  `).get(token);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
  }

  req.user = {
    id: session.id,
    username: session.username,
    full_name: session.full_name,
    role: session.role
  };
  req.token = token;
  next();
}

// Helper: calculate due date based on book_type and settings
function calculateDefaultDueDate(bookType) {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const s of settingsRows) settings[s.key] = s.value;

  let days = 14;
  if (bookType === 'Fiction') {
    days = parseInt(settings.fiction_loan_days, 10) || 14;
  } else if (bookType === 'Nonfiction') {
    days = parseInt(settings.nonfiction_loan_days, 10) || 21;
  } else if (bookType === 'Textbooks') {
    days = parseInt(settings.textbooks_loan_days, 10) || 120;
  }

  const d = new Date();
  d.setDate(d.getDate() + days);
  return {
    days,
    dueDate: d.toISOString().split('T')[0]
  };
}

// ==========================================
// 0. AUTHENTICATION API
// ==========================================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // Generate random 64-character token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days

    db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(token, user.id, expiresAt);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = verifyPassword(currentPassword, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Protect all remaining /api endpoints
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/login') || req.path === '/health') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ==========================================
// 0.1 USER MANAGEMENT API (Admin only)
// ==========================================
app.get('/api/users', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Administrator access required' });
    }
    const rows = db.prepare('SELECT id, username, full_name, role, created_at FROM users ORDER BY role ASC, username ASC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Administrator access required' });
    }
    const { username, password, full_name, role = 'librarian' } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    const { hash, salt } = hashPassword(password);
    const id = `USR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare(`
      INSERT INTO users (id, username, password_hash, salt, full_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, username.trim(), hash, salt, full_name || username.trim(), role);

    res.json({
      success: true,
      data: { id, username: username.trim(), full_name: full_name || username.trim(), role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/users/:id/password', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Administrator access required' });
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long' });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);

    // Invalidate existing sessions for this user so they must log in with new password
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

    res.json({ success: true, message: `Password for ${user.username} updated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Administrator access required' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own administrator account' });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);

    res.json({ success: true, message: `User ${user.username} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 1. DASHBOARD & STATS
// ==========================================
app.get('/api/stats', (req, res) => {
  try {
    syncOverdueLoans();

    const booksSummary = db.prepare(`
      SELECT 
        COUNT(*) as totalTitles,
        COALESCE(SUM(total_copies), 0) as totalCopies,
        COALESCE(SUM(available_copies), 0) as availableCopies,
        COALESCE(SUM(total_copies - available_copies), 0) as loanedCopies
      FROM books
    `).get();

    const booksByType = db.prepare(`
      SELECT book_type, COUNT(*) as count, SUM(total_copies) as copies
      FROM books
      GROUP BY book_type
    `).all();

    const borrowersSummary = db.prepare(`
      SELECT 
        COUNT(*) as totalBorrowers,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers,
        SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff
      FROM borrowers
      WHERE status = 'active'
    `).get();

    const loansSummary = db.prepare(`
      SELECT 
        COUNT(*) as totalLoans,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeLoans,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdueLoans,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returnedLoans
      FROM loans
    `).get();

    const recentActivity = db.prepare(`
      SELECT 
        l.id, l.loan_date, l.due_date, l.return_date, l.status,
        b.barcode as bookBarcode, b.title as bookTitle, b.book_type as bookType,
        br.id as borrowerId, br.name as borrowerName, br.role as borrowerRole, br.class as borrowerClass
      FROM loans l
      JOIN books b ON l.book_barcode = b.barcode
      JOIN borrowers br ON l.borrower_id = br.id
      ORDER BY l.created_at DESC
      LIMIT 8
    `).all();

    res.json({
      success: true,
      data: {
        books: booksSummary,
        booksByType,
        borrowers: borrowersSummary,
        loans: loansSummary,
        recentActivity
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. BOOKS API
// ==========================================
app.get('/api/books', (req, res) => {
  try {
    const { search, book_type, genre, available_only } = req.query;
    let query = `
      SELECT b.*, 
        (SELECT COUNT(*) FROM loans l WHERE l.book_barcode = b.barcode AND l.status IN ('active', 'overdue')) as activeLoansCount
      FROM books b
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.barcode LIKE ? OR b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (book_type && book_type !== 'All') {
      query += ` AND b.book_type = ?`;
      params.push(book_type);
    }

    if (genre && genre !== 'All') {
      query += ` AND b.genre = ?`;
      params.push(genre);
    }

    if (available_only === 'true' || available_only === '1') {
      query += ` AND b.available_copies > 0`;
    }

    query += ` ORDER BY b.title ASC`;

    const books = db.prepare(query).all(...params);
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/books/:barcode', (req, res) => {
  try {
    const book = db.prepare(`SELECT * FROM books WHERE barcode = ?`).get(req.params.barcode);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });

    const activeLoans = db.prepare(`
      SELECT l.*, br.name as borrowerName, br.role as borrowerRole, br.class as borrowerClass
      FROM loans l
      JOIN borrowers br ON l.borrower_id = br.id
      WHERE l.book_barcode = ? AND l.status IN ('active', 'overdue')
      ORDER BY l.due_date ASC
    `).all(req.params.barcode);

    res.json({ success: true, data: { ...book, activeLoans } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/books', (req, res) => {
  try {
    const {
      barcode, isbn, title, author, genre, book_type,
      total_copies, published_year, shelf_location, description, cover_url
    } = req.body;

    if (!barcode || !title || !author || !book_type) {
      return res.status(400).json({ success: false, error: 'Barcode, title, author, and book type are required' });
    }

    if (!['Fiction', 'Nonfiction', 'Textbooks'].includes(book_type)) {
      return res.status(400).json({ success: false, error: 'Invalid book type. Must be Fiction, Nonfiction, or Textbooks' });
    }

    const copies = parseInt(total_copies, 10) || 1;

    const stmt = db.prepare(`
      INSERT INTO books (barcode, isbn, title, author, genre, book_type, total_copies, available_copies, published_year, shelf_location, description, cover_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      barcode.trim().toUpperCase(),
      isbn ? isbn.trim() : '',
      title.trim(),
      author.trim(),
      genre ? genre.trim() : '',
      book_type,
      copies,
      copies,
      published_year ? parseInt(published_year, 10) : null,
      shelf_location ? shelf_location.trim() : '',
      description ? description.trim() : '',
      cover_url ? cover_url.trim() : ''
    );

    const created = db.prepare('SELECT * FROM books WHERE barcode = ?').get(barcode.trim().toUpperCase());
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'A book with this barcode already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/books/:barcode', (req, res) => {
  try {
    const { barcode } = req.params;
    const {
      isbn, title, author, genre, book_type,
      total_copies, published_year, shelf_location, description, cover_url
    } = req.body;

    const existing = db.prepare('SELECT * FROM books WHERE barcode = ?').get(barcode);
    if (!existing) return res.status(404).json({ success: false, error: 'Book not found' });

    const newTotal = parseInt(total_copies, 10) || existing.total_copies;
    const loanedOut = existing.total_copies - existing.available_copies;
    const newAvailable = Math.max(0, newTotal - loanedOut);

    db.prepare(`
      UPDATE books
      SET isbn = ?, title = ?, author = ?, genre = ?, book_type = ?,
          total_copies = ?, available_copies = ?, published_year = ?,
          shelf_location = ?, description = ?, cover_url = ?
      WHERE barcode = ?
    `).run(
      isbn !== undefined ? isbn : existing.isbn,
      title || existing.title,
      author || existing.author,
      genre !== undefined ? genre : existing.genre,
      book_type || existing.book_type,
      newTotal,
      newAvailable,
      published_year !== undefined ? published_year : existing.published_year,
      shelf_location !== undefined ? shelf_location : existing.shelf_location,
      description !== undefined ? description : existing.description,
      cover_url !== undefined ? cover_url : existing.cover_url,
      barcode
    );

    const updated = db.prepare('SELECT * FROM books WHERE barcode = ?').get(barcode);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/books/:barcode', (req, res) => {
  try {
    const { barcode } = req.params;
    const activeLoan = db.prepare(`
      SELECT id FROM loans WHERE book_barcode = ? AND status IN ('active', 'overdue')
    `).get(barcode);

    if (activeLoan) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete book. It is currently checked out on loan ${activeLoan.id}. Please return it first.`
      });
    }

    db.prepare('DELETE FROM loans WHERE book_barcode = ?').run(barcode);
    const result = db.prepare('DELETE FROM books WHERE barcode = ?').run(barcode);

    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Book not found' });
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. BORROWERS API
// ==========================================
app.get('/api/borrowers', (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = `
      SELECT br.*,
        (SELECT COUNT(*) FROM loans l WHERE l.borrower_id = br.id AND l.status IN ('active', 'overdue')) as activeLoansCount,
        (SELECT COUNT(*) FROM loans l WHERE l.borrower_id = br.id AND l.status = 'overdue') as overdueLoansCount
      FROM borrowers br
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (br.id LIKE ? OR br.name LIKE ? OR br.class LIKE ? OR br.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (role && role !== 'All') {
      query += ` AND br.role = ?`;
      params.push(role);
    }

    if (status && status !== 'All') {
      query += ` AND br.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY br.name ASC`;
    const borrowers = db.prepare(query).all(...params);
    res.json({ success: true, data: borrowers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/borrowers/:id', (req, res) => {
  try {
    syncOverdueLoans();

    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(req.params.id);
    if (!borrower) return res.status(404).json({ success: false, error: 'Borrower not found' });

    const loans = db.prepare(`
      SELECT l.*, b.title as bookTitle, b.author as bookAuthor, b.book_type as bookType, b.genre as bookGenre
      FROM loans l
      JOIN books b ON l.book_barcode = b.barcode
      WHERE l.borrower_id = ?
      ORDER BY 
        CASE WHEN l.status = 'overdue' THEN 1 WHEN l.status = 'active' THEN 2 ELSE 3 END,
        l.due_date ASC,
        l.created_at DESC
    `).all(req.params.id);

    const activeLoans = loans.filter(l => l.status === 'active');
    const overdueLoans = loans.filter(l => l.status === 'overdue');
    const returnedLoans = loans.filter(l => l.status === 'returned');

    res.json({ 
      success: true, 
      data: { 
        ...borrower, 
        loans,
        activeLoans,
        overdueLoans,
        returnedLoans,
        activeLoansCount: activeLoans.length + overdueLoans.length,
        overdueLoansCount: overdueLoans.length,
        returnedLoansCount: returnedLoans.length,
        totalLoansCount: loans.length
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/borrowers', (req, res) => {
  try {
    const { id, name, role, class: className, email, phone, status, notes } = req.body;

    if (!id || !name || !role) {
      return res.status(400).json({ success: false, error: 'ID, name, and role are required' });
    }

    if (!['student', 'teacher', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be student, teacher, or staff' });
    }

    const stmt = db.prepare(`
      INSERT INTO borrowers (id, name, role, class, email, phone, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id.trim().toUpperCase(),
      name.trim(),
      role,
      className ? className.trim() : '',
      email ? email.trim() : '',
      phone ? phone.trim() : '',
      status || 'active',
      notes ? notes.trim() : ''
    );

    const created = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(id.trim().toUpperCase());
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, error: 'A borrower with this ID already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/borrowers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, class: className, email, phone, status, notes } = req.body;

    const existing = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Borrower not found' });

    db.prepare(`
      UPDATE borrowers
      SET name = ?, role = ?, class = ?, email = ?, phone = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      role || existing.role,
      className !== undefined ? className : existing.class,
      email !== undefined ? email : existing.email,
      phone !== undefined ? phone : existing.phone,
      status || existing.status,
      notes !== undefined ? notes : existing.notes,
      id
    );

    const updated = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/borrowers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const activeLoan = db.prepare(`
      SELECT id FROM loans WHERE borrower_id = ? AND status IN ('active', 'overdue')
    `).get(id);

    if (activeLoan) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete borrower. They currently have active loan ${activeLoan.id}. Please return books first.`
      });
    }

    db.prepare('DELETE FROM loans WHERE borrower_id = ?').run(id);
    const result = db.prepare('DELETE FROM borrowers WHERE id = ?').run(id);

    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Borrower not found' });
    res.json({ success: true, message: 'Borrower deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. LOANS & CIRCULATION API
// ==========================================
app.get('/api/loans', (req, res) => {
  try {
    syncOverdueLoans();

    const { status, search, borrower_id, book_barcode } = req.query;
    let query = `
      SELECT 
        l.*,
        b.title as bookTitle, b.author as bookAuthor, b.book_type as bookType, b.genre as bookGenre, b.cover_url as bookCover,
        br.name as borrowerName, br.role as borrowerRole, br.class as borrowerClass, br.email as borrowerEmail
      FROM loans l
      JOIN books b ON l.book_barcode = b.barcode
      JOIN borrowers br ON l.borrower_id = br.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (borrower_id) {
      query += ` AND l.borrower_id = ?`;
      params.push(borrower_id);
    }

    if (book_barcode) {
      query += ` AND l.book_barcode = ?`;
      params.push(book_barcode);
    }

    if (search) {
      query += ` AND (l.id LIKE ? OR b.title LIKE ? OR b.barcode LIKE ? OR br.name LIKE ? OR br.id LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY 
      CASE WHEN l.status = 'overdue' THEN 1 WHEN l.status = 'active' THEN 2 ELSE 3 END,
      l.due_date ASC,
      l.created_at DESC
    `;

    const loans = db.prepare(query).all(...params);
    res.json({ success: true, data: loans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Calculate due date preview for a book
app.get('/api/loans/calculate-due-date', (req, res) => {
  try {
    const { barcode } = req.query;
    if (!barcode) return res.status(400).json({ success: false, error: 'Book barcode required' });

    const book = db.prepare('SELECT barcode, title, book_type FROM books WHERE barcode = ?').get(barcode);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });

    const calculation = calculateDefaultDueDate(book.book_type);
    res.json({
      success: true,
      data: {
        barcode: book.barcode,
        title: book.title,
        book_type: book.book_type,
        ...calculation
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Issue a new loan (Librarian can supply custom due_date, or it auto-computes by book_type)
app.post('/api/loans', (req, res) => {
  try {
    const { book_barcode, borrower_id, due_date: customDueDate, notes } = req.body;

    if (!book_barcode || !borrower_id) {
      return res.status(400).json({ success: false, error: 'Book barcode and borrower ID are required' });
    }

    // 1. Verify borrower
    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(borrower_id.trim().toUpperCase());
    if (!borrower) {
      return res.status(404).json({ success: false, error: `Borrower with ID "${borrower_id}" not found` });
    }
    if (borrower.status !== 'active') {
      return res.status(400).json({ success: false, error: `Borrower is ${borrower.status}. Cannot issue new loans.` });
    }

    // 2. Verify book
    const book = db.prepare('SELECT * FROM books WHERE barcode = ?').get(book_barcode.trim().toUpperCase());
    if (!book) {
      return res.status(404).json({ success: false, error: `Book with barcode "${book_barcode}" not found` });
    }
    if (book.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        error: `All copies of "${book.title}" are currently checked out. (Available: 0 / Total: ${book.total_copies})`
      });
    }

    // 3. Determine loan & due dates
    const today = new Date().toISOString().split('T')[0];
    let finalDueDate = customDueDate ? customDueDate.trim() : null;

    if (!finalDueDate) {
      // Auto-calculated according to books.book_type
      const calc = calculateDefaultDueDate(book.book_type);
      finalDueDate = calc.dueDate;
    }

    // 4. Generate random Loan ID
    const loanId = generateLoanId();

    // 5. Transaction: create loan & decrement available copies
    const issueTransaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO loans (id, book_barcode, borrower_id, loan_date, due_date, status, notes)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `).run(
        loanId,
        book.barcode,
        borrower.id,
        today,
        finalDueDate,
        notes ? notes.trim() : ''
      );

      db.prepare(`
        UPDATE books
        SET available_copies = available_copies - 1
        WHERE barcode = ?
      `).run(book.barcode);
    });

    issueTransaction();

    // Fetch full loan details for response
    const createdLoan = db.prepare(`
      SELECT 
        l.*,
        b.title as bookTitle, b.author as bookAuthor, b.book_type as bookType, b.genre as bookGenre,
        br.name as borrowerName, br.role as borrowerRole, br.class as borrowerClass
      FROM loans l
      JOIN books b ON l.book_barcode = b.barcode
      JOIN borrowers br ON l.borrower_id = br.id
      WHERE l.id = ?
    `).get(loanId);

    res.status(201).json({
      success: true,
      message: `Loan ${loanId} issued successfully! Due on ${finalDueDate}.`,
      data: createdLoan
    });
  } catch (err) {
    console.error('Issue loan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Return a loan
app.post('/api/loans/:id/return', (req, res) => {
  try {
    const { id } = req.params;
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);

    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    if (loan.status === 'returned') {
      return res.status(400).json({ success: false, error: 'This book has already been returned' });
    }

    const today = new Date().toISOString().split('T')[0];

    const returnTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE loans
        SET return_date = ?, status = 'returned'
        WHERE id = ?
      `).run(today, id);

      db.prepare(`
        UPDATE books
        SET available_copies = available_copies + 1
        WHERE barcode = ?
      `).run(loan.book_barcode);
    });

    returnTransaction();

    const updated = db.prepare(`
      SELECT l.*, b.title as bookTitle, br.name as borrowerName
      FROM loans l
      JOIN books b ON l.book_barcode = b.barcode
      JOIN borrowers br ON l.borrower_id = br.id
      WHERE l.id = ?
    `).get(id);

    res.json({
      success: true,
      message: `Book "${updated.bookTitle}" returned successfully!`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Librarian Due Date Modifier & Notes update
app.put('/api/loans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { due_date, notes } = req.body;

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

    if (!due_date) {
      return res.status(400).json({ success: false, error: 'Due date is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const newStatus = loan.status === 'returned' ? 'returned' : (due_date < today ? 'overdue' : 'active');

    db.prepare(`
      UPDATE loans
      SET due_date = ?, notes = ?, status = ?
      WHERE id = ?
    `).run(
      due_date.trim(),
      notes !== undefined ? notes.trim() : loan.notes,
      newStatus,
      id
    );

    const updated = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
    res.json({
      success: true,
      message: `Due date updated to ${due_date}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Renew loan (add standard book_type duration from current due date)
app.post('/api/loans/:id/renew', (req, res) => {
  try {
    const { id } = req.params;
    const loan = db.prepare(`
      SELECT l.*, b.book_type
      FROM loans l
      JOIN books b ON l.book_barcode = b.barcode
      WHERE l.id = ?
    `).get(id);

    if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });
    if (loan.status === 'returned') {
      return res.status(400).json({ success: false, error: 'Cannot renew a returned loan' });
    }

    const defaultCalc = calculateDefaultDueDate(loan.book_type);
    const baseDate = new Date(loan.due_date > new Date().toISOString().split('T')[0] ? loan.due_date : new Date());
    baseDate.setDate(baseDate.getDate() + defaultCalc.days);
    const newDueDate = baseDate.toISOString().split('T')[0];

    db.prepare(`
      UPDATE loans
      SET due_date = ?, renewed_count = renewed_count + 1, status = 'active'
      WHERE id = ?
    `).run(newDueDate, id);

    const updated = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
    res.json({
      success: true,
      message: `Loan renewed for ${defaultCalc.days} days! New due date: ${newDueDate}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. UNIFIED BARCODE / SCANNER LOOKUP
// ==========================================
app.get('/api/lookup/:code', (req, res) => {
  try {
    syncOverdueLoans();
    const raw = req.params.code.trim().toUpperCase();

    // Check if book barcode or ISBN
    const book = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM loans l WHERE l.book_barcode = b.barcode AND l.status IN ('active', 'overdue')) as activeLoansCount
      FROM books b
      WHERE b.barcode = ? OR b.isbn = ?
    `).get(raw, raw);

    if (book) {
      // Also get default loan calculation for instant desk action
      const dueCalc = calculateDefaultDueDate(book.book_type);
      return res.json({
        success: true,
        type: 'book',
        data: { ...book, defaultDueDate: dueCalc.dueDate, defaultLoanDays: dueCalc.days }
      });
    }

    // Check if borrower ID
    const borrower = db.prepare(`
      SELECT br.*,
        (SELECT COUNT(*) FROM loans l WHERE l.borrower_id = br.id AND l.status IN ('active', 'overdue')) as activeLoansCount,
        (SELECT COUNT(*) FROM loans l WHERE l.borrower_id = br.id AND l.status = 'overdue') as overdueLoansCount
      FROM borrowers br
      WHERE br.id = ?
    `).get(raw);

    if (borrower) {
      const allLoans = db.prepare(`
        SELECT l.*, b.title as bookTitle, b.book_type as bookType, b.barcode as bookBarcode, b.author as bookAuthor
        FROM loans l
        JOIN books b ON l.book_barcode = b.barcode
        WHERE l.borrower_id = ?
        ORDER BY 
          CASE WHEN l.status = 'overdue' THEN 1 WHEN l.status = 'active' THEN 2 ELSE 3 END,
          l.due_date ASC,
          l.created_at DESC
      `).all(borrower.id);

      const activeLoans = allLoans.filter(l => l.status === 'active');
      const overdueLoans = allLoans.filter(l => l.status === 'overdue');
      const returnedLoans = allLoans.filter(l => l.status === 'returned');

      return res.json({
        success: true,
        type: 'borrower',
        data: { 
          ...borrower, 
          loans: allLoans,
          activeLoans,
          overdueLoans,
          returnedLoans,
          activeLoansCount: activeLoans.length + overdueLoans.length,
          overdueLoansCount: overdueLoans.length,
          returnedLoansCount: returnedLoans.length,
          totalLoansCount: allLoans.length
        }
      });
    }

    res.status(404).json({ success: false, error: `No book or borrower found matching "${raw}"` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. SETTINGS API
// ==========================================
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateTx = db.transaction((updates) => {
      for (const [k, v] of Object.entries(updates)) {
        upsert.run(k, String(v));
      }
    });

    updateTx(req.body);

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. DATABASE SCHEMA & EXPLORER API
// ==========================================
app.get('/api/db/schema', (req, res) => {
  try {
    const tablesList = ['books', 'borrowers', 'loans', 'settings', 'users', 'sessions'];
    const tables = {};
    const relationships = [
      {
        id: 'rel_loans_books',
        fromTable: 'loans',
        fromColumn: 'book_barcode',
        toTable: 'books',
        toColumn: 'barcode',
        cardinality: 'N:1',
        description: 'Each loan record borrows exactly one book via books.barcode'
      },
      {
        id: 'rel_loans_borrowers',
        fromTable: 'loans',
        fromColumn: 'borrower_id',
        toTable: 'borrowers',
        toColumn: 'id',
        cardinality: 'N:1',
        description: 'Each loan record is issued to exactly one patron via borrowers.id'
      },
      {
        id: 'rel_sessions_users',
        fromTable: 'sessions',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        cardinality: 'N:1',
        description: 'Each active session belongs to a registered staff user via users.id'
      }
    ];

    for (const tableName of tablesList) {
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
      const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
      let sampleRows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
      if (tableName === 'users') {
        sampleRows = sampleRows.map(u => ({ ...u, password_hash: '••••••••[HASHED]', salt: '••••[SALT]' }));
      }
      if (tableName === 'sessions') {
        sampleRows = sampleRows.map(s => ({ ...s, token: s.token.slice(0, 10) + '••••••••' }));
      }
      const sqlRow = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);

      tables[tableName] = {
        name: tableName,
        rowCount: count,
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          isPrimary: Boolean(c.pk),
          isNotNull: Boolean(c.notnull),
          defaultValue: c.dflt_value
        })),
        foreignKeys: foreignKeys.map(fk => ({
          id: fk.id,
          toTable: fk.table,
          fromColumn: fk.from,
          toColumn: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete
        })),
        indexes: indexes.map(idx => ({
          name: idx.name,
          isUnique: Boolean(idx.unique),
          origin: idx.origin
        })),
        ddl: sqlRow?.sql || '',
        sampleRows
      };
    }

    res.json({
      success: true,
      data: {
        databaseFile: 'library-system/server/data/library.db',
        databaseEngine: 'SQLite 3 (better-sqlite3)',
        journalMode: 'WAL',
        foreignKeysEnabled: true,
        tables,
        relationships
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/db/table/:name', (req, res) => {
  try {
    const { name } = req.params;
    const allowed = ['books', 'borrowers', 'loans', 'settings', 'users', 'sessions'];
    if (!allowed.includes(name)) {
      return res.status(400).json({ success: false, error: 'Table not permitted or does not exist' });
    }

    const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get().count;
    const columns = db.prepare(`PRAGMA table_info(${name})`).all();
    let rows = db.prepare(`SELECT * FROM ${name} LIMIT 100`).all();
    if (name === 'users') {
      rows = rows.map(u => ({ ...u, password_hash: '••••••••[HASHED]', salt: '••••[SALT]' }));
    }
    if (name === 'sessions') {
      rows = rows.map(s => ({ ...s, token: s.token.slice(0, 10) + '••••••••' }));
    }

    res.json({
      success: true,
      data: {
        tableName: name,
        columns: columns.map(c => ({
          name: c.name,
          type: c.type,
          isPrimary: Boolean(c.pk),
          isNotNull: Boolean(c.notnull),
          defaultValue: c.dflt_value
        })),
        totalRows: count,
        rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static build in production
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.resolve(distPath, 'index.html'));
    }
    next();
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`📖 Athenaeum Library System running on http://0.0.0.0:${PORT}`);
  console.log(`⚡ Port: ${PORT}`);
  console.log(`🗄️ Database: ${db.name}`);
  console.log(`=======================================================`);
});
