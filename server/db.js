import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'platform.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 1. Initial schema definition
db.exec(`
  -- Tickets Table
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    department TEXT DEFAULT 'other',
    itemTitle TEXT NOT NULL,
    subcategory TEXT DEFAULT '',
    category TEXT DEFAULT 'other',
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    urgency TEXT DEFAULT 'medium',
    roomNumber TEXT DEFAULT '',
    moveDetails TEXT DEFAULT NULL,
    description TEXT DEFAULT '',
    photos TEXT DEFAULT '[]',
    completionPhotos TEXT DEFAULT '[]',
    teacherName TEXT DEFAULT '',
    teacherPhone TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    assignedWorker TEXT DEFAULT NULL,
    assignedRole TEXT DEFAULT NULL,
    handledAction TEXT DEFAULT NULL,
    purchaseCost REAL DEFAULT 0,
    supplier TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_createdAt ON tickets(createdAt);

  -- Storage List of Goods (Inventory) Table
  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'stationary',
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    minLevel REAL DEFAULT 5,
    location TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
  CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

  -- Users Table
  CREATE TABLE IF NOT EXISTS users (
    roleKey TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  -- Notifications Table
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipientName TEXT NOT NULL,
    ticketId TEXT DEFAULT '',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'info',
    read INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipientName);
  CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt);
`);

// Default initial inventory items
const defaultInventory = [
  {
    id: "inv-1",
    name: "Whiteboard Markers Set (Red/Blue/Black)",
    category: "stationary",
    quantity: 45,
    unit: "box",
    minLevel: 10,
    location: "Storage Cabinet 102 - Shelf A"
  },
  {
    id: "inv-2",
    name: "A4 Printing Paper (80gsm)",
    category: "stationary",
    quantity: 18,
    unit: "pack",
    minLevel: 25,
    location: "Storage Cabinet 102 - Shelf B"
  },
  {
    id: "inv-3",
    name: "HDMI to VGA & DisplayPort Adapter Kit",
    category: "electronics",
    quantity: 8,
    unit: "pcs",
    minLevel: 5,
    location: "IT Server Room 204"
  },
  {
    id: "inv-4",
    name: "Ergonomic Student Chairs (Blue)",
    category: "furniture",
    quantity: 24,
    unit: "pcs",
    minLevel: 10,
    location: "Facilities Warehouse Block B"
  },
  {
    id: "inv-5",
    name: "Adjustable Student Desks (Wood/Steel)",
    category: "furniture",
    quantity: 15,
    unit: "pcs",
    minLevel: 8,
    location: "Facilities Warehouse Block B"
  },
  {
    id: "inv-6",
    name: "Heavy-Duty Furniture Dolly & Moving Straps",
    category: "furniture",
    quantity: 3,
    unit: "set",
    minLevel: 2,
    location: "Facilities Workshop 105"
  },
  {
    id: "inv-7",
    name: "Disinfectant Surface Sanitizing Wipes",
    category: "cleaning",
    quantity: 4,
    unit: "pack",
    minLevel: 10,
    location: "Cleaning Depot Basement"
  },
  {
    id: "inv-8",
    name: "Chemistry Lab Test Tubes Set",
    category: "lab",
    quantity: 12,
    unit: "set",
    minLevel: 5,
    location: "Science Lab Storage 301"
  },
  {
    id: "inv-9",
    name: "LED Ceiling Panel 36W (600x600)",
    category: "electrical",
    quantity: 14,
    unit: "pcs",
    minLevel: 4,
    location: "Engineering Workshop 106 - Shelf A"
  },
  {
    id: "inv-10",
    name: "Split AC Washable Air Filters & Drain Hose Kit",
    category: "hvac",
    quantity: 6,
    unit: "set",
    minLevel: 2,
    location: "Engineering Workshop 106 - Shelf B"
  },
  {
    id: "inv-11",
    name: "Heavy Duty Grounded Wall Sockets (16A 250V)",
    category: "electrical",
    quantity: 20,
    unit: "pcs",
    minLevel: 5,
    location: "Engineering Workshop 106 - Shelf C"
  }
];

