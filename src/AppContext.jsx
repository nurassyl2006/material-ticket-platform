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
  addPhotoToInventoryItemInDb,
  fetchUsersFromDb,
  updateUserProfileInDb,
  createUserInDb,
  updateUserRoleInDb,
  resetUserPasswordInDb,
  deleteUserFromDb,
  fetchNotificationsFromDb,
  createNotificationInDb,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  clearNotificationsInDb,
  resetDatabaseInDb,
  loginUserApi,
  registerUserApi,
  fetchAuthMeApi,
  changePasswordApi,
  logoutUserApi,
  markTicketReturnedByTeacherInDb,
  confirmTicketReturnInDb,
  fetchRolesApi,
  saveRolesApi,
  fetchCategoriesApi,
  saveCategoriesApi
} from './api';
import {
  translateText,
  translateTicket,
  detectLanguage,
  TRANSLATOR_LANGUAGES
} from './services/translator';
import {
  playNotificationSound,
  getNotificationPermission,
  requestDeviceNotificationPermission,
  sendDeviceNotification,
  sendTestDeviceNotification,
  unlockAudioContext
} from './services/deviceNotifications';
import {
  DEFAULT_ROLES,
  getRoleDefinition,
  canRoleAccessStorage,
  canRoleManageStock,
  getRoleAllowedCategories,
  isCategoryAllowedForRole
} from './roleConfig';
import {
  STORAGE_CATEGORIES,
  mergeCategories,
  getCategoryMeta,
  getCategoryLabel
} from './storageCategories';
import { filterVisibleTickets, isUserRelatedToTicket } from './utils/ticketPermissions';
import { resolveDepartment, isReturnableSubcategory } from './departments';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  cleanupObsoleteStorage,
  sanitizeTicketsForStorage
} from './utils/storage';

const AppContext = createContext();

const OLD_MOCK_IDS = new Set([
  'TCK-1001', 'TCK-1002', 'TCK-1003', 'TCK-1004', 'TCK-1005',
  'TCK-1006', 'TCK-1007', 'TCK-1008', 'TCK-1009', 'TCK-1010',
  'TCK-1011', 'TCK-1012', 'TCK-1013', 'TCK-1014'
]);

