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
  X,
  Lock,
  Mail,
  Phone,
  Building,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const ROLE_CONFIG = {
  director: {
    label: 'Director',
    labelRu: 'Директор (Полный доступ)',
    labelKk: 'Директор (Толық қолжетімділік)',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.15)',
    border: 'rgba(129, 140, 248, 0.35)',
    icon: Crown,
    scope: 'All departments, analytics, staff & role assignments'
  },
  facilities_manager: {
    label: 'Facilities Manager',
    labelRu: 'Менеджер АХЧ',
    labelKk: 'АХЧ менеджері',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.15)',
    border: 'rgba(167, 139, 250, 0.35)',
    icon: Truck,
    scope: 'Furniture relocation, classrooms, general repairs'
  },
  storage_manager: {
    label: 'Storage Manager',
    labelRu: 'Заведующий складом',
    labelKk: 'Қойма меңгерушісі',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    icon: Package,
    scope: 'Warehouse inventory stock deduction & purchasing'
  },
  engineer: {
    label: 'Maintenance Engineer',
    labelRu: 'Инженер-механик / Электрик',
    labelKk: 'Инженер-механик / Электрик',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.35)',
    icon: Wrench,
    scope: 'Lighting, air conditioning, sockets, heating & ventilation'
  },
  it_support: {
    label: 'IT Support',
    labelRu: 'IT специалист',
    labelKk: 'IT маманы',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Laptop,
    scope: 'Wi-Fi, laptops, projectors, printers & network issues'
  },
  cleaning: {
    label: 'Cleaning Staff',
    labelRu: 'Служба клининга',
    labelKk: 'Тазалық қызметі',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    icon: Sparkles,
    scope: 'Classroom hygiene, spills, trash removal & sanitation'
  },
  teacher: {
    label: 'Teacher / Staff',
    labelRu: 'Учитель / Сотрудник',
    labelKk: 'Мұғалім / Қызметкер',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.35)',
    icon: GraduationCap,
    scope: 'Submits problem requests across all departments'
  }
};

