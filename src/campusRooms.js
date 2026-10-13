// ==============================================================================
// EduOps Campus Architecture & Room Registry
// Source: Official School Floor Plans (Blocks A, B, C, D | 3 Floors + 1 Basement)
// ==============================================================================

export const CAMPUS_BLOCKS = {
  blockA: {
    id: 'A',
    key: 'blockA',
    name: 'Block A',
    title: 'Primary Wing',
    titleRu: 'Блок А (Начальная школа)',
    titleKk: 'А блогы (Бастауыш сыныптар)',
    desc: 'Primary School (Years 1-6), Primary Art & Staff'
  },
  blockB: {
    id: 'B',
    key: 'blockB',
    name: 'Block B',
    title: 'Languages & Humanities Wing',
    titleRu: 'Блок B (Языки и гуманитарные науки)',
    titleKk: 'В блогы (Тілдер және қоғамдық ғылымдар)',
    desc: 'English, EAL, Russian, Kazakh, Mathematics, Humanities'
  },
  blockC: {
    id: 'C',
    key: 'blockC',
    name: 'Block C',
    title: 'Creative, Science & Administration Wing',
    titleRu: 'Блок C (STEM, Лаборатории и Администрация)',
    titleKk: 'С блогы (STEM, Зертханалар және Әкімшілік)',
    desc: 'DT, Robotics, IT, Music, Science Labs, Directorate & HR'
  },
  blockD: {
    id: 'D',
    key: 'blockD',
    name: 'Block D',
    title: 'Sports, Dining & Social Wing',
    titleRu: 'Блок D (Спорт, Столовая и Библиотека)',
    titleKk: 'D блогы (Спорт, Асхана және Кітапхана)',
    desc: 'Dining Hall, Swimming Pool, Sports Halls, Dance, Library'
  }
};

export const CAMPUS_FLOORS = {
  basement: {
    id: 'basement',
    number: 0,
    label: 'Basement (-1)',
    nameRu: 'Цоколь / Подвал (-1)',
    nameKk: 'Жертөле (-1)',
    codePrefix: '0'
  },
  floor1: {
    id: 'floor1',
    number: 1,
    label: '1st Floor',
    nameRu: '1 этаж',
    nameKk: '1-қабат',
    codePrefix: '1'
  },
  floor2: {
    id: 'floor2',
    number: 2,
    label: '2nd Floor',
    nameRu: '2 этаж',
    nameKk: '2-қабат',
    codePrefix: '2'
  },
  floor3: {
    id: 'floor3',
    number: 3,
    label: '3rd Floor',
    nameRu: '3 этаж',
    nameKk: '3-қабат',
    codePrefix: '3'
  }
};