export const AppProvider = ({ children }) => {
  // Purge obsolete and legacy caches on startup to protect browser quota
  useEffect(() => {
    cleanupObsoleteStorage();
  }, []);

  // Theme state ('dark' | 'light')
  const [theme, setThemeState] = useState(() => {
    return safeGetItem('app_theme', 'dark');
  });

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    safeSetItem('app_theme', newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.setAttribute('data-theme', newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      safeSetItem('app_theme', next);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next);
        document.body.setAttribute('data-theme', next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Track ticket IDs authored in this browser session
  const [myCreatedTicketIds, setMyCreatedTicketIds] = useState(() => {
    try {
      const saved = safeGetItem('app_my_created_ticket_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSetItem('app_my_created_ticket_ids', myCreatedTicketIds);
  }, [myCreatedTicketIds]);

  // Language state
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');

  // Auto-translate state (Engineers have auto-translation active by default for English tickets)
  const [autoTranslateTickets, setAutoTranslateTicketsState] = useState(() => {
    const saved = localStorage.getItem('app_auto_translate_tickets');
    if (saved !== null) return saved === 'true';
    return true; // Default ON to immediately help engineers
  });

  const setAutoTranslateTickets = useCallback((val) => {
    setAutoTranslateTicketsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('app_auto_translate_tickets', String(next));
      return next;
    });
  }, []);

  // Translator target language (default 'ru' for engineers, can be toggled to 'kk' or 'en')
  const [translatorTargetLang, setTranslatorTargetLangState] = useState(() => {
    return localStorage.getItem('app_translator_target_lang') || (lang === 'kk' ? 'kk' : 'ru');
  });

  const setTranslatorTargetLang = useCallback((val) => {
    setTranslatorTargetLangState(val);
    localStorage.setItem('app_translator_target_lang', val);
  }, []);

  // Role state with legacy mapping and guest/parent unregistered defaults
  const [role, setRoleState] = useState(() => {
    const isAuth = localStorage.getItem('app_auth') === 'true';
    if (isAuth) {
      const saved = localStorage.getItem('app_role');
      if (saved === 'workerA') return 'storage_manager';
      if (saved === 'admin') return 'director';
      return saved || 'teacher';
    }
    const unreg = localStorage.getItem('app_unregistered_role');
    return unreg === 'parent' ? 'parent' : 'guest';
  });

  const setRole = useCallback((newRole) => {
    setRoleState(newRole);
    const isAuth = localStorage.getItem('app_auth') === 'true';
    if (!isAuth) {
      localStorage.setItem('app_unregistered_role', newRole);
    } else {
      localStorage.setItem('app_role', newRole);
    }
  }, []);

  // Authentication session state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('app_auth_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('app_auth') === 'true';
  });

  // Active authenticated user object
  const [activeUser, setActiveUser] = useState(() => {
    const saved = localStorage.getItem('app_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });

  // Full list of all registered staff users
  const [usersList, setUsersList] = useState([]);

  // Roles & Tasks Matrix Configuration (Director controls roles, tasks, and category access)
  const [rolesConfig, setRolesConfig] = useState(() => {
    const saved = localStorage.getItem('app_roles_config_v1');
    if (saved) {
      try {
        return { ...DEFAULT_ROLES, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_ROLES;
  });

  // Storage Categories Configuration (Director controls categories, returnable policy, shelf locations)
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('app_storage_categories_v1');
    if (saved) {
      try {
        return mergeCategories(JSON.parse(saved));
      } catch {}
    }
    return STORAGE_CATEGORIES;
  });

  // Native Device Push Notifications state & tracking
  const [devicePermission, setDevicePermission] = useState(() => getNotificationPermission());
  const seenNotifIdsRef = React.useRef(new Set());
  const isInitialNotifLoadRef = React.useRef(true);

  // Register service worker on mount for native background push & click actions
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Inventory state (Goods storage)
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('app_inventory_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
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
      } catch {
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
      } catch {
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
      } catch {
        return [];
      }
    }
    return [];
  });

  // Database Connection Status: 'connected' | 'syncing' | 'offline'
  const [dbStatus, setDbStatus] = useState('syncing');

  // Persistence to localStorage for instant startup and offline resilience (with quota protection)
  useEffect(() => {
    safeSetItem('app_notifications_v3', notifications);
  }, [notifications]);

  useEffect(() => {
    safeSetItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    safeSetItem('app_role', role);
  }, [role]);

  useEffect(() => {
    safeSetItem('app_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    if (authToken) {
      safeSetItem('app_auth_token', authToken);
    } else {
      safeRemoveItem('app_auth_token');
    }
  }, [authToken]);

  useEffect(() => {
    if (activeUser) {
      safeSetItem('app_active_user', activeUser);
    } else {
      safeRemoveItem('app_active_user');
    }
  }, [activeUser]);

  useEffect(() => {
    safeSetItem('app_inventory_v3', inventory);
  }, [inventory]);

  useEffect(() => {
    safeSetItem('app_tickets_v3', sanitizeTicketsForStorage(tickets));
  }, [tickets]);

  useEffect(() => {
    safeSetItem('app_users_v3', users);
  }, [users]);

  // Keep fresh references for background DB synchronization without re-triggering effects
  const activeUserRef = React.useRef(activeUser);
  activeUserRef.current = activeUser;
  const roleRef = React.useRef(role);
  roleRef.current = role;
  const ticketsRef = React.useRef(tickets);
  ticketsRef.current = tickets;
  const myCreatedTicketIdsRef = React.useRef(myCreatedTicketIds);
  myCreatedTicketIdsRef.current = myCreatedTicketIds;
  const usersRef = React.useRef(users);
  usersRef.current = users;

  // Synchronize state with SQLite database
  const syncWithDb = useCallback(async () => {
    try {
      setDbStatus(prev => prev === 'connected' ? 'connected' : 'syncing');

      // Fetch all entities concurrently
      const [ticketsResult, invResult, usersResult, notifsResult, rolesResult, catsResult] = await Promise.allSettled([
        fetchTicketsFromDb(),
        fetchInventoryFromDb(),
        fetchUsersFromDb(),
        fetchNotificationsFromDb(),
        fetchRolesApi(),
        fetchCategoriesApi()
      ]);

      let reachedServer = false;

      // 1. Process Tickets from DB
      let freshTickets = ticketsRef.current || [];
      if (ticketsResult.status === 'fulfilled' && Array.isArray(ticketsResult.value)) {
        reachedServer = true;
        const dbTickets = ticketsResult.value.filter(t => !OLD_MOCK_IDS.has(t.id));
        freshTickets = dbTickets;
        ticketsRef.current = dbTickets;

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
      if (usersResult.status === 'fulfilled' && usersResult.value) {
        reachedServer = true;
        if (Array.isArray(usersResult.value.list)) {
          setUsersList(usersResult.value.list);
        }
        if (usersResult.value.map) {
          setUsers(prev => ({
            ...prev,
            ...usersResult.value.map
          }));
        }
        // Keep active logged-in user synchronized if role/details were updated in DB
        setActiveUser(currentAct => {
          if (!currentAct) return currentAct;
          const fresh = (usersResult.value.list || []).find(u => u.id === currentAct.id || u.email === currentAct.email || u.roleKey === currentAct.roleKey);
          if (fresh && (fresh.role !== currentAct.role || fresh.name !== currentAct.name || fresh.department !== currentAct.department)) {
            setRole(fresh.role || fresh.roleKey);
            localStorage.setItem('app_active_user', JSON.stringify(fresh));
            return fresh;
          }
          return currentAct;
        });
      }

      // 4. Process Notifications from DB
      if (notifsResult.status === 'fulfilled' && Array.isArray(notifsResult.value)) {
        reachedServer = true;
        const incomingNotifs = notifsResult.value;
        setNotifications(incomingNotifs);

        if (isInitialNotifLoadRef.current) {
          for (const n of incomingNotifs) {
            seenNotifIdsRef.current.add(n.id);
          }
          isInitialNotifLoadRef.current = false;
        } else {
          // Detect brand new notifications and trigger native device alert
          const curRole = roleRef.current;
          const curUser = activeUserRef.current;
          const curUsers = usersRef.current;
          const curTickets = freshTickets.length > 0 ? freshTickets : (ticketsRef.current || []);
          const curCreatedIds = myCreatedTicketIdsRef.current || [];

          const myName = (curUser?.name || curUsers[curRole]?.name || '').trim().toLowerCase();
          const myId = curUser?.id;
          const myEmail = (curUser?.email || '').trim().toLowerCase();

          for (const n of incomingNotifs) {
            if (!seenNotifIdsRef.current.has(n.id)) {
              seenNotifIdsRef.current.add(n.id);

              const recip = (n.recipientName || '').trim().toLowerCase();
              const notifTitle = (n.title || '').toLowerCase();
              const notifMsg = (n.message || '').toLowerCase();
              const isBroadCast = recip.includes('all') || recip.includes('staff') || recip.includes('everyone') || recip === '';

              let isForMe = false;

              // Leadership always receives all campus operational alerts
              if (curRole === 'director' || curRole === 'admin') {
                isForMe = true;
              } else if (n.ticketId) {
                // If this is a ticket the current user created
                if (Array.isArray(curCreatedIds) && curCreatedIds.includes(n.ticketId)) {
                  isForMe = true;
                } else {
                  const relatedTicket = (curTickets || []).find(t => t.id === n.ticketId);
                  if (relatedTicket) {
                    const tTeacher = (relatedTicket.teacherName || '').trim().toLowerCase();
                    const tEmail = (relatedTicket.teacherEmail || '').trim().toLowerCase();
                    const tWorker = (relatedTicket.assignedWorker || '').trim().toLowerCase();
                    const deptId = resolveDepartment(relatedTicket.department)?.id || relatedTicket.department;
                    const catId = (relatedTicket.category || '').toLowerCase();

                    // Creator check
                    if ((myId && relatedTicket.createdById === myId) || (myEmail && tEmail === myEmail) || (myName && (tTeacher === myName || tTeacher.includes(myName) || myName.includes(tTeacher)))) {
                      isForMe = true;
                    }
                    // Assigned worker check
                    else if (myName && tWorker && (tWorker === myName || tWorker.includes(myName) || myName.includes(tWorker))) {
                      isForMe = true;
                    }
                    // Department specialist checks
                    else if (curRole === 'cleaning' && deptId === 'cleaning') {
                      isForMe = true;
                    } else if (curRole === 'it_support' && (deptId === 'it_helpdesk' || deptId === 'it')) {
                      isForMe = true;
                    } else if (curRole === 'engineer' && ['plumbing', 'electrical', 'engineering', 'facilities', 'carpentry'].includes(deptId)) {
                      isForMe = true;
                    } else if (curRole === 'facilities_manager' && ['carpentry', 'event_prep', 'grounds', 'facilities', 'cleaning', 'plumbing', 'electrical'].includes(deptId)) {
                      isForMe = true;
                    } else if ((curRole === 'storage_manager' || curRole === 'workerA') && (['storage', 'other', 'furniture', 'marketing', 'stationary'].includes(deptId) || ['stationary', 'stationary_loan', 'furniture', 'marketing'].includes(catId))) {
                      isForMe = true;
                    }
                  } else if (isBroadCast) {
                    // Related ticket not loaded yet but broadcast to all staff
                    if (curRole === 'storage_manager' || curRole === 'workerA' || curRole === 'facilities_manager') {
                      isForMe = true;
                    }
                  }
                }
              }

              // Fallback role/keyword matching if no ticketId or broadcast
              if (!isForMe) {
                if (curRole === 'it_support' && (recip.includes('it') || recip.includes('helpdesk') || notifTitle.includes('it ') || notifMsg.includes('laptop') || notifMsg.includes('wifi') || notifMsg.includes('projector'))) {
                  isForMe = true;
                } else if (curRole === 'cleaning' && (recip.includes('clean') || notifTitle.includes('clean') || notifMsg.includes('clean') || notifMsg.includes('trash') || notifMsg.includes('spill'))) {
                  isForMe = true;
                } else if (curRole === 'engineer' && (recip.includes('engineer') || recip.includes('maintenance') || notifMsg.includes('leak') || notifMsg.includes('pipe') || notifMsg.includes('socket') || notifMsg.includes('light'))) {
                  isForMe = true;
                } else if ((curRole === 'storage_manager' || curRole === 'workerA') && (recip.includes('storage') || recip.includes('warehouse') || isBroadCast || notifTitle.includes('return') || notifMsg.includes('paper') || notifMsg.includes('stationary'))) {
                  isForMe = true;
                } else if (curRole === 'facilities_manager' && (recip.includes('facilities') || isBroadCast)) {
                  isForMe = true;
                } else if (recip && myName) {
                  if (recip === myName || recip.includes(myName) || myName.includes(recip)) {
                    isForMe = true;
                  }
                }
              }

              if (isForMe && !n.read) {
                sendDeviceNotification({
                  title: n.title || 'EduOps Request Update',
                  message: n.message || '',
                  ticketId: n.ticketId,
                  tag: n.id
                });
              }
            }
          }
        }
      }

      // 5. Process Roles Configuration from DB (Director permissions matrix)
      if (rolesResult.status === 'fulfilled' && rolesResult.value?.roles) {
        reachedServer = true;
        const merged = { ...DEFAULT_ROLES, ...rolesResult.value.roles };
        setRolesConfig(merged);
        localStorage.setItem('app_roles_config_v1', JSON.stringify(merged));
      }

      // 6. Process Storage Categories from DB
      if (catsResult.status === 'fulfilled' && Array.isArray(catsResult.value?.categories)) {
        reachedServer = true;
        const merged = mergeCategories(catsResult.value.categories);
        setCustomCategories(merged);
        localStorage.setItem('app_storage_categories_v1', JSON.stringify(merged));
      }

      if (reachedServer) {
        setDbStatus('connected');
      } else {
        setDbStatus('offline');
      }
    } catch {
      setDbStatus('offline');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUserApi();
    } catch {
      // ignore offline logout errors
    }
    setAuthToken('');
    setActiveUser(null);
    safeRemoveItem('app_my_created_ticket_ids');
    safeRemoveItem('app_auth_token');
    safeRemoveItem('app_active_user');
    safeSetItem('app_auth', 'false');
    setIsAuthenticated(false);
    const fallbackRole = safeGetItem('app_unregistered_role') === 'parent' ? 'parent' : 'guest';
    setRoleState(fallbackRole);
  }, []);

  // Validate active auth token with database on initial mount
  useEffect(() => {
    const token = localStorage.getItem('app_auth_token');
    if (token) {
      fetchAuthMeApi()
        .then(res => {
          if (res && res.user) {
            setActiveUser(res.user);
            setRole(res.user.role || res.user.roleKey);
            setIsAuthenticated(true);
          }
        })
        .catch(err => {
          if (err.message && err.message.toLowerCase().includes('unauthorized')) {
            logout();
          }
        });
    }
  }, [logout]);

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
    seenNotifIdsRef.current.add(newNotif.id);

    // Send native device push notification + sound chime only if current client is the intended recipient
    const myName = (activeUser?.name || users[role]?.name || '').trim().toLowerCase();
    const recip = (recipientName || '').trim().toLowerCase();
    const notifTitle = (title || '').toLowerCase();
    const notifMsg = (message || '').toLowerCase();
    const isBroadCast = recip.includes('all') || recip.includes('staff') || recip.includes('everyone') || recip === '';
    const isMyTicket = ticketId && Array.isArray(myCreatedTicketIds) && myCreatedTicketIds.includes(ticketId);

    const isDirectedToMe = (role === 'director' || role === 'admin') ||
      isMyTicket ||
      (myName && (recip === myName || recip.includes(myName) || myName.includes(recip))) ||
      (role === 'it_support' && (recip.includes('it') || recip.includes('helpdesk') || notifTitle.includes('it') || notifMsg.includes('wifi') || notifMsg.includes('laptop'))) ||
      (role === 'cleaning' && (recip.includes('clean') || notifTitle.includes('clean') || notifMsg.includes('clean'))) ||
      (role === 'engineer' && (recip.includes('engineer') || recip.includes('maintenance') || notifMsg.includes('leak') || notifMsg.includes('pipe') || notifMsg.includes('electric') || notifMsg.includes('carpentr') || notifMsg.includes('furnitur'))) ||
      ((role === 'storage_manager' || role === 'workerA') && (recip.includes('storage') || recip.includes('warehouse') || isBroadCast || notifTitle.includes('return') || notifMsg.includes('paper') || notifMsg.includes('station'))) ||
      (role === 'facilities_manager' && (recip.includes('facilities') || isBroadCast));

    if (isDirectedToMe) {
      sendDeviceNotification({
        title,
        message,
        ticketId,
        tag: newNotif.id
      });
    }

    // Save to DB in background
    createNotificationInDb(newNotif).catch(() => {});
  };

  const enableDeviceNotifications = async () => {
    unlockAudioContext();
    const perm = await requestDeviceNotificationPermission();
    setDevicePermission(perm);
    if (perm === 'granted') {
      await sendDeviceNotification({
        title: '🔔 Device Alerts Active',
        message: 'Instant sound, vibration and popups enabled on this device!'
      });
    }
    return perm;
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

  const login = async (credentials, optionalPassword) => {
    let identifier = '';
    let password = '';

    if (typeof credentials === 'object' && credentials !== null) {
      identifier = credentials.identifier || credentials.email || credentials.roleKey || '';
      password = credentials.password || '';
    } else if (typeof credentials === 'string') {
      identifier = credentials;
      password = optionalPassword || '';
    }

    try {
      const res = await loginUserApi({ identifier, password });
      if (res && res.token && res.user) {
        setAuthToken(res.token);
        safeSetItem('app_auth_token', res.token);
        setActiveUser(res.user);
        safeSetItem('app_active_user', res.user);
        setRole(res.user.role || res.user.roleKey);
        setUsers(prev => ({
          ...prev,
          [res.user.roleKey || res.user.id]: {
            ...(prev[res.user.roleKey || res.user.id] || {}),
            ...res.user
          }
        }));
        setIsAuthenticated(true);
        syncWithDb();
        return { success: true, user: res.user };
      }
      throw new Error(res?.error || 'Login failed');
    } catch (err) {
      // Offline fallback: verify against role default passwords if offline or server is unreachable
      const searchRole = identifier || 'teacher';
      const defaultPwds = {
        teacher: "teacher123",
        it_support: "it123",
        cleaning: "clean123",
        storage_manager: "storage123",
        facilities_manager: "facilities123",
        director: "admin123",
        engineer: "engineer123"
      };
      const expectedPwd = defaultPwds[searchRole] || 'school123';

      const isNetworkError = err.message && (
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('abort') ||
        err.message.includes('404')
      );

      if (isNetworkError && password && password === expectedPwd) {
        const fallbackUser = users[searchRole] || { role: searchRole, name: searchRole, email: `${searchRole}@school.edu` };
        setActiveUser(fallbackUser);
        setRole(searchRole);
        setIsAuthenticated(true);
        return { success: true, user: fallbackUser, offline: true };
      }

      throw err;
    }
  };

  const register = async (userData) => {
    const res = await registerUserApi(userData);
    if (res && res.token && res.user) {
      setAuthToken(res.token);
      safeSetItem('app_auth_token', res.token);
      setActiveUser(res.user);
      safeSetItem('app_active_user', res.user);
      setRole(res.user.role || res.user.roleKey);
      setIsAuthenticated(true);
      syncWithDb();
      return { success: true, user: res.user, message: res.message };
    }
    throw new Error(res?.error || 'Registration failed');
  };

  const createUser = async (userData) => {
    const created = await createUserInDb(userData);
    await syncWithDb();
    return created;
  };

  const updateUserRole = async (userId, newRole) => {
    const updated = await updateUserRoleInDb(userId, newRole);
    await syncWithDb();
    return updated;
  };

  const resetUserPassword = async (userId, newPassword) => {
    const res = await resetUserPasswordInDb(userId, newPassword);
    return res;
  };

  const deleteUser = async (userId) => {
    const res = await deleteUserFromDb(userId);
    await syncWithDb();
    return res;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const targetKey = activeUser?.id || activeUser?.roleKey || role;
    const res = await changePasswordApi({
      currentPassword,
      newPassword,
      roleKey: targetKey
    });
    return res;
  };

  const t = translations[lang] || translations.en;
  
  // Resolve current active user profile
  const currentUser = React.useMemo(() => {
    if (isAuthenticated) {
      return activeUser || users[role] || (role === 'workerA' ? users.storage_manager : (role === 'admin' ? users.director : (users[role] || users.teacher)));
    }
    const isParent = role === 'parent';
    return {
      id: isParent ? 'parent-session' : 'guest-session',
      name: isParent 
        ? (lang === 'ru' ? 'Родитель' : lang === 'kk' ? 'Ата-ана' : 'Parent')
        : (lang === 'ru' ? 'Гость' : lang === 'kk' ? 'Қонақ' : 'Guest'),
      role: role,
      department: isParent 
        ? (lang === 'ru' ? 'Родительский комитет' : lang === 'kk' ? 'Ата-аналар қауымдастығы' : 'Parent / Family')
        : (lang === 'ru' ? 'Посетитель' : lang === 'kk' ? 'Келуші' : 'Campus Visitor'),
      email: '',
      phone: '',
      avatar: '',
      isUnregistered: true,
      isGuest: !isParent,
      isParent: isParent
    };
  }, [isAuthenticated, activeUser, users, role, lang]);

  const updateUserProfile = (updatedProfileData) => {
    if (currentUser?.id) {
      const merged = { ...currentUser, ...updatedProfileData };
      setActiveUser(merged);
      safeSetItem('app_active_user', merged);
      updateUserProfileInDb(currentUser.id, updatedProfileData).catch(() => {});
    }
    setUsers(prev => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        ...updatedProfileData
      }
    }));
  };

  // Reset to default clean state
  const resetDemoData = async () => {
    try {
      await resetDatabaseInDb();
    } catch {
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
    const authorName = ticketData.senderName || currentUser.name || (role === 'parent' ? 'Parent' : (role === 'guest' ? 'Guest' : (t.roles[role] || 'Teacher')));
    const authorPhone = ticketData.senderPhone || currentUser.phone || '';

    const isReturnable = Boolean(
      ticketData.isReturnable ||
      ticketData.category === 'stationary_loan' ||
      isReturnableSubcategory(ticketData.subcategory || ticketData.itemTitle) ||
      (Array.isArray(inventory) && inventory.some(i => i.isReturnable && (
        i.name.toLowerCase() === (ticketData.itemTitle || '').toLowerCase() ||
        (ticketData.itemTitle || '').toLowerCase().includes(i.name.toLowerCase())
      )))
    );

    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      department: ticketData.department || 'other',
      itemTitle: ticketData.itemTitle,
      subcategory: ticketData.subcategory || '',
      category: ticketData.category || (isReturnable ? 'stationary_loan' : 'other'),
      quantity: Number(ticketData.quantity) || 1,
      unit: ticketData.unit || 'pcs',
      urgency: ticketData.urgency || 'medium',
      roomNumber: ticketData.roomNumber,
      moveDetails: ticketData.moveDetails || null,
      description: ticketData.description || '',
      photos: ticketData.photos || [],
      completionPhotos: [],
      isReturnable,
      returnStatus: isReturnable ? 'pending_issue' : 'none',
      borrowedAt: null,
      returnedAt: null,
      returnConfirmedAt: null,
      returnConfirmedBy: null,
      teacherName: authorName,
      teacherPhone: authorPhone,
      teacherEmail: activeUser?.email || currentUser?.email || '',
      createdById: activeUser?.id || null,
      createdByRole: role,
      status: 'pending',
      assignedWorker: null,
      assignedRole: null,
      handledAction: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);
    setMyCreatedTicketIds(prev => prev.includes(newTicket.id) ? prev : [newTicket.id, ...prev]);

    // Automatically trigger notification for staff and directors
    const targetDept = newTicket.department === 'it' ? 'IT Specialist'
      : newTicket.department === 'cleaning' ? 'Cleaning Staff'
      : newTicket.department === 'facilities' ? 'Facilities Manager'
      : newTicket.department === 'storage' ? 'Storage Manager'
      : newTicket.department === 'engineering' ? 'Maintenance Engineer'
      : 'All';

    addNotification(
      targetDept,
      newTicket.id,
      `New Request: ${newTicket.itemTitle}`,
      `${newTicket.teacherName} requested "${newTicket.itemTitle}" (${newTicket.roomNumber || 'General'})`,
      'pending'
    );

    // Persist ticket in DB
    createTicketInDb(newTicket).catch(() => {});

    return newTicket;
  };

  // Generic status updater
  const updateTicket = (ticketId, updates) => {
    const updatedAt = new Date().toISOString();
    let updatedTicket = null;

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        updatedTicket = {
          ...ticket,
          ...updates,
          updatedAt
        };
        return updatedTicket;
      }
      return ticket;
    }));

    // If status changed, notify teacher and director
    if (updates && updates.status && updatedTicket) {
      addNotification(
        updatedTicket.teacherName || 'All',
        ticketId,
        `Request Status: ${updates.status.toUpperCase()}`,
        `Ticket "${updatedTicket.itemTitle}" has been updated to ${updates.status}.`,
        updates.status
      );
    }

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
    const existing = tickets.find(t => t.id === ticketId);
    const isReturnable = existing ? Boolean(existing.isReturnable) : false;

    const payload = {
      status: 'issued',
      handledAction: 'issued',
      assignedWorker: currentUser.name,
      assignedRole: 'storage_manager',
      isReturnable: isReturnable ? 1 : 0,
      returnStatus: isReturnable ? 'borrowed' : 'none',
      borrowedAt: isReturnable ? updatedAt : null,
      notes: notes || (isReturnable ? 'Issued for temporary lesson use (must be returned).' : 'Issued directly from warehouse inventory stock.'),
      updatedAt
    };

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        target = { ...ticket, ...payload };
        return target;
      }
      return ticket;
    }));

    updateTicketInDb(ticketId, payload).catch(() => {});

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        target.id,
        isReturnable ? (t.tickets?.status?.on_loan || 'Item Issued for Lesson') : t.notifications.ticketIssued,
        isReturnable
          ? `Item "${target.itemTitle}" issued for 1-2 lessons. Please return it to the warehouse when your lesson finishes.`
          : `Item "${target.itemTitle}" has been prepared and issued from stock.`,
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

  // Teacher: Report item returned to warehouse
  const markTicketReturnedByTeacher = async (ticketId, notes = '') => {
    const updatedAt = new Date().toISOString();
    let target = null;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        target = t;
        const newNotes = notes 
          ? (t.notes ? `${t.notes} | Teacher: ${notes}` : `Teacher: ${notes}`)
          : t.notes;
        return {
          ...t,
          returnStatus: 'returned_by_teacher',
          returnedAt: updatedAt,
          notes: newNotes,
          updatedAt
        };
      }
      return t;
    }));

    try {
      await markTicketReturnedByTeacherInDb(ticketId, notes);
    } catch {
      updateTicketInDb(ticketId, {
        returnStatus: 'returned_by_teacher',
        returnedAt: updatedAt,
        updatedAt
      }).catch(() => {});
    }

    addNotification(
      'Storage Manager',
      ticketId,
      'Equipment Return Awaiting Confirmation',
      `${target?.teacherName || currentUser.name} has returned "${target?.itemTitle || 'item'}". Please inspect and confirm receipt in warehouse.`,
      'returned_by_teacher'
    );
  };

  // Storage Manager / Admin: Confirm item returned and restore warehouse stock
  const confirmTicketReturn = async (ticketId, notes = '') => {
    const updatedAt = new Date().toISOString();
    let target = null;
    const who = currentUser.name || 'Storage Manager';

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        target = t;
        const newNotes = notes 
          ? (t.notes ? `${t.notes} | Return confirmed by ${who}: ${notes}` : `Return confirmed by ${who}: ${notes}`)
          : (t.notes ? `${t.notes} | Return confirmed by ${who}.` : `Return confirmed by ${who} - item received back in warehouse.`);
        return {
          ...t,
          returnStatus: 'returned',
          status: 'completed',
          returnConfirmedAt: updatedAt,
          returnConfirmedBy: who,
          notes: newNotes,
          updatedAt
        };
      }
      return t;
    }));

    // Restore stock in inventory state
    if (target) {
      setInventory(prev => prev.map(item => {
        const iName = (item.name || '').toLowerCase();
        const tTitle = (target.itemTitle || '').toLowerCase();
        if (iName === tTitle || iName.includes(tTitle) || tTitle.includes(iName)) {
          const restoredQty = (Number(item.quantity) || 0) + (Number(target.quantity) || 1);
          updateInventoryQtyInDb(item.id, { quantity: restoredQty }).catch(() => {});
          return { ...item, quantity: restoredQty };
        }
        return item;
      }));
    }

    try {
      await confirmTicketReturnInDb(ticketId, { confirmedBy: who, notes });
    } catch {
      updateTicketInDb(ticketId, {
        returnStatus: 'returned',
        status: 'completed',
        returnConfirmedAt: updatedAt,
        returnConfirmedBy: who,
        updatedAt
      }).catch(() => {});
    }

    if (target && target.teacherName) {
      addNotification(
        target.teacherName,
        ticketId,
        'Return Confirmed by Storage Manager',
        `Return of "${target.itemTitle}" has been inspected and confirmed in warehouse. Stock restored. Thank you!`,
        'completed'
      );
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
      minLevel: Number(newItem.minLevel) || 5,
      photos: Array.isArray(newItem.photos) ? newItem.photos : []
    };
    setInventory(prev => [item, ...prev]);
    createInventoryItemInDb(item).catch(() => {});
  };

  const addPhotosToInventoryItem = (id, photosArray) => {
    if (!id || !photosArray || photosArray.length === 0) return;
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const currentPhotos = Array.isArray(item.photos) ? item.photos : [];
        return { ...item, photos: [...currentPhotos, ...photosArray] };
      }
      return item;
    }));
    addPhotoToInventoryItemInDb(id, photosArray).catch(() => {});
  };

  const updateInventoryQty = (id, newQty) => {
    const clampedQty = Math.max(0, newQty);
    setInventory(prev => prev.map(item => item.id === id ? { ...item, quantity: clampedQty } : item));
    updateInventoryQtyInDb(id, { quantity: clampedQty }).catch(() => {});
  };

  // -------------------------------------------------------------
  // Role & Permissions Matrix Management (Director Controls)
  // -------------------------------------------------------------
  const updateRoleConfig = useCallback(async (roleKey, updates) => {
    setRolesConfig(prev => {
      const existing = prev[roleKey] || DEFAULT_ROLES[roleKey] || {};
      const updated = {
        ...prev,
        [roleKey]: {
          ...existing,
          ...updates,
          key: roleKey
        }
      };
      localStorage.setItem('app_roles_config_v1', JSON.stringify(updated));
      saveRolesApi(updated).catch(() => {});
      return updated;
    });
  }, []);

  const createRole = useCallback(async (newRoleData) => {
    if (!newRoleData || !newRoleData.key) return false;
    const cleanKey = newRoleData.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setRolesConfig(prev => {
      const updated = {
        ...prev,
        [cleanKey]: {
          key: cleanKey,
          label: newRoleData.label || cleanKey,
          labelRu: newRoleData.labelRu || newRoleData.label || cleanKey,
          labelKk: newRoleData.labelKk || newRoleData.label || cleanKey,
          color: newRoleData.color || '#6366f1',
          bg: newRoleData.bg || 'rgba(99, 102, 241, 0.15)',
          border: newRoleData.border || 'rgba(99, 102, 241, 0.35)',
          icon: newRoleData.icon || 'Users',
          scope: newRoleData.scope || 'Custom operational tasks',
          scopeRu: newRoleData.scopeRu || newRoleData.scope || 'Пользовательские задачи',
          scopeKk: newRoleData.scopeKk || newRoleData.scope || 'Арнайы міндеттер',
          canViewStorage: Boolean(newRoleData.canViewStorage),
          canManageStock: Boolean(newRoleData.canManageStock),
          allowedCategories: Array.isArray(newRoleData.allowedCategories) ? newRoleData.allowedCategories : ['all']
        }
      };
      localStorage.setItem('app_roles_config_v1', JSON.stringify(updated));
      saveRolesApi(updated).catch(() => {});
      return updated;
    });
    return true;
  }, []);

  const deleteRole = useCallback(async (roleKey) => {
    if (!roleKey) return false;
    if (['director', 'teacher', 'admin', 'engineer', 'it_support', 'cleaning', 'storage_manager', 'facilities_manager'].includes(roleKey)) {
      throw new Error('Default system roles cannot be deleted.');
    }
    setRolesConfig(prev => {
      const updated = { ...prev };
      delete updated[roleKey];
      localStorage.setItem('app_roles_config_v1', JSON.stringify(updated));
      saveRolesApi(updated).catch(() => {});
      return updated;
    });
    return true;
  }, []);

  // -------------------------------------------------------------
  // Storage Categories Matrix Management (Director Controls)
  // -------------------------------------------------------------
  const createStorageCategory = useCallback(async (newCatData) => {
    if (!newCatData || (!newCatData.id && !newCatData.key && !newCatData.nameEn)) return false;
    const rawId = newCatData.id || newCatData.key || newCatData.nameEn;
    const cleanId = rawId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const catObj = {
      id: cleanId,
      key: cleanId,
      icon: newCatData.icon || '📦',
      color: newCatData.color || '#94a3b8',
      bgColor: newCatData.bgColor || 'rgba(148, 163, 184, 0.12)',
      borderColor: newCatData.borderColor || 'rgba(148, 163, 184, 0.3)',
      defaultLocation: newCatData.defaultLocation || 'Main Warehouse',
      isReturnable: Boolean(newCatData.isReturnable),
      translations: {
        en: newCatData.nameEn || cleanId,
        ru: newCatData.nameRu || newCatData.nameEn || cleanId,
        kk: newCatData.nameKk || newCatData.nameEn || cleanId
      },
      shortTranslations: {
        en: newCatData.shortEn || newCatData.nameEn || cleanId,
        ru: newCatData.shortRu || newCatData.nameRu || cleanId,
        kk: newCatData.shortKk || newCatData.nameKk || cleanId
      },
      description: {
        en: newCatData.descEn || '',
        ru: newCatData.descRu || '',
        kk: newCatData.descKk || ''
      }
    };

    setCustomCategories(prev => {
      const merged = mergeCategories([...prev, catObj]);
      localStorage.setItem('app_storage_categories_v1', JSON.stringify(merged));
      saveCategoriesApi(merged).catch(() => {});
      return merged;
    });
    return true;
  }, []);

  const updateStorageCategory = useCallback(async (catId, updates) => {
    setCustomCategories(prev => {
      const updated = prev.map(c => {
        if (c.id === catId) {
          return {
            ...c,
            ...updates,
            translations: {
              ...(c.translations || {}),
              ...(updates.translations || {})
            },
            shortTranslations: {
              ...(c.shortTranslations || {}),
              ...(updates.shortTranslations || {})
            }
          };
        }
        return c;
      });
      localStorage.setItem('app_storage_categories_v1', JSON.stringify(updated));
      saveCategoriesApi(updated).catch(() => {});
      return updated;
    });
  }, []);


  // Notifications strictly visible to the current user (only connected users see them)
  const userNotifications = React.useMemo(() => {
    if (!currentUser?.name) return [];
    if (role === 'director' || role === 'admin') return notifications;

    const myName = (currentUser?.name || '').trim().toLowerCase();
    const myId = currentUser?.id;
    const myEmail = (currentUser?.email || '').trim().toLowerCase();
    const genericRoles = ['teacher', 'staff', 'guest', 'user', 'parent', 'all', 'admin', 'director'];

    return notifications.filter(n => {
      const recip = (n.recipientName || '').trim().toLowerCase();

      // 1. If notification is tied to a specific ticket, verify direct connection
      if (n.ticketId) {
        if (Array.isArray(myCreatedTicketIds) && myCreatedTicketIds.includes(n.ticketId)) {
          return true;
        }
        const relatedTicket = (tickets || []).find(t => t.id === n.ticketId);
        if (relatedTicket) {
          const tTeacher = (relatedTicket.teacherName || '').trim().toLowerCase();
          const tEmail = (relatedTicket.teacherEmail || '').trim().toLowerCase();
          const tWorker = (relatedTicket.assignedWorker || '').trim().toLowerCase();
          const deptId = resolveDepartment(relatedTicket.department)?.id || relatedTicket.department;

          // Ticket creator / author
          if (myId && relatedTicket.createdById && relatedTicket.createdById === myId) return true;
          if (myEmail && tEmail && myEmail === tEmail) return true;
          if (myName && tTeacher && myName === tTeacher) return true;

          // Assigned technician
          if (myName && tWorker && (tWorker === myName || tWorker.includes(myName))) return true;
          if (relatedTicket.assignedRole && relatedTicket.assignedRole === role) return true;

          // Responsible department specialists
          if (role === 'cleaning' && deptId === 'cleaning') return true;
          if (role === 'it_support' && (deptId === 'it_helpdesk' || deptId === 'it')) return true;
          if (role === 'engineer' && ['plumbing', 'electrical', 'engineering', 'carpentry', 'facilities'].includes(deptId)) return true;
          if (role === 'facilities_manager' && ['carpentry', 'event_prep', 'grounds', 'facilities', 'cleaning', 'plumbing', 'electrical'].includes(deptId)) return true;
          if ((role === 'storage_manager' || role === 'workerA') && ['storage', 'other'].includes(deptId)) return true;

          return false;
        }
      }

      // 2. Department-level notifications
      if (role === 'it_support' && (recip.includes('it') || recip.includes('helpdesk'))) return true;
      if (role === 'cleaning' && recip.includes('clean')) return true;
      if (role === 'engineer' && (recip.includes('engineer') || recip.includes('maintenance') || recip.includes('electric') || recip.includes('plumb') || recip.includes('carpentr') || recip.includes('furnitur'))) return true;
      if ((role === 'storage_manager' || role === 'workerA') && (recip.includes('storage') || recip.includes('warehouse'))) return true;
      if (role === 'facilities_manager' && (recip.includes('facilities') || recip.includes('deputy') || recip.includes('carpentry'))) return true;

      // 3. User name direct match
      if (recip && myName) {
        if (recip === myName) return true;
        if (!genericRoles.includes(recip) && !genericRoles.includes(myName) && recip.length > 3 && myName.length > 3) {
          if (recip.includes(myName) || myName.includes(recip)) return true;
        }
      }

      return false;
    });
  }, [notifications, currentUser, role, myCreatedTicketIds, tickets]);

  const unreadCount = React.useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  // Filter tickets: active tickets are NOT visible to users who are not related
  const scopedTickets = React.useMemo(() => {
    return filterVisibleTickets(tickets, activeUser || currentUser, role, myCreatedTicketIds);
  }, [tickets, activeUser, currentUser, role, myCreatedTicketIds]);

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      scopedTickets,
      myCreatedTicketIds,
      isUserRelatedToTicket,
      filterVisibleTickets,
      lang,
      setLang,
      role,
      setRole,
      isAuthenticated,
      authToken,
      login,
      logout,
      register,
      usersList,
      createUser,
      updateUserRole,
      resetUserPassword,
      deleteUser,
      changePassword,
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
      // Device Native Push & Sound Suite
      devicePermission,
      enableDeviceNotifications,
      sendDeviceNotification,
      sendTestDeviceNotification,
      playNotificationSound,
      addTicket,
      updateTicket,
      startTicketWork,
      issueTicketFromStock,
      markTicketReturnedByTeacher,
      confirmTicketReturn,
      markTicketToPurchase,
      completeTicketDelivery,
      updateFacilitiesMove,
      addInventoryItem,
      updateInventoryQty,
      addPhotosToInventoryItem,
      addPhotosToTicket,
      // Director Role & Storage Category Matrix Controls
      rolesConfig,
      customCategories,
      updateRoleConfig,
      createRole,
      deleteRole,
      createStorageCategory,
      updateStorageCategory,
      canAccessStorage: (r = role) => canRoleAccessStorage(r, rolesConfig),
      canManageStorageStock: (r = role) => canRoleManageStock(r, rolesConfig),
      getAllowedCategoriesForRole: (r = role) => getRoleAllowedCategories(r, rolesConfig, customCategories),
      isCategoryAllowed: (catId, r = role) => isCategoryAllowedForRole(catId, r, rolesConfig, customCategories),
      resetDemoData,
      // Ticket Translation Suite for Engineers & Teachers
      autoTranslateTickets,
      setAutoTranslateTickets,
      translatorTargetLang,
      setTranslatorTargetLang,
      translateText,
      translateTicket,
      detectLanguage,
      TRANSLATOR_LANGUAGES
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