export const UserManagement = () => {
  const { 
    currentUser, 
    role, 
    t, 
    lang, 
    usersList, 
    syncWithDb, 
    createUser, 
    updateUserRole, 
    resetUserPassword, 
    deleteUser 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);

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
    }, 4000);
  };

  const getRoleBadge = (r) => {
    const config = ROLE_CONFIG[r] || ROLE_CONFIG.teacher;
    const Icon = config.icon;
    let label = config.label;
    if (lang === 'ru') label = config.labelRu;
    if (lang === 'kk') label = config.labelKk;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700',
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`
      }}>
        <Icon size={13} />
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
      showFeedback(`Role for ${targetUser.name} changed to ${ROLE_CONFIG[newRole]?.label || newRole}!`);
    } catch (err) {
      showFeedback(err.message || 'Failed to update role', true);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      showFeedback('Please provide name and email', true);
      return;
    }

    try {
      setLoadingAction('create');
      await createUser(newUser);
      showFeedback(`User ${newUser.name} created successfully with role ${ROLE_CONFIG[newUser.role]?.label || newUser.role}!`);
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

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 6) {
      showFeedback('Password must be at least 6 characters', true);
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

  // Security check: Only Director / Admin can view
  if (role !== 'director' && role !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', margin: '40px auto', maxWidth: '600px' }}>
        <ShieldCheck size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Director Access Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          This menu is strictly reserved for the School Director and authorized administrators to manage staff permissions.
        </p>
      </div>
    );
  }

  // Summary statistics
  const totalUsers = usersList?.length || 0;
  const directorCount = usersList?.filter(u => u.role === 'director' || u.roleKey === 'director').length || 0;
  const managersCount = usersList?.filter(u => u.role === 'facilities_manager' || u.role === 'storage_manager').length || 0;
  const operationsCount = usersList?.filter(u => u.role === 'engineer' || u.role === 'it_support' || u.role === 'cleaning').length || 0;
  const teachersCount = usersList?.filter(u => u.role === 'teacher' || (!u.role && u.roleKey === 'teacher')).length || 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)'
          }}>
            <ShieldCheck size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#fff' }}>
                {lang === 'ru' ? 'Управление персоналом и ролями' : lang === 'kk' ? 'Қызметкерлер мен рөлдерді басқару' : 'Staff & Role Management'}
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                Director Only
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {lang === 'ru' 
                ? 'Назначайте роли, контролируйте права доступа отделов и создавайте аккаунты сотрудников школы.' 
                : lang === 'kk' 
                ? 'Рөлдерді тағайындаңыз, бөлімдердің құқықтарын бақылаңыз және қызметкерлер тіркелгілерін басқарыңыз.' 
                : 'Assign roles, control department access, and manage school staff accounts.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => syncWithDb()}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Refresh Users from Database"
          >
            <RefreshCw size={15} />
            {lang === 'ru' ? 'Обновить' : lang === 'kk' ? 'Жаңарту' : 'Refresh'}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <UserPlus size={16} />
            {lang === 'ru' ? 'Добавить сотрудника' : lang === 'kk' ? 'Қызметкер қосу' : 'Add Staff Member'}
          </button>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
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
          borderRadius: '12px',
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

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {lang === 'ru' ? 'Всего сотрудников' : lang === 'kk' ? 'Барлық қызметкерлер' : 'Total Staff Accounts'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#fff' }}>
            {totalUsers}
          </div>
          <div style={{ fontSize: '11px', color: '#818cf8', marginTop: '4px' }}>
            Registered in Database
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {lang === 'ru' ? 'Директорат' : lang === 'kk' ? 'Директорат' : 'Directorate'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#818cf8' }}>
            {directorCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Full system authority
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {lang === 'ru' ? 'Менеджеры (Склад & АХЧ)' : lang === 'kk' ? 'Менеджерлер' : 'Operations Managers'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#fbbf24' }}>
            {managersCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Storage & Facilities
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {lang === 'ru' ? 'Службы (Инженеры, IT, Клининг)' : lang === 'kk' ? 'Техникалық қызметтер' : 'Technical & Support Crew'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#38bdf8' }}>
            {operationsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Field ticket resolvers
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
            {lang === 'ru' ? 'Учителя и персонал' : lang === 'kk' ? 'Мұғалімдер' : 'Teachers & Requesters'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#3b82f6' }}>
            {teachersCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Standard requesters
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '240px'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск по имени, email или кафедре...' : lang === 'kk' ? 'Аты, email немесе бөлім бойынша іздеу...' : 'Search by name, email or department...'}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">{lang === 'ru' ? 'Все роли' : lang === 'kk' ? 'Барлық рөлдер' : 'All Roles'}</option>
            <option value="director">{ROLE_CONFIG.director.label}</option>
            <option value="facilities_manager">{ROLE_CONFIG.facilities_manager.label}</option>
            <option value="storage_manager">{ROLE_CONFIG.storage_manager.label}</option>
            <option value="engineer">{ROLE_CONFIG.engineer.label}</option>
            <option value="it_support">{ROLE_CONFIG.it_support.label}</option>
            <option value="cleaning">{ROLE_CONFIG.cleaning.label}</option>
            <option value="teacher">{ROLE_CONFIG.teacher.label}</option>
          </select>
        </div>
      </div>

      {/* Staff Members List */}
      <div className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
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
                  {lang === 'ru' ? 'Изменить роль' : lang === 'kk' ? 'Рөлді өзгерту' : 'Change Role (Director Control)'}
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

                  return (
                    <tr 
                      key={user.id || user.roleKey} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isSelf ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: ROLE_CONFIG[currentRoleKey]?.bg || 'rgba(99, 102, 241, 0.15)',
                            border: `1px solid ${ROLE_CONFIG[currentRoleKey]?.border || 'rgba(99, 102, 241, 0.3)'}`,
                            color: ROLE_CONFIG[currentRoleKey]?.color || '#818cf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '14px'
                          }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {user.name}
                              {isSelf && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  background: 'rgba(99, 102, 241, 0.3)',
                                  color: '#818cf8',
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

                      {/* Department */}
                      <td style={{ padding: '14px 20px', color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={13} color="var(--text-muted)" />
                          <span>{user.department || 'General Staff'}</span>
                        </div>
                      </td>

                      {/* Current Role Badge */}
                      <td style={{ padding: '14px 20px' }}>
                        {getRoleBadge(currentRoleKey)}
                      </td>

                      {/* Change Role Selector */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            value={currentRoleKey}
                            disabled={isLoadingThis}
                            onChange={(e) => handleRoleChange(user.id, user, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '10px',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid var(--border-color)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '600',
                              outline: 'none',
                              cursor: isLoadingThis ? 'wait' : 'pointer'
                            }}
                          >
                            <option value="director">👑 Director</option>
                            <option value="facilities_manager">🚚 Facilities Manager</option>
                            <option value="storage_manager">📦 Storage Manager</option>
                            <option value="engineer">🔧 Maintenance Engineer</option>
                            <option value="it_support">💻 IT Support</option>
                            <option value="cleaning">✨ Cleaning Staff</option>
                            <option value="teacher">🎓 Teacher / Staff</option>
                          </select>
                          {isLoadingThis && (
                            <RefreshCw size={14} className="spin" color="#818cf8" />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
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
                              borderRadius: '8px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#818cf8',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
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
                              borderRadius: '8px',
                              background: isSelf ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                              border: isSelf ? '1px solid transparent' : '1px solid rgba(239, 68, 68, 0.3)',
                              color: isSelf ? 'var(--text-muted)' : '#f87171',
                              fontSize: '11px',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center'
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
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '24px',
            padding: '28px',
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                    {lang === 'ru' ? 'Добавить нового сотрудника' : lang === 'kk' ? 'Жаңа қызметкерді қосу' : 'Add New Staff Member'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Provision staff credentials and assign initial department role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Aigul Nurlanova"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
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
                  Staff Email or Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., aigul.n@school.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Assigned Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="director">👑 Director</option>
                    <option value="facilities_manager">🚚 Facilities Manager</option>
                    <option value="storage_manager">📦 Storage Manager</option>
                    <option value="engineer">🔧 Maintenance Engineer</option>
                    <option value="it_support">💻 IT Support</option>
                    <option value="cleaning">✨ Cleaning Staff</option>
                    <option value="teacher">🎓 Teacher / Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics & STEM"
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
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
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
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
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '440px',
            borderRadius: '24px',
            padding: '24px',
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={22} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#fff' }}>
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
              Set a new password for <strong style={{ color: '#fff' }}>{resetPwdUser.name}</strong> ({resetPwdUser.email}).
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
                    borderRadius: '12px',
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
                    borderRadius: '10px',
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
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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

    </div>
  );
};
