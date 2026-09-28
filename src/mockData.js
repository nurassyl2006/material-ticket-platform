export const mockInventory = [
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

export const mockTickets = [];

export const mockUsers = {
  teacher: {
    id: "usr-t1",
    name: "Teacher",
    role: "teacher",
    department: "Mathematics & STEM",
    email: "teacher@school.edu",
    phone: "",
    avatar: ""
  },
  it_support: {
    id: "usr-it1",
    name: "IT Support",
    role: "it_support",
    department: "Information Technology Support",
    email: "it.support@school.edu",
    phone: "",
    avatar: ""
  },
  cleaning: {
    id: "usr-cl1",
    name: "Cleaning Staff",
    role: "cleaning",
    department: "Campus Hygiene & Sanitization",
    email: "cleaning@school.edu",
    phone: "",
    avatar: ""
  },
  storage_manager: {
    id: "usr-w1",
    name: "Storage Manager",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "storage@school.edu",
    phone: "",
    avatar: ""
  },
  facilities_manager: {
    id: "usr-fm1",
    name: "Facilities Manager",
    role: "facilities_manager",
    department: "Facilities & Logistics",
    email: "facilities@school.edu",
    phone: "",
    avatar: ""
  },
  director: {
    id: "usr-dir1",
    name: "Director",
    role: "director",
    department: "School Operations & Directorate",
    email: "director@school.edu",
    phone: "",
    avatar: ""
  },
  engineer: {
    id: "usr-eng1",
    name: "Engineer",
    role: "engineer",
    department: "Engineering, Electrical & HVAC Utilities",
    email: "engineer@school.edu",
    phone: "",
    avatar: ""
  },
  // Legacy aliases
  workerA: {
    id: "usr-w1",
    name: "Storage Manager",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "storage@school.edu",
    phone: "",
    avatar: ""
  },
  admin: {
    id: "usr-dir1",
    name: "Director",
    role: "director",
    department: "School Operations & Directorate",
    email: "director@school.edu",
    phone: "",
    avatar: ""
  }
};

