import React, { useState } from 'react';
import { 
  Library, Lock, User, Eye, EyeOff, AlertCircle, 
  ShieldCheck, ArrowRight 
} from 'lucide-react';
import { playSound } from '../utils/sound';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLoginSuccess(username.trim(), password);
      playSound('checkout');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
      playSound('alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      {/* Background ambient lighting */}
      <div className="login-ambient-glow" />

      {/* Main Authentication Card */}
      <div className="login-card">
        {/* Card Header & Brand */}
        <div className="login-header">
          <div className="login-window-dots">
            <span className="window-dot dot-red"></span>
            <span className="window-dot dot-yellow"></span>
            <span className="window-dot dot-green"></span>
          </div>

          <div className="login-brand-icon">
            <Library size={32} />
          </div>

          <h1 className="login-title">Athenaeum Library</h1>
          <p className="login-subtitle">
            Restricted Staff & Circulation Terminal
          </p>

          <div className="login-network-pill">
            <span className="status-dot-pulse"></span>
            <span>Online • Port 5002 • Protected Access</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error-banner animate-fade-in">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">
              Username
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-leading-icon" />
              <input
                id="login-username"
                type="text"
                className="input-field"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-leading-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-trailing-action"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner">Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="login-security-notice" style={{
          marginTop: '1.25rem',
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <ShieldCheck size={18} style={{ flexShrink: 0, color: '#34d399' }} />
          <span>Restricted terminal. Access is strictly authorized for library administration only.</span>
        </div>

        {/* Security Footer */}
        <div className="login-footer">
          <ShieldCheck size={14} style={{ opacity: 0.6 }} />
          <span>Local SQLite database with scrypt password encryption</span>
        </div>
      </div>
    </div>
  );
}
