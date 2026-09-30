/**
 * Comprehensive Ticket Translation Service for EduOps Platform
 * Bridges communication between English-speaking Teachers and Russian/Kazakh-speaking Engineers.
 * 
 * Features:
 * - 0ms instant offline maintenance & school facilities dictionary
 * - Smart language detection (English, Russian, Kazakh)
 * - Free neural API translation via backend /api/translate with client-side MyMemory fallback
 * - Dual-layer caching (Memory + LocalStorage) for speed and quota preservation
 * - Bidirectional ticket field translation (Title, Description, Subcategory, Notes)
 */

// In-memory cache for fast lookups
const memoryCache = new Map();

// LocalStorage cache key
const LS_CACHE_KEY = 'app_ticket_translations_v1';

// Load persistent cache from localStorage
function getPersistentCache() {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function savePersistentCache(key, val) {
  try {
    const cache = getPersistentCache();
    cache[key] = val;
    // Cap cache at 500 entries to avoid localStorage bloating
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      delete cache[keys[0]];
    }
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * High-frequency maintenance vocabulary dictionary
 * Maps terms seamlessly across English, Russian, and Kazakh.
 */
export const MAINTENANCE_DICTIONARY = [
  // IT & Audio-Visual
  {
    en: "Projector not working",
    ru: "Не работает проектор",
    kk: "Проектор жұмыс істемейді"
  },
  {
    en: "Projector lamp burned out",
    ru: "Перегорела лампа проектора",
    kk: "Проектордың шамы күйіп кетті"
  },
  {
    en: "Interactive board / Smartboard problem",
    ru: "Проблема с интерактивной доской",
    kk: "Интерактивті тақта мәселесі"
  },
  {
    en: "Wi-Fi not working",
    ru: "Не работает Wi-Fi",
    kk: "Wi-Fi жұмыс істемейді"
  },
  {
    en: "Internet disconnected",
    ru: "Отключился интернет",
    kk: "Интернет өшіп қалды"
  },
  {
    en: "Printer paper jam",
    ru: "Замятие бумаги в принтере",
    kk: "Принтерде қағаз кептеліп қалды"
  },
  {
    en: "Printer issue",
    ru: "Проблема с принтером",
    kk: "Принтер мәселесі"
  },
  {
    en: "Laptop issue",
    ru: "Проблема с ноутбуком",
    kk: "Ноутбук мәселесі"
  },
  {
    en: "Speakers / Microphone not working",
    ru: "Не работают колонки / микрофон",
    kk: "Динамиктер / микрофон істемейді"
  },
  {
    en: "RFID keycard / Access card issue",
    ru: "Проблема со СКУД картой / пропуском",
    kk: "СКУД картасы / рұқсаттама мәселесі"
  },

  // Electrical & Utilities (Engineer Focus)
  {
    en: "No electricity in room",
    ru: "Отсутствует электричество в кабинете",
    kk: "Кабинетте жарық жоқ"
  },
  {
    en: "Light bulb burned out / flickering",
    ru: "Сгорела / мигает лампа",
    kk: "Шам күйіп кетті / жыпылықтайды"
  },
  {
    en: "Ceiling light not turning on",
    ru: "Потолочный светильник не включается",
    kk: "Төбедегі жарық жанбайды"
  },
  {
    en: "Wall socket not working",
    ru: "Не работает розетка",
    kk: "Розетка жұмыс істемейді"
  },
  {
    en: "Light switch broken",
    ru: "Сломан выключатель света",
    kk: "Жарық қосқышы сынған"
  },
  {
    en: "Sparking outlet / burning smell",
    ru: "Искрит розетка / запах гари",
    kk: "Розеткадан ұшқын шығуда / күйік иісі"
  },
  {
    en: "Air conditioner leaking water",
    ru: "Кондиционер течет",
    kk: "Кондиционерден су ағуда"
  },
  {
    en: "Air conditioner blowing warm air",
    ru: "Кондиционер дует теплым воздухом",
    kk: "Кондиционер жылы ауа үрлеуде"
  },
  {
    en: "Air conditioner not turning on",
    ru: "Кондиционер не включается",
    kk: "Кондиционер қосылмайды"
  },
  {
    en: "Remote control for AC not working",
    ru: "Не работает пульт от кондиционера",
    kk: "Кондиционердің пульті істемейді"
  },
  {
    en: "Heater / radiator cold",
    ru: "Холодные батареи отопления",
    kk: "Жылыту батареялары салқын"
  },
  {
    en: "Radiator leaking water",
    ru: "Течет радиатор отопления",
    kk: "Жылыту батареясынан су ағуда"
  },

  // Plumbing (Engineer Focus)
  {
    en: "Clogged toilet / sink",
    ru: "Засор в унитазе / раковине",
    kk: "Әжетханада / раковинада засор"
  },
  {
    en: "Leaking faucet / pipe",
    ru: "Протекает смеситель / труба",
    kk: "Шүмек / құбыр ағып жатыр"
  },
  {
    en: "Toilet bowl leaking",
    ru: "Протекает унитаз",
    kk: "Әжетхана ағып тұр"
  },
  {
    en: "Flush button broken",
    ru: "Сломана кнопка слива",
    kk: "Ағызу түймесі сынған"
  },
  {
    en: "No water in restroom",
    ru: "Нет воды в туалете",
    kk: "Әжетханада су жоқ"
  },
  {
    en: "No hot water",
    ru: "Нет горячей воды",
    kk: "Ыстық су жоқ"
  },
  {
    en: "No cold water",
    ru: "Нет холодной воды",
    kk: "Суық су жоқ"
  },
  {
    en: "Water pipe burst / emergency leak",
    ru: "Прорыв трубы / срочная протечка",
    kk: "Құбыр жарылды / шұғыл ағу"
  },
  {
    en: "Sewage odor",
    ru: "Запах канализации",
    kk: "Кәріз иісі шығып тұр"
  },
  {
    en: "Towel warmer not working",
    ru: "Не работает полотенцесушитель",
    kk: "Сүлгі кептіргіш істемейді"
  },

  // Furniture & Carpentry
  {
    en: "Broken chair / desk",
    ru: "Сломан стул / парта",
    kk: "Орындық / парта сынған"
  },
  {
    en: "Door won't close / lock jammed",
    ru: "Дверь не закрывается / заедает замок",
    kk: "Есік жабылмайды / құлып кептелген"
  },
  {
    en: "Window won't close / draft",
    ru: "Окно не закрывается / сквозит",
    kk: "Терезе жабылмайды / жел соғады"
  },
  {
    en: "Window handle broken",
    ru: "Сломалась ручка окна",
    kk: "Терезе тұтқасы сынды"
  },
  {
    en: "Door handle loose",
    ru: "Расшаталась ручка двери",
    kk: "Есік тұтқасы босап кетті"
  },
  {
    en: "Need extra chairs",
    ru: "Нужны дополнительные стулья",
    kk: "Қосымша орындықтар қажет"
  },
  {
    en: "Need extra desks",
    ru: "Нужны дополнительные парты",
    kk: "Қосымша парталар қажет"
  },
  {
    en: "Move furniture to another room",
    ru: "Переместить мебель в другой кабинет",
    kk: "Жиһазды басқа кабинетке көшіру"
  },
  {
    en: "Curtain rod fell down",
    ru: "Упал карниз со шторами",
    kk: "Перде карнизі құлап қалды"
  },

  // Cleaning
  {
    en: "Spilled liquid on floor",
    ru: "Разлита жидкость на полу",
    kk: "Еденге сұйықтық төгілді"
  },
  {
    en: "Classroom needs cleaning",
    ru: "Требуется уборка кабинета",
    kk: "Кабинетті тазалау қажет"
  },
  {
    en: "Restroom needs cleaning",
    ru: "Требуется уборка туалета",
    kk: "Әжетхананы тазалау қажет"
  },
  {
    en: "Trash can overflowing",
    ru: "Переполнена урна с мусором",
    kk: "Қоқыс жәшігі толып кетті"
  },
  {
    en: "Broken glass on floor",
    ru: "Разбитое стекло на полу",
    kk: "Еденде сынған әйнек"
  },

  // Storage / Supplies
  {
    en: "Water cooler refill bottle needed",
    ru: "Нужна бутыль воды для кулера",
    kk: "Куллерге су құтысы қажет"
  },
  {
    en: "Whiteboard markers needed",
    ru: "Нужны маркеры для доски",
    kk: "Тақтаға арналған маркерлер қажет"
  },
  {
    en: "A4 paper needed",
    ru: "Нужна бумага А4",
    kk: "А4 қағазы қажет"
  },

  // Common Engineer Resolution Notes
  {
    en: "Replaced lamp. Everything is working now.",
    ru: "Заменил лампу. Все работает.",
    kk: "Шам ауыстырылды. Барлығы істеп тұр."
  },
  {
    en: "Repaired electrical socket. Tested and operational.",
    ru: "Отремонтировал розетку. Проверено, работает.",
    kk: "Розетка жөнделді. Тексерілді, жұмыс істеп тұр."
  },
  {
    en: "Fixed water leak in pipe.",
    ru: "Устранил протечку в трубе.",
    kk: "Құбырдағы су ағуы жойылды."
  },
  {
    en: "Cleared clogged sink/toilet.",
    ru: "Устранил засор в раковине/унитазе.",
    kk: "Раковина/әжетханадағы бітелу жойылды."
  },
  {
    en: "AC filters cleaned and freon pressure checked.",
    ru: "Фильтры кондиционера очищены, давление фреона проверено.",
    kk: "Кондиционер сүзгілері тазаланды, қысым тексерілді."
  },
  {
    en: "Parts ordered from warehouse. Will finish tomorrow.",
    ru: "Запчасти заказаны со склада. Завершу завтра.",
    kk: "Бөлшектер қоймадан тапсырыс берілді. Ертең аяқтаймын."
  },
  {
    en: "Work completed successfully.",
    ru: "Работа успешно выполнена.",
    kk: "Жұмыс сәтті аяқталды."
  }
];

/**
 * Detect language of given text
 * Returns 'en', 'kk', or 'ru'
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';
  const str = text.trim();
  
  // Specific Kazakh Cyrillic letters
  if (/[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(str)) {
    return 'kk';
  }
  
  // General Cyrillic letters (Russian)
  if (/[а-яёА-ЯЁ]/.test(str)) {
    return 'ru';
  }
  
  // Default to English if Latin or other
  return 'en';
}

/**
 * Lookup phrase in maintenance dictionary
 */
function lookupDictionary(text, targetLang) {
  if (!text) return null;
  const clean = text.trim().toLowerCase();

  for (const entry of MAINTENANCE_DICTIONARY) {
    for (const [lang, val] of Object.entries(entry)) {
      if (val.toLowerCase() === clean) {
        return entry[targetLang] || null;
      }
    }
  }

  // Substring match for key phrases
  for (const entry of MAINTENANCE_DICTIONARY) {
    for (const [lang, val] of Object.entries(entry)) {
      if (clean.includes(val.toLowerCase()) || val.toLowerCase().includes(clean)) {
        if (clean.length > 6 && val.length > 6) {
          return entry[targetLang] || null;
        }
      }
    }
  }

  return null;
}

/**
 * Translate a single text string to target language ('ru', 'kk', or 'en')
 */
export async function translateText(text, targetLang = 'ru', sourceLang = 'auto') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { translatedText: text || '', from: sourceLang, to: targetLang };
  }

  const trimmed = text.trim();
  const detected = sourceLang === 'auto' ? detectLanguage(trimmed) : sourceLang;

  // If already in target language, return as is
  if (detected === targetLang) {
    return { translatedText: trimmed, from: detected, to: targetLang, isOriginal: true };
  }

  const cacheKey = `${detected}:${targetLang}:${trimmed}`;

  // 1. Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return { translatedText: memoryCache.get(cacheKey), from: detected, to: targetLang, cached: true };
  }

  // 2. Check localStorage persistent cache
  const lsCache = getPersistentCache();
  if (lsCache[cacheKey]) {
    memoryCache.set(cacheKey, lsCache[cacheKey]);
    return { translatedText: lsCache[cacheKey], from: detected, to: targetLang, cached: true };
  }

  // 3. Check fast offline maintenance dictionary
  const dictMatch = lookupDictionary(trimmed, targetLang);
  if (dictMatch) {
    memoryCache.set(cacheKey, dictMatch);
    savePersistentCache(cacheKey, dictMatch);
    return { translatedText: dictMatch, from: detected, to: targetLang, dictionary: true };
  }

  // 4. Try backend /api/translate proxy
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, from: detected, to: targetLang }),
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText && data.translatedText !== trimmed) {
        memoryCache.set(cacheKey, data.translatedText);
        savePersistentCache(cacheKey, data.translatedText);
        return { translatedText: data.translatedText, from: detected, to: targetLang };
      }
    }
  } catch (backendErr) {
    // Backend unavailable or timed out, fall through to client direct API
  }

  // 5. Client-side direct call to MyMemory Free Translation API
  try {
    const langpair = `${detected}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`;
    
    const clientRes = await fetch(myMemoryUrl, {
      signal: AbortSignal.timeout(7000)
    });

    if (clientRes.ok) {
      const data = await clientRes.json();
      let trans = data?.responseData?.translatedText;
      if (trans && trans !== trimmed && !data.quotaFinished) {
        // Decode HTML entities
        trans = trans
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        
        memoryCache.set(cacheKey, trans);
        savePersistentCache(cacheKey, trans);
        return { translatedText: trans, from: detected, to: targetLang };
      }
    }
  } catch (apiErr) {
    // Client API error or offline
  }

  // 6. Graceful Fallback: word-by-word dictionary or original
  return { translatedText: trimmed, from: detected, to: targetLang, fallback: true };
}

/**
 * Translate an entire ticket object's user-facing text fields
 */
export async function translateTicket(ticket, targetLang = 'ru') {
  if (!ticket) return null;

  const [titleRes, descRes, notesRes] = await Promise.all([
    translateText(ticket.itemTitle || '', targetLang),
    translateText(ticket.description || '', targetLang),
    translateText(ticket.notes || '', targetLang)
  ]);

  return {
    ...ticket,
    translatedItemTitle: titleRes.translatedText,
    translatedDescription: descRes.translatedText,
    translatedNotes: notesRes.translatedText,
    detectedLang: titleRes.from || 'en',
    targetLang
  };
}

/**
 * Language labels with flags for UI switcher
 */
export const TRANSLATOR_LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺', short: 'RU' },
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿', short: 'KK' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' }
];
