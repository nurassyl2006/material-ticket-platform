import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  Package,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Crown,
  GraduationCap,
  Users,
  Truck,
  Wrench,
  Laptop,
  Compass,
  Zap,
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { getCategoryLabel } from '../storageCategories';

const COLOR_PRESETS = [
  { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.35)', name: 'Indigo' },
  { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', name: 'Sky' },
  { color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)', name: 'Emerald' },
  { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)', name: 'Amber' },
  { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.35)', name: 'Orange' },
  { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.35)', name: 'Pink' },
  { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.35)', name: 'Purple' }
];

const AVAILABLE_ICONS = [
  { name: 'Crown', label: 'Leadership', Icon: Crown },
  { name: 'GraduationCap', label: 'Academic', Icon: GraduationCap },
  { name: 'Users', label: 'Staff Crew', Icon: Users },
  { name: 'ShieldCheck', label: 'Security', Icon: ShieldCheck },
  { name: 'Package', label: 'Storage', Icon: Package },
  { name: 'Truck', label: 'Logistics', Icon: Truck },
  { name: 'Wrench', label: 'Engineering', Icon: Wrench },
  { name: 'Laptop', label: 'IT Tech', Icon: Laptop },
  { name: 'Sparkles', label: 'Lab / Hygiene', Icon: Sparkles },
  { name: 'Compass', label: 'Visitor Guide', Icon: Compass }
];

const ROLE_PRESET_TEMPLATES = [
  {
    key: 'lab_assistant',
    label: 'Lab Assistant',
    labelRu: 'Лаборант кабинетов',
    labelKk: 'Зертхана көмекшісі',
    icon: 'Sparkles',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    scope: 'Science lab equipment maintenance, reagent safety, and preparation of physics, chemistry and biology experiments.',
    scopeRu: 'Обслуживание оборудования лабораторий, химических реактивов и подготовка кабинетов физики и химии.',
    scopeKk: 'Зертханалық жабдықтарды күту, химиялық реактивтер және физика, химия кабинеттерін дайындау.',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['stationary', 'stationary_loan', 'electronics', 'other']
  },
  {
    key: 'librarian',
    label: 'School Librarian',
    labelRu: 'Библиотекарь школы',
    labelKk: 'Мектеп кітапханашысы',
    icon: 'GraduationCap',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.15)',
    border: 'rgba(167, 139, 250, 0.35)',
    scope: 'Textbook cataloging, library circulation, student reading hall supervision, and educational supply distribution.',
    scopeRu: 'Учет и выдача учебников, работа читального зала, заказ книг и учебных материалов для классов.',
    scopeKk: 'Оқулықтарды есепке алу және беру, оқу залы, сыныптар үшін кітаптар мен оқу құралдарына тапсырыс беру.',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['stationary', 'stationary_loan', 'other']
  },
  {
    key: 'security',
    label: 'Campus Security',
    labelRu: 'Служба безопасности / Охрана',
    labelKk: 'Қауіпсіздік қызметі / Күзет',
    icon: 'ShieldCheck',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.35)',
    scope: 'Campus perimeter security, entrance gates access control, visitor registry, and emergency evacuation protocols.',
    scopeRu: 'Пропускной режим кампуса, контроль периметра, журнал посетителей и реагирование на инциденты.',
    scopeKk: 'Кампустың кіру режимі, периметрді бақылау, келушілер журналы және қауіпсіздікті қамтамасыз ету.',
    canViewStorage: false,
    canManageStock: false,
    allowedCategories: []
  },
  {
    key: 'nurse',
    label: 'School Medical Nurse',
    labelRu: 'Медицинский пункт / Медсестра',
    labelKk: 'Мектеп дәрігері / Медбике',
    icon: 'Users',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    scope: 'First aid, student health checks, cafeteria sanitary inspections, and medical dispensary inventory requests.',
    scopeRu: 'Оказание первой помощи, медосмотры учащихся, санитарный контроль столовой и заказ медикаментов.',
    scopeKk: 'Алғашқы медициналық көмек, оқушыларды тексеру, асхананың санитарлық бақылауы және медпункт қажеттіліктері.',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['cleaning', 'other']
  },
  {
    key: 'accountant',
    label: 'Accountant / Bursar',
    labelRu: 'Бухгалтерия / Финансист',
    labelKk: 'Бухгалтер / Қаржыгер',
    icon: 'Crown',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    scope: 'Asset auditing, material expenditure approvals, supplier invoice reconciliation, and inventory write-off reviews.',
    scopeRu: 'Аудит материальных ценностей, согласование закупок, сверка счетов поставщиков и списание инвентаря.',
    scopeKk: 'Материалдық құндылықтар аудиті, сатып алуды мақұлдау, шот-фактураларды салыстыру және мүлікті есептен шығару.',
    canViewStorage: true,
    canManageStock: true,
    allowedCategories: ['all']
  },
  {
    key: 'dorm_supervisor',
    label: 'Dormitory Supervisor',
    labelRu: 'Комендант общежития',
    labelKk: 'Жатақхана коменданты',
    icon: 'Truck',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.35)',
    scope: 'Residential room inspection, linen inventory, student curfew safety, and urgent maintenance ticketing.',
    scopeRu: 'Контроль жилых комнат общежития, постельного белья, порядок студентов и заявки на срочный ремонт.',
    scopeKk: 'Жатақхана бөлмелерін тексеру, төсек-орын жабдықтары, оқушылар тәртібі және шұғыл жөндеуге өтінімдер.',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['furniture', 'cleaning', 'other']
  }
];

