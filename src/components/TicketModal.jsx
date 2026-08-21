import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { PlusCircle, X, CheckCircle, Package } from 'lucide-react';

export const TicketModal = ({ isOpen, onClose }) => {
  const { t, addTicket, inventory } = useApp();

  const [formData, setFormData] = useState({
    itemTitle: '',
    category: 'stationary',
    quantity: 1,
    unit: 'pcs',
    urgency: 'medium',
    roomNumber: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemTitle || !formData.roomNumber) return;
    addTicket(formData);
    onClose();
    // Reset
    setFormData({
      itemTitle: '',
      category: 'stationary',
      quantity: 1,
      unit: 'pcs',
      urgency: 'medium',
      roomNumber: '',
      description: ''
    });
  };

  const handleSelectCatalogItem = (item) => {
    setFormData(prev => ({
      ...prev,
      itemTitle: item.name,
      category: item.category,
      unit: item.unit
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{t.tickets.createTitle}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Inventory Picker */}
        <div style={{ marginBottom: '20px', background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            ⚡ Select from Stock Catalog (Optional):
          </span>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {inventory.slice(0, 4).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCatalogItem(item)}
                style={{
                  background: formData.itemTitle === item.name ? 'var(--primary)' : 'rgba(30, 41, 59, 0.9)',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--border-color)'
                }}
              >
                + {item.name} ({item.quantity} {item.unit})
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              {t.tickets.itemTitle} *
            </label>
            <input
              type="text"
              required
              placeholder={t.tickets.itemPlaceholder}
              value={formData.itemTitle}
              onChange={e => setFormData({ ...formData, itemTitle: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t.tickets.category}
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              >
                <option value="stationary">{t.inventory.categories.stationary}</option>
                <option value="electronics">{t.inventory.categories.electronics}</option>
                <option value="furniture">{t.inventory.categories.furniture}</option>
                <option value="lab">{t.inventory.categories.lab}</option>
                <option value="cleaning">{t.inventory.categories.cleaning}</option>
                <option value="other">{t.inventory.categories.other}</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t.tickets.quantity}
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
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
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t.tickets.unit}
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pcs / box / pack"
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t.tickets.urgency}
              </label>
              <select
                value={formData.urgency}
                onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              >
                <option value="low">{t.tickets.urgencies.low}</option>
                <option value="medium">{t.tickets.urgencies.medium}</option>
                <option value="high">{t.tickets.urgencies.high}</option>
                <option value="critical">{t.tickets.urgencies.critical}</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t.tickets.roomNumber} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Room 302"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
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
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              {t.tickets.description}
            </label>
            <textarea
              rows="3"
              placeholder={t.tickets.descPlaceholder}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '14px'
              }}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              {t.tickets.submit}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
