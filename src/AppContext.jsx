import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';
import { mockInventory, mockTickets, mockUsers } from './mockData';
import { fetchCloudTickets, pushCloudTickets, mergeTickets } from './cloudSync';

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

  // Inventory state
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

  // Tickets state: empty by default, purged of old mock tickets
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('app_tickets_v3') || localStorage.getItem('app_tickets_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo tickets
          const clean = parsed.filter(t => !OLD_MOCK_IDS.has(t.id));
          return clean;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Users state: cleaned of mock names & photos
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('app_users_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure no lingering unsplash avatars or mock names
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

  // Notifications state: empty by default
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

  // Cloud sync status: 'idle' | 'syncing' | 'synced'
  const [cloudStatus, setCloudStatus] = useState('idle');

  // Persistence effects
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

  // Helper: Save tickets and immediately push to cloud
  const saveAndBroadcastTickets = useCallback((updater) => {
    setTickets(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushCloudTickets(next);
      return next;
    });
  }, []);

  // Sync with cloud (fetches, merges, and broadcasts back if local has newer tickets)
  const syncWithCloud = useCallback(async () => {
    try {
      setCloudStatus('syncing');
      const remoteTickets = await fetchCloudTickets();
      if (Array.isArray(remoteTickets)) {
        // Strip legacy mock tickets from remote
        const cleanRemote = remoteTickets.filter(t => !OLD_MOCK_IDS.has(t.id));
        setTickets(currentTickets => {
          const merged = mergeTickets(currentTickets, cleanRemote);

          // If local has updates that remote lacks, push back
          const remoteKeySet = new Set(cleanRemote.map(t => `${t.id}_${t.updatedAt || t.createdAt}`));
          const needsPush = merged.some(t => !remoteKeySet.has(`${t.id}_${t.updatedAt || t.createdAt}`));
          if (needsPush) {
            pushCloudTickets(merged);
          }
          return merged;
        });
        setCloudStatus('synced');
      } else {
        setCloudStatus('idle');
      }
    } catch (err) {
      setCloudStatus('idle');
    }
  }, []);

  // Periodic cloud sync & sync on window focus/tab switch
  useEffect(() => {
    syncWithCloud();

    // Poll every 3.5 seconds so devices see changes quickly
    const interval = setInterval(syncWithCloud, 3500);

    const onActive = () => {
      if (!document.hidden) {
        syncWithCloud();
      }
    };

    window.addEventListener('focus', onActive);
    document.addEventListener('visibilitychange', onActive);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onActive);
      document.removeEventListener('visibilitychange', onActive);
    };
  }, [syncWithCloud]);

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
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
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
  };

  // Reset to default mock data (clean empty tickets)
  const resetDemoData = () => {
    setInventory(mockInventory);
    setTickets([]);
    setUsers(mockUsers);
    setNotifications([]);
    localStorage.removeItem('app_inventory_v3');
    localStorage.removeItem('app_inventory_v2');
    localStorage.removeItem('app_tickets_v3');
    localStorage.removeItem('app_tickets_v2');
    localStorage.removeItem('app_users_v3');
    localStorage.removeItem('app_users_v2');
    localStorage.removeItem('app_notifications_v3');
    localStorage.removeItem('app_notifications_v1');
    pushCloudTickets([]);
  };

  // Ticket Management
  const addTicket = (ticketData) => {
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      department: ticketData.department || 'storage',
      itemTitle: ticketData.itemTitle,
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
    saveAndBroadcastTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  // Generic status updater
  const updateTicket = (ticketId, updates) => {
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));
  };

  // Start working on ticket (used by IT, Cleaning, Facilities, Engineer)
  const startTicketWork = (ticketId, notes = '') => {
    let target = null;
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          status: 'in_progress',
          handledAction: 'in_progress',
          assignedWorker: currentUser.name,
          assignedRole: role,
          notes: notes || ticket.notes || 'Staff member started working on this request.',
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));
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
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          status: 'issued',
          handledAction: 'issued',
          assignedWorker: currentUser.name,
          assignedRole: 'storage_manager',
          notes: notes || 'Issued directly from warehouse inventory stock.',
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        target.id,
        t.notifications.ticketIssued,
        `Item "${target.itemTitle}" has been prepared and issued from stock.`,
        'issued'
      );
    }

    // Deduct stock quantity if matching inventory item exists
    const targetTicket = target || tickets.find(t => t.id === ticketId);
    if (targetTicket) {
      setInventory(prev => prev.map(item => {
        if (item.name.toLowerCase() === targetTicket.itemTitle.toLowerCase()) {
          const newQty = Math.max(0, item.quantity - (targetTicket.quantity || 1));
          return { ...item, quantity: newQty };
        }
        return item;
      }));
    }
  };

  // Storage Manager: Mark item to be purchased
  const markTicketToPurchase = (ticketId, purchaseCost, supplier, notes) => {
    let target = null;
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          status: 'purchasing',
          handledAction: 'purchased',
          assignedWorker: currentUser.name,
          assignedRole: 'storage_manager',
          purchaseCost: Number(purchaseCost) || 0,
          supplier: supplier || 'Official Supplier / Vendor',
          notes: notes || 'Item not in stock. Storage manager initiated procurement order.',
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));

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
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = ticket;
        return {
          ...ticket,
          status: 'completed',
          handledAction: 'completed',
          assignedWorker: ticket.assignedWorker || currentUser.name,
          assignedRole: ticket.assignedRole || role,
          notes: notes || ticket.notes || 'Job confirmed as completed and resolved.',
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));

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

  // Add photos to an existing ticket (before or after completion)
  const addPhotosToTicket = (ticketId, photosArray, isCompletion = false) => {
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id !== ticketId) return ticket;
      if (isCompletion) {
        return {
          ...ticket,
          completionPhotos: [...(ticket.completionPhotos || []), ...photosArray],
          updatedAt: new Date().toISOString()
        };
      }
      return {
        ...ticket,
        photos: [...(ticket.photos || []), ...photosArray],
        updatedAt: new Date().toISOString()
      };
    }));
  };

  // Facilities Manager: Update moving details / dispatch
  const updateFacilitiesMove = (ticketId, moveDetails, notes = '') => {
    saveAndBroadcastTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'in_progress',
          handledAction: 'in_progress',
          assignedWorker: currentUser.name,
          assignedRole: 'facilities_manager',
          moveDetails: {
            ...(ticket.moveDetails || {}),
            ...moveDetails
          },
          notes: notes || 'Facilities moving crew active.',
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));
  };

  // Inventory updates
  const addInventoryItem = (newItem) => {
    const item = {
      id: `inv-${Date.now()}`,
      ...newItem,
      quantity: Number(newItem.quantity) || 0,
      minLevel: Number(newItem.minLevel) || 5
    };
    setInventory(prev => [item, ...prev]);
  };

  const updateInventoryQty = (id, newQty) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, newQty) } : item));
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
      cloudStatus,
      syncWithCloud,
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
