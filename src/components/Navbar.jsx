import React from 'react';
import { useApp } from '../AppContext';
import { Globe, UserCheck, Package, ClipboardList, LayoutDashboard, User, PlusCircle, RotateCcw } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenProfile, onOpenNewTicket }) => {
  const { lang, setLang, role, setRole, t, currentUser, resetDemoData } = useApp();

  return (
    <>
      {/* Desktop Header Navigation */}
      <header className="glass-panel main-navbar" style={{ borderRadius: '0 0 20px 20px', padding: '14px 24px', marginBottom: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Package size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', background: 'linear-gradient(90deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                {t.appName}
              </h1>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.4)', padding: '5px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
                background: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent',
                boxShadow: activeTab === 'dashboard' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                cursor: 'pointer'
              }}
            >
              <LayoutDashboard size={15} />
              {t.nav.dashboard}
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: activeTab === 'tickets' ? '#ffffff' : 'var(--text-muted)',
                background: activeTab === 'tickets' ? 'var(--primary)' : 'transparent',
                boxShadow: activeTab === 'tickets' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                cursor: 'pointer'
              }}
            >
              <ClipboardList size={15} />
              {t.nav.tickets}
            </button>

            {(role === 'storage_manager' || role === 'facilities_manager' || role === 'director' || role === 'engineer' || role === 'workerA' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('inventory')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'inventory' ? '#ffffff' : 'var(--text-muted)',
                  background: activeTab === 'inventory' ? 'var(--primary)' : 'transparent',
                  boxShadow: activeTab === 'inventory' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <Package size={15} />
                {t.nav.inventory}
              </button>
            )}

            {onOpenNewTicket && (
              <button
                onClick={onOpenNewTicket}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 2px 10px rgba(6, 182, 212, 0.3)',
                  cursor: 'pointer',
                  border: 'none',
                  marginLeft: '4px'
                }}
              >
                <PlusCircle size={15} />
                {t.nav.newTicket}
              </button>
            )}
          </nav>

          {/* Right Section: Language Switcher, User Role, Profile Button, Reset Demo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Language Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(30, 41, 59, 0.8)', padding: '5px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <Globe size={15} color="var(--secondary)" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="kk">Қаз (KK)</option>
                <option value="ru">Рус (RU)</option>
                <option value="en">Eng (EN)</option>
              </select>
            </div>

            {/* Role Switcher Pill - All 6 Platform Roles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', padding: '5px 12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
              <UserCheck size={15} color="var(--primary)" />
              <span className="role-logged-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.auth.loggedAs}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#818cf8',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <option value="teacher" style={{ background: '#1e293b', color: '#fff' }}>👩‍🏫 {t.roles.teacher}</option>
                <option value="it_support" style={{ background: '#1e293b', color: '#fff' }}>💻 {t.roles.it_support}</option>
                <option value="cleaning" style={{ background: '#1e293b', color: '#fff' }}>🧹 {t.roles.cleaning}</option>
                <option value="storage_manager" style={{ background: '#1e293b', color: '#fff' }}>📦 {t.roles.storage_manager}</option>
                <option value="facilities_manager" style={{ background: '#1e293b', color: '#fff' }}>🚚 {t.roles.facilities_manager}</option>
                <option value="engineer" style={{ background: '#1e293b', color: '#fff' }}>🔧 {t.roles.engineer}</option>
                <option value="director" style={{ background: '#1e293b', color: '#fff' }}>👔 {t.roles.director}</option>
              </select>
            </div>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                padding: '5px 10px',
                borderRadius: '10px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={t.nav.profile}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                color: '#fff',
                overflow: 'hidden'
              }}>
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.name ? currentUser.name.charAt(0) : 'U'
                )}
              </div>
              <span className="profile-btn-text" style={{ fontSize: '12px', fontWeight: '600' }}>
                {currentUser?.name ? currentUser.name.split(' ')[0] : t.nav.profile}
              </span>
            </button>

            {/* Reset Demo Data button */}
            <button
              onClick={() => {
                if (window.confirm('Reset demo requests and roles to initial state?')) {
                  resetDemoData();
                }
              }}
              title="Reset Demo Data"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                padding: '6px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RotateCcw size={14} />
            </button>

          </div>

        </div>
      </header>

      {/* Mobile Phone Bottom Navigation Bar */}
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

        {(role === 'storage_manager' || role === 'facilities_manager' || role === 'director' || role === 'engineer') && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>{t.nav.inventory}</span>
          </button>
        )}

        <button
          onClick={onOpenNewTicket}
          className="mobile-nav-item"
          style={{ color: 'var(--secondary)' }}
        >
          <PlusCircle size={18} />
          <span>{t.nav.newTicket}</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="mobile-nav-item"
        >
          <User size={18} />
          <span>{t.nav.profile}</span>
        </button>
      </nav>
    </>
  );
};
