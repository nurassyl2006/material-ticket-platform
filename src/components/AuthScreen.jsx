import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  ShieldCheck, 
  GraduationCap, 
  Laptop, 
  Sparkles, 
  Package, 
  Truck, 
  Wrench, 
  Crown, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Lock,
  Layers,
  Sparkle
} from 'lucide-react';

export const AuthScreen = () => {
  const { lang, setLang, t, login, users } = useApp();
  const [selectedRole, setSelectedRole] = useState('teacher');

  const roleAccounts = [
    {
      id: 'teacher',
      title: t.roles.teacher,
      dept: users.teacher?.department || 'Mathematics & STEM',
      user: users.teacher?.name || t.roles.teacher,
      icon: GraduationCap,
      color: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      description: t.auth.teacherDesc,
      scope: 'Creates tickets across all departments, tracks own requests'
    },
    {
      id: 'it_support',
      title: t.roles.it_support,
      dept: users.it_support?.department || 'IT Operations',
      user: users.it_support?.name || t.roles.it_support,
      icon: Laptop,
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      description: t.auth.itDesc,
      scope: 'Sees & troubleshoots ONLY IT tickets (Wi-Fi, laptops, projectors)'
    },
    {
      id: 'cleaning',
      title: t.roles.cleaning,
      dept: users.cleaning?.department || 'Campus Hygiene',
      user: users.cleaning?.name || t.roles.cleaning,
      icon: Sparkles,
      color: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.15)',
      description: t.auth.cleaningDesc,
      scope: 'Sees & cleans ONLY cleaning tickets (spills, sanitation)'
    },
    {
      id: 'engineer',
      title: t.roles.engineer,
      dept: users.engineer?.department || 'Engineering & Utilities',
      user: users.engineer?.name || t.roles.engineer,
      icon: Wrench,
      color: '#f97316',
      badgeBg: 'rgba(249, 115, 22, 0.15)',
      description: t.auth.engineerDesc,
      scope: 'Sees & repairs ONLY engineering tickets (lights, AC, electrical)'
    },
    {
      id: 'storage_manager',
      title: t.roles.storage_manager,
      dept: users.storage_manager?.department || 'Warehouse & Supplies',
      user: users.storage_manager?.name || t.roles.storage_manager,
      icon: Package,
      color: '#fbbf24',
      badgeBg: 'rgba(251, 191, 36, 0.15)',
      description: t.auth.storageDesc,
      scope: 'Storage tickets, warehouse inventory stock & procurement'
    },
    {
      id: 'facilities_manager',
      title: t.roles.facilities_manager,
      dept: users.facilities_manager?.department || 'Facilities & Logistics',
      user: users.facilities_manager?.name || t.roles.facilities_manager,
      icon: Truck,
      color: '#a78bfa',
      badgeBg: 'rgba(167, 139, 250, 0.15)',
      description: t.auth.facilitiesDesc,
      scope: 'Furniture moving, facility repairs & campus inventory'
    },
    {
      id: 'director',
      title: t.roles.director,
      dept: users.director?.department || 'School Directorate',
      user: users.director?.name || t.roles.director,
      icon: Crown,
      color: '#e879f9',
      badgeBg: 'rgba(232, 121, 249, 0.15)',
      description: t.auth.directorDesc,
      scope: 'Full administrative access across all school operations & analytics'
    }
  ];

  const handleLogin = (roleId) => {
    login(roleId);
  };

  const activeAccount = roleAccounts.find(r => r.id === selectedRole) || roleAccounts[0];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px 40px',
      position: 'relative'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '10%',
        right: '20%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Language Selector Top Right */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(30, 41, 59, 0.75)',
        padding: '6px 12px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)'
      }}>
        <Globe size={15} color="var(--secondary)" />
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
          <option value="kk">Қазақша (KK)</option>
          <option value="ru">Русский (RU)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '920px',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            padding: '14px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            marginBottom: '14px'
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(90deg, #ffffff, #cbd5e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 6px 0'
          }}>
            {t.appName}
          </h1>

          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            maxWidth: '560px',
            margin: 0,
            lineHeight: 1.5
          }}>
            {t.auth.selectRole}
          </p>
        </div>

        {/* Roles Grid Selection */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>
          {roleAccounts.map(account => {
            const Icon = account.icon;
            const isSelected = selectedRole === account.id;

            return (
              <div
                key={account.id}
                onClick={() => setSelectedRole(account.id)}
                className="glass-panel"
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${account.color}` : '1px solid var(--border-color)',
                  background: isSelected ? `${account.color}15` : 'rgba(30, 41, 59, 0.45)',
                  boxShadow: isSelected ? `0 8px 24px ${account.color}25` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: account.badgeBg,
                    border: `1px solid ${account.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: account.color
                  }}>
                    <Icon size={22} />
                  </div>

                  {isSelected && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: account.color,
                      color: '#000',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}>
                      <CheckCircle2 size={12} /> Selected
                    </span>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 2px 0' }}>
                    {account.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: account.color, fontWeight: '600' }}>
                    {account.user}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {account.dept}
                  </div>
                </div>

                <p style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  margin: 0,
                  lineHeight: 1.4,
                  minHeight: '32px'
                }}>
                  {account.description}
                </p>

                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '8px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Lock size={11} color={account.color} />
                  <span>Access: {account.scope}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enter Button Action Bar */}
        <div className="glass-panel" style={{
          width: '100%',
          padding: '20px 24px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: `1px solid ${activeAccount.color}60`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${activeAccount.color}, #6366f1)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '18px'
            }}>
              {activeAccount.user.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {t.auth.loggedAs} <strong style={{ color: activeAccount.color }}>{activeAccount.title}</strong>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                {activeAccount.user}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {activeAccount.dept}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleLogin(selectedRole)}
            style={{
              background: `linear-gradient(135deg, ${activeAccount.color}, #6366f1)`,
              color: '#fff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 4px 18px ${activeAccount.color}50`,
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {t.auth.enterPortal} <ArrowRight size={16} />
          </button>
        </div>

        {/* Security / Privacy notice */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          🔒 Role-Based Access Control (RBAC) enforced. Workers only view tasks assigned to their respective departments.
        </div>
      </div>
    </div>
  );
};
