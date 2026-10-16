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
    toggleTheme,
    canAccessStorage
  } = useApp();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const hasStorageAccess = canAccessStorage ? canAccessStorage(role) : true;

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
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            gap: '12px'
          }}
        >
          {/* Left: Brand Logo & Title */}
          <Link
            to="dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
                flexShrink: 0
              }}
            >
              <Package size={17} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #ffffff)', margin: 0, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                {t.appName ? (t.appName.includes(' - ') ? t.appName.split(' - ')[0] : t.appName) : 'EduOps'}
              </span>
              <span
                className="mobile-hide"
                style={{
                  fontSize: '9.5px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  whiteSpace: 'nowrap'
                }}
              >
                CAMPUS
              </span>
            </div>
          </Link>

          {/* Center: Modern Segmented Navigation Tabs */}
          <nav
            className="desktop-nav-tabs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              gap: '2px',
              flexShrink: 0
            }}
          >
            <Link
              to="dashboard"
              style={{
                height: '30px',
                padding: '0 12px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'dashboard' ? '600' : '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'dashboard' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
                background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                border: activeTab === 'dashboard' ? '1px solid rgba(99, 102, 241, 0.38)' : '1px solid transparent',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: activeTab === 'dashboard' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'dashboard') {
                  e.currentTarget.style.color = 'var(--text-main, #ffffff)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'dashboard') {
                  e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <LayoutDashboard size={14} color={activeTab === 'dashboard' ? '#818cf8' : 'currentColor'} />
              <span>{t.nav.dashboard}</span>
            </Link>

            <Link
              to="tickets"
              style={{
                height: '30px',
                padding: '0 12px',
                fontSize: '12.5px',
                fontWeight: activeTab === 'tickets' ? '600' : '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'tickets' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
                background: activeTab === 'tickets' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                border: activeTab === 'tickets' ? '1px solid rgba(99, 102, 241, 0.38)' : '1px solid transparent',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: activeTab === 'tickets' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'tickets') {
                  e.currentTarget.style.color = 'var(--text-main, #ffffff)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'tickets') {
                  e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <ClipboardList size={14} color={activeTab === 'tickets' ? '#818cf8' : 'currentColor'} />
              <span>{t.nav.tickets}</span>
            </Link>

            {isAuthenticated && hasStorageAccess && (
              <Link
                to="inventory"
                style={{
                  height: '30px',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  fontWeight: activeTab === 'inventory' ? '600' : '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'inventory' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
                  background: activeTab === 'inventory' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                  border: activeTab === 'inventory' ? '1px solid rgba(99, 102, 241, 0.38)' : '1px solid transparent',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: activeTab === 'inventory' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'inventory') {
                    e.currentTarget.style.color = 'var(--text-main, #ffffff)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'inventory') {
                    e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Package size={14} color={activeTab === 'inventory' ? '#818cf8' : 'currentColor'} />
                <span>{role === 'teacher' ? (t.nav?.catalog || 'Catalog') : t.nav.inventory}</span>
              </Link>
            )}

            {(role === 'director' || role === 'admin') && (
              <Link
                to="users"
                style={{
                  height: '30px',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  fontWeight: activeTab === 'users' ? '600' : '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'users' ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)',
                  background: activeTab === 'users' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                  border: activeTab === 'users' ? '1px solid rgba(99, 102, 241, 0.38)' : '1px solid transparent',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: activeTab === 'users' ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'users') {
                    e.currentTarget.style.color = 'var(--text-main, #ffffff)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'users') {
                    e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Users size={14} color={activeTab === 'users' ? '#818cf8' : 'currentColor'} />
                <span>{t.nav?.users || 'Staff & Roles'}</span>
              </Link>
            )}
          </nav>

          {/* Right Section: Action CTA + Controls Cluster */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Primary Action Button: + New Request */}
            {onOpenNewTicket && (
              <button
                onClick={onOpenNewTicket}
                className="fluent-btn-primary"
                style={{
                  height: '32px',
                  padding: '0 13px',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)'
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>{t.nav.newTicket}</span>
              </button>
            )}

            {/* Subtle Divider */}
            <span
              className="mobile-hide"
              style={{
                height: '18px',
                width: '1px',
                background: 'var(--border-color, rgba(255, 255, 255, 0.12))',
                margin: '0 2px',
                flexShrink: 0
              }}
            />

            {/* Language Switcher */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                height: '32px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                padding: '0 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                flexShrink: 0
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
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '8px',
                color: theme === 'light' ? '#d97706' : '#818cf8',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              {theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setIsNotificationOpen(prev => !prev)}
                title={t.notifications?.title || 'Notifications'}
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isNotificationOpen ? 'rgba(255, 255, 255, 0.12)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  borderRadius: '8px',
                  color: isNotificationOpen ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: '700',
                      minWidth: '14px',
                      height: '14px',
                      borderRadius: '7px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 2px',
                      boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                padding: '0 9px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '11px',
                fontWeight: '600',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Database size={13} color={cloudStatus === 'syncing' ? '#6366f1' : cloudStatus === 'offline' ? '#f59e0b' : '#10b981'} />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: cloudStatus === 'syncing' ? '#6366f1' : cloudStatus === 'offline' ? '#f59e0b' : '#10b981',
                  boxShadow: cloudStatus === 'connected' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                  flexShrink: 0
                }}
              />
              <span className="profile-btn-text" style={{ whiteSpace: 'nowrap' }}>
                {cloudStatus === 'syncing' ? 'Syncing' : cloudStatus === 'offline' ? 'Offline' : 'Connected'}
              </span>
            </button>

            {/* Authenticated User OR Guest/Parent Auth Controls */}
            {isAuthenticated ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {/* Account Avatar & Role */}
                <Link
                  to="profile"
                  onClick={onOpenProfile}
                  title={`${currentUser?.name || 'User'} (${t.roles[role]})`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '32px',
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    padding: '0 10px 0 4px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.1))')}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: role === 'director' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #3b82f6, #4f46e5)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      position: 'relative',
                      flexShrink: 0
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
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        right: '-1px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '1px solid #0a0f1d'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1 }}>
                    <span className="profile-btn-text" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main, #f8fafc)', whiteSpace: 'nowrap' }}>
                      {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
                    </span>
                    <span className="role-logged-text" style={{ fontSize: '9.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', whiteSpace: 'nowrap' }}>
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
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    borderRadius: '8px',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.04))';
                    e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
                    e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.1))';
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {/* Guest / Parent Selector Pills */}
                <div
                  className="mobile-hide"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    borderRadius: '8px',
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRole('guest')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: role === 'guest' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                      background: role === 'guest' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Compass size={12} />
                    <span>{t.auth?.guestTag || 'Guest'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('parent')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: role === 'parent' ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                      background: role === 'parent' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
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
                  style={{ height: '32px', padding: '0 11px', fontSize: '12px', whiteSpace: 'nowrap', borderRadius: '8px' }}
                >
                  <LogIn size={13} />
                  <span>{t.auth?.loginWindow || t.auth?.signIn || 'Sign In'}</span>
                </button>

                {/* Register Button */}
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="fluent-btn-primary mobile-hide"
                  style={{ height: '32px', padding: '0 11px', fontSize: '12px', whiteSpace: 'nowrap', borderRadius: '8px' }}
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
                color: 'var(--text-dim, #64748b)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'var(--text-muted, #94a3b8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-dim, #64748b)';
              }}
            >
              <RotateCcw size={13} />
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
          ) : (isAuthenticated && hasStorageAccess) ? (
            <Link
              to="inventory"
              className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            >
              <Package size={20} />
              <span>{role === 'teacher' ? (t.nav?.catalog || (lang === 'ru' ? 'Каталог' : 'Catalog')) : t.nav.inventory}</span>
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
