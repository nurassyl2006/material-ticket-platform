import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { TicketModal } from './components/TicketModal';
import { UserProfileModal } from './components/UserProfileModal';
import './index.css';

function MainApp() {
  const { isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketDept, setNewTicketDept] = useState('engineering');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [targetTicketId, setTargetTicketId] = useState(null);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleOpenNewTicket = (dept = 'engineering') => {
    setNewTicketDept(dept);
    setIsNewTicketOpen(true);
  };

  const handleSelectTicketFromNotification = (ticketId) => {
    setActiveTab('tickets');
    setTargetTicketId(ticketId);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewTicket={() => handleOpenNewTicket('engineering')}
        onSelectTicket={handleSelectTicketFromNotification}
      />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onOpenNewTicket={handleOpenNewTicket}
          />
        )}
        {activeTab === 'tickets' && (
          <TicketList 
            onOpenNewTicket={handleOpenNewTicket}
            initialSearchTerm={targetTicketId || ''}
          />
        )}
        {activeTab === 'inventory' && <InventoryManager />}
      </main>

      <TicketModal 
        isOpen={isNewTicketOpen} 
        onClose={() => setIsNewTicketOpen(false)} 
        initialDepartment={newTicketDept}
      />

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
