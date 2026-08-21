import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import { mockInventory, mockTickets, mockUsers } from './mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Saved state or defaults
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');
  const [role, setRole] = useState(() => localStorage.getItem('app_role') || 'teacher');
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('app_inventory');
    return saved ? JSON.parse(saved) : mockInventory;
  });
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('app_tickets');
    return saved ? JSON.parse(saved) : mockTickets;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('app_users');
    return saved ? JSON.parse(saved) : mockUsers;
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('app_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('app_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('app_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  const t = translations[lang] || translations.en;
  const currentUser = users[role] || users.teacher;

  const updateUserProfile = (updatedProfileData) => {
    setUsers(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...updatedProfileData
      }
    }));
  };

  // Ticket Management
  const addTicket = (ticketData) => {
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      ...ticketData,
      teacherName: currentUser.name,
      teacherPhone: currentUser.phone || '',
      status: 'pending',
      assignedWorker: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  // Action by Worker A: Issue item directly from stock
  const issueTicketFromStock = (ticketId, notes = '') => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'issued',
          handledAction: 'issued',
          assignedWorker: currentUser.name,
          notes: notes || 'Issued directly from school inventory stock.',
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
          const newQty = Math.max(0, item.quantity - targetTicket.quantity);
          return { ...item, quantity: newQty };
        }
        return item;
      }));
    }
  };

  // Action by Worker A: Mark item to be purchased
  const markTicketToPurchase = (ticketId, purchaseCost, supplier, notes) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'purchasing',
          handledAction: 'purchased',
          assignedWorker: currentUser.name,
          purchaseCost: Number(purchaseCost) || 0,
          supplier: supplier || 'Local Vendor',
          notes: notes || 'Item not in stock. Worker A initiating purchasing.',
          updatedAt: new Date().toISOString()
        };
      }
      return ticket;
    }));
  };

  // Mark ticket as complete / delivered
  const completeTicketDelivery = (ticketId) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: 'delivered',
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
      issueTicketFromStock,
      markTicketToPurchase,
      completeTicketDelivery,
      addInventoryItem,
      updateInventoryQty
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

