import React from 'react';
import { useApp } from '../AppContext';
import { Globe, UserCheck, Package, ClipboardList, LayoutDashboard, User } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const { lang, setLang, role, setRole, t, currentUser } = useApp();

  return (
    <>
      {/* Desktop Header Navigation */}
      <header className="glass-panel main-navbar" style={{ borderRadius: '0 0 20px 20px', padding: '16px 24px', marginBottom: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Package size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(90deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.appName}
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.4)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '8px 16px',
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
              <LayoutDashboard size={16} />
              {t.nav.dashboard}
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                padding: '8px 16px',
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
              <ClipboardList size={16} />
              {t.nav.tickets}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                padding: '8px 16px',
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
              <Package size={16} />
              {t.nav.inventory}
            </button>
          </nav>

          {/* Right Section: Language Switcher, User Role & Profile Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Language Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.8)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <Globe size={16} color="var(--secondary)" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="kk">Қаз (KK)</option>
                <option value="ru">Рус (RU)</option>
                <option value="en">Eng (EN)</option>
              </select>
            </div>

            {/* Role Switcher Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.15)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <UserCheck size={16} color="var(--primary)" />
              <span className="role-logged-text" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.auth.loggedAs}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <option value="teacher" style={{ background: '#1e293b', color: '#fff' }}>{t.roles.teacher}</option>
                <option value="workerA" style={{ background: '#1e293b', color: '#fff' }}>{t.roles.workerA}</option>
                <option value="admin" style={{ background: '#1e293b', color: '#fff' }}>{t.roles.admin}</option>
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
                padding: '6px 12px',
                borderRadius: '12px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={t.nav.profile}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
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
              <span className="profile-btn-text" style={{ fontSize: '13px', fontWeight: '600' }}>
                {currentUser?.name ? currentUser.name.split(' ')[0] : t.nav.profile}
              </span>
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
          <LayoutDashboard size={20} />
          <span>{t.nav.dashboard}</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`mobile-nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
        >
          <ClipboardList size={20} />
          <span>{t.nav.tickets}</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
        >
          <Package size={20} />
          <span>{t.nav.inventory}</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="mobile-nav-item"
        >
          <User size={20} />
          <span>{t.nav.profile}</span>
        </button>
      </nav>
    </>
  );
};
