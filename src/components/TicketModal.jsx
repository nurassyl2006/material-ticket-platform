import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { PlusCircle, X, Package, Laptop, Sparkles, Truck, Shield, ArrowRight, Wrench, Camera, ImagePlus, Trash2 } from 'lucide-react';

export const TicketModal = ({ isOpen, onClose, initialDepartment = 'engineering' }) => {
  const { t, addTicket, inventory, currentUser } = useApp();

  const [department, setDepartment] = useState(initialDepartment);
  const [formData, setFormData] = useState({
    itemTitle: '',
    category: 'electrical',
    quantity: 1,
    unit: 'pcs',
    urgency: 'medium',
    roomNumber: 'Room 101',
    description: '',
    fromRoom: '',
    toRoom: '',
    furnitureItems: ''
  });
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Synchronize department when modal opens or initialDepartment prop changes
  useEffect(() => {
    if (isOpen) {
      const dept = initialDepartment || 'engineering';
      setDepartment(dept);
      setFormData(prev => ({
        ...prev,
        category: dept === 'engineering' ? 'electrical' : (dept === 'it' ? 'electronics' : (dept === 'cleaning' ? 'cleaning' : (dept === 'facilities' ? 'furniture' : (dept === 'storage' ? 'stationary' : 'other')))),
        roomNumber: prev.roomNumber || 'Room 101'
      }));
    }
  }, [isOpen, initialDepartment]);

  if (!isOpen) return null;

  const departmentList = [
    { id: 'it', name: t.departments.it, icon: Laptop, color: '#38bdf8', desc: 'Wi-Fi, laptop, projector, cables' },
    { id: 'cleaning', name: t.departments.cleaning, icon: Sparkles, color: '#34d399', desc: 'Spills, classroom sanitation, waste' },
    { id: 'storage', name: t.departments.storage, icon: Package, color: '#fbbf24', desc: 'Paper, markers, consumable materials' },
    { id: 'facilities', name: t.departments.facilities, icon: Truck, color: '#a78bfa', desc: 'Move furniture (desks/chairs), repairs' },
    { id: 'engineering', name: t.departments.engineering, icon: Wrench, color: '#f97316', desc: 'Lights, AC, sockets, heating, ventilation' },
    { id: 'security', name: t.departments.security, icon: Shield, color: '#f87171', desc: 'Keycards, door locks, access' }
  ];

  const presets = {
    engineering: [
      { title: 'Ceiling Fluorescent / LED Lights Flickering', cat: 'electrical', urg: 'high', room: 'Room 302 - English' },
      { title: 'Air Conditioner (AC) Leaking Water / Warm Air', cat: 'hvac', urg: 'critical', room: 'Server Room 204' },
      { title: 'Burnt Wall Power Socket & Sparking Breaker', cat: 'electrical', urg: 'critical', room: 'Chemistry Lab 102' },
      { title: 'Ventilation / Exhaust Fan Rattle & Noise', cat: 'hvac', urg: 'medium', room: 'Chemistry Prep 103' },
      { title: 'Heating Radiator Valve Stuck / Overheating', cat: 'hvac', urg: 'medium', room: 'Room 208' }
    ],
    it: [
      { title: 'Wi-Fi Disconnected / Weak Signal', cat: 'electronics', urg: 'high', room: 'Computer Lab 204' },
      { title: 'Teacher Laptop Screen Black / Won\'t Boot', cat: 'electronics', urg: 'critical', room: 'Physics Lab 108' },
      { title: 'Interactive Board / Projector Signal Lost', cat: 'electronics', urg: 'high', room: 'Room 102' },
      { title: 'HDMI / Audio Cable Missing in Room', cat: 'electronics', urg: 'medium', room: 'Room 215' }
    ],
    cleaning: [
      { title: 'Urgent Liquid / Paint Spill on Floor', cat: 'cleaning', urg: 'critical', room: '2nd Floor Corridor' },
      { title: 'Classroom Deep Cleaning & Sanitizing', cat: 'cleaning', urg: 'medium', room: 'Room 305 - Biology' },
      { title: 'Waste Bin Overflow & Disposal', cat: 'cleaning', urg: 'medium', room: 'Cafeteria / Hall' },
      { title: 'Whiteboard Stained / Cleaner Needed', cat: 'cleaning', urg: 'low', room: 'Room 104' }
    ],
    storage: [
      { title: 'A4 Printing Paper (80gsm)', cat: 'stationary', unit: 'pack', qty: 2, room: 'Storage Room 102' },
      { title: 'Whiteboard Markers Set', cat: 'stationary', unit: 'box', qty: 1, room: 'Teachers Lounge' },
      { title: 'Chemistry Lab Test Tubes Set', cat: 'lab', unit: 'set', qty: 1, room: 'Chemistry Lab 102' }
    ],
    facilities: [
      { title: 'Move 15 Desks & 30 Chairs to Assembly Hall', cat: 'furniture', urg: 'high', from: 'Room 102 - Storage', to: 'Main Assembly Hall', items: '15 student desks, 30 blue chairs, 1 podium', room: 'Main Assembly Hall' },
      { title: 'Relocate Extra Student Chairs to Room', cat: 'furniture', urg: 'medium', from: 'Storage Warehouse', to: 'Room 205', items: '10 ergonomic chairs', room: 'Room 205' },
      { title: 'Fix Loose Door Handle & Latch', cat: 'furniture', urg: 'medium', room: 'Room 215 - History' }
    ],
    security: [
      { title: 'Teacher RFID Keycard Not Unlocking Door', cat: 'other', urg: 'high', room: 'STEM Robotics Lab 110' },
      { title: 'Door Lock Jammed / Key Stuck', cat: 'other', urg: 'high', room: 'Room 201' },
      { title: 'Lost & Found Student Item Report', cat: 'other', urg: 'low', room: 'Security Desk' }
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
      roomNumber: p.room || p.to || prev.roomNumber || (p.from ? `${p.from} ➔ ${p.to}` : 'Classroom')
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

  // ── Photo helpers ──────────────────────────────────────────────────────────
  const processFiles = (files) => {
    const remaining = 5 - photos.length;
    if (remaining <= 0) return;
    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => prev.length < 5 ? [...prev, e.target.result] : prev);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemTitle || !formData.itemTitle.trim()) return;

    const targetRoom = (formData.roomNumber && formData.roomNumber.trim()) || (formData.toRoom && formData.toRoom.trim()) || 'Main Campus';

    const moveDetails = department === 'facilities' && (formData.fromRoom || formData.toRoom || formData.furnitureItems) ? {
      fromRoom: formData.fromRoom || 'Current Room',
      toRoom: formData.toRoom || targetRoom,
      items: formData.furnitureItems || formData.itemTitle
    } : null;

    addTicket({
      ...formData,
      itemTitle: formData.itemTitle.trim(),
      department,
      roomNumber: targetRoom,
      moveDetails,
      photos
    });

    onClose();
    setFormData({ itemTitle: '', category: 'electrical', quantity: 1, unit: 'pcs', urgency: 'medium', roomNumber: '', description: '', fromRoom: '', toRoom: '', furnitureItems: '' });
    setPhotos([]);
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: '0' }}>
      <div className="glass-panel animate-fade-in ticket-modal-sheet" style={{ width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '94vh', overflowY: 'auto', borderRadius: '24px 24px 0 0', margin: '0 auto' }}>
        
        {/* Drag handle for mobile */}
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0 auto 16px' }} />

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
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Select Department */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.tickets.selectDepartment} *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
                    if (dept.id === 'engineering') setFormData(prev => ({ ...prev, category: 'electrical' }));
                    if (dept.id === 'security') setFormData(prev => ({ ...prev, category: 'other' }));
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${dept.color}` : '1px solid var(--border-color)',
                    background: isSelected ? `${dept.color}22` : 'rgba(30, 41, 59, 0.5)',
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
                  <span style={{ fontSize: '11px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--text-muted)', lineHeight: 1.2 }}>
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

        {/* Quick Presets */}
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
              style={inputStyle}
            />
          </div>

          {/* Facilities specific */}
          {department === 'facilities' && (
            <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#c4b5fd', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} /> {t.tickets.moveDetailsTitle} (For Furniture Moves)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{t.tickets.fromRoom}</label>
                  <input type="text" placeholder="e.g. Room 102" value={formData.fromRoom} onChange={e => setFormData({ ...formData, fromRoom: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{t.tickets.toRoom}</label>
                  <input type="text" placeholder="e.g. Assembly Hall" value={formData.toRoom} onChange={e => setFormData({ ...formData, toRoom: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{t.tickets.furnitureItems}</label>
                <input type="text" placeholder="e.g. 15 student desks, 30 chairs" value={formData.furnitureItems} onChange={e => setFormData({ ...formData, furnitureItems: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', fontSize: '12px' }} />
              </div>
            </div>
          )}

          {/* Storage: qty + unit */}
          {department === 'storage' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.tickets.quantity} *</label>
                <input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.tickets.unit}</label>
                <input type="text" placeholder="pcs / box / pack" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
            </div>
          )}

          {/* Urgency & Room */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.tickets.urgency}</label>
              <select value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })} style={{ ...inputStyle, padding: '9px' }}>
                <option value="low">{t.tickets.urgencies.low}</option>
                <option value="medium">{t.tickets.urgencies.medium}</option>
                <option value="high">{t.tickets.urgencies.high}</option>
                <option value="critical">{t.tickets.urgencies.critical}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.tickets.roomNumber}</label>
              <input type="text" placeholder="e.g. Room 204 / Gym / Server Room" value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} style={{ ...inputStyle, padding: '9px 12px' }} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.tickets.description}</label>
            <textarea
              rows="2"
              placeholder={t.tickets.descPlaceholder}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* ── PHOTO UPLOAD ────────────────────────────────────────────────── */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              📸 Attach Photos <span style={{ fontSize: '11px', fontWeight: '400' }}>(up to 5, optional)</span>
            </label>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {photos.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                    <img src={src} alt={`photo-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(15,23,42,0.85)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={11} color="#f87171" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload buttons */}
            {photos.length < 5 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Camera (opens native camera on mobile) */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ flex: 1, background: 'rgba(6, 182, 212, 0.12)', border: '1px dashed rgba(6,182,212,0.4)', borderRadius: '12px', padding: '12px 10px', color: '#38bdf8', fontWeight: '700', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <Camera size={20} />
                  Take Photo
                </button>
                {/* Gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, background: 'rgba(99, 102, 241, 0.12)', border: '1px dashed rgba(99,102,241,0.4)', borderRadius: '12px', padding: '12px 10px', color: '#818cf8', fontWeight: '700', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <ImagePlus size={20} />
                  From Gallery
                </button>
              </div>
            )}
            {photos.length >= 5 && (
              <p style={{ fontSize: '11px', color: 'var(--warning)', margin: 0 }}>Maximum 5 photos reached.</p>
            )}

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: 'none' }}
              onChange={e => { processFiles(e.target.files); e.target.value = ''; }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => { processFiles(e.target.files); e.target.value = ''; }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'stretch', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '11px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              style={{ flex: 2, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', boxShadow: 'var(--shadow-glow)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {t.tickets.submit} <ArrowRight size={15} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
