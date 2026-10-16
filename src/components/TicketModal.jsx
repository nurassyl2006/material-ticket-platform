import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import { PlusCircle, X, Truck, Camera, ImagePlus, ArrowRight, Globe, Languages, Sparkles, User, Users, Package, Search, Minus, Plus, Check, ShoppingBag, AlertCircle } from 'lucide-react';
import { CampusLocationSelector } from './CampusLocationSelector';
import { DEPARTMENTS, resolveDepartment, getSubcategories, isReturnableSubcategory } from '../departments';
import { translateText } from '../services/translator';
import { STORAGE_CATEGORIES, getCategoryMeta, getCategoryLabel } from '../storageCategories';
import { compressImageFile } from '../utils/imageCompressor';

export const TicketModal = ({ isOpen, onClose, initialDepartment = 'it_helpdesk', initialItem = '' }) => {
  const { t, addTicket, inventory, currentUser, lang, role, isAuthenticated } = useApp();

  const [department, setDepartment] = useState(() => resolveDepartment(initialDepartment).id);
  const [formData, setFormData] = useState({
    itemTitle: '',
    subcategory: '',
    category: 'other',
    quantity: 1,
    unit: 'pcs',
    urgency: 'medium',
    roomNumber: 'Block A • 1st Floor • A-1-2 (Year 1A)',
    description: '',
    fromRoom: '',
    toRoom: '',
    furnitureItems: '',
    guestName: '',
    guestPhone: '',
    studentClass: ''
  });
  const [photos, setPhotos] = useState([]);
  const [storageSearchTerm, setStorageSearchTerm] = useState('');
  const [storageSelectedCategory, setStorageSelectedCategory] = useState('all');
  const [isReturnableOverride, setIsReturnableOverride] = useState(null);
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
        itemTitle: initialItem || prev.itemTitle,
        subcategory: initialItem || '',
        roomNumber: prev.roomNumber && prev.roomNumber !== 'Room 101'
          ? prev.roomNumber
          : (resolved.id === 'cleaning' ? 'Block A • 1st Floor • A-1-10 (Toilets & Stairs)' : 'Block A • 1st Floor • A-1-2 (Year 1A)')
      }));
    }
  }, [isOpen, initialDepartment, initialItem]);

  const activeDeptObj = resolveDepartment(department);
  const departmentList = Object.values(DEPARTMENTS);

  // Storage Manager, Engineer, and Leadership can view/manage live numerical stock counts
  const canManageStock = Boolean(isAuthenticated && ['storage_manager', 'workerA', 'engineer', 'director', 'admin'].includes(role));
  const isTeacher = !canManageStock;

  const handleSelectSubcategory = (subcat) => {
    setFormData(prev => {
      let room = prev.roomNumber;
      const lower = subcat.toLowerCase();
      if (lower.includes('унитаз') || lower.includes('раковин') || lower.includes('смесител') || lower.includes('санузл') || lower.includes('полотенцесушител') || lower.includes('toilet') || lower.includes('sink') || lower.includes('faucet') || lower.includes('restroom') || lower.includes('әжетхана')) {
        room = 'Block A • 1st Floor • A-1-10 (Toilets & Stairs)';
      } else if (lower.includes('робот') || lower.includes('robot') || lower.includes('3d')) {
        room = 'Block C • 1st Floor • C-1-5 (Robotics)';
      } else if (lower.includes('компьютер') || lower.includes('ноутбук') || lower.includes('it') || lower.includes('принтер')) {
        room = 'Block C • 1st Floor • C-1-6 (IT 1)';
      } else if (lower.includes('бассейн') || lower.includes('pool') || lower.includes('жүзу')) {
        room = 'Block D • 1st Floor • Swimming Pool';
      } else if (lower.includes('столов') || lower.includes('буфет') || lower.includes('куллер') || lower.includes('dining') || lower.includes('canteen') || lower.includes('асхана')) {
        room = 'Block D • 1st Floor • Dining Hall / Canteen';
      } else if (lower.includes('спортзал') || lower.includes('gym') || lower.includes('спорт')) {
        room = 'Block D • 2nd Floor • D-2-2 (Main Sports Hall)';
      } else if (lower.includes('библиотек') || lower.includes('книг') || lower.includes('library') || lower.includes('кітапхана')) {
        room = 'Block D • 3rd Floor • D-3-1 (Library)';
      } else if (lower.includes('лаборатори') || lower.includes('хими') || lower.includes('физик') || lower.includes('science')) {
        room = 'Block C • 3rd Floor • C-3-6 (Science Laboratory 1)';
      } else if (lower.includes('актового зала') || lower.includes('assembly') || lower.includes('лектори') || lower.includes('lectorium')) {
        room = 'Block D • 1st Floor • Lectorium';
      } else if (lower.includes('снег') || lower.includes('лед') || lower.includes('дорожек') || lower.includes('крыльц') || lower.includes('территори') || lower.includes('snow') || lower.includes('қар')) {
        room = 'School Yard / Outdoors • Ground • Main Driveway';
      } else if (lower.includes('коридор') || lower.includes('холл') || lower.includes('дәліз')) {
        room = 'Block A • 1st Floor • Central Corridor';
      }

      // If in storage department, check if this subcategory matches any inventory item
      let matchedItem = null;
      if (department === 'storage' && inventory) {
        const subLower = subcat.toLowerCase();
        matchedItem = inventory.find(i => {
          const iName = i.name.toLowerCase();
          return iName.includes(subLower) || subLower.includes(iName) ||
            (subLower.includes('бумага') && iName.includes('paper')) ||
            (subLower.includes('paper') && iName.includes('paper')) ||
            (subLower.includes('маркер') && iName.includes('marker')) ||
            (subLower.includes('marker') && iName.includes('marker')) ||
            (subLower.includes('губка') && iName.includes('board')) ||
            (subLower.includes('ноутбук') && iName.includes('laptop')) ||
            (subLower.includes('адаптер') && iName.includes('adapter')) ||
            (subLower.includes('стул') && iName.includes('chair')) ||
            (subLower.includes('стол') && iName.includes('desk'));
        });
      }

      return {
        ...prev,
        itemTitle: matchedItem ? matchedItem.name : subcat,
        subcategory: subcat,
        category: matchedItem ? matchedItem.category : prev.category,
        unit: matchedItem ? matchedItem.unit : prev.unit,
        roomNumber: room
      };
    });
  };

  const handleSelectCatalogItem = (item) => {
    setFormData(prev => ({
      ...prev,
      itemTitle: item.name,
      subcategory: item.name,
      category: item.category || 'other',
      unit: item.unit || 'pcs',
      quantity: prev.quantity || 1
    }));
  };

  const filteredInventory = useMemo(() => {
    if (!inventory || !Array.isArray(inventory)) return [];
    let items = inventory;
    if (storageSelectedCategory !== 'all') {
      items = items.filter(item => (item.category || 'other') === storageSelectedCategory);
    }
    if (storageSearchTerm.trim()) {
      const term = storageSearchTerm.toLowerCase();
      items = items.filter(item => 
        (item.name || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term) ||
        (item.location || '').toLowerCase().includes(term)
      );
    }
    return items;
  }, [inventory, storageSelectedCategory, storageSearchTerm]);

  const matchedStockItem = useMemo(() => {
    if (!inventory || !formData.itemTitle) return null;
    const title = formData.itemTitle.trim().toLowerCase();
    return inventory.find(i => 
      i.name.toLowerCase() === title ||
      title.includes(i.name.toLowerCase()) ||
      i.name.toLowerCase().includes(title)
    );
  }, [inventory, formData.itemTitle]);

  const isReturnable = useMemo(() => {
    if (isReturnableOverride !== null) return isReturnableOverride;
    return Boolean(
      formData.category === 'stationary_loan' ||
      isReturnableSubcategory(formData.subcategory || formData.itemTitle) ||
      (matchedStockItem && matchedStockItem.isReturnable)
    );
  }, [isReturnableOverride, formData.category, formData.subcategory, formData.itemTitle, matchedStockItem]);

  // ── Photo helpers ──────────────────────────────────────────────────────────
  const processFiles = async (files) => {
    const remaining = 5 - photos.length;
    if (remaining <= 0) return;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });
        setPhotos(prev => prev.length < 5 ? [...prev, compressed] : prev);
      } catch {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => prev.length < 5 ? [...prev, e.target.result] : prev);
        };
        reader.readAsDataURL(file);
      }
    }
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
      category: isReturnable ? 'stationary_loan' : (formData.category || 'other'),
      isReturnable,
      department,
      roomNumber: targetRoom,
      moveDetails,
      photos,
      senderName: author,
      senderPhone: authorPhone,
      description: isReturnable && formData.loanDuration
        ? `${formData.description ? `${formData.description}\n` : ''}[${lang === 'ru' ? 'Срок пользования' : lang === 'kk' ? 'Қолдану мерзімі' : 'Loan Duration'}: ${formData.loanDuration === '1_lesson' ? (t.tickets?.loan1Lesson || '1 Lesson (45 min)') : formData.loanDuration === '2_lessons' ? (t.tickets?.loan2Lessons || '2 Lessons (1.5 hours)') : (t.tickets?.loanFullDay || 'Full School Day')}]`
        : formData.description
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

  if (!isOpen) return null;

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
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Подача заявки: Родитель' : lang === 'kk' ? 'Өтінім беруші: Ата-ана' : 'Submitting as: School Parent')
                  : role === 'guest'
                  ? (lang === 'ru' ? 'Подача заявки: Гость школы' : lang === 'kk' ? 'Өтінім беруші: Мектеп қонағы' : 'Submitting as: Campus Guest')
                  : <>Sender: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{currentUser?.name || 'Staff'}</strong> ({currentUser?.department || 'Staff'})</>}
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
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '600', color: isSelected ? 'var(--text-main, #ffffff)' : 'var(--text-main, #94a3b8)', lineHeight: 1.2 }}>
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

        {/* Storage Catalog & Live Warehouse Inventory Picker - Available to all with role-based stock numbers */}
        {department === 'storage' && (
          <div style={{
            marginBottom: '16px',
            background: 'rgba(245, 158, 11, 0.07)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '12px', fontWeight: '700' }}>
                <Package size={16} />
                <span>
                  {canManageStock 
                    ? (lang === 'ru' ? 'Каталог школьного склада (в наличии):' : lang === 'kk' ? 'Мектеп қоймасының каталогы (қолда бар):' : 'School Warehouse Inventory (In Stock):')
                    : (lang === 'ru' ? 'Каталог канцелярии и школьных материалов:' : lang === 'kk' ? 'Кеңсе тауарлары мен сабақ материалдары:' : 'Stationery & Lesson Supplies Catalog:')
                  }
                </span>
              </div>
              {canManageStock ? (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {(inventory || []).length} {lang === 'ru' ? 'позиций на складе' : lang === 'kk' ? 'қоймадағы заттар' : 'items cataloged'}
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {lang === 'ru' ? 'Нажмите на нужный предмет' : lang === 'kk' ? 'Таңдау үшін затты басыңыз' : 'Click item to select'}
                </span>
              )}
            </div>

            {/* Quick Search in Warehouse Catalog */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={lang === 'ru' ? 'Быстрый поиск по складу (бумага, маркеры, кабель, папки...)' : lang === 'kk' ? 'Қоймадан іздеу (қағаз, маркер, сым, папка...)' : 'Quick search warehouse supplies...'}
                value={storageSearchTerm}
                onChange={e => setStorageSearchTerm(e.target.value)}
                style={{
                  ...inputStyle,
                  padding: '7px 10px 7px 30px',
                  fontSize: '12px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  borderColor: 'rgba(245, 158, 11, 0.2)'
                }}
              />
              {storageSearchTerm && (
                <button
                  type="button"
                  onClick={() => setStorageSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setStorageSelectedCategory('all')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: storageSelectedCategory === 'all' ? '700' : '500',
                  background: storageSelectedCategory === 'all' ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)',
                  color: storageSelectedCategory === 'all' ? '#0f172a' : '#cbd5e1'
                }}
              >
                {t.inventory?.allCategories || 'All'} {canManageStock ? `(${(inventory || []).length})` : ''}
              </button>
              {STORAGE_CATEGORIES.map(cat => {
                const count = (inventory || []).filter(i => (i.category || 'other') === cat.id).length;
                if (count === 0) return null;
                const isCatActive = storageSelectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setStorageSelectedCategory(cat.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: isCatActive ? '700' : '500',
                      background: isCatActive ? cat.color : 'rgba(255, 255, 255, 0.08)',
                      color: isCatActive ? '#fff' : '#cbd5e1'
                    }}
                  >
                    {cat.icon} {getCategoryLabel(cat.id, lang, true)} {canManageStock ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Scrollable list of items */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '8px',
              maxHeight: '150px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {filteredInventory.map(item => {
                const isSelected = formData.itemTitle === item.name;
                const isLow = item.quantity <= item.minLevel;
                const isOut = item.quantity === 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCatalogItem(item)}
                    style={{
                      background: isSelected ? 'rgba(245, 158, 11, 0.22)' : 'rgba(30, 41, 59, 0.7)',
                      border: isSelected ? '1.5px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.photos && item.photos.length > 0 ? (
                        <img 
                          src={item.photos[0]} 
                          alt={item.name} 
                          style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{getCategoryMeta(item.category).icon}</span>
                      )}
                      <div style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '600', color: isSelected ? '#fbbf24' : '#fff', lineHeight: 1.25 }}>
                        {isSelected ? '✓ ' : ''}{item.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                      {canManageStock ? (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          background: isOut ? 'rgba(239, 68, 68, 0.2)' : isLow ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isOut ? '#f87171' : isLow ? '#fbbf24' : '#34d399'
                        }}>
                          {isOut 
                            ? (lang === 'ru' ? 'Под заказ' : 'Out of stock')
                            : `${item.quantity} ${item.unit}`}
                        </span>
                      ) : (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          background: isOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isOut ? '#f87171' : '#34d399'
                        }}>
                          {isOut 
                            ? (lang === 'ru' ? '● Под заказ' : lang === 'kk' ? '● Тапсырыспен' : '● Out of stock')
                            : (lang === 'ru' ? '✓ В наличии' : lang === 'kk' ? '✓ Қолда бар' : '✓ In Stock')}
                        </span>
                      )}
                      {item.location && canManageStock && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                          {item.location.split('-')[0]}
                        </span>
                      )}
                      {!canManageStock && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: '700',
                          color: (item.isReturnable || item.category === 'stationary_loan') ? '#fb923c' : '#94a3b8'
                        }}>
                          {(item.isReturnable || item.category === 'stationary_loan') 
                            ? (lang === 'ru' ? '⏱️ 1-2 урока' : lang === 'kk' ? '⏱️ 1-2 сабақ' : '⏱️ 1-2 Lessons') 
                            : (lang === 'ru' ? '✏️ Насовсем' : lang === 'kk' ? '✏️ Берілетін' : '✏️ Consumable')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredInventory.length === 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                {lang === 'ru' ? 'Товар не найден в каталоге. Вы можете ввести название вручную ниже, и завхоз закажет его!' : 'Item not found in catalog. You can still type custom item below and warehouse will procure it!'}
              </div>
            )}
          </div>
        )}

        {/* Classroom Supplies Guidance - Visible to Teachers & Regular Staff (Without revealing internal catalog/stock counts) */}
        {department === 'storage' && !canAccessCatalog && (
          <div style={{
            marginBottom: '16px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Package size={20} color="#fbbf24" />
            </div>
            <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.45 }}>
              <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '2px' }}>
                {lang === 'ru' ? 'Заказ канцтоваров и расходных материалов' : lang === 'kk' ? 'Кеңсе тауарлары мен материалдарға сұраныс' : 'Classroom Supplies & Materials Request'}
              </strong>
              {lang === 'ru'
                ? 'Выберите категорию или укажите предмет, требуемое количество и кабинет. Заведующий складом подготовит и доставит заказ.'
                : lang === 'kk'
                ? 'Қажетті санатты таңдаңыз немесе затты, санын және кабинетіңізді көрсетіңіз. Қойма меңгерушісі дайындап жеткізеді.'
                : 'Choose a category or specify the item, required quantity, and your room. The storage manager will prepare and deliver your request.'}
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

          {/* Storage: qty stepper + unit */}
          {department === 'storage' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px'
            }}>
              <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'flex-start' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    {t.tickets.quantity} *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, quantity: Math.max(1, (Number(p.quantity) || 1) - 1) }))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={{
                        ...inputStyle,
                        width: '64px',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '15px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, quantity: (Number(p.quantity) || 1) + 1 }))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={15} />
                    </button>

                    {/* Quick increment pills - shown to warehouse managers; hidden for teachers so they only order what they need */}
                    {canManageStock ? (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                        {[2, 5, 10].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, quantity: amt }))}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: formData.quantity === amt ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: formData.quantity === amt ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: formData.quantity === amt ? '#fbbf24' : '#94a3b8',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginLeft: '8px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>💡 {t.inventory?.orderOnlyNeeded || (lang === 'ru' ? 'Заказывайте только точное количество для уроков' : 'Order exact amount needed')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    {t.tickets.unit}
                  </label>
                  <input
                    type="text"
                    placeholder="пачка / pack / шт / box"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    style={{ ...inputStyle, padding: '8px 12px' }}
                  />
                  {/* Preset unit pills */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {['пачка (pack)', 'шт (pcs)', 'коробка (box)', 'набор (set)'].map(uStr => {
                      const uCode = uStr.split(' ')[0];
                      return (
                        <button
                          key={uStr}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, unit: uCode }))}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: formData.unit === uCode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: formData.unit === uCode ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: formData.unit === uCode ? '#fff' : '#94a3b8',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          {uStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stock availability indicator - visible only to Storage Manager, Engineer, and School Leadership */}
              {canAccessCatalog && matchedStockItem && (
                <div style={{
                  marginTop: '10px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: (Number(formData.quantity) || 1) <= matchedStockItem.quantity ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: (Number(formData.quantity) || 1) <= matchedStockItem.quantity ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {(Number(formData.quantity) || 1) <= matchedStockItem.quantity ? (
                    <>
                      <Check size={14} color="#10b981" />
                      <span style={{ color: '#10b981', fontWeight: '600' }}>
                        {lang === 'ru'
                          ? `✓ В наличии на складе: ${matchedStockItem.quantity} ${matchedStockItem.unit} (${matchedStockItem.location})`
                          : lang === 'kk'
                          ? `✓ Қоймада бар: ${matchedStockItem.quantity} ${matchedStockItem.unit}`
                          : `✓ In stock: ${matchedStockItem.quantity} ${matchedStockItem.unit} (${matchedStockItem.location})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} color="#f59e0b" />
                      <span style={{ color: '#fbbf24', fontWeight: '600' }}>
                        {lang === 'ru'
                          ? `⚠️ На складе сейчас ${matchedStockItem.quantity} ${matchedStockItem.unit}. Завхоз выдаст имеющееся и докупит остальное.`
                          : lang === 'kk'
                          ? `⚠️ Қоймада тек ${matchedStockItem.quantity} ${matchedStockItem.unit} бар. Қалғаны қосымша сатып алынады.`
                          : `⚠️ Only ${matchedStockItem.quantity} ${matchedStockItem.unit} in stock. Remainder will be ordered by storage manager.`}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Return Policy Selection & Temporary Loan Banner */}
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {t.tickets?.itemType || 'Warehouse Issue Policy'}
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsReturnableOverride(false)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: !isReturnable ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: !isReturnable ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: !isReturnable ? '#60a5fa' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: !isReturnable ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ {lang === 'ru' ? 'Выдача без возврата' : lang === 'kk' ? 'Қайтарымсыз' : 'Consumable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReturnableOverride(true)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: isReturnable ? '1.5px solid #f97316' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isReturnable ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: isReturnable ? '#fb923c' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: isReturnable ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      ⏱️ {lang === 'ru' ? 'На 1-2 урока (С возвратом)' : lang === 'kk' ? '1-2 сабаққа (Қайтару)' : 'On Loan (1-2 Lessons)'}
                    </button>
                  </div>
                </div>

                {/* Banner when returnable item is selected */}
                {isReturnable ? (
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.12)',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>⏱️</span>
                        <span>{t.tickets?.loanNoticeShort || 'Temporary Lesson Loan (Returnable)'}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: '#fed7aa', fontWeight: '600' }}>
                          {t.tickets?.loanDuration || 'Duration'}:
                        </span>
                        <select
                          value={formData.loanDuration || '1_lesson'}
                          onChange={e => setFormData(prev => ({ ...prev, loanDuration: e.target.value }))}
                          style={{
                            background: '#0f172a',
                            border: '1px solid rgba(249, 115, 22, 0.4)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            color: '#fff',
                            fontSize: '11px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="1_lesson">{t.tickets?.loan1Lesson || '1 Lesson (45 min)'}</option>
                          <option value="2_lessons">{t.tickets?.loan2Lessons || '2 Lessons (1.5 hours)'}</option>
                          <option value="full_day">{t.tickets?.loanFullDay || 'Full School Day'}</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.4 }}>
                      {t.tickets?.loanNotice || 'This item is issued temporarily for classroom use and must be returned to the warehouse manager after your lesson.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    {t.tickets?.consumableNotice || '✏️ Consumable supply: issued permanently to the teacher, no return to warehouse required.'}
                  </div>
                )}
              </div>
            </div>
          )}

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
                    background: 'var(--primary-tint, rgba(99, 102, 241, 0.15))',
                    border: '1px solid var(--border-color, rgba(99, 102, 241, 0.3))',
                    color: 'var(--primary, #4f46e5)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '700'
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
