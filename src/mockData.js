export const mockInventory = [
  {
    id: "inv-1",
    name: "Whiteboard Markers Set (Red/Blue/Black)",
    category: "stationary",
    quantity: 45,
    unit: "box",
    minLevel: 10,
    location: "Cabinet 102 - Shelf A"
  },
  {
    id: "inv-2",
    name: "A4 Printing Paper (80gsm)",
    category: "stationary",
    quantity: 18,
    unit: "pack",
    minLevel: 25,
    location: "Cabinet 102 - Shelf B"
  },
  {
    id: "inv-3",
    name: "HDMI to VGA Adapter Cable",
    category: "electronics",
    quantity: 8,
    unit: "pcs",
    minLevel: 5,
    location: "IT Store Room 204"
  },
  {
    id: "inv-4",
    name: "Chemistry Test Tubes Set",
    category: "lab",
    quantity: 12,
    unit: "set",
    minLevel: 5,
    location: "Lab Storage Room 301"
  },
  {
    id: "inv-5",
    name: "Ergonomic Student Chairs",
    category: "furniture",
    quantity: 0,
    unit: "pcs",
    minLevel: 4,
    location: "Main Warehouse B"
  },
  {
    id: "inv-6",
    name: "Disinfectant Surface Wipes",
    category: "cleaning",
    quantity: 3,
    unit: "pack",
    minLevel: 10,
    location: "Maintenance Depot"
  }
];

export const mockTickets = [
  {
    id: "TCK-1001",
    itemTitle: "A4 Printing Paper (80gsm)",
    category: "stationary",
    quantity: 3,
    unit: "pack",
    urgency: "medium",
    roomNumber: "Room 304 - Math Dept",
    description: "Required for printing mid-term test worksheets for 9th grade students.",
    teacherName: "Aigul Nurlan",
    teacherPhone: "+7 (777) 234-5678",
    status: "issued", // issued (given by Worker A from stock)
    assignedWorker: "Worker A (Kairat)",
    handledAction: "issued",
    notes: "Provided 3 packs directly from Cabinet 102.",
    createdAt: "2026-08-19T09:30:00Z",
    updatedAt: "2026-08-19T10:15:00Z"
  },
  {
    id: "TCK-1002",
    itemTitle: "Interactive Smartboard Stylus Pen",
    category: "electronics",
    quantity: 2,
    unit: "pcs",
    urgency: "high",
    roomNumber: "Room 108 - Physics Lab",
    description: "The existing interactive whiteboard pens are missing tip sensitivity.",
    teacherName: "Sergey Ivanov",
    teacherPhone: "+7 (701) 987-6543",
    status: "purchasing", // purchasing (Worker A buying it)
    assignedWorker: "Worker A (Kairat)",
    handledAction: "purchased",
    purchaseCost: 18500,
    supplier: "Sulpak Electronics / Technodom",
    notes: "Item not in current school stock. Ordered from official supplier, ETA 24h.",
    createdAt: "2026-08-20T08:10:00Z",
    updatedAt: "2026-08-20T11:00:00Z"
  },
  {
    id: "TCK-1003",
    itemTitle: "Whiteboard Markers Set (Red/Blue/Black)",
    category: "stationary",
    quantity: 2,
    unit: "box",
    urgency: "low",
    roomNumber: "Room 215 - History",
    description: "Markers in room 215 are running dry.",
    teacherName: "Elena Petrova",
    teacherPhone: "+7 (705) 555-1234",
    status: "pending",
    assignedWorker: null,
    createdAt: "2026-08-20T12:00:00Z",
    updatedAt: "2026-08-20T12:00:00Z"
  }
];

export const mockUsers = {
  teacher: {
    id: "usr-t1",
    name: "Aigul Nurlan",
    role: "teacher",
    department: "Mathematics & STEM",
    email: "aigul.nurlan@school.edu",
    phone: "+7 (777) 234-5678",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  workerA: {
    id: "usr-w1",
    name: "Kairat Smagulov",
    role: "workerA",
    department: "Logistics & Procurement",
    email: "kairat.workerA@school.edu",
    phone: "+7 (702) 444-8899",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  },
  admin: {
    id: "usr-adm",
    name: "School Operations Director",
    role: "admin",
    department: "Administration",
    email: "admin@school.edu",
    phone: "+7 (700) 111-0000",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
  }
};

