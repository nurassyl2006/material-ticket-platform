import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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
db.pragma('busy_timeout = 5000');

// Cryptographic Password Hashing & Verification Utilities
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  if (!password) throw new Error('Password is required for hashing');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  } catch (e) {
    return false;
  }
}

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
    createdById TEXT DEFAULT NULL,
    createdByRole TEXT DEFAULT NULL,
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
  CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department);

  -- Storage List of Goods (Inventory) Table
  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'stationary',
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    minLevel REAL DEFAULT 5,
    location TEXT DEFAULT '',
    photos TEXT DEFAULT '[]',
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
    passwordHash TEXT DEFAULT '',
    salt TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  -- Sessions Table for Authentication Tokens
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    roleKey TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

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

  -- Key-Value Settings Table
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration: Ensure passwordHash & salt columns exist on existing databases
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userColumns.includes('passwordHash')) {
    db.prepare("ALTER TABLE users ADD COLUMN passwordHash TEXT DEFAULT ''").run();
  }
  if (!userColumns.includes('salt')) {
    db.prepare("ALTER TABLE users ADD COLUMN salt TEXT DEFAULT ''").run();
  }
} catch {
  // Column check warning
}

// Migration: Ensure createdById & createdByRole columns exist on tickets
try {
  const ticketColumns = db.prepare("PRAGMA table_info(tickets)").all().map(c => c.name);
  if (!ticketColumns.includes('createdById')) {
    db.prepare("ALTER TABLE tickets ADD COLUMN createdById TEXT DEFAULT NULL").run();
  }
  if (!ticketColumns.includes('createdByRole')) {
    db.prepare("ALTER TABLE tickets ADD COLUMN createdByRole TEXT DEFAULT NULL").run();
  }
  db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_createdById ON tickets(createdById)").run();
  db.prepare("CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department)").run();
  db.prepare("CREATE INDEX IF NOT EXISTS idx_users_id ON users(id)").run();
  db.prepare("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").run();
} catch {
  // Index/column migration check
}

// Migration: Ensure photos column exists on inventory table
try {
  const invColumns = db.prepare("PRAGMA table_info(inventory)").all().map(c => c.name);
  if (!invColumns.includes('photos')) {
    db.prepare("ALTER TABLE inventory ADD COLUMN photos TEXT DEFAULT '[]'").run();
  }
} catch {
  // Inventory photos column check
}

