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
import { ShieldCheck, LogIn, UserPlus, Compass, Users } from 'lucide-react';
import './index.css';

function MainApp() {
  const { isAuthenticated, role, setRole, lang, t } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketDept, setNewTicketDept] = useState('engineering');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [targetTicketId, setTargetTicketId] = useState(null);

  // Authentication Modal Windows State (Login Window & Registration Window)
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
      />
      <DeviceToastAlert onSelectTicket={handleSelectTicketFromNotification} />

      {/* Unregistered Guest / Parent Notification & Access Banner */}
      {!isAuthenticated && (
        <div style={{ maxWidth: '1280px', margin: '-10px auto 20px', padding: '0 16px' }}>
          <div style={{
            background: role === 'parent' 
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)' 
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
            border: `1px solid ${role === 'parent' ? 'rgba(168, 85, 247, 0.35)' : 'rgba(6, 182, 212, 0.35)'}`,
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: role === 'parent' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(6, 182, 212, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: role === 'parent' ? '#c084fc' : '#38bdf8'
              }}>
                {role === 'parent' ? <Users size={18} /> : <Compass size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                  {role === 'parent'
                    ? (lang === 'ru' ? 'Вы находитесь в режиме «Родитель»' : lang === 'kk' ? 'Сіз «Ата-ана» режиміндесіз' : 'Browsing as School Parent')
                    : (lang === 'ru' ? 'Вы находитесь в режиме «Гость / Посетитель»' : lang === 'kk' ? 'Сіз «Қонақ / Келуші» режиміндесіз' : 'Browsing as Campus Guest')}
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '11px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '6px',
                    color: 'var(--text-muted)'
                  }}>
                    {t.auth?.unregisteredUser || 'Unregistered'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Переключить на Гостя' : lang === 'kk' ? 'Қонаққа ауысу' : 'Switch to Guest')
                  : (lang === 'ru' ? 'Переключить на Родителя' : lang === 'kk' ? 'Ата-анаға ауысу' : 'Switch to Parent')}
              </button>
              <button
                type="button"
                onClick={handleOpenLogin}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  color: '#818cf8',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LogIn size={13} />
                <span>{t.auth?.signIn || 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenRegister}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
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
            <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '540px', margin: '40px auto', borderRadius: '24px' }}>
              <ShieldCheck size={48} color="#818cf8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Доступ только для сотрудников' : lang === 'kk' ? 'Тек қызметкерлер үшін қолжетімді' : 'Staff Verification Required'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
                {lang === 'ru' 
                  ? 'Складской учет и активы доступны для завскладом, завхоза и директора. Войдите со своей учетной записью сотрудника.'
                  : lang === 'kk'
                  ? 'Қойма есебі мен активтер қойма меңгерушісіне, завхозға және директорға қолжетімді. Қызметкер ретінде кіріңіз.'
                  : 'Inventory and stock operations are restricted to school staff. Please sign in or register to access.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handleOpenLogin}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {t.auth?.signIn || 'Sign In'}
                </button>
                <button
                  onClick={handleOpenRegister}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
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
            <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '540px', margin: '40px auto', borderRadius: '24px' }}>
              <ShieldCheck size={48} color="#818cf8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Панель управления персоналом' : lang === 'kk' ? 'Қызметкерлерді басқару панелі' : 'Staff Administration Portal'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
                {lang === 'ru'
                  ? 'Управление пользователями и распределение ролей доступно только дирекции школы.'
                  : lang === 'kk'
                  ? 'Пайдаланушылар мен рөлдерді тағайындау тек мектеп дирекциясына қолжетімді.'
                  : 'Staff and user role administration is reserved for the School Directorate.'}
              </p>
              <button
                onClick={handleOpenLogin}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
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

      {/* Authentication Modal Window (Login & Registration Windows) */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
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
