import React, { useRef, useEffect } from 'react';
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
  X
} from 'lucide-react';

export const NotificationDropdown = ({ isOpen, onClose, onSelectTicket }) => {
  const { t, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useApp();
  const dropdownRef = useRef(null);

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
        width: '360px',
        maxWidth: '92vw',
        maxHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 23, 42, 0.95)'
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
    </div>
  );
};
