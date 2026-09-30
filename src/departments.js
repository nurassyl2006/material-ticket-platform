/**
 * Core School Operations Departments & Subcategories Specification
 * Synchronized with BI Education and School Operations Helpdesk Standards.
 */

export const DEPARTMENTS = {
  "it_helpdesk": {
    id: "it_helpdesk",
    key: "it_helpdesk",
    name: "IT Helpdesk",
    emoji: "💻",
    color: "#38bdf8",
    translations: {
      en: "IT Helpdesk",
      ru: "IT Helpdesk",
      kk: "IT Helpdesk"
    },
    subcategories: [
      "Сброс пароля",
      "Проблема с ноутбуком",
      "Проблема с принтером",
      "Проблема с интерактивной доской",
      "Не работает интернет/Wi-Fi",
      "Не работает проектор",
      "Проблема с колонками/микрофоном",
      "Не работает школьный сайт/электронный журнал",
      "Создание СКУД карты",
      "Прочее"
    ]
  },
  "plumbing": {
    id: "plumbing",
    key: "plumbing",
    name: "Сантехнические работы",
    emoji: "🔧",
    color: "#06b6d4",
    translations: {
      en: "Plumbing Works",
      ru: "Сантехнические работы",
      kk: "Сантехникалық жұмыстар"
    },
    subcategories: [
      "Засор в унитазе/раковине",
      "Протекает смеситель/труба",
      "Протекает унитаз",
      "Кнопка слива не работает",
      "Нет горячей/холодной воды",
      "Запах из канализации",
      "Не работает полотенцесушитель",
      "Проблемы с системой отопления (холодные батареи)",
      "Проблемы с системой отопления (текут батареи)",
      "Прочее"
    ]
  },
  "electrical": {
    id: "electrical",
    key: "electrical",
    name: "Электротехнические работы",
    emoji: "💡",
    color: "#fbbf24",
    translations: {
      en: "Electrical Works",
      ru: "Электротехнические работы",
      kk: "Электротехникалық жұмыстар"
    },
    subcategories: [
      "Отсутствует электричество в кабинете",
      "Сгорела/мигает лампа",
      "Не работает розетка/выключатель",
      "Не работает звонок",
      "Проблемы с освещением в коридоре",
      "Не работает электрический чайник/микроволновка",
      "Проблемы с системой пожарной сигнализации",
      "Прочее"
    ]
  },
  "carpentry": {
    id: "carpentry",
    key: "carpentry",
    name: "Плотницкие работы",
    emoji: "🪚",
    color: "#f97316",
    translations: {
      en: "Carpentry & Furniture",
      ru: "Плотницкие работы",
      kk: "Ағаш ұсталық жұмыстары"
    },
    subcategories: [
      "Ремонт мебели (стул, стол, шкаф)",
      "Регулировка/ремонт двери",
      "Ремонт ручки окна",
      "Расшаталась/сломалась вешалка",
      "Ремонт доски/полки",
      "Крепление карниза/штор",
      "Проблемы с окнами (не закрывается, сквозит)",
      "Прочее"
    ]
  },
  "cleaning": {
    id: "cleaning",
    key: "cleaning",
    name: "Уборка школы",
    emoji: "🧹",
    color: "#34d399",
    translations: {
      en: "School Cleaning",
      ru: "Уборка школы",
      kk: "Мектепті тазалау"
    },
    subcategories: [
      "Уборка кабинета",
      "Уборка санузла",
      "Уборка в холле/коридоре",
      "Вынос мусора",
      "Мойка окон",
      "Чистка ковровых покрытий",
      "Уборка после ремонта/мероприятия",
      "Прочее"
    ]
  },
  "event_prep": {
    id: "event_prep",
    key: "event_prep",
    name: "Подготовка помещений и оборудования",
    emoji: "🎭",
    color: "#a78bfa",
    translations: {
      en: "Room & Equipment Preparation",
      ru: "Подготовка помещений и оборудования",
      kk: "Бөлмелер мен құралдарды дайындау"
    },
    subcategories: [
      "Подготовка актового зала/помещения",
      "Установка звукового оборудования",
      "Установка проекционного оборудования",
      "Прочее"
    ]
  },
  "grounds": {
    id: "grounds",
    key: "grounds",
    name: "Благоустройство территории",
    emoji: "🌳",
    color: "#10b981",
    translations: {
      en: "Campus & Grounds Maintenance",
      ru: "Благоустройство территории",
      kk: "Аумақты абаттандыру"
    },
    subcategories: [
      "Уборка снега с дорожек",
      "Уборка снега с крыльца/ступеней",
      "Посыпка дорожек песком/солью (гололед)",
      "Уборка льда с тротуаров",
      "Очистка крыши от сосулек/снега",
      "Расчистка подъездных путей",
      "Прочее"
    ]
  },
  "security": {
    id: "security",
    key: "security",
    name: "Вопросы охраны",
    emoji: "🚨",
    color: "#f87171",
    translations: {
      en: "Campus Security",
      ru: "Вопросы охраны",
      kk: "Күзет мәселелері"
    },
    subcategories: [
      "Вызвать охрану",
      "Проблемы с камерами видеонаблюдения",
      "Доступ в помещение (забыл ключ)",
      "Подозрительные лица на территории",
      "Проблемы с турникетом",
      "Утеря/кража вещей",
      "Неисправность системы контроля доступа",
      "Прочее"
    ]
  },
  "admin": {
    id: "admin",
    key: "admin",
    name: "Администрация",
    emoji: "🏢",
    color: "#818cf8",
    translations: {
      en: "Administration",
      ru: "Администрация",
      kk: "Әкімшілік"
    },
    subcategories: [
      "Вопросы к директору",
      "Вопросы к завхозу",
      "Запрос документов/справок",
      "Вопросы по аренде помещений",
      "Прочее"
    ]
  },
  "bi_education": {
    id: "bi_education",
    key: "bi_education",
    name: "Обращение в BI Education",
    emoji: "📩",
    color: "#ec4899",
    translations: {
      en: "BI Education Appeals",
      ru: "Обращение в BI Education",
      kk: "BI Education-ға жүгіну"
    },
    subcategories: [
      "Прочее"
    ]
  },
  "other": {
    id: "other",
    key: "other",
    name: "Прочее/Другие работы",
    emoji: "📋",
    color: "#94a3b8",
    translations: {
      en: "Other / General Works",
      ru: "Прочее/Другие работы",
      kk: "Басқа жұмыстар"
    },
    subcategories: [
      "Доставка воды куллерам",
      "Другая проблема",
      "Неопределенная категория"
    ]
  }
};

