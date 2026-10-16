import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../AppContext';
import { 
  Plus, 
  MapPin, 
  Search, 
  Layers, 
  List, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Filter,
  Camera,
  ImagePlus,
  Image as ImageIcon,
  Eye,
  X,
  Maximize2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { STORAGE_CATEGORIES, getCategoryMeta, getCategoryLabel } from '../storageCategories';
import { compressImageFile, compressMultipleImageFiles } from '../utils/imageCompressor';

export const InventoryManager = ({ onOpenNewTicket }) => {
  const { 
    t, 
    inventory, 
    addInventoryItem, 
    updateInventoryQty, 
    addPhotosToInventoryItem, 
    role, 
    lang,
    tickets,
    confirmTicketReturn,
    currentUser
  } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ok' | 'low' | 'out'
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'table'
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Lightbox preview for full photo
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Hidden file inputs for adding photos
  const newItemFileRef = useRef(null);
  const newItemCameraRef = useRef(null);
  const existingItemFileRef = useRef(null);
  const existingItemCameraRef = useRef(null);
  const [targetItemForPhoto, setTargetItemForPhoto] = useState(null);
  const [confirmingLoanId, setConfirmingLoanId] = useState(null);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'stationary',
    quantity: 10,
    unit: 'pcs',
    minLevel: 5,
    location: 'Storage Cabinet 102 - Shelf A',
    photos: [],
    isReturnable: false
  });

  const canManageStock = role === 'storage_manager' || 
                         role === 'engineer' || 
                         role === 'facilities_manager' ||
                         role === 'director' || 
                         role === 'workerA' || 
                         role === 'admin';

  // Handle category change in Add Modal with smart location suggestion & loan policy
  const handleCategoryChange = (catId) => {
    const meta = getCategoryMeta(catId);
    setNewItem(prev => ({
      ...prev,
      category: catId,
      location: meta.defaultLocation || prev.location,
      isReturnable: catId === 'stationary_loan' ? true : (catId === 'stationary' ? false : prev.isReturnable)
    }));
  };

  const handleOpenAddModal = (presetCategory = null) => {
    const cat = presetCategory || (selectedCategory !== 'all' ? selectedCategory : 'stationary');
    const meta = getCategoryMeta(cat);
    setNewItem({
      name: '',
      category: cat,
      quantity: 10,
      unit: 'pcs',
      minLevel: 5,
      location: meta.defaultLocation || 'Storage Cabinet 102 - Shelf A',
      photos: [],
      isReturnable: cat === 'stationary_loan'
    });
    setShowAddModal(true);
  };

  // Handle uploading photos for new stock item
  const handleNewItemPhotoUpload = async (files) => {
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    try {
      const remainingSlots = 3 - (newItem.photos || []).length;
      if (remainingSlots <= 0) return;
      const compressedList = await compressMultipleImageFiles(files, remainingSlots);
      setNewItem(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...compressedList]
      }));
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveNewItemPhoto = (index) => {
    setNewItem(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  // Handle uploading photos to an existing item in DB
  const handleTriggerAddPhotoToExisting = (item, useCamera = false) => {
    setTargetItemForPhoto(item);
    if (useCamera && existingItemCameraRef.current) {
      existingItemCameraRef.current.click();
    } else if (existingItemFileRef.current) {
      existingItemFileRef.current.click();
    }
  };

  const handleExistingItemPhotoSelected = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !targetItemForPhoto) return;
    setIsCompressing(true);
    try {
      const compressedList = await compressMultipleImageFiles(files, 3);
      if (compressedList.length > 0) {
        addPhotosToInventoryItem(targetItemForPhoto.id, compressedList);
      }
    } catch (err) {
      console.error('Error compressing existing item photo:', err);
    } finally {
      setIsCompressing(false);
      setTargetItemForPhoto(null);
      e.target.value = '';
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    addInventoryItem({
      ...newItem,
      name: newItem.name.trim(),
      quantity: Number(newItem.quantity) || 0,
      minLevel: Number(newItem.minLevel) || 5,
      photos: newItem.photos || [],
      isReturnable: Boolean(newItem.isReturnable)
    });
    setShowAddModal(false);
  };

  // Active Lesson Loans: temporary items currently issued to teachers for 1-2 lessons
  const activeLoans = useMemo(() => {
    return (tickets || []).filter(ticket => 
      Boolean(ticket.isReturnable) && 
      (ticket.returnStatus === 'borrowed' || ticket.returnStatus === 'returned_by_teacher')
    );
  }, [tickets]);

  const awaitingConfirmationCount = useMemo(() => {
    return activeLoans.filter(t => t.returnStatus === 'returned_by_teacher').length;
  }, [activeLoans]);

  const handleConfirmReturn = async (ticketId) => {
    setConfirmingLoanId(ticketId);
    try {
      await confirmTicketReturn(ticketId);
    } catch (err) {
      console.error('Error confirming return from inventory manager:', err);
    } finally {
      setConfirmingLoanId(null);
    }
  };

  // Group inventory items by category
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const cat of STORAGE_CATEGORIES) {
      stats[cat.id] = {
        count: 0,
        totalQty: 0,
        lowStock: 0,
        outOfStock: 0
      };
    }

    for (const item of (inventory || [])) {
      const catId = item.category || 'other';
      if (!stats[catId]) {
        stats[catId] = { count: 0, totalQty: 0, lowStock: 0, outOfStock: 0 };
      }
      stats[catId].count += 1;
      stats[catId].totalQty += (Number(item.quantity) || 0);
      if (item.quantity === 0) {
        stats[catId].outOfStock += 1;
      } else if (item.quantity <= item.minLevel) {
        stats[catId].lowStock += 1;
      }
    }

    return stats;
  }, [inventory]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const list = inventory || [];
    const totalItems = list.length;
    const totalQty = list.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const lowStockCount = list.filter(i => i.quantity > 0 && i.quantity <= i.minLevel).length;
    const outOfStockCount = list.filter(i => i.quantity === 0).length;
    return { totalItems, totalQty, lowStockCount, outOfStockCount };
  }, [inventory]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return (inventory || []).filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && (item.category || 'other') !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'out' && item.quantity > 0) return false;
      if (statusFilter === 'low' && (item.quantity === 0 || item.quantity > item.minLevel)) return false;
      if (statusFilter === 'ok' && item.quantity <= item.minLevel) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(term);
        const matchesCat = (item.category || '').toLowerCase().includes(term);
        const matchesLoc = (item.location || '').toLowerCase().includes(term);
        const catLabel = getCategoryLabel(item.category, lang).toLowerCase();
        const matchesLabel = catLabel.includes(term);
        if (!matchesName && !matchesCat && !matchesLoc && !matchesLabel) {
          return false;
        }
      }

      return true;
    });
  }, [inventory, selectedCategory, statusFilter, searchTerm, lang]);

  // Divided / Grouped Items
  const groupedCategories = useMemo(() => {
    const activeCats = selectedCategory === 'all' 
      ? STORAGE_CATEGORIES 
      : STORAGE_CATEGORIES.filter(c => c.id === selectedCategory);

    return activeCats.map(cat => {
      const items = filteredInventory.filter(item => (item.category || 'other') === cat.id);
      return {
        ...cat,
        items,
        totalItems: items.length,
        totalUnits: items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
        lowStockItems: items.filter(i => i.quantity <= i.minLevel)
      };
    }).filter(group => {
      if (searchTerm.trim() || statusFilter !== 'all') {
        return group.items.length > 0;
      }
      return group.items.length > 0 || (categoryStats[group.id]?.count > 0);
    });
  }, [selectedCategory, filteredInventory, searchTerm, statusFilter, categoryStats]);

  const getStockStatusBadge = (qty, minLevel) => {
    if (qty === 0) {
      return (
        <span style={{ 
          background: 'rgba(239, 68, 68, 0.18)', 
          color: '#f87171', 
          border: '1px solid rgba(239, 68, 68, 0.35)',
          padding: '3px 8px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ● {t.inventory.statusOut}
        </span>
      );
    }
    if (qty <= minLevel) {
      return (
        <span style={{ 
          background: 'rgba(245, 158, 11, 0.18)', 
          color: '#fbbf24', 
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '3px 8px', 
          borderRadius: '12px', 
          fontSize: '11px', 
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⚠️ {t.inventory.statusLow}
        </span>
      );
    }
    return (
      <span style={{ 
        background: 'rgba(16, 185, 129, 0.15)', 
        color: '#34d399', 
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '3px 8px', 
        borderRadius: '12px', 
        fontSize: '11px', 
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        ✓ {t.inventory.statusOk}
      </span>
    );
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Hidden file inputs for adding photo to existing items */}
      <input
        type="file"
        ref={existingItemFileRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleExistingItemPhotoSelected}
      />
      <input
        type="file"
        ref={existingItemCameraRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleExistingItemPhotoSelected}
      />

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
              {canManageStock 
                ? t.inventory.title 
                : (t.inventory.teacherCatalogTitle || (lang === 'ru' ? 'Каталог канцтоваров и материалов' : 'School Stationery Catalog'))}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {canManageStock
              ? (lang === 'ru' 
                  ? 'База данных склада с фотографиями товаров, разделенная по категориям: канцелярия, маркетинг, мебель и др.'
                  : lang === 'kk'
                  ? 'Тауар суреттері бар санатталған қойма дерекқоры: кеңсе, маркетинг, жиһаз, электроника т.б.'
                  : 'Warehouse database with photo proof partitioned into categories: stationery, marketing, furniture, etc.')
              : (t.inventory.teacherCatalogSubtitle || (lang === 'ru'
                  ? 'Ознакомьтесь с доступными канцтоварами для уроков и закажите нужное в кабинет.'
                  : 'Browse classroom supplies and request items needed for your lessons.'))}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View mode toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setViewMode('grouped')}
              title={t.inventory.viewGrouped || 'Grouped by Category'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'grouped' ? '700' : '500',
                background: viewMode === 'grouped' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: viewMode === 'grouped' ? '#fbbf24' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={14} />
              <span>{t.inventory.viewGrouped || 'By Category'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title={t.inventory.viewTable || 'All Items Table'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: viewMode === 'table' ? '700' : '500',
                background: viewMode === 'table' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: viewMode === 'table' ? '#fbbf24' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={14} />
              <span>{t.inventory.viewTable || 'Table View'}</span>
            </button>
          </div>

          {canManageStock && (
            <button
              onClick={() => handleOpenAddModal()}
              className="fluent-btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600'
              }}
            >
              <Plus size={16} /> <span>{t.inventory.addItem}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Lesson Loans Banner / Tracker (Shown only to warehouse managers) */}
      {canManageStock && activeLoans.length > 0 && (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)',
          border: '1.5px solid rgba(249, 115, 22, 0.45)',
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(249, 115, 22, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                ⏱️
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>
                    {t.tickets?.activeLoans || (lang === 'ru' ? 'Активные временные выдачи на уроки' : lang === 'kk' ? 'Сабаққа уақытша берілген заттар' : 'Active Lesson Loans')}
                  </h3>
                  <span style={{
                    background: '#f97316',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {activeLoans.length} {lang === 'ru' ? 'предметов на руках' : 'on loan'}
                  </span>
                  {awaitingConfirmationCount > 0 && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ⏳ {awaitingConfirmationCount} {lang === 'ru' ? 'ожидают приемки' : 'awaiting confirmation'}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {lang === 'ru'
                    ? 'Канцелярия и оборудование, выданные учителям на 1-2 урока. После возврата учителем завсклад подтверждает получение, и количество автоматически возвращается на склад.'
                    : lang === 'kk'
                    ? 'Мұғалімдерге 1-2 сабаққа берілген кеңсе заттары. Мұғалім қайтарған соң қоймашы қабылдайды және қалдық автоматты түрде қоймаға қайтарылады.'
                    : 'Stationery and equipment issued to teachers for 1-2 lessons. Once returned, storage manager confirms receipt and stock is automatically restored.'}
                </p>
              </div>
            </div>
          </div>

          {/* List of active loans */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '10px' }}>
            {activeLoans.map(loan => {
              const isReturnedByTeacher = loan.returnStatus === 'returned_by_teacher';
              const isConfirming = confirmingLoanId === loan.id;

              return (
                <div
                  key={loan.id}
                  style={{
                    background: isReturnedByTeacher ? 'rgba(34, 197, 94, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                    border: isReturnedByTeacher ? '1.5px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '13px' }}>
                        {loan.itemTitle || loan.title}
                        {loan.quantity > 1 && <span style={{ color: '#fbbf24', marginLeft: '4px' }}>×{loan.quantity}</span>}
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: isReturnedByTeacher ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                        color: isReturnedByTeacher ? '#4ade80' : '#fb923c',
                        border: isReturnedByTeacher ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(249, 115, 22, 0.35)',
                        whiteSpace: 'nowrap'
                      }}>
                        {isReturnedByTeacher 
                          ? (lang === 'ru' ? '⏳ Учитель вернул' : lang === 'kk' ? '⏳ Қайтарылды' : '⏳ Teacher Returned') 
                          : (lang === 'ru' ? '⏱️ На уроке' : lang === 'kk' ? '⏱️ Сабақта' : '⏱️ In Class')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>👤 <strong>{loan.userName}</strong></span>
                      {loan.room && <span>🚪 {loan.room}</span>}
                      {loan.loanDuration && (
                        <span style={{ color: '#fbbf24' }}>
                          ⌛ {loan.loanDuration === '1_lesson' ? '1 lesson (45m)' : loan.loanDuration === '2_lessons' ? '2 lessons (90m)' : loan.loanDuration}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {loan.borrowedAt ? new Date(loan.borrowedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (loan.createdAt ? new Date(loan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                    </span>

                    {canManageStock && (
                      <button
                        type="button"
                        disabled={isConfirming}
                        onClick={() => handleConfirmReturn(loan.id)}
                        style={{
                          background: isReturnedByTeacher ? '#16a34a' : 'rgba(249, 115, 22, 0.25)',
                          border: isReturnedByTeacher ? '1px solid #22c55e' : '1px solid rgba(249, 115, 22, 0.5)',
                          color: '#fff',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title={lang === 'ru' ? 'Подтвердить получение и вернуть остаток на склад' : 'Confirm return and restore stock'}
                      >
                        <CheckCircle2 size={12} />
                        <span>{isConfirming ? '...' : (t.tickets?.confirmReturn || (lang === 'ru' ? 'Принять на склад' : 'Confirm Return'))}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Overview Cards Carousel / Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t.inventory.categoryOverview || 'Warehouse Categories Overview'}
          </div>
          {canManageStock ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ color: '#fff', fontWeight: '700' }}>{overallTotals.totalItems}</span> {t.inventory.itemsCount || 'items'} ({overallTotals.totalQty} total units)
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              <span>💡 {t.inventory?.orderOnlyNeeded || (lang === 'ru' ? 'Заказывайте ровно столько, сколько нужно для уроков' : 'Order only what is needed')}</span>
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '10px'
        }}>
          {/* "All Categories" summary card */}
          <div
            onClick={() => setSelectedCategory('all')}
            style={{
              background: selectedCategory === 'all' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(30, 41, 59, 0.6)',
              border: selectedCategory === 'all' ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>📁</span>
              {canManageStock && (
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  background: 'rgba(255,255,255,0.1)', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '10px' 
                }}>
                  {overallTotals.totalItems}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: selectedCategory === 'all' ? '#fbbf24' : '#fff' }}>
                {t.inventory.allCategories || 'All Categories'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {canManageStock 
                  ? `${STORAGE_CATEGORIES.length} ${lang === 'ru' ? 'категорий' : lang === 'kk' ? 'санат' : 'divisions'}`
                  : (lang === 'ru' ? 'Все разделы каталога' : lang === 'kk' ? 'Барлық санаттар' : 'All Catalog Sections')}
              </div>
            </div>
          </div>

          {/* Individual Category cards */}
          {STORAGE_CATEGORIES.map(cat => {
            const st = categoryStats[cat.id] || { count: 0, totalQty: 0, lowStock: 0, outOfStock: 0 };
            const isSelected = selectedCategory === cat.id;
            const hasAlert = st.lowStock > 0 || st.outOfStock > 0;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                style={{
                  background: isSelected ? cat.bgColor : 'rgba(30, 41, 59, 0.55)',
                  border: isSelected ? `2px solid ${cat.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: isSelected ? `0 4px 20px ${cat.bgColor}` : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                  {canManageStock && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {hasAlert && (
                        <span title={lang === 'ru' ? 'Есть позиции с низким остатком' : 'Low stock items present'} style={{ fontSize: '10px' }}>
                          ⚠️
                        </span>
                      )}
                      {cat.id === 'stationary_loan' && activeLoans.length > 0 && (
                        <span 
                          title={lang === 'ru' ? `${activeLoans.length} предметов сейчас на руках у учителей` : `${activeLoans.length} items currently on loan with teachers`}
                          style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            background: 'rgba(249, 115, 22, 0.25)',
                            color: '#fb923c',
                            border: '1px solid rgba(249, 115, 22, 0.4)',
                            padding: '1px 5px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          ⏱️ {activeLoans.length}
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        background: 'rgba(255,255,255,0.08)', 
                        color: cat.color, 
                        padding: '2px 8px', 
                        borderRadius: '10px' 
                      }}>
                        {st.count}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    color: isSelected ? cat.color : '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {getCategoryLabel(cat.id, lang, true)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {canManageStock 
                      ? `${st.totalQty} ${lang === 'ru' ? 'шт / ед.' : lang === 'kk' ? 'дана' : 'units'}`
                      : (cat.isReturnable 
                          ? (lang === 'ru' ? '⏱️ На 1-2 урока' : lang === 'kk' ? '⏱️ 1-2 сабаққа' : '⏱️ 1-2 Lessons Loan')
                          : (lang === 'ru' ? '✏️ Выдача в кабинет' : lang === 'kk' ? '✏️ Кабинетке' : '✏️ Consumable'))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Category Pill Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: selectedCategory === 'all' ? '700' : '500',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedCategory === 'all' ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)',
              color: selectedCategory === 'all' ? '#0f172a' : '#cbd5e1',
              transition: 'all 0.15s ease'
            }}
          >
            📁 {t.inventory.allCategories || 'All Categories'} {canManageStock ? `(${overallTotals.totalItems})` : ''}
          </button>

          {STORAGE_CATEGORIES.map(cat => {
            const count = categoryStats[cat.id]?.count || 0;
            const isCatActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isCatActive ? 'all' : cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isCatActive ? '700' : '500',
                  border: isCatActive ? `1px solid ${cat.color}` : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: isCatActive ? cat.color : 'rgba(255, 255, 255, 0.08)',
                  color: isCatActive ? '#fff' : '#cbd5e1',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{cat.icon}</span>
                <span>{getCategoryLabel(cat.id, lang, true)}</span>
                {canManageStock && (
                  <span style={{ 
                    background: isCatActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.12)', 
                    padding: '1px 6px', 
                    borderRadius: '10px', 
                    fontSize: '10px' 
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.inventory.searchPlaceholder || 'Search storage items, categories or shelf locations...'}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Stock Status Pills */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> {lang === 'ru' ? 'Статус:' : lang === 'kk' ? 'Күйі:' : 'Stock:'}
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'all' ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: statusFilter === 'all' ? '#fff' : 'var(--text-muted)',
                fontWeight: statusFilter === 'all' ? '700' : 'normal'
              }}
            >
              {lang === 'ru' ? 'Все' : 'All'}
            </button>
            <button
              onClick={() => setStatusFilter('ok')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'ok' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                color: statusFilter === 'ok' ? '#34d399' : 'var(--text-muted)',
                fontWeight: statusFilter === 'ok' ? '700' : 'normal'
              }}
            >
              {t.inventory.statusOk}
            </button>
            {canManageStock && (
              <>
                <button
                  onClick={() => setStatusFilter('low')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === 'low' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                    color: statusFilter === 'low' ? '#fbbf24' : 'var(--text-muted)',
                    fontWeight: statusFilter === 'low' ? '700' : 'normal'
                  }}
                >
                  ⚠️ {t.inventory.statusLow} ({overallTotals.lowStockCount})
                </button>
                <button
                  onClick={() => setStatusFilter('out')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === 'out' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                    color: statusFilter === 'out' ? '#f87171' : 'var(--text-muted)',
                    fontWeight: statusFilter === 'out' ? '700' : 'normal'
                  }}
                >
                  ● {t.inventory.statusOut} ({overallTotals.outOfStockCount})
                </button>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Main View: Divided Grouped Sections or Flat Table */}
      {viewMode === 'grouped' ? (
        /* ================= GROUPED BY CATEGORY VIEW ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groupedCategories.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                {t.inventory.noItemsInCategory || 'No items match your filter criteria.'}
              </p>
            </div>
          ) : (
            groupedCategories.map(cat => (
              <div 
                key={cat.id} 
                className="glass-panel" 
                style={{ 
                  padding: '0', 
                  overflow: 'hidden',
                  border: `1px solid ${cat.borderColor || 'var(--border-color)'}`
                }}
              >
                {/* Category Section Header */}
                <div style={{
                  padding: '16px 20px',
                  background: cat.bgColor || 'rgba(15, 23, 42, 0.6)',
                  borderBottom: `1px solid ${cat.borderColor || 'var(--border-color)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      border: `1px solid ${cat.borderColor || 'rgba(255,255,255,0.1)'}`
                    }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0 }}>
                          {getCategoryLabel(cat.id, lang)}
                        </h3>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: cat.color,
                          color: '#fff'
                        }}>
                          {cat.items.length} {t.inventory.itemsCount || 'items'}
                        </span>
                        {cat.lowStockItems.length > 0 && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: 'rgba(245, 158, 11, 0.25)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                          }}>
                            ⚠️ {cat.lowStockItems.length} {t.inventory.lowStockWarning || 'low stock'}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        {cat.description?.[lang] || cat.description?.en || `Storage location: ${cat.defaultLocation}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {canManageStock && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {t.inventory.totalQuantity || 'Total Stock'}: <strong style={{ color: '#fff' }}>{cat.totalUnits}</strong>
                      </span>
                    )}

                    {canManageStock && (
                      <button
                        onClick={() => handleOpenAddModal(cat.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={14} />
                        <span>{t.inventory.addToCategory || 'Add to category'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Items Table */}
                {cat.items.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {t.inventory.noItemsInCategory || 'No items cataloged in this category.'}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 20px' }}>{t.inventory.itemName}</th>
                          {canManageStock ? (
                            <>
                              <th style={{ padding: '12px 20px' }}>{t.inventory.inStock}</th>
                              <th style={{ padding: '12px 20px' }}>Status</th>
                            </>
                          ) : (
                            <th style={{ padding: '12px 20px' }}>{t.inventory.availability || 'Availability'}</th>
                          )}
                          <th style={{ padding: '12px 20px' }}>{t.inventory.location}</th>
                          <th style={{ padding: '12px 20px', textAlign: 'right' }}>{t.inventory.actions || 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, idx) => {
                          const hasPhotos = item.photos && item.photos.length > 0;
                          return (
                            <tr 
                              key={item.id} 
                              style={{ 
                                borderBottom: idx !== cat.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <td style={{ padding: '14px 20px', fontWeight: '600', color: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {/* Item Photo Thumbnail */}
                                  <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
                                    {hasPhotos ? (
                                      <div 
                                        onClick={() => setPreviewPhoto({
                                          url: item.photos[0],
                                          name: item.name,
                                          category: item.category,
                                          location: item.location
                                        })}
                                        title={t.inventory.viewPhoto || 'Click to view photo'}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          borderRadius: '8px',
                                          overflow: 'hidden',
                                          border: '1.5px solid rgba(255, 255, 255, 0.15)',
                                          cursor: 'pointer',
                                          background: 'rgba(15, 23, 42, 0.8)',
                                          position: 'relative'
                                        }}
                                      >
                                        <img 
                                          src={item.photos[0]} 
                                          alt={item.name} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                        {item.photos.length > 1 && (
                                          <span style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '2px',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            fontSize: '9px',
                                            padding: '1px 3px',
                                            borderRadius: '4px',
                                            fontWeight: '700'
                                          }}>
                                            +{item.photos.length - 1}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div 
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          borderRadius: '8px',
                                          background: cat.bgColor,
                                          border: `1px dashed ${cat.borderColor}`,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '18px',
                                          color: 'var(--text-muted)'
                                        }}
                                        title={lang === 'ru' ? 'Нет фото (нажмите + Фото для добавления)' : 'No photo attached'}
                                      >
                                        {cat.icon}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div style={{ color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span>{item.name}</span>
                                      {item.isReturnable || item.category === 'stationary_loan' ? (
                                        <span style={{
                                          fontSize: '10px',
                                          fontWeight: '700',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          background: 'rgba(249, 115, 22, 0.15)',
                                          color: '#fb923c',
                                          border: '1px solid rgba(249, 115, 22, 0.3)'
                                        }}>
                                          ⏱️ {lang === 'ru' ? 'На 1-2 урока (С возвратом)' : lang === 'kk' ? '1-2 сабаққа (Қайтарылады)' : 'Loan (1-2 Lessons)'}
                                        </span>
                                      ) : (
                                        <span style={{
                                          fontSize: '10px',
                                          fontWeight: '600',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          background: 'rgba(59, 130, 246, 0.12)',
                                          color: '#60a5fa',
                                          border: '1px solid rgba(59, 130, 246, 0.25)'
                                        }}>
                                          ✏️ {lang === 'ru' ? 'Расходный' : lang === 'kk' ? 'Шығыс' : 'Consumable'}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                      {hasPhotos && (
                                        <span style={{ fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                          <ImageIcon size={10} /> {item.photos.length} {lang === 'ru' ? 'фото в БД' : 'photo in DB'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {canManageStock ? (
                                <>
                                  <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '14px' }}>
                                    {item.quantity} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.unit}</span>
                                  </td>

                                  <td style={{ padding: '14px 20px' }}>
                                    {getStockStatusBadge(item.quantity, item.minLevel)}
                                  </td>
                                </>
                              ) : (
                                <td style={{ padding: '14px 20px' }}>
                                  {item.quantity > 0 ? (
                                    <span style={{ 
                                      background: 'rgba(16, 185, 129, 0.15)', 
                                      color: '#34d399', 
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      padding: '3px 8px', 
                                      borderRadius: '12px', 
                                      fontSize: '11px', 
                                      fontWeight: '700',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      ✓ {t.inventory.available || (lang === 'ru' ? 'В наличии' : 'In Stock')}
                                    </span>
                                  ) : (
                                    <span style={{ 
                                      background: 'rgba(239, 68, 68, 0.15)', 
                                      color: '#f87171', 
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      padding: '3px 8px', 
                                      borderRadius: '12px', 
                                      fontSize: '11px', 
                                      fontWeight: '700',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      ● {t.inventory.statusOut || (lang === 'ru' ? 'Под заказ' : 'Out of stock')}
                                    </span>
                                  )}
                                </td>
                              )}

                              <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: '4px', color: cat.color }} />
                                {item.location || cat.defaultLocation}
                              </td>

                              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                {canManageStock ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    {/* Upload photo button for this specific item */}
                                    <button
                                      onClick={() => handleTriggerAddPhotoToExisting(item, false)}
                                      title={t.inventory.addPhoto || 'Add photo to this item in DB'}
                                      style={{
                                        background: hasPhotos ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                        border: hasPhotos ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
                                        color: hasPhotos ? '#38bdf8' : 'var(--text-muted)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Camera size={12} />
                                      <span>{hasPhotos ? `+${lang === 'ru' ? 'Фото' : 'Photo'}` : `+${t.inventory.addPhoto || 'Photo'}`}</span>
                                    </button>

                                    {/* Quantity Controls */}
                                    <div style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '4px', 
                                      background: 'rgba(15, 23, 42, 0.7)', 
                                      padding: '3px 6px', 
                                      borderRadius: '6px', 
                                      border: '1px solid var(--border-color)' 
                                    }}>
                                      <button
                                        onClick={() => updateInventoryQty(item.id, item.quantity - 1)}
                                        title="Decrease quantity by 1"
                                        style={{ 
                                          background: 'rgba(255,255,255,0.1)', 
                                          color: '#fff', 
                                          width: '24px', 
                                          height: '24px', 
                                          borderRadius: '4px', 
                                          fontWeight: 'bold', 
                                          border: 'none', 
                                          cursor: 'pointer' 
                                        }}
                                      >
                                        -
                                      </button>
                                      <span style={{ width: '32px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateInventoryQty(item.id, item.quantity + 1)}
                                        title="Increase quantity by 1"
                                        style={{ 
                                          background: 'rgba(255,255,255,0.1)', 
                                          color: '#fff', 
                                          width: '24px', 
                                          height: '24px', 
                                          borderRadius: '4px', 
                                          fontWeight: 'bold', 
                                          border: 'none', 
                                          cursor: 'pointer' 
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onOpenNewTicket && onOpenNewTicket('storage', item.name)}
                                    style={{
                                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                      border: 'none',
                                      color: '#fff',
                                      padding: '6px 14px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <Package size={13} />
                                    <span>{t.inventory?.requestItem || (lang === 'ru' ? 'Заказать в кабинет' : 'Request Item')}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            ))
          )}
        </div>
      ) : (
        /* ================= FLAT TABLE VIEW ================= */
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 20px' }}>{t.inventory.itemName}</th>
                <th style={{ padding: '16px 20px' }}>{t.inventory.category}</th>
                {canManageStock ? (
                  <>
                    <th style={{ padding: '16px 20px' }}>{t.inventory.inStock}</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                  </>
                ) : (
                  <th style={{ padding: '16px 20px' }}>{t.inventory.availability || 'Availability'}</th>
                )}
                <th style={{ padding: '16px 20px' }}>{t.inventory.location}</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t.inventory.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={canManageStock ? 6 : 5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t.inventory.noItemsInCategory || 'No items found.'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, idx) => {
                  const meta = getCategoryMeta(item.category);
                  const hasPhotos = item.photos && item.photos.length > 0;
                  return (
                    <tr key={item.id} style={{ borderBottom: idx !== filteredInventory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                            {hasPhotos ? (
                              <div
                                onClick={() => setPreviewPhoto({
                                  url: item.photos[0],
                                  name: item.name,
                                  category: item.category,
                                  location: item.location
                                })}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                                  cursor: 'pointer'
                                }}
                              >
                                <img src={item.photos[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div 
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '8px',
                                  background: meta.bgColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px'
                                }}
                              >
                                {meta.icon}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span>{item.name}</span>
                              {item.isReturnable || item.category === 'stationary_loan' ? (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(249, 115, 22, 0.15)',
                                  color: '#fb923c',
                                  border: '1px solid rgba(249, 115, 22, 0.3)'
                                }}>
                                  ⏱️ {lang === 'ru' ? 'На 1-2 урока' : lang === 'kk' ? '1-2 сабаққа' : 'Loan (1-2 Lessons)'}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  color: '#60a5fa',
                                  border: '1px solid rgba(59, 130, 246, 0.25)'
                                }}>
                                  ✏️ {lang === 'ru' ? 'Расходный' : lang === 'kk' ? 'Шығыс' : 'Consumable'}
                                </span>
                              )}
                            </div>
                            {hasPhotos && (
                              <div style={{ fontSize: '10px', color: '#38bdf8' }}>
                                📷 {item.photos.length} {lang === 'ru' ? 'фото в БД' : 'photo in DB'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          background: meta.bgColor, 
                          color: meta.color,
                          border: `1px solid ${meta.borderColor}`,
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{meta.icon}</span>
                          <span>{getCategoryLabel(item.category, lang, true)}</span>
                        </span>
                      </td>

                      {canManageStock ? (
                        <>
                          <td style={{ padding: '16px 20px', fontWeight: '700', fontSize: '15px' }}>
                            {item.quantity} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.unit}</span>
                          </td>

                          <td style={{ padding: '16px 20px' }}>
                            {getStockStatusBadge(item.quantity, item.minLevel)}
                          </td>
                        </>
                      ) : (
                        <td style={{ padding: '16px 20px' }}>
                          {item.quantity > 0 ? (
                            <span style={{ 
                              background: 'rgba(16, 185, 129, 0.15)', 
                              color: '#34d399', 
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '3px 8px', 
                              borderRadius: '12px', 
                              fontSize: '11px', 
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ✓ {t.inventory.available || (lang === 'ru' ? 'В наличии' : 'In Stock')}
                            </span>
                          ) : (
                            <span style={{ 
                              background: 'rgba(239, 68, 68, 0.15)', 
                              color: '#f87171', 
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '3px 8px', 
                              borderRadius: '12px', 
                              fontSize: '11px', 
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ● {t.inventory.statusOut || (lang === 'ru' ? 'Под заказ' : 'Out of stock')}
                            </span>
                          )}
                        </td>
                      )}

                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {item.location}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {canManageStock ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleTriggerAddPhotoToExisting(item, false)}
                              title={t.inventory.addPhoto || 'Add photo to this item in DB'}
                              style={{
                                background: hasPhotos ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                border: hasPhotos ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
                                color: hasPhotos ? '#38bdf8' : 'var(--text-muted)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Camera size={12} />
                              <span>{hasPhotos ? `+${lang === 'ru' ? 'Фото' : 'Photo'}` : `+${t.inventory.addPhoto || 'Photo'}`}</span>
                            </button>

                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <button
                                onClick={() => updateInventoryQty(item.id, item.quantity - 1)}
                                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                              >
                                -
                              </button>
                              <span style={{ width: '28px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                              <button
                                onClick={() => updateInventoryQty(item.id, item.quantity + 1)}
                                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', width: '26px', height: '26px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenNewTicket && onOpenNewTicket('storage', item.name)}
                            style={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              border: 'none',
                              color: '#fff',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Package size={13} />
                            <span>{t.inventory?.requestItem || (lang === 'ru' ? 'Заказать в кабинет' : 'Request Item')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Stock Item Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: '28px', border: '1px solid rgba(245, 158, 11, 0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  {t.inventory.addItem}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Category Picker with Visual Icons */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  {t.inventory.category} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  value={newItem.category}
                  onChange={e => handleCategoryChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  {STORAGE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {getCategoryLabel(cat.id, lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Issue & Return Policy Selection */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  {t.tickets?.itemType || (lang === 'ru' ? 'Политика выдачи и возврата' : 'Issue & Return Policy')} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNewItem(prev => ({ ...prev, isReturnable: false }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: !newItem.isReturnable ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: !newItem.isReturnable ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: !newItem.isReturnable ? '#fff' : 'var(--text-muted)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '12px', color: !newItem.isReturnable ? '#60a5fa' : '#cbd5e1', marginBottom: '2px' }}>
                      ✏️ {lang === 'ru' ? 'Расходные материалы' : lang === 'kk' ? 'Шығыс материалдары' : 'Consumable Supply'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {lang === 'ru' 
                        ? 'Выдаются учителю насовсем (бумага, маркеры, ручки). Возврат на склад не требуется.' 
                        : lang === 'kk' 
                        ? 'Мұғалімге біржола беріледі (қағаз, қалам, маркер). Қайтарылмайды.'
                        : 'Given permanently to teacher (paper, markers, pens). No return required.'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewItem(prev => ({ ...prev, isReturnable: true }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: newItem.isReturnable ? '2px solid #f97316' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: newItem.isReturnable ? 'rgba(249, 115, 22, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                      color: newItem.isReturnable ? '#fff' : 'var(--text-muted)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '12px', color: newItem.isReturnable ? '#f97316' : '#cbd5e1', marginBottom: '2px' }}>
                      ⏱️ {lang === 'ru' ? 'Временная выдача (1-2 урока)' : lang === 'kk' ? '1-2 сабаққа уақытша' : 'Temporary Lesson Loan'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {lang === 'ru' 
                        ? 'Выдается на 1-2 урока. Учитель обязан вернуть, завсклад подтверждает возврат.' 
                        : lang === 'kk' 
                        ? '1-2 сабаққа беріледі. Мұғалім қайтаруға міндетті, қоймашы қабылдайды.'
                        : 'Issued for 1-2 lessons. Teacher must return, storage manager confirms.'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  {t.inventory.itemName} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newItem.category === 'marketing' ? 'e.g. School Branded Notebooks & Swag Bags' :
                    newItem.category === 'furniture' ? 'e.g. Ergonomic Teacher Desk (Oak Wood)' :
                    newItem.category === 'stationary' ? 'e.g. A4 Pastel Colored Paper (500 sheets)' :
                    'e.g. Item title...'
                  }
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              {/* Quantity, Unit, Min Threshold in a 3-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    {t.inventory.inStock}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    {t.inventory.unit}
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="pcs">pcs (шт)</option>
                    <option value="box">box (кор)</option>
                    <option value="pack">pack (пач)</option>
                    <option value="set">set (комп)</option>
                    <option value="roll">roll (рул)</option>
                    <option value="pad">pad (блок)</option>
                    <option value="canister">canister (кан)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    {t.inventory.minLevel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.minLevel}
                    onChange={e => setNewItem({ ...newItem, minLevel: e.target.value })}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Storage Location with preset hint */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', margin: 0 }}>
                    {t.inventory.location}
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'ru' ? 'Рекомендовано для этой категории' : 'Preset for category'}
                  </span>
                </div>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              {/* Photos Attachment Section (Persisted to SQLite DB) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <Camera size={14} color="#38bdf8" />
                    <span>{t.inventory.photoProof || 'Item Photos (Saved directly to DB)'}</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {newItem.photos.length}/3 {t.inventory.photos || 'photos'}
                  </span>
                </div>

                {/* Upload Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: newItem.photos.length > 0 ? '10px' : '0' }}>
                  <input
                    type="file"
                    ref={newItemFileRef}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => handleNewItemPhotoUpload(e.target.files)}
                  />
                  <input
                    type="file"
                    ref={newItemCameraRef}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => handleNewItemPhotoUpload(e.target.files)}
                  />

                  <button
                    type="button"
                    onClick={() => newItemFileRef.current?.click()}
                    disabled={isCompressing || newItem.photos.length >= 3}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      cursor: newItem.photos.length >= 3 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ImagePlus size={14} />
                    <span>{t.inventory.uploadPhoto || 'Upload Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => newItemCameraRef.current?.click()}
                    disabled={isCompressing || newItem.photos.length >= 3}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      cursor: newItem.photos.length >= 3 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={14} />
                    <span>{t.inventory.takePhoto || 'Take Photo'}</span>
                  </button>
                </div>

                {/* Photo Previews */}
                {newItem.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {newItem.photos.map((photoSrc, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '68px',
                          height: '68px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <img 
                          src={photoSrc} 
                          alt={`new-item-photo-${idx}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewItemPhoto(idx)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(0, 0, 0, 0.75)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  🔒 {lang === 'ru' ? 'Фото сжимаются и сохраняются прямо в базе данных SQLite' : 'Photos are optimized and stored directly inside the SQLite database.'}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', borderTop: '1px solid #383838', paddingTop: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="fluent-btn-secondary" 
                  style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12px' }}
                >
                  {t.common.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={isCompressing}
                  className="fluent-btn-primary" 
                  style={{ padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}
                >
                  {isCompressing ? '...' : t.common.save}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '800px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            {/* Lightbox Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(30, 41, 59, 0.7)'
            }}>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '700' }}>
                  {previewPhoto.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{getCategoryLabel(previewPhoto.category, lang)}</span>
                  <span>•</span>
                  <span>{previewPhoto.location}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* High-Resolution Image Display */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', background: '#020617' }}>
              <img 
                src={previewPhoto.url} 
                alt={previewPhoto.name} 
                style={{
                  maxHeight: '65vh',
                  maxWidth: '100%',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div style={{ padding: '12px 20px', background: 'rgba(30, 41, 59, 0.5)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>📸 {lang === 'ru' ? 'Сохранено в базе данных SQLite' : 'Stored in SQLite Database'}</span>
              <button
                onClick={() => window.open(previewPhoto.url, '_blank')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Maximize2 size={13} /> {lang === 'ru' ? 'Открыть в полном окне' : 'Open in new tab'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
