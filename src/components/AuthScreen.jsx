import React, { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Building,
  KeyRound,
  Info
} from 'lucide-react';

export const AuthScreen = () => {
  const { lang, setLang, t, login, register } = useApp();
  
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  
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
      // Auth state changes in AppContext will unmount AuthScreen automatically
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
      if (res?.message) {
        setSuccessMessage(res.message);
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at 50% 15%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.95) 75%)',
      position: 'relative'
    }}>

      {/* Top Bar: Brand & Language Toggle */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: '800', fontSize: '16px', color: '#fff', letterSpacing: '-0.3px' }}>
            EduOps Portal
          </span>
        </div>

        {/* Language Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid var(--border-color)',
          padding: '6px 12px',
          borderRadius: '12px'
        }}>
          <Globe size={14} color="var(--secondary)" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="kk">Қаз (KK)</option>
            <option value="ru">Рус (RU)</option>
            <option value="en">Eng (EN)</option>
          </select>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className={`glass-panel ${shake ? 'shake-animation' : ''}`} style={{
        width: '100%',
        maxWidth: '460px',
        borderRadius: '24px',
        padding: '36px 32px',
        background: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
        backdropFilter: 'blur(20px)',
        marginTop: '40px'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
          }}>
            <Lock size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 6px 0' }}>
            {activeTab === 'signin' 
              ? (lang === 'ru' ? 'Вход в систему школы' : lang === 'kk' ? 'Мектеп жүйесіне кіру' : 'School Operations Sign In')
              : (lang === 'ru' ? 'Регистрация сотрудника' : lang === 'kk' ? 'Қызметкерді тіркеу' : 'Create Staff Account')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {activeTab === 'signin'
              ? (lang === 'ru' ? 'Войдите со своим email или логином сотрудника' : lang === 'kk' ? 'Email немесе логин арқылы кіріңіз' : 'Enter your staff credentials to access operations')
              : (lang === 'ru' ? 'Создайте учетную запись для подачи и отслеживания заявок' : lang === 'kk' ? 'Өтінімдерді беру үшін тіркелгі жасаңыз' : 'Register to submit & monitor campus requests')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '24px',
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
              transition: 'all 0.2s ease'
            }}
          >
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
              transition: 'all 0.2s ease'
            }}
          >
            {lang === 'ru' ? 'Регистрация' : lang === 'kk' ? 'Тіркелу' : 'Sign Up'}
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Электронная почта или логин' : lang === 'kk' ? 'Электронды пошта немесе логин' : 'Email or Staff Username'}
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
                    padding: '12px 14px 12px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
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
                    padding: '12px 40px 12px 38px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
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
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
                padding: '13px',
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
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.15s ease'
              }}
            >
              <span>{isLoading ? 'Authenticating...' : (lang === 'ru' ? 'Войти в портал' : lang === 'kk' ? 'Порталға кіру' : 'Sign In to Portal')}</span>
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Helper */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8' }}>
                  👑 Director Account:
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  director@school.edu / admin123
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDirector}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
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

        {/* SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Электронная почта или логин' : lang === 'kk' ? 'Электронды пошта немесе логин' : 'Email or Staff Username *'}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Кафедра / Отдел' : lang === 'kk' ? 'Бөлім / Кафедра' : 'Department'}
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Science, Languages"
                  value={signUpDepartment}
                  onChange={(e) => setSignUpDepartment(e.target.value)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {lang === 'ru' ? 'Пароль' : lang === 'kk' ? 'Құпия сөз' : 'Password *'}
                </label>
                <input
                  type="password"
                  required
                  placeholder="min. 6 chars"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {lang === 'ru' ? 'Повторите' : lang === 'kk' ? 'Қайталаңыз' : 'Confirm *'}
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat pwd"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
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

            {/* Note on Role Assignment */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              gap: '8px',
              fontSize: '11px',
              color: '#818cf8',
              lineHeight: 1.4
            }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                {lang === 'ru' 
                  ? 'Новые аккаунты регистрируются с ролью «Учитель / Персонал». Специальные роли (Инженер, IT, Склад, АХЧ, Директор) назначаются директором в панели управления.' 
                  : lang === 'kk' 
                  ? 'Жаңа тіркелгілер «Мұғалім / Қызметкер» ретінде тіркеледі. Арнайы рөлдерді (Инженер, IT, Қойма, АХЧ, Директор) директор тағайындайды.' 
                  : 'New accounts start with standard Staff/Teacher access. Elevated operational roles (Engineer, IT, Storage, Facilities, Director) are assigned by the School Directorate.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '6px',
                padding: '13px',
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
              <span>{isLoading ? 'Creating account...' : (lang === 'ru' ? 'Зарегистрироваться' : lang === 'kk' ? 'Тіркелу' : 'Create Staff Account')}</span>
              <UserPlus size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
