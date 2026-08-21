import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Package, AlertCircle, Plus, MapPin, Layers, CheckCircle } from 'lucide-react';

export const InventoryManager = () => {
  const { t, inventory, addInventoryItem, updateInventoryQty, role } = useApp();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'stationary',
    quantity: 10,
    unit: 'pcs',
    minLevel: 5,
    location: 'Cabinet 101'
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    addInventoryItem(newItem);
    setShowAddModal(false);
    setNewItem({
      name: '',
      category: 'stationary',
      quantity: 10,
      unit: 'pcs',
      minLevel: 5,
      location: 'Cabinet 101'
    });
  };

  const getStockStatusBadge = (qty, minLevel) => {
    if (qty === 0) {
      return (
        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
          {t.inventory.statusOut}
        </span>
      );
    }
    if (qty <= minLevel) {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
          {t.inventory.statusLow}
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
        {t.inventory.statusOk}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{t.inventory.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Warehouse & storage catalog monitored by Worker A
          </p>
        </div>

        {(role === 'workerA' || role === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Plus size={16} /> {t.inventory.addItem}
          </button>
        )}
      </div>

      {/* Grid Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '16px 20px' }}>{t.inventory.itemName}</th>
              <th style={{ padding: '16px 20px' }}>{t.inventory.category}</th>
              <th style={{ padding: '16px 20px' }}>{t.inventory.inStock}</th>
              <th style={{ padding: '16px 20px' }}>Status</th>
              <th style={{ padding: '16px 20px' }}>{t.inventory.location}</th>
              {(role === 'workerA' || role === 'admin') && <th style={{ padding: '16px 20px', textAlign: 'right' }}>Adjust Quantity</th>}
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: idx !== inventory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                
                <td style={{ padding: '16px 20px', fontWeight: '600', color: '#fff' }}>
                  {item.name}
                </td>

                <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                    {t.inventory.categories[item.category] || item.category}
                  </span>
                </td>

                <td style={{ padding: '16px 20px', fontWeight: '700', fontSize: '15px' }}>
                  {item.quantity} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.unit}</span>
                </td>

                <td style={{ padding: '16px 20px' }}>
                  {getStockStatusBadge(item.quantity, item.minLevel)}
                </td>

                <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {item.location}
                </td>

                {(role === 'workerA' || role === 'admin') && (
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => updateInventoryQty(item.id, item.quantity - 1)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        -
                      </button>
                      <span style={{ width: '28px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateInventoryQty(item.id, item.quantity + 1)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        +
                      </button>
                    </div>
                  </td>
                )}

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Stock Modal */}
      {showAddModal && (
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
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{t.inventory.addItem}</h3>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.inventory.itemName}</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.inventory.category}</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                  >
                    <option value="stationary">{t.inventory.categories.stationary}</option>
                    <option value="electronics">{t.inventory.categories.electronics}</option>
                    <option value="furniture">{t.inventory.categories.furniture}</option>
                    <option value="lab">{t.inventory.categories.lab}</option>
                    <option value="cleaning">{t.inventory.categories.cleaning}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.inventory.inStock}</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.inventory.location}</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '10px' }}>
                  {t.common.cancel}
                </button>
                <button type="submit" style={{ background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {t.common.save}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