export const RoleEditorModal = ({
  isOpen,
  onClose,
  editingRole,
  allCategories = [],
  onSave,
  lang = 'en'
}) => {
  const isEditing = Boolean(editingRole && editingRole.key);

  const [formData, setFormData] = useState({
    key: '',
    label: '',
    labelRu: '',
    labelKk: '',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.15)',
    border: 'rgba(129, 140, 248, 0.35)',
    icon: 'Users',
    scope: '',
    scopeRu: '',
    scopeKk: '',
    canViewStorage: true,
    canManageStock: false,
    allowedCategories: ['all']
  });

  const [selectAllCategories, setSelectAllCategories] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingRole) {
      const allowed = Array.isArray(editingRole.allowedCategories) ? editingRole.allowedCategories : ['all'];
      const isAll = allowed.includes('all');
      setFormData({
        key: editingRole.key || '',
        label: editingRole.label || '',
        labelRu: editingRole.labelRu || editingRole.label || '',
        labelKk: editingRole.labelKk || editingRole.label || '',
        color: editingRole.color || '#818cf8',
        bg: editingRole.bg || 'rgba(129, 140, 248, 0.15)',
        border: editingRole.border || 'rgba(129, 140, 248, 0.35)',
        icon: editingRole.icon || 'Users',
        scope: editingRole.scope || '',
        scopeRu: editingRole.scopeRu || editingRole.scope || '',
        scopeKk: editingRole.scopeKk || editingRole.scope || '',
        canViewStorage: editingRole.canViewStorage !== false,
        canManageStock: Boolean(editingRole.canManageStock),
        allowedCategories: isAll ? allCategories.map(c => c.id || c.key) : allowed
      });
      setSelectAllCategories(isAll);
    } else {
      setFormData({
        key: '',
        label: '',
        labelRu: '',
        labelKk: '',
        color: '#818cf8',
        bg: 'rgba(129, 140, 248, 0.15)',
        border: 'rgba(129, 140, 248, 0.35)',
        icon: 'Users',
        scope: '',
        scopeRu: '',
        scopeKk: '',
        canViewStorage: true,
        canManageStock: false,
        allowedCategories: allCategories.map(c => c.id || c.key)
      });
      setSelectAllCategories(true);
    }
    setErrorMsg('');
  }, [editingRole, isOpen, allCategories]);

  if (!isOpen) return null;

  const handleApplyPresetTemplate = (tmpl) => {
    const isAll = tmpl.allowedCategories.includes('all');
    setFormData({
      key: tmpl.key,
      label: tmpl.label,
      labelRu: tmpl.labelRu,
      labelKk: tmpl.labelKk,
      color: tmpl.color,
      bg: tmpl.bg,
      border: tmpl.border,
      icon: tmpl.icon,
      scope: tmpl.scope,
      scopeRu: tmpl.scopeRu,
      scopeKk: tmpl.scopeKk,
      canViewStorage: tmpl.canViewStorage,
      canManageStock: tmpl.canManageStock,
      allowedCategories: isAll ? allCategories.map(c => c.id || c.key) : tmpl.allowedCategories
    });
    setSelectAllCategories(isAll);
  };

  const handleToggleCategory = (catId) => {
    setFormData(prev => {
      let nextAllowed;
      if (selectAllCategories) {
        nextAllowed = allCategories.map(c => c.id || c.key).filter(id => id !== catId);
        setSelectAllCategories(false);
      } else {
        const current = prev.allowedCategories || [];
        if (current.includes(catId)) {
          nextAllowed = current.filter(id => id !== catId);
        } else {
          nextAllowed = [...current, catId];
          if (nextAllowed.length === allCategories.length) {
            setSelectAllCategories(true);
          }
        }
      }
      return { ...prev, allowedCategories: nextAllowed };
    });
  };

  const handleSelectAllToggle = (checked) => {
    setSelectAllCategories(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        allowedCategories: allCategories.map(c => c.id || c.key)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allowedCategories: []
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.key.trim()) {
      setErrorMsg('Role identifier key is required (e.g. librarian, security)');
      return;
    }
    if (!formData.label.trim()) {
      setErrorMsg('Role title in English is required');
      return;
    }

    const cleanKey = formData.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    setSaving(true);
    try {
      const payload = {
        ...formData,
        key: cleanKey,
        labelRu: formData.labelRu.trim() || formData.label.trim(),
        labelKk: formData.labelKk.trim() || formData.label.trim(),
        scopeRu: formData.scopeRu.trim() || formData.scope.trim(),
        scopeKk: formData.scopeKk.trim() || formData.scope.trim(),
        allowedCategories: selectAllCategories ? ['all'] : formData.allowedCategories
      };

      await onSave(payload, isEditing);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save role configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          background: '#242424',
          border: '1px solid #383838',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #383838',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1f1f1f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: formData.bg,
              border: `1px solid ${formData.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: formData.color
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                {isEditing
                  ? (lang === 'ru' ? `Настройка роли: ${formData.label}` : `Adjust Role & Tasks: ${formData.label}`)
                  : (lang === 'ru' ? 'Создание новой роли школы' : 'Create New Campus Role')}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#8a8a8a' }}>
                {lang === 'ru'
                  ? 'Определите обязанности роли, видимость склада и разрешенные категории товаров'
                  : 'Configure tasks, warehouse storage visibility, and permitted categories'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8a8a',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Quick-Start School Role Templates (Only when creating new role) */}
          {!isEditing && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                {lang === 'ru' ? 'Быстрые шаблоны школьных ролей (нажмите для автозаполнения):' : 'Quick School Role Templates (click to prefill):'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
                {ROLE_PRESET_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.key}
                    type="button"
                    onClick={() => handleApplyPresetTemplate(tmpl)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: formData.key === tmpl.key ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: formData.key === tmpl.key ? '1.5px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>
                      {lang === 'ru' ? tmpl.labelRu : tmpl.label}
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#8a8a8a', fontFamily: 'monospace', marginTop: '2px' }}>
                      {tmpl.key}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role Key and Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '5px' }}>
                Role Identifier / Key {isEditing && '(Fixed)'} *
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                placeholder="e.g. librarian, security, nurse"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isEditing ? '#181818' : '#1f1f1f',
                  border: '1px solid #383838',
                  color: isEditing ? '#8a8a8a' : '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '5px' }}>
                Role Name (English) *
              </label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g. Science Lab Assistant"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#1f1f1f',
                  border: '1px solid #383838',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '5px' }}>
                Название роли (Русский)
              </label>
              <input
                type="text"
                value={formData.labelRu}
                onChange={(e) => setFormData(prev => ({ ...prev, labelRu: e.target.value }))}
                placeholder="например, Лаборант кабинетов"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#1f1f1f',
                  border: '1px solid #383838',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Icon and Color Customization */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Icon Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '6px' }}>
                Role Icon Symbol
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {AVAILABLE_ICONS.map(item => {
                  const IconComp = item.Icon;
                  const isSelected = formData.icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: item.name }))}
                      title={item.label}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: isSelected ? formData.bg : '#1f1f1f',
                        border: isSelected ? `2px solid ${formData.color}` : '1px solid #383838',
                        color: isSelected ? formData.color : '#8a8a8a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Preset Palette */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '6px' }}>
                Badge Color Preset
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      color: p.color,
                      bg: p.bg,
                      border: p.border
                    }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 9px',
                      borderRadius: '8px',
                      background: p.bg,
                      border: formData.color === p.color ? `2px solid ${p.color}` : `1px solid ${p.border}`,
                      color: p.color,
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.color }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks & Scope (Responsibilities) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '5px' }}>
              {lang === 'ru' ? 'Обязанности и функциональные задачи роли (Operational Tasks)' : 'Assigned Role Tasks & Responsibilities (Scope)'}
            </label>
            <textarea
              rows={3}
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
              placeholder="e.g. Science lab equipment maintenance, chemical reagent safety, and preparing classroom experiment materials..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#1f1f1f',
                border: '1px solid #383838',
                color: '#fff',
                fontSize: '13px',
                lineHeight: 1.4,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Storage & Warehouse Permissions Box */}
          <div style={{
            background: '#1b1b1b',
            border: '1px solid #333333',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={17} color="#fbbf24" />
              <strong style={{ fontSize: '13px', color: '#f3f2f1' }}>
                {lang === 'ru' ? 'Настройки доступа к складу и разрешенные категории' : 'Warehouse Storage Visibility & Category Permissions'}
              </strong>
            </div>

            {/* Storage Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                background: formData.canViewStorage ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${formData.canViewStorage ? 'rgba(56, 189, 248, 0.3)' : '#333'}`
              }}>
                <input
                  type="checkbox"
                  checked={formData.canViewStorage}
                  onChange={(e) => setFormData(prev => ({ ...prev, canViewStorage: e.target.checked }))}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                    {lang === 'ru' ? 'Может видеть каталог склада' : 'Can View Storage Catalog'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a8a8a', marginTop: '2px' }}>
                    {lang === 'ru'
                      ? 'Отображает вкладку «Склад / Каталог» в панели навигации'
                      : 'Shows warehouse inventory & catalog tab for this role'}
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                background: formData.canManageStock ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${formData.canManageStock ? 'rgba(16, 185, 129, 0.3)' : '#333'}`
              }}>
                <input
                  type="checkbox"
                  checked={formData.canManageStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, canManageStock: e.target.checked }))}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                    {lang === 'ru' ? 'Право управления остатками' : 'Can Deduct & Restock'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8a8a8a', marginTop: '2px' }}>
                    {lang === 'ru'
                      ? 'Списание, изменение остатков и подтверждение возвратов товаров'
                      : 'Permission to deduct, edit quantities, and confirm loan returns'}
                  </div>
                </div>
              </label>
            </div>

            {/* Allowed Categories Selection */}
            {formData.canViewStorage && (
              <div style={{ marginTop: '6px', borderTop: '1px solid #2d2d2d', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>
                    {lang === 'ru' ? 'Категории товаров, которые видит эта роль:' : 'Categories Permitted for this Role:'}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', cursor: 'pointer', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={selectAllCategories}
                      onChange={(e) => handleSelectAllToggle(e.target.checked)}
                    />
                    <span>{lang === 'ru' ? 'Все категории склада' : 'All Categories'}</span>
                  </label>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px'
                }}>
                  {allCategories.map(cat => {
                    const isAllowed = selectAllCategories || (formData.allowedCategories || []).includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: isAllowed ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isAllowed ? 'rgba(56, 189, 248, 0.35)' : '#333'}`,
                          color: isAllowed ? '#f3f2f1' : '#777',
                          fontSize: '11px',
                          fontWeight: isAllowed ? '700' : '500',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{cat.icon || '📦'}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getCategoryLabel(cat.id, lang, true, allCategories)}
                        </span>
                        {isAllowed && <Check size={12} color="#38bdf8" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: '#1f1f1f',
                border: '1px solid #383838',
                color: '#adadad',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {lang === 'ru' ? 'Отмена' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0f6cbd, #2b88d8)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 108, 189, 0.4)'
              }}
            >
              {saving
                ? (lang === 'ru' ? 'Сохранение...' : 'Saving...')
                : isEditing 
                ? (lang === 'ru' ? 'Сохранить изменения' : 'Save Adjustments')
                : (lang === 'ru' ? 'Создать роль' : 'Create Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
