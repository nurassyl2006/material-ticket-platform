export const mockInventory = [
  // --- Stationary (Канцелярия - постоянная выдача учителям / расходные) ---
  {
    id: "inv-1",
    name: "Whiteboard Markers Set (Red/Blue/Black)",
    category: "stationary",
    quantity: 45,
    unit: "box",
    minLevel: 10,
    location: "Storage Cabinet 102 - Shelf A",
    isReturnable: false
  },
  {
    id: "inv-2",
    name: "A4 Printing Paper (80gsm)",
    category: "stationary",
    quantity: 18,
    unit: "pack",
    minLevel: 25,
    location: "Storage Cabinet 102 - Shelf B",
    isReturnable: false
  },
  {
    id: "inv-s3",
    name: "Clear Document Folders & Sheet Protectors",
    category: "stationary",
    quantity: 35,
    unit: "pack",
    minLevel: 10,
    location: "Storage Cabinet 102 - Shelf C",
    isReturnable: false
  },
  {
    id: "inv-s5",
    name: "Adhesive Sticky Notes 76x76mm (Neon Set)",
    category: "stationary",
    quantity: 60,
    unit: "pad",
    minLevel: 15,
    location: "Storage Cabinet 103 - Shelf B",
    isReturnable: false
  },

  // --- Temporary Lesson Equipment & Tools (Временная выдача на 1-2 урока / С возвратом) ---
  {
    id: "inv-s4",
    name: "Heavy-Duty Desktop Stapler & 24/6 Staples Kit",
    category: "stationary_loan",
    quantity: 14,
    unit: "set",
    minLevel: 4,
    location: "Storage Cabinet 103 - Shelf A",
    isReturnable: true
  },
  {
    id: "inv-s-clicker",
    name: "Wireless Presentation Clicker & Laser Pointer",
    category: "stationary_loan",
    quantity: 8,
    unit: "pcs",
    minLevel: 2,
    location: "Storage Cabinet 103 - Shelf A",
    isReturnable: true
  },
  {
    id: "inv-s-calc",
    name: "Scientific Calculators Class Set (Casio fx-82)",
    category: "stationary_loan",
    quantity: 30,
    unit: "pcs",
    minLevel: 5,
    location: "Storage Cabinet 103 - Shelf C",
    isReturnable: true
  },
  {
    id: "inv-s-punch",
    name: "Heavy-Duty 2-Hole Desktop Paper Puncher",
    category: "stationary_loan",
    quantity: 10,
    unit: "pcs",
    minLevel: 2,
    location: "Storage Cabinet 103 - Shelf A",
    isReturnable: true
  },
  {
    id: "inv-s-timer",
    name: "Classroom Digital Lesson Timer & Stopwatch",
    category: "stationary_loan",
    quantity: 12,
    unit: "pcs",
    minLevel: 3,
    location: "Storage Cabinet 103 - Shelf B",
    isReturnable: true
  },
  {
    id: "inv-s-globe",
    name: "Demonstration Magnetic Globe & Map Pointer",
    category: "stationary_loan",
    quantity: 4,
    unit: "set",
    minLevel: 1,
    location: "Storage Cabinet 103 - Shelf D",
    isReturnable: true
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

export const mockTickets = [];

export const mockUsers = {
  director: {
    id: "usr-1791719241425-94",
    name: "Nurassyl Maratov",
    role: "director",
    department: "School Operations & Directorate",
    email: "maratov2.2006@gmail.com",
    phone: "+7 777 000 0001",
    avatar: ""
  },
  director_balkan: {
    id: "usr-dir1",
    name: "Balkan Kassimov",
    role: "director",
    department: "School Operations & Directorate",
    email: "b.kassimov@ardingly.edu.kz",
    phone: "+7 701 555 0101",
    avatar: ""
  },
  facilities_manager: {
    id: "usr-fm1",
    name: "Nurassyl Maratov",
    role: "director",
    department: "School Operations & Directorate",
    email: "n.maratov@ardingly.edu.kz",
    phone: "+7 777 000 0001",
    avatar: ""
  },
  storage_manager: {
    id: "usr-w1",
    name: "Storage Manager",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "storage@school.edu",
    phone: "+7 777 000 0002",
    avatar: ""
  },
  workera: {
    id: "usr-1792032287377-880",
    name: "Worker A",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "workera",
    phone: "",
    avatar: ""
  },
  workerb: {
    id: "usr-w2",
    name: "Worker B",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "workerb",
    phone: "",
    avatar: ""
  },
  engineer: {
    id: "usr-eng1",
    name: "Василий (Head of Engineering)",
    role: "engineer",
    department: "Engineering, Electrical & HVAC Utilities",
    email: "engineer@school.edu",
    phone: "+7 777 000 0003",
    avatar: ""
  },
  head_engineer: {
    id: "usr-eng1",
    name: "Василий (Head of Engineering)",
    role: "engineer",
    department: "Engineering, Electrical & HVAC Utilities",
    email: "engineer@school.edu",
    phone: "+7 777 000 0003",
    avatar: ""
  },
  it_support: {
    id: "usr-it1",
    name: "IT Support (Head of IT)",
    role: "it_support",
    department: "Information Technology Support",
    email: "it.support@school.edu",
    phone: "+7 777 000 0004",
    avatar: ""
  },
  cleaning_head: {
    id: "usr-cl-head",
    name: "Акилова Айнур (Head of Cleaning)",
    role: "cleaning_head",
    department: "Campus Hygiene & Sanitization",
    email: "cleaning.head@school.edu",
    phone: "+7 777 000 0008",
    avatar: ""
  },
  cleaning1: {
    id: "usr-cl1",
    name: "Cleaner 1",
    role: "cleaning",
    department: "Campus Hygiene & Sanitization",
    email: "cleaning1",
    phone: "+7 777 000 0005",
    avatar: ""
  },
  cleaning2: {
    id: "usr-cl2",
    name: "Cleaner 2",
    role: "cleaning",
    department: "Campus Hygiene & Sanitization",
    email: "cleaning2",
    phone: "+7 777 000 0007",
    avatar: ""
  },
  cleaning: {
    id: "usr-cl1",
    name: "Cleaner 1",
    role: "cleaning",
    department: "Campus Hygiene & Sanitization",
    email: "cleaning1",
    phone: "+7 777 000 0005",
    avatar: ""
  },
  finance: {
    id: "usr-fin1",
    name: "Head of Finance",
    role: "finance",
    department: "Financial Planning & Accounting",
    email: "finance@school.edu",
    phone: "+7 777 000 0006",
    avatar: ""
  },
  accountant: {
    id: "usr-fin1",
    name: "Head of Finance",
    role: "finance",
    department: "Financial Planning & Accounting",
    email: "finance@school.edu",
    phone: "+7 777 000 0006",
    avatar: ""
  },
  teacher: {
    id: "usr-t1",
    name: "Teacher",
    role: "teacher",
    department: "Mathematics & STEM",
    email: "teacher@school.edu",
    phone: "",
    avatar: ""
  },
  // Legacy aliases
  workerA: {
    id: "usr-1792032287377-880",
    name: "Worker A",
    role: "storage_manager",
    department: "Warehouse & Supplies Management",
    email: "workera",
    phone: "",
    avatar: ""
  },
  admin: {
    id: "usr-dir1",
    name: "Balkan Kassimov",
    role: "director",
    department: "School Operations & Directorate",
    email: "b.kassimov@ardingly.edu.kz",
    phone: "",
    avatar: ""
  }
};

