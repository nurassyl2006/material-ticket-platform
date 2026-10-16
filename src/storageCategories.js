/**
 * Storage & Warehouse Inventory Categories Specification
 * Defines standard warehouse categories: Stationery, Marketing, Furniture, Electronics, etc.
 * Provides colors, icons, default shelf locations, and metadata.
 */

export const STORAGE_CATEGORIES = [
  {
    id: 'stationary',
    key: 'stationary',
    icon: '✏️',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    defaultLocation: 'Storage Cabinet 102 - Shelf A',
    translations: {
      en: 'Stationery & Office Supplies',
      ru: 'Канцелярия и бумага',
      kk: 'Кеңсе және қағаз тауарлары'
    },
    shortTranslations: {
      en: 'Stationery',
      ru: 'Канцелярия',
      kk: 'Кеңсе'
    },
    description: {
      en: 'Paper, pens, markers, staplers, folders, notebooks and desk supplies',
      ru: 'Бумага А4, маркеры, папки, тетради, степлеры и офисные принадлежности',
      kk: 'А4 қағазы, маркерлер, папкалар, дәптерлер және кеңсе бұйымдары'
    }
  },
  {
    id: 'marketing',
    key: 'marketing',
    icon: '📢',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    defaultLocation: 'Marketing Storage Room B-1',
    translations: {
      en: 'Marketing & Promotional Materials',
      ru: 'Маркетинг, PR и полиграфия',
      kk: 'Маркетинг, баспа және бренд өнімдері'
    },
    shortTranslations: {
      en: 'Marketing',
      ru: 'Маркетинг',
      kk: 'Маркетинг'
    },
    description: {
      en: 'Roll-up banners, school swag, tote bags, brochures, event badges and promo pens',
      ru: 'Ролл-апы, школьный мерч, эко-сумки, буклеты, бейджи и промо-ручки',
      kk: 'Ролл-аптар, мектеп бренді, сөмкелер, буклеттер, бейдждер және қаламдар'
    }
  },
  {
    id: 'furniture',
    key: 'furniture',
    icon: '🪑',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    defaultLocation: 'Facilities Warehouse Block B',
    translations: {
      en: 'Furniture & Classroom Equipment',
      ru: 'Мебель, парты и оснащение',
      kk: 'Жиһаз, парталар және жабдықтар'
    },
    shortTranslations: {
      en: 'Furniture',
      ru: 'Мебель',
      kk: 'Жиһаз'
    },
    description: {
      en: 'Student chairs, adjustable desks, mobile podiums, whiteboards and dollies',
      ru: 'Стулья, парты, мобильные трибуны, доски на колесах и тележки',
      kk: 'Орындықтар, парталар, жылжымалы мінберлер және тақталар'
    }
  },
  {
    id: 'electronics',
    key: 'electronics',
    icon: '💻',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    defaultLocation: 'IT Server Room 204',
    translations: {
      en: 'Electronics & Audio-Visual',
      ru: 'Электроника и IT-оборудование',
      kk: 'Электроника және IT құрылғылары'
    },
    shortTranslations: {
      en: 'Electronics',
      ru: 'Электроника',
      kk: 'Электроника'
    },
    description: {
      en: 'HDMI/VGA adapters, clickers, USB hubs, audio cables and peripherals',
      ru: 'Переходники HDMI/VGA, кликеры, USB-хабы, аудиокабели и адаптеры',
      kk: 'HDMI/VGA өткізгіштері, кликерлер, USB хабтар және кабельдер'
    }
  },
  {
    id: 'electrical',
    key: 'electrical',
    icon: '⚡',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
    defaultLocation: 'Engineering Workshop 106 - Shelf A',
    translations: {
      en: 'Electrical & Lighting Utilities',
      ru: 'Электрика и освещение',
      kk: 'Электрика және жарықтандыру'
    },
    shortTranslations: {
      en: 'Electrical',
      ru: 'Электрика',
      kk: 'Электрика'
    },
    description: {
      en: 'LED panels, wall sockets, light switches, circuit breakers and fuses',
      ru: 'LED панели, силовые розетки, выключатели, автоматы и проводка',
      kk: 'LED панельдер, розеткалар, ажыратқыштар және автоматтар'
    }
  },
  {
    id: 'cleaning',
    key: 'cleaning',
    icon: '🧹',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    defaultLocation: 'Cleaning Depot Basement',
    translations: {
      en: 'Cleaning & Hygiene Supplies',
      ru: 'Хозтовары и чистящие средства',
      kk: 'Шаруашылық тауарлары мен гигиена'
    },
    shortTranslations: {
      en: 'Cleaning',
      ru: 'Хозтовары',
      kk: 'Тазалық'
    },
    description: {
      en: 'Sanitizing wipes, trash bags, liquid soap, paper towels and disinfectants',
      ru: 'Антисептики, дезинфицирующие салфетки, мусорные пакеты и мыло',
      kk: 'Антисептиктер, сүрткіштер, қоқыс пакеттері және жуғыш құралдар'
    }
  },
  {
    id: 'hvac',
    key: 'hvac',
    icon: '❄️',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    defaultLocation: 'Engineering Workshop 106 - Shelf B',
    translations: {
      en: 'HVAC & Climate Control',
      ru: 'Кондиционеры и вентиляция',
      kk: 'Кондиционерлер және климат'
    },
    shortTranslations: {
      en: 'HVAC',
      ru: 'Климат',
      kk: 'Климат'
    },
    description: {
      en: 'Air conditioner filters, drainage hoses, remote controls and thermostats',
      ru: 'Воздушные фильтры для кондиционеров, дренажные трубки и пульты',
      kk: 'Кондиционер сүзгілері, дренаж түтіктері және басқару пульттері'
    }
  },
  {
    id: 'lab',
    key: 'lab',
    icon: '🔬',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    defaultLocation: 'Science Lab Storage 301',
    translations: {
      en: 'Science & Lab Equipment',
      ru: 'Лабораторные реактивы и посуда',
      kk: 'Зертханалық құралдар мен ыдыстар'
    },
    shortTranslations: {
      en: 'Science Lab',
      ru: 'Лаборатория',
      kk: 'Зертхана'
    },
    description: {
      en: 'Test tubes, beakers, chemical indicators, safety goggles and gloves',
      ru: 'Пробирки, колбы, индикаторы, защитные очки и перчатки',
      kk: 'Пробиркалар, шыны ыдыстар, қорғаныс көзілдіріктері мен қолғаптар'
    }
  },
  {
    id: 'other',
    key: 'other',
    icon: '📦',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    defaultLocation: 'Main Warehouse Central Shelf',
    translations: {
      en: 'General Assets & Miscellaneous',
      ru: 'Общий инвентарь и склад',
      kk: 'Жалпы қойма мүлкі'
    },
    shortTranslations: {
      en: 'General',
      ru: 'Общий',
      kk: 'Жалпы'
    },
    description: {
      en: 'Miscellaneous storage items, spare parts, packaging and seasonal materials',
      ru: 'Прочие складские позиции, запчасти, упаковка и сезонные материалы',
      kk: 'Басқа қойма заттары, бөлшектер, орамалар және маусымдық материалдар'
    }
  }
];

export const CATEGORY_MAP = STORAGE_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

export function getCategoryMeta(categoryId) {
  return CATEGORY_MAP[categoryId] || CATEGORY_MAP['other'] || {
    id: categoryId,
    icon: '📦',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    defaultLocation: 'Main Warehouse',
    translations: { en: categoryId, ru: categoryId, kk: categoryId },
    shortTranslations: { en: categoryId, ru: categoryId, kk: categoryId }
  };
}

export function getCategoryLabel(categoryId, lang = 'en', short = false) {
  const meta = getCategoryMeta(categoryId);
  const dict = short ? meta.shortTranslations : meta.translations;
  return dict?.[lang] || dict?.['en'] || categoryId;
}
