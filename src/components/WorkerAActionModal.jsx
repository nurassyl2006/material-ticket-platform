import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { CheckCircle2, ShoppingBag, Clock, User, Building, ShieldCheck, DollarSign, FileText, ArrowRight } from 'lucide-react';

export const WorkerAActionModal = ({ ticket, isOpen, onClose }) => {
  const { t, issueTicketFromStock, markTicketToPurchase, inventory } = useApp();
  
  const [actionType, setActionType] = useState('stock'); // 'stock' | 'purchase'
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !ticket) return null;

  // Check matching stock level
  const stockItem = inventory.find(i => i.name.toLowerCase() === ticket.itemTitle.toLowerCase());
  const availableQty = stockItem ? stockItem.quantity : 0;
  const isEnoughStock = availableQty >= ticket.quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actionType === 'stock') {
      issueTicketFromStock(ticket.id, notes);
    } else {
      markTicketToPurchase(ticket.id, cost, supplier, notes);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '28px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '10px', borderRadius: '12px' }}>
            <ShieldCheck size={24} color="var(--secondary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{t.tickets.actionWorkerA}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ticket ID: {ticket.id}</p>
          </div>
        </div>

        {/* Ticket Overview Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
            {ticket.itemTitle} x {ticket.quantity} {ticket.unit}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
            <span><User size={13} style={{ verticalAlign: 'middle' }} /> {ticket.teacherName}</span>
            <span><Building size={13} style={{ verticalAlign: 'middle' }} /> {ticket.roomNumber}</span>
          </div>
        </div>

        {/* Action Toggle Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          
          <button
            type="button"
            onClick={() => setActionType('stock')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: actionType === 'stock' ? '2px solid var(--success)' : '1px solid var(--border-color)',
              background: actionType === 'stock' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)',
              textAlign: 'left',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--success)', fontWeight: '700', fontSize: '14px' }}>
              <CheckCircle2 size={18} />
              {t.tickets.issueFromStock}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Stock Available: <strong style={{ color: isEnoughStock ? 'var(--success)' : 'var(--danger)' }}>{availableQty} {ticket.unit}</strong>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActionType('purchase')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: actionType === 'purchase' ? '2px solid var(--warning)' : '1px solid var(--border-color)',
              background: actionType === 'purchase' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.5)',
              textAlign: 'left',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--warning)', fontWeight: '700', fontSize: '14px' }}>
              <ShoppingBag size={18} />
              {t.tickets.markToPurchase}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Order & Buy by Worker A
            </div>
          </button>

        </div>

        {/* Dynamic Form Content */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {actionType === 'purchase' && (
            <>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.tickets.purchaseCost}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5500"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.tickets.supplier}
                </label>
                <input
                  type="text"
                  placeholder="e.g., Abdi / Mechta / Local Store"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              {t.tickets.notes}
            </label>
            <textarea
              rows="2"
              placeholder="Add optional processing notes for the teacher..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '13px'
              }}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              style={{
                background: actionType === 'stock' ? 'var(--success)' : 'var(--warning)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {t.common.confirm} <ArrowRight size={16} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
