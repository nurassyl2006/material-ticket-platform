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
  Flame, 
  CheckCircle, 
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';
import { resolveDepartment, DEPARTMENTS } from '../departments';

export const Dashboard = ({ setActiveTab, onOpenNewTicket }) => {
  const { t, role, currentUser, tickets, inventory, lang } = useApp();

  // Scoped tickets that this user is authorized to see
  const scopedTickets = React.useMemo(() => {
    if (role === 'director' || role === 'admin' || role === 'teacher') return tickets;
    if (role === 'it_support') return tickets.filter(t => resolveDepartment(t.department).id === 'it_helpdesk');
    if (role === 'cleaning') return tickets.filter(t => resolveDepartment(t.department).id === 'cleaning');
    if (role === 'engineer') return tickets.filter(t => ['electrical', 'plumbing'].includes(resolveDepartment(t.department).id));
    if (role === 'storage_manager' || role === 'workerA') return tickets.filter(t => (t.department || 'storage') === 'storage' || resolveDepartment(t.department).id === 'other');
    if (role === 'facilities_manager') return tickets.filter(t => ['carpentry', 'event_prep', 'grounds'].includes(resolveDepartment(t.department).id) || (t.department || 'storage') === 'facilities');
    return tickets;
  }, [tickets, role, currentUser]);

  // General Metrics
  const totalTickets = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'purchasing').length;
  const completedCount = tickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
  
  // Total Spent (₸) from storage purchasing and facility parts
  const totalSpent = tickets.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);

  // Department specific stats based on core departments
  const itTickets = tickets.filter(t => resolveDepartment(t.department).id === 'it_helpdesk');
  const cleaningTickets = tickets.filter(t => resolveDepartment(t.department).id === 'cleaning');
  const storageTickets = tickets.filter(t => (t.department || 'storage') === 'storage' || resolveDepartment(t.department).id === 'other');
  const facilitiesTickets = tickets.filter(t => ['carpentry', 'event_prep', 'grounds'].includes(resolveDepartment(t.department).id) || (t.department || 'storage') === 'facilities');
  const engineeringTickets = tickets.filter(t => ['electrical', 'plumbing'].includes(resolveDepartment(t.department).id));

  // Critical alerts
  const criticalTickets = tickets.filter(t => t.urgency === 'critical' && t.status !== 'completed' && t.status !== 'delivered');
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
      
      {/* Microsoft 365 Command Header / Welcome Surface */}
      <div
        style={{ 
          padding: '18px 22px', 
          background: '#252525',
          border: '1px solid #383838',
          borderRadius: '6px',
          boxShadow: 'var(--shadow-depth-2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#202020',
                  border: '1px solid #383838',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#adadad'
                }}
              >
                <UserCheck size={12} color="#0f6cbd" />
                <span>{t.roles[role]}</span>
              </span>
              <span style={{ fontSize: '11px', color: '#797775' }}>•</span>
              <span style={{ fontSize: '11px', color: '#797775' }}>
                Microsoft 365 Operations Suite
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#f3f2f1', margin: '0 0 4px 0' }}>
              {t.dashboard.welcome} {currentUser?.name || 'Staff Member'}
            </h2>

            <p style={{ fontSize: '12px', color: '#adadad', maxWidth: '720px', margin: 0, lineHeight: 1.5 }}>
              {role === 'director' && t.dashboard.directorSummary}
              {role === 'facilities_manager' && t.dashboard.facilitiesSummary}
              {role === 'it_support' && t.dashboard.itSummary}
              {role === 'cleaning' && t.dashboard.cleaningSummary}
              {role === 'storage_manager' && t.dashboard.storageSummary}
              {role === 'engineer' && t.dashboard.engineerSummary}
              {role === 'teacher' && t.dashboard.teacherSummary}
              {role === 'guest' && (t.dashboard.guestSummary || 'Welcome to our school campus portal! You can submit visitor requests, report facility issues, and follow up with school administration.')}
              {role === 'parent' && (t.dashboard.parentSummary || 'Welcome to the Parent Portal! Submit classroom, facilities, and maintenance inquiries for your children’s school.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {(role === 'director' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('users')}
                className="fluent-btn-secondary"
                style={{ height: '32px' }}
              >
                <Users size={14} />
                <span>{t.nav?.users || 'Staff & Roles'}</span>
              </button>
            )}

            <button
              onClick={() => openNewRequestForDept('engineering')}
              className="fluent-btn-primary"
              style={{ height: '32px' }}
            >
              <Plus size={14} />
              <span>{t.tickets.createTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Warning (Microsoft Fluent Error / Crimson MessageBar) */}
      {criticalTickets.length > 0 && (
        <div
          style={{ 
            padding: '10px 16px', 
            background: '#292020', 
            border: '1px solid #5a2024',
            borderLeft: '4px solid #d13438',
            borderRadius: '4px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '10px' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={18} color="#d13438" />
            <div>
              <strong style={{ fontSize: '13px', color: '#f87171', fontWeight: '600' }}>
                {t.dashboard.urgentAlerts} ({criticalTickets.length})
              </strong>
              <p style={{ fontSize: '12px', color: '#adadad', margin: 0 }}>
                {criticalTickets.map(ct => `[${resolveDepartment(ct.department).emoji} ${ct.itemTitle}] (${ct.roomNumber || 'Campus'})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('tickets')}
            className="fluent-btn-primary"
            style={{ height: '28px', background: '#d13438', fontSize: '12px' }}
          >
            Review Tasks
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. EXECUTIVE KPI CARDS GRID (Microsoft Azure / Office 365 KPI Cards) */}
      {/* ============================================================== */}
      {(role === 'director' || role === 'admin') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* Total School Requests */}
            <div
              style={{
                background: '#292929',
                border: '1px solid #383838',
                borderLeft: '3px solid #0f6cbd',
                borderRadius: '4px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
                <ClipboardList size={20} color="#0f6cbd" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {t.dashboard.totalJobs}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#f3f2f1', lineHeight: 1.2 }}>
                  {totalTickets}
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div
              style={{
                background: '#292929',
                border: '1px solid #383838',
                borderLeft: '3px solid #0f6cbd',
                borderRadius: '4px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
                <Clock size={20} color="#70b5f9" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {t.dashboard.inProcessJobs}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#70b5f9', lineHeight: 1.2 }}>
                  {inProgressCount}
                </div>
              </div>
            </div>

            {/* Completed */}
            <div
              style={{
                background: '#292929',
                border: '1px solid #383838',
                borderLeft: '3px solid #107c41',
                borderRadius: '4px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
                <CheckCircle2 size={20} color="#107c41" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {t.dashboard.completedJobs}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#62c789', lineHeight: 1.2 }}>
                  {completedCount}
                </div>
              </div>
            </div>

            {/* Pending Assignment */}
            <div
              style={{
                background: '#292929',
                border: '1px solid #383838',
                borderLeft: '3px solid #d83b01',
                borderRadius: '4px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
                <AlertTriangle size={20} color="#d83b01" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {t.dashboard.pendingJobs}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '600', color: '#f59e0b', lineHeight: 1.2 }}>
                  {pendingCount}
                </div>
              </div>
            </div>

            {/* Budget / Parts Spent */}
            <div
              style={{
                background: '#292929',
                border: '1px solid #383838',
                borderLeft: '3px solid #5b5fc7',
                borderRadius: '4px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
                <DollarSign size={20} color="#8b8fe6" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {t.dashboard.totalSpent}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#f3f2f1', lineHeight: 1.2 }}>
                  ₸{totalSpent.toLocaleString()}
                </div>
              </div>
            </div>

          </div>

          {/* Department Workload & Completion Status */}
          <div
            style={{
              background: '#292929',
              border: '1px solid #383838',
              borderRadius: '6px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-depth-2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#0f6cbd" />
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f3f2f1', margin: 0 }}>
                  {t.dashboard.departmentWorkload}
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#adadad' }}>Microsoft 365 Campus SLA</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {Object.values(DEPARTMENTS).map(dept => {
                const deptTickets = tickets.filter(t => resolveDepartment(t.department).id === dept.id);
                const progress = getDeptProgress(deptTickets);
                const inProgress = deptTickets.filter(t => t.status === 'in_progress').length;
                const completed = deptTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
                const deptName = dept.translations?.[lang] || dept.name;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setActiveTab('tickets')}
                    style={{
                      background: '#222222',
                      border: '1px solid #383838',
                      borderRadius: '4px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0f6cbd')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#383838')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#f3f2f1' }}>
                        <span>{dept.emoji}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {deptName}
                        </span>
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: progress === 100 ? '#62c789' : '#0f6cbd' }}>
                        {progress}%
                      </span>
                    </div>

                    {/* Microsoft Fluent Progress Bar (Thin, crisp) */}
                    <div style={{ background: '#333333', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#107c41' : '#0f6cbd' }} />
                    </div>

                    <div style={{ fontSize: '11px', color: '#adadad', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total: {deptTickets.length}</span>
                      <span>Active: {inProgress}</span>
                      <span style={{ color: '#62c789' }}>Done: {completed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ROLE SPECIFIC VIEWS (Facilities / IT / Cleaning / Engineers) */}
      {/* ============================================================== */}
      {role === 'facilities_manager' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#292929', border: '1px solid #383838', borderLeft: '3px solid #5b5fc7', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <Truck size={20} color="#8b8fe6" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>Facility Tasks</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#f3f2f1' }}>{facilitiesTickets.length}</div>
            </div>
          </div>

          <div style={{ background: '#292929', border: '1px solid #383838', borderLeft: '3px solid #0f6cbd', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <Clock size={20} color="#70b5f9" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>Moves In Progress</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#70b5f9' }}>
                {facilitiesTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div style={{ background: '#292929', border: '1px solid #383838', borderLeft: '3px solid #107c41', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <CheckCircle2 size={20} color="#107c41" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>Completed Relocations</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#62c789' }}>
                {facilitiesTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>

          <div style={{ background: '#292929', border: '1px solid #383838', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('inventory')}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <Package size={20} color="#0f6cbd" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>Warehouse Inventory</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f6cbd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Catalog <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {role === 'it_support' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#292929', border: '1px solid #383838', borderLeft: '3px solid #0f6cbd', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <Laptop size={20} color="#0f6cbd" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>Active IT Tickets</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#f3f2f1' }}>{itTickets.length}</div>
            </div>
          </div>

          <div style={{ background: '#292929', border: '1px solid #383838', borderLeft: '3px solid #d83b01', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <Clock size={20} color="#d83b01" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>In Diagnostics</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
                {itTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div style={{ background: '#292929', border: '1px solid #383838', borderLeft: '3px solid #107c41', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#202020', padding: '10px', borderRadius: '4px' }}>
              <CheckCircle2 size={20} color="#107c41" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#adadad', fontWeight: '600' }}>Resolved Tech Issues</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#62c789' }}>
                {itTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK REQUEST LAUNCHPAD (Microsoft 365 Service Tiles) */}
      {/* ============================================================== */}
      <div
        style={{
          background: '#292929',
          border: '1px solid #383838',
          borderRadius: '6px',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-depth-2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Layers size={16} color="#0f6cbd" />
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f3f2f1', margin: 0 }}>
            {t.dashboard.quickActions || 'Submit Service Request by Department'}:
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          {Object.values(DEPARTMENTS).map(dept => {
            const localizedName = dept.translations?.[lang] || dept.name;
            const sampleSubcats = dept.subcategories.slice(0, 3).join(', ') + '...';
            return (
              <button
                key={dept.id}
                onClick={() => openNewRequestForDept(dept.id)}
                style={{
                  background: '#222222',
                  border: '1px solid #383838',
                  padding: '12px',
                  borderRadius: '4px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0f6cbd';
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#383838';
                  e.currentTarget.style.backgroundColor = '#222222';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f3f2f1', fontWeight: '600', fontSize: '13px' }}>
                  <span>{dept.emoji}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {localizedName}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#adadad', margin: 0, lineHeight: 1.4 }}>
                  {sampleSubcats}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Low Stock Warning Card */}
      {lowStockItems.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            background: '#2a251b',
            border: '1px solid #573a11',
            borderLeft: '4px solid #d83b01',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#d83b01" />
            <div>
              <strong style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
                {t.dashboard.lowStockAlert}
              </strong>
              <p style={{ fontSize: '12px', color: '#adadad', margin: 0 }}>
                {lowStockItems.length} items in warehouse below minimum threshold (e.g. {lowStockItems[0].name}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="fluent-btn-secondary"
            style={{ height: '28px', fontSize: '12px' }}
          >
            Check Warehouse
          </button>
        </div>
      )}

      {/* Recent Requests Section (Microsoft Outlook / Teams Activity Feed) */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f3f2f1', margin: 0 }}>
            {role === 'teacher' ? (t.nav.myTickets || 'My Requests') : t.dashboard.allJobsOverview}
          </h3>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0f6cbd',
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
                  background: '#292929',
                  border: '1px solid #383838',
                  borderRadius: '4px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0f6cbd')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#383838')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#adadad', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{deptMeta.emoji}</span>
                    <span>{deptName}</span>
                    <span style={{ color: '#797775' }}>• #{ticket.id}</span>
                  </span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontWeight: '600',
                      background: isDone ? 'rgba(16, 124, 65, 0.18)' : isProg ? 'rgba(15, 108, 189, 0.18)' : 'rgba(216, 59, 1, 0.18)',
                      border: `1px solid ${isDone ? '#136136' : isProg ? '#115ea3' : '#8f2800'}`,
                      color: isDone ? '#62c789' : isProg ? '#70b5f9' : '#f59e0b'
                    }}
                  >
                    {ticket.status}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f2f1' }}>
                  {ticket.itemTitle}
                </div>

                <div style={{ fontSize: '11px', color: '#adadad' }}>
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
