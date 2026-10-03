import db from './db.js';

console.log('\n========================================');
console.log('   EDUOPS SQLITE DATABASE INSPECTOR');
console.log('========================================\n');

// 1. Table Summary
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log('📊 TABLES & RECORD COUNTS:');
tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get().count;
  console.log(`  • ${t.name.padEnd(16)} : ${count} rows`);
});

// 2. Tickets
console.log('\n🎫 TICKETS (tickets table):');
const tickets = db.prepare(`
  SELECT id, itemTitle, department, urgency, status, teacherName, createdAt 
  FROM tickets 
  ORDER BY createdAt DESC 
  LIMIT 10
`).all();

if (tickets.length === 0) {
  console.log('  (No tickets found)');
} else {
  console.table(tickets);
}

// 3. Inventory / Goods
console.log('\n📦 STORAGE / INVENTORY (inventory table):');
const inventory = db.prepare(`
  SELECT id, name, category, quantity, unit, minLevel, location 
  FROM inventory 
  ORDER BY category ASC, name ASC
`).all();

if (inventory.length === 0) {
  console.log('  (No inventory items found)');
} else {
  console.table(inventory);
}

// 4. Users
console.log('\n👥 USERS & ROLES (users table):');
const users = db.prepare(`
  SELECT roleKey, name, role, department, email, phone 
  FROM users
`).all();

if (users.length === 0) {
  console.log('  (No users found)');
} else {
  console.table(users);
}

// 5. Notifications
console.log('\n🔔 RECENT NOTIFICATIONS (notifications table):');
const notifications = db.prepare(`
  SELECT id, recipientName, title, message, status, read, createdAt 
  FROM notifications 
  ORDER BY createdAt DESC 
  LIMIT 5
`).all();

if (notifications.length === 0) {
  console.log('  (No notifications found)');
} else {
  console.table(notifications);
}

console.log('\n========================================\n');
