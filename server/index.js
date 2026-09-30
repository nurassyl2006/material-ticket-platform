import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { resetDatabase } from './db.js';

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
    moveDetails: safeJsonParse(row.moveDetails, null)
  };
}

// Format inventory row for API response
function formatInventory(row) {
  if (!row) return null;
  return {
    ...row,
    quantity: Number(row.quantity) || 0,
    minLevel: Number(row.minLevel) || 5
  };
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
// Tickets API Endpoints
// -------------------------------------------------------------

// GET all tickets (newest first)
app.get('/api/tickets', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
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
      teacherName: body.teacherName || '',
      teacherPhone: body.teacherPhone || '',
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
        moveDetails, description, photos, completionPhotos, teacherName, teacherPhone,
        status, assignedWorker, assignedRole, handledAction, purchaseCost, supplier, notes,
        createdAt, updatedAt
      ) VALUES (
        @id, @department, @itemTitle, @subcategory, @category, @quantity, @unit, @urgency, @roomNumber,
        @moveDetails, @description, @photos, @completionPhotos, @teacherName, @teacherPhone,
        @status, @assignedWorker, @assignedRole, @handledAction, @purchaseCost, @supplier, @notes,
        @createdAt, @updatedAt
      )
    `);

    stmt.run(newTicket);
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
      'teacherName', 'teacherPhone', 'status', 'assignedWorker', 'assignedRole',
      'handledAction', 'purchaseCost', 'supplier', 'notes'
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

    const updatedRow = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(formatTicket(updatedRow));
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
        moveDetails, description, photos, completionPhotos, teacherName, teacherPhone,
        status, assignedWorker, assignedRole, handledAction, purchaseCost, supplier, notes,
        createdAt, updatedAt
      ) VALUES (
        @id, @department, @itemTitle, @subcategory, @category, @quantity, @unit, @urgency, @roomNumber,
        @moveDetails, @description, @photos, @completionPhotos, @teacherName, @teacherPhone,
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
        teacherName = excluded.teacherName,
        teacherPhone = excluded.teacherPhone,
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
          category: t.category || 'other',
          quantity: Number(t.quantity) || 1,
          unit: t.unit || 'pcs',
          urgency: t.urgency || 'medium',
          roomNumber: t.roomNumber || '',
          moveDetails: t.moveDetails ? JSON.stringify(t.moveDetails) : null,
          description: t.description || '',
          photos: Array.isArray(t.photos) ? JSON.stringify(t.photos) : (typeof t.photos === 'string' ? t.photos : '[]'),
          completionPhotos: Array.isArray(t.completionPhotos) ? JSON.stringify(t.completionPhotos) : (typeof t.completionPhotos === 'string' ? t.completionPhotos : '[]'),
          teacherName: t.teacherName || '',
          teacherPhone: t.teacherPhone || '',
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

// GET all inventory items
app.get('/api/inventory', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY name ASC').all();
    res.json(rows.map(formatInventory));
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
      createdAt: now,
      updatedAt: now
    };

    db.prepare(`
      INSERT INTO inventory (id, name, category, quantity, unit, minLevel, location, createdAt, updatedAt)
      VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @createdAt, @updatedAt)
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
    const allowed = ['name', 'category', 'quantity', 'unit', 'minLevel', 'location'];
    const fieldsToSet = [];
    const values = {};

    for (const field of allowed) {
      if (updates[field] !== undefined) {
        fieldsToSet.push(`${field} = @${field}`);
        values[field] = (field === 'quantity' || field === 'minLevel') ? Number(updates[field]) : updates[field];
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

// GET all users (returns map keyed by roleKey for direct compatibility, plus array list)
app.get('/api/users', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM users').all();
    const map = {};
    for (const user of rows) {
      map[user.roleKey] = user;
    }
    // Provide legacy aliases
    if (map.storage_manager) map.workerA = map.storage_manager;
    if (map.director) map.admin = map.director;

    res.json({
      map,
      list: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by roleKey
app.get('/api/users/:roleKey', (req, res) => {
  try {
    let { roleKey } = req.params;
    if (roleKey === 'workerA') roleKey = 'storage_manager';
    if (roleKey === 'admin') roleKey = 'director';

    const row = db.prepare('SELECT * FROM users WHERE roleKey = ?').get(roleKey);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update user profile
app.patch('/api/users/:roleKey', (req, res) => {
  try {
    let { roleKey } = req.params;
    if (roleKey === 'workerA') roleKey = 'storage_manager';
    if (roleKey === 'admin') roleKey = 'director';

    const existing = db.prepare('SELECT * FROM users WHERE roleKey = ?').get(roleKey);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = req.body;
    const now = new Date().toISOString();
    const allowed = ['name', 'department', 'email', 'phone', 'avatar'];
    const fieldsToSet = [];
    const values = {};

    for (const field of allowed) {
      if (updates[field] !== undefined) {
        fieldsToSet.push(`${field} = @${field}`);
        values[field] = updates[field];
      }
    }

    fieldsToSet.push('updatedAt = @updatedAt');
    values.updatedAt = now;
    values.roleKey = roleKey;

    const sql = `UPDATE users SET ${fieldsToSet.join(', ')} WHERE roleKey = @roleKey`;
    db.prepare(sql).run(values);

    const updated = db.prepare('SELECT * FROM users WHERE roleKey = ?').get(roleKey);
    res.json(updated);
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

// -------------------------------------------------------------
// Production Static Serving
// -------------------------------------------------------------
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use('/material-ticket-platform', express.static(distDir));
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    // If request is a GET and does not start with /api, serve index.html
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.resolve(distDir, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EduOps Server & SQLite Database running on http://0.0.0.0:${PORT}`);
  console.log(`API endpoints accessible at http://localhost:${PORT}/api/`);
});
