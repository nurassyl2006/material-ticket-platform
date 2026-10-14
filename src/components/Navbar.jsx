import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Globe, 
  UserCheck, 
  Package, 
  ClipboardList, 
  LayoutDashboard, 
  User, 
  Plus, 
  RotateCcw, 
  LogOut, 
  Bell, 
  Database, 
  Users, 
  UserPlus, 
  Compass,
  LogIn,
  ShieldAlert,
  Sun,
  Moon
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { Link } from '../router';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenProfile, 
  onOpenNewTicket, 
  onSelectTicket,
  onOpenLogin,
  onOpenRegister,
  onOpenServerModal
}) => {
  const { 
    lang, 
    setLang, 
    role, 
    setRole, 
    t, 
    currentUser, 
    resetDemoData, 
    logout, 
    unreadCount, 
    cloudStatus, 
    syncWithCloud, 
    isAuthenticated,
    theme,
    toggleTheme
  } = useApp();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Helper for User Initials (e.g., Balkan Kassimov -> BK)
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Enterprise App Header */}
      <header
        className="main-navbar"
        style={{
          background: 'var(--bg-header, rgba(10, 15, 29, 0.85))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          padding: '0 20px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-depth-4, 0 4px 20px rgba(0, 0, 0, 0.35))',
          position: 'sticky',
          top: 0,
          zIndex: 900
        }}
      >
        <div
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            gap: '16px'
          }}
        >
          {/* Left: Brand Logo & Title */}
          <Link
            to="dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
              }}
            >
              <Package size={18} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #ffffff)', margin: 0, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                {t.appName ? (t.appName.includes(' - ') ? t.appName.split(' - ')[0] : t.appName) : 'EduOps'}
              </h1>
              <span className="mobile-hide" style={{ height: '12px', width: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
              <span className="mobile-hide" style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                {t.subtitle || 'Facilities & Operations'}
              </span>
            </div>
          </Link>

          {/* Center: Modern Navigation Tabs */}
          <nav
            className="desktop-nav-tabs"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              gap: '4px'
            }}
          >
            <Link
              to="dashboard"
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: activeTab === 'dashboard' ? '600' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: activeTab === 'dashboard' ? '#818cf8' : '#94a3b8',
                background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                border: activeTab === 'dashboard' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'dashboard') {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'dashboard') {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <LayoutDashboard size={15} color={activeTab === 'dashboard' ? '#818cf8' : 'currentColor'} />
              <span>{t.nav.dashboard}</span>
            </Link>

            <Link
              to="tickets"
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: activeTab === 'tickets' ? '600' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: activeTab === 'tickets' ? '#818cf8' : '#94a3b8',
                background: activeTab === 'tickets' ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                border: activeTab === 'tickets' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'tickets') {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'tickets') {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <ClipboardList size={15} color={activeTab === 'tickets' ? '#818cf8' : 'currentColor'} />
              <span>{t.nav.tickets}</span>
            </Link>

            {(role === 'storage_manager' || role === 'facilities_manager' || role === 'director' || role === 'workerA' || role === 'admin') && (
              <Link
                to="inventory"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'inventory' ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: activeTab === 'inventory' ? '#818cf8' : '#94a3b8',
                  background: activeTab === 'inventory' ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                  border: activeTab === 'inventory' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'inventory') {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'inventory') {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Package size={15} color={activeTab === 'inventory' ? '#818cf8' : 'currentColor'} />
                <span>{t.nav.inventory}</span>
              </Link>
            )}

            {(role === 'director' || role === 'admin') && (
              <Link
                to="users"
                style={{
                  height: '36px',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'users' ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: activeTab === 'users' ? '#818cf8' : '#94a3b8',
                  background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                  border: activeTab === 'users' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'users') {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'users') {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Users size={15} color={activeTab === 'users' ? '#818cf8' : 'currentColor'} />
                <span>{t.nav?.users || 'Staff & Roles'}</span>
              </Link>
            )}

            {/* "+ New Request" Primary Button */}
            {onOpenNewTicket && (
              <div style={{ marginLeft: '12px' }}>
                <button
                  onClick={onOpenNewTicket}
                  className="fluent-btn-primary"
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    fontSize: '12px'
                  }}
                >
                  <Plus size={14} />
                  <span>{t.nav.newTicket}</span>
                </button>
              </div>
            )}
          </nav>

          {/* Right Section: Controls, Language, Notifications & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Language Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
              }}
            >
              <Globe size={13} color="var(--text-muted, #94a3b8)" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-main, #f8fafc)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0
                }}
              >
                <option value="kk" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>ҚАЗ</option>
                <option value="ru" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>РУС</option>
                <option value="en" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>ENG</option>
              </select>
            </div>

            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '8px',
                color: theme === 'light' ? '#d97706' : '#818cf8',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = theme === 'light' ? '#d97706' : '#818cf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.1))';
              }}
            >
              {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsNotificationOpen(prev => !prev)}
                title={t.notifications?.title || 'Notifications'}
                style={{
                  position: 'relative',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isNotificationOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: isNotificationOpen ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                onMouseLeave={(e) => {
                  if (!isNotificationOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '700',
                      minWidth: '15px',
                      height: '15px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onSelectTicket={onSelectTicket}
              />
            </div>

            {/* Database Status Pill */}
            <button
              type="button"
              className="mobile-hide"
              onClick={onOpenServerModal || syncWithCloud}
              title={
                cloudStatus === 'syncing'
                  ? 'Syncing with SQLite database...'
                  : cloudStatus === 'offline'
                  ? 'Offline mode (click to configure remote server)'
                  : 'Connected to SQLite database (click for diagnostics)'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            >
              <Database size={13} color={cloudStatus === 'syncing' ? '#6366f1' : cloudStatus === 'offline' ? '#f59e0b' : '#10b981'} />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: cloudStatus === 'syncing' ? '#6366f1' : cloudStatus === 'offline' ? '#f59e0b' : '#10b981',
                  boxShadow: cloudStatus === 'connected' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
                }}
              />
              <span className="profile-btn-text">
                {cloudStatus === 'syncing' ? 'Syncing' : cloudStatus === 'offline' ? 'Offline' : 'Connected'}
              </span>
            </button>

            {/* Authenticated User OR Guest/Parent Role Selector & Sign In/Register */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Account Avatar & Role */}
                <Link
                  to="profile"
                  onClick={onOpenProfile}
                  title={`${currentUser?.name || 'User'} (${t.roles[role]})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '4px 10px 4px 5px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: role === 'director' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #3b82f6, #4f46e5)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                      position: 'relative'
                    }}
                  >
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      getUserInitials(currentUser?.name)
                    )}
                    {/* Active presence dot */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        right: '-1px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '1px solid #0a0f1d'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                    <span className="profile-btn-text" style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', lineHeight: 1.2 }}>
                      {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
                    </span>
                    <span className="role-logged-text" style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>
                      {t.roles[role]}
                    </span>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  className="mobile-hide"
                  onClick={() => logout()}
                  title={t.auth?.logout || 'Sign Out'}
                  style={{
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Guest / Parent Selector Pills */}
                <div
                  className="mobile-hide"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '2px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRole('guest')}
                    style={{
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: role === 'guest' ? '#ffffff' : '#94a3b8',
                      background: role === 'guest' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Compass size={12} />
                    <span>{t.auth?.guestTag || 'Guest'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('parent')}
                    style={{
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: role === 'parent' ? '#ffffff' : '#94a3b8',
                      background: role === 'parent' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Users size={12} />
                    <span>{t.auth?.parentTag || 'Parent'}</span>
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="fluent-btn-secondary"
                  style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                >
                  <LogIn size={13} />
                  <span>{t.auth?.loginWindow || t.auth?.signIn || 'Sign In'}</span>
                </button>

                {/* Register Button */}
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="fluent-btn-primary mobile-hide"
                  style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                >
                  <UserPlus size={13} />
                  <span>{t.auth?.registerWindow || 'Register'}</span>
                </button>
              </div>
            )}

            {/* Reset Demo Data Button */}
            <button
              className="mobile-hide"
              onClick={() => {
                if (window.confirm('Reset demo requests and roles to initial state?')) {
                  resetDemoData();
                }
              }}
              title="Reset Demo Data"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fluent Mobile) */}
      <nav className="mobile-bottom-nav">
        <Link
          to="dashboard"
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>{t.nav.dashboard}</span>
        </Link>

        <Link
          to="tickets"
          className={`mobile-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
        >
          <ClipboardList size={20} />
          <span>{t.nav.tickets}</span>
        </Link>

        {/* Elevated Floating Action Center Button */}
        <button
          onClick={onOpenNewTicket}
          className="mobile-nav-fab"
          title={t.nav.newTicket}
        >
          <div className="mobile-fab-circle">
            <Plus size={22} color="#ffffff" />
          </div>
          <span className="mobile-fab-label">{lang === 'ru' ? 'Заявка' : lang === 'kk' ? 'Өтінім' : (t.nav.newTicket || 'New')}</span>
        </button>

        {isAuthenticated && (
          (role === 'director' || role === 'admin') ? (
            <Link
              to="users"
              className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>{t.nav?.users || 'Staff'}</span>
            </Link>
          ) : (role === 'storage_manager' || role === 'facilities_manager' || role === 'workerA') ? (
            <Link
              to="inventory"
              className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            >
              <Package size={20} />
              <span>{t.nav.inventory}</span>
            </Link>
          ) : null
        )}

        {isAuthenticated ? (
          <Link
            to="profile"
            onClick={onOpenProfile}
            className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User size={20} />
            <span>{t.nav.profile}</span>
          </Link>
        ) : (
          <button
            onClick={onOpenLogin}
            className="mobile-nav-item"
          >
            <LogIn size={20} />
            <span>{t.auth?.signIn || 'Sign In'}</span>
          </button>
        )}
      </nav>
    </>
  );
};
