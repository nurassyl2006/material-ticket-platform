import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './AppContext';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { UserManagement } from './components/UserManagement';
import { DirectorDailyDigest } from './components/DirectorDailyDigest';
import { TicketModal } from './components/TicketModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DeviceNotificationBanner } from './components/DeviceNotificationBanner';
import ServerStatusModal from './components/ServerStatusModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShieldCheck, LogIn, UserPlus, Compass, Users, Lock, Package, ClipboardList } from 'lucide-react';
import { parseCurrentRoute, navigate, buildUrl, updatePageTitle } from './router';
import './index.css';

function MainApp() {
  const { isAuthenticated, role, setRole, lang, t, canAccessDailyDigest } = useApp();
  const [route, setRoute] = useState(() => parseCurrentRoute());
  const activeTab = route.tab;
  const canAccessCatalog = Boolean(isAuthenticated);

  const setActiveTab = useCallback((newTabOrPath, params = {}) => {
    if (typeof newTabOrPath === 'string' && newTabOrPath.startsWith('/')) {
      navigate(newTabOrPath);
    } else {
      navigate(buildUrl(newTabOrPath, params));
    }
  }, []);

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketDept, setNewTicketDept] = useState('engineering');
  const [newTicketInitialItem, setNewTicketInitialItem] = useState('');
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

  const handleOpenNewTicket = (dept = 'engineering', initialItem = '') => {
    setNewTicketDept(dept);
    setNewTicketInitialItem(initialItem);
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
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 16px' }}>
        <DeviceNotificationBanner />
      </div>

      {/* Unregistered Guest / Parent Notification & Access Banner */}
      {!isAuthenticated && (
        <div className="guest-banner-wrapper" style={{ maxWidth: '1280px', margin: '-4px auto 16px', padding: '0 16px' }}>
          <div className="guest-banner-card" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${role === 'parent' ? '#8b5cf6' : 'var(--primary)'}`,
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-depth-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: role === 'parent' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: role === 'parent' ? '#7c3aed' : 'var(--primary)',
                flexShrink: 0
              }}>
                {role === 'parent' ? <Users size={18} /> : <Compass size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    {role === 'parent'
                      ? (lang === 'ru' ? 'Режим «Родитель»' : lang === 'kk' ? '«Ата-ана» режимі' : 'Parent Mode')
                      : (lang === 'ru' ? 'Режим «Гость / Посетитель»' : lang === 'kk' ? '«Қонақ / Келуші» режимі' : 'Visitor Mode')}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border-color)',
                    padding: '2px 8px', 
                    borderRadius: '999px',
                    color: 'var(--text-muted)',
                    fontWeight: '500'
                  }}>
                    {lang === 'ru' ? 'Без входа' : lang === 'kk' ? 'Кірусіз' : 'Quick Access'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {role === 'parent'
                    ? (lang === 'ru' ? 'Подавайте обращения по классам, удобству и безопасности без регистрации.' : lang === 'kk' ? 'Тіркелусіз сыныптар мен қауіпсіздік бойынша сұраныс беріңіз.' : 'Submit classroom and school maintenance requests directly without signing in.')
                    : (lang === 'ru' ? 'Вы можете подать обращение или сообщить о неполадке прямо сейчас.' : lang === 'kk' ? 'Мектеп бойынша кез келген өтінімді тіркеусіз-ақ бере аласыз.' : 'Submit a school service request or report an issue instantly.')}
                </div>
              </div>
            </div>

            <div className="guest-banner-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setRole(role === 'parent' ? 'guest' : 'parent')}
                className="fluent-btn-secondary"
                style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
              >
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Режим Гостя' : lang === 'kk' ? 'Қонақ режимі' : 'Switch to Guest')
                  : (lang === 'ru' ? 'Режим Родителя' : lang === 'kk' ? 'Ата-ана режимі' : 'Switch to Parent')}
              </button>
              <button
                type="button"
                onClick={handleOpenLogin}
                className="fluent-btn-secondary"
                style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
              >
                <LogIn size={13} />
                <span>{t.auth?.signIn || 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenRegister}
                className="fluent-btn-primary"
                style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
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
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '520px', margin: '32px auto', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-depth-4)' }}>
              <ShieldCheck size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Доступ только для сотрудников' : lang === 'kk' ? 'Тек қызметкерлер үшін қолжетімді' : 'Staff Verification Required'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
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
                  style={{ height: '36px', padding: '0 18px' }}
                >
                  {t.auth?.signIn || 'Sign In'}
                </button>
                <button
                  onClick={handleOpenRegister}
                  className="fluent-btn-secondary"
                  style={{ height: '36px', padding: '0 18px' }}
                >
                  {t.auth?.registerWindow || 'Register'}
                </button>
              </div>
            </div>
          ) : (
            <InventoryManager onOpenNewTicket={handleOpenNewTicket} />
          )
        )}
        {activeTab === 'users' && (
          isAuthenticated ? (
            <UserManagement />
          ) : (
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '520px', margin: '32px auto', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-depth-4)' }}>
              <ShieldCheck size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Панель управления персоналом' : lang === 'kk' ? 'Қызметкерлерді басқару панелі' : 'Staff Administration Portal'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                {lang === 'ru'
                  ? 'Управление пользователями и распределение ролей доступно только дирекции школы.'
                  : lang === 'kk'
                  ? 'Пайдаланушылар мен рөлдерді тағайындау тек мектеп дирекциясына қолжетімді.'
                  : 'Staff and user role administration is reserved for the School Directorate.'}
              </p>
              <button
                onClick={handleOpenLogin}
                className="fluent-btn-primary"
                style={{ height: '36px', padding: '0 18px' }}
              >
                {t.auth?.signIn || 'Sign In as Director'}
              </button>
            </div>
          )
        )}
        {(['daily-digest', 'dailyDigest', 'weekly-report', 'monthly-report', 'reports'].includes(activeTab)) && (
          (canAccessDailyDigest ? canAccessDailyDigest() : (['director', 'admin', 'engineer', 'head_engineer', 'storage_manager', 'workerA', 'facilities_manager', 'finance', 'accountant', 'cleaning_head', 'cleaning', 'it_support'].includes(role))) ? (
            <DirectorDailyDigest 
              onOpenNewTicket={handleOpenNewTicket} 
              currentPath={route.path}
              initialPeriod={
                activeTab === 'weekly-report' || route.path.includes('weekly') ? 'weekly'
                : (activeTab === 'monthly-report' || route.path.includes('monthly') ? 'monthly' : 'daily')
              }
            />
          ) : (
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '520px', margin: '32px auto', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-depth-4)' }}>
              <ShieldCheck size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Требуется оперативный доступ' : lang === 'kk' ? 'Операциялық қолжетімділік қажет' : 'Operational Access Required'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                {lang === 'ru'
                  ? 'Оперативные ежедневные, еженедельные и ежемесячные отчеты по заявкам доступны руководству школы, главному инженеру, зав. клинингом, завскладу, IT отделу и финансовой службе.'
                  : lang === 'kk'
                  ? 'Өтінімдер бойынша күнделікті, апталық және айлық операциялық есептер мектеп басшылығына, бас инженерге, тазалық жетекшісіне, қойма меңгерушісіне, IT және қаржы бөлімдеріне қолжетімді.'
                  : 'Operational daily, weekly, and monthly ticket performance reports are accessible to School Directorate, Head of Engineering, Head of Cleaning, Storage Manager, Head of IT, Facilities, and Finance.'}
              </p>
              <button
                onClick={handleOpenLogin}
                className="fluent-btn-primary"
                style={{ height: '36px', padding: '0 18px' }}
              >
                {t.auth?.signIn || 'Sign In'}
              </button>
            </div>
          )
        )}
      </main>

      <TicketModal 
        isOpen={isNewTicketOpen} 
        onClose={() => setIsNewTicketOpen(false)} 
        initialDepartment={newTicketDept}
        initialItem={newTicketInitialItem}
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
