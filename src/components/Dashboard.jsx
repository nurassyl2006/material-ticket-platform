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
  const { t, role, currentUser, tickets, scopedTickets: appScopedTickets, myCreatedTicketIds, inventory, lang } = useApp();

  // Scoped tickets that this user is authorized/related to see
  const scopedTickets = appScopedTickets || [];

  // General Metrics scoped to user's authorized visibility
  const totalTickets = scopedTickets.length;
  const pendingCount = scopedTickets.filter(t => t.status === 'pending').length;
  const inProgressCount = scopedTickets.filter(t => t.status === 'in_progress' || t.status === 'purchasing').length;
  const completedCount = scopedTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
  
  // Total Spent (₸) from storage purchasing and facility parts
  const totalSpent = scopedTickets.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);

  // Department specific stats based on scoped tickets
  const itTickets = scopedTickets.filter(t => resolveDepartment(t.department).id === 'it_helpdesk');
  const cleaningTickets = scopedTickets.filter(t => resolveDepartment(t.department).id === 'cleaning');
  const storageTickets = scopedTickets.filter(t => (t.department || 'storage') === 'storage' || resolveDepartment(t.department).id === 'other');
  const facilitiesTickets = scopedTickets.filter(t => ['carpentry', 'event_prep', 'grounds'].includes(resolveDepartment(t.department).id) || (t.department || 'storage') === 'facilities');
  const engineeringTickets = scopedTickets.filter(t => ['electrical', 'plumbing'].includes(resolveDepartment(t.department).id));

  // Critical alerts strictly visible only to people directly connected to them
  const relevantCriticalTickets = React.useMemo(() => {
    return scopedTickets.filter(ct => {
      if (ct.urgency !== 'critical' || ct.status === 'completed' || ct.status === 'delivered') return false;

      // 1. Executive leadership (Director, Admin)
      if (role === 'director' || role === 'admin') return true;

      const myName = (currentUser?.name || '').trim().toLowerCase();
      const myId = currentUser?.id;
      const myEmail = (currentUser?.email || '').trim().toLowerCase();
      const teacherName = (ct.teacherName || '').trim().toLowerCase();
      const teacherEmail = (ct.teacherEmail || '').trim().toLowerCase();
      const assignedWorker = (ct.assignedWorker || '').trim().toLowerCase();
      const deptId = resolveDepartment(ct.department)?.id || ct.department;

      // 2. Creator/Author of this critical ticket
      if (myId && ct.createdById && ct.createdById === myId) return true;
      if (myEmail && teacherEmail && myEmail === teacherEmail) return true;
      if (myName && teacherName && myName === teacherName) return true;
      if (Array.isArray(myCreatedTicketIds) && myCreatedTicketIds.includes(ct.id)) return true;

      // 3. Directly assigned technician/worker
      if (myName && assignedWorker && (assignedWorker === myName || assignedWorker.includes(myName))) return true;
      if (ct.assignedRole && ct.assignedRole === role) return true;

      // 4. Responsible department specialists
      if (role === 'cleaning' && deptId === 'cleaning') return true;
      if (role === 'it_support' && (deptId === 'it_helpdesk' || deptId === 'it')) return true;
      if (role === 'engineer' && ['plumbing', 'electrical', 'engineering'].includes(deptId)) return true;
      if (role === 'facilities_manager' && ['carpentry', 'event_prep', 'grounds', 'facilities', 'cleaning', 'plumbing', 'electrical'].includes(deptId)) return true;
      if ((role === 'storage_manager' || role === 'workerA') && ['storage', 'other'].includes(deptId)) return true;

      return false;
    });
  }, [scopedTickets, role, currentUser, myCreatedTicketIds]);

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
          background: 'rgba(18, 25, 44, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-depth-4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#94a3b8'
                }}
              >
                <UserCheck size={12} color="#818cf8" />
                <span>{t.roles[role]}</span>
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                Campus Operations Suite
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-main, #f3f2f1)', margin: '0 0 4px 0' }}>
              {t.dashboard.welcome} {currentUser?.name || 'Staff Member'}
            </h2>

            <p style={{ fontSize: '12px', color: 'var(--text-muted, #adadad)', maxWidth: '720px', margin: 0, lineHeight: 1.5 }}>
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

      {/* Critical Alert Warning */}
      {relevantCriticalTickets.length > 0 && (
        <div
          style={{ 
            padding: '12px 18px', 
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderLeft: '4px solid #ef4444',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '12px' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={18} color="#f87171" />
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--danger, #dc2626)', fontWeight: '700' }}>
                {t.dashboard.urgentAlerts} ({relevantCriticalTickets.length})
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-main, #0f172a)', margin: 0, fontWeight: '500' }}>
                {relevantCriticalTickets.map(ct => `[${resolveDepartment(ct.department).emoji} ${ct.itemTitle}] (${ct.roomNumber || 'Campus'})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('tickets')}
            className="fluent-btn-primary"
            style={{ height: '30px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', fontSize: '12px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
          >
            {role === 'teacher' || role === 'parent' || role === 'guest' ? (t.nav?.myTickets || 'View My Request') : 'Review Tasks'}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. EXECUTIVE KPI CARDS GRID */}
      {/* ============================================================== */}
      {(role === 'director' || role === 'admin') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* Total School Requests */}
            <div
              style={{
                background: 'rgba(18, 25, 44, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #6366f1',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <ClipboardList size={20} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.totalJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', lineHeight: 1.2 }}>
                  {totalTickets}
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div
              style={{
                background: 'rgba(18, 25, 44, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #3b82f6',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <Clock size={20} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.inProcessJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#60a5fa', lineHeight: 1.2 }}>
                  {inProgressCount}
                </div>
              </div>
            </div>

            {/* Completed */}
            <div
              style={{
                background: 'rgba(18, 25, 44, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #10b981',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <CheckCircle2 size={20} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.completedJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399', lineHeight: 1.2 }}>
                  {completedCount}
                </div>
              </div>
            </div>

            {/* Pending Assignment */}
            <div
              style={{
                background: 'rgba(18, 25, 44, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <AlertTriangle size={20} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t.dashboard.pendingJobs}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24', lineHeight: 1.2 }}>
                  {pendingCount}
                </div>
              </div>
            </div>

            {/* Budget / Parts Spent */}
            <div
              style={{
                background: 'rgba(18, 25, 44, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #8b5cf6',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-depth-2)'
              }}
            >
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '10px', borderRadius: '10px' }}>
                <DollarSign size={20} color="#a78bfa" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
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
              background: 'rgba(18, 25, 44, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px 22px',
              boxShadow: 'var(--shadow-depth-4)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="#818cf8" />
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
                  {t.dashboard.departmentWorkload}
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Campus Operations SLA</span>
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
                      background: 'var(--bg-subtle, rgba(30, 41, 59, 0.6))',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary, #0f6cbd)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-main, #f3f2f1)' }}>
                        <span>{dept.emoji}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                          {deptName}
                        </span>
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: progress === 100 ? '#62c789' : '#0f6cbd' }}>
                        {progress}%
                      </span>
                    </div>

                    {/* Sleek Progress Bar */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '5px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6366f1, #06b6d4)', borderRadius: '9999px' }} />
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
      {/* QUICK REQUEST LAUNCHPAD */}
      {/* ============================================================== */}
      <div
        style={{
          background: 'rgba(18, 25, 44, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '20px 22px',
          boxShadow: 'var(--shadow-depth-4)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Layers size={16} color="var(--primary, #818cf8)" />
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main, #0f172a)', margin: 0 }}>
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
                  background: 'var(--bg-card, rgba(15, 23, 42, 0.65))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
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
                  e.currentTarget.style.borderColor = dept.color || 'var(--primary, #6366f1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-depth-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main, #f8fafc)', fontWeight: '600', fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>{dept.emoji}</span>
                  <span className="dashboard-service-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {localizedName}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', margin: 0, lineHeight: 1.4 }}>
                  {sampleSubcats}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Low Stock Warning Card */}
      {['storage_manager', 'facilities_manager', 'director', 'admin', 'workerA'].includes(role) && lowStockItems.length > 0 && (
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

      {/* Recent Requests Section (Activity Feed) */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f3f2f1', margin: 0 }}>
            {(role === 'teacher' || role === 'parent' || role === 'guest') ? (t.nav?.myTickets || 'My Requests') : t.dashboard.allJobsOverview}
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
                  background: 'var(--bg-card, rgba(18, 25, 44, 0.75))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
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
