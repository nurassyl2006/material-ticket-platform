/**
 * Core School Operations Departments & Subcategories Specification
 * Synchronized with BI Education and School Operations Helpdesk Standards.
 * Fully localized across English, Russian, and Kazakh to enable seamless
 * communication between English-speaking teachers and Russian/Kazakh-speaking engineers.
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
    ],
    subcategoriesLocalized: {
      en: [
        "Password reset",
        "Laptop issue",
        "Printer issue",
        "Interactive whiteboard / Smartboard",
        "Internet / Wi-Fi disconnected",
        "Projector not working",
        "Speakers / Microphone issue",
        "School portal / Gradebook not loading",
        "RFID keycard / Access card issue",
        "Other IT issue"
      ],
      ru: [
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
      ],
      kk: [
        "Құпиясөзді қалпына келтіру",
        "Ноутбук мәселесі",
        "Принтер мәселесі",
        "Интерактивті тақта мәселесі",
        "Интернет/Wi-Fi жұмыс істемейді",
        "Проектор жұмыс істемейді",
        "Динамиктер/микрофон мәселесі",
        "Мектеп сайты/электронды журнал істемейді",
        "СКУД картасын жасау",
        "Басқа IT мәселесі"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Clogged toilet / sink",
        "Leaking faucet / pipe",
        "Toilet bowl leaking",
        "Flush button broken / not flushing",
        "No hot / cold water",
        "Sewage odor in restroom",
        "Towel warmer not heating",
        "Heating problem (radiators cold)",
        "Heating problem (radiators leaking)",
        "Other plumbing issue"
      ],
      ru: [
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
      ],
      kk: [
        "Әжетхана/раковина бітелуі",
        "Шүмек/құбыр ағуы",
        "Әжетхананың ағуы",
        "Ағызу түймесі істемейді",
        "Ыстық/суық су жоқ",
        "Кәріз иісі шығады",
        "Сүлгі кептіргіш жұмыс істемейді",
        "Жылыту мәселесі (салқын батареялар)",
        "Жылыту мәселесі (батареядан су ағу)",
        "Басқа сантехникалық жұмыс"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "No electricity in classroom / power outage",
        "Light bulb burned out / flickering",
        "Wall socket / light switch not working",
        "School bell not working",
        "Hallway / corridor lighting issue",
        "Appliance not working (kettle / microwave)",
        "Fire alarm system issue",
        "Other electrical issue"
      ],
      ru: [
        "Отсутствует электричество в кабинете",
        "Сгорела/мигает лампа",
        "Не работает розетка/выключатель",
        "Не работает звонок",
        "Проблемы с освещением в коридоре",
        "Не работает электрический чайник/микроволновка",
        "Проблемы с системой пожарной сигнализации",
        "Прочее"
      ],
      kk: [
        "Кабинетте жарық/электр жоқ",
        "Шам күйіп кетті/жыпылықтайды",
        "Розетка/қосқыш жұмыс істемейді",
        "Мектеп қоңырауы жұмыс істемейді",
        "Дәліздегі жарықтандыру мәселесі",
        "Электр шәйнегі/микротолқынды пеш істемейді",
        "Өрт дабылы жүйесінің мәселесі",
        "Басқа электротехникалық жұмыс"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Furniture repair (chair, desk, closet)",
        "Door adjustment / repair",
        "Window handle repair",
        "Coat rack / hook loose or broken",
        "Blackboard / shelf repair",
        "Curtain rod / blinds mounting",
        "Window won't close / draft",
        "Other carpentry issue"
      ],
      ru: [
        "Ремонт мебели (стул, стол, шкаф)",
        "Регулировка/ремонт двери",
        "Ремонт ручки окна",
        "Расшаталась/сломалась вешалка",
        "Ремонт доски/полки",
        "Крепление карниза/штор",
        "Проблемы с окнами (не закрывается, сквозит)",
        "Прочее"
      ],
      kk: [
        "Жиһаз жөндеу (орындық, үстел, шкаф)",
        "Есікті реттеу/жөндеу",
        "Терезе тұтқасын жөндеу",
        "Киім ілгіш босаған/сынған",
        "Тақта/сөрені жөндеу",
        "Карниз/пердені бекіту",
        "Терезе жабылмайды/жел соғады",
        "Басқа ұсталық жұмыс"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Classroom cleaning",
        "Restroom sanitization / cleaning",
        "Corridor / hallway cleaning",
        "Trash / waste removal",
        "Window washing",
        "Carpet vacuuming / cleaning",
        "Post-event / post-repair cleanup",
        "Other cleaning request"
      ],
      ru: [
        "Уборка кабинета",
        "Уборка санузла",
        "Уборка в холле/коридоре",
        "Вынос мусора",
        "Мойка окон",
        "Чистка ковровых покрытий",
        "Уборка после ремонта/мероприятия",
        "Прочее"
      ],
      kk: [
        "Кабинетті тазалау",
        "Әжетхананы тазалау",
        "Дәлізді/холлды тазалау",
        "Қоқыс шығару",
        "Терезе жуу",
        "Кілемдерді тазалау",
        "Шарадан/жөндеуден кейінгі тазалық",
        "Басқа тазалық жұмысы"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Assembly hall / room preparation",
        "Sound & speaker equipment setup",
        "Projector & screen setup",
        "Other event prep"
      ],
      ru: [
        "Подготовка актового зала/помещения",
        "Установка звукового оборудования",
        "Установка проекционного оборудования",
        "Прочее"
      ],
      kk: [
        "Акт залын/бөлмені дайындау",
        "Дыбыстық құралдарды орнату",
        "Проекциялық құралдарды орнату",
        "Басқа дайындық жұмысы"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Snow shoveling on pathways",
        "Porch / stairs snow clearing",
        "De-icing / spreading salt & sand",
        "Ice chipping on sidewalks",
        "Icicle / roof snow clearing",
        "Driveway & parking clearing",
        "Other grounds maintenance"
      ],
      ru: [
        "Уборка снега с дорожек",
        "Уборка снега с крыльца/ступеней",
        "Посыпка дорожек песком/солью (гололед)",
        "Уборка льда с тротуаров",
        "Очистка крыши от сосулек/снега",
        "Расчистка подъездных путей",
        "Прочее"
      ],
      kk: [
        "Жолдардағы қарды тазалау",
        "Баспалдақтан қар тазалау",
        "Мұзға тұз/құм себу (көктайғақ)",
        "Тротуардағы мұзды жою",
        "Шатырдан мұз/қар түсіру",
        "Көлік жолдарын қардан тазарту",
        "Басқа абаттандыру жұмысы"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Call security guard",
        "CCTV security camera issue",
        "Room access / forgot keys",
        "Suspicious individuals on campus",
        "Entrance turnstile barrier issue",
        "Lost and found / missing item",
        "Access control system failure",
        "Other security request"
      ],
      ru: [
        "Вызвать охрану",
        "Проблемы с камерами видеонаблюдения",
        "Доступ в помещение (забыл ключ)",
        "Подозрительные лица на территории",
        "Проблемы с турникетом",
        "Утеря/кража вещей",
        "Неисправность системы контроля доступа",
        "Прочее"
      ],
      kk: [
        "Күзетті шақыру",
        "Бейнебақылау камерасы мәселесі",
        "Бөлмеге кіру (кілтті ұмыттым)",
        "Аумақтағы күдікті адамдар",
        "Турникет мәселесі",
        "Заттың жоғалуы/ұрлануы",
        "Қолжетімділікті бақылау жүйесінің ақауы",
        "Басқа күзет мәселесі"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Inquiry for Principal / Director",
        "Inquiry for Facilities Manager",
        "Document / Certificate request",
        "Room rental inquiry",
        "Other admin inquiry"
      ],
      ru: [
        "Вопросы к директору",
        "Вопросы к завхозу",
        "Запрос документов/справок",
        "Вопросы по аренде помещений",
        "Прочее"
      ],
      kk: [
        "Директорға сұрақ",
        "Шаруашылық меңгерушісіне сұрақ",
        "Құжат/анықтама сұрау",
        "Бөлме жалдау сұрағы",
        "Басқа әкімшілік сұрақ"
      ]
    }
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
    ],
    subcategoriesLocalized: {
      en: ["General BI Education appeal"],
      ru: ["Прочее"],
      kk: ["Жалпы BI Education өтініші"]
    }
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
    ],
    subcategoriesLocalized: {
      en: [
        "Water cooler refill delivery",
        "Other facility issue",
        "Uncategorized request"
      ],
      ru: [
        "Доставка воды куллерам",
        "Другая проблема",
        "Неопределенная категория"
      ],
      kk: [
        "Куллерлерге су жеткізу",
        "Басқа мәселе",
        "Анықталмаған санат"
      ]
    }
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
 * Get localized subcategories for a given department
 */
export function getSubcategories(deptIdOrObj, lang = 'ru') {
  const dept = typeof deptIdOrObj === 'string' ? resolveDepartment(deptIdOrObj) : deptIdOrObj;
  if (!dept) return [];
  if (dept.subcategoriesLocalized && dept.subcategoriesLocalized[lang]) {
    return dept.subcategoriesLocalized[lang];
  }
  return dept.subcategories || [];
}

/**
 * Translate any subcategory across languages in 0ms using the cross-index
 */
export function translateSubcategory(subcatText, targetLang = 'ru') {
  if (!subcatText) return '';
  const clean = subcatText.trim().toLowerCase();

  for (const dept of Object.values(DEPARTMENTS)) {
    const loc = dept.subcategoriesLocalized;
    if (!loc) continue;

    for (const [langKey, list] of Object.entries(loc)) {
      const idx = list.findIndex(item => item.toLowerCase() === clean);
      if (idx !== -1) {
        if (loc[targetLang] && loc[targetLang][idx]) {
          return loc[targetLang][idx];
        }
        return list[idx];
      }
    }
  }

  return subcatText;
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
