import React, { useState, useEffect } from 'react';
import { 
  Library, Clock, Volume2, VolumeX, Sun, Moon, 
  Maximize2, Minimize2, Download, CheckCircle2, QrCode,
  User, LogOut, KeyRound
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/sound';

export default function AppHeader({ 
  libraryName = 'Ardingly Central Library',
  activeLoansCount = 0,
  overdueLoansCount = 0,
  currentTab,
  onOpenScanner,
  currentUser,
  onLogout,
  onOpenChangePassword
}) {
  const [timeStr, setTimeStr] = useState('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isDark, setIsDark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="app-header">
      {/* Left: Window Dots & App Brand */}
      <div className="header-left">
        <div className="window-dots">
          <div className="window-dot dot-red" title="Close"></div>
          <div className="window-dot dot-yellow" title="Minimize"></div>
          <div className="window-dot dot-green" onClick={toggleFullscreen} title="Fullscreen"></div>
        </div>

        <div className="app-brand">
          <div className="brand-icon">
            <Library size={17} />
          </div>
          <div>
            <span className="brand-title">
              Athenaeum
              <span className="brand-subtitle">v1.0 Desktop</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Clock & Real-time Status */}
      <div className="header-center">
        <div className="live-clock">
          <div className="pulse-indicator" title="Connected to local server"></div>
          <Clock size={14} style={{ opacity: 0.7 }} />
          <span>{timeStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-active" title="Active Loans">
            {activeLoansCount} Active
          </span>
          {overdueLoansCount > 0 && (
            <span className="badge badge-overdue" title="Overdue Loans Alert">
              {overdueLoansCount} Overdue
            </span>
          )}
        </div>
      </div>

      {/* Right: Controls & Desktop App Install */}
      <div className="header-right">
        {installPrompt && (
          <button 
            className="install-app-btn" 
            onClick={handleInstallPWA}
            title="Install as native laptop app"
          >
            <Download size={14} />
            <span>Install Laptop App</span>
          </button>
        )}

        <button 
          className="icon-button" 
          onClick={onOpenScanner}
          title="Open Barcode Kiosk (F2)"
        >
          <QrCode size={16} />
        </button>

        <button 
          className="icon-button" 
          onClick={toggleSound}
          title={soundOn ? 'Sound Effects Enabled' : 'Sound Muted'}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button 
          className="icon-button" 
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button 
          className="icon-button" 
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Window"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* User Identity & Logout */}
        {currentUser && (
          <div className="header-user-badge">
            <div className="header-user-info" title={`Signed in as ${currentUser.full_name || currentUser.username}`}>
              <User size={13} className="text-indigo" />
              <span className="header-user-name">{currentUser.username}</span>
              <span className="header-role-tag">{currentUser.role}</span>
            </div>

            <button 
              className="icon-button"
              onClick={onOpenChangePassword}
              title="Change Password"
            >
              <KeyRound size={15} />
            </button>

            <button 
              className="icon-button header-logout-btn"
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
