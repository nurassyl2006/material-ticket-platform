import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db, { resetDatabase, hashPassword, verifyPassword, DEFAULT_PASSWORDS } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend development
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing with 50mb limit for ticket camera photo attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: safe JSON parsing
function safeJsonParse(val, fallback) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

// Format ticket row for API response
function formatTicket(row) {
  if (!row) return null;
  return {
    ...row,
    quantity: Number(row.quantity) || 1,
    purchaseCost: Number(row.purchaseCost) || 0,
    photos: safeJsonParse(row.photos, []),
    completionPhotos: safeJsonParse(row.completionPhotos, []),
    moveDetails: safeJsonParse(row.moveDetails, null),
    isReturnable: Boolean(row.isReturnable),
    returnStatus: row.returnStatus || 'none',
    borrowedAt: row.borrowedAt || null,
    returnedAt: row.returnedAt || null,
    returnConfirmedAt: row.returnConfirmedAt || null,
    returnConfirmedBy: row.returnConfirmedBy || null,
    createdById: row.createdById || null,
    createdByRole: row.createdByRole || null
  };
}

// Format inventory row for API response
function formatInventory(row) {
  if (!row) return null;
  return {
    ...row,
    quantity: Number(row.quantity) || 0,
    minLevel: Number(row.minLevel) || 5,
    photos: safeJsonParse(row.photos, []),
    isReturnable: Boolean(row.isReturnable)
  };
}

// Format user row for API response (strip passwordHash and salt)
function formatUser(row) {
  if (!row) return null;
  const { passwordHash, salt, ...safeUser } = row;
  return safeUser;
}

// Authenticate session from Bearer token
function authenticateSession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const now = new Date().toISOString();
  const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expiresAt > ?').get(token, now);
  if (!session) return null;

  const user = db.prepare('SELECT * FROM users WHERE roleKey = ? OR id = ?').get(session.roleKey, session.roleKey);
  return user ? { user: formatUser(user), token, roleKey: user.roleKey, role: user.role, userId: user.id } : null;
}

// Settings helper functions
function getSetting(key) {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch {
    return null;
  }
}

function setSetting(key, value) {
  try {
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
    return true;
  } catch {
    return false;
  }
}

