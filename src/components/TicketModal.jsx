import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { PlusCircle, X, Package, Laptop, Sparkles, Truck, Shield, ArrowRight } from 'lucide-react';

export const TicketModal = ({ isOpen, onClose, initialDepartment = 'storage' }) => {
  const { t, addTicket, inventory, currentUser } = useApp();

  const [department, setDepartment] = useState(initialDepartment);
  const [formData, setFormData] = useState({
    itemTitle: '',
    category: 'stationary',
    quantity: 1,
    unit: 'pcs',
    urgency: 'medium',
    roomNumber: '',
    description: '',
    // Facilities moving specific
    fromRoom: '',
    toRoom: '',
    furnitureItems: ''
  });

  if (!isOpen) return null;

  const departmentList = [
    { id: 'it', name: t.departments.it, icon: Laptop, color: '#38bdf8', desc: 'Wi-Fi, laptop, projector, cables' },
    { id: 'cleaning', name: t.departments.cleaning, icon: Sparkles, color: '#34d399', desc: 'Spills, classroom sanitation, waste' },
    { id: 'storage', name: t.departments.storage, icon: Package, color: '#fbbf24', desc: 'Paper, markers, consumable materials' },
    { id: 'facilities', name: t.departments.facilities, icon: Truck, color: '#a78bfa', desc: 'Move furniture (desks/chairs), repairs' },
    { id: 'security', name: t.departments.security, icon: Shield, color: '#f87171', desc: 'Keycards, door locks, access' }
  ];

  // Presets per department
  const presets = {
    it: [
      { title: 'Wi-Fi Disconnected / Weak Signal', cat: 'electronics', urg: 'high' },
      { title: 'Teacher Laptop Screen Black / Won\'t Boot', cat: 'electronics', urg: 'critical' },
      { title: 'Interactive Board / Projector Signal Lost', cat: 'electronics', urg: 'high' },
      { title: 'HDMI / Audio Cable Missing in Room', cat: 'electronics', urg: 'medium' }
    ],
    cleaning: [
      { title: 'Urgent Liquid / Paint Spill on Floor', cat: 'cleaning', urg: 'critical' },
      { title: 'Classroom Deep Cleaning & Sanitizing', cat: 'cleaning', urg: 'medium' },
      { title: 'Waste Bin Overflow & Disposal', cat: 'cleaning', urg: 'medium' },
      { title: 'Whiteboard Stained / Cleaner Needed', cat: 'cleaning', urg: 'low' }
    ],
    storage: [
      { title: 'A4 Printing Paper (80gsm)', cat: 'stationary', unit: 'pack', qty: 2 },
      { title: 'Whiteboard Markers Set', cat: 'stationary', unit: 'box', qty: 1 },
      { title: 'Chemistry Lab Test Tubes Set', cat: 'lab', unit: 'set', qty: 1 }
    ],
    facilities: [
      { 
        title: 'Move 15 Desks & 30 Chairs to Assembly Hall', 
        cat: 'furniture', 
        urg: 'high', 
        from: 'Room 102 - Storage', 
        to: 'Main Assembly Hall',
        items: '15 student desks, 30 blue chairs, 1 podium'
      },
      { 
        title: 'Relocate Extra Student Chairs to Room', 
        cat: 'furniture', 
        urg: 'medium', 
        from: 'Storage Warehouse', 
        to: 'Room 205',
        items: '10 ergonomic chairs'
      },
      { title: 'Fix Loose Door Handle & Latch', cat: 'furniture', urg: 'medium' }
    ],
    security: [
      { title: 'Teacher RFID Keycard Not Unlocking Door', cat: 'other', urg: 'high' },
      { title: 'Door Lock Jammed / Key Stuck', cat: 'other', urg: 'high' },
      { title: 'Lost & Found Student Item Report', cat: 'other', urg: 'low' }
    ]
  };

  const handleApplyPreset = (p) => {
    setFormData(prev => ({
      ...prev,
      itemTitle: p.title,
      category: p.cat || prev.category,
      urgency: p.urg || prev.urgency,
      quantity: p.qty || prev.quantity,
      unit: p.unit || prev.unit,
      fromRoom: p.from || prev.fromRoom,
      toRoom: p.to || prev.toRoom,
      furnitureItems: p.items || prev.furnitureItems,
      roomNumber: p.to || prev.roomNumber || (p.from ? `${p.from} ➔ ${p.to}` : '')
    }));
  };

  const handleSelectCatalogItem = (item) => {
    setFormData(prev => ({
      ...prev,
      itemTitle: item.name,
      category: item.category,
      unit: item.unit
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemTitle) return;

    const moveDetails = department === 'facilities' && (formData.fromRoom || formData.toRoom || formData.furnitureItems) ? {
      fromRoom: formData.fromRoom || 'Current Room',
      toRoom: formData.toRoom || formData.roomNumber || 'Target Location',
      items: formData.furnitureItems || formData.itemTitle
    } : null;

    addTicket({
      ...formData,
      department,
      roomNumber: formData.roomNumber || formData.toRoom || 'Classroom',
      moveDetails
    });

    onClose();
    // Reset form
    setFormData({
      itemTitle: '',
      category: 'stationary',
      quantity: 1,
      unit: 'pcs',
      urgency: 'medium',
      roomNumber: '',
      description: '',
      fromRoom: '',
      toRoom: '',
      furnitureItems: ''
    });
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
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <PlusCircle size={22} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{t.tickets.createTitle}</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Sender: <strong style={{ color: '#fff' }}>{currentUser.name}</strong> ({currentUser.department || 'Staff'})
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Select Facility Department */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.tickets.selectDepartment} *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            {departmentList.map(dept => {
              const Icon = dept.icon;
              const isSelected = department === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setDepartment(dept.id);
                    if (dept.id === 'storage') setFormData(prev => ({ ...prev, category: 'stationary' }));
                    if (dept.id === 'it') setFormData(prev => ({ ...prev, category: 'electronics' }));
                    if (dept.id === 'cleaning') setFormData(prev => ({ ...prev, category: 'cleaning' }));
                    if (dept.id === 'facilities') setFormData(prev => ({ ...prev, category: 'furniture' }));
                    if (dept.id === 'security') setFormData(prev => ({ ...prev, category: 'other' }));
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${dept.color}` : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <Icon size={20} color={dept.color} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                    {dept.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
            {t.departmentDescriptions[department]}
          </p>
        </div>

        {/* Quick Presets for current department */}
        {presets[department] && (
          <div style={{ marginBottom: '16px', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              ⚡ Quick Common Scenarios:
            </span>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {presets[department].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    background: formData.itemTitle === p.title ? 'var(--primary)' : 'rgba(30, 41, 59, 0.8)',
                    color: '#fff',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Storage Catalog Quick Picker */}
        {department === 'storage' && (
          <div style={{ marginBottom: '16px', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
            <span style={{ fontSize: '11px', color: '#fbbf24', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              📦 Pick From Warehouse Catalog:
            </span>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {inventory.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCatalogItem(item)}
                  style={{
                    background: formData.itemTitle === item.name ? '#fbbf24' : 'rgba(30, 41, 59, 0.8)',
                    color: formData.itemTitle === item.name ? '#000' : '#fff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {item.name} ({item.quantity} {item.unit})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Title */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
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
                padding: '10px 12px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Department Specific: Facilities Furniture Relocation fields */}
          {department === 'facilities' && (
            <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#c4b5fd', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} /> {t.tickets.moveDetailsTitle} (For Furniture Moves)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    {t.tickets.fromRoom}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102 - Storage"
                    value={formData.fromRoom}
                    onChange={e => setFormData({ ...formData, fromRoom: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    {t.tickets.toRoom}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Assembly Hall"
                    value={formData.toRoom}
                    onChange={e => setFormData({ ...formData, toRoom: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  {t.tickets.furnitureItems}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 student desks, 30 blue chairs, 1 podium"
                  value={formData.furnitureItems}
                  onChange={e => setFormData({ ...formData, furnitureItems: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Department Specific: Storage Quantity & Unit */}
          {department === 'storage' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.tickets.quantity} *
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
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.tickets.unit}
                </label>
                <input
                  type="text"
                  placeholder="pcs / box / pack"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Urgency & Room */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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
                  padding: '9px',
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
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {t.tickets.roomNumber} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Room 204 / Library / Gym"
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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
                padding: '10px 12px',
                color: '#fff',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff',
                border: 'none',
                padding: '9px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: 'var(--shadow-glow)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {t.tickets.submit} <ArrowRight size={15} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
