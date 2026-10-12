import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Building,
  Info,
  X,
  Users,
  Compass,
  GraduationCap,
  Package
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { lang, t, login, register, role, setRole, isAuthenticated } = useApp();
  
  const [activeTab, setActiveTab] = useState(initialMode); // 'signin' | 'signup'
  
  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpDepartment, setSignUpDepartment] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, initialMode]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Quick fill helper for director test login
  const handleQuickFillDirector = () => {
    setLoginIdentifier('director@school.edu');
    setLoginPassword('admin123');
    setErrorMessage('');
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage(lang === 'ru' ? 'Введите email или логин' : lang === 'kk' ? 'Email немесе логинді енгізіңіз' : 'Please enter your email or username');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!loginPassword) {
      setErrorMessage(lang === 'ru' ? 'Введите пароль' : lang === 'kk' ? 'Құпия сөзді енгізіңіз' : 'Please enter your password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      setIsLoading(true);
      await login({
        identifier: loginIdentifier.trim(),
        password: loginPassword
      });
      setSuccessMessage(lang === 'ru' ? 'Успешный вход!' : lang === 'kk' ? 'Сәтті кірдіңіз!' : 'Signed in successfully!');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setErrorMessage(err.message || (lang === 'ru' ? 'Неверный логин или пароль' : lang === 'kk' ? 'Қате логин немесе құпия сөз' : 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signUpName.trim()) {
      setErrorMessage(lang === 'ru' ? 'Введите ваше полное имя' : lang === 'kk' ? 'Толық аты-жөніңізді енгізіңіз' : 'Please enter your full name');
      return;
    }

    if (!signUpEmail.trim()) {
      setErrorMessage(lang === 'ru' ? 'Введите email или логин' : lang === 'kk' ? 'Email немесе логинді енгізіңіз' : 'Please enter your email or username');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage(lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : lang === 'kk' ? 'Құпия сөз кемінде 6 таңбадан тұруы керек' : 'Password must be at least 6 characters');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage(lang === 'ru' ? 'Пароли не совпадают' : lang === 'kk' ? 'Құпия сөздер сәйкес келмейді' : 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const res = await register({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        department: signUpDepartment.trim() || 'General Staff',
        password: signUpPassword
      });
      setSuccessMessage(res?.message || (lang === 'ru' ? 'Регистрация успешна!' : lang === 'kk' ? 'Тіркелу сәтті аяқталды!' : 'Registration successful!'));
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    setRole('guest');
    onClose();
  };

  const handleContinueAsParent = () => {
    setRole('parent');
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`fluent-card ${shake ? 'shake-animation' : ''}`}
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '16px',
          padding: '28px 24px',
          background: 'var(--bg-dialog, #111827)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: 'var(--shadow-depth-16)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header: EduOps Brand Emblem */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 20px -2px rgba(99, 102, 241, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
              color: '#ffffff'
            }}
          >
            <Package size={22} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.2px' }}>
            {activeTab === 'signin' 
              ? (lang === 'ru' ? 'Вход в систему школы' : lang === 'kk' ? 'Мектеп жүйесіне кіру' : 'Sign in to your account')
              : (lang === 'ru' ? 'Регистрация аккаунта' : lang === 'kk' ? 'Тіркелгі жасау' : 'Create an account')}
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
            {activeTab === 'signin'
              ? (lang === 'ru' ? 'Введите логин сотрудника или зарегистрированного пользователя' : lang === 'kk' ? 'Тіркелген деректеріңіз арқылы кіріңіз' : 'Enter credentials to access full school operations')
              : (lang === 'ru' ? 'Создайте учетную запись для подачи и контроля заявок' : lang === 'kk' ? 'Өтінімдерді басқару үшін тіркеліңіз' : 'Register to submit & monitor campus requests')}
          </p>
        </div>

        {/* Tab Switcher: Modern Segmented Control */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: activeTab === 'signin' ? '600' : '500',
              cursor: 'pointer',
              color: activeTab === 'signin' ? '#ffffff' : '#94a3b8',
              background: activeTab === 'signin' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              boxShadow: activeTab === 'signin' ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Lock size={13} />
            {lang === 'ru' ? 'Вход' : lang === 'kk' ? 'Кіру' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: activeTab === 'signup' ? '600' : '500',
              cursor: 'pointer',
              color: activeTab === 'signup' ? '#ffffff' : '#94a3b8',
              background: activeTab === 'signup' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={13} />
            {lang === 'ru' ? 'Регистрация' : lang === 'kk' ? 'Тіркелу' : 'Sign Up'}
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px',
            background: 'rgba(216, 59, 1, 0.15)',
            border: '1px solid #d83b01',
            color: '#ff8a75',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px',
            background: 'rgba(16, 124, 65, 0.15)',
            border: '1px solid #107c41',
            color: '#62c789',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}
        {/* SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                {lang === 'ru' ? 'Email или логин' : lang === 'kk' ? 'Email немесе логин' : 'Email or Staff Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#8a8a8a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="e.g. director@school.edu"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '4px',
                    background: '#1f1f1f',
                    border: '1px solid #383838',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#adadad' }}>
                  {lang === 'ru' ? 'Пароль' : lang === 'kk' ? 'Құпия сөз' : 'Password'}
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#8a8a8a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 34px',
                    borderRadius: '4px',
                    background: '#1f1f1f',
                    border: '1px solid #383838',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#8a8a8a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="fluent-btn-primary"
              style={{
                marginTop: '4px',
                width: '100%',
                height: '36px',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: isLoading ? 'wait' : 'pointer'
              }}
            >
              <span>{isLoading ? (lang === 'ru' ? 'Вход...' : lang === 'kk' ? 'Кіруде...' : 'Signing In...') : (lang === 'ru' ? 'Войти в систему' : lang === 'kk' ? 'Жүйеге кіру' : 'Sign in')}</span>
              <ArrowRight size={14} />
            </button>

            {/* Quick Demo Helper */}
            <div style={{
              padding: '8px 12px',
              borderRadius: '4px',
              background: '#242424',
              border: '1px solid #383838',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginTop: '4px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#0f6cbd' }}>
                  Director Demo Account:
                </div>
                <div style={{ fontSize: '11px', color: '#adadad' }}>
                  director@school.edu / admin123
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDirector}
                className="fluent-btn-secondary"
                style={{
                  height: '24px',
                  padding: '0 8px',
                  fontSize: '11px',
                  borderRadius: '3px'
                }}
              >
                Auto-fill
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                {lang === 'ru' ? 'Полное имя (ФИО)' : lang === 'kk' ? 'Толық аты-жөніңіз' : 'Full Name *'}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#8a8a8a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aigul Nurlan"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '4px',
                    background: '#1f1f1f',
                    border: '1px solid #383838',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                {lang === 'ru' ? 'Email или логин' : lang === 'kk' ? 'Email немесе логин' : 'Email or Staff Username *'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#8a8a8a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. aigul@school.edu"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '4px',
                    background: '#1f1f1f',
                    border: '1px solid #383838',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                {lang === 'ru' ? 'Кафедра / Отдел / Статус' : lang === 'kk' ? 'Бөлім / Мәртебе' : 'Department or Affiliation'}
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={15} color="#8a8a8a" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. STEM, Languages, General"
                  value={signUpDepartment}
                  onChange={(e) => setSignUpDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '4px',
                    background: '#1f1f1f',
                    border: '1px solid #383838',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Пароль' : lang === 'kk' ? 'Құпия сөз' : 'Password *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="min. 6 chars"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 10px',
                      borderRadius: '4px',
                      background: '#1f1f1f',
                      border: '1px solid #383838',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#8a8a8a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showSignUpPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Повторите' : lang === 'kk' ? 'Қайталаңыз' : 'Confirm *'}
                </label>
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat pwd"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    background: '#1f1f1f',
                    border: '1px solid #383838',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '6px 10px',
              borderRadius: '4px',
              background: '#242424',
              border: '1px solid #383838',
              borderLeft: '3px solid #0f6cbd',
              display: 'flex',
              gap: '6px',
              fontSize: '11px',
              color: '#adadad',
              lineHeight: 1.3
            }}>
              <Info size={14} color="#0f6cbd" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                {lang === 'ru' 
                  ? 'Новые аккаунты регистрируются с доступом учителя / персонала. Специальные роли назначаются директором.' 
                  : lang === 'kk' 
                  ? 'Жаңа аккаунттар мұғалім / қызметкер ретінде тіркеледі. Арнайы рөлдерді директор тағайындайды.' 
                  : 'New accounts start with standard staff access. Elevated operational roles are assigned by the Directorate.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="fluent-btn-primary"
              style={{
                marginTop: '4px',
                width: '100%',
                height: '36px',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: isLoading ? 'wait' : 'pointer'
              }}
            >
              <span>{isLoading ? (lang === 'ru' ? 'Регистрация...' : lang === 'kk' ? 'Тіркелуде...' : 'Creating...') : (lang === 'ru' ? 'Зарегистрироваться' : lang === 'kk' ? 'Тіркелу' : 'Create account')}</span>
              <UserPlus size={14} />
            </button>
          </form>
        )}

        {/* UNREGISTERED GUEST & PARENT SECTION */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #383838' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '600', 
              color: '#8a8a8a', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px'
            }}>
              {lang === 'ru' ? 'Или продолжить без регистрации:' : lang === 'kk' ? 'Немесе тіркелусіз жалғастыру:' : 'Or continue without registering:'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Continue as Guest */}
            <button
              type="button"
              onClick={handleContinueAsGuest}
              style={{
                padding: '10px 10px',
                borderRadius: '4px',
                background: (!isAuthenticated && role === 'guest') 
                  ? 'rgba(15, 108, 189, 0.2)' 
                  : '#242424',
                border: (!isAuthenticated && role === 'guest') 
                  ? '1px solid #0f6cbd' 
                  : '1px solid #383838',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '3px', 
                  background: 'rgba(15, 108, 189, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#70b5f9' 
                }}>
                  <Compass size={13} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#f3f2f1' }}>
                  {t.auth?.continueAsGuest || 'Guest / Visitor'}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#8a8a8a', lineHeight: 1.3 }}>
                {lang === 'ru' ? 'Для гостей школы и посетителей' : lang === 'kk' ? 'Мектеп келушілері мен қонақтарына' : 'Campus visitors & general inquiries'}
              </span>
            </button>

            {/* Continue as Parent */}
            <button
              type="button"
              onClick={handleContinueAsParent}
              style={{
                padding: '10px 10px',
                borderRadius: '4px',
                background: (!isAuthenticated && role === 'parent') 
                  ? 'rgba(91, 95, 199, 0.2)' 
                  : '#242424',
                border: (!isAuthenticated && role === 'parent') 
                  ? '1px solid #5b5fc7' 
                  : '1px solid #383838',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '3px', 
                  background: 'rgba(91, 95, 199, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#c4b5fd' 
                }}>
                  <Users size={13} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#f3f2f1' }}>
                  {t.auth?.continueAsParent || 'Parent'}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#8a8a8a', lineHeight: 1.3 }}>
                {lang === 'ru' ? 'Для родителей учеников' : lang === 'kk' ? 'Оқушылардың ата-аналары үшін' : 'Submit classroom & child safety tickets'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