// Telegram Alert Dispatcher (sends instant alerts directly to staff/director smartphones)
async function sendTelegramAlert(textHtml) {
  try {
    const token = getSetting('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = getSetting('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return false;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: textHtml,
        parse_mode: 'HTML'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Telegram notification error:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// Health & Diagnostic Endpoint
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  try {
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
    const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
      counts: {
        tickets: ticketCount,
        inventory: inventoryCount,
        users: userCount
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// -------------------------------------------------------------
// Authentication & Authorization Endpoints
// -------------------------------------------------------------

// POST /api/auth/register (Standard registration - assigns default role 'teacher')
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, department, password } = req.body;
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const rawPassword = (password || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email or username is required' });
    }
    if (!rawPassword || rawPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = db.prepare(`
      SELECT id FROM users 
      WHERE LOWER(email) = ? OR LOWER(name) = ? OR LOWER(roleKey) = ?
    `).get(cleanEmail, cleanName.toLowerCase(), cleanEmail);

    if (existing) {
      return res.status(400).json({ error: 'An account with this email or name already exists' });
    }

    const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const roleKey = id;
    const defaultRole = 'teacher';
    const now = new Date().toISOString();
    const { salt, hash } = hashPassword(rawPassword);

    db.prepare(`
      INSERT INTO users (roleKey, id, name, role, department, email, phone, avatar, passwordHash, salt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?)
    `).run(roleKey, id, cleanName, defaultRole, (department || 'General Staff').trim(), cleanEmail, hash, salt, now, now);

    // Auto-login session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (token, roleKey, createdAt, expiresAt)
      VALUES (?, ?, ?, ?)
    `).run(token, roleKey, now, expiresAt);

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    res.status(201).json({
      success: true,
      token,
      user: formatUser(created),
      message: 'Registration successful! Assigned role: Teacher. Elevated permissions are managed by the Directorate.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, roleKey, email, password } = req.body;
    const searchId = (email || identifier || roleKey || '').trim();
    const rawPassword = (password || '').trim();

    if (!searchId) {
      return res.status(400).json({ error: 'Email or username is required' });
    }
    if (!rawPassword) {
      return res.status(400).json({ error: 'Password is required' });
    }

    let normalizedKey = searchId;
    if (normalizedKey === 'workerA') normalizedKey = 'storage_manager';
    if (normalizedKey === 'admin') normalizedKey = 'director';

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE roleKey = ? OR id = ? OR LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)
    `).get(normalizedKey, searchId, searchId, searchId);

    if (!user) {
      return res.status(401).json({ error: 'User not found. Check your email or username.' });
    }

    const isValid = verifyPassword(rawPassword, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Generate 30-day session token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (token, roleKey, createdAt, expiresAt)
      VALUES (?, ?, ?, ?)
    `).run(token, user.roleKey, createdAt, expiresAt);

    res.json({
      success: true,
      token,
      user: formatUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me (Check current session token)
app.get('/api/auth/me', (req, res) => {
  try {
    const auth = authenticateSession(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized or session expired' });
    }
    res.json({
      success: true,
      user: auth.user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', (req, res) => {
  try {
    const auth = authenticateSession(req);
    const { currentPassword, newPassword, roleKey } = req.body;

    const targetRoleKey = (auth ? auth.roleKey : roleKey) || '';
    if (!targetRoleKey) {
      return res.status(400).json({ error: 'User specification is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = db.prepare('SELECT * FROM users WHERE roleKey = ?').get(targetRoleKey);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash and store new password
    const { salt: newSalt, hash: newHash } = hashPassword(newPassword);
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET passwordHash = ?, salt = ?, updatedAt = ? WHERE roleKey = ?')
      .run(newHash, newSalt, now, targetRoleKey);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/demo-credentials
app.get('/api/auth/demo-credentials', (req, res) => {
  try {
    const users = db.prepare('SELECT roleKey, name, role, department, email FROM users').all();
    const credentials = users.map(u => ({
      ...u,
      defaultPassword: DEFAULT_PASSWORDS[u.roleKey] || 'school123'
    }));
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Tickets API Endpoints
// -------------------------------------------------------------

// GET all tickets (newest first, with optional query filters)
app.get('/api/tickets', (req, res) => {
  try {
    const { status, department, createdById, search } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = {};

    if (status) {
      query += ' AND status = @status';
      params.status = status;
    }
    if (department) {
      query += ' AND department = @department';
      params.department = department;
    }
    if (createdById) {
      query += ' AND createdById = @createdById';
      params.createdById = createdById;
    }
    if (search) {
      query += ' AND (LOWER(itemTitle) LIKE @search OR LOWER(description) LIKE @search OR LOWER(teacherName) LIKE @search)';
      params.search = `%${search.toLowerCase().trim()}%`;
    }

    query += ' ORDER BY createdAt DESC';
    const rows = db.prepare(query).all(params);
    res.json(rows.map(formatTicket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ticket by ID
app.get('/api/tickets/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json(formatTicket(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new ticket
app.post('/api/tickets', (req, res) => {
  try {
    const body = req.body;
    const now = new Date().toISOString();
    const id = body.id || `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket = {
      id,
      department: body.department || 'other',
      itemTitle: body.itemTitle || 'Untitled Item',
      subcategory: body.subcategory || '',
      category: body.category || 'other',
      quantity: Number(body.quantity) || 1,
      unit: body.unit || 'pcs',
      urgency: body.urgency || 'medium',
      roomNumber: body.roomNumber || '',
      moveDetails: body.moveDetails ? JSON.stringify(body.moveDetails) : null,
      description: body.description || '',
      photos: Array.isArray(body.photos) ? JSON.stringify(body.photos) : '[]',
      completionPhotos: Array.isArray(body.completionPhotos) ? JSON.stringify(body.completionPhotos) : '[]',
      isReturnable: body.isReturnable ? 1 : 0,
      returnStatus: body.returnStatus || (body.isReturnable ? 'pending_issue' : 'none'),
      borrowedAt: body.borrowedAt || null,
      returnedAt: body.returnedAt || null,
      returnConfirmedAt: body.returnConfirmedAt || null,
      returnConfirmedBy: body.returnConfirmedBy || null,
      teacherName: body.teacherName || '',
      teacherPhone: body.teacherPhone || '',
      createdById: body.createdById || null,
      createdByRole: body.createdByRole || null,
      status: body.status || 'pending',
      assignedWorker: body.assignedWorker || null,
      assignedRole: body.assignedRole || null,
      handledAction: body.handledAction || null,
      purchaseCost: Number(body.purchaseCost) || 0,
      supplier: body.supplier || '',
      notes: body.notes || '',
      createdAt: body.createdAt || now,
      updatedAt: now
    };

    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, department, itemTitle, subcategory, category, quantity, unit, urgency, roomNumber,
        moveDetails, description, photos, completionPhotos,
        isReturnable, returnStatus, borrowedAt, returnedAt, returnConfirmedAt, returnConfirmedBy,
        teacherName, teacherPhone,
        createdById, createdByRole,
        status, assignedWorker, assignedRole, handledAction, purchaseCost, supplier, notes,
        createdAt, updatedAt
      ) VALUES (
        @id, @department, @itemTitle, @subcategory, @category, @quantity, @unit, @urgency, @roomNumber,
        @moveDetails, @description, @photos, @completionPhotos,
        @isReturnable, @returnStatus, @borrowedAt, @returnedAt, @returnConfirmedAt, @returnConfirmedBy,
        @teacherName, @teacherPhone,
        @createdById, @createdByRole,
        @status, @assignedWorker, @assignedRole, @handledAction, @purchaseCost, @supplier, @notes,
        @createdAt, @updatedAt
      )
    `);

    stmt.run(newTicket);

    // Auto-create notification for staff and directors
    const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetDept = newTicket.department === 'it' ? 'IT Specialist'
      : newTicket.department === 'cleaning' ? 'Cleaning Staff'
      : newTicket.department === 'facilities' ? 'Facilities Manager'
      : newTicket.department === 'storage' ? 'Storage Manager'
      : newTicket.department === 'engineering' ? 'Maintenance Engineer'
      : 'All';

    db.prepare(`
      INSERT INTO notifications (id, recipientName, ticketId, title, message, status, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      notifId,
      targetDept,
      id,
      `New Request: ${newTicket.itemTitle}`,
      `${newTicket.teacherName || 'Teacher'} requested "${newTicket.itemTitle}" (Room ${newTicket.roomNumber || 'General'})`,
      'pending',
      now
    );

    // Dispatch Telegram push alert if configured
    sendTelegramAlert(
      `🔔 <b>New Request in EduOps</b>\n` +
      `<b>Item:</b> ${newTicket.itemTitle}\n` +
      `<b>Location:</b> Room ${newTicket.roomNumber || 'General'}\n` +
      `<b>Teacher:</b> ${newTicket.teacherName || 'Staff'}\n` +
      `<b>Urgency:</b> ${newTicket.urgency || 'medium'}\n` +
      `<b>Dept:</b> ${targetDept}\n` +
      (newTicket.description ? `<b>Details:</b> ${newTicket.description}\n` : '')
    ).catch(() => {});

    const createdRow = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.status(201).json(formatTicket(createdRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH / PUT update ticket
app.patch('/api/tickets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates = req.body;
    const now = new Date().toISOString();

    const allowedFields = [
      'department', 'itemTitle', 'subcategory', 'category', 'quantity', 'unit', 'urgency',
      'roomNumber', 'moveDetails', 'description', 'photos', 'completionPhotos',
      'isReturnable', 'returnStatus', 'borrowedAt', 'returnedAt', 'returnConfirmedAt', 'returnConfirmedBy',
      'teacherName', 'teacherPhone', 'createdById', 'createdByRole', 'status',
      'assignedWorker', 'assignedRole', 'handledAction', 'purchaseCost', 'supplier', 'notes'
    ];

    const fieldsToSet = [];
    const values = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fieldsToSet.push(`${field} = @${field}`);
        if (field === 'photos' || field === 'completionPhotos' || field === 'moveDetails') {
          values[field] = typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field];
        } else if (field === 'quantity' || field === 'purchaseCost') {
          values[field] = Number(updates[field]);
        } else if (field === 'isReturnable') {
          values[field] = updates[field] ? 1 : 0;
        } else {
          values[field] = updates[field];
        }
      }
    }

    fieldsToSet.push('updatedAt = @updatedAt');
    values.updatedAt = updates.updatedAt || now;
    values.id = id;

    const sql = `UPDATE tickets SET ${fieldsToSet.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(values);

    // If ticket status changed, record notification and send push
    if (updates.status && updates.status !== existing.status) {
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const statusTitle = `Request Status: ${updates.status.toUpperCase()}`;
      const statusMsg = `Ticket "${existing.itemTitle}" status updated to ${updates.status} by ${updates.assignedWorker || 'staff'}.`;

      db.prepare(`
        INSERT INTO notifications (id, recipientName, ticketId, title, message, status, read, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        notifId,
        existing.teacherName || 'All',
        id,
        statusTitle,
        statusMsg,
        updates.status,
        now
      );

      sendTelegramAlert(
        `📌 <b>Status Updated in EduOps</b>\n` +
        `<b>Item:</b> ${existing.itemTitle}\n` +
        `<b>New Status:</b> ${updates.status.toUpperCase()}\n` +
        `<b>Staff:</b> ${updates.assignedWorker || 'Specialist'}\n` +
        (updates.notes ? `<b>Notes:</b> ${updates.notes}\n` : '')
      ).catch(() => {});
    }

    const updatedRow = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(formatTicket(updatedRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST mark ticket item returned by teacher (awaiting storage manager confirmation)
app.post('/api/tickets/:id/return-by-teacher', (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    const updatedNotes = notes 
      ? (ticket.notes ? `${ticket.notes} | Teacher note: ${notes}` : `Teacher note: ${notes}`)
      : (ticket.notes || 'Teacher returned borrowed item to warehouse.');

    db.prepare(`
      UPDATE tickets 
      SET returnStatus = 'returned_by_teacher', returnedAt = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, updatedNotes, now, id);

    // Notify storage manager and leadership
    const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO notifications (id, recipientName, ticketId, title, message, status, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      notifId,
      'Storage Manager',
      id,
      'Equipment Return Awaiting Confirmation',
      `${ticket.teacherName || 'Teacher'} has returned "${ticket.itemTitle}". Please inspect and confirm receipt in warehouse.`,
      'returned_by_teacher',
      now
    );

    sendTelegramAlert(
      `🔄 <b>Equipment Return Reported in EduOps</b>\n` +
      `<b>Item:</b> ${ticket.itemTitle}\n` +
      `<b>Teacher:</b> ${ticket.teacherName || 'Staff'}\n` +
      `<b>Status:</b> Awaiting Warehouse Confirmation\n` +
      (notes ? `<b>Note:</b> ${notes}\n` : '')
    ).catch(() => {});

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(formatTicket(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST confirm return of borrowed item by storage manager (restores warehouse stock!)
app.post('/api/tickets/:id/confirm-return', (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedBy, notes } = req.body;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    const who = confirmedBy || 'Storage Manager';
    const updatedNotes = notes 
      ? (ticket.notes ? `${ticket.notes} | Return confirmed by ${who}: ${notes}` : `Return confirmed by ${who}: ${notes}`)
      : (ticket.notes ? `${ticket.notes} | Return confirmed by ${who}.` : `Return confirmed by ${who} - item received back in warehouse.`);

    db.prepare(`
      UPDATE tickets 
      SET returnStatus = 'returned', status = 'completed', returnConfirmedAt = ?, returnConfirmedBy = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, who, updatedNotes, now, id);

    // Automatically restore warehouse inventory stock (+quantity)
    const matchingItem = db.prepare(`
      SELECT * FROM inventory 
      WHERE LOWER(name) = LOWER(?) OR LOWER(?) LIKE '%' || LOWER(name) || '%' OR LOWER(name) LIKE '%' || LOWER(?) || '%'
      LIMIT 1
    `).get(ticket.itemTitle, ticket.itemTitle, ticket.itemTitle);

    if (matchingItem) {
      const restoredQty = Number(matchingItem.quantity || 0) + (Number(ticket.quantity) || 1);
      db.prepare('UPDATE inventory SET quantity = ?, updatedAt = ? WHERE id = ?')
        .run(restoredQty, now, matchingItem.id);
    }

    // Send confirmation notification to requesting teacher
    if (ticket.teacherName) {
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare(`
        INSERT INTO notifications (id, recipientName, ticketId, title, message, status, read, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        notifId,
        ticket.teacherName,
        id,
        'Equipment Return Receipt Confirmed',
        `Storage Manager confirmed return of "${ticket.itemTitle}". Stock restored to warehouse. Thank you!`,
        'completed',
        now
      );
    }

    sendTelegramAlert(
      `✅ <b>Equipment Return Confirmed in Warehouse</b>\n` +
      `<b>Item:</b> ${ticket.itemTitle}\n` +
      `<b>Confirmed By:</b> ${who}\n` +
      `<b>Teacher:</b> ${ticket.teacherName || 'Staff'}\n` +
      `<b>Warehouse Stock Restored:</b> +${Number(ticket.quantity) || 1}\n`
    ).catch(() => {});

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(formatTicket(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ticket
app.delete('/api/tickets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk upsert tickets (for syncing/importing existing local tickets)
app.post('/api/tickets/bulk', (req, res) => {
  try {
    const tickets = req.body;
    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: 'Expected array of tickets' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO tickets (
        id, department, itemTitle, subcategory, category, quantity, unit, urgency, roomNumber,
        moveDetails, description, photos, completionPhotos,
        isReturnable, returnStatus, borrowedAt, returnedAt, returnConfirmedAt, returnConfirmedBy,
        teacherName, teacherPhone,
        createdById, createdByRole,
        status, assignedWorker, assignedRole, handledAction, purchaseCost, supplier, notes,
        createdAt, updatedAt
      ) VALUES (
        @id, @department, @itemTitle, @subcategory, @category, @quantity, @unit, @urgency, @roomNumber,
        @moveDetails, @description, @photos, @completionPhotos,
        @isReturnable, @returnStatus, @borrowedAt, @returnedAt, @returnConfirmedAt, @returnConfirmedBy,
        @teacherName, @teacherPhone,
        @createdById, @createdByRole,
        @status, @assignedWorker, @assignedRole, @handledAction, @purchaseCost, @supplier, @notes,
        @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        department = excluded.department,
        itemTitle = excluded.itemTitle,
        subcategory = excluded.subcategory,
        category = excluded.category,
        quantity = excluded.quantity,
        unit = excluded.unit,
        urgency = excluded.urgency,
        roomNumber = excluded.roomNumber,
        moveDetails = excluded.moveDetails,
        description = excluded.description,
        photos = excluded.photos,
        completionPhotos = excluded.completionPhotos,
        isReturnable = excluded.isReturnable,
        returnStatus = excluded.returnStatus,
        borrowedAt = excluded.borrowedAt,
        returnedAt = excluded.returnedAt,
        returnConfirmedAt = excluded.returnConfirmedAt,
        returnConfirmedBy = excluded.returnConfirmedBy,
        teacherName = excluded.teacherName,
        teacherPhone = excluded.teacherPhone,
        createdById = COALESCE(excluded.createdById, tickets.createdById),
        createdByRole = COALESCE(excluded.createdByRole, tickets.createdByRole),
        status = excluded.status,
        assignedWorker = excluded.assignedWorker,
        assignedRole = excluded.assignedRole,
        handledAction = excluded.handledAction,
        purchaseCost = excluded.purchaseCost,
        supplier = excluded.supplier,
        notes = excluded.notes,
        updatedAt = excluded.updatedAt
    `);

    const now = new Date().toISOString();
    const runBulk = db.transaction((list) => {
      for (const t of list) {
        if (!t || !t.id) continue;
        upsertStmt.run({
          id: t.id,
          department: t.department || 'storage',
          itemTitle: t.itemTitle || '',
          subcategory: t.subcategory || '',
          category: t.category || 'other',
          quantity: Number(t.quantity) || 1,
          unit: t.unit || 'pcs',
          urgency: t.urgency || 'medium',
          roomNumber: t.roomNumber || '',
          moveDetails: t.moveDetails ? JSON.stringify(t.moveDetails) : null,
          description: t.description || '',
          photos: Array.isArray(t.photos) ? JSON.stringify(t.photos) : (typeof t.photos === 'string' ? t.photos : '[]'),
          completionPhotos: Array.isArray(t.completionPhotos) ? JSON.stringify(t.completionPhotos) : (typeof t.completionPhotos === 'string' ? t.completionPhotos : '[]'),
          isReturnable: t.isReturnable ? 1 : 0,
          returnStatus: t.returnStatus || (t.isReturnable ? 'pending_issue' : 'none'),
          borrowedAt: t.borrowedAt || null,
          returnedAt: t.returnedAt || null,
          returnConfirmedAt: t.returnConfirmedAt || null,
          returnConfirmedBy: t.returnConfirmedBy || null,
          teacherName: t.teacherName || '',
          teacherPhone: t.teacherPhone || '',
          createdById: t.createdById || null,
          createdByRole: t.createdByRole || null,
          status: t.status || 'pending',
          assignedWorker: t.assignedWorker || null,
          assignedRole: t.assignedRole || null,
          handledAction: t.handledAction || null,
          purchaseCost: Number(t.purchaseCost) || 0,
          supplier: t.supplier || '',
          notes: t.notes || '',
          createdAt: t.createdAt || now,
          updatedAt: t.updatedAt || now
        });
      }
    });

    runBulk(tickets);
    const all = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
    res.json(all.map(formatTicket));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Storage List of Goods (Inventory) API Endpoints
// -------------------------------------------------------------

// GET inventory items (supports ?category=... filter)
app.get('/api/inventory', (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category && category !== 'all') {
      rows = db.prepare('SELECT * FROM inventory WHERE category = ? ORDER BY name ASC').all(category);
    } else {
      rows = db.prepare('SELECT * FROM inventory ORDER BY category ASC, name ASC').all();
    }
    res.json(rows.map(formatInventory));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET inventory categories breakdown & statistics
app.get('/api/inventory/categories', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        category,
        COUNT(*) as itemCount,
        COALESCE(SUM(quantity), 0) as totalQty,
        SUM(CASE WHEN quantity <= minLevel THEN 1 ELSE 0 END) as lowStockCount,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount
      FROM inventory
      GROUP BY category
      ORDER BY category ASC
    `).all();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new inventory item
app.post('/api/inventory', (req, res) => {
  try {
    const body = req.body;
    const now = new Date().toISOString();
    const id = body.id || `inv-${Date.now()}`;

    const newItem = {
      id,
      name: body.name || 'New Item',
      category: body.category || 'stationary',
      quantity: Number(body.quantity) || 0,
      unit: body.unit || 'pcs',
      minLevel: Number(body.minLevel) || 5,
      location: body.location || '',
      photos: Array.isArray(body.photos) ? JSON.stringify(body.photos) : (typeof body.photos === 'string' ? body.photos : '[]'),
      isReturnable: body.isReturnable ? 1 : 0,
      createdAt: now,
      updatedAt: now
    };

    db.prepare(`
      INSERT INTO inventory (id, name, category, quantity, unit, minLevel, location, photos, isReturnable, createdAt, updatedAt)
      VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @photos, @isReturnable, @createdAt, @updatedAt)
    `).run(newItem);

    const created = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.status(201).json(formatInventory(created));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update inventory item
app.patch('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }

    const updates = req.body;
    const now = new Date().toISOString();
    const allowed = ['name', 'category', 'quantity', 'unit', 'minLevel', 'location', 'photos', 'isReturnable'];
    const fieldsToSet = [];
    const values = {};

    for (const field of allowed) {
      if (updates[field] !== undefined) {
        fieldsToSet.push(`${field} = @${field}`);
        if (field === 'quantity' || field === 'minLevel') {
          values[field] = Number(updates[field]);
        } else if (field === 'photos') {
          values[field] = Array.isArray(updates[field]) ? JSON.stringify(updates[field]) : String(updates[field]);
        } else if (field === 'isReturnable') {
          values[field] = updates[field] ? 1 : 0;
        } else {
          values[field] = updates[field];
        }
      }
    }

    fieldsToSet.push('updatedAt = @updatedAt');
    values.updatedAt = now;
    values.id = id;

    const sql = `UPDATE inventory SET ${fieldsToSet.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(values);

    const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.json(formatInventory(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add photo(s) to an existing inventory item in DB
app.post('/api/inventory/:id/photos', (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;
    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }

    const currentPhotos = safeJsonParse(existing.photos, []);
    const incomingPhotos = Array.isArray(photos) ? photos : [photos].filter(Boolean);
    const updatedPhotos = [...currentPhotos, ...incomingPhotos];

    const now = new Date().toISOString();
    db.prepare('UPDATE inventory SET photos = ?, updatedAt = ? WHERE id = ?')
      .run(JSON.stringify(updatedPhotos), now, id);

    const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.json(formatInventory(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH adjust inventory quantity directly
app.patch('/api/inventory/:id/quantity', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, delta } = req.body;
    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }

    let newQty;
    if (quantity !== undefined) {
      newQty = Math.max(0, Number(quantity));
    } else if (delta !== undefined) {
      newQty = Math.max(0, Number(existing.quantity) + Number(delta));
    } else {
      return res.status(400).json({ error: 'Missing quantity or delta parameter' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE inventory SET quantity = ?, updatedAt = ? WHERE id = ?').run(newQty, now, id);

    const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.json(formatInventory(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE inventory item
app.delete('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Users API Endpoints
// -------------------------------------------------------------

// GET all users (returns map keyed by roleKey and id, plus array list)
app.get('/api/users', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY createdAt ASC').all();
    const cleanRows = rows.map(formatUser);
    const map = {};
    for (const user of cleanRows) {
      map[user.roleKey] = user;
      map[user.id] = user;
    }
    // Provide legacy aliases
    if (map.storage_manager) map.workerA = map.storage_manager;
    if (map.director) map.admin = map.director;

    res.json({
      map,
      list: cleanRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by id or roleKey
app.get('/api/users/:id', (req, res) => {
  try {
    let { id } = req.params;
    if (id === 'workerA') id = 'storage_manager';
    if (id === 'admin') id = 'director';

    const row = db.prepare('SELECT * FROM users WHERE id = ? OR roleKey = ?').get(id, id);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new user (Director provisioned)
app.post('/api/users', (req, res) => {
  try {
    const auth = authenticateSession(req);
    if (auth && auth.user.role !== 'director' && auth.user.role !== 'admin' && auth.roleKey !== 'director') {
      return res.status(403).json({ error: 'Only the Director can create users' });
    }

    const { name, email, role = 'teacher', department = '', phone = '', password = 'school123' } = req.body;
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const rawPassword = (password || '').trim() || 'school123';

    if (!cleanName) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?').get(cleanEmail, cleanName.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'User with this email or name already exists' });
    }

    const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const roleKey = id;
    const now = new Date().toISOString();
    const { salt, hash } = hashPassword(rawPassword);

    db.prepare(`
      INSERT INTO users (roleKey, id, name, role, department, email, phone, avatar, passwordHash, salt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?)
    `).run(roleKey, id, cleanName, role, (department || '').trim(), cleanEmail, (phone || '').trim(), hash, salt, now, now);

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(formatUser(created));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH change user role (Director only)
app.patch('/api/users/:id/role', (req, res) => {
  try {
    const auth = authenticateSession(req);
    if (auth && auth.user.role !== 'director' && auth.user.role !== 'admin' && auth.roleKey !== 'director') {
      return res.status(403).json({ error: 'Only the Director can change user roles' });
    }

    const { id } = req.params;
    const { role: newRole } = req.body;
    if (!newRole) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const validRoles = ['director', 'facilities_manager', 'storage_manager', 'engineer', 'it_support', 'cleaning', 'teacher'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? OR roleKey = ?').get(id, id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET role = ?, updatedAt = ? WHERE id = ? OR roleKey = ?').run(newRole, now, user.id, user.roleKey);

    // Create system notification for that user
    try {
      db.prepare(`
        INSERT INTO notifications (id, recipientName, ticketId, title, message, status, read, createdAt)
        VALUES (?, ?, '', ?, ?, 'info', 0, ?)
      `).run(
        `notif-${Date.now()}`,
        user.name,
        'Role Updated',
        `Your system role was changed to "${newRole}" by the Director.`,
        now
      );
    } catch {}

    const updated = db.prepare('SELECT * FROM users WHERE id = ? OR roleKey = ?').get(user.id, user.roleKey);
    res.json(formatUser(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST reset user password (Director only)
app.post('/api/users/:id/reset-password', (req, res) => {
  try {
    const auth = authenticateSession(req);
    if (auth && auth.user.role !== 'director' && auth.user.role !== 'admin' && auth.roleKey !== 'director') {
      return res.status(403).json({ error: 'Only the Director can reset passwords' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? OR roleKey = ?').get(id, id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { salt, hash } = hashPassword(newPassword);
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET passwordHash = ?, salt = ?, updatedAt = ? WHERE id = ? OR roleKey = ?')
      .run(hash, salt, now, user.id, user.roleKey);

    res.json({ success: true, message: `Password for ${user.name} has been reset.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user (Director only)
app.delete('/api/users/:id', (req, res) => {
  try {
    const auth = authenticateSession(req);
    if (auth && auth.user.role !== 'director' && auth.user.role !== 'admin' && auth.roleKey !== 'director') {
      return res.status(403).json({ error: 'Only the Director can delete users' });
    }

    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ? OR roleKey = ?').get(id, id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Safety: Cannot delete director roleKey if it's the main director
    if (user.roleKey === 'director' && user.role === 'director') {
      return res.status(400).json({ error: 'Cannot delete the main Director account' });
    }

    db.prepare('DELETE FROM sessions WHERE roleKey = ? OR roleKey = ?').run(user.roleKey, user.id);
    db.prepare('DELETE FROM users WHERE id = ? OR roleKey = ?').run(user.id, user.roleKey);

    res.json({ success: true, id: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update user profile
app.patch('/api/users/:id', (req, res) => {
  try {
    let { id } = req.params;
    if (id === 'workerA') id = 'storage_manager';
    if (id === 'admin') id = 'director';

    const existing = db.prepare('SELECT * FROM users WHERE id = ? OR roleKey = ?').get(id, id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = req.body;
    const now = new Date().toISOString();
    const allowed = ['name', 'department', 'email', 'phone', 'avatar', 'role'];
    const fieldsToSet = [];
    const values = {};

    for (const field of allowed) {
      if (updates[field] !== undefined) {
        fieldsToSet.push(`${field} = @${field}`);
        values[field] = updates[field];
      }
    }

    if (fieldsToSet.length === 0) {
      return res.json(formatUser(existing));
    }

    fieldsToSet.push('updatedAt = @updatedAt');
    values.updatedAt = now;
    values.targetId = existing.id;

    const sql = `UPDATE users SET ${fieldsToSet.join(', ')} WHERE id = @targetId OR roleKey = @targetId`;
    db.prepare(sql).run(values);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
    res.json(formatUser(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Notifications API Endpoints
// -------------------------------------------------------------

// GET notifications
app.get('/api/notifications', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 100').all();
    res.json(rows.map(n => ({ ...n, read: Boolean(n.read) })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add notification
app.post('/api/notifications', (req, res) => {
  try {
    const body = req.body;
    const id = body.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const notif = {
      id,
      recipientName: body.recipientName || 'All',
      ticketId: body.ticketId || '',
      title: body.title || '',
      message: body.message || '',
      status: body.status || 'info',
      read: body.read ? 1 : 0,
      createdAt: body.createdAt || now
    };

    db.prepare(`
      INSERT INTO notifications (id, recipientName, ticketId, title, message, status, read, createdAt)
      VALUES (@id, @recipientName, @ticketId, @title, @message, @status, @read, @createdAt)
    `).run(notif);

    res.status(201).json({ ...notif, read: Boolean(notif.read) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH mark notification as read
app.patch('/api/notifications/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST mark all notifications as read
app.post('/api/notifications/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE clear all notifications
app.delete('/api/notifications', (req, res) => {
  try {
    db.prepare('DELETE FROM notifications').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Telegram Push Notifications Configuration Endpoints
// -------------------------------------------------------------

// GET Telegram integration status
app.get('/api/notifications/telegram', (req, res) => {
  try {
    const token = getSetting('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = getSetting('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID || '';
    res.json({
      configured: Boolean(token && chatId),
      chatId: chatId,
      botTokenMasked: token ? `${token.substring(0, 6)}...${token.slice(-4)}` : ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update Telegram configuration
app.post('/api/notifications/telegram', (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    if (botToken !== undefined) setSetting('telegram_bot_token', botToken.trim());
    if (chatId !== undefined) setSetting('telegram_chat_id', chatId.trim());
    res.json({
      success: true,
      configured: Boolean((botToken || getSetting('telegram_bot_token')) && (chatId || getSetting('telegram_chat_id')))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST dispatch test Telegram alert
app.post('/api/notifications/telegram/test', async (req, res) => {
  try {
    const sent = await sendTelegramAlert(
      `🔔 <b>EduOps Test Alert</b>\n` +
      `Your device is successfully connected to the EduOps Facilities Platform!\n` +
      `You will receive real-time updates for school requests and maintenance directly on this device.`
    );
    if (sent) {
      res.json({ success: true, message: 'Test alert delivered to Telegram!' });
    } else {
      res.status(400).json({
        error: 'Failed to send Telegram message. Please check your Bot Token and Chat ID.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// -------------------------------------------------------------
// Translation API Endpoint (Assists Engineers & Teachers)
// -------------------------------------------------------------
const serverTranslationCache = new Map();

app.post('/api/translate', async (req, res) => {
  try {
    const { text, from = 'auto', to = 'ru' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.json({ translatedText: text || '', from, to });
    }

    const trimmed = text.trim();
    const cacheKey = `${from}:${to}:${trimmed}`;
    if (serverTranslationCache.has(cacheKey)) {
      return res.json({
        translatedText: serverTranslationCache.get(cacheKey),
        from,
        to,
        cached: true
      });
    }

    let source = from;
    if (source === 'auto') {
      if (/[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(trimmed)) {
        source = 'kk';
      } else if (/[а-яёА-ЯЁ]/.test(trimmed)) {
        source = 'ru';
      } else {
        source = 'en';
      }
    }

    if (source === to) {
      return res.json({ translatedText: trimmed, from: source, to, isSame: true });
    }

    const langpair = `${source}|${to}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`;

    const response = await fetch(myMemoryUrl, {
      headers: { 'User-Agent': 'EduOps-Ticket-Platform/1.0' },
      signal: AbortSignal.timeout(9000)
    });

    if (!response.ok) {
      return res.json({ translatedText: trimmed, from, to, fallback: true });
    }

    const data = await response.json();
    let translated = data?.responseData?.translatedText;

    if (translated && !data.quotaFinished && translated.toLowerCase() !== 'null') {
      translated = translated
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      serverTranslationCache.set(cacheKey, translated);
      // Keep cache bounded
      if (serverTranslationCache.size > 2000) {
        const firstKey = serverTranslationCache.keys().next().value;
        serverTranslationCache.delete(firstKey);
      }

      return res.json({ translatedText: translated, from, to, cached: false });
    }

    res.json({ translatedText: trimmed, from, to, fallback: true });
  } catch (error) {
    // Return original text gracefully on timeout or network error
    res.json({ translatedText: req.body?.text || '', from: req.body?.from || 'auto', to: req.body?.to || 'ru', fallback: true, error: error.message });
  }
});

// -------------------------------------------------------------
// Database Reset Endpoint (Restores default clean state)
// -------------------------------------------------------------
app.post('/api/reset', (req, res) => {
  try {
    resetDatabase();
    res.json({ success: true, message: 'Database reset to default clean seed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tunnel Status Endpoint (checks if active public tunnel is running)
app.get('/api/tunnel-status', (req, res) => {
  try {
    const tunnelFile = path.resolve(__dirname, 'data/tunnel_url.txt');
    if (fs.existsSync(tunnelFile)) {
      const url = fs.readFileSync(tunnelFile, 'utf8').trim();
      if (url) {
        return res.json({ active: true, url });
      }
    }
  } catch (e) {}
  res.json({ active: false, url: '' });
});

// -------------------------------------------------------------
// Production Static Serving
// -------------------------------------------------------------
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use('/material-ticket-platform', express.static(distDir));
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    // If request is a GET/HEAD and does not start with /api, serve index.html
    if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
      return res.sendFile(path.resolve(distDir, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`EduOps Server & SQLite Database running on http://0.0.0.0:${PORT}`);
  console.log(`API endpoints accessible at http://localhost:${PORT}/api/`);
});

// Graceful process termination (prevents SQLite WAL corruption on reload)
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully stopping EduOps server...`);
  server.close(() => {
    try {
      db.close();
    } catch {}
    console.log('Database and server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
