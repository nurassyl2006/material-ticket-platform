import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { PlusCircle, X, Truck, Camera, ImagePlus, ArrowRight, Globe, Languages, Sparkles, User, Users } from 'lucide-react';
import { CampusLocationSelector } from './CampusLocationSelector';
import { DEPARTMENTS, resolveDepartment, getSubcategories } from '../departments';
import { translateText } from '../services/translator';

export const TicketModal = ({ isOpen, onClose, initialDepartment = 'it_helpdesk' }) => {
  const { t, addTicket, inventory, currentUser, lang, role, isAuthenticated } = useApp();

  const [department, setDepartment] = useState(() => resolveDepartment(initialDepartment).id);
  const [formData, setFormData] = useState({
    itemTitle: '',
    subcategory: '',
    category: 'other',
    quantity: 1,
    unit: 'pcs',
    urgency: 'medium',
    roomNumber: 'Block A (Main) • 1st Floor • Room 101',
    description: '',
    fromRoom: '',
    toRoom: '',
    furnitureItems: '',
    guestName: '',
    guestPhone: '',
    studentClass: ''
  });
  const [photos, setPhotos] = useState([]);
  const [translatedPreview, setTranslatedPreview] = useState(null);
  const [isTranslatingPreview, setIsTranslatingPreview] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Synchronize department when modal opens or initialDepartment prop changes
  useEffect(() => {
    if (isOpen) {
      const resolved = resolveDepartment(initialDepartment);
      setDepartment(resolved.id);
      setFormData(prev => ({
        ...prev,
        subcategory: '',
        roomNumber: prev.roomNumber && prev.roomNumber !== 'Room 101'
          ? prev.roomNumber
          : (resolved.id === 'cleaning' ? 'Block A (Main) • 2nd Floor • Corridor (North Wing)' : 'Block A (Main) • 1st Floor • Room 101')
      }));
    }
  }, [isOpen, initialDepartment]);

  if (!isOpen) return null;

  const activeDeptObj = resolveDepartment(department);
  const departmentList = Object.values(DEPARTMENTS);

  const handleSelectSubcategory = (subcat) => {
    setFormData(prev => {
      let room = prev.roomNumber;
      const lower = subcat.toLowerCase();
      if (lower.includes('унитаз') || lower.includes('раковин') || lower.includes('смесител') || lower.includes('санузл') || lower.includes('полотенцесушител') || lower.includes('toilet') || lower.includes('sink') || lower.includes('faucet') || lower.includes('restroom') || lower.includes('әжетхана')) {
        room = 'Block A (Main) • 1st Floor • Restroom (Girls Restroom)';
      } else if (lower.includes('коридор') || lower.includes('холл') || lower.includes('турникет') || lower.includes('corridor') || lower.includes('hallway') || lower.includes('дәліз')) {
        room = 'Block A (Main) • 1st Floor • Corridor (Central Hallway)';
      } else if (lower.includes('снег') || lower.includes('лед') || lower.includes('дорожек') || lower.includes('крыльц') || lower.includes('подъездных') || lower.includes('территори') || lower.includes('snow') || lower.includes('ice') || lower.includes('pathway') || lower.includes('driveway') || lower.includes('қар') || lower.includes('мұз')) {
        room = 'School Yard / Outdoors • Ground • Main Driveway';
      } else if (lower.includes('актового зала') || lower.includes('assembly') || lower.includes('акт залы')) {
        room = 'Block A (Main) • 1st Floor • Main Assembly Hall';
      } else if (lower.includes('столов') || lower.includes('буфет') || lower.includes('куллер') || lower.includes('cafeteria') || lower.includes('canteen') || lower.includes('cooler') || lower.includes('су құтысы')) {
        room = 'Block A (Main) • 1st Floor • Cafeteria (Dining Hall)';
      }

      return {
        ...prev,
        itemTitle: subcat,
        subcategory: subcat,
        roomNumber: room
      };
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

    const isUnreg = !isAuthenticated || role === 'guest' || role === 'parent';
    let author = currentUser?.name || 'Staff';
    let authorPhone = currentUser?.phone || '';

    if (isUnreg) {
      const gName = (formData.guestName || '').trim() || (role === 'parent' ? (lang === 'ru' ? 'Родитель' : lang === 'kk' ? 'Ата-ана' : 'Parent') : (lang === 'ru' ? 'Гость' : lang === 'kk' ? 'Қонақ' : 'Guest'));
      authorPhone = (formData.guestPhone || '').trim();
      if (role === 'parent') {
        const student = (formData.studentClass || '').trim();
        author = student ? `${gName} [Parent • ${student}]` : `${gName} [Parent]`;
      } else {
        author = `${gName} [Guest / Visitor]`;
      }
    }

    const targetRoom = (formData.roomNumber && formData.roomNumber.trim()) || (formData.toRoom && formData.toRoom.trim()) || 'Block A (Main) • 1st Floor • Room 101';

    const moveDetails = (department === 'facilities' || department === 'carpentry' || department === 'event_prep') && (formData.fromRoom || formData.toRoom || formData.furnitureItems) ? {
      fromRoom: formData.fromRoom || 'Current Room',
      toRoom: formData.toRoom || targetRoom,
      items: formData.furnitureItems || formData.itemTitle
    } : null;

    addTicket({
      ...formData,
      itemTitle: formData.itemTitle.trim(),
      subcategory: formData.subcategory || '',
      department,
      roomNumber: targetRoom,
      moveDetails,
      photos,
      senderName: author,
      senderPhone: authorPhone
    });

    onClose();
    setFormData({
      itemTitle: '',
      subcategory: '',
      category: 'other',
      quantity: 1,
      unit: 'pcs',
      urgency: 'medium',
      roomNumber: 'Block A (Main) • 1st Floor • Room 101',
      description: '',
      fromRoom: '',
      toRoom: '',
      furnitureItems: '',
      guestName: '',
      guestPhone: '',
      studentClass: ''
    });
    setPhotos([]);
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-card, rgba(15, 23, 42, 0.75))',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
    borderRadius: '8px',
    padding: '9px 12px',
    color: 'var(--text-main, #ffffff)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}>
      <div className="fluent-card animate-fade-in modal-dialog-responsive" style={{ width: '100%', maxWidth: '640px', padding: '24px 28px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', margin: '0 auto', background: 'var(--bg-dialog, #111827)', border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))', boxShadow: 'var(--shadow-depth-16)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(59, 130, 246, 0.2))', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
              <PlusCircle size={20} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--text-main, #f8fafc)', letterSpacing: '-0.2px' }}>{t.tickets.createTitle}</h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Подача заявки: Родитель' : lang === 'kk' ? 'Өтінім беруші: Ата-ана' : 'Submitting as: School Parent')
                  : role === 'guest'
                  ? (lang === 'ru' ? 'Подача заявки: Гость школы' : lang === 'kk' ? 'Өтінім беруші: Мектеп қонағы' : 'Submitting as: Campus Guest')
                  : <>Sender: <strong style={{ color: '#f8fafc' }}>{currentUser.name}</strong> ({currentUser.department || 'Staff'})</>}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step 1: Select Department */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.tickets.selectDepartment} *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {departmentList.map(dept => {
              const isSelected = department === dept.id;
              const deptTitle = dept.translations?.[lang] || dept.name;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setDepartment(dept.id);
                    setFormData(prev => ({
                      ...prev,
                      subcategory: '',
                      itemTitle: prev.subcategory ? '' : prev.itemTitle
                    }));
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: isSelected ? `1.5px solid ${dept.color || '#6366f1'}` : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                    boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{dept.emoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--text-main, #ffffff)' : 'var(--text-muted, #94a3b8)', lineHeight: 1.2 }}>
                    {deptTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Sender Details for Unregistered Guest / Parent */}
        {(!isAuthenticated || role === 'guest' || role === 'parent') && (
          <div style={{
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderLeft: role === 'parent' ? '4px solid #8b5cf6' : '4px solid #6366f1',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: role === 'parent' ? '#c4b5fd' : '#70b5f9', 
              marginBottom: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              {role === 'parent' ? <Users size={14} /> : <User size={14} />}
              <span>
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Контакты родителя и ученика' : lang === 'kk' ? 'Ата-ана мен оқушының байланыс деректері' : 'Parent & Student Contact Details')
                  : (lang === 'ru' ? 'Контактные данные посетителя' : lang === 'kk' ? 'Келушінің байланыс деректері' : 'Visitor Contact Details')}
              </span>
            </div>

            <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Ваше имя (ФИО) *' : lang === 'kk' ? 'Аты-жөніңіз *' : 'Your Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ru' ? 'Айгуль Нурлан' : 'e.g. Aigul Nurlan'}
                  value={formData.guestName}
                  onChange={e => setFormData(p => ({ ...p, guestName: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Телефон для связи *' : lang === 'kk' ? 'Байланыс телефоны *' : 'Contact Phone *'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+7 (___) ___-__-__"
                  value={formData.guestPhone}
                  onChange={e => setFormData(p => ({ ...p, guestPhone: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {role === 'parent' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                    {lang === 'ru' ? 'Имя ученика и класс (напр. Алихан 4Б)' : lang === 'kk' ? 'Оқушының аты және сыныбы (мыс. Әлихан 4Б)' : 'Student Name & Class (e.g. Alikhan 4B)'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ru' ? 'напр. Данияр 7А' : 'e.g. Daniyar 7A'}
                    value={formData.studentClass}
                    onChange={e => setFormData(p => ({ ...p, studentClass: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Subcategory / Problem */}
        {activeDeptObj && activeDeptObj.subcategories && (
          <div style={{
            marginBottom: '16px',
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: '8px',
            padding: '10px 12px'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-main, #f3f2f1)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{activeDeptObj.emoji}</span>
              <span>{t.tickets.selectSubcategory || 'Выберите тему / подкатегорию:'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {getSubcategories(activeDeptObj, lang).map(subcat => {
                const isSelected = formData.subcategory === subcat || formData.itemTitle === subcat;
                return (
                  <button
                    key={subcat}
                    type="button"
                    onClick={() => handleSelectSubcategory(subcat)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'var(--bg-card, rgba(255, 255, 255, 0.05))',
                      border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: isSelected ? '#ffffff' : 'var(--text-main, #adadad)',
                      fontWeight: isSelected ? '600' : '500',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {isSelected ? '✓ ' : ''}{subcat}
                  </button>
                );
              })}
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
              <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
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
            <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

          {/* Urgency */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.tickets.urgency}</label>
            <select value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })} style={{ ...inputStyle, padding: '9px' }}>
              <option value="low">{t.tickets.urgencies.low}</option>
              <option value="medium">{t.tickets.urgencies.medium}</option>
              <option value="high">{t.tickets.urgencies.high}</option>
              <option value="critical">{t.tickets.urgencies.critical}</option>
            </select>
          </div>

          {/* Campus Location (Block, Floor & Area: Corridors, Restrooms, Classrooms) */}
          <CampusLocationSelector
            value={formData.roomNumber}
            onChange={val => setFormData(prev => ({ ...prev, roomNumber: val }))}
            department={department}
            t={t}
          />

          {/* Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.tickets.description}</label>
              {(formData.description || formData.itemTitle) && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsTranslatingPreview(true);
                    try {
                      const textToTrans = formData.description || formData.itemTitle;
                      const res = await translateText(textToTrans, 'ru', 'auto');
                      setTranslatedPreview(res.translatedText);
                    } catch (e) {
                      // ignore
                    } finally {
                      setIsTranslatingPreview(false);
                    }
                  }}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#818cf8',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '600'
                  }}
                >
                  <Globe size={11} />
                  {isTranslatingPreview ? (t.translator?.translating || 'Translating...') : (t.translator?.translateDescForEngineer || '🇷🇺 Preview Russian for Engineer')}
                </button>
              )}
            </div>
            <textarea
              rows="2"
              placeholder={t.tickets.descPlaceholder}
              value={formData.description}
              onChange={e => {
                setFormData({ ...formData, description: e.target.value });
                if (translatedPreview) setTranslatedPreview(null);
              }}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {translatedPreview && (
              <div style={{
                marginTop: '6px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '12px',
                color: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🇷🇺 Russian translation for Maintenance Staff:
                </span>
                <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>
                  "{translatedPreview}"
                </span>
              </div>
            )}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid #383838', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="fluent-btn-secondary"
              style={{ minWidth: '90px' }}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="fluent-btn-primary"
              style={{ minWidth: '120px' }}
            >
              <span>{t.tickets.submit}</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
