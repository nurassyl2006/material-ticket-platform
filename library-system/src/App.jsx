import React, { useState, useEffect } from 'react';
import AppHeader from './components/AppHeader';
import Navigation from './components/Navigation';
import CirculationDesk from './components/CirculationDesk';
import BookCatalog from './components/BookCatalog';
import BorrowerDirectory from './components/BorrowerDirectory';
import LoanManager from './components/LoanManager';
import ScannerKiosk from './components/ScannerKiosk';
import SettingsModal from './components/SettingsModal';
import DatabaseSchema from './components/DatabaseSchema';
import LoanReceiptModal from './components/LoanReceiptModal';
import LoginScreen from './components/LoginScreen';
import ChangePasswordModal from './components/ChangePasswordModal';
import { api, getToken, setToken, clearToken, setUnauthorizedHandler } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState('circulation');
  const [stats, setStats] = useState(null);
  const [activeReceiptLoan, setActiveReceiptLoan] = useState(null);
  const [preselectedBook, setPreselectedBook] = useState(null);
  const [preselectedBorrower, setPreselectedBorrower] = useState(null);

  // Check stored session on mount
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null);
    });

    const verifySession = async () => {
      const token = getToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.user) {
          setCurrentUser(res.user);
        } else {
          clearToken();
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        clearToken();
      } finally {
        setAuthChecking(false);
      }
    };

    verifySession();
  }, []);

  // Load real-time stats when authenticated
  const refreshStats = async () => {
    if (!currentUser && !getToken()) return;
    try {
      const res = await api.getStats();
      if (res.data) setStats(res.data);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshStats();
      const interval = setInterval(refreshStats, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!currentUser) return;
    const handleGlobalKeys = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentTab('circulation');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('scanner');
      } else if (e.key === 'Escape') {
        setActiveReceiptLoan(null);
        setIsChangePasswordOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [currentUser]);

  // Auth Actions
  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    setToken(res.token);
    setCurrentUser(res.user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // ignore
    }
    clearToken();
    setCurrentUser(null);
  };

  // Handlers to jump between tabs seamlessly
  const handleSelectBookForCirculation = (book) => {
    setPreselectedBook(book);
    setCurrentTab('circulation');
  };

  const handleSelectBorrowerForCirculation = (borrower) => {
    setPreselectedBorrower(borrower);
    setCurrentTab('circulation');
  };

  // 1. Initial Session Loading Screen
  if (authChecking) {
    return (
      <div className="login-screen-wrapper">
        <div className="login-ambient-glow" />
        <div style={{ textAlign: 'center', zIndex: 10, color: 'var(--text-secondary)' }}>
          <div className="status-dot-pulse" style={{ margin: '0 auto 16px', width: '14px', height: '14px' }}></div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Connecting to Athenaeum Terminal...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  // 3. Authenticated: Render Main Laptop App Interface
  const activeLoansCount = stats?.loans?.activeLoans || 0;
  const overdueLoansCount = stats?.loans?.overdueLoans || 0;
  const totalBooksCount = stats?.books?.totalTitles || 0;
  const totalBorrowersCount = stats?.borrowers?.totalBorrowers || 0;

  return (
    <div className="app-container">
      {/* Desktop App Window Header */}
      <AppHeader 
        libraryName="Ardingly Central Library"
        activeLoansCount={activeLoansCount}
        overdueLoansCount={overdueLoansCount}
        currentTab={currentTab}
        onOpenScanner={() => setCurrentTab('scanner')}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="app-body">
        {/* Sidebar Tabs */}
        <Navigation 
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          counts={{
            active: activeLoansCount,
            overdue: overdueLoansCount,
            books: totalBooksCount,
            borrowers: totalBorrowersCount
          }}
        />

        {/* Dynamic Content View */}
        <main className="app-content">
          {currentTab === 'circulation' && (
            <CirculationDesk 
              preselectedBook={preselectedBook}
              preselectedBorrower={preselectedBorrower}
              onClearPreselected={() => { setPreselectedBook(null); setPreselectedBorrower(null); }}
              onRefreshStats={refreshStats}
              onOpenReceiptModal={(loan) => setActiveReceiptLoan(loan)}
            />
          )}

          {currentTab === 'books' && (
            <BookCatalog 
              onSelectBookForCirculation={handleSelectBookForCirculation}
            />
          )}

          {currentTab === 'borrowers' && (
            <BorrowerDirectory 
              onSelectBorrowerForCirculation={handleSelectBorrowerForCirculation}
              onRefreshStats={refreshStats}
            />
          )}

          {currentTab === 'loans' && (
            <LoanManager 
              onOpenReceiptModal={(loan) => setActiveReceiptLoan(loan)}
              onRefreshStats={refreshStats}
            />
          )}

          {currentTab === 'scanner' && (
            <ScannerKiosk 
              onSelectBook={handleSelectBookForCirculation}
              onSelectBorrower={handleSelectBorrowerForCirculation}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsModal 
              currentUser={currentUser}
              onSettingsUpdated={refreshStats}
            />
          )}

          {currentTab === 'database' && (
            <DatabaseSchema />
          )}
        </main>
      </div>

      {/* Printable Loan Receipt Modal */}
      {activeReceiptLoan && (
        <LoanReceiptModal 
          loan={activeReceiptLoan}
          onClose={() => setActiveReceiptLoan(null)}
        />
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal 
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}
    </div>
  );
}
