import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, X, ExternalLink, Smartphone, ShieldCheck, Key } from 'lucide-react';
import { getTelegramConfigApi, saveTelegramConfigApi, sendTelegramTestApi } from '../api';

export const TelegramNotificationModal = ({ isOpen, onClose, lang = 'en' }) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await getTelegramConfigApi();
      if (res) {
        setIsConfigured(Boolean(res.configured));
        if (res.chatId) setChatId(res.chatId);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await saveTelegramConfigApi({ botToken, chatId });
      if (res && res.success) {
        setIsConfigured(res.configured);
        setStatusMsg({ type: 'success', text: lang === 'ru' ? 'Настройки Telegram сохранены!' : 'Telegram configuration saved!' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setStatusMsg(null);
      const res = await sendTelegramTestApi();
      if (res && res.success) {
        setStatusMsg({ type: 'success', text: lang === 'ru' ? '✅ Тестовое уведомление успешно отправлено на телефон!' : '✅ Test notification delivered to your device via Telegram!' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send test alert. Check token and chat ID.' });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
          padding: '24px',
          color: '#f8fafc',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>
                {lang === 'ru' ? 'Уведомления на телефон (Telegram)' : lang === 'kk' ? 'Телефонға хабарландырулар (Telegram)' : 'Phone Alerts via Telegram'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                {lang === 'ru' ? 'Мгновенные пуши на экран блокировки' : 'Instant lock-screen notifications directly to your phone'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status banner */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '16px',
            background: isConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
            border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isConfigured ? (
              <CheckCircle2 size={16} color="#34d399" />
            ) : (
              <AlertCircle size={16} color="#facc15" />
            )}
            <span style={{ fontSize: '12px', fontWeight: '600', color: isConfigured ? '#34d399' : '#facc15' }}>
              {isConfigured 
                ? (lang === 'ru' ? 'Telegram бот подключен и активен' : 'Telegram Bot Connected & Active') 
                : (lang === 'ru' ? 'Telegram бот не настроен' : 'Telegram Bot Not Configured')}
            </span>
          </div>

          {isConfigured && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Send size={11} />
              <span>{testing ? 'Sending...' : 'Test Alert'}</span>
            </button>
          )}
        </div>

        {/* Message Alert */}
        {statusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '14px',
              fontSize: '12px',
              background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: statusMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Instructions */}
        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px' }}>
          <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
            {lang === 'ru' ? 'Как настроить доставку на телефон:' : 'How to set up phone alerts:'}
          </div>
          <ol style={{ margin: '0', paddingLeft: '18px' }}>
            <li>{lang === 'ru' ? 'Откройте Telegram и создайте бота через @BotFather (получите токен)' : 'Open Telegram, message @BotFather, create a bot and copy token'}</li>
            <li>{lang === 'ru' ? 'Отправьте боту любое сообщение или узнайте свой ID через @userinfobot' : 'Send any message to your bot or check your numeric ID via @userinfobot'}</li>
            <li>{lang === 'ru' ? 'Вставьте токен и ID ниже и нажмите "Сохранить"' : 'Paste Bot Token and Chat ID below and save'}</li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
              {lang === 'ru' ? 'Telegram Bot Token' : 'Telegram Bot Token'}
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="e.g. 7123456789:AAHk..._your_bot_token"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
              {lang === 'ru' ? 'Telegram Chat ID (Ваш ID или ID группы)' : 'Telegram Chat ID (Personal or Group ID)'}
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789 or -100123456789"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {lang === 'ru' ? 'Отмена' : 'Close'}
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}
            >
              {loading ? 'Saving...' : (lang === 'ru' ? 'Сохранить' : 'Save Settings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