// Complete official list of rooms recognized from architectural floor plans
export const CAMPUS_ROOMS = [
  // ==========================================
  // FLOOR 1 (Page 1)
  // ==========================================
  // Block A - 1st Floor
  { code: 'A-1-1', name: 'Primary Office A-1-1', block: 'A', floor: 1, areaType: 'office', keywords: ['a-1-1', 'a11', 'primary office'] },
  { code: 'A-1-2', name: 'Year 1A', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-2', 'a12', 'year 1a', '1a', '1-a', 'класс 1а', 'сынып 1а'] },
  { code: 'A-1-2.1', name: 'Year 1A Prep Room', block: 'A', floor: 1, areaType: 'storage', keywords: ['a-1-2.1', 'prep 1a'] },
  { code: 'A-1-2.2', name: 'Learning Support 1.2', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-2.2', 'learning support'] },
  { code: 'A-1-2.3', name: 'Learning Support 1.3', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-2.3'] },
  { code: 'A-1-3', name: 'Year 1B', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-3', 'a13', 'year 1b', '1b', '1-b', 'класс 1б', 'сынып 1б'] },
  { code: 'A-1-4', name: 'Year 2A', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-4', 'a14', 'year 2a', '2a', '2-a', 'класс 2а', 'сынып 2а'] },
  { code: 'A-1-5', name: 'Year 2B', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-5', 'a15', 'year 2b', '2b', '2-b', 'класс 2б', 'сынып 2б'] },
  { code: 'A-1-6', name: 'Primary Classroom A-1-6', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-6', 'a16'] },
  { code: 'A-1-7', name: 'Head of Primary', block: 'A', floor: 1, areaType: 'office', keywords: ['a-1-7', 'a17', 'head of primary', 'директор начальной школы'] },
  { code: 'A-1-8', name: 'Wellbeing Centre (Prim.)', block: 'A', floor: 1, areaType: 'office', keywords: ['a-1-8', 'a18', 'wellbeing', 'психолог', 'салауаттылық'] },
  { code: 'A-1-9', name: 'Year 2C', block: 'A', floor: 1, areaType: 'classroom', keywords: ['a-1-9', 'a19', 'year 2c', '2c', '2-c', 'класс 2в', 'сынып 2с'] },
  { code: 'A-1-10', name: 'Toilets & Stairs (Block A)', block: 'A', floor: 1, areaType: 'restroom', keywords: ['a-1-10', 'toilets a', 'санузел a', 'туалет а'] },

  // Block B - 1st Floor
  { code: 'B-1-1', name: 'English 1', block: 'B', floor: 1, areaType: 'classroom', keywords: ['b-1-1', 'b11', 'english 1', 'английский 1', 'ағылшын 1'] },
  { code: 'B-1-2', name: 'English 2', block: 'B', floor: 1, areaType: 'classroom', keywords: ['b-1-2', 'b12', 'english 2', 'английский 2', 'ағылшын 2'] },
  { code: 'B-1-3', name: 'EAL 1', block: 'B', floor: 1, areaType: 'classroom', keywords: ['b-1-3', 'b13', 'eal 1'] },
  { code: 'B-1-4', name: 'EAL 2', block: 'B', floor: 1, areaType: 'classroom', keywords: ['b-1-4', 'b14', 'eal 2'] },
  { code: 'B-1-5', name: 'English 3', block: 'B', floor: 1, areaType: 'classroom', keywords: ['b-1-5', 'b15', 'english 3', 'английский 3'] },
  { code: 'B-1-6.1', name: 'Uniform Shop', block: 'B', floor: 1, areaType: 'office', keywords: ['b-1-6.1', 'uniform shop', 'магазин формы', 'мектеп формасы'] },
  { code: 'B-1-6.2', name: 'Admissions Office', block: 'B', floor: 1, areaType: 'office', keywords: ['b-1-6.2', 'admissions', 'приемная комиссия', 'қабылдау бөлімі'] },
  { code: 'B-1-WC', name: 'Toilets (Block B 1F)', block: 'B', floor: 1, areaType: 'restroom', keywords: ['b-1 toilets', 'туалет b1'] },

  // Block C - 1st Floor
  { code: 'C-1-1', name: 'Headmaster Office', block: 'C', floor: 1, areaType: 'office', keywords: ['c-1-1', 'c11', 'headmaster', 'директор'] },
  { code: 'C-1-1.1', name: 'Headmaster Reception', block: 'C', floor: 1, areaType: 'office', keywords: ['c-1-1.1', 'reception'] },
  { code: 'C-1-1.2', name: 'General Director', block: 'C', floor: 1, areaType: 'office', keywords: ['c-1-1.2', 'general director', 'генеральный директор', 'бас директор'] },
  { code: 'C-1-1.3', name: 'Meeting Room (Directorate)', block: 'C', floor: 1, areaType: 'office', keywords: ['c-1-1.3', 'meeting room', 'переговорная'] },
  { code: 'C-1-2', name: 'Home Economics', block: 'C', floor: 1, areaType: 'classroom', keywords: ['c-1-2', 'c12', 'home economics', 'кулинария', 'технология девочек'] },
  { code: 'C-1-3', name: 'Fashion Design', block: 'C', floor: 1, areaType: 'classroom', keywords: ['c-1-3', 'c13', 'fashion design', 'дизайн одежды', 'моделирование'] },
  { code: 'C-1-4', name: 'DT (Design & Technology)', block: 'C', floor: 1, areaType: 'classroom', keywords: ['c-1-4', 'c14', 'dt', 'design and technology', 'труд', 'технология'] },
  { code: 'C-1-5', name: 'Robotics', block: 'C', floor: 1, areaType: 'classroom', keywords: ['c-1-5', 'c15', 'robotics', 'робототехника', 'робот'] },
  { code: 'C-1-6', name: 'IT 1', block: 'C', floor: 1, areaType: 'classroom', keywords: ['c-1-6', 'c16', 'it 1', 'информатика 1', 'компьютерный класс 1'] },
  { code: 'C-1-WC', name: 'Toilets (Block C 1F)', block: 'C', floor: 1, areaType: 'restroom', keywords: ['c-1 toilets', 'туалет c1'] },

  // Block D - 1st Floor
  { code: 'D-1-1', name: 'Dance Studio', block: 'D', floor: 1, areaType: 'sports', keywords: ['d-1-1', 'd11', 'dance studio', 'хореография', 'танцы', 'би залы'] },
  { code: 'D-1-2', name: 'Kitchen Food Storage 1', block: 'D', floor: 1, areaType: 'storage', keywords: ['d-1-2', 'd12', 'kitchen storage'] },
  { code: 'D-1-3', name: 'Kitchen Food Storage 2', block: 'D', floor: 1, areaType: 'storage', keywords: ['d-1-3', 'd13'] },
  { code: 'D-1-4', name: 'Kitchen Staff Utility', block: 'D', floor: 1, areaType: 'office', keywords: ['d-1-4', 'd14'] },
  { code: 'D-1-5', name: 'Conference Room', block: 'D', floor: 1, areaType: 'office', keywords: ['d-1-5', 'd15', 'conference room', 'конференц-зал'] },
  { code: 'Dining Hall', name: 'Dining Hall / Canteen', block: 'D', floor: 1, areaType: 'cafeteria', keywords: ['dining hall', 'canteen', 'столовая', 'асхана', 'буфет', 'кафетерий'] },
  { code: 'Swimming Pool', name: 'Swimming Pool', block: 'D', floor: 1, areaType: 'sports', keywords: ['swimming pool', 'pool', 'бассейн', 'жүзу бассейні'] },
  { code: 'Lectorium', name: 'Lectorium', block: 'D', floor: 1, areaType: 'classroom', keywords: ['lectorium', 'лекторий', 'актовый зал', 'аудитория'] },

  // ==========================================
  // FLOOR 2 (Page 2)
  // ==========================================
  // Block A - 2nd Floor
  { code: 'A-2-1', name: 'Year 3A', block: 'A', floor: 2, areaType: 'classroom', keywords: ['a-2-1', 'a21', 'year 3a', '3a', '3-a', 'класс 3а', 'сынып 3а'] },
  { code: 'A-2-2', name: 'Year 3B', block: 'A', floor: 2, areaType: 'classroom', keywords: ['a-2-2', 'a22', 'year 3b', '3b', '3-b', 'класс 3б', 'сынып 3б'] },
  { code: 'A-2-3', name: 'Year 3C', block: 'A', floor: 2, areaType: 'classroom', keywords: ['a-2-3', 'a23', 'year 3c', '3c', '3-c', 'класс 3в', 'сынып 3с'] },
  { code: 'A-2-4', name: 'Year 4A', block: 'A', floor: 2, areaType: 'classroom', keywords: ['a-2-4', 'a24', 'year 4a', '4a', '4-a', 'класс 4а', 'сынып 4а'] },
  { code: 'A-2-5', name: 'Year 4B', block: 'A', floor: 2, areaType: 'classroom', keywords: ['a-2-5', 'a25', 'year 4b', '4b', '4-b', 'класс 4б', 'сынып 4б'] },
  { code: 'A-2-6', name: 'Primary Staff Room', block: 'A', floor: 2, areaType: 'office', keywords: ['a-2-6', 'a26', 'primary staff', 'учительская начальной школы', 'мұғалімдер бөлмесі'] },
  { code: 'A-2-7', name: 'IT 2', block: 'A', floor: 2, areaType: 'classroom', keywords: ['a-2-7', 'a27', 'it 2', 'информатика 2', 'компьютерный класс 2'] },
  { code: 'A-2-WC', name: 'Toilets (Block A 2F)', block: 'A', floor: 2, areaType: 'restroom', keywords: ['a-2 toilets', 'туалет а2'] },

  // Block B - 2nd Floor
  { code: 'B-2-1', name: 'MFL 1 (Foreign Languages)', block: 'B', floor: 2, areaType: 'classroom', keywords: ['b-2-1', 'b21', 'mfl 1', 'foreign languages'] },
  { code: 'B-2-2', name: 'MFL 2 (Foreign Languages)', block: 'B', floor: 2, areaType: 'classroom', keywords: ['b-2-2', 'b22', 'mfl 2'] },
  { code: 'B-2-3', name: 'Russian Language & Literature 1', block: 'B', floor: 2, areaType: 'classroom', keywords: ['b-2-3', 'b23', 'russian 1', 'русский язык 1', 'орыс тілі 1'] },
  { code: 'B-2-4', name: 'Russian Language & Literature 2', block: 'B', floor: 2, areaType: 'classroom', keywords: ['b-2-4', 'b24', 'russian 2', 'русский язык 2', 'орыс тілі 2'] },
  { code: 'B-2-5', name: 'Kazakh Language & Literature 1', block: 'B', floor: 2, areaType: 'classroom', keywords: ['b-2-5', 'b25', 'kazakh 1', 'казахский 1', 'қазақ тілі 1'] },
  { code: 'B-2-6', name: 'Kazakh Language & Literature 2', block: 'B', floor: 2, areaType: 'classroom', keywords: ['b-2-6', 'b26', 'kazakh 2', 'казахский 2', 'қазақ тілі 2'] },
  { code: 'B-2-WC', name: 'Toilets (Block B 2F)', block: 'B', floor: 2, areaType: 'restroom', keywords: ['b-2 toilets', 'туалет b2'] },

  // Block C - 2nd Floor
  { code: 'C-2-1', name: 'Learning Support', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-1', 'c21', 'learning support'] },
  { code: 'C-2-2', name: 'Secondary Staff Room', block: 'C', floor: 2, areaType: 'office', keywords: ['c-2-2', 'c22', 'secondary staff', 'учительская старшей школы'] },
  { code: 'C-2-3', name: 'Music 1', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-3', 'c23', 'music 1', 'музыка 1'] },
  { code: 'C-2-4', name: 'Music 2', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-4', 'c24', 'music 2', 'музыка 2'] },
  { code: 'C-2-5', name: 'Music Practice Room 1', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-5', 'practice 1', 'репетиционная 1'] },
  { code: 'C-2-6', name: 'Music Practice Room 2', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-6', 'practice 2', 'репетиционная 2'] },
  { code: 'C-2-7', name: 'Music Practice Room 3', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-7', 'practice 3', 'репетиционная 3'] },
  { code: 'C-2-8', name: 'Music Practice Room 4', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-8', 'practice 4', 'репетиционная 4'] },
  { code: 'C-2-9', name: 'Music Storage', block: 'C', floor: 2, areaType: 'storage', keywords: ['c-2-9', 'music storage', 'склад инструментов'] },
  { code: 'C-2-10', name: 'Military Studies (НВП)', block: 'C', floor: 2, areaType: 'classroom', keywords: ['c-2-10', 'c210', 'military studies', 'нвп', 'аәд', 'военная подготовка'] },
  { code: 'C-2-11', name: 'Wellbeing Centre (Sec.)', block: 'C', floor: 2, areaType: 'office', keywords: ['c-2-11', 'c211', 'wellbeing', 'психолог старшей школы'] },
  { code: 'C-2-12', name: 'Career Services', block: 'C', floor: 2, areaType: 'office', keywords: ['c-2-12', 'c212', 'career services', 'профориентация'] },
  { code: 'C-2-13', name: 'Meeting Room C-2-13', block: 'C', floor: 2, areaType: 'office', keywords: ['c-2-13', 'c213', 'meeting room'] },
  { code: 'C-2-WC', name: 'Toilets (Block C 2F)', block: 'C', floor: 2, areaType: 'restroom', keywords: ['c-2 toilets', 'туалет c2'] },

  // Block D - 2nd Floor
  { code: 'D-2-1', name: 'Primary Sports Hall', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-1', 'd21', 'primary sports hall', 'малый спортзал'] },
  { code: 'D-2-1.1', name: 'Sports Hall Storage 1', block: 'D', floor: 2, areaType: 'storage', keywords: ['d-2-1.1'] },
  { code: 'D-2-1.2', name: 'Sports Hall Storage 2', block: 'D', floor: 2, areaType: 'storage', keywords: ['d-2-1.2'] },
  { code: 'D-2-2', name: 'Main Sports Hall (Gym)', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-2', 'd22', 'sports hall', 'gym', 'большой спортзал', 'спортзал'] },
  { code: 'D-2-2.1', name: 'Gym Locker Room 1', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-2.1', 'locker 1', 'раздевалка 1'] },
  { code: 'D-2-2.2', name: 'Gym Locker Room 2', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-2.2', 'locker 2', 'раздевалка 2'] },
  { code: 'D-2-2.3', name: 'Gym Locker Room 3', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-2.3', 'locker 3', 'раздевалка 3'] },
  { code: 'D-2-2.4', name: 'Gym Locker Room 4', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-2.4', 'locker 4', 'раздевалка 4'] },
  { code: 'D-2-3', name: 'Pool Viewing Gallery', block: 'D', floor: 2, areaType: 'sports', keywords: ['d-2-3', 'd23', 'pool viewing', 'трибуны бассейна'] },
  { code: 'D-2-3.1', name: 'Pool Storage', block: 'D', floor: 2, areaType: 'storage', keywords: ['d-2-3.1', 'pool storage'] },
  { code: 'D-2-4', name: 'Sports Meeting Room', block: 'D', floor: 2, areaType: 'office', keywords: ['d-2-4', 'd24', 'meeting room'] },

  // ==========================================
  // FLOOR 3 (Page 3)
  // ==========================================
  // Block A - 3rd Floor
  { code: 'A-3-1', name: 'Secondary Art', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-1', 'a31', 'secondary art', 'изо старшие', 'бейнелеу өнері'] },
  { code: 'A-3-2', name: 'Primary Art', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-2', 'a32', 'primary art', 'изо начальные'] },
  { code: 'A-3-3', name: 'Year 4C', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-3', 'a33', 'year 4c', '4c', '4-c', 'класс 4в', 'сынып 4с'] },
  { code: 'A-3-4', name: 'Year 5A', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-4', 'a34', 'year 5a', '5a', '5-a', 'класс 5а', 'сынып 5а'] },
  { code: 'A-3-5', name: 'Year 5B', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-5', 'a35', 'year 5b', '5b', '5-b', 'класс 5б', 'сынып 5б'] },
  { code: 'A-3-6', name: 'Year 5C', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-6', 'a36', 'year 5c', '5c', '5-c', 'класс 5в', 'сынып 5с'] },
  { code: 'A-3-7', name: 'Year 6A', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-7', 'a37', 'year 6a', '6a', '6-a', 'класс 6а', 'сынып 6а'] },
  { code: 'A-3-8', name: 'Year 6B', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-8', 'a38', 'year 6b', '6b', '6-b', 'класс 6б', 'сынып 6б'] },
  { code: 'A-3-9', name: 'Year 6C', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-9', 'a39', 'year 6c', '6c', '6-c', 'класс 6в', 'сынып 6с'] },
  { code: 'A-3-10', name: 'EAL 3', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-10', 'a310', 'eal 3'] },
  { code: 'A-3-11', name: 'Library Storage', block: 'A', floor: 3, areaType: 'storage', keywords: ['a-3-11', 'a311', 'library storage', 'книгохранилище'] },
  { code: 'A-3-12', name: 'Study Room A-3-12', block: 'A', floor: 3, areaType: 'classroom', keywords: ['a-3-12', 'a312'] },
  { code: 'A-3-WC', name: 'Toilets (Block A 3F)', block: 'A', floor: 3, areaType: 'restroom', keywords: ['a-3 toilets', 'туалет а3'] },

  // Block B - 3rd Floor
  { code: 'B-3-1', name: 'Social Studies 2', block: 'B', floor: 3, areaType: 'classroom', keywords: ['b-3-1', 'b31', 'social studies 2', 'обществознание 2'] },
  { code: 'B-3-2', name: 'Social Studies 1', block: 'B', floor: 3, areaType: 'classroom', keywords: ['b-3-2', 'b32', 'social studies 1', 'обществознание 1'] },
  { code: 'B-3-3', name: 'Humanities 1', block: 'B', floor: 3, areaType: 'classroom', keywords: ['b-3-3', 'b33', 'humanities 1', 'история 1', 'география 1'] },
  { code: 'B-3-4', name: 'Humanities 2', block: 'B', floor: 3, areaType: 'classroom', keywords: ['b-3-4', 'b34', 'humanities 2', 'история 2', 'география 2'] },
  { code: 'B-3-5', name: 'Mathematics 1', block: 'B', floor: 3, areaType: 'classroom', keywords: ['b-3-5', 'b35', 'mathematics 1', 'math 1', 'математика 1', 'алгебра 1'] },
  { code: 'B-3-6', name: 'Mathematics 2', block: 'B', floor: 3, areaType: 'classroom', keywords: ['b-3-6', 'b36', 'mathematics 2', 'math 2', 'математика 2', 'геометрия 2'] },
  { code: 'B-3-WC', name: 'Toilets (Block B 3F)', block: 'B', floor: 3, areaType: 'restroom', keywords: ['b-3 toilets', 'туалет b3'] },

  // Block C - 3rd Floor
  { code: 'C-3-1', name: 'Administrative Office', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-1', 'c31', 'admin office', 'канцелярия', 'администрация'] },
  { code: 'C-3-2', name: 'Finance Department', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-2', 'c32', 'finance', 'бухгалтерия', 'қаржы бөлімі', 'бухгалтер'] },
  { code: 'C-3-3', name: 'Legal Department', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-3', 'c33', 'legal', 'юрист', 'заң бөлімі'] },
  { code: 'C-3-4', name: 'Human Resources (HR)', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-4', 'c34', 'hr', 'human resources', 'отдел кадров', 'кадр'] },
  { code: 'C-3-5', name: 'Head of Secondary', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-5', 'c35', 'head of secondary', 'директор старшей школы'] },
  { code: 'C-3-6', name: 'Science Laboratory 1', block: 'C', floor: 3, areaType: 'classroom', keywords: ['c-3-6', 'c36', 'science 1', 'лаборатория 1', 'химия', 'физика 1'] },
  { code: 'C-3-6.1', name: 'Science Prep Room 1', block: 'C', floor: 3, areaType: 'storage', keywords: ['c-3-6.1', 'prep room 1', 'препараторская 1'] },
  { code: 'C-3-7', name: 'Science Laboratory 2', block: 'C', floor: 3, areaType: 'classroom', keywords: ['c-3-7', 'c37', 'science 2', 'лаборатория 2', 'биология', 'физика 2'] },
  { code: 'C-3-7.1', name: 'Science Prep Room 2', block: 'C', floor: 3, areaType: 'storage', keywords: ['c-3-7.1', 'prep room 2', 'препараторская 2'] },
  { code: 'C-3-8', name: 'Seminar Room', block: 'C', floor: 3, areaType: 'classroom', keywords: ['c-3-8', 'c38', 'seminar room', 'семинарская'] },
  { code: 'C-3-9', name: 'Head of KS3', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-9', 'c39', 'head of ks3', 'координатор ks3'] },
  { code: 'C-3-10', name: 'Deputy General Director', block: 'C', floor: 3, areaType: 'office', keywords: ['c-3-10', 'c310', 'deputy director', 'зам директора', 'директордың орынбасары'] },
  { code: 'C-3-WC', name: 'Toilets (Block C 3F)', block: 'C', floor: 3, areaType: 'restroom', keywords: ['c-3 toilets', 'туалет c3'] },

  // Block D - 3rd Floor
  { code: 'D-3-1', name: 'Library (Main Campus Library)', block: 'D', floor: 3, areaType: 'library', keywords: ['d-3-1', 'd31', 'library', 'библиотека', 'кітапхана', 'медиатека'] },

  // ==========================================
  // BASEMENT (-1 Floor)
  // ==========================================
  // Block A - Basement
  { code: 'A-0-1', name: 'Primary Lockers & Changing Room', block: 'A', floor: 0, areaType: 'sports', keywords: ['a-0-1', 'primary lockers', 'раздевалка начальной школы'] },
  { code: 'A-0-2', name: 'Ventilation Chamber A', block: 'A', floor: 0, areaType: 'storage', keywords: ['a-0-2', 'венткамера a'] },
  { code: 'A-0-3', name: 'Primary Archive & Material Storage', block: 'A', floor: 0, areaType: 'storage', keywords: ['a-0-3', 'склад a'] },

  // Block B - Basement
  { code: 'B-0-1', name: 'Maintenance Workshop (Столярная мастерская)', block: 'B', floor: 0, areaType: 'office', keywords: ['b-0-1', 'workshop', 'мастерская', 'слесарка', 'шеберхана'] },
  { code: 'B-0-2', name: 'Electrical Substation & Switchboards (Электрощитовая)', block: 'B', floor: 0, areaType: 'office', keywords: ['b-0-2', 'electrical room', 'щитовая', 'электрощитовая'] },
  { code: 'B-0-3', name: 'School Archive & Document Records', block: 'B', floor: 0, areaType: 'storage', keywords: ['b-0-3', 'archive', 'архив'] },

  // Block C - Basement
  { code: 'C-0-1', name: 'Central Server Room (IT Data Center)', block: 'C', floor: 0, areaType: 'office', keywords: ['c-0-1', 'server room', 'серверная', 'серверлік'] },
  { code: 'C-0-2', name: 'Secondary Lockers & Changing Area', block: 'C', floor: 0, areaType: 'sports', keywords: ['c-0-2', 'lockers', 'гардероб', 'шкафчики'] },
  { code: 'C-0-3', name: 'Central Heating Substation (ИТП / Теплопункт)', block: 'C', floor: 0, areaType: 'storage', keywords: ['c-0-3', 'итп', 'теплопункт', 'бойлерная'] },

  // Block D - Basement
  { code: 'D-0-1', name: 'Central Material Warehouse (Главный склад завсклада)', block: 'D', floor: 0, areaType: 'storage', keywords: ['d-0-1', 'warehouse', 'склад', 'қойма', 'материальный склад'] },
  { code: 'D-0-2', name: 'Pool Water Treatment & Filtration Plant', block: 'D', floor: 0, areaType: 'sports', keywords: ['d-0-2', 'водоподготовка', 'фильтрация бассейна'] },
  { code: 'D-0-3', name: 'Sports Equipment Storage', block: 'D', floor: 0, areaType: 'storage', keywords: ['d-0-3', 'спорт склад', 'инвентарь'] },
  { code: 'D-0-4', name: 'Kitchen Cold Storage & Provisions', block: 'D', floor: 0, areaType: 'storage', keywords: ['d-0-4', 'продуктовый склад', 'холодильные камеры'] }
];

// Helper: Normalize string for search and comparison
export function normalizeRoomQuery(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\s\-_.]+/g, '')
    .trim();
}

/**
 * Intelligent room recognition engine
 * Matches raw input strings against the official blueprint database
 * Returns matched room metadata, block, floor, and official labels
 */
export function recognizeRoom(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const raw = input.trim();
  const lower = raw.toLowerCase();
  const normalized = normalizeRoomQuery(raw);

  // 1. Exact or normalized code match (e.g. "A-1-2", "a12", "b-2-5", "c-3-6", "d-3-1")
  for (const r of CAMPUS_ROOMS) {
    if (normalizeRoomQuery(r.code) === normalized) {
      return formatRecognitionResult(r);
    }
  }

  // 2. Keyword exact token match
  for (const r of CAMPUS_ROOMS) {
    for (const kw of r.keywords) {
      if (normalizeRoomQuery(kw) === normalized) {
        return formatRecognitionResult(r);
      }
    }
  }

  // 3. Substring / phrase match in code, name or keywords
  for (const r of CAMPUS_ROOMS) {
    if (lower.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(lower)) {
      return formatRecognitionResult(r);
    }
    for (const kw of r.keywords) {
      const kwLower = kw.toLowerCase();
      if ((lower.includes(kwLower) || kwLower.includes(lower)) && lower.length >= 3 && kwLower.length >= 3) {
        return formatRecognitionResult(r);
      }
    }
  }

  // 4. Regex pattern matching e.g. "A 1 2", "room B-2-4", "cab 305", "D31"
  const codeRegexMatch = raw.match(/([A-DА-Да-д])[\s\-_.]*([0-3])[\s\-_.]*([0-9]+(?:\.[0-9]+)?)/i);
  if (codeRegexMatch) {
    const latinLetter = convertToLatinLetter(codeRegexMatch[1]);
    const floorNum = parseInt(codeRegexMatch[2], 10);
    const roomSub = codeRegexMatch[3];
    const candidateCode = `${latinLetter}-${floorNum}-${roomSub}`;

    const found = CAMPUS_ROOMS.find(r => r.code.toUpperCase() === candidateCode.toUpperCase());
    if (found) {
      return formatRecognitionResult(found);
    }

    // Even if sub-room isn't strictly registered, resolve block & floor!
    const blockKey = `block${latinLetter}`;
    const floorKey = floorNum === 0 ? 'basement' : `floor${floorNum}`;
    return {
      matched: true,
      code: candidateCode,
      name: `Room ${candidateCode}`,
      block: latinLetter,
      floor: floorNum,
      blockKey,
      floorKey,
      areaType: 'classroom',
      formatted: `Block ${latinLetter} • ${floorNum === 0 ? 'Basement' : `${floorNum} Floor`} • Room ${candidateCode}`,
      fullLabel: `${candidateCode} (Block ${latinLetter}, ${floorNum === 0 ? 'Basement' : `Floor ${floorNum}`})`
    };
  }

  return null;
}

function convertToLatinLetter(letter) {
  const upper = letter.toUpperCase();
  if (upper === 'А') return 'A';
  if (upper === 'В' || upper === 'Б') return 'B';
  if (upper === 'С' || upper === 'C') return 'C';
  if (upper === 'Д' || upper === 'Г') return 'D';
  return upper;
}

function formatRecognitionResult(r) {
  const blockKey = `block${r.block}`;
  const floorKey = r.floor === 0 ? 'basement' : `floor${r.floor}`;
  const floorTitle = r.floor === 0 ? 'Basement' : `${r.floor}${r.floor === 1 ? 'st' : r.floor === 2 ? 'nd' : 'rd'} Floor`;
  const formatted = `Block ${r.block} • ${floorTitle} • ${r.code} (${r.name})`;

  return {
    matched: true,
    code: r.code,
    name: r.name,
    block: r.block,
    floor: r.floor,
    blockKey,
    floorKey,
    areaType: r.areaType,
    formatted,
    fullLabel: `${r.code} — ${r.name} (Block ${r.block}, ${floorTitle})`
  };
}

/**
 * Filter rooms by Block (A, B, C, D) and Floor (0, 1, 2, 3)
 */
export function getRoomsByBlockAndFloor(blockLetter, floorNumber) {
  const normalizedLetter = (blockLetter || '').replace(/^block/i, '').toUpperCase();
  const num = typeof floorNumber === 'string'
    ? (floorNumber === 'basement' ? 0 : parseInt(floorNumber.replace(/\D/g, ''), 10))
    : floorNumber;

  return CAMPUS_ROOMS.filter(r => {
    const matchBlock = !normalizedLetter || r.block.toUpperCase() === normalizedLetter;
    const matchFloor = num === undefined || isNaN(num) || r.floor === num;
    return matchBlock && matchFloor;
  });
}

/**
 * Search rooms with autocomplete / fuzzy matching
 */
export function searchCampusRooms(term, limit = 8) {
  if (!term || typeof term !== 'string' || term.trim().length === 0) {
    return [];
  }

  const query = term.toLowerCase().trim();
  const results = [];

  for (const r of CAMPUS_ROOMS) {
    const codeMatch = r.code.toLowerCase().includes(query);
    const nameMatch = r.name.toLowerCase().includes(query);
    const kwMatch = r.keywords.some(k => k.toLowerCase().includes(query));

    if (codeMatch || nameMatch || kwMatch) {
      results.push(formatRecognitionResult(r));
      if (results.length >= limit) break;
    }
  }

  return results;
}
