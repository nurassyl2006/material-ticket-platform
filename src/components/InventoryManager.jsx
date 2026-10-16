import React, { useState, useMemo } from 'react';
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
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { STORAGE_CATEGORIES, getCategoryMeta, getCategoryLabel } from '../storageCategories';

export const InventoryManager = () => {
  const { t, inventory, addInventoryItem, updateInventoryQty, role, lang } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ok' | 'low' | 'out'
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'table'
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'stationary',
    quantity: 10,
    unit: 'pcs',
    minLevel: 5,
    location: 'Storage Cabinet 102 - Shelf A'
  });

  const canManageStock = role === 'storage_manager' || 
                         role === 'engineer' || 
                         role === 'facilities_manager' ||
                         role === 'director' || 
                         role === 'workerA' || 
                         role === 'admin';

  // Handle category change in Add Modal with smart location suggestion
  const handleCategoryChange = (catId) => {
    const meta = getCategoryMeta(catId);
    setNewItem(prev => ({
      ...prev,
      category: catId,
      location: meta.defaultLocation || prev.location
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
      location: meta.defaultLocation || 'Storage Cabinet 102 - Shelf A'
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    addInventoryItem({
      ...newItem,
      name: newItem.name.trim(),
      quantity: Number(newItem.quantity) || 0,
      minLevel: Number(newItem.minLevel) || 5
    });
    setShowAddModal(false);
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
      // If searching or filtering, show only groups with items; otherwise show groups that have items in catalog
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

  if (!canManageStock) {
    return (
      <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
          {lang === 'ru' ? 'Доступ ограничен' : lang === 'kk' ? 'Қолжетімділік шектелген' : 'Access Restricted'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          {lang === 'ru'
            ? 'Складской каталог и остатки доступны только завскладу, инженерам, завхозу и администрации школы.'
            : lang === 'kk'
            ? 'Қойма каталогы мен қалдықтар тек қойма меңгерушісіне, инженерлерге, шаруашылық бөліміне және әкімшілікке қолжетімді.'
            : 'Warehouse catalog and categories can only be viewed and managed by designated Storage Managers, Engineers, and School Administration.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
              {t.inventory.title}
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {lang === 'ru' 
              ? 'База данных склада, разделенная по категориям: канцелярия, маркетинг, мебель, электроника и др.'
              : lang === 'kk'
              ? 'Санаттарға бөлінген қойма дерекқоры: кеңсе, маркетинг, жиһаз, электроника т.б.'
              : 'Warehouse database partitioned into categories: stationery, marketing, furniture, electronics, and utilities.'}
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

      {/* Category Overview Cards Carousel / Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t.inventory.categoryOverview || 'Warehouse Categories Overview'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ color: '#fff', fontWeight: '700' }}>{overallTotals.totalItems}</span> {t.inventory.itemsCount || 'items'} ({overallTotals.totalQty} total units)
          </div>
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
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: selectedCategory === 'all' ? '#fbbf24' : '#fff' }}>
                {t.inventory.allCategories || 'All Categories'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {STORAGE_CATEGORIES.length} {lang === 'ru' ? 'категорий' : lang === 'kk' ? 'санат' : 'divisions'}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {hasAlert && (
                      <span title={lang === 'ru' ? 'Есть позиции с низким остатком' : 'Low stock items present'} style={{ fontSize: '10px' }}>
                        ⚠️
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
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {st.totalQty} {lang === 'ru' ? 'шт / ед.' : lang === 'kk' ? 'дана' : 'units'}
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
            📁 {t.inventory.allCategories || 'All Categories'} ({overallTotals.totalItems})
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
                <span style={{ 
                  background: isCatActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.12)', 
                  padding: '1px 6px', 
                  borderRadius: '10px', 
                  fontSize: '10px' 
                }}>
                  {count}
                </span>
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
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t.inventory.totalQuantity || 'Total Stock'}: <strong style={{ color: '#fff' }}>{cat.totalUnits}</strong>
                    </span>

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
                          <th style={{ padding: '12px 20px' }}>{t.inventory.inStock}</th>
                          <th style={{ padding: '12px 20px' }}>Status</th>
                          <th style={{ padding: '12px 20px' }}>{t.inventory.location}</th>
                          {canManageStock && <th style={{ padding: '12px 20px', textAlign: 'right' }}>{t.inventory.actions || 'Quantity'}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, idx) => (
                          <tr 
                            key={item.id} 
                            style={{ 
                              borderBottom: idx !== cat.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ padding: '14px 20px', fontWeight: '600', color: '#fff' }}>
                              {item.name}
                            </td>

                            <td style={{ padding: '14px 20px', fontWeight: '700', fontSize: '14px' }}>
                              {item.quantity} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.unit}</span>
                            </td>

                            <td style={{ padding: '14px 20px' }}>
                              {getStockStatusBadge(item.quantity, item.minLevel)}
                            </td>

                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                              <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: '4px', color: cat.color }} />
                              {item.location || cat.defaultLocation}
                            </td>

                            {canManageStock && (
                              <td style={{ padding: '14px 20px', textAlign: 'right' }}>
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
                              </td>
                            )}
                          </tr>
                        ))}
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
                <th style={{ padding: '16px 20px' }}>{t.inventory.inStock}</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px' }}>{t.inventory.location}</th>
                {canManageStock && <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t.inventory.actions || 'Quantity'}</th>}
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
                  return (
                    <tr key={item.id} style={{ borderBottom: idx !== filteredInventory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#fff' }}>
                        {item.name}
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

                      {canManageStock && (
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
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
                        </td>
                      )}
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
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            
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
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}
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
                  className="fluent-btn-primary" 
                  style={{ padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}
                >
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
