import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';
import { mockInventory, mockUsers } from './mockData';
import {
  fetchTicketsFromDb,
  createTicketInDb,
  updateTicketInDb,
  bulkSyncTicketsToDb,
  fetchInventoryFromDb,
  createInventoryItemInDb,
  updateInventoryQtyInDb,
  fetchUsersFromDb,
  updateUserProfileInDb,
  fetchNotificationsFromDb,
  createNotificationInDb,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  clearNotificationsInDb,
  resetDatabaseInDb
} from './api';

const AppContext = createContext();

const OLD_MOCK_IDS = new Set([
  'TCK-1001', 'TCK-1002', 'TCK-1003', 'TCK-1004', 'TCK-1005',
  'TCK-1006', 'TCK-1007', 'TCK-1008', 'TCK-1009', 'TCK-1010',
  'TCK-1011', 'TCK-1012', 'TCK-1013', 'TCK-1014'
]);

export const AppProvider = ({ children }) => {
  // Language state
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');

  // Role state with legacy mapping
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('app_role');
    if (saved === 'workerA') return 'storage_manager';
    if (saved === 'admin') return 'director';
    return saved || 'teacher';
  });

  // Authentication session state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('app_auth') === 'true';
  });

  // Inventory state (Goods storage)
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('app_inventory_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockInventory;
      }
    }
    return mockInventory;
  });

  // Tickets state
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('app_tickets_v3') || localStorage.getItem('app_tickets_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !OLD_MOCK_IDS.has(t.id));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Users state
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('app_users_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleanUsers = { ...mockUsers };
        for (const k of Object.keys(parsed)) {
          if (cleanUsers[k]) {
            cleanUsers[k] = {
              ...cleanUsers[k],
              name: (parsed[k]?.name === 'Aigul Nurlan' || parsed[k]?.name === 'Dias Saparov' || parsed[k]?.name === 'Gulnara Akhmetova' || parsed[k]?.name === 'Kairat Smagulov' || parsed[k]?.name === 'Nurassyl (Facilities Manager)' || parsed[k]?.name === 'Erlan Kozhakhmetov' || parsed[k]?.name === 'Bauyrzhan Akhmetov')
                ? cleanUsers[k].name
                : (parsed[k]?.name || cleanUsers[k].name),
              phone: parsed[k]?.phone?.includes('777') ? '' : (parsed[k]?.phone || ''),
              avatar: parsed[k]?.avatar?.includes('unsplash') ? '' : (parsed[k]?.avatar || '')
            };
          }
        }
        return cleanUsers;
      } catch (e) {
        return mockUsers;
      }
    }
    return mockUsers;
  });

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('app_notifications_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Database Connection Status: 'connected' | 'syncing' | 'offline'
  const [dbStatus, setDbStatus] = useState('syncing');

  // Persistence to localStorage for instant startup and offline resilience
  useEffect(() => {
    localStorage.setItem('app_notifications_v3', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('app_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('app_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('app_inventory_v3', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('app_tickets_v3', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('app_users_v3', JSON.stringify(users));
  }, [users]);

  // Synchronize state with SQLite database
  const syncWithDb = useCallback(async () => {
    try {
      setDbStatus(prev => prev === 'connected' ? 'connected' : 'syncing');

      // Fetch all entities concurrently
      const [ticketsResult, invResult, usersResult, notifsResult] = await Promise.allSettled([
        fetchTicketsFromDb(),
        fetchInventoryFromDb(),
        fetchUsersFromDb(),
        fetchNotificationsFromDb()
      ]);

      let reachedServer = false;

      // 1. Process Tickets from DB
      if (ticketsResult.status === 'fulfilled' && Array.isArray(ticketsResult.value)) {
        reachedServer = true;
        const dbTickets = ticketsResult.value.filter(t => !OLD_MOCK_IDS.has(t.id));

        // If DB is empty but local storage has user tickets, migrate them to DB
        setTickets(currentLocalTickets => {
          if (dbTickets.length === 0 && currentLocalTickets.length > 0) {
            bulkSyncTicketsToDb(currentLocalTickets).catch(() => {});
            return currentLocalTickets;
          }
          return dbTickets;
        });
      }

      // 2. Process Goods Inventory from DB
      if (invResult.status === 'fulfilled' && Array.isArray(invResult.value) && invResult.value.length > 0) {
        reachedServer = true;
        setInventory(invResult.value);
      }

      // 3. Process Users from DB
      if (usersResult.status === 'fulfilled' && usersResult.value && usersResult.value.map) {
        reachedServer = true;
        setUsers(prev => ({
          ...prev,
          ...usersResult.value.map
        }));
      }

      // 4. Process Notifications from DB
      if (notifsResult.status === 'fulfilled' && Array.isArray(notifsResult.value)) {
        reachedServer = true;
        setNotifications(notifsResult.value);
      }

      if (reachedServer) {
        setDbStatus('connected');
      } else {
        setDbStatus('offline');
      }
    } catch (err) {
      setDbStatus('offline');
    }
  }, []);

  // Periodic DB synchronization & sync on window focus/tab switch
  useEffect(() => {
    syncWithDb();

    // Poll every 3 seconds for live collaborative updates
    const interval = setInterval(syncWithDb, 3000);

    const onActive = () => {
      if (!document.hidden) {
        syncWithDb();
      }
    };

    window.addEventListener('focus', onActive);
    document.addEventListener('visibilitychange', onActive);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onActive);
      document.removeEventListener('visibilitychange', onActive);
    };
  }, [syncWithDb]);

  // Notifications helper
  const addNotification = (recipientName, ticketId, title, message, status) => {
    if (!recipientName) return;
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientName,
      ticketId,
      title,
      message,
      status: status || 'info',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Save to DB in background
    createNotificationInDb(newNotif).catch(() => {});
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationReadInDb(id).catch(() => {});
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllNotificationsReadInDb().catch(() => {});
  };

  const clearNotifications = () => {
    setNotifications([]);
    clearNotificationsInDb().catch(() => {});
  };

  const login = (roleKey) => {
    setRole(roleKey);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const t = translations[lang] || translations.en;
  
  // Resolve current active user profile
  const currentUser = users[role] || (role === 'workerA' ? users.storage_manager : (role === 'admin' ? users.director : (users[role] || users.teacher)));

  const updateUserProfile = (updatedProfileData) => {
    setUsers(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        ...updatedProfileData
      }
    }));

    // Persist to DB
    updateUserProfileInDb(role, updatedProfileData).catch(() => {});
  };

  // Reset to default clean state
  const resetDemoData = async () => {
    try {
      await resetDatabaseInDb();
    } catch (e) {
      // offline fallback
    }
    setInventory(mockInventory);
    setTickets([]);
    setUsers(mockUsers);
    setNotifications([]);
    localStorage.removeItem('app_inventory_v3');
    localStorage.removeItem('app_tickets_v3');
    localStorage.removeItem('app_users_v3');
    localStorage.removeItem('app_notifications_v3');
  };

  // Ticket Management
  const addTicket = (ticketData) => {
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      department: ticketData.department || 'other',
      itemTitle: ticketData.itemTitle,
      subcategory: ticketData.subcategory || '',
      category: ticketData.category || 'other',
      quantity: Number(ticketData.quantity) || 1,
      unit: ticketData.unit || 'pcs',
      urgency: ticketData.urgency || 'medium',
      roomNumber: ticketData.roomNumber,
      moveDetails: ticketData.moveDetails || null,
      description: ticketData.description || '',
      photos: ticketData.photos || [],
      completionPhotos: [],
      teacherName: currentUser.name || t.roles[role] || 'Teacher',
      teacherPhone: currentUser.phone || '',
      status: 'pending',
      assignedWorker: null,
      assignedRole: null,
      handledAction: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);

    // Persist ticket in DB
    createTicketInDb(newTicket).catch(() => {});

    return newTicket;
  };

  // Generic status updater
  const updateTicket = (ticketId, updates) => {
    const updatedAt = new Date().toISOString();
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          ...updates,
          updatedAt
        };
      }
      return ticket;
    }));

    // Persist in DB
    updateTicketInDb(ticketId, { ...updates, updatedAt }).catch(() => {});
  };

  // Start working on ticket (used by IT, Cleaning, Facilities, Engineer)
  const startTicketWork = (ticketId, notes = '') => {
    let target = null;
    const updatedAt = new Date().toISOString();
    const payload = {
      status: 'in_progress',
      handledAction: 'in_progress',
      assignedWorker: currentUser.name,
      assignedRole: role,
      notes: notes || 'Staff member started working on this request.',
      updatedAt
    };

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          ...payload,
          notes: notes || ticket.notes || payload.notes
        };
      }
      return ticket;
    }));

    updateTicketInDb(ticketId, payload).catch(() => {});

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        target.id,
        t.notifications.ticketAssigned,
        `${currentUser.name} (${t.roles[role] || role}) started working on: "${target.itemTitle}".`,
        'in_progress'
      );
    }
  };

  // Storage Manager: Issue item directly from stock
  const issueTicketFromStock = (ticketId, notes = '') => {
    let target = null;
    const updatedAt = new Date().toISOString();
    const payload = {
      status: 'issued',
      handledAction: 'issued',
      assignedWorker: currentUser.name,
      assignedRole: 'storage_manager',
      notes: notes || 'Issued directly from warehouse inventory stock.',
      updatedAt
    };

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          ...payload
        };
      }
      return ticket;
    }));

    updateTicketInDb(ticketId, payload).catch(() => {});

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        target.id,
        t.notifications.ticketIssued,
        `Item "${target.itemTitle}" has been prepared and issued from stock.`,
        'issued'
      );
    }

    // Deduct stock quantity in inventory and in DB if matching item exists
    const targetTicket = target || tickets.find(t => t.id === ticketId);
    if (targetTicket) {
      setInventory(prev => prev.map(item => {
        if (item.name.toLowerCase() === targetTicket.itemTitle.toLowerCase()) {
          const newQty = Math.max(0, item.quantity - (targetTicket.quantity || 1));
          updateInventoryQtyInDb(item.id, { quantity: newQty }).catch(() => {});
          return { ...item, quantity: newQty };
        }
        return item;
      }));
    }
  };

  // Storage Manager: Mark item to be purchased
  const markTicketToPurchase = (ticketId, purchaseCost, supplier, notes) => {
    let target = null;
    const updatedAt = new Date().toISOString();
    const payload = {
      status: 'purchasing',
      handledAction: 'purchased',
      assignedWorker: currentUser.name,
      assignedRole: 'storage_manager',
      purchaseCost: Number(purchaseCost) || 0,
      supplier: supplier || 'Official Supplier / Vendor',
      notes: notes || 'Item not in stock. Storage manager initiated procurement order.',
      updatedAt
    };

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          ...payload
        };
      }
      return ticket;
    }));

    updateTicketInDb(ticketId, payload).catch(() => {});

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        target.id,
        t.notifications.ticketPurchasing,
        `Item "${target.itemTitle}" is not in stock. Order procurement placed with ${supplier || 'supplier'}.`,
        'purchasing'
      );
    }
  };

  // Complete ticket / Deliver / Resolve
  const completeTicketDelivery = (ticketId, notes = '') => {
    let target = null;
    const updatedAt = new Date().toISOString();
    let updatedFields = null;

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        updatedFields = {
          status: 'completed',
          handledAction: 'completed',
          assignedWorker: ticket.assignedWorker || currentUser.name,
          assignedRole: ticket.assignedRole || role,
          notes: notes || ticket.notes || 'Job confirmed as completed and resolved.',
          updatedAt
        };
        return {
          ...ticket,
          ...updatedFields
        };
      }
      return ticket;
    }));

    if (updatedFields) {
      updateTicketInDb(ticketId, updatedFields).catch(() => {});
    }

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        target.id,
        t.notifications.ticketResolved,
        `Request "${target.itemTitle}" has been resolved & completed by ${currentUser.name}.`,
        'completed'
      );
    }
  };

  // Add photos to an existing ticket
  const addPhotosToTicket = (ticketId, photosArray, isCompletion = false) => {
    const updatedAt = new Date().toISOString();
    let currentPhotos = [];

    setTickets(prev => prev.map(ticket => {
      if (ticket.id !== ticketId) return ticket;
      if (isCompletion) {
        currentPhotos = [...(ticket.completionPhotos || []), ...photosArray];
        updateTicketInDb(ticketId, { completionPhotos: currentPhotos, updatedAt }).catch(() => {});
        return {
          ...ticket,
          completionPhotos: currentPhotos,
          updatedAt
        };
      }
      currentPhotos = [...(ticket.photos || []), ...photosArray];
      updateTicketInDb(ticketId, { photos: currentPhotos, updatedAt }).catch(() => {});
      return {
        ...ticket,
        photos: currentPhotos,
        updatedAt
      };
    }));
  };

  // Facilities Manager: Update moving details / dispatch
  const updateFacilitiesMove = (ticketId, moveDetails, notes = '') => {
    const updatedAt = new Date().toISOString();
    let fullMoveDetails = null;

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        fullMoveDetails = {
          ...(ticket.moveDetails || {}),
          ...moveDetails
        };
        const payload = {
          status: 'in_progress',
          handledAction: 'in_progress',
          assignedWorker: currentUser.name,
          assignedRole: 'facilities_manager',
          moveDetails: fullMoveDetails,
          notes: notes || 'Facilities moving crew active.',
          updatedAt
        };
        updateTicketInDb(ticketId, payload).catch(() => {});
        return {
          ...ticket,
          ...payload
        };
      }
      return ticket;
    }));
  };

  // Storage list of goods (Inventory updates)
  const addInventoryItem = (newItem) => {
    const item = {
      id: `inv-${Date.now()}`,
      ...newItem,
      quantity: Number(newItem.quantity) || 0,
      minLevel: Number(newItem.minLevel) || 5
    };
    setInventory(prev => [item, ...prev]);
    createInventoryItemInDb(item).catch(() => {});
  };

  const updateInventoryQty = (id, newQty) => {
    const clampedQty = Math.max(0, newQty);
    setInventory(prev => prev.map(item => item.id === id ? { ...item, quantity: clampedQty } : item));
    updateInventoryQtyInDb(id, { quantity: clampedQty }).catch(() => {});
  };

  // Notifications visible to the current logged in user
  const userNotifications = React.useMemo(() => {
    if (!currentUser?.name) return [];
    if (role === 'director' || role === 'admin') return notifications;
    const myName = currentUser.name.toLowerCase();
    return notifications.filter(n => 
      n.recipientName && (
        n.recipientName.toLowerCase().includes(myName) ||
        myName.includes(n.recipientName.toLowerCase()) ||
        n.recipientName.toLowerCase() === 'teacher' ||
        role === 'teacher'
      )
    );
  }, [notifications, currentUser, role]);

  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      role,
      setRole,
      isAuthenticated,
      login,
      logout,
      t,
      users,
      currentUser,
      updateUserProfile,
      inventory,
      tickets,
      dbStatus,
      cloudStatus: dbStatus === 'connected' ? 'synced' : dbStatus, // Backward-compatibility
      syncWithDb,
      syncWithCloud: syncWithDb, // Backward-compatibility
      notifications: userNotifications,
      allNotifications: notifications,
      unreadCount,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      addTicket,
      updateTicket,
      startTicketWork,
      issueTicketFromStock,
      markTicketToPurchase,
      completeTicketDelivery,
      updateFacilitiesMove,
      addInventoryItem,
      updateInventoryQty,
      addPhotosToTicket,
      resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
