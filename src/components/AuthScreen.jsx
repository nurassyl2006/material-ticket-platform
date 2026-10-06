import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';

const ROLE_DEFAULT_PASSWORDS = {
  teacher: 'teacher123',
  it_support: 'it123',
  cleaning: 'clean123',
  storage_manager: 'storage123',
  facilities_manager: 'facilities123',
  director: 'admin123',
  engineer: 'engineer123'
};

export const AuthScreen = () => {
  const { lang, setLang, t, login, users } = useApp();
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('role'); // 'role' | 'direct'
  const [directEmail, setDirectEmail] = useState('');
  const [directPassword, setDirectPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  const passwordInputRef = useRef(null);

  const roleAccounts = [
    {
      id: 'teacher',
      title: t.roles.teacher,
      dept: users.teacher?.department || 'Mathematics & STEM',
      user: users.teacher?.name || t.roles.teacher,
      email: users.teacher?.email || 'teacher@school.edu',
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
      email: users.it_support?.email || 'it.support@school.edu',
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
      email: users.cleaning?.email || 'cleaning@school.edu',
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
      email: users.engineer?.email || 'engineer@school.edu',
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
      email: users.storage_manager?.email || 'storage@school.edu',
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
      email: users.facilities_manager?.email || 'facilities@school.edu',
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
      email: users.director?.email || 'director@school.edu',
      icon: Crown,
      color: '#e879f9',
      badgeBg: 'rgba(232, 121, 249, 0.15)',
      description: t.auth.directorDesc,
      scope: 'Full administrative access across all school operations & analytics'
    }
  ];

  const activeAccount = roleAccounts.find(r => r.id === selectedRole) || roleAccounts[0];

  // Auto focus password input when role changes
  useEffect(() => {
    if (activeTab === 'role' && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [selectedRole, activeTab]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleRoleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setErrorMessage(t.auth.enterPassword || 'Please enter password');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await login({
        roleKey: selectedRole,
        password: password
      });
    } catch (err) {
      const msg = err.message?.toLowerCase().includes('password')
        ? (t.auth.invalidPassword || 'Incorrect password. Please try again.')
        : (err.message || 'Authorization failed');
      setErrorMessage(msg);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectLogin = async (e) => {
    if (e) e.preventDefault();
    if (!directEmail.trim()) {
      setErrorMessage('Please enter email or username');
      triggerShake();
      return;
    }
    if (!directPassword) {
      setErrorMessage(t.auth.enterPassword || 'Please enter password');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await login({
        identifier: directEmail.trim(),
        password: directPassword
      });
    } catch (err) {
      const msg = err.message?.toLowerCase().includes('password')
        ? (t.auth.invalidPassword || 'Incorrect password. Please try again.')
        : (err.message || 'Authorization failed');
      setErrorMessage(msg);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickPassword = (roleKey) => {
    const pwd = ROLE_DEFAULT_PASSWORDS[roleKey] || 'school123';
    setPassword(pwd);
    setErrorMessage('');
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  const selectRoleAndFill = (account) => {
    setSelectedRole(account.id);
    setActiveTab('role');
    const pwd = ROLE_DEFAULT_PASSWORDS[account.id] || 'school123';
    setPassword(pwd);
    setErrorMessage('');
    setShowDemoDrawer(false);
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 16px 48px',
      position: 'relative',
      background: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 70%, #030712 100%)'
    }}>
      {/* Background ambient glow circles */}
      <div style={{
        position: 'fixed',
        top: '5%',
        left: '15%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '8%',
        right: '15%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
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
        gap: '8px',
        background: 'rgba(30, 41, 59, 0.8)',
        padding: '6px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
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
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="kk" style={{ background: '#1e293b' }}>Қазақша (KK)</option>
          <option value="ru" style={{ background: '#1e293b' }}>Русский (RU)</option>
          <option value="en" style={{ background: '#1e293b' }}>English (EN)</option>
        </select>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '960px',
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
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
            marginBottom: '12px',
            animation: 'pulse 3s infinite ease-in-out'
          }}>
            <ShieldCheck size={34} color="#ffffff" />
          </div>

          <h1 style={{
            fontSize: '30px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
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
            {t.auth.loginTitle || 'School Staff Authorization & Access Control'}
          </p>
        </div>

        {/* Tab Switcher: Role Cards vs Direct Email */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('role'); setErrorMessage(''); }}
            style={{
              padding: '8px 20px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'role' ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : 'transparent',
              color: activeTab === 'role' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            {t.auth.selectRoleTab || 'Quick Staff Sign-In'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('direct'); setErrorMessage(''); }}
            style={{
              padding: '8px 20px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'direct' ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : 'transparent',
              color: activeTab === 'direct' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            {t.auth.directLoginTab || 'Email / Direct Login'}
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: '600',
            animation: shake ? 'shake 0.4s ease' : 'fadeIn 0.2s ease'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Role-Based Sign In */}
        {activeTab === 'role' && (
          <>
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
                    onClick={() => {
                      setSelectedRole(account.id);
                      setErrorMessage('');
                    }}
                    className="glass-panel"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${account.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? `${account.color}18` : 'rgba(30, 41, 59, 0.5)',
                      boxShadow: isSelected ? `0 8px 24px ${account.color}30` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: account.badgeBg,
                        border: `1px solid ${account.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: account.color
                      }}>
                        <Icon size={20} />
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
                      <div style={{ fontSize: '12px', color: account.color, fontWeight: '700' }}>
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
                      minHeight: '30px'
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
                      <span>{account.scope}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Password Authorization Card */}
            <form
              onSubmit={handleRoleLogin}
              className="glass-panel"
              style={{
                width: '100%',
                padding: '22px 28px',
                borderRadius: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: `1.5px solid ${activeAccount.color}60`,
                boxShadow: `0 12px 36px ${activeAccount.color}20`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* Active user header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${activeAccount.color}, #6366f1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '18px',
                    boxShadow: `0 4px 16px ${activeAccount.color}50`
                  }}>
                    {activeAccount.user.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t.auth.loggedAs} <strong style={{ color: activeAccount.color }}>{activeAccount.title}</strong>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                      {activeAccount.user}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {activeAccount.email} • {activeAccount.dept}
                    </div>
                  </div>
                </div>

                {/* Quick Demo Fill Pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <KeyRound size={13} color={activeAccount.color} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {t.auth.demoDefaultPwd || 'Default password:'}{' '}
                    <code style={{ color: activeAccount.color, fontWeight: '700', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                      {ROLE_DEFAULT_PASSWORDS[selectedRole] || 'school123'}
                    </code>
                  </span>
                  <button
                    type="button"
                    onClick={() => fillQuickPassword(selectedRole)}
                    style={{
                      background: `${activeAccount.color}25`,
                      color: activeAccount.color,
                      border: `1px solid ${activeAccount.color}60`,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {t.auth.quickFill || 'Fill'}
                  </button>
                </div>
              </div>

              {/* Password Input & Submit */}
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  flex: 1,
                  minWidth: '240px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder={t.auth.enterPassword || 'Enter password'}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 42px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: errorMessage ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: `linear-gradient(135deg, ${activeAccount.color}, #6366f1)`,
                    color: '#fff',
                    border: 'none',
                    padding: '14px 30px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: isLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: `0 4px 20px ${activeAccount.color}60`,
                    transition: 'transform 0.15s ease, opacity 0.2s',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                      <span>{t.auth.authenticating || 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.auth.enterPortal}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* TAB 2: Direct Email & Password Sign In */}
        {activeTab === 'direct' && (
          <form
            onSubmit={handleDirectLogin}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '30px 28px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
                {t.auth.signIn || 'Sign In to EduOps'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Enter your school email (e.g., teacher@school.edu) and password
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.auth.emailOrUsername || 'Email or Username'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={directEmail}
                  onChange={(e) => {
                    setDirectEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g., teacher@school.edu"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.auth.password || 'Password'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={directPassword}
                  onChange={(e) => {
                    setDirectPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={t.auth.enterPassword || 'Enter your password'}
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: errorMessage ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
                marginTop: '6px'
              }}
            >
              {isLoading ? (t.auth.authenticating || 'Verifying...') : (t.auth.signIn || 'Sign In')}
            </button>
          </form>
        )}

        {/* Expandable Demo Credentials Reference Drawer */}
        <div style={{
          width: '100%',
          maxWidth: '840px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <button
            type="button"
            onClick={() => setShowDemoDrawer(!showDemoDrawer)}
            style={{
              width: '100%',
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={14} color="#38bdf8" />
              <span>{t.auth.demoCredentials || 'Quick Reference: All Staff Demo Credentials'}</span>
            </div>
            {showDemoDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDemoDrawer && (
            <div style={{
              padding: '14px 18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px'
            }}>
              {roleAccounts.map(acc => (
                <div
                  key={acc.id}
                  onClick={() => selectRoleAndFill(acc)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.7)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)'}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: acc.color }}>
                      {acc.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Password: <code style={{ color: '#fff' }}>{ROLE_DEFAULT_PASSWORDS[acc.id]}</code>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    Select
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & RBAC notice */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          🔒 Passwords encrypted with Scrypt & Salt. Role-Based Access Control (RBAC) enforced across tickets & inventory.
        </div>
      </div>
    </div>
  );
};
