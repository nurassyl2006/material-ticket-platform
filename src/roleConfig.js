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
    allowedCategories: ['all']
  },
  engineer: {
    key: 'engineer',
    label: 'Maintenance Engineer',
    labelRu: 'Инженер-механик / Электрик',
    labelKk: 'Инженер-механик / Электрик',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: 'Wrench',
    scope: 'Lighting, air conditioning, sockets, heating, ventilation, carpentry & furniture repairs',
    scopeRu: 'Освещение, кондиционеры, розетки, отопление, вентиляция, плотницкие работы и ремонт мебели',
    scopeKk: 'Жарықтандыру, кондиционерлер, розеткалар, жылыту, желдету, ағаш ұсталық жұмыстары мен жиһаз жөндеу',
    canViewStorage: true,
    canManageStock: true,
    allowedCategories: ['electrical', 'hvac', 'furniture', 'other']
  },
  it_support: {
    key: 'it_support',
    label: 'IT Support',
    labelRu: 'IT специалист',
    labelKk: 'IT маманы',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: 'Laptop',
    scope: 'Wi-Fi, laptops, projectors, printers & network issues',
    scopeRu: 'Wi-Fi, ноутбуки, проекторы, принтеры и сетевое оборудование',
    scopeKk: 'Wi-Fi, ноутбуктер, проекторлар, принтерлер және желі',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['electronics', 'stationary', 'other']
  },
  cleaning: {
    key: 'cleaning',
    label: 'Cleaning Staff',
    labelRu: 'Служба клининга',
    labelKk: 'Тазалық қызметі',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: 'Sparkles',
    scope: 'Classroom hygiene, spills, trash removal & sanitation',
    scopeRu: 'Гигиена кабинетов, уборка мусора, разливы и санобработка',
    scopeKk: 'Кабинеттер тазалығы, қоқыс шығару және санитариялық өңдеу',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['cleaning', 'other']
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
    allowedCategories: []
  }
};

/**
 * Get role configuration definition with fallback
 */
export function getRoleDefinition(roleKey, customRoles = {}) {
  const merged = { ...DEFAULT_ROLES, ...customRoles };
  const normalizedKey = roleKey === 'admin' ? 'director' : (roleKey === 'workerA' ? 'storage_manager' : roleKey);
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
    allowedCategories: ['all']
  };
}

/**
 * Check if a role can view warehouse storage / goods catalog
 */
export function canRoleAccessStorage(roleKey, customRoles = {}) {
  if (roleKey === 'director' || roleKey === 'admin') return true;
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
  if (roleKey === 'director' || roleKey === 'admin' || roleKey === 'storage_manager' || roleKey === 'workerA') {
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
  if (roleKey === 'director' || roleKey === 'admin' || roleKey === 'storage_manager' || roleKey === 'workerA') {
    return true;
  }
  const allowed = getRoleAllowedCategories(roleKey, customRoles, allCategories);
  return allowed.includes(categoryId);
}
