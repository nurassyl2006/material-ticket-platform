/**
 * School Operations Role & Task Permissions Specification
 * Defines standard campus roles, their responsibilities (tasks),
 * and granular storage access rules (whether they can see warehouse storage and which categories).
 */

export const DEFAULT_ROLES = {
  director: {
    key: 'director',
    label: 'Director',
    labelRu: 'Директор (Полный доступ)',
    labelKk: 'Директор (Толық қолжетімділік)',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.15)',
    border: 'rgba(129, 140, 248, 0.35)',
    icon: 'Crown',
    scope: 'All departments, analytics, budget, staff & role assignments',
    scopeRu: 'Все отделы, аналитика, распределение ролей и контроль школы',
    scopeKk: 'Барлық бөлімдер, аналитика, рөлдерді тағайындау және бақылау',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  facilities_manager: {
    key: 'facilities_manager',
    label: 'Facilities Manager',
    labelRu: 'Менеджер АХЧ',
    labelKk: 'АХЧ менеджері',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.15)',
    border: 'rgba(167, 139, 250, 0.35)',
    icon: 'Truck',
    scope: 'Furniture relocation, classrooms, general repairs & logistics',
    scopeRu: 'Перемещение мебели, подготовка кабинетов и общие ремонты',
    scopeKk: 'Жиһазды жылжыту, кабинеттерді дайындау және жалпы жөндеу',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  storage_manager: {
    key: 'storage_manager',
    label: 'Storage Manager',
    labelRu: 'Заведующий складом',
    labelKk: 'Қойма меңгерушісі',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    icon: 'Package',
    scope: 'Warehouse inventory stock deduction, loans & purchasing',
    scopeRu: 'Учет и списание товаров на складе, закупка и выдача материалов',
    scopeKk: 'Қоймадағы тауарлар есебі, сатып алу және заттарды беру',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  head_engineer: {
    key: 'head_engineer',
    label: 'Head of Engineering',
    labelRu: 'Главный инженер',
    labelKk: 'Бас инженер',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.15)',
    border: 'rgba(234, 88, 12, 0.35)',
    icon: 'Wrench',
    scope: 'Supervision of maintenance technicians, heating, ventilation, power grids, and facilities engineering SLA',
    scopeRu: 'Руководство инженерной службой, электросети, вентиляция, отопление, распределение нарядов и контроль SLA',
    scopeKk: 'Инженерлік қызметті басқару, электр желілері, желдету, жылыту, тапсырмаларды бөлу және SLA бақылау',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  engineer: {
    key: 'engineer',
    label: 'Maintenance Engineer',
    labelRu: 'Инженер-электрик / Техник',
    labelKk: 'Инженер-электрик / Техник',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: 'Wrench',
    scope: 'Lighting, air conditioning, sockets, heating, ventilation, carpentry & furniture repairs',
    scopeRu: 'Освещение, кондиционеры, розетки, отопление, вентиляция, плотницкие работы и ремонт мебели',
    scopeKk: 'Жарықтандыру, кондиционерлер, розеткалар, жылыту, желдету, ағаш ұсталық жұмыстары мен жиһаз жөндеу',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['electrical', 'hvac', 'furniture', 'other']
  },
  finance: {
    key: 'finance',
    label: 'Head of Finance',
    labelRu: 'Главный финансист',
    labelKk: 'Бас қаржыгер',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: 'DollarSign',
    scope: 'Asset auditing, material expenditure approvals, supplier invoices & everyday financial operations',
    scopeRu: 'Аудит материальных ценностей, согласование закупок, счетов и ежедневный финансовый контроль',
    scopeKk: 'Материалдық құндылықтар аудиті, сатып алуды мақұлдау, шот-фактуралар және күнделікті қаржылық бақылау',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  accountant: {
    key: 'accountant',
    label: 'Accountant / Bursar',
    labelRu: 'Бухгалтерия / Финансист',
    labelKk: 'Бухгалтер / Қаржыгер',
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.15)',
    border: 'rgba(13, 148, 136, 0.35)',
    icon: 'DollarSign',
    scope: 'Asset auditing, material expenditure approvals, supplier invoice reconciliation, and inventory write-off reviews',
    scopeRu: 'Аудит материальных ценностей, согласование закупок, сверка счетов поставщиков и списание инвентаря',
    scopeKk: 'Материалдық құндылықтар аудиті, сатып алуды мақұлдау, шот-фактураларды салыстыру және мүлікті есептен шығару',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  it_head: {
    key: 'it_head',
    label: 'Head of IT',
    labelRu: 'Руководитель IT',
    labelKk: 'IT жетекшісі',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.15)',
    border: 'rgba(2, 132, 199, 0.35)',
    icon: 'Laptop',
    scope: 'IT infrastructure, server networks, security policies, campus hardware procurement and helpdesk oversight',
    scopeRu: 'IT-инфраструктура, безопасность сети, закупка оборудования, школьные системы и руководство IT службой',
    scopeKk: 'IT-инфрақұрылым, желі қауіпсіздігі, жабдықтарды сатып алу және IT қызметін басқару',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['all']
  },
  it_support: {
    key: 'it_support',
    label: 'IT Support Specialist',
    labelRu: 'Специалист IT-поддержки',
    labelKk: 'IT қолдау маманы',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: 'Laptop',
    scope: 'Wi-Fi, laptops, projectors, printers & network issues',
    scopeRu: 'Wi-Fi, ноутбуки, проекторы, принтеры и сетевое оборудование',
    scopeKk: 'Wi-Fi, ноутбуктер, проекторлар, принтерлер және желі',
    canViewStorage: true,
    canManageStock: false,
    canViewDailyDigest: true,
    allowedCategories: ['electronics', 'stationary', 'other']
  },
  cleaning_head: {
    key: 'cleaning_head',
    label: 'Head of Cleaning',
    labelRu: 'Заведующая клинингом / Бригадир',
    labelKk: 'Тазалық қызметінің жетекшісі',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.15)',
    border: 'rgba(5, 150, 105, 0.35)',
    icon: 'Sparkles',
    scope: 'Supervision of cleaning staff, sanitization reports, daily campus cleanliness inspections',
    scopeRu: 'Руководство клининговой службой, отчеты о санобработке и ежедневный контроль чистоты',
    scopeKk: 'Тазалық қызметін басқару, санитарлық есептер және кампус тазалығын күнделікті тексеру',
    canViewStorage: true,
    canManageStock: true,
    canViewDailyDigest: true,
    allowedCategories: ['cleaning', 'other', 'all']
  },
  cleaning: {
    key: 'cleaning',
    label: 'Cleaning Staff',
    labelRu: 'Служба клининга / Уборщик',
    labelKk: 'Тазалық қызметі / Еден жуушы',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: 'Sparkles',
    scope: 'Classroom hygiene, spills, trash removal & sanitation',
    scopeRu: 'Гигиена кабинетов, уборка мусора, разливы и санобработка',
    scopeKk: 'Кабинеттер тазалығы, қоқыс шығару және санитариялық өңдеу',
    canViewStorage: true,
    canManageStock: false,
    canViewDailyDigest: true,
    allowedCategories: ['cleaning', 'other']
  },
  security_head: {
    key: 'security_head',
    label: 'Head of Security',
    labelRu: 'Начальник службы безопасности',
    labelKk: 'Күзет қызметінің бастығы',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.15)',
    border: 'rgba(225, 29, 72, 0.35)',
    icon: 'ShieldCheck',
    scope: 'Campus perimeter security, entrance gates access control, safety protocols, and emergency response',
    scopeRu: 'Пропускной режим кампуса, охрана периметра, протоколы безопасности и реагирование на инциденты',
    scopeKk: 'Кампустың кіру режимі, периметрді қорғау, қауіпсіздік хаттамалары және оқиғаларға әрекет ету',
    canViewStorage: true,
    canManageStock: false,
    canViewDailyDigest: true,
    allowedCategories: ['other']
  },
  teacher: {
    key: 'teacher',
    label: 'Teacher / Staff',
    labelRu: 'Учитель / Преподаватель',
    labelKk: 'Мұғалім / Оқытушы',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.35)',
    icon: 'GraduationCap',
    scope: 'Submits problem requests across all departments, orders stationery',
    scopeRu: 'Подача заявок во все отделы, заказ канцтоваров на урок',
    scopeKk: 'Барлық бөлімдерге өтініш беру, сабаққа кеңсе тауарларын тапсырыс ету',
    canViewStorage: true,
    canManageStock: false,
    canViewDailyDigest: false,
    allowedCategories: ['stationary', 'stationary_loan'] // Teachers restricted to stationery & lesson loans
  },
  parent: {
    key: 'parent',
    label: 'Parent',
    labelRu: 'Родитель',
    labelKk: 'Ата-ана',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.35)',
    icon: 'Users',
    scope: 'Feedback, campus safety & observation requests',
    scopeRu: 'Обратная связь, вопросы безопасности и благоустройства',
    scopeKk: 'Кері байланыс, қауіпсіздік және абаттандыру сұрақтары',
    canViewStorage: false,
    canManageStock: false,
    canViewDailyDigest: false,
    allowedCategories: []
  },
  guest: {
    key: 'guest',
    label: 'Guest / Visitor',
    labelRu: 'Гость / Посетитель',
    labelKk: 'Қонақ / Келуші',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.15)',
    border: 'rgba(100, 116, 139, 0.35)',
    icon: 'Compass',
    scope: 'Campus visitor assistance requests',
    scopeRu: 'Запросы посетителей и гостей кампуса',
    scopeKk: 'Кампус қонақтары мен келушілер сұраныстары',
    canViewStorage: false,
    canManageStock: false,
    canViewDailyDigest: false,
    allowedCategories: []
  }
};

