import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../AppContext';
import {
  PlusCircle,
  X,
  Truck,
  Camera,
  ImagePlus,
  ArrowRight,
  Globe,
  User,
  Users,
  Package,
  Search,
  Minus,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';
import { CampusLocationSelector } from './CampusLocationSelector';
import { DEPARTMENTS, resolveDepartment, getSubcategories, isReturnableSubcategory } from '../departments';
import { translateText } from '../services/translator';
import { STORAGE_CATEGORIES, getCategoryMeta, getCategoryLabel } from '../storageCategories';
import { compressImageFile } from '../utils/imageCompressor';

export const TicketModal = ({ isOpen, onClose, initialDepartment = 'it_helpdesk', initialItem = '' }) => {
  const { 
    t, 
    addTicket, 
    inventory, 
    currentUser, 
    lang, 
    role, 
    isAuthenticated,
    customCategories,
    canAccessStorage,
    getAllowedCategoriesForRole
  } = useApp();

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
  const PRIMARY_DEPT_IDS = ['it_helpdesk', 'engineering', 'cleaning', 'storage'];
  const [showAllDepts, setShowAllDepts] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Synchronize department when modal opens or initialDepartment prop changes
  useEffect(() => {
    if (isOpen) {
      const resolved = resolveDepartment(initialDepartment);
      setDepartment(resolved.id);
      if (!PRIMARY_DEPT_IDS.includes(resolved.id)) {
        setShowAllDepts(true);
      } else {
        setShowAllDepts(false);
      }
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
  const canManageStock = Boolean(isAuthenticated && ['storage_manager', 'workerA', 'engineer', 'director', 'admin', 'facilities_manager'].includes(role));
  const canAccessCatalog = Boolean(isAuthenticated && ['storage_manager', 'workerA', 'engineer', 'director', 'admin', 'facilities_manager'].includes(role));
  const hasStorageAccess = canAccessStorage ? canAccessStorage(role) : true;

  const allowedCategoryIds = useMemo(() => {
    return getAllowedCategoriesForRole ? getAllowedCategoriesForRole(role) : [];
  }, [role, getAllowedCategoriesForRole]);

  const allAvailableCategories = useMemo(() => {
    return customCategories || STORAGE_CATEGORIES;
  }, [customCategories]);

  const visibleCategories = useMemo(() => {
    if (role === 'director' || role === 'admin' || role === 'storage_manager' || role === 'workerA' || role === 'facilities_manager' || role === 'engineer') {
      return allAvailableCategories;
    }
    return allAvailableCategories.filter(cat => allowedCategoryIds.includes(cat.id || cat.key));
  }, [allAvailableCategories, role, allowedCategoryIds]);

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

    // Filter by permitted categories for this role
    if (role !== 'director' && role !== 'admin' && role !== 'storage_manager' && role !== 'workerA') {
      items = items.filter(item => allowedCategoryIds.includes(item.category || 'other'));
    }

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
  }, [inventory, storageSelectedCategory, storageSearchTerm, role, allowedCategoryIds]);

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
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: 'var(--text-main)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease'
  };

  const stepBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '12px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="fluent-card animate-fade-in modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '24px 26px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '16px',
          margin: '0 auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-depth-16)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-tint)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '9px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
              <PlusCircle size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
                {t.tickets.createTitle}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Подача заявки: Родитель' : lang === 'kk' ? 'Өтінім беруші: Ата-ана' : 'Submitting as: School Parent')
                  : role === 'guest'
                  ? (lang === 'ru' ? 'Подача заявки: Гость школы' : lang === 'kk' ? 'Өтінім беруші: Мектеп қонағы' : 'Submitting as: Campus Guest')
                  : <><strong style={{ color: 'var(--text-main)' }}>{currentUser?.name || 'Staff'}</strong> • {currentUser?.department || 'Campus Staff'}</>}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Sender Details for Unregistered Guest / Parent */}
        {(!isAuthenticated || role === 'guest' || role === 'parent') && (
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: 'var(--primary)', 
              marginBottom: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              {role === 'parent' ? <Users size={15} /> : <User size={15} />}
              <span>
                {role === 'parent' 
                  ? (lang === 'ru' ? 'Контакты родителя и ученика' : lang === 'kk' ? 'Ата-ана мен оқушының байланыс деректері' : 'Your Contact Details')
                  : (lang === 'ru' ? 'Контактные данные посетителя' : lang === 'kk' ? 'Келушінің байланыс деректері' : 'Visitor Contact Details')}
              </span>
            </div>

            <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Ваше имя *' : lang === 'kk' ? 'Аты-жөніңіз *' : 'Your Name *'}
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
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {lang === 'ru' ? 'Телефон *' : lang === 'kk' ? 'Телефон *' : 'Phone Number *'}
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
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {lang === 'ru' ? 'Имя ученика и класс (напр. Алихан 4Б)' : lang === 'kk' ? 'Оқушының аты және сыныбы' : 'Student Name & Class (e.g. Alikhan 4B)'}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* ── STEP 1: CHOOSE SERVICE & TOPIC ─────────────────────────────── */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={stepBadgeStyle}>1</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {lang === 'ru' ? 'Какая помощь нужна?' : lang === 'kk' ? 'Қандай көмек қажет?' : 'What do you need help with?'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllDepts(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                {showAllDepts
                  ? (lang === 'ru' ? 'Скрыть доп. службы' : 'Hide extra departments')
                  : (lang === 'ru' ? '+ Другие службы (Мебель, Двор, Охрана...)' : '+ More departments')}
              </button>
            </div>

            {/* 4 Primary Services */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '8px', marginBottom: showAllDepts ? '10px' : '12px' }}>
              {departmentList.filter(d => PRIMARY_DEPT_IDS.includes(d.id)).map(dept => {
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
                      padding: '12px 10px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-tint)' : 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>{dept.emoji}</span>
                    <span style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '600', color: isSelected ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.2 }}>
                      {deptTitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Extended Departments if toggled */}
            {showAllDepts && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', padding: '10px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                {departmentList.filter(d => !PRIMARY_DEPT_IDS.includes(d.id)).map(dept => {
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
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--primary-tint)' : 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{dept.emoji}</span>
                      <span style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '600', color: isSelected ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {deptTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick-Select Subcategory Pills */}
            {activeDeptObj && activeDeptObj.subcategories && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {lang === 'ru' ? 'Быстрый выбор частой проблемы (или впишите свою ниже):' : lang === 'kk' ? 'Жиі кездесетін мәселені таңдаңыз:' : 'Quick-select common request (or type below):'}
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
                          background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontWeight: isSelected ? '600' : '500',
                          padding: '6px 11px',
                          borderRadius: '20px',
                          fontSize: '12px',
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
          </div>

          {/* Storage Restricted Notice */}
          {department === 'storage' && !hasStorageAccess && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              color: 'var(--danger)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>
                {lang === 'ru'
                  ? 'Заказ со склада отключен для вашей роли директором школы.'
                  : 'Storage catalog access is restricted for your role by the School Director.'}
              </span>
            </div>
          )}

          {/* Warehouse Catalog Picker (for authorized roles) */}
          {department === 'storage' && canAccessCatalog && (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '12px', fontWeight: '700' }}>
                  <Package size={16} />
                  <span>
                    {canManageStock 
                      ? (lang === 'ru' ? 'Каталог школьного склада:' : 'School Warehouse Catalog:')
                      : (lang === 'ru' ? 'Каталог канцелярии и материалов:' : 'Stationery & Supplies Catalog:')
                    }
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {canManageStock
                    ? `${(inventory || []).length} ${lang === 'ru' ? 'позиций' : 'items'}`
                    : (lang === 'ru' ? 'Нажмите для выбора' : 'Click item to select')}
                </span>
              </div>

              {/* Search in Warehouse Catalog */}
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder={lang === 'ru' ? 'Поиск по складу (бумага, маркеры, кабель...)' : 'Search warehouse supplies...'}
                  value={storageSearchTerm}
                  onChange={e => setStorageSearchTerm(e.target.value)}
                  style={{
                    ...inputStyle,
                    padding: '8px 12px 8px 34px',
                    fontSize: '12px'
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
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStorageSelectedCategory('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    border: storageSelectedCategory === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: storageSelectedCategory === 'all' ? '700' : '500',
                    background: storageSelectedCategory === 'all' ? 'var(--primary)' : 'var(--bg-card)',
                    color: storageSelectedCategory === 'all' ? '#ffffff' : 'var(--text-main)'
                  }}
                >
                  {t.inventory?.allCategories || 'All'} {canManageStock ? `(${(inventory || []).length})` : ''}
                </button>
                {visibleCategories.map(cat => {
                  const count = (inventory || []).filter(i => (i.category || 'other') === cat.id).length;
                  if (count === 0 && !canManageStock) return null;
                  const isCatActive = storageSelectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStorageSelectedCategory(cat.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '14px',
                        fontSize: '11px',
                        border: isCatActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: isCatActive ? '700' : '500',
                        background: isCatActive ? 'var(--primary)' : 'var(--bg-card)',
                        color: isCatActive ? '#ffffff' : 'var(--text-main)'
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                gap: '8px',
                maxHeight: '150px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {filteredInventory.map(item => {
                  const isSelected = formData.itemTitle === item.name;
                  const isOut = item.quantity === 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectCatalogItem(item)}
                      style={{
                        background: isSelected ? 'var(--primary-tint)' : 'var(--bg-card)',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '10px',
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
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{getCategoryMeta(item.category).icon}</span>
                        <div style={{ fontSize: '11px', fontWeight: isSelected ? '700' : '600', color: isSelected ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.25 }}>
                          {isSelected ? '✓ ' : ''}{item.name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          background: isOut ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isOut ? 'var(--danger)' : 'var(--success)'
                        }}>
                          {canManageStock
                            ? (isOut ? (lang === 'ru' ? 'Под заказ' : 'Out of stock') : `${item.quantity} ${item.unit}`)
                            : (isOut ? (lang === 'ru' ? 'Под заказ' : 'Out of stock') : (lang === 'ru' ? '✓ В наличии' : '✓ In Stock'))}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: LOCATION ───────────────────────────────────────────── */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={stepBadgeStyle}>2</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                {lang === 'ru' ? 'Где это находится? (Кабинет / Зона)' : lang === 'kk' ? 'Қай жерде? (Кабинет / Аймақ)' : 'Where is it located?'}
              </span>
            </div>

            <CampusLocationSelector
              value={formData.roomNumber}
              onChange={val => setFormData(prev => ({ ...prev, roomNumber: val }))}
              department={department}
              t={t}
            />

            {/* Facilities furniture relocation fields */}
            {department === 'facilities' && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={14} /> {t.tickets.moveDetailsTitle}
                </div>
                <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
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
          </div>

          {/* ── STEP 3: REQUEST DETAILS ────────────────────────────────────── */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={stepBadgeStyle}>3</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                {lang === 'ru' ? 'Детали заявки' : lang === 'kk' ? 'Өтінім мәліметтері' : 'Request Details'}
              </span>
            </div>

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

            {/* Storage: Clean Quantity + Unit + Borrow Toggle */}
            {department === 'storage' && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  {/* Quantity Stepper */}
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                      {t.tickets.quantity} *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, quantity: Math.max(1, (Number(p.quantity) || 1) - 1) }))}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        style={{
                          ...inputStyle,
                          width: '60px',
                          padding: '6px',
                          textAlign: 'center',
                          fontWeight: '700',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, quantity: (Number(p.quantity) || 1) + 1 }))}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Unit Selector */}
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                      {t.tickets.unit}
                    </label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {[
                        { code: 'pcs', label: lang === 'ru' ? 'шт' : 'pcs' },
                        { code: 'pack', label: lang === 'ru' ? 'пачка' : 'pack' },
                        { code: 'box', label: lang === 'ru' ? 'коробка' : 'box' },
                        { code: 'set', label: lang === 'ru' ? 'набор' : 'set' }
                      ].map(u => {
                        const active = formData.unit === u.code;
                        return (
                          <button
                            key={u.code}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, unit: u.code }))}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: active ? 'var(--primary)' : 'var(--bg-subtle)',
                              border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                              color: active ? '#ffffff' : 'var(--text-main)',
                              fontSize: '12px',
                              fontWeight: active ? '700' : '500',
                              cursor: 'pointer'
                            }}
                          >
                            {u.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Simple Consumable vs Lesson Loan Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsReturnableOverride(false)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: !isReturnable ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                        background: !isReturnable ? 'var(--primary-tint)' : 'var(--bg-subtle)',
                        color: !isReturnable ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: !isReturnable ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ {lang === 'ru' ? 'Расходник (без возврата)' : lang === 'kk' ? 'Қайтарымсыз' : 'Keep (Consumable)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReturnableOverride(true)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: isReturnable ? '1.5px solid var(--warning)' : '1px solid var(--border-color)',
                        background: isReturnable ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-subtle)',
                        color: isReturnable ? 'var(--warning)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: isReturnable ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      ⏱️ {lang === 'ru' ? 'На 1–2 урока (с возвратом)' : lang === 'kk' ? '1–2 сабаққа (қайтарумен)' : 'Borrow (1–2 Lessons)'}
                    </button>
                  </div>

                  {isReturnable && (
                    <select
                      value={formData.loanDuration || '1_lesson'}
                      onChange={e => setFormData(prev => ({ ...prev, loanDuration: e.target.value }))}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        color: 'var(--text-main)',
                        fontSize: '11px',
                        fontWeight: '600',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="1_lesson">{t.tickets?.loan1Lesson || '1 Lesson (45 min)'}</option>
                      <option value="2_lessons">{t.tickets?.loan2Lessons || '2 Lessons (1.5 hours)'}</option>
                      <option value="full_day">{t.tickets?.loanFullDay || 'Full School Day'}</option>
                    </select>
                  )}
                </div>

                {/* Stock availability indicator for warehouse staff */}
                {canAccessCatalog && matchedStockItem && (
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: (Number(formData.quantity) || 1) <= matchedStockItem.quantity ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: (Number(formData.quantity) || 1) <= matchedStockItem.quantity ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: (Number(formData.quantity) || 1) <= matchedStockItem.quantity ? 'var(--success)' : 'var(--warning)',
                    fontWeight: '600'
                  }}>
                    <Check size={14} />
                    <span>
                      {lang === 'ru'
                        ? `На складе: ${matchedStockItem.quantity} ${matchedStockItem.unit}`
                        : `In stock: ${matchedStockItem.quantity} ${matchedStockItem.unit}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {t.tickets.description} <span style={{ fontWeight: '400', fontSize: '11px' }}>({lang === 'ru' ? 'необязательно' : 'optional'})</span>
                </label>
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
                      background: 'var(--primary-tint)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary)',
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
                    {isTranslatingPreview ? (t.translator?.translating || 'Translating...') : (t.translator?.translateDescForEngineer || '🇷🇺 Translate to Russian')}
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
                  background: 'var(--primary-tint)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                    🇷🇺 Russian translation for staff:
                  </span>
                  <span style={{ fontStyle: 'italic' }}>
                    "{translatedPreview}"
                  </span>
                </div>
              )}
            </div>

            {/* Compact Photo Upload Row */}
            <div>
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {photos.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                      <img src={src} alt={`photo-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(15,23,42,0.85)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={11} color="#ffffff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      color: 'var(--text-main)',
                      fontWeight: '600',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={15} color="var(--primary)" />
                    {lang === 'ru' ? 'Сделать фото' : 'Take Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      color: 'var(--text-main)',
                      fontWeight: '600',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <ImagePlus size={15} color="var(--primary)" />
                    {lang === 'ru' ? 'Прикрепить фото' : 'Attach Image'}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'ru' ? '(до 5 фото, необязательно)' : '(optional)'}
                  </span>
                </div>
              )}

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
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="fluent-btn-secondary"
              style={{ minWidth: '96px', height: '40px', borderRadius: '10px' }}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="fluent-btn-primary"
              style={{ minWidth: '150px', height: '40px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
            >
              <span>{t.tickets.submit}</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
