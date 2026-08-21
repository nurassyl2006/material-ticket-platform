export const translations = {
  en: {
    appName: "EduSupply - Material Request Portal",
    subtitle: "Streamlined resource request and inventory distribution system",
    languages: {
      en: "English",
      ru: "Русский",
      kk: "Қазақша"
    },
    roles: {
      teacher: "Teacher",
      workerA: "Worker A (Supply & Procurement)",
      admin: "Administrator"
    },
    nav: {
      dashboard: "Dashboard",
      newTicket: "New Request",
      inventory: "Stock Inventory",
      tickets: "All Tickets",
      myTickets: "My Requests",
      profile: "My Profile",
      stats: "Analytics"
    },
    profile: {
      title: "User Profile",
      editTitle: "Edit Profile Information",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      department: "Department / Office",
      role: "Assigned Role",
      call: "Call",
      whatsapp: "WhatsApp",
      saveProfile: "Save Changes",
      profileUpdated: "Profile updated successfully!",
      contactTeacher: "Contact Teacher"
    },
    auth: {
      loginTitle: "School Staff Authorization",
      selectRole: "Select Role to Enter Portal",
      loggedAs: "Logged in as:",
      switchRole: "Switch User Role",
      teacherDesc: "Submit requests for classroom materials, stationary, & equipment",
      workerADesc: "Fulfill material tickets from inventory or purchase requested items",
      adminDesc: "Overview of platform activity, expenditures, and inventory metrics",
      enterPortal: "Enter Portal"
    },
    tickets: {
      title: "Material Requests",
      createTitle: "Create Material Request Ticket",
      itemTitle: "Material / Item Name",
      itemPlaceholder: "e.g., Whiteboard Markers, A4 Paper Boxes, Projector Cable",
      category: "Category",
      quantity: "Quantity Required",
      unit: "Unit",
      urgency: "Urgency Level",
      urgencies: {
        low: "Low (Normal schedule)",
        medium: "Medium (Within 3 days)",
        high: "High (Urgent - 24 Hours)",
        critical: "Critical (Immediate class impact)"
      },
      roomNumber: "Target Classroom / Office",
      description: "Justification & Details",
      descPlaceholder: "Describe why this material is needed, specs, or brand preferences...",
      submit: "Submit Request Ticket",
      status: {
        pending: "Pending Review",
        issued: "Given by Worker A (In Stock)",
        purchasing: "To be Bought by Worker A",
        delivered: "Fulfilled & Delivered",
        rejected: "Request Rejected"
      },
      assignedTo: "Assigned Handler",
      actionWorkerA: "Worker A Processing",
      issueFromStock: "Give from Stock",
      markToPurchase: "Buy Item (Not in stock)",
      completeDelivery: "Confirm Delivery",
      purchaseCost: "Estimated/Actual Cost (₸)",
      supplier: "Supplier / Store Info",
      notes: "Worker A Notes",
      filterAll: "All Statuses",
      searchPlaceholder: "Search tickets by item, teacher, room or phone...",
      noTickets: "No ticket records found.",
      createdAt: "Requested on",
      updatedAt: "Last updated",
      ticketDetails: "Ticket Details",
      teacher: "Requesting Teacher",
      phone: "Phone Number"
    },
    inventory: {
      title: "Material Stock Inventory",
      addItem: "Add New Item to Stock",
      itemName: "Item Name",
      category: "Category",
      inStock: "Available Stock",
      unit: "Unit",
      minLevel: "Minimum Alert Level",
      location: "Storage Location",
      statusOk: "In Stock",
      statusLow: "Low Stock",
      statusOut: "Out of Stock",
      updateStock: "Update Stock",
      actions: "Actions",
      categories: {
        stationary: "Stationary & Paper",
        electronics: "Electronics & Audio",
        furniture: "Furniture & Decor",
        lab: "Science & Lab Equipment",
        cleaning: "Cleaning & Maintenance",
        other: "General Materials"
      }
    },
    dashboard: {
      welcome: "Welcome back,",
      teacherSummary: "Manage your classroom material requests easily.",
      workerASummary: "Manage inventory issues and item procurement.",
      totalTickets: "Total Tickets",
      pendingAction: "Pending Worker A",
      givenFromStock: "Given from Stock",
      boughtByWorkerA: "To be / Being Bought",
      inventoryItems: "Catalog Stock Items",
      lowStockAlert: "Low Stock Warning"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      confirm: "Confirm",
      delete: "Delete",
      success: "Operation completed successfully!",
      error: "An error occurred."
    }
  },
  ru: {
    appName: "EduSupply - Портал Заявок на Материалы",
    subtitle: "Система запроса учебных материалов и распределения запасов",
    languages: {
      en: "English",
      ru: "Русский",
      kk: "Қазақша"
    },
    roles: {
      teacher: "Учитель / Преподаватель",
      workerA: "Работник А (Снабжение и Закупки)",
      admin: "Администратор"
    },
    nav: {
      dashboard: "Главная",
      newTicket: "Новая заявка",
      inventory: "Склад и Запас",
      tickets: "Все заявки",
      myTickets: "Мои заявки",
      profile: "Мой профиль",
      stats: "Аналитика"
    },
    profile: {
      title: "Профиль пользователя",
      editTitle: "Редактировать профиль",
      name: "ФИО",
      email: "Электронная почта",
      phone: "Номер телефона",
      department: "Отдел / Кафедра",
      role: "Текущая роль",
      call: "Позвонить",
      whatsapp: "Написать в WhatsApp",
      saveProfile: "Сохранить изменения",
      profileUpdated: "Профиль успешно обновлен!",
      contactTeacher: "Связаться с учителем"
    },
    auth: {
      loginTitle: "Авторизация сотрудников школы",
      selectRole: "Выберите роль для входа в портал",
      loggedAs: "Вы вошли как:",
      switchRole: "Сменить роль",
      teacherDesc: "Создавайте заявки на материалы, канцелярские товары и оборудование",
      workerADesc: "Выдавайте имеющиеся материалы со склада или закупайте отсутствующие",
      adminDesc: "Обзор активности портала, расходов и показателей склада",
      enterPortal: "Войти в портал"
    },
    tickets: {
      title: "Заявки на материалы",
      createTitle: "Создать заявку на получение материала",
      itemTitle: "Наименование материала / товара",
      itemPlaceholder: "Например: Маркеры для доски, Бумага А4, Кабель для проектора",
      category: "Категория",
      quantity: "Требуемое количество",
      unit: "Единица измерения",
      urgency: "Срочность",
      urgencies: {
        low: "Низкая (Обычный порядок)",
        medium: "Средняя (В течение 3 дней)",
        high: "Высокая (Срочно - 24 часа)",
        critical: "Критическая (Срыв занятий)"
      },
      roomNumber: "Кабинет / Класс",
      description: "Обоснование и детали",
      descPlaceholder: "Опишите, зачем нужен материал, требуемые характеристики...",
      submit: "Отправить заявку",
      status: {
        pending: "На рассмотрении",
        issued: "Выдано Работником А (Из запасов)",
        purchasing: "Будет куплено Работником А",
        delivered: "Выполнено и доставлено",
        rejected: "Отклонено"
      },
      assignedTo: "Ответственный",
      actionWorkerA: "Действия Работника А",
      issueFromStock: "Выдать со склада",
      markToPurchase: "Закупить (Нет в наличии)",
      completeDelivery: "Подтвердить доставку",
      purchaseCost: "Стоимость (₸)",
      supplier: "Поставщик / Магазин",
      notes: "Заметки Работника А",
      filterAll: "Все статусы",
      searchPlaceholder: "Поиск по предмету, учителю, кабинету или телефону...",
      noTickets: "Заявки не найдены.",
      createdAt: "Дата заявки",
      updatedAt: "Обновлено",
      ticketDetails: "Детали заявки",
      teacher: "Запрашивающий учитель",
      phone: "Телефон"
    },
    inventory: {
      title: "Складские запасы материалов",
      addItem: "Добавить позицию на склад",
      itemName: "Наименование товара",
      category: "Категория",
      inStock: "В наличии",
      unit: "Ед. изм.",
      minLevel: "Мин. остаток",
      location: "Место хранения",
      statusOk: "В наличии",
      statusLow: "Мало на складе",
      statusOut: "Отсутствует",
      updateStock: "Обновить остатки",
      actions: "Действия",
      categories: {
        stationary: "Канцелярия и бумага",
        electronics: "Электроника и аудио",
        furniture: "Мебель и интерьер",
        lab: "Лабораторное оборудование",
        cleaning: "Хозяйственные товары",
        other: "Общие материалы"
      }
    },
    dashboard: {
      welcome: "Добро пожаловать,",
      teacherSummary: "Управляйте заявками на материалы для ваших занятий.",
      workerASummary: "Выдавайте материалы со склада или организуйте закупку.",
      totalTickets: "Всего заявок",
      pendingAction: "Ожидают обработки",
      givenFromStock: "Выдано со склада",
      boughtByWorkerA: "Закупается Работником А",
      inventoryItems: "Позиций на складе",
      lowStockAlert: "Предупреждение о малом запасе"
    },
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      confirm: "Подтвердить",
      delete: "Удалить",
      success: "Операция успешно выполнена!",
      error: "Произошла ошибка."
    }
  },
  kk: {
    appName: "EduSupply - Материалдарға тапсырыс порталы",
    subtitle: "Оқу материалдарын сұраныстау және қойманы тарату жүйесі",
    languages: {
      en: "English",
      ru: "Русский",
      kk: "Қазақша"
    },
    roles: {
      teacher: "Мұғалім / Оқытушы",
      workerA: "А Қызметкері (Жабдықтау және сатып алу)",
      admin: "Администратор"
    },
    nav: {
      dashboard: "Басты бет",
      newTicket: "Жаңа тапсырыс",
      inventory: "Қойма қоры",
      tickets: "Барлық тапсырыстар",
      myTickets: "Менің тапсырыстарым",
      profile: "Профиль",
      stats: "Аналитика"
    },
    profile: {
      title: "Пайдаланушы профилі",
      editTitle: "Профильді өңдеу",
      name: "Толық аты-жөні",
      email: "Электронды пошта",
      phone: "Телефон нөмірі",
      department: "Бөлім / Департамент",
      role: "Ағымдағы рөл",
      call: "Қоңырау шалу",
      whatsapp: "WhatsApp арқылы жазу",
      saveProfile: "Өзгерістерді сақтау",
      profileUpdated: "Профиль сәтті жаңартылды!",
      contactTeacher: "Мұғалімге хабарласу"
    },
    auth: {
      loginTitle: "Мектеп қызметкерлерін авторизациялау",
      selectRole: "Порталға кіру үшін рөлді таңдаңыз",
      loggedAs: "Кірген рөліңіз:",
      switchRole: "Рөлді ауыстыру",
      teacherDesc: "Сабаққа қажетті материалдарға, кеңсе тауарларына өтінім беріңіз",
      workerADesc: "Қоймада бар материалды беріңіз немесе жоқ материалды сатып алыңыз",
      adminDesc: "Портал белсенділігін, шығындар мен қойма көрсеткіштерін бақылау",
      enterPortal: "Порталға кіру"
    },
    tickets: {
      title: "Материалдарға тапсырыстар",
      createTitle: "Материал алуға өткінім жасау",
      itemTitle: "Материал / тауар атауы",
      itemPlaceholder: "Мысалы: Тақта маркерлері, А4 қағазы, Проектор кабелі",
      category: "Категориясы",
      quantity: "Талап етілетін саны",
      unit: "Өлшем бірлігі",
      urgency: "Шұғылдығы",
      urgencies: {
        low: "Төмен (Күндік тәртіппен)",
        medium: "Орташа (3 күн ішінде)",
        high: "Жоғары (Шұғыл - 24 сағат)",
        critical: "Критикалық (Сабақ тоқтау қаупі)"
      },
      roomNumber: "Кабинет / Сынып",
      description: "Негіздеме және сипаттама",
      descPlaceholder: "Материал не үшін қажет екенін, техникалық талаптарын жазыңыз...",
      submit: "Тапсырысты жіберу",
      status: {
        pending: "Каралуда",
        issued: "А қызметкері берді (Қоймадан)",
        purchasing: "А қызметкері сатып алады",
        delivered: "Орындалды және жеткізілді",
        rejected: "Қабылданбады"
      },
      assignedTo: "Жауапты қызметкер",
      actionWorkerA: "А қызметкерінің әрекеттері",
      issueFromStock: "Қоймадан беру",
      markToPurchase: "Сатып алу (Қоймада жоқ)",
      completeDelivery: "Жеткізуді растау",
      purchaseCost: "Құны (₸)",
      supplier: "Дүкен / Жабдықтаушы",
      notes: "А қызметкерінің жазбалары",
      filterAll: "Барлық мәртебелер",
      searchPlaceholder: "Тауар, мұғалім, кабинет немесе телефон бойынша іздеу...",
      noTickets: "Тапсырыстар табылған жоқ.",
      createdAt: "Өтінім берілген күн",
      updatedAt: "Жаңартылды",
      ticketDetails: "Өтінім мәліметтері",
      teacher: "Өтінім берген мұғалім",
      phone: "Телефон"
    },
    inventory: {
      title: "Қоймадағы материалдар қоры",
      addItem: "Қоймаға жаңа тауар қосу",
      itemName: "Тауар атауы",
      category: "Категориясы",
      inStock: "Қоймада бар",
      unit: "Өлшем бірлігі",
      minLevel: "Мин. қалдық",
      location: "Сақтау орны",
      statusOk: "Қоймада бар",
      statusLow: "Аз қалды",
      statusOut: "Таусылды",
      updateStock: "Қалдықты жаңарту",
      actions: "Әрекеттер",
      categories: {
        stationary: "Кенсе және қағаз",
        electronics: "Электроника және аудио",
        furniture: "Жиһаз және интерьер",
        lab: "Лабораториялық құралдар",
        cleaning: "Шаруашылық тауарлары",
        other: "Жалпы материалдар"
      }
    },
    dashboard: {
      welcome: "Қош келдіңіз,",
      teacherSummary: "Сабақтарыңызға қажетті материалдарға өтінімдерді басқарыңыз.",
      workerASummary: "Қоймадан тауар беріңіз немесе сатып алуды ұйымдастырыңыз.",
      totalTickets: "Барлық өтінімдер",
      pendingAction: "Карауды күтуде",
      givenFromStock: "Қоймадан берілді",
      boughtByWorkerA: "А қызметкері сатып алуда",
      inventoryItems: "Қоймадағы тауар түрі",
      lowStockAlert: "Аз қалған тауарлар ескертуі"
    },
    common: {
      save: "Сақтау",
      cancel: "Бас тарту",
      close: "Жабу",
      confirm: "Растау",
      delete: "Жою",
      success: "Әрекет сәтті орындалды!",
      error: "Қате орын алды."
    }
  }
};