/**
 * Get role configuration definition with fallback
 */
export function getRoleDefinition(roleKey, customRoles = {}) {
  const merged = { ...DEFAULT_ROLES, ...customRoles };
  const normalizedKey = roleKey === 'admin' ? 'director' 
    : (roleKey === 'workerA' || roleKey === 'workerB' ? 'storage_manager' 
    : (roleKey === 'head_it' ? 'it_head' 
    : (roleKey === 'security' ? 'security_head' 
    : roleKey)));
  return merged[normalizedKey] || merged[roleKey] || {
    key: roleKey,
    label: roleKey,
    labelRu: roleKey,
    labelKk: roleKey,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.35)',
    icon: 'Users',
    scope: 'Custom operational staff role',
    scopeRu: 'Пользовательская роль персонала',
    scopeKk: 'Қызметкерлердің арнайы рөлі',
    canViewStorage: true,
    canManageStock: false,
    canViewDailyDigest: Boolean(customRoles[roleKey]?.canViewDailyDigest),
    allowedCategories: ['all']
  };
}

/**
 * Check if a role can view everyday report / executive daily ticket digest
 * Main engineer, head of cleaning, head of storage, head of IT, head of finance, director, facilities manager, and roles with explicit permission
 */
export function canRoleAccessDailyDigest(roleKey, customRoles = {}) {
  if ([
    'director', 'admin', 'head_engineer', 'engineer', 'storage_manager',
    'workerA', 'workerB', 'facilities_manager', 'finance', 'accountant',
    'cleaning_head', 'cleaning', 'it_support', 'it_head', 'head_it', 'security_head', 'security'
  ].includes(roleKey)) {
    return true;
  }
  const def = getRoleDefinition(roleKey, customRoles);
  return Boolean(def?.canViewDailyDigest);
}

