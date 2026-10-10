import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  Package, 
  ShoppingBag, 
  CheckCircle2, 
  Wrench, 
  Sparkles, 
  Laptop, 
  Truck, 
  X, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Send,
  MessageCircle
} from 'lucide-react';
import { TelegramNotificationModal } from './TelegramNotificationModal';

export const NotificationDropdown = ({ isOpen, onClose, onSelectTicket }) => {
  const { 
    t, 
    lang,
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications,
    devicePermission,
    enableDeviceNotifications,
    sendDeviceNotification,
    playNotificationSound
  } = useApp();

  const dropdownRef = useRef(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('app_notification_sound_muted') === 'true');
  const [testSent, setTestSent] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const toggleSound = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('app_notification_sound_muted', String(next));
      if (!next) {
        playNotificationSound();
      }
      return next;
    });
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    await sendDeviceNotification({
      title: '🔔 EduOps Test Alert',
      message: 'Device push notifications and audio alerts are working properly!',
      tag: 'test-alert'
    });
    setTimeout(() => setTestSent(false), 2000);
  };

  if (!isOpen) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return <Clock size={16} color="#38bdf8" />;
      case 'issued':
        return <Package size={16} color="var(--success)" />;
      case 'purchasing':
        return <ShoppingBag size={16} color="#fbbf24" />;
      case 'completed':
        return <CheckCircle2 size={16} color="#34d399" />;
      default:
        return <Bell size={16} color="var(--primary)" />;
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: '0',
        width: '380px',
        maxWidth: '92vw',
        maxHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '18px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 23, 42, 0.96)'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--primary)" />
          <strong style={{ fontSize: '14px', color: '#fff' }}>{t.notifications?.title || 'Notifications'}</strong>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mute / Unmute Chime */}
          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Unmute alert sound' : 'Mute alert sound'}
            style={{
              background: 'transparent',
              border: 'none',
              color: isMuted ? 'var(--text-muted)' : '#818cf8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              title={t.notifications?.markAllRead || 'Mark all as read'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <CheckCheck size={13} /> {t.notifications?.markAllRead || 'Mark all read'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Device Notifications Enable Banner */}
      <div style={{
        padding: '10px 16px',
        background: devicePermission === 'granted' 
          ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)' 
          : 'linear-gradient(90deg, rgba(99, 102, 241, 0.16) 0%, rgba(168, 85, 247, 0.12) 100%)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={15} color={devicePermission === 'granted' ? '#34d399' : '#818cf8'} />
          <div style={{ fontSize: '11px', lineHeight: 1.2 }}>
            <div style={{ fontWeight: '700', color: '#fff' }}>
              {devicePermission === 'granted'
                ? (lang === 'ru' ? 'Уведомления на устройстве активны' : lang === 'kk' ? 'Құрылғы хабарландырулары белсенді' : 'Device Push Active')
                : (lang === 'ru' ? 'Уведомления на устройство' : lang === 'kk' ? 'Құрылғыға хабарландырулар' : 'Device Push Alerts')}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              {devicePermission === 'granted'
                ? (lang === 'ru' ? 'Получайте пуш-алерты даже в фоне' : lang === 'kk' ? 'Фондық режимде де пуш келеді' : 'Popups & sounds delivered to this device')
                : (lang === 'ru' ? 'Включите пуши для телефона и ПК' : lang === 'kk' ? 'Телефон мен компьютерге пуш қосыңыз' : 'Allow notifications for phone & laptop')}
            </div>
          </div>
        </div>

        {devicePermission === 'granted' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleTestNotification}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Send size={11} />
              <span>{testSent ? 'Sent!' : 'Test'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTelegramModal(true)}
              title="Configure Telegram Phone Alerts"
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <MessageCircle size={12} />
              <span>TG</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => enableDeviceNotifications()}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
              }}
            >
              {lang === 'ru' ? 'Включить' : lang === 'kk' ? 'Қосу' : 'Enable'}
            </button>
            <button
              type="button"
              onClick={() => setShowTelegramModal(true)}
              title="Configure Telegram Phone Alerts"
              style={{
                padding: '5px 8px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <MessageCircle size={12} />
              <span>TG</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '36px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bell size={28} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '13px' }}>{t.notifications?.empty || 'No notifications yet'}</span>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationAsRead(notif.id);
                if (onSelectTicket && notif.ticketId) {
                  onSelectTicket(notif.ticketId);
                  onClose();
                }
              }}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getStatusIcon(notif.status)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: notif.read ? '#cbd5e1' : '#fff' }}>
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                      marginTop: '4px'
                    }} />
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 5px 0', lineHeight: 1.4 }}>
                  {notif.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b' }}>
                  <span>{notif.ticketId}</span>
                  <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <button
            onClick={clearNotifications}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Clear History
          </button>
        </div>
      )}

      {/* Telegram Mobile Alerts Modal */}
      <TelegramNotificationModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        lang={lang}
      />
    </div>
  );
};