// Default initial users
const defaultUsers = [
  {
    roleKey: "teacher",
    id: "usr-t1",
    name: "Teacher",
    role: "teacher",
    department: "Mathematics & STEM",
    email: "teacher@school.edu",
    phone: "",
    avatar: ""
  },
  {
    roleKey: "it_support",
    id: "usr-it1",
    name: "IT Support",
    role: "it_support",
    department: "Information Technology Support",
    email: "it.support@school.edu",
    phone: "",
    avatar: ""
  },
  {
    roleKey: "cleaning",
    id: "usr-cl1",
    name: "Cleaning Staff",
    role: "cleaning",
    department: "Campus Hygiene & Sanitization",
    email: "cleaning@school.edu",
    phone: "",
    avatar: ""
  },
  {
    roleKey: "storage_manager",
    id: "usr-w1",
    name: "Storage Manager",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "storage@school.edu",
    phone: "",
    avatar: ""
  },
  {
    roleKey: "facilities_manager",
    id: "usr-fm1",
    name: "Facilities Manager",
    role: "facilities_manager",
    department: "Facilities & Logistics",
    email: "facilities@school.edu",
    phone: "",
    avatar: ""
  },
  {
    roleKey: "director",
    id: "usr-dir1",
    name: "Director",
    role: "director",
    department: "School Operations & Directorate",
    email: "director@school.edu",
    phone: "",
    avatar: ""
  },
  {
    roleKey: "engineer",
    id: "usr-eng1",
    name: "Engineer",
    role: "engineer",
    department: "Engineering, Electrical & HVAC Utilities",
    email: "engineer@school.edu",
    phone: "",
    avatar: ""
  }
];

// Auto-seed initial inventory if empty
const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
if (invCount === 0) {
  const insertInv = db.prepare(`
    INSERT INTO inventory (id, name, category, quantity, unit, minLevel, location, createdAt, updatedAt)
    VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @createdAt, @updatedAt)
  `);
  const now = new Date().toISOString();
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertInv.run({
        ...item,
        createdAt: now,
        updatedAt: now
      });
    }
  });
  insertMany(defaultInventory);
}

// Auto-seed initial users if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (roleKey, id, name, role, department, email, phone, avatar, createdAt, updatedAt)
    VALUES (@roleKey, @id, @name, @role, @department, @email, @phone, @avatar, @createdAt, @updatedAt)
  `);
  const now = new Date().toISOString();
  const insertManyUsers = db.transaction((users) => {
    for (const user of users) {
      insertUser.run({
        ...user,
        createdAt: now,
        updatedAt: now
      });
    }
  });
  insertManyUsers(defaultUsers);
}

// Helper to reset database to default state
export function resetDatabase() {
  const now = new Date().toISOString();
  db.transaction(() => {
    // Clear tickets and notifications
    db.prepare('DELETE FROM tickets').run();
    db.prepare('DELETE FROM notifications').run();

    // Reset inventory to default
    db.prepare('DELETE FROM inventory').run();
    const insertInv = db.prepare(`
      INSERT INTO inventory (id, name, category, quantity, unit, minLevel, location, createdAt, updatedAt)
      VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @createdAt, @updatedAt)
    `);
    for (const item of defaultInventory) {
      insertInv.run({
        ...item,
        createdAt: now,
        updatedAt: now
      });
    }

    // Reset users to default
    db.prepare('DELETE FROM users').run();
    const insertUser = db.prepare(`
      INSERT INTO users (roleKey, id, name, role, department, email, phone, avatar, createdAt, updatedAt)
      VALUES (@roleKey, @id, @name, @role, @department, @email, @phone, @avatar, @createdAt, @updatedAt)
    `);
    for (const user of defaultUsers) {
      insertUser.run({
        ...user,
        createdAt: now,
        updatedAt: now
      });
    }
  })();
}

export default db;
