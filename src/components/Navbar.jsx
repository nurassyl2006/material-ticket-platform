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
  LayoutGrid,
  ShieldAlert
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

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
    isAuthenticated 
  } = useApp();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Helper for Microsoft 365 User Initials (e.g., Balkan Kassimov -> BK)
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
      {/* Microsoft 365 Enterprise App Header */}
      <header
        className="main-navbar"
        style={{
          background: '#252525',
          borderBottom: '1px solid #383838',
          padding: '0 20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
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
            height: '52px',
            gap: '16px'
          }}
        >
          {/* Left: Microsoft 365 App Waffle & Brand Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Waffle Menu Icon */}
            <button
              type="button"
              title="Microsoft 365 Apps"
              onClick={() => setActiveTab('dashboard')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '4px',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#adadad',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#333333')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LayoutGrid size={18} />
            </button>

            {/* Brand Logo & Name */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <div
                style={{
                  background: '#0f6cbd',
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Package size={17} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', margin: 0, letterSpacing: '-0.2px' }}>
                    {t.appName || 'EduOps'}
                  </h1>
                  <span style={{ fontSize: '11px', color: '#797775', fontWeight: '400' }}>|</span>
                  <span style={{ fontSize: '12px', color: '#adadad', fontWeight: '400' }}>
                    {t.subtitle || 'Facilities & Materials'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Microsoft Fluent Pivot Tabs */}
          <nav
            className="desktop-nav-tabs"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              gap: '2px'
            }}
          >
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                height: '52px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: activeTab === 'dashboard' ? '600' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'dashboard' ? '#ffffff' : '#adadad',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'dashboard' ? '2px solid #0f6cbd' : '2px solid transparent',
                cursor: 'pointer',
                borderRadius: '0',
                transition: 'color 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'dashboard') e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'dashboard') e.currentTarget.style.color = '#adadad';
              }}
            >
              <LayoutDashboard size={15} color={activeTab === 'dashboard' ? '#0f6cbd' : 'currentColor'} />
              <span>{t.nav.dashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                height: '52px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: activeTab === 'tickets' ? '600' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'tickets' ? '#ffffff' : '#adadad',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'tickets' ? '2px solid #0f6cbd' : '2px solid transparent',
                cursor: 'pointer',
                borderRadius: '0',
                transition: 'color 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'tickets') e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'tickets') e.currentTarget.style.color = '#adadad';
              }}
            >
              <ClipboardList size={15} color={activeTab === 'tickets' ? '#0f6cbd' : 'currentColor'} />
              <span>{t.nav.tickets}</span>
            </button>

            {(role === 'storage_manager' || role === 'facilities_manager' || role === 'director' || role === 'workerA' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('inventory')}
                style={{
                  height: '52px',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'inventory' ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'inventory' ? '#ffffff' : '#adadad',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'inventory' ? '2px solid #0f6cbd' : '2px solid transparent',
                  cursor: 'pointer',
                  borderRadius: '0',
                  transition: 'color 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'inventory') e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'inventory') e.currentTarget.style.color = '#adadad';
                }}
              >
                <Package size={15} color={activeTab === 'inventory' ? '#0f6cbd' : 'currentColor'} />
                <span>{t.nav.inventory}</span>
              </button>
            )}

            {(role === 'director' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('users')}
                style={{
                  height: '52px',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'users' ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'users' ? '#ffffff' : '#adadad',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'users' ? '2px solid #0f6cbd' : '2px solid transparent',
                  cursor: 'pointer',
                  borderRadius: '0',
                  transition: 'color 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'users') e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'users') e.currentTarget.style.color = '#adadad';
                }}
              >
                <Users size={15} color={activeTab === 'users' ? '#0f6cbd' : 'currentColor'} />
                <span>{t.nav?.users || 'Staff & Roles'}</span>
              </button>
            )}

            {/* Microsoft Fluent "+ New Request" Primary Button */}
            {onOpenNewTicket && (
              <div style={{ marginLeft: '12px' }}>
                <button
                  onClick={onOpenNewTicket}
                  className="fluent-btn-primary"
                  style={{
                    height: '30px',
                    padding: '0 12px',
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
                gap: '4px',
                background: '#202020',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #383838'
              }}
            >
              <Globe size={13} color="#adadad" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#f3f2f1',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0
                }}
              >
                <option value="kk" style={{ background: '#252525' }}>ҚАЗ</option>
                <option value="ru" style={{ background: '#252525' }}>РУС</option>
                <option value="en" style={{ background: '#252525' }}>ENG</option>
              </select>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
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
                  background: isNotificationOpen ? '#333333' : 'transparent',
                  border: '1px solid transparent',
                  borderRadius: '4px',
                  color: isNotificationOpen ? '#ffffff' : '#adadad',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#333333')}
                onMouseLeave={(e) => {
                  if (!isNotificationOpen) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: '#d13438',
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
                      border: '1px solid #252525'
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

            {/* Azure Database Status Pill */}
            <button
              type="button"
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
                background: '#202020',
                border: '1px solid #383838',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#adadad',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4a4a4a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#383838')}
            >
              <Database size={13} color={cloudStatus === 'syncing' ? '#0f6cbd' : cloudStatus === 'offline' ? '#d83b01' : '#107c41'} />
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: cloudStatus === 'syncing' ? '#0f6cbd' : cloudStatus === 'offline' ? '#d83b01' : '#107c41'
                }}
              />
              <span className="profile-btn-text">
                {cloudStatus === 'syncing' ? 'Syncing' : cloudStatus === 'offline' ? 'Offline' : 'Connected'}
              </span>
            </button>

            {/* Authenticated User OR Guest/Parent Role Selector & Sign In/Register */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Microsoft 365 Account Avatar & Role */}
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title={`${currentUser?.name || 'User'} (${t.roles[role]})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#202020',
                    border: '1px solid #383838',
                    padding: '3px 8px 3px 4px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: role === 'director' ? '#5b5fc7' : '#0f6cbd',
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
                        background: '#107c41',
                        border: '1px solid #202020'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                    <span className="profile-btn-text" style={{ fontSize: '12px', fontWeight: '600', color: '#f3f2f1', lineHeight: 1.2 }}>
                      {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
                    </span>
                    <span className="role-logged-text" style={{ fontSize: '10px', color: '#adadad', lineHeight: 1 }}>
                      {t.roles[role]}
                    </span>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => logout()}
                  title={t.auth?.logout || 'Sign Out'}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#adadad',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#333333';
                    e.currentTarget.style.color = '#d13438';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#adadad';
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Guest / Parent Selector Pills */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#202020',
                    border: '1px solid #383838',
                    borderRadius: '4px',
                    padding: '2px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRole('guest')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '2px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: role === 'guest' ? '#ffffff' : '#adadad',
                      background: role === 'guest' ? '#0f6cbd' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
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
                      borderRadius: '2px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: role === 'parent' ? '#ffffff' : '#adadad',
                      background: role === 'parent' ? '#5b5fc7' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
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
                  style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
                >
                  <LogIn size={13} />
                  <span>{t.auth?.signIn || 'Sign In'}</span>
                </button>

                {/* Register Button */}
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="fluent-btn-primary"
                  style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
                >
                  <UserPlus size={13} />
                  <span>{t.auth?.registerWindow || 'Register'}</span>
                </button>
              </div>
            )}

            {/* Reset Demo Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset demo requests and roles to initial state?')) {
                  resetDemoData();
                }
              }}
              title="Reset Demo Data"
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#797775',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333333';
                e.currentTarget.style.color = '#adadad';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#797775';
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fluent Mobile) */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>{t.nav.dashboard}</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`mobile-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
        >
          <ClipboardList size={18} />
          <span>{t.nav.tickets}</span>
        </button>

        {(role === 'storage_manager' || role === 'facilities_manager' || role === 'director' || role === 'workerA' || role === 'admin') && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>{t.nav.inventory}</span>
          </button>
        )}

        {(role === 'director' || role === 'admin') && (
          <button
            onClick={() => setActiveTab('users')}
            className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>{t.nav?.users || 'Staff'}</span>
          </button>
        )}

        <button
          onClick={onOpenNewTicket}
          className="mobile-nav-item"
          style={{ color: '#0f6cbd' }}
        >
          <Plus size={18} />
          <span>{t.nav.newTicket}</span>
        </button>

        {isAuthenticated ? (
          <button
            onClick={onOpenProfile}
            className="mobile-nav-item"
          >
            <User size={18} />
            <span>{t.nav.profile}</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="mobile-nav-item"
            style={{ color: '#0f6cbd' }}
          >
            <LogIn size={18} />
            <span>{t.auth?.signIn || 'Sign In'}</span>
          </button>
        )}
      </nav>
    </>
  );
};
