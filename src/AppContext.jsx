import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import { mockInventory, mockTickets, mockUsers } from './mockData';

const AppContext = createContext();

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

  // Inventory state
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('app_inventory_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasEng = parsed.some(i => i.category === 'electrical' || i.category === 'hvac');
        if (!hasEng) {
          const engItems = mockInventory.filter(i => i.category === 'electrical' || i.category === 'hvac');
          return [...parsed, ...engItems];
        }
        return parsed;
      } catch (e) {
        return mockInventory;
      }
    }
    return mockInventory;
  });

  // Tickets state
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('app_tickets_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasEng = parsed.some(t => t.department === 'engineering');
        if (!hasEng) {
          const engTickets = mockTickets.filter(t => t.department === 'engineering');
          return [...engTickets, ...parsed];
        }
        return parsed;
      } catch (e) {
        return mockTickets;
      }
    }
    return mockTickets;
  });

  // Users state
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('app_users_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...mockUsers,
          ...parsed,
          engineer: parsed.engineer || mockUsers.engineer
        };
      } catch (e) {
        return mockUsers;
      }
    }
    return mockUsers;
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('app_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('app_inventory_v2', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('app_tickets_v2', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('app_users_v2', JSON.stringify(users));
  }, [users]);

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

  // Reset to default mock data (useful if user wants clean multi-department demo data)
  const resetDemoData = () => {
    setInventory(mockInventory);
    setTickets(mockTickets);
    setUsers(mockUsers);
    localStorage.removeItem('app_inventory_v2');
    localStorage.removeItem('app_tickets_v2');
    localStorage.removeItem('app_users_v2');
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
      teacherName: currentUser.name,
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
    return newTicket;
  };

  // Generic status updater
  const updateTicket = (ticketId, updates) => {
    setTickets(prev => prev.map(ticket => {
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

  // Start working on ticket (used by IT, Cleaning, Facilities)
  const startTicketWork = (ticketId, notes = '') => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
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
  };

  // Storage Manager: Issue item directly from stock
  const issueTicketFromStock = (ticketId, notes = '') => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
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

    // Deduct stock quantity if matching inventory item exists
    const targetTicket = tickets.find(t => t.id === ticketId);
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
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
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
  };

  // Complete ticket / Deliver / Resolve
  const completeTicketDelivery = (ticketId, notes = '') => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
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
  };

  // Facilities Manager: Update moving details / dispatch
  const updateFacilitiesMove = (ticketId, moveDetails, notes = '') => {
    setTickets(prev => prev.map(ticket => {
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

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      role,
      setRole,
      t,
      users,
      currentUser,
      updateUserProfile,
      inventory,
      tickets,
      addTicket,
      updateTicket,
      startTicketWork,
      issueTicketFromStock,
      markTicketToPurchase,
      completeTicketDelivery,
      updateFacilitiesMove,
      addInventoryItem,
      updateInventoryQty,
      resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