// Default initial inventory items, divided into standard categories
const defaultInventory = [
  // --- Stationary (Канцелярия и бумага) ---
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
    id: "inv-s3",
    name: "Clear Document Folders & Sheet Protectors",
    category: "stationary",
    quantity: 35,
    unit: "pack",
    minLevel: 10,
    location: "Storage Cabinet 102 - Shelf C"
  },
  {
    id: "inv-s4",
    name: "Heavy-Duty Desktop Stapler & 24/6 Staples Kit",
    category: "stationary",
    quantity: 14,
    unit: "set",
    minLevel: 4,
    location: "Storage Cabinet 103 - Shelf A"
  },
  {
    id: "inv-s5",
    name: "Adhesive Sticky Notes 76x76mm (Neon Set)",
    category: "stationary",
    quantity: 60,
    unit: "pad",
    minLevel: 15,
    location: "Storage Cabinet 103 - Shelf B"
  },

  // --- Marketing (Маркетинг, PR и полиграфия) ---
  {
    id: "inv-m1",
    name: "School Roll-Up Banners (Open Day & Admissions)",
    category: "marketing",
    quantity: 4,
    unit: "pcs",
    minLevel: 2,
    location: "Marketing Storage Room B-1"
  },
  {
    id: "inv-m2",
    name: "Branded Welcome Tote Bags & Swag Sets",
    category: "marketing",
    quantity: 120,
    unit: "pcs",
    minLevel: 20,
    location: "Marketing Storage Room B-2"
  },
  {
    id: "inv-m3",
    name: "School Information Brochures & Prospectuses 2026/2027",
    category: "marketing",
    quantity: 350,
    unit: "pcs",
    minLevel: 50,
    location: "Marketing Storage Room B-2"
  },
  {
    id: "inv-m4",
    name: "Event Participant Badges & Branded Lanyards",
    category: "marketing",
    quantity: 200,
    unit: "pcs",
    minLevel: 30,
    location: "Marketing Storage Room B-1"
  },
  {
    id: "inv-m5",
    name: "Promotional Branded Metal Pens with School Logo",
    category: "marketing",
    quantity: 150,
    unit: "pcs",
    minLevel: 25,
    location: "Marketing Storage Room B-3"
  },
  {
    id: "inv-m6",
    name: "Official School Photo Backdrop & Press Wall (3x2.5m)",
    category: "marketing",
    quantity: 2,
    unit: "set",
    minLevel: 1,
    location: "Marketing Storage Room B-4"
  },

  // --- Furniture (Мебель и парты) ---
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
    id: "inv-f4",
    name: "Teacher Presentation Lectern / Mobile Podium",
    category: "furniture",
    quantity: 2,
    unit: "pcs",
    minLevel: 1,
    location: "Facilities Warehouse Block A"
  },
  {
    id: "inv-f5",
    name: "Mobile Magnetic Whiteboard on Wheels (120x90cm)",
    category: "furniture",
    quantity: 5,
    unit: "pcs",
    minLevel: 2,
    location: "Facilities Warehouse Block A"
  },

  // --- Electronics & IT (Электроника и IT) ---
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
    id: "inv-e2",
    name: "USB-C Multi-Port Hub (HDMI, USB 3.0, Ethernet)",
    category: "electronics",
    quantity: 10,
    unit: "pcs",
    minLevel: 4,
    location: "IT Server Room 204"
  },
  {
    id: "inv-e3",
    name: "Wireless Presentation Clicker with Laser Pointer",
    category: "electronics",
    quantity: 6,
    unit: "pcs",
    minLevel: 2,
    location: "IT Server Room 204"
  },

  // --- Cleaning & Hygiene (Хозтовары и чистящие средства) ---
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
    id: "inv-c2",
    name: "Heavy-Duty Waste Bags 120L (Roll of 25)",
    category: "cleaning",
    quantity: 25,
    unit: "roll",
    minLevel: 8,
    location: "Cleaning Depot Basement"
  },
  {
    id: "inv-c3",
    name: "Antibacterial Liquid Soap Refill (5L)",
    category: "cleaning",
    quantity: 8,
    unit: "canister",
    minLevel: 3,
    location: "Cleaning Depot Basement"
  },

  // --- Lab & Science (Лабораторные реактивы и посуда) ---
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
    id: "inv-l2",
    name: "Student Protective Safety Goggles",
    category: "lab",
    quantity: 30,
    unit: "pcs",
    minLevel: 10,
    location: "Science Lab Storage 301"
  },

  // --- Electrical (Электрика и освещение) ---
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
    id: "inv-11",
    name: "Heavy Duty Grounded Wall Sockets (16A 250V)",
    category: "electrical",
    quantity: 20,
    unit: "pcs",
    minLevel: 5,
    location: "Engineering Workshop 106 - Shelf C"
  },

  // --- HVAC & Climate (Кондиционеры и вентиляция) ---
  {
    id: "inv-10",
    name: "Split AC Washable Air Filters & Drain Hose Kit",
    category: "hvac",
    quantity: 6,
    unit: "set",
    minLevel: 2,
    location: "Engineering Workshop 106 - Shelf B"
  }
];

// Auto-seed initial inventory if empty or add missing standard items (migration)
const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
if (invCount === 0) {
  const insertInv = db.prepare(`
    INSERT INTO inventory (id, name, category, quantity, unit, minLevel, location, photos, createdAt, updatedAt)
    VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @photos, @createdAt, @updatedAt)
  `);
  const now = new Date().toISOString();
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertInv.run({
        ...item,
        photos: Array.isArray(item.photos) ? JSON.stringify(item.photos) : (typeof item.photos === 'string' ? item.photos : '[]'),
        createdAt: now,
        updatedAt: now
      });
    }
  });
  insertMany(defaultInventory);
} else {
  // Migration: Ensure newly added categories (like marketing, expanded stationary & furniture) exist
  try {
    const insertOrIgnoreInv = db.prepare(`
      INSERT OR IGNORE INTO inventory (id, name, category, quantity, unit, minLevel, location, photos, createdAt, updatedAt)
      VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @photos, @createdAt, @updatedAt)
    `);
    const now = new Date().toISOString();
    db.transaction((items) => {
      for (const item of items) {
        insertOrIgnoreInv.run({
          ...item,
          photos: Array.isArray(item.photos) ? JSON.stringify(item.photos) : (typeof item.photos === 'string' ? item.photos : '[]'),
          createdAt: now,
          updatedAt: now
        });
      }
    })(defaultInventory);

    // Sanitize any empty category fields
    db.prepare("UPDATE inventory SET category = 'other' WHERE category IS NULL OR category = ''").run();
  } catch (err) {
    console.error('Inventory category migration error:', err.message);
  }
}

