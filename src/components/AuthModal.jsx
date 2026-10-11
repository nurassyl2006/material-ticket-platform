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
  GraduationCap
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
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
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
        className={`glass-panel ${shake ? 'shake-animation' : ''}`}
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          padding: '32px 28px',
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)',
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
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: activeTab === 'signin'
              ? 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: activeTab === 'signin' ? '0 8px 24px rgba(99, 102, 241, 0.4)' : '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}>
            {activeTab === 'signin' ? <Lock size={24} color="#ffffff" /> : <UserPlus size={24} color="#ffffff" />}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 6px 0' }}>
            {activeTab === 'signin' 
              ? (lang === 'ru' ? 'Вход в систему школы' : lang === 'kk' ? 'Мектеп жүйесіне кіру' : 'Sign In to Portal')
              : (lang === 'ru' ? 'Регистрация аккаунта' : lang === 'kk' ? 'Тіркелгі жасау' : 'Create Account')}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {activeTab === 'signin'
              ? (lang === 'ru' ? 'Введите логин сотрудника или зарегистрированного пользователя' : lang === 'kk' ? 'Тіркелген деректеріңіз арқылы кіріңіз' : 'Enter credentials to access full school operations')
              : (lang === 'ru' ? 'Создайте учетную запись для подачи и контроля заявок' : lang === 'kk' ? 'Өтінімдерді басқару үшін тіркеліңіз' : 'Register to submit & monitor campus requests')}
          </p>
        </div>

        {/* Tab Switcher: Sign In (Login Window) vs Sign Up (Registration Window) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            style={{
              padding: '9px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'signin' ? '#fff' : 'var(--text-muted)',
              background: activeTab === 'signin' ? 'var(--primary)' : 'transparent',
              boxShadow: activeTab === 'signin' ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Lock size={14} />
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
              padding: '9px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'signup' ? '#fff' : 'var(--text-muted)',
              background: activeTab === 'signup' ? 'var(--primary)' : 'transparent',
              boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={14} />
            {lang === 'ru' ? 'Регистрация' : lang === 'kk' ? 'Тіркелу' : 'Sign Up'}
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
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
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
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

        {/* SIGN IN FORM (LOGIN WINDOW) */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                {lang === 'ru' ? 'Email или логин' : lang === 'kk' ? 'Email немесе логин' : 'Email or Staff Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="e.g. director@school.edu"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {lang === 'ru' ? 'Пароль' : lang === 'kk' ? 'Құпия сөз' : 'Password'}
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
              }}
            >
              <span>{isLoading ? (lang === 'ru' ? 'Вход...' : lang === 'kk' ? 'Кіруде...' : 'Signing In...') : (lang === 'ru' ? 'Войти в систему' : lang === 'kk' ? 'Жүйеге кіру' : 'Sign In')}</span>
              <ArrowRight size={15} />
            </button>

            {/* Quick Demo Helper */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8' }}>
                  👑 Director Demo Account:
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  director@school.edu / admin123
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDirector}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Auto-fill
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM (REGISTRATION WINDOW) */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                {lang === 'ru' ? 'Полное имя (ФИО)' : lang === 'kk' ? 'Толық аты-жөніңіз' : 'Full Name *'}
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aigul Nurlan"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                {lang === 'ru' ? 'Email или логин' : lang === 'kk' ? 'Email немесе логин' : 'Email or Staff Username *'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. aigul@school.edu"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
                {lang === 'ru' ? 'Кафедра / Отдел / Статус' : lang === 'kk' ? 'Бөлім / Мәртебе' : 'Department or Affiliation'}
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. STEM, Languages, General"
                  value={signUpDepartment}
                  onChange={(e) => setSignUpDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
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
                      padding: '10px 34px 10px 10px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showSignUpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>
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
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              gap: '6px',
              fontSize: '11px',
              color: '#818cf8',
              lineHeight: 1.3
            }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
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
              style={{
                marginTop: '4px',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>{isLoading ? (lang === 'ru' ? 'Регистрация...' : lang === 'kk' ? 'Тіркелуде...' : 'Creating...') : (lang === 'ru' ? 'Зарегистрироваться' : lang === 'kk' ? 'Тіркелу' : 'Create Account')}</span>
              <UserPlus size={15} />
            </button>
          </form>
        )}

        {/* UNREGISTERED GUEST & PARENT SECTION */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.6px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {lang === 'ru' ? 'Или продолжить без регистрации:' : lang === 'kk' ? 'Немесе тіркелусіз жалғастыру:' : 'Or continue without registering:'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Continue as Guest */}
            <button
              type="button"
              onClick={handleContinueAsGuest}
              style={{
                padding: '12px 10px',
                borderRadius: '14px',
                background: (!isAuthenticated && role === 'guest') 
                  ? 'rgba(6, 182, 212, 0.2)' 
                  : 'rgba(30, 41, 59, 0.7)',
                border: (!isAuthenticated && role === 'guest') 
                  ? '2px solid #06b6d4' 
                  : '1px solid var(--border-color)',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '8px', 
                  background: 'rgba(6, 182, 212, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#38bdf8' 
                }}>
                  <Compass size={15} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#e2e8f0' }}>
                  {t.auth?.continueAsGuest || 'Guest / Visitor'}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {lang === 'ru' ? 'Для гостей школы и посетителей' : lang === 'kk' ? 'Мектеп келушілері мен қонақтарына' : 'Campus visitors & general inquiries'}
              </span>
            </button>

            {/* Continue as Parent */}
            <button
              type="button"
              onClick={handleContinueAsParent}
              style={{
                padding: '12px 10px',
                borderRadius: '14px',
                background: (!isAuthenticated && role === 'parent') 
                  ? 'rgba(168, 85, 247, 0.2)' 
                  : 'rgba(30, 41, 59, 0.7)',
                border: (!isAuthenticated && role === 'parent') 
                  ? '2px solid #a855f7' 
                  : '1px solid var(--border-color)',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '8px', 
                  background: 'rgba(168, 85, 247, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#c084fc' 
                }}>
                  <Users size={15} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#e2e8f0' }}>
                  {t.auth?.continueAsParent || 'Parent'}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {lang === 'ru' ? 'Для родителей учеников' : lang === 'kk' ? 'Оқушылардың ата-аналары үшін' : 'Submit classroom & child safety tickets'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
