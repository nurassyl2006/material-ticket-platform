import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { UserManagement } from './components/UserManagement';
import { TicketModal } from './components/TicketModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DeviceToastAlert } from './components/DeviceToastAlert';
import ServerStatusModal from './components/ServerStatusModal';
import { ShieldCheck, LogIn, UserPlus, Compass, Users } from 'lucide-react';
import './index.css';

function MainApp() {
  const { isAuthenticated, role, setRole, lang, t } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketDept, setNewTicketDept] = useState('engineering');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [targetTicketId, setTargetTicketId] = useState(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Authentication Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin'); // 'signin' | 'signup'

  const handleOpenLogin = () => {
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleOpenNewTicket = (dept = 'engineering') => {
    setNewTicketDept(dept);
    setIsNewTicketOpen(true);
  };

  const handleSelectTicketFromNotification = (ticketId) => {
    setActiveTab('tickets');
    setTargetTicketId(ticketId);
  };

  React.useEffect(() => {
    window.__onSelectTicketGlobal = handleSelectTicketFromNotification;
    return () => {
      window.__onSelectTicketGlobal = null;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNewTicket={() => handleOpenNewTicket('engineering')}
        onSelectTicket={handleSelectTicketFromNotification}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenServerModal={() => setIsServerModalOpen(true)}
      />
      <DeviceToastAlert onSelectTicket={handleSelectTicketFromNotification} />

      {/* Unregistered Guest / Parent Notification & Access Banner */}
      {!isAuthenticated && (
        <div style={{ maxWidth: '1360px', margin: '-8px auto 16px', padding: '0 20px' }}>
          <div style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: `4px solid ${role === 'parent' ? '#8b5cf6' : '#6366f1'}`,
            borderRadius: '12px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-depth-2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                background: role === 'parent' ? 'rgba(91, 95, 199, 0.18)' : 'rgba(15, 108, 189, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: role === 'parent' ? '#8b8fe6' : '#70b5f9'
              }}>
                {role === 'parent' ? <Users size={16} /> : <Compass size={16} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f2f1' }}>
                  {role === 'parent'
                    ? (lang === 'ru' ? 'Вы находитесь в режиме «Родитель»' : lang === 'kk' ? 'Сіз «Ата-ана» режиміндесіз' : 'Browsing as School Parent')
                    : (lang === 'ru' ? 'Вы находитесь в режиме «Гость / Посетитель»' : lang === 'kk' ? 'Сіз «Қонақ / Келуші» режиміндесіз' : 'Browsing as Campus Guest')}
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '11px', 
                    background: '#333333', 
                    border: '1px solid #444444',
                    padding: '1px 6px', 
                    borderRadius: '2px',
                    color: '#adadad',
                    fontWeight: '500'
                  }}>
                    {t.auth?.unregisteredUser || 'Unregistered'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#adadad' }}>
                  {role === 'parent'
                    ? (lang === 'ru' ? 'Вы можете просматривать заявки школы и подавать обращения по классам и безопасности' : lang === 'kk' ? 'Мектеп өтінімдерін қарап, сыныптар мен қауіпсіздік бойынша сұраныс бере аласыз' : 'Submit classroom, maintenance or safety requests without creating an account')
                    : (lang === 'ru' ? 'Вы можете просматривать общественные заявки и подавать обращения посетителя' : lang === 'kk' ? 'Мектеп бойынша өтінімдерді қарап, келуші сұраныстарын жібере аласыз' : 'Browse requests and submit campus visitor tickets directly')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRole(role === 'parent' ? 'guest' : 'parent')}
                className="fluent-btn-secondary"
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Переключить на Гостя' : lang === 'kk' ? 'Қонаққа ауысу' : 'Switch to Guest')
                  : (lang === 'ru' ? 'Переключить на Родителя' : lang === 'kk' ? 'Ата-анаға ауысу' : 'Switch to Parent')}
              </button>
              <button
                type="button"
                onClick={handleOpenLogin}
                className="fluent-btn-secondary"
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                <LogIn size={13} />
                <span>{t.auth?.signIn || 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenRegister}
                className="fluent-btn-primary"
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
              >
                <UserPlus size={13} />
                <span>{t.auth?.registerWindow || 'Register'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
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
        {activeTab === 'inventory' && (
          isAuthenticated ? (
            <InventoryManager />
          ) : (
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '520px', margin: '32px auto', borderRadius: '6px', background: '#252525', border: '1px solid #383838' }}>
              <ShieldCheck size={40} color="#0f6cbd" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f3f2f1', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Доступ только для сотрудников' : lang === 'kk' ? 'Тек қызметкерлер үшін қолжетімді' : 'Staff Verification Required'}
              </h3>
              <p style={{ fontSize: '13px', color: '#adadad', marginBottom: '20px', lineHeight: 1.5 }}>
                {lang === 'ru' 
                  ? 'Складской учет и активы доступны для завскладом, завхоза и директора. Войдите со своей учетной записью сотрудника.'
                  : lang === 'kk'
                  ? 'Қойма есебі мен активтер қойма меңгерушісіне, завхозға және директорға қолжетімді. Қызметкер ретінде кіріңіз.'
                  : 'Inventory and stock operations are restricted to school staff. Please sign in or register to access.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={handleOpenLogin}
                  className="fluent-btn-primary"
                  style={{ height: '32px', padding: '0 16px' }}
                >
                  {t.auth?.signIn || 'Sign In'}
                </button>
                <button
                  onClick={handleOpenRegister}
                  className="fluent-btn-secondary"
                  style={{ height: '32px', padding: '0 16px' }}
                >
                  {t.auth?.registerWindow || 'Register'}
                </button>
              </div>
            </div>
          )
        )}
        {activeTab === 'users' && (
          isAuthenticated ? (
            <UserManagement />
          ) : (
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '520px', margin: '32px auto', borderRadius: '6px', background: '#252525', border: '1px solid #383838' }}>
              <ShieldCheck size={40} color="#0f6cbd" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f3f2f1', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Панель управления персоналом' : lang === 'kk' ? 'Қызметкерлерді басқару панелі' : 'Staff Administration Portal'}
              </h3>
              <p style={{ fontSize: '13px', color: '#adadad', marginBottom: '20px', lineHeight: 1.5 }}>
                {lang === 'ru'
                  ? 'Управление пользователями и распределение ролей доступно только дирекции школы.'
                  : lang === 'kk'
                  ? 'Пайдаланушылар мен рөлдерді тағайындау тек мектеп дирекциясына қолжетімді.'
                  : 'Staff and user role administration is reserved for the School Directorate.'}
              </p>
              <button
                onClick={handleOpenLogin}
                className="fluent-btn-primary"
                style={{ height: '32px', padding: '0 18px' }}
              >
                {t.auth?.signIn || 'Sign In as Director'}
              </button>
            </div>
          )
        )}
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

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Server & Database Diagnostics / Remote Connection Modal */}
      <ServerStatusModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
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