// Default passwords for staff roles (memorable, role-based standard credentials)
export const DEFAULT_PASSWORDS = {
  teacher: "teacher123",
  it_support: "it123",
  cleaning: "clean123",
  storage_manager: "storage123",
  facilities_manager: "facilities123",
  director: "admin123",
  engineer: "engineer123"
};

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

// Auto-seed initial users if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (roleKey, id, name, role, department, email, phone, avatar, passwordHash, salt, createdAt, updatedAt)
    VALUES (@roleKey, @id, @name, @role, @department, @email, @phone, @avatar, @passwordHash, @salt, @createdAt, @updatedAt)
  `);
  const now = new Date().toISOString();
  const insertManyUsers = db.transaction((users) => {
    for (const user of users) {
      const rawPassword = DEFAULT_PASSWORDS[user.roleKey] || 'school123';
      const { salt, hash } = hashPassword(rawPassword);
      insertUser.run({
        ...user,
        passwordHash: hash,
        salt,
        createdAt: now,
        updatedAt: now
      });
    }
  });
  insertManyUsers(defaultUsers);
}

// Auto-migration: Ensure all existing users in the database have passwordHash and salt populated
try {
  const usersWithoutPwd = db.prepare("SELECT roleKey FROM users WHERE passwordHash IS NULL OR passwordHash = ''").all();
  if (usersWithoutPwd.length > 0) {
    const updatePwd = db.prepare("UPDATE users SET passwordHash = @passwordHash, salt = @salt WHERE roleKey = @roleKey");
    db.transaction((items) => {
      for (const u of items) {
        const rawPassword = DEFAULT_PASSWORDS[u.roleKey] || 'school123';
        const { salt, hash } = hashPassword(rawPassword);
        updatePwd.run({
          roleKey: u.roleKey,
          passwordHash: hash,
          salt
        });
      }
    })(usersWithoutPwd);
  }
} catch (e) {
  // Ignore migration update error
}

// Helper to reset database to default state
export function resetDatabase() {
  const now = new Date().toISOString();
  db.transaction(() => {
    // Clear tickets, notifications and active sessions
    db.prepare('DELETE FROM tickets').run();
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM sessions').run();

    // Reset inventory to default
    db.prepare('DELETE FROM inventory').run();
    const insertInv = db.prepare(`
      INSERT INTO inventory (id, name, category, quantity, unit, minLevel, location, photos, createdAt, updatedAt)
      VALUES (@id, @name, @category, @quantity, @unit, @minLevel, @location, @photos, @createdAt, @updatedAt)
    `);
    for (const item of defaultInventory) {
      insertInv.run({
        ...item,
        photos: Array.isArray(item.photos) ? JSON.stringify(item.photos) : (typeof item.photos === 'string' ? item.photos : '[]'),
        createdAt: now,
        updatedAt: now
      });
    }

    // Reset users to default with hashed passwords
    db.prepare('DELETE FROM users').run();
    const insertUser = db.prepare(`
      INSERT INTO users (roleKey, id, name, role, department, email, phone, avatar, passwordHash, salt, createdAt, updatedAt)
      VALUES (@roleKey, @id, @name, @role, @department, @email, @phone, @avatar, @passwordHash, @salt, @createdAt, @updatedAt)
    `);
    for (const user of defaultUsers) {
      const rawPassword = DEFAULT_PASSWORDS[user.roleKey] || 'school123';
      const { salt, hash } = hashPassword(rawPassword);
      insertUser.run({
        ...user,
        passwordHash: hash,
        salt,
        createdAt: now,
        updatedAt: now
      });
    }
  })();
}

export default db;
