import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  ClipboardList, 
  CheckCircle2, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck, 
  Plus, 
  Laptop, 
  Truck, 
  Package, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Users,
  Layers,
  ChevronRight,
  Wrench,
  CalendarCheck2,
  CalendarRange,
  CalendarDays,
  Calendar,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { resolveDepartment, DEPARTMENTS } from '../departments';
import { navigate } from '../router';

export const Dashboard = ({ setActiveTab, onOpenNewTicket }) => {
  const { t, role, currentUser, tickets, scopedTickets: appScopedTickets, myCreatedTicketIds, inventory, lang, canAccessDailyDigest: canAccessDailyDigestFn } = useApp();

  const hasDailyDigestAccess = canAccessDailyDigestFn ? canAccessDailyDigestFn(role) : (['director', 'admin', 'engineer', 'head_engineer', 'storage_manager', 'workerA', 'facilities_manager', 'finance', 'accountant', 'cleaning_head', 'cleaning', 'it_support'].includes(role));

  // Scoped tickets that this user is authorized/related to see
  const scopedTickets = appScopedTickets || [];

  // General Metrics scoped to user's authorized visibility
  const totalTickets = scopedTickets.length;
  const pendingCount = scopedTickets.filter(t => t.status === 'pending').length;
  const inProgressCount = scopedTickets.filter(t => t.status === 'in_progress' || t.status === 'purchasing').length;
  const completedCount = scopedTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
  
  // Total Spent (₸) from storage purchasing and facility parts
  const totalSpent = scopedTickets.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);

  // Today's metrics for everyday tracking
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayCreatedTickets = scopedTickets.filter(t => (t.createdAt || '').slice(0, 10) === todayDateStr);
  const todayCreatedCount = todayCreatedTickets.length;
  const todayFinishedCount = scopedTickets.filter(t => 
    (t.status === 'completed' || t.status === 'delivered' || t.status === 'issued') &&
    ((t.completedAt || t.updatedAt || '').slice(0, 10) === todayDateStr || (t.createdAt || '').slice(0, 10) === todayDateStr)
  ).length;

  // Department specific stats based on scoped tickets
  const itTickets = scopedTickets.filter(t => resolveDepartment(t.department).id === 'it_helpdesk');
  const cleaningTickets = scopedTickets.filter(t => resolveDepartment(t.department).id === 'cleaning');
  const storageTickets = scopedTickets.filter(t => resolveDepartment(t.department).id === 'storage');
  const facilitiesTickets = scopedTickets.filter(t => ['carpentry', 'event_prep', 'grounds'].includes(resolveDepartment(t.department).id));
  const engineeringTickets = scopedTickets.filter(t => ['electrical', 'plumbing', 'carpentry'].includes(resolveDepartment(t.department).id));
  const financeTickets = scopedTickets.filter(t => Number(t.purchaseCost) > 0 || t.status === 'purchasing' || t.handledAction === 'purchased' || resolveDepartment(t.department).id === 'storage');

  // Weekly Metrics (Current week: Monday to Sunday)
  const weekMetrics = React.useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const startMon = new Date(now.getFullYear(), now.getMonth(), diffToMon, 0, 0, 0, 0);
    const endSun = new Date(startMon);
    endSun.setDate(endSun.getDate() + 6);
    endSun.setHours(23, 59, 59, 999);

    const sMs = startMon.getTime();
    const eMs = endSun.getTime();

    const createdInWeek = scopedTickets.filter(tk => {
      const cMs = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
      return cMs >= sMs && cMs <= eMs;
    });

    const finishedInWeek = scopedTickets.filter(tk => {
      const uMs = (tk.completedAt || tk.updatedAt) ? new Date(tk.completedAt || tk.updatedAt).getTime() : 0;
      return uMs >= sMs && uMs <= eMs && (tk.status === 'completed' || tk.status === 'delivered' || tk.status === 'issued');
    });

    const inProgInWeek = scopedTickets.filter(tk => {
      const cMs = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
      return cMs >= sMs && cMs <= eMs && (tk.status === 'in_progress' || tk.status === 'purchasing');
    });

    const slaPercent = createdInWeek.length > 0
      ? Math.round((finishedInWeek.length / createdInWeek.length) * 100)
      : 100;

    return {
      createdCount: createdInWeek.length,
      finishedCount: finishedInWeek.length,
      inProgCount: inProgInWeek.length,
      slaPercent
    };
  }, [scopedTickets]);

  // Monthly Metrics (Current Calendar Month)
  const monthMetrics = React.useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const createdInMonth = scopedTickets.filter(tk => (tk.createdAt || '').startsWith(monthPrefix));
    const finishedInMonth = scopedTickets.filter(tk => 
      (tk.status === 'completed' || tk.status === 'delivered' || tk.status === 'issued') &&
      ((tk.completedAt || tk.updatedAt || '').startsWith(monthPrefix) || (tk.createdAt || '').startsWith(monthPrefix))
    );

    const spentInMonth = createdInMonth.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);

    const handlers = new Set();
    createdInMonth.forEach(tk => {
      if (tk.assignedWorker) handlers.add(tk.assignedWorker);
    });

    return {
      createdCount: createdInMonth.length,
      finishedCount: finishedInMonth.length,
      spent: spentInMonth,
      handlersCount: handlers.size
    };
  }, [scopedTickets]);

  const calloutHeadline = React.useMemo(() => {
    if (role === 'engineer') {
      return lang === 'ru' ? 'Главный инженер • Ежедневный операционный контроль' : lang === 'kk' ? 'Бас инженер • Күнделікті операциялық бақылау' : 'Main Engineer Daily Ticket & Maintenance Intelligence';
    }
    if (role === 'storage_manager' || role === 'workerA') {
      return lang === 'ru' ? 'Заведующий складом • Ежедневный контроль заявок' : lang === 'kk' ? 'Қойма меңгерушісі • Күнделікті өтінімдерді бақылау' : 'Storage & Warehouse Daily Operations Intelligence';
    }
    if (role === 'finance' || role === 'accountant') {
      return lang === 'ru' ? 'Финансовый отдел • Ежедневный контроль расходов и закупок' : lang === 'kk' ? 'Қаржы бөлімі • Шығындар мен сатып алулардың күнделікті бақылауы' : 'Finance & Procurement Daily Operations Intelligence';
    }
    if (role === 'facilities_manager') {
      return lang === 'ru' ? 'Менеджер АХО • Ежедневный операционный контроль' : lang === 'kk' ? 'АХО менеджері • Күнделікті операциялық бақылау' : 'Facilities Management Daily Operations Intelligence';
    }
    return lang === 'ru' ? 'Ежедневный операционный контроль директора' : lang === 'kk' ? 'Директордың күнделікті операциялық бақылауы' : 'Director Daily Ticket Intelligence & Operations';
  }, [role, lang]);


  const lowStockItems = inventory.filter(item => item.quantity <= item.minLevel);
  const activeFurnitureMoves = facilitiesTickets.filter(t => t.moveDetails && t.status !== 'completed');

  const openNewRequestForDept = (dept = 'it_helpdesk') => {
    if (onOpenNewTicket) {
      onOpenNewTicket(dept);
    }
  };

  const getDeptProgress = (deptTickets) => {
    if (deptTickets.length === 0) return 100;
    const done = deptTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
    return Math.round((done / deptTickets.length) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Operations Command Header / Welcome Surface */}
      <div
        style={{ 
          padding: '22px 24px', 
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-depth-2)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-muted)'
                }}
              >
                <UserCheck size={13} color="var(--primary)" />
                <span>{t.roles[role]}</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {lang === 'ru' ? 'Школьный портал сервиса' : lang === 'kk' ? 'Мектеп сервистік порталы' : 'School Campus Operations'}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
              {t.dashboard.welcome} {currentUser?.name ? currentUser.name.split(' ')[0] : (role === 'parent' ? (lang === 'ru' ? 'Родитель' : 'Parent') : role === 'guest' ? (lang === 'ru' ? 'Посетитель' : 'Visitor') : 'Staff')}! 👋
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '720px', margin: 0, lineHeight: 1.5 }}>
              {(role === 'teacher' || role === 'parent' || role === 'guest')
                ? (lang === 'ru' ? 'Подавайте заявки на ремонт, IT-поддержку, уборку или канцтовары в один клик.' : lang === 'kk' ? 'Жөндеу, IT көмек, тазалық немесе кеңсе тауарларына өтінімді бір рет басу арқылы беріңіз.' : 'Request repairs, technology help, classroom cleaning, or supplies in seconds.')
                : (role === 'director' || role === 'admin')
                ? (lang === 'ru' ? 'Оперативный контроль заявок, материального учета и школьных служб.' : lang === 'kk' ? 'Мектеп қызметтері мен материалдық есепті жедел бақылау.' : 'Real-time overview of school requests, repairs, supplies, and facility operations.')
                : (t.dashboard.welcome + ' • ' + (currentUser?.department || t.roles[role]))
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {hasDailyDigestAccess && (
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px', gap: '2px' }}>
                <button
                  onClick={() => { setActiveTab('daily-digest'); navigate('/daily-digest'); }}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'var(--primary-tint)',
                    color: 'var(--primary)'
                  }}
                  title={t.nav?.dailyReport || 'Daily Report'}
                >
                  <CalendarCheck2 size={13} color="var(--primary)" />
                  <span>{t.nav?.dailyReport || 'Daily'}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('weekly-report'); navigate('/weekly-report'); }}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  title={t.nav?.weeklyReport || 'Weekly Report'}
                >
                  <CalendarRange size={13} color="currentColor" />
                  <span>{t.nav?.weeklyReport || 'Weekly'}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('monthly-report'); navigate('/monthly-report'); }}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  title={t.nav?.monthlyReport || 'Monthly Report'}
                >
                  <CalendarDays size={13} color="currentColor" />
                  <span>{t.nav?.monthlyReport || 'Monthly'}</span>
                </button>
              </div>
            )}

            {(role === 'director' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('users')}
                className="fluent-btn-secondary"
                style={{ height: '34px' }}
              >
                <Users size={14} />
                <span>{t.nav?.users || 'Staff & Roles'}</span>
              </button>
            )}

            <button
              onClick={() => openNewRequestForDept('engineering')}
              className="fluent-btn-primary"
              style={{ height: '34px', padding: '0 16px', fontWeight: '700' }}
            >
              <Plus size={15} />
              <span>{t.tickets.createTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HERO QUICK REQUEST LAUNCHPAD ("How can we help today?") */}
      {/* ============================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {lang === 'ru' ? 'Чем мы можем вам помочь?' : lang === 'kk' ? 'Сізге қалай көмектесе аламыз?' : 'How can we help you today?'}
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {lang === 'ru' ? 'Выберите тему обращения' : lang === 'kk' ? 'Қажетті қызметті таңдаңыз' : 'Click a category to submit'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {/* 1. IT & Technology Support */}
          <div
            onClick={() => openNewRequestForDept('it_helpdesk')}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: '4px solid #2563eb',
              borderRadius: '14px',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-depth-2)',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <Laptop size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 3px 0' }}>
                  {lang === 'ru' ? 'IT и смарт-доски' : lang === 'kk' ? 'IT және смарт-тақталар' : 'IT & Tech Support'}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {lang === 'ru' ? 'Смарт-доски, проекторы, Wi-Fi, ноутбуки учителей' : lang === 'kk' ? 'Смарт-тақта, проектор, Wi-Fi, мұғалім ноутбугы' : 'Smartboards, projectors, Wi-Fi, teacher laptops'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {itTickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length} {lang === 'ru' ? 'активных заявок' : 'in progress'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{lang === 'ru' ? 'Подать заявку' : lang === 'kk' ? 'Өтінім беру' : 'Request Help'}</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 2. Repairs & Maintenance */}
          <div
            onClick={() => openNewRequestForDept('engineering')}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: '4px solid #f59e0b',
              borderRadius: '14px',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-depth-2)',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                <Wrench size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 3px 0' }}>
                  {lang === 'ru' ? 'Ремонт и свет' : lang === 'kk' ? 'Жөндеу және жарық' : 'Repairs & Maintenance'}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {lang === 'ru' ? 'Освещение, розетки, мебель, сантехника, кондиционеры' : lang === 'kk' ? 'Жарық, розеткалар, жиһаз, сантехника, ауа баптағыш' : 'Lights, sockets, plumbing, heating & furniture'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {engineeringTickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length} {lang === 'ru' ? 'активных заявок' : 'in progress'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{lang === 'ru' ? 'Подать заявку' : lang === 'kk' ? 'Өтінім беру' : 'Report Issue'}</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 3. Cleaning & Care */}
          <div
            onClick={() => openNewRequestForDept('cleaning')}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: '4px solid #10b981',
              borderRadius: '14px',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-depth-2)',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 3px 0' }}>
                  {lang === 'ru' ? 'Клининг и чистота' : lang === 'kk' ? 'Тазалық және гигиена' : 'Cleaning & Hygiene'}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {lang === 'ru' ? 'Уборка класса, пятна, мусорные корзины, санузлы' : lang === 'kk' ? 'Сыныпты тазалау, дақтар, қоқыс жәшіктері' : 'Classroom spills, sanitization, waste removal'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {cleaningTickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length} {lang === 'ru' ? 'активных заявок' : 'in progress'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{lang === 'ru' ? 'Вызвать уборку' : lang === 'kk' ? 'Тазалық шақыру' : 'Request Clean'}</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* 4. Stationery & Warehouse Supplies */}
          <div
            onClick={() => openNewRequestForDept('storage')}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: '4px solid #8b5cf6',
              borderRadius: '14px',
              padding: '18px 20px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-depth-2)',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                <Package size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 3px 0' }}>
                  {lang === 'ru' ? 'Канцтовары и склад' : lang === 'kk' ? 'Кеңсе тауарлары мен қойма' : 'Supplies & Stationery'}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {lang === 'ru' ? 'Маркеры, бумага А4, папки, расходные материалы' : lang === 'kk' ? 'Маркерлер, А4 қағаз, папкалар, қажетті заттар' : 'Whiteboard markers, copy paper, lesson supplies'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {storageTickets.filter(t => t.status === 'in_progress' || t.status === 'pending').length} {lang === 'ru' ? 'активных заявок' : 'in progress'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{lang === 'ru' ? 'Заказать со склада' : lang === 'kk' ? 'Қоймадан тапсырыс' : 'Request Stock'}</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* ============================================================== */}
      {/* 1. PERSONAL REQUESTS TRACKER FOR TEACHERS, PARENTS, GUESTS */}
      {/* ============================================================== */}
      {(role === 'teacher' || role === 'parent' || role === 'guest') && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-depth-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                {lang === 'ru' ? 'Мои текущие обращения' : lang === 'kk' ? 'Менің өтінімдерім' : 'My Requests & Live Tracking'}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 9px',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                ⏳ {scopedTickets.filter(t => t.status === 'pending').length} {lang === 'ru' ? 'на рассмотрении' : 'pending'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 9px',
                borderRadius: '999px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                ⚙️ {scopedTickets.filter(t => t.status === 'in_progress' || t.status === 'purchasing').length} {lang === 'ru' ? 'в работе' : 'in progress'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 9px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                ✅ {scopedTickets.filter(t => t.status === 'completed' || t.status === 'delivered').length} {lang === 'ru' ? 'выполнено' : 'done'}
              </span>
            </div>
          </div>

          {scopedTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                {lang === 'ru' ? 'У вас нет активных заявок' : lang === 'kk' ? 'Сізде белсенді өтінімдер жоқ' : 'All clear! No active requests'}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {lang === 'ru' ? 'Если в классе что-то сломалось или нужны канцтовары, нажмите на карточку выше!' : 'If you need supplies or maintenance in your classroom, select a category above.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {scopedTickets.slice(0, 4).map(ticket => {
                const deptMeta = resolveDepartment(ticket.department);
                const deptName = deptMeta.translations?.[lang] || deptMeta.name;
                const isDone = ticket.status === 'completed' || ticket.status === 'delivered';
                const isProg = ticket.status === 'in_progress' || ticket.status === 'purchasing';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setActiveTab('tickets')}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-depth-2)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-depth-4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{deptMeta.emoji}</span>
                        <span>{deptName}</span>
                        <span style={{ color: 'var(--text-dim)' }}>• #{ticket.id}</span>
                      </span>
                      <span
                        className={`ticket-badge-status ticket-badge-status-${ticket.status}`}
                        style={{ fontSize: '10px', padding: '1px 8px', borderRadius: '999px' }}
                      >
                        {isDone ? (lang === 'ru' ? '✓ Выполнено' : '✓ Done') : isProg ? (lang === 'ru' ? '⚙️ В работе' : '⚙️ Working') : (lang === 'ru' ? '⏳ На рассмотрении' : '⏳ Pending')}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {ticket.itemTitle}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span>📍 {ticket.roomNumber || 'Campus'}</span>
                      {ticket.assignedWorker && (
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                          👤 {ticket.assignedWorker}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {scopedTickets.length > 4 && (
            <div style={{ textAlign: 'center', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{lang === 'ru' ? `Смотреть все мои заявки (${scopedTickets.length})` : `View all requests (${scopedTickets.length})`}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. EXECUTIVE KPI CARDS & OPERATIONS REPORTS (Leadership / Staff) */}
      {/* ============================================================== */}
      {hasDailyDigestAccess && (role === 'director' || role === 'admin' || role === 'head_engineer' || role === 'facilities_manager' || role === 'finance') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '8px' }}>
          
          {/* Executive Operations Reports Hub (Daily, Weekly, Monthly) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={17} color="var(--primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                {lang === 'ru' ? 'Центр оперативных отчетов' : lang === 'kk' ? 'Операциялық есептер орталығы' : 'Operations Reports Suite'}
              </h3>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {lang === 'ru' ? 'Ежедневная, еженедельная и ежемесячная аналитика' : lang === 'kk' ? 'Күнделікті, апталық және айлық аналитика' : 'Real-time operational intelligence across campus'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '12px' }}>
            
            {/* 1. DAILY REPORT CARD */}
            <div
              onClick={() => { setActiveTab('daily-digest'); navigate('/daily-digest'); }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #8b5cf6',
                borderRadius: '14px',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.12)', padding: '7px', borderRadius: '8px', color: '#7c3aed' }}>
                      <CalendarCheck2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {lang === 'ru' ? 'Ежедневный отчет' : lang === 'kk' ? 'Күнделікті есеп' : 'Daily Operations Digest'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {lang === 'ru' ? 'Почасовой контроль и статус дня' : lang === 'kk' ? 'Сағаттық бақылау және күндік статус' : 'Hourly timeline & live status'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '5px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                    ● Live Today
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'Создано' : lang === 'kk' ? 'Берілді' : 'Created'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {todayCreatedCount}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'Завершено' : lang === 'kk' ? 'Орындалды' : 'Resolved'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                      {todayFinishedCount}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'В работе' : lang === 'kk' ? 'Жұмыста' : 'In Progress'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>
                      {inProgressCount}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {lang === 'ru' ? 'Почасовая шкала и исполнители' : lang === 'kk' ? 'Сағаттық шкала және жауаптылар' : 'Hourly breakdown & team assignments'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed', fontSize: '11.5px', fontWeight: '700' }}>
                  <span>{lang === 'ru' ? 'Открыть' : lang === 'kk' ? 'Ашу' : 'Open'}</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            </div>

            {/* 2. WEEKLY REPORT CARD */}
            <div
              onClick={() => { setActiveTab('weekly-report'); navigate('/weekly-report'); }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #0284c7',
                borderRadius: '14px',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(2, 132, 199, 0.12)', padding: '7px', borderRadius: '8px', color: '#0284c7' }}>
                      <CalendarRange size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {lang === 'ru' ? 'Еженедельный отчет' : lang === 'kk' ? 'Апталық есеп' : 'Weekly Operations & SLA'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {lang === 'ru' ? 'Динамика Пн–Вс, пиковые дни и SLA' : lang === 'kk' ? 'Дүйсенбі–Жексенбі динамикасы мен SLA' : 'Monday to Sunday trends & SLA'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '5px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                    7 Days
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'За неделю' : lang === 'kk' ? 'Аптада' : 'Week Intake'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {weekMetrics.createdCount}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'SLA решения' : lang === 'kk' ? 'SLA шешу' : 'SLA Rate'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0284c7' }}>
                      {weekMetrics.slaPercent}%
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'Закрыто' : lang === 'kk' ? 'Орындалды' : 'Finished'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                      {weekMetrics.finishedCount}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {lang === 'ru' ? 'График нагрузки и пиковые дни' : lang === 'kk' ? 'Жұмыс кестесі мен ең ауыр күндер' : 'Weekday comparison & peak workload'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontSize: '11.5px', fontWeight: '700' }}>
                  <span>{lang === 'ru' ? 'Открыть' : lang === 'kk' ? 'Ашу' : 'Open'}</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            </div>

            {/* 3. MONTHLY REPORT CARD */}
            <div
              onClick={() => { setActiveTab('monthly-report'); navigate('/monthly-report'); }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '14px',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '7px', borderRadius: '8px', color: '#d97706' }}>
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {lang === 'ru' ? 'Ежемесячный отчет' : lang === 'kk' ? 'Айлық есеп' : 'Monthly Performance & Spend'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {lang === 'ru' ? '30 дней, бюджет закупок и рейтинг' : lang === 'kk' ? '30 күндік талдау, шығындар мен рейтинг' : '30-day curve, procurement & staff ranking'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '5px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                    Month
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'За месяц' : lang === 'kk' ? 'Ай бойы' : 'Month Total'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {monthMetrics.createdCount}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'Затраты' : lang === 'kk' ? 'Шығындар' : 'Procurement'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>
                      ₸{monthMetrics.spent.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border-color)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                      {lang === 'ru' ? 'Специалисты' : lang === 'kk' ? 'Мамандар' : 'Staff'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                      {monthMetrics.handlersCount}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {lang === 'ru' ? 'Недельные тренды и финансовые списания' : lang === 'kk' ? 'Апталық трендтер мен қаржылық есеп' : 'Week-by-week trend & department spend'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontSize: '11.5px', fontWeight: '700' }}>
                  <span>{lang === 'ru' ? 'Открыть' : lang === 'kk' ? 'Ашу' : 'Open'}</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
      {(role === 'director' || role === 'admin') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* Total School Requests */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'var(--primary-tint)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '10px', borderRadius: '10px' }}>
                <ClipboardList size={20} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.totalJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {totalTickets}
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #0284c7',
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <Clock size={20} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.inProcessJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284c7', lineHeight: 1.2 }}>
                  {inProgressCount}
                </div>
              </div>
            </div>

            {/* Completed */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #10b981',
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <CheckCircle2 size={20} color="#059669" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.completedJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', lineHeight: 1.2 }}>
                  {completedCount}
                </div>
              </div>
            </div>

            {/* Pending Assignment */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <AlertTriangle size={20} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.pendingJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', lineHeight: 1.2 }}>
                  {pendingCount}
                </div>
              </div>
            </div>

            {/* Budget / Parts Spent */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid #8b5cf6',
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <DollarSign size={20} color="#7c3aed" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.totalSpent}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
                  ₸{totalSpent.toLocaleString()}
                </div>
              </div>
            </div>

          </div>

          {/* Department Workload & Completion Status */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-depth-2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  {t.dashboard.departmentWorkload}
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Campus Operations SLA</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {Object.values(DEPARTMENTS).map(dept => {
                const deptTickets = scopedTickets.filter(t => resolveDepartment(t.department).id === dept.id);
                const progress = getDeptProgress(deptTickets);
                const inProgress = deptTickets.filter(t => t.status === 'in_progress').length;
                const completed = deptTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
                const deptName = dept.translations?.[lang] || dept.name;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setActiveTab('tickets')}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                        <span>{dept.emoji}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {deptName}
                        </span>
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: progress === 100 ? '#059669' : 'var(--primary)' }}>
                        {progress}%
                      </span>
                    </div>

                    {/* Sleek Progress Bar */}
                    <div style={{ background: 'var(--border-subtle)', height: '6px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #3b82f6, #2563eb)', borderRadius: '9999px' }} />
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total: {deptTickets.length}</span>
                      <span>Active: {inProgress}</span>
                      <span style={{ color: '#059669', fontWeight: '600' }}>Done: {completed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}


      {/* Finance Department Specific Cards */}
      {(role === 'finance' || role === 'accountant') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <DollarSign size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Finance / Purchasing Jobs</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{financeTickets.length}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Clock size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Procurement</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#d97706' }}>
                {financeTickets.filter(t => t.status === 'purchasing').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #6366f1', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <TrendingUp size={20} color="#4f46e5" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Procurement Spent</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>
                ₸{totalSpent.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: 'var(--shadow-depth-2)' }} onClick={() => setActiveTab('inventory')}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Package size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Warehouse Inventory</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Audit Stock <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ROLE SPECIFIC VIEWS (Facilities / IT / Cleaning / Engineers) */}
      {/* ============================================================== */}
      {role === 'facilities_manager' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #6366f1', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Truck size={20} color="#4f46e5" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Facility Tasks</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{facilitiesTickets.length}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Clock size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Moves In Progress</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0284c7' }}>
                {facilitiesTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Completed Relocations</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                {facilitiesTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {(role === 'storage_manager' || role === 'workerA') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Package size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Storage Requests</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{storageTickets.length}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Clock size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Delivery</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0284c7' }}>
                {storageTickets.filter(t => t.status === 'in_progress' || t.status === 'purchasing').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Issued & Delivered</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                {storageTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: 'var(--shadow-depth-2)' }} onClick={() => setActiveTab('inventory')}>
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Package size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Warehouse Inventory</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Catalog <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {role === 'engineer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #ea580c', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(234, 88, 12, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Wrench size={20} color="#ea580c" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Engineering Tasks</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{engineeringTickets.length}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #0284c7', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Clock size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>In Repair</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0284c7' }}>
                {engineeringTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Resolved Maintenance</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                {engineeringTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: 'var(--shadow-depth-2)' }} onClick={() => setActiveTab('inventory')}>
            <div style={{ background: 'rgba(234, 88, 12, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Package size={20} color="#ea580c" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Warehouse Inventory</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Catalog <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {role === 'it_support' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #2563eb', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(37, 99, 235, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Laptop size={20} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Active IT Tickets</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{itTickets.length}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #ea580c', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(234, 88, 12, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <Clock size={20} color="#ea580c" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>In Diagnostics</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ea580c' }}>
                {itTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-depth-2)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Resolved Tech Issues</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                {itTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK REQUEST LAUNCHPAD */}
      {/* ============================================================== */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px 22px',
          boxShadow: 'var(--shadow-depth-2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Layers size={16} color="var(--primary)" />
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            {t.dashboard.quickActions || 'Submit Service Request by Department'}:
          </h3>
        </div>

        <div className="dashboard-service-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          {Object.values(DEPARTMENTS).map(dept => {
            const localizedName = dept.translations?.[lang] || dept.name;
            const sampleSubcats = dept.subcategories.slice(0, 3).join(', ') + '...';
            return (
              <button
                key={dept.id}
                onClick={() => openNewRequestForDept(dept.id)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = dept.color || 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-depth-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>{dept.emoji}</span>
                  <span className="dashboard-service-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {localizedName}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {sampleSubcats}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Low Stock Warning Card */}
      {['storage_manager', 'workerA', 'engineer', 'director', 'admin'].includes(role) && lowStockItems.length > 0 && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#d97706" />
            <div>
              <strong style={{ fontSize: '13px', color: '#d97706', fontWeight: '700' }}>
                {t.dashboard.lowStockAlert}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {lowStockItems.length} items in warehouse below minimum threshold (e.g. {lowStockItems[0].name}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="fluent-btn-secondary"
            style={{ height: '30px', fontSize: '12px' }}
          >
            Check Warehouse
          </button>
        </div>
      )}

      {/* Recent Requests Section (Activity Feed) */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            {(role === 'teacher' || role === 'parent' || role === 'guest') ? (t.nav?.myTickets || 'My Requests') : t.dashboard.allJobsOverview}
          </h3>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View All ({scopedTickets.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {scopedTickets.slice(0, 4).map(ticket => {
            const deptMeta = resolveDepartment(ticket.department);
            const deptName = deptMeta.translations?.[lang] || deptMeta.name;
            const isDone = ticket.status === 'completed' || ticket.status === 'delivered';
            const isProg = ticket.status === 'in_progress' || ticket.status === 'purchasing';

            return (
              <div
                key={ticket.id}
                onClick={() => setActiveTab('tickets')}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: 'var(--shadow-depth-2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-depth-8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-depth-2)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{deptMeta.emoji}</span>
                    <span>{deptName}</span>
                    <span className="ticket-id-badge">• #{ticket.id}</span>
                  </span>
                  <span
                    className={`ticket-badge-status ticket-badge-status-${ticket.status}`}
                    style={{ fontSize: '10px', padding: '1px 6px' }}
                  >
                    {ticket.status}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                  {ticket.itemTitle}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  📍 {ticket.roomNumber || 'Campus'} • By: {ticket.teacherName || 'Staff'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
