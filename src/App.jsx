import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { TicketModal } from './components/TicketModal';
import { UserProfileModal } from './components/UserProfileModal';
import './index.css';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
      />
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
          />
        )}
        {activeTab === 'tickets' && (
          <TicketList 
            onOpenNewTicket={() => setIsNewTicketOpen(true)} 
          />
        )}
        {activeTab === 'inventory' && <InventoryManager />}
      </main>

      <TicketModal 
        isOpen={isNewTicketOpen} 
        onClose={() => setIsNewTicketOpen(false)} 
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
