import React, { useState, useEffect, useCallback } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShieldCheck, LogIn, UserPlus, Compass, Users, Lock, Package, ClipboardList } from 'lucide-react';
import { parseCurrentRoute, navigate, buildUrl, updatePageTitle } from './router';
import './index.css';

function MainApp() {
  const { isAuthenticated, role, setRole, lang, t } = useApp();
  const [route, setRoute] = useState(() => parseCurrentRoute());
  const activeTab = route.tab;
  const canAccessCatalog = Boolean(isAuthenticated && ['storage_manager', 'workerA', 'engineer', 'director', 'admin'].includes(role));

  const setActiveTab = useCallback((newTabOrPath, params = {}) => {
    if (typeof newTabOrPath === 'string' && newTabOrPath.startsWith('/')) {
      navigate(newTabOrPath);
    } else {
      navigate(buildUrl(newTabOrPath, params));
    }
  }, []);

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
    setActiveTab('tickets', { id: ticketId });
    setTargetTicketId(ticketId);
  };

  useEffect(() => {
    window.__onSelectTicketGlobal = handleSelectTicketFromNotification;
    return () => {
      window.__onSelectTicketGlobal = null;
    };
  }, []);

  // Sync route on browser navigation (Back, Forward, Refresh, URL change)
  useEffect(() => {
    const handlePopState = () => {
      const newRoute = parseCurrentRoute();
      setRoute(newRoute);
      updatePageTitle(newRoute.tab, lang);
      if (newRoute.params.id) {
        setTargetTicketId(newRoute.params.id);
      }
      if (newRoute.params.new === '1') {
        setIsNewTicketOpen(true);
      }
      if (newRoute.tab === 'profile') {
        setIsProfileOpen(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    updatePageTitle(route.tab, lang);

    // Initial check for params from first page load
    if (route.params.id) {
      setTargetTicketId(route.params.id);
    }
    if (route.params.new === '1') {
      setIsNewTicketOpen(true);
    }
    if (route.tab === 'profile') {
      setIsProfileOpen(true);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lang, route.tab]);

  // Update title when language changes
  useEffect(() => {
    updatePageTitle(activeTab, lang);
  }, [activeTab, lang]);

  const handleOpenProfile = () => {
    setIsProfileOpen(true);
    navigate('/profile');
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    if (activeTab === 'profile') {
      setActiveTab('dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={handleOpenProfile}
        onOpenNewTicket={() => handleOpenNewTicket('engineering')}
        onSelectTicket={handleSelectTicketFromNotification}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenServerModal={() => setIsServerModalOpen(true)}
      />
      <DeviceToastAlert onSelectTicket={handleSelectTicketFromNotification} />

      {/* Unregistered Guest / Parent Notification & Access Banner */}
      {!isAuthenticated && (
        <div className="guest-banner-wrapper" style={{ maxWidth: '1360px', margin: '-8px auto 16px', padding: '0 16px' }}>
          <div className="guest-banner-card" style={{
            background: 'var(--bg-card, rgba(18, 25, 44, 0.75))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: `4px solid ${role === 'parent' ? '#8b5cf6' : '#6366f1'}`,
            borderRadius: '12px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-depth-2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: role === 'parent' ? 'rgba(91, 95, 199, 0.18)' : 'rgba(15, 108, 189, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: role === 'parent' ? '#8b8fe6' : '#70b5f9',
                flexShrink: 0
              }}>
                {role === 'parent' ? <Users size={18} /> : <Compass size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main, #f3f2f1)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span>
                    {role === 'parent'
                      ? (lang === 'ru' ? 'Вы находитесь в режиме «Родитель»' : lang === 'kk' ? 'Сіз «Ата-ана» режиміндесіз' : 'Browsing as School Parent')
                      : (lang === 'ru' ? 'Вы находитесь в режиме «Гость / Посетитель»' : lang === 'kk' ? 'Сіз «Қонақ / Келуші» режиміндесіз' : 'Browsing as Campus Guest')}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.08))', 
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                    padding: '1px 6px', 
                    borderRadius: '4px',
                    color: 'var(--text-muted, #adadad)',
                    fontWeight: '500'
                  }}>
                    {t.auth?.unregisteredUser || 'Unregistered'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #adadad)', marginTop: '2px', lineHeight: 1.4 }}>
                  {role === 'parent'
                    ? (lang === 'ru' ? 'Вы можете просматривать заявки школы и подавать обращения по классам и безопасности' : lang === 'kk' ? 'Мектеп өтінімдерін қарап, сыныптар мен қауіпсіздік бойынша сұраныс бере аласыз' : 'Submit classroom, maintenance or safety requests without creating an account')
                    : (lang === 'ru' ? 'Вы можете просматривать общественные заявки и подавать обращения посетителя' : lang === 'kk' ? 'Мектеп бойынша өтінімдерді қарап, келуші сұраныстарын жібере аласыз' : 'Browse requests and submit campus visitor tickets directly')}
                </div>
              </div>
            </div>

            <div className="guest-banner-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setRole(role === 'parent' ? 'guest' : 'parent')}
                className="fluent-btn-secondary"
                style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
              >
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Переключить на Гостя' : lang === 'kk' ? 'Қонаққа ауысу' : 'Switch to Guest')
                  : (lang === 'ru' ? 'Переключить на Родителя' : lang === 'kk' ? 'Ата-анаға ауысу' : 'Switch to Parent')}
              </button>
              <button
                type="button"
                onClick={handleOpenLogin}
                className="fluent-btn-secondary"
                style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
              >
                <LogIn size={13} />
                <span>{t.auth?.signIn || 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenRegister}
                className="fluent-btn-primary"
                style={{ height: '30px', padding: '0 12px', fontSize: '12px' }}
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
            initialSearchTerm={targetTicketId || route.params.id || route.params.search || ''}
          />
        )}
        {activeTab === 'inventory' && (
          !isAuthenticated ? (
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '520px', margin: '32px auto', borderRadius: '6px', background: '#252525', border: '1px solid #383838' }}>
              <ShieldCheck size={40} color="#0f6cbd" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f3f2f1', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Доступ только для сотрудников' : lang === 'kk' ? 'Тек қызметкерлер үшін қолжетімді' : 'Staff Verification Required'}
              </h3>
              <p style={{ fontSize: '13px', color: '#adadad', marginBottom: '20px', lineHeight: 1.5 }}>
                {lang === 'ru' 
                  ? 'Складской учет и каталог доступны для завскладом, инженеров и администрации. Войдите со своей учетной записью.'
                  : lang === 'kk'
                  ? 'Қойма есебі мен каталогы қойма меңгерушісіне, инженерлерге және әкімшілікке қолжетімді. Тіркелгіңізбен кіріңіз.'
                  : 'Warehouse inventory catalog is restricted to Storage Manager, Engineers, and School Leadership. Please sign in to access.'}
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
          ) : !canAccessCatalog ? (
            <div className="glass-panel" style={{ padding: '44px 28px', textAlign: 'center', maxWidth: '560px', margin: '36px auto', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(16px)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Lock size={26} color="#f87171" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Доступ к каталогу склада ограничен' : lang === 'kk' ? 'Қойма каталогына кіру шектелген' : 'Warehouse Catalog Access Restricted'}
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '22px', lineHeight: 1.6 }}>
                {lang === 'ru' 
                  ? 'Просмотр каталога склада и остатков товаров разрешен только заведующему складом, инженерам и администрации школы. Учителя и сотрудники могут заказывать нужные материалы через раздел заявок.'
                  : lang === 'kk'
                  ? 'Қойма каталогы мен тауар қалдықтарын қарау тек қойма меңгерушісіне, инженерлерге және мектеп әкімшілігіне рұқсат етілген. Мұғалімдер өтінімдер бөлімі арқылы қажетті заттарға сұраныс бере алады.'
                  : 'Viewing the warehouse catalog and live stock counts is restricted to the Storage Manager, Engineers, and School Administration. Teachers and staff can request needed supplies directly from the Requests page.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="fluent-btn-primary"
                  style={{ height: '36px', padding: '0 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ClipboardList size={16} />
                  <span>{t.nav?.tickets || 'View Requests'}</span>
                </button>
                <button
                  onClick={() => handleOpenNewTicket('storage')}
                  className="fluent-btn-secondary"
                  style={{ height: '36px', padding: '0 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Package size={16} />
                  <span>{lang === 'ru' ? 'Заказать материалы' : lang === 'kk' ? 'Материалдарға тапсырыс беру' : 'Request Supplies'}</span>
                </button>
              </div>
            </div>
          ) : (
            <InventoryManager />
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
        onClose={handleCloseProfile} 
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
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