/**
 * Check if a role can view warehouse storage / goods catalog
 */
export function canRoleAccessStorage(roleKey, customRoles = {}) {
  if ([
    'director', 'admin', 'finance', 'accountant', 'head_engineer', 
    'storage_manager', 'workerA', 'workerB', 'facilities_manager', 
    'it_head', 'cleaning_head'
  ].includes(roleKey)) return true;
  const def = getRoleDefinition(roleKey, customRoles);
  return Boolean(def.canViewStorage);
}

/**
 * Check if a role can manage stock (deduct quantities, edit items, add items, confirm returns)
 */
export function canRoleManageStock(roleKey, customRoles = {}) {
  if (roleKey === 'director' || roleKey === 'admin') return true;
  const def = getRoleDefinition(roleKey, customRoles);
  return Boolean(def.canManageStock);
}

/**
 * Get the list of allowed storage category IDs for a role
 */
export function getRoleAllowedCategories(roleKey, customRoles = {}, allCategories = []) {
  if ([
    'director', 'admin', 'storage_manager', 'workerA', 'workerB', 
    'finance', 'accountant', 'head_engineer', 'it_head', 'facilities_manager'
  ].includes(roleKey)) {
    return allCategories.map(c => c.id || c.key);
  }
  const def = getRoleDefinition(roleKey, customRoles);
  if (!def.canViewStorage) return [];

  const allowed = def.allowedCategories || [];
  if (allowed.includes('all')) {
    return allCategories.map(c => c.id || c.key);
  }
  return allowed;
}

/**
 * Check if a specific category is permitted for a role
 */
export function isCategoryAllowedForRole(categoryId, roleKey, customRoles = {}, allCategories = []) {
  if ([
    'director', 'admin', 'storage_manager', 'workerA', 'workerB', 
    'finance', 'accountant', 'head_engineer', 'it_head', 'facilities_manager'
  ].includes(roleKey)) {
    return true;
  }
  const allowed = getRoleAllowedCategories(roleKey, customRoles, allCategories);
  return allowed.includes(categoryId);
}
