import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Crown,
  Wrench,
  Laptop,
  Sparkles,
  Package,
  Truck,
  GraduationCap,
  Compass,
  X,
  Lock,
  Mail,
  Phone,
  Building,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Clock,
  MapPin,
  Boxes,
  Plus,
  Check,
  ShieldAlert,
  DollarSign,
  CalendarCheck2
} from 'lucide-react';
import { DEFAULT_ROLES, getRoleDefinition, canRoleAccessDailyDigest } from '../roleConfig';
import { getCategoryLabel } from '../storageCategories';
import { RoleEditorModal } from './RoleEditorModal';
import { CategoryEditorModal } from './CategoryEditorModal';

const ROLE_ICON_MAP = {
  Crown,
  Truck,
  Package,
  Wrench,
  Laptop,
  Sparkles,
  GraduationCap,
  Users,
  Compass,
  ShieldCheck,
  DollarSign
};

function getRoleIconComponent(iconName) {
  if (typeof iconName === 'function') return iconName;
  return ROLE_ICON_MAP[iconName] || Users;
}

const LIGHT_ROLE_COLORS = {
  director: { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  facilities_manager: { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  storage_manager: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  engineer: { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  it_support: { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  cleaning: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  teacher: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  finance: { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  accountant: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' }
};

export const UserManagement = () => {
  const { 
    currentUser, 
    role, 
    t, 
    lang, 
    theme,
    usersList, 
    syncWithDb, 
    createUser, 
    updateUserRole, 
    resetUserPassword, 
    deleteUser,
    rolesConfig,
    customCategories,
    updateRoleConfig,
    createRole,
    deleteRole,
    createStorageCategory,
    updateStorageCategory,
    inventory
  } = useApp();

  const isLight = theme === 'light';

  // Admin Active Sub-Tab: 'users' | 'roles' | 'categories'
  const [adminTab, setAdminTab] = useState('users');

  // Staff Table Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);

  // Role Editor Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Category Editor Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'teacher',
    department: '',
    phone: '',
    password: 'school123'
  });

  const showFeedback = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setActionSuccess('');
    } else {
      setActionSuccess(msg);
      setActionError('');
    }
    setTimeout(() => {
      setActionSuccess('');
      setActionError('');
    }, 4500);
  };

  // Safe merged roles definition
  const mergedRoles = useMemo(() => {
    return { ...DEFAULT_ROLES, ...(rolesConfig || {}) };
  }, [rolesConfig]);

  // Safe categories list
  const categoriesList = useMemo(() => {
    return customCategories || [];
  }, [customCategories]);

  // Render a role badge
  const getRoleBadge = (roleKey) => {
    const config = getRoleDefinition(roleKey, rolesConfig);
    const IconComp = getRoleIconComponent(config.icon);
    let label = config.label;
    if (lang === 'ru') label = config.labelRu || config.label;
    if (lang === 'kk') label = config.labelKk || config.label;

    const themeColor = isLight ? (LIGHT_ROLE_COLORS[roleKey]?.color || '#4338ca') : config.color;
    const themeBg = isLight ? (LIGHT_ROLE_COLORS[roleKey]?.bg || 'rgba(99, 102, 241, 0.1)') : config.bg;
    const themeBorder = isLight ? (LIGHT_ROLE_COLORS[roleKey]?.border || '#c7d2fe') : config.border;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700',
        color: themeColor,
        background: themeBg,
        border: `1px solid ${themeBorder}`
      }}>
        <IconComp size={13} />
        {label}
      </span>
    );
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return (usersList || []).filter(u => {
      const matchesSearch = 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const userRole = u.role || u.roleKey || 'teacher';
      const matchesRole = roleFilter === 'all' || userRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usersList, searchTerm, roleFilter]);

  // Handle immediate role change from dropdown
  const handleRoleChange = async (userId, targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    
    // Prevent removing own director role accidentally
    if (targetUser.id === currentUser?.id && newRole !== 'director') {
      if (!window.confirm('Warning: You are changing your own role away from Director. You will lose access to this admin menu. Continue?')) {
        return;
      }
    }

    try {
      setLoadingAction(`role-${userId}`);
      await updateUserRole(userId, newRole);
      showFeedback(`Role for ${targetUser.name} changed to ${getRoleDefinition(newRole, rolesConfig).label}.`);
    } catch (err) {
      showFeedback(err.message || 'Failed to update role', true);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Add New User submit
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showFeedback('Please fill out all required fields.', true);
      return;
    }

    try {
      setLoadingAction('create');
      await createUser(newUser);
      showFeedback(`User ${newUser.name} created successfully!`);
      setIsAddModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'teacher',
        department: '',
        phone: '',
        password: 'school123'
      });
    } catch (err) {
      showFeedback(err.message || 'Failed to create user', true);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Reset Password submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordValue.trim() || newPasswordValue.length < 6) {
      showFeedback('Password must be at least 6 characters long.', true);
      return;
    }

    try {
      setLoadingAction('reset-pwd');
      await resetUserPassword(resetPwdUser.id, newPasswordValue);
      showFeedback(`Password for ${resetPwdUser.name} has been reset successfully!`);
      setResetPwdUser(null);
      setNewPasswordValue('');
    } catch (err) {
      showFeedback(err.message || 'Failed to reset password', true);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      showFeedback('You cannot delete your own account.', true);
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${targetUser.name}" (${targetUser.email})? This action cannot be undone.`)) {
      try {
        setLoadingAction(`del-${targetUser.id}`);
        await deleteUser(targetUser.id);
        showFeedback(`User ${targetUser.name} deleted.`);
      } catch (err) {
        showFeedback(err.message || 'Failed to delete user', true);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  // Handle Delete Custom Role
  const handleDeleteRole = async (targetRole) => {
    if (DEFAULT_ROLES[targetRole.key]) {
      showFeedback('Default system roles cannot be deleted.', true);
      return;
    }

    const assignedCount = (usersList || []).filter(u => (u.role || u.roleKey) === targetRole.key).length;
    const warningMsg = assignedCount > 0
      ? `Are you sure you want to delete role "${targetRole.label}"? ${assignedCount} staff member(s) currently assigned to this role will fallback to Teacher.`
      : `Are you sure you want to delete custom role "${targetRole.label}"?`;

    if (window.confirm(warningMsg)) {
      try {
        await deleteRole(targetRole.key);
        showFeedback(`Role "${targetRole.label}" was deleted successfully.`);
      } catch (err) {
        showFeedback(err.message || 'Failed to delete role', true);
      }
    }
  };

  // Handle Save Role from RoleEditorModal
  const handleSaveRole = async (roleData) => {
    try {
      if (editingRole) {
        await updateRoleConfig(roleData.key, roleData);
        showFeedback(
          lang === 'ru' 
            ? `Настройки роли "${roleData.label}" успешно обновлены!` 
            : `Role "${roleData.label}" tasks and permissions updated!`
        );
      } else {
        await createRole(roleData);
        showFeedback(
          lang === 'ru' 
            ? `Новая роль "${roleData.label}" создана и активна в системе!` 
            : `New role "${roleData.label}" created and active across the platform!`
        );
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      showFeedback(err.message || 'Failed to save role', true);
    }
  };

  // Handle Save Category from CategoryEditorModal
  const handleSaveCategory = async (catData) => {
    try {
      if (editingCategory) {
        await updateStorageCategory(catData.id, catData);
        showFeedback(
          lang === 'ru' 
            ? `Категория склада обновлена!` 
            : `Storage category updated successfully!`
        );
      } else {
        await createStorageCategory(catData);
        showFeedback(
          lang === 'ru' 
            ? `Новая категория "${catData.nameRu || catData.nameEn}" добавлена на склад!` 
            : `New storage category "${catData.nameEn}" added to warehouse!`
        );
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      showFeedback(err.message || 'Failed to save category', true);
    }
  };

  // Security check: Only Director / Admin can view
  if (role !== 'director' && role !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', margin: '40px auto', maxWidth: '600px', borderRadius: '16px' }}>
        <ShieldCheck size={52} color="var(--danger, #ef4444)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>Director Authority Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
          This operations matrix is strictly reserved for the School Director to configure operational staff roles, task assignments, and warehouse storage visibility.
        </p>
      </div>
    );
  }

  // Summary counts
  const totalUsers = usersList?.length || 0;
  const rolesList = Object.values(mergedRoles);
  const totalRoles = rolesList.length;
  const rolesWithStorage = rolesList.filter(r => r.canViewStorage).length;
  const totalCategories = categoriesList.length;
  const returnableCatCount = categoriesList.filter(c => c.isReturnable).length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        borderRadius: '12px',
        background: 'var(--bg-card, rgba(24, 24, 27, 0.85))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #0f6cbd 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
          }}>
            <Crown size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: '800', margin: 0, color: 'var(--text-main, #f3f2f1)' }}>
                {lang === 'ru' ? 'Центр управления директора: Роли, Задачи и Доступ к Складу' : lang === 'kk' ? 'Директор басқару орталығы: Рөлдер, Міндеттер және Қойма' : 'Director Center: Roles, Tasks & Storage Access'}
              </h1>
              <span style={{
                background: isLight ? '#eef2ff' : 'rgba(129, 140, 248, 0.2)',
                color: isLight ? '#4338ca' : '#818cf8',
                border: isLight ? '1px solid #c7d2fe' : '1px solid rgba(129, 140, 248, 0.4)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                Director Only
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
              {lang === 'ru' 
                ? 'Настраивайте функциональные обязанности ролей, видимость каталога склада и разрешенные категории, или создавайте новые роли и категории.' 
                : lang === 'kk' 
                ? 'Рөлдердің қызметтік міндеттерін, қойма каталогының көрінуін және рұқсат етілген санаттарын реттеңіз, жаңа рөлдер мен санаттар жасаңыз.' 
                : 'Adjust role responsibilities, configure warehouse catalog visibility and permitted categories, and create new roles or categories.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => syncWithDb()}
            className="fluent-btn-secondary"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh from Database"
          >
            <RefreshCw size={14} />
            <span>{lang === 'ru' ? 'Синхронизировать' : lang === 'kk' ? 'Синхрондау' : 'Sync'}</span>
          </button>

          {adminTab === 'users' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="fluent-btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '700'
              }}
            >
              <UserPlus size={15} />
              <span>{lang === 'ru' ? 'Добавить сотрудника' : lang === 'kk' ? 'Қызметкер қосу' : 'Add Staff Member'}</span>
            </button>
          )}

          {adminTab === 'roles' && (
            <button
              onClick={() => {
                setEditingRole(null);
                setIsRoleModalOpen(true);
              }}
              className="fluent-btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '700'
              }}
            >
              <Plus size={16} />
              <span>{lang === 'ru' ? 'Создать новую роль' : lang === 'kk' ? 'Жаңа рөл жасау' : 'Create New Role'}</span>
            </button>
          )}

          {adminTab === 'categories' && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="fluent-btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '700'
              }}
            >
              <Plus size={16} />
              <span>{lang === 'ru' ? 'Добавить категорию' : lang === 'kk' ? 'Санат қосу' : 'Add Storage Category'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      {/* Sub-Tabs Switcher */}
      <div className="mobile-overflow-x" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        paddingBottom: '4px',
        whiteSpace: 'nowrap'
      }}>
        <button
          onClick={() => setAdminTab('users')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: adminTab === 'users' ? '700' : '500',
            background: adminTab === 'users' ? (isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.16)') : 'transparent',
            color: adminTab === 'users' ? (isLight ? '#4338ca' : '#818cf8') : 'var(--text-muted)',
            border: adminTab === 'users' ? (isLight ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid rgba(99, 102, 241, 0.35)') : '1px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          <span>{lang === 'ru' ? 'Сотрудники' : lang === 'kk' ? 'Қызметкерлер' : 'Staff Members'} ({totalUsers})</span>
        </button>

        <button
          onClick={() => setAdminTab('roles')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: adminTab === 'roles' ? '700' : '500',
            background: adminTab === 'roles' ? (isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.16)') : 'transparent',
            color: adminTab === 'roles' ? (isLight ? '#4338ca' : '#818cf8') : 'var(--text-muted)',
            border: adminTab === 'roles' ? (isLight ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid rgba(99, 102, 241, 0.35)') : '1px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldCheck size={16} />
          <span>{lang === 'ru' ? 'Роли и задачи' : lang === 'kk' ? 'Рөлдер мен міндеттер' : 'Roles & Tasks'} ({totalRoles})</span>
        </button>

        <button
          onClick={() => setAdminTab('categories')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: adminTab === 'categories' ? '700' : '500',
            background: adminTab === 'categories' ? (isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.16)') : 'transparent',
            color: adminTab === 'categories' ? (isLight ? '#4338ca' : '#818cf8') : 'var(--text-muted)',
            border: adminTab === 'categories' ? (isLight ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid rgba(99, 102, 241, 0.35)') : '1px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Boxes size={16} />
          <span>{lang === 'ru' ? 'Категории склада' : lang === 'kk' ? 'Қойма санаттары' : 'Storage Categories'} ({totalCategories})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: STAFF MEMBERS (USERS TABLE)                             */}
      {/* ============================================================== */}
      {adminTab === 'users' && (
        <>
          {/* Summary KPI Cards */}
          <div className="dashboard-stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Всего сотрудников' : lang === 'kk' ? 'Барлық қызметкерлер' : 'Total Staff Accounts'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main, #fff)' }}>
                {totalUsers}
              </div>
              <div style={{ fontSize: '11px', color: isLight ? '#4338ca' : '#818cf8', fontWeight: isLight ? '600' : 'normal', marginTop: '4px' }}>
                Synced in SQLite DB
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Директорат' : lang === 'kk' ? 'Директорат' : 'Directorate'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: isLight ? '#4338ca' : '#818cf8' }}>
                {usersList?.filter(u => (u.role || u.roleKey) === 'director').length || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Full system authority
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Менеджеры Склада & АХЧ' : lang === 'kk' ? 'Қойма және АХЧ' : 'Operations Managers'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: isLight ? '#b45309' : '#fbbf24' }}>
                {usersList?.filter(u => ['facilities_manager', 'storage_manager', 'workerA'].includes(u.role || u.roleKey)).length || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Storage & Facilities
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                {lang === 'ru' ? 'Преподаватели' : lang === 'kk' ? 'Мұғалімдер' : 'Teachers & Requesters'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: isLight ? '#1d4ed8' : '#3b82f6' }}>
                {usersList?.filter(u => (u.role || u.roleKey || 'teacher') === 'teacher').length || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Stationery & lesson orders
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="glass-panel" style={{
            padding: '14px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'ru' ? 'Поиск по имени, email или кафедре...' : lang === 'kk' ? 'Аты, email немесе бөлім бойынша іздеу...' : 'Search by name, email or department...'}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  borderRadius: '6px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.16)' : '1px solid var(--border-color)',
                  color: isLight ? '#0f172a' : '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.04)' : 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.16)' : '1px solid var(--border-color)',
                  color: isLight ? '#0f172a' : '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.04)' : 'none'
                }}
              >
                <option value="all">{lang === 'ru' ? 'Все роли' : lang === 'kk' ? 'Барлық рөлдер' : 'All Roles'}</option>
                {rolesList.map(rc => (
                  <option key={rc.key} value={rc.key}>
                    {lang === 'ru' ? rc.labelRu : lang === 'kk' ? rc.labelKk : rc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Members Table */}
          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)', borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid var(--border-color)', color: isLight ? '#475569' : 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: '700' }}>
                      {lang === 'ru' ? 'Сотрудник' : lang === 'kk' ? 'Қызметкер' : 'Staff Member'}
                    </th>
                    <th style={{ padding: '14px 20px', fontWeight: '700' }}>
                      {lang === 'ru' ? 'Кафедра / Отдел' : lang === 'kk' ? 'Бөлім / Кафедра' : 'Department'}
                    </th>
                    <th style={{ padding: '14px 20px', fontWeight: '700' }}>
                      {lang === 'ru' ? 'Текущая роль' : lang === 'kk' ? 'Ағымдағы рөлі' : 'Assigned Role'}
                    </th>
                    <th style={{ padding: '14px 20px', fontWeight: '700' }}>
                      {lang === 'ru' ? 'Изменить роль' : lang === 'kk' ? 'Рөлді өзгерту' : 'Change Role (Director Authority)'}
                    </th>
                    <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right' }}>
                      {lang === 'ru' ? 'Действия' : lang === 'kk' ? 'Әрекеттер' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No staff members match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const currentRoleKey = user.role || user.roleKey || 'teacher';
                      const isSelf = user.id === currentUser?.id;
                      const isLoadingThis = loadingAction === `role-${user.id}`;
                      const roleDef = getRoleDefinition(currentRoleKey, rolesConfig);
                      const avatarColor = isLight ? (LIGHT_ROLE_COLORS[currentRoleKey]?.color || '#4338ca') : (roleDef.color || '#818cf8');
                      const avatarBg = isLight ? (LIGHT_ROLE_COLORS[currentRoleKey]?.bg || 'rgba(99, 102, 241, 0.1)') : (roleDef.bg || 'rgba(99, 102, 241, 0.15)');
                      const avatarBorder = isLight ? (LIGHT_ROLE_COLORS[currentRoleKey]?.border || '#c7d2fe') : (roleDef.border || 'rgba(99, 102, 241, 0.3)');

                      return (
                        <tr 
                          key={user.id || user.roleKey} 
                          style={{ 
                            borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.05)',
                            background: isSelf ? (isLight ? 'rgba(79, 70, 229, 0.06)' : 'rgba(99, 102, 241, 0.04)') : 'transparent',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: avatarBg,
                                border: `1px solid ${avatarBorder}`,
                                color: avatarColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '14px'
                              }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {user.name}
                                  {isSelf && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '1px 6px',
                                      borderRadius: '6px',
                                      background: isLight ? 'rgba(79, 70, 229, 0.12)' : 'rgba(99, 102, 241, 0.3)',
                                      color: isLight ? '#4338ca' : '#818cf8',
                                      fontWeight: '700'
                                    }}>
                                      You
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {user.email || 'No email registered'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px', color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building size={13} color="var(--text-muted)" />
                              <span style={{ color: 'var(--text-main)' }}>{user.department || 'General Staff'}</span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            {getRoleBadge(currentRoleKey)}
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                value={currentRoleKey}
                                disabled={isLoadingThis}
                                onChange={(e) => handleRoleChange(user.id, user, e.target.value)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                                  border: isLight ? '1px solid rgba(0, 0, 0, 0.16)' : '1px solid var(--border-color)',
                                  color: isLight ? '#0f172a' : '#fff',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  outline: 'none',
                                  cursor: isLoadingThis ? 'wait' : 'pointer',
                                  boxShadow: isLight ? '0 1px 2px rgba(0, 0, 0, 0.04)' : 'none'
                                }}
                              >
                                {rolesList.map(rc => (
                                  <option key={rc.key} value={rc.key}>
                                    {lang === 'ru' ? rc.labelRu : lang === 'kk' ? rc.labelKk : rc.label}
                                  </option>
                                ))}
                              </select>
                              {isLoadingThis && (
                                <RefreshCw size={14} className="spin" color="#818cf8" />
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setResetPwdUser(user);
                                  setNewPasswordValue('');
                                }}
                                title="Reset Staff Password"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: isLight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.1)',
                                  border: isLight ? '1px solid rgba(79, 70, 229, 0.28)' : '1px solid rgba(99, 102, 241, 0.3)',
                                  color: isLight ? '#4338ca' : '#818cf8',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <KeyRound size={13} />
                                <span>Password</span>
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={isSelf || user.roleKey === 'director'}
                                title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: isSelf ? 'transparent' : (isLight ? 'rgba(220, 38, 38, 0.08)' : 'rgba(239, 68, 68, 0.1)'),
                                  border: isSelf ? '1px solid transparent' : (isLight ? '1px solid rgba(220, 38, 38, 0.28)' : '1px solid rgba(239, 68, 68, 0.3)'),
                                  color: isSelf ? 'var(--text-muted)' : (isLight ? '#dc2626' : '#f87171'),
                                  fontSize: '11px',
                                  cursor: isSelf ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ROLE TASKS & STORAGE ACCESS MATRIX (DIRECTOR CONTROL)   */}
      {/* ============================================================== */}
      {adminTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            background: isLight ? '#eef2ff' : 'rgba(99, 102, 241, 0.08)',
            border: isLight ? '1px solid #c7d2fe' : '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '13px',
            color: isLight ? '#312e81' : '#c7d2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <strong>{lang === 'ru' ? '💡 Матрица полномочий директора:' : '💡 Director Permissions Matrix:'}</strong>{' '}
              {lang === 'ru' 
                ? 'Вы можете настроить функционал любой роли, указать видят ли сотрудники склад, и ограничить доступ только к определенным категориям (например, учителям только канцтовары).'
                : 'Configure task descriptions for each role, determine whether they can browse warehouse storage, and restrict catalog access to specific categories (e.g., teachers restricted to stationery & lesson loans).'}
            </div>
            <button
              onClick={() => {
                setEditingRole(null);
                setIsRoleModalOpen(true);
              }}
              className="fluent-btn-primary"
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>{lang === 'ru' ? 'Добавить новую роль' : 'Add New Role'}</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px'
          }}>
            {rolesList.map(r => {
              const IconComp = getRoleIconComponent(r.icon);
              const isAllowedAll = !r.allowedCategories || r.allowedCategories.includes('all');
              const roleTitle = lang === 'ru' ? r.labelRu || r.label : lang === 'kk' ? r.labelKk || r.label : r.label;
              const roleScope = lang === 'ru' ? r.scopeRu || r.scope : lang === 'kk' ? r.scopeKk || r.scope : r.scope;
              const roleCardColor = isLight ? (LIGHT_ROLE_COLORS[r.key]?.color || '#4338ca') : (r.color || '#818cf8');
              const roleCardBg = isLight ? (LIGHT_ROLE_COLORS[r.key]?.bg || 'rgba(99, 102, 241, 0.1)') : (r.bg || 'rgba(99, 102, 241, 0.15)');
              const roleCardBorder = isLight ? (LIGHT_ROLE_COLORS[r.key]?.border || '#c7d2fe') : (r.border || 'rgba(99, 102, 241, 0.3)');

              return (
                <div
                  key={r.key}
                  className="glass-panel"
                  style={{
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    border: `1.5px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : (r.border || 'var(--border-color, rgba(255, 255, 255, 0.08))')}`,
                    background: 'var(--bg-card, rgba(24, 24, 27, 0.75))'
                  }}
                >
                  <div>
                    {/* Role Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: roleCardBg,
                          border: `1px solid ${roleCardBorder}`,
                          color: roleCardColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <IconComp size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{roleTitle}</span>
                            {!DEFAULT_ROLES[r.key] && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isLight ? 'rgba(79, 70, 229, 0.12)' : 'rgba(99, 102, 241, 0.25)',
                                color: isLight ? '#4338ca' : '#a5b4fc',
                                border: isLight ? '1px solid #c7d2fe' : '1px solid rgba(99, 102, 241, 0.4)'
                              }}>
                                Custom Role
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            role: {r.key}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Everyday Report Access Badge */}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: canRoleAccessDailyDigest(r.key, rolesConfig) ? (isLight ? '#faf5ff' : 'rgba(168, 85, 247, 0.15)') : (isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.12)'),
                          color: canRoleAccessDailyDigest(r.key, rolesConfig) ? (isLight ? '#7e22ce' : '#c084fc') : 'var(--text-muted)',
                          border: canRoleAccessDailyDigest(r.key, rolesConfig) ? (isLight ? '1px solid #e9d5ff' : '1px solid rgba(168, 85, 247, 0.3)') : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(148, 163, 184, 0.25)')
                        }}>
                          <CalendarCheck2 size={12} />
                          <span>{canRoleAccessDailyDigest(r.key, rolesConfig) ? (lang === 'ru' ? 'Ежедневный отчет' : lang === 'kk' ? 'Күнделікті есеп' : 'Daily Report') : (lang === 'ru' ? 'Отчет скрыт' : lang === 'kk' ? 'Есеп жабық' : 'Report Hidden')}</span>
                        </span>

                        {/* Storage Access Badge */}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: r.canViewStorage ? (isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.15)') : (isLight ? '#f1f5f9' : 'rgba(148, 163, 184, 0.12)'),
                          color: r.canViewStorage ? (isLight ? '#15803d' : '#4ade80') : 'var(--text-muted)',
                          border: r.canViewStorage ? (isLight ? '1px solid #bbf7d0' : '1px solid rgba(34, 197, 94, 0.3)') : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(148, 163, 184, 0.25)')
                        }}>
                          {r.canViewStorage ? (
                            <>
                              <Eye size={12} />
                              <span>{lang === 'ru' ? 'Склад открыт' : 'Storage Visible'}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              <span>{lang === 'ru' ? 'Склад закрыт' : 'Storage Hidden'}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Operational Task / Scope Description */}
                    <div style={{
                      background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {lang === 'ru' ? 'Задачи и ответственность роли:' : 'Operational Scope & Tasks:'}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {roleScope || 'Standard operational assignments.'}
                      </div>
                    </div>

                    {/* Storage Categories Permissions */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {lang === 'ru' ? 'Разрешенные категории склада:' : 'Permitted Storage Categories:'}
                      </div>
                      
                      {!r.canViewStorage ? (
                        <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          {lang === 'ru' ? 'Роли запрещен просмотр склада.' : 'Storage access is disabled for this role.'}
                        </div>
                      ) : isAllowedAll ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isLight ? '#eef2ff' : 'rgba(99, 102, 241, 0.15)',
                          color: isLight ? '#4338ca' : '#a5b4fc',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: isLight ? '1px solid #c7d2fe' : '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                          <Check size={11} /> {lang === 'ru' ? 'Все категории без ограничений' : 'All Categories (Full Access)'}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {(r.allowedCategories || []).map(catId => (
                            <span
                              key={catId}
                              style={{
                                background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                                color: isLight ? '#334155' : '#e2e8f0',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              {getCategoryLabel(catId, lang, true)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Action Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {r.canManageStock ? (
                        <span style={{ color: isLight ? '#b45309' : '#fbbf24', fontWeight: '700' }}>● {lang === 'ru' ? 'Право списания' : 'Can Deduct Stock'}</span>
                      ) : (
                        <span>{lang === 'ru' ? 'Только заказ' : 'Ordering Only'}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingRole(r);
                          setIsRoleModalOpen(true);
                        }}
                        className="fluent-btn-secondary"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Edit3 size={13} />
                        <span>{lang === 'ru' ? 'Настроить роль и доступ' : 'Adjust Tasks & Access'}</span>
                      </button>

                      {!DEFAULT_ROLES[r.key] && (
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="fluent-btn-secondary"
                          title="Delete Custom Role"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#f87171',
                            borderColor: 'rgba(239, 68, 68, 0.35)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: STORAGE CATEGORIES CATALOG (DIRECTOR CONTROL)           */}
      {/* ============================================================== */}
      {adminTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
            border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '13px',
            color: isLight ? '#92400e' : '#fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <strong>{lang === 'ru' ? '📦 Каталог категорий склада школы:' : '📦 School Warehouse Categories:'}</strong>{' '}
              {lang === 'ru'
                ? 'Директор может добавлять новые категории товаров, задавать постоянную локацию полок на складе и определять, выдается ли товар навсегда или на 1-2 урока с возвратом.'
                : 'The Director can add new inventory categories, configure default shelf locations, and specify whether goods are consumable or issued temporarily for 1-2 lessons.'}
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="fluent-btn-primary"
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>{lang === 'ru' ? 'Добавить категорию' : 'Add New Category'}</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {categoriesList.map(cat => {
              const catTitle = getCategoryLabel(cat.id, lang);
              const itemCount = (inventory || []).filter(i => (i.category || 'other') === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="glass-panel"
                  style={{
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    border: `1.5px solid ${cat.borderColor || 'var(--border-color, rgba(255, 255, 255, 0.08))'}`,
                    background: 'var(--bg-card, rgba(24, 24, 27, 0.75))'
                  }}
                >
                  <div>
                    {/* Category Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>{cat.icon || '📦'}</span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: isLight ? '#0f172a' : '#fff' }}>
                            {catTitle}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            id: {cat.id}
                          </div>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                        color: isLight ? '#334155' : '#fff',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)'
                      }}>
                        {itemCount} {lang === 'ru' ? 'товаров' : 'items'}
                      </span>
                    </div>

                    {/* Policy Badge (Loan vs Consumable) */}
                    <div style={{ marginBottom: '12px' }}>
                      {cat.isReturnable ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: isLight ? '#fff7ed' : 'rgba(249, 115, 22, 0.15)',
                          border: isLight ? '1px solid #fed7aa' : '1px solid rgba(249, 115, 22, 0.35)',
                          color: isLight ? '#c2410c' : '#fb923c',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          <Clock size={13} />
                          <span>{lang === 'ru' ? 'Временная выдача на 1-2 урока (С обязательным возвратом)' : 'Temporary 1-2 Lesson Loan (Must be returned)'}</span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)',
                          border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.3)',
                          color: isLight ? '#1d4ed8' : '#60a5fa',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          <CheckCircle2 size={13} />
                          <span>{lang === 'ru' ? 'Расходные материалы (Выдаются без возврата)' : 'Consumable Supplies (Issued permanently)'}</span>
                        </div>
                      )}
                    </div>

                    {/* Shelf / Warehouse Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MapPin size={13} color={isLight ? '#b45309' : '#fbbf24'} />
                      <span>{cat.defaultLocation || 'Main Warehouse'}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingTop: '12px',
                    borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      className="fluent-btn-secondary"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Edit3 size={13} />
                      <span>{lang === 'ru' ? 'Редактировать' : 'Edit Category'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Staff Member */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel modal-dialog-responsive" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '24px',
            background: 'var(--bg-modal, #18181b)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={22} color="var(--primary, #818cf8)" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #fff)' }}>
                  Add Staff Member
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Aigul Nurpeisova"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Work Email (Login Username) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., a.nurpeisova@school.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  System Role (Permissions & Tasks) *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {rolesList.map(rc => (
                    <option key={rc.key} value={rc.key}>
                      {lang === 'ru' ? rc.labelRu : lang === 'kk' ? rc.labelKk : rc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Department / Faculty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Physics Dept"
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+7 (701) 000-00-00"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Initial Password (Staff will use to log in)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., school123"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loadingAction === 'create'}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    background: '#0f6cbd',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {loadingAction === 'create' ? 'Creating...' : 'Create Staff User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPwdUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel modal-dialog-responsive" style={{
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '16px',
            padding: '24px',
            background: 'var(--bg-modal, #18181b)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={22} color="var(--primary, #818cf8)" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #fff)' }}>
                  Reset Staff Password
                </h3>
              </div>
              <button
                onClick={() => setResetPwdUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Set a new password for <strong style={{ color: 'var(--text-main, #fff)' }}>{resetPwdUser.name}</strong> ({resetPwdUser.email}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showResetPwd ? 'text' : 'password'}
                  required
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPwd(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showResetPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loadingAction === 'reset-pwd'}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: '#0f6cbd',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {loadingAction === 'reset-pwd' ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Editor Modal */}
      <RoleEditorModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        editingRole={editingRole}
        allCategories={categoriesList}
        onSave={handleSaveRole}
        lang={lang}
      />

      {/* Category Editor Modal */}
      <CategoryEditorModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        categoryData={editingCategory}
        onSave={handleSaveCategory}
        lang={lang}
      />

    </div>
  );
};