// Aliases for backward compatibility with legacy tickets
export const DEPARTMENT_ALIASES = {
  "it": "it_helpdesk",
  "engineering": "electrical",
  "facilities": "carpentry",
  "storage": "other",
  "IT Helpdesk": "it_helpdesk",
  "Сантехнические работы": "plumbing",
  "Электротехнические работы": "electrical",
  "Плотницкие работы": "carpentry",
  "Уборка школы": "cleaning",
  "Подготовка помещений и оборудования": "event_prep",
  "Благоустройство территории": "grounds",
  "Вопросы охраны": "security",
  "Администрация": "admin",
  "Обращение в BI Education": "bi_education",
  "Прочее/Другие работы": "other"
};

/**
 * Resolve any department identifier (ID, Russian name, legacy alias)
 */
export function resolveDepartment(rawId) {
  if (!rawId) return DEPARTMENTS.other;
  if (DEPARTMENTS[rawId]) return DEPARTMENTS[rawId];
  const alias = DEPARTMENT_ALIASES[rawId];
  if (alias && DEPARTMENTS[alias]) return DEPARTMENTS[alias];
  return DEPARTMENTS.other;
}

/**
 * Get department list with localized name
 */
export function getDepartmentsList(lang = 'ru') {
  return Object.values(DEPARTMENTS).map(d => ({
    ...d,
    label: d.translations?.[lang] || d.translations?.ru || d.name
  }));
}
