import React, { useState, useEffect } from 'react';
import { Bell, ArrowRight, X, Volume2 } from 'lucide-react';

export const DeviceToastAlert = ({ onSelectTicket }) => {
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    const handleDeviceAlert = (e) => {
      if (e && e.detail) {
        setActiveAlert(e.detail);
      }
    };

    window.addEventListener('eduops-device-alert', handleDeviceAlert);
    return () => {
      window.removeEventListener('eduops-device-alert', handleDeviceAlert);
    };
  }, []);

  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.25)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#fff'
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8',
          flexShrink: 0
        }}
      >
        <Bell size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
            {activeAlert.title || 'EduOps Notification'}
          </span>
          <span style={{ fontSize: '10px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Volume2 size={11} /> Alert
          </span>
        </div>

        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
          {activeAlert.message}
        </p>

        {activeAlert.ticketId && onSelectTicket && (
          <button
            type="button"
            onClick={() => {
              onSelectTicket(activeAlert.ticketId);
              setActiveAlert(null);
            }}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
              color: '#a5b4fc',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View Ticket</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setActiveAlert(null)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={15} />
      </button>

      <style>{`
        @keyframes slideInToast {
          from {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
