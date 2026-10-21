import React, { useState, useEffect, useRef } from 'react';
import { XCircle, X, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../AppContext';

export const DeclineTicketModal = ({ ticket, isOpen, onClose, onDeclineSuccess }) => {
  const { t, declineTicket, currentUser, lang } = useApp();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setIsSubmitting(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !ticket) return null;

  const quickReasons = t.tickets?.quickReasons || [
    "Дубликат заявки",
    "Неверно указан кабинет / локация",
    "Вне компетенции службы",
    "Нет комплектующих / материалов",
    "Отменено по согласованию с автором"
  ];

  const handleSelectQuickReason = (qr) => {
    setReason(prev => {
      const cleanPrev = (prev || '').trim();
      if (!cleanPrev) return qr;
      if (cleanPrev.includes(qr)) return cleanPrev;
      return `${cleanPrev}. ${qr}`;
    });
    setError('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError(t.tickets?.declineReasonRequired || 'Please enter a reason for declining this request.');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await declineTicket(ticket.id, cleanReason);
      if (onDeclineSuccess) {
        onDeclineSuccess(cleanReason);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to decline ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 10, 20, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="fluent-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-dialog, #111827)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <XCircle size={22} color="#f87171" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-main)' }}>
                {t.tickets?.declineReasonTitle || 'Decline Request'}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span style={{ fontFamily: 'monospace', color: '#93c5fd' }}>#{ticket.id}</span>
                {ticket.roomNumber ? ` • ${ticket.roomNumber}` : ''}
                {ticket.teacherName ? ` • ${ticket.teacherName}` : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSubmitting ? 0.4 : 1
            }}
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ticket Item Summary */}
        <div
          style={{
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '13px'
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {t.tickets?.ticketDetails || 'Request'}:
          </div>
          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
            {ticket.itemTitle}
            {ticket.quantity ? ` (${ticket.quantity} ${ticket.unit || 'pcs'})` : ''}
          </div>
          {ticket.description && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxHeight: '48px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ticket.description}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>
              {t.tickets?.declineReasonLabel || 'Reason for decline'}{' '}
              <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>
              {t.tickets?.declineReasonPrompt || 'Please specify why this ticket is being declined. The requester will be notified of this reason.'}
            </div>

            {/* Quick Reason Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {quickReasons.map((qr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickReason(qr)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  + {qr}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                rows={4}
                placeholder={t.tickets?.declineReasonPlaceholder || 'State the reason for declining (required)...'}
                style={{
                  width: '100%',
                  background: 'var(--bg-card, rgba(0, 0, 0, 0.25))',
                  border: error ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                <AlertTriangle size={13} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="fluent-btn-secondary"
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '13px',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)'
              }}
            >
              {t.common?.cancel || 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              style={{
                height: '34px',
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: (!reason.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
                background: (!reason.trim() || isSubmitting) ? 'rgba(239, 68, 68, 0.25)' : '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                opacity: (!reason.trim() || isSubmitting) ? 0.6 : 1
              }}
            >
              <XCircle size={15} />
              <span>
                {isSubmitting
                  ? (t.common?.saving || 'Saving...')
                  : (t.tickets?.confirmDecline || 'Confirm Decline')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeclineTicketModal;
