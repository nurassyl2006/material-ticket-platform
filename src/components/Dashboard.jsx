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
  Sparkles,
  Laptop,
  Truck,
  Shield,
  Package,
  Clock,
  DollarSign,
  TrendingUp,
  Flame,
  CheckCircle
} from 'lucide-react';
import { TicketModal } from './TicketModal';

export const Dashboard = ({ setActiveTab, onOpenNewTicket: _onOpenNewTicket }) => {
  const { t, role, currentUser, tickets, inventory } = useApp();
  const [modalDepartment, setModalDepartment] = useState('storage');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // General Metrics
  const totalTickets = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'purchasing').length;
  const completedCount = tickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
  
  // Total Spent (₸) from storage purchasing and facility parts
  const totalSpent = tickets.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);

  // Department specific stats
  const itTickets = tickets.filter(t => (t.department || 'storage') === 'it');
  const cleaningTickets = tickets.filter(t => (t.department || 'storage') === 'cleaning');
  const storageTickets = tickets.filter(t => (t.department || 'storage') === 'storage');
  const facilitiesTickets = tickets.filter(t => (t.department || 'storage') === 'facilities');
  const securityTickets = tickets.filter(t => (t.department || 'storage') === 'security');
  const engineeringTickets = tickets.filter(t => t.department === 'engineering');

  // Critical alerts
  const criticalTickets = tickets.filter(t => t.urgency === 'critical' && t.status !== 'completed' && t.status !== 'delivered');
  const lowStockItems = inventory.filter(item => item.quantity <= item.minLevel);
  const activeFurnitureMoves = facilitiesTickets.filter(t => t.moveDetails && t.status !== 'completed');

  const openNewRequestForDept = (dept) => {
    setModalDepartment(dept);
    setIsModalOpen(true);
  };

  const getDeptProgress = (deptTickets) => {
    if (deptTickets.length === 0) return 100;
    const done = deptTickets.filter(t => t.status === 'completed' || t.status === 'delivered' || t.status === 'issued').length;
    return Math.round((done / deptTickets.length) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ 
        padding: '24px 28px', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.15) 100%)', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '8px' }}>
              <UserCheck size={14} /> Active Role: {t.roles[role]}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px', color: '#fff' }}>
              {t.dashboard.welcome} {currentUser.name}!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '650px', margin: 0, lineHeight: 1.5 }}>
              {role === 'director' && t.dashboard.directorSummary}
              {role === 'facilities_manager' && t.dashboard.facilitiesSummary}
              {role === 'it_support' && t.dashboard.itSummary}
              {role === 'cleaning' && t.dashboard.cleaningSummary}
              {role === 'storage_manager' && t.dashboard.storageSummary}
              {role === 'engineer' && t.dashboard.engineerSummary}
              {role === 'teacher' && t.dashboard.teacherSummary}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => openNewRequestForDept('facilities')}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> {t.tickets.createTitle}
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Warning (if urgent spills, laptop emergencies, or safety issues) */}
      {criticalTickets.length > 0 && (
        <div className="glass-panel" style={{ 
          padding: '14px 18px', 
          background: 'rgba(239, 68, 68, 0.12)', 
          borderLeft: '4px solid #ef4444', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={22} color="#ef4444" />
            <div>
              <strong style={{ fontSize: '13px', color: '#f87171' }}>
                🚨 {t.dashboard.urgentAlerts} ({criticalTickets.length})
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {criticalTickets.map(ct => `[${ct.department.toUpperCase()}] ${ct.itemTitle} (${ct.roomNumber})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Review Urgent Tasks
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. DIRECTOR EXECUTIVE KPI VIEW ("Sees everything, jobs done & in process") */}
      {/* ============================================================== */}
      {(role === 'director' || role === 'admin') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Executive KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            
            {/* Total School Requests */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <ClipboardList size={22} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.dashboard.totalJobs}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{totalTickets}</div>
              </div>
            </div>

            {/* Jobs in Process */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Clock size={22} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.dashboard.inProcessJobs}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8' }}>{inProgressCount}</div>
              </div>
            </div>

            {/* Jobs Completed / Done */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <CheckCircle2 size={22} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.dashboard.completedJobs}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>{completedCount}</div>
              </div>
            </div>

            {/* Pending Assignment */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #fbbf24' }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <AlertTriangle size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.dashboard.pendingJobs}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24' }}>{pendingCount}</div>
              </div>
            </div>

            {/* Total Budget Spent (₸) */}
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(167, 139, 250, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <DollarSign size={22} color="#c4b5fd" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{t.dashboard.totalSpent}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#c4b5fd' }}>₸{totalSpent.toLocaleString()}</div>
              </div>
            </div>

          </div>

          {/* Department Workload & Completion Rate Progress */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--primary)" /> {t.dashboard.departmentWorkload}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time facility status</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              
              {/* IT Support Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>
                    <Laptop size={15} /> {t.departments.it}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{getDeptProgress(itTickets)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${getDeptProgress(itTickets)}%`, height: '100%', background: '#38bdf8', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total: {itTickets.length}</span>
                  <span>In Process: {itTickets.filter(t => t.status === 'in_progress').length}</span>
                  <span style={{ color: '#34d399' }}>Done: {itTickets.filter(t => t.status === 'completed').length}</span>
                </div>
              </div>

              {/* Cleaning Service Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
                    <Sparkles size={15} /> {t.departments.cleaning}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{getDeptProgress(cleaningTickets)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${getDeptProgress(cleaningTickets)}%`, height: '100%', background: '#34d399', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total: {cleaningTickets.length}</span>
                  <span>In Process: {cleaningTickets.filter(t => t.status === 'in_progress').length}</span>
                  <span style={{ color: '#34d399' }}>Done: {cleaningTickets.filter(t => t.status === 'completed').length}</span>
                </div>
              </div>

              {/* Storage Manager Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>
                    <Package size={15} /> {t.departments.storage}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{getDeptProgress(storageTickets)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${getDeptProgress(storageTickets)}%`, height: '100%', background: '#fbbf24', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total: {storageTickets.length}</span>
                  <span>Issued: {storageTickets.filter(t => t.status === 'issued').length}</span>
                  <span style={{ color: '#fbbf24' }}>Buying: {storageTickets.filter(t => t.status === 'purchasing').length}</span>
                </div>
              </div>

              {/* Facilities Manager (Me) Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#a78bfa' }}>
                    <Truck size={15} /> {t.departments.facilities}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{getDeptProgress(facilitiesTickets)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${getDeptProgress(facilitiesTickets)}%`, height: '100%', background: '#a78bfa', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total: {facilitiesTickets.length}</span>
                  <span>Moving: {facilitiesTickets.filter(t => t.status === 'in_progress').length}</span>
                  <span style={{ color: '#34d399' }}>Done: {facilitiesTickets.filter(t => t.status === 'completed').length}</span>
                </div>
              </div>

              {/* Security Service Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#f87171' }}>
                    <Shield size={15} /> {t.departments.security}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{getDeptProgress(securityTickets)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${getDeptProgress(securityTickets)}%`, height: '100%', background: '#f87171', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total: {securityTickets.length}</span>
                  <span style={{ color: '#34d399' }}>Resolved: {securityTickets.filter(t => t.status === 'completed').length}</span>
                </div>
              </div>

              {/* Engineering Service Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#f97316' }}>
                    🔧 {t.departments.engineering}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{getDeptProgress(engineeringTickets)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${getDeptProgress(engineeringTickets)}%`, height: '100%', background: '#f97316', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total: {engineeringTickets.length}</span>
                  <span>In Repair: {engineeringTickets.filter(t => t.status === 'in_progress').length}</span>
                  <span style={{ color: '#34d399' }}>Fixed: {engineeringTickets.filter(t => t.status === 'completed').length}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FACILITIES MANAGER (ME) VIEW */}
      {/* "similar to storage manager but also helps to move around things like furniture" */}
      {/* ============================================================== */}
      {role === 'facilities_manager' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Facilities Specific Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #a78bfa' }}>
              <div style={{ background: 'rgba(167, 139, 250, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Truck size={22} color="#a78bfa" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Facility Tasks</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{facilitiesTickets.length}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Clock size={22} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Moves In Progress</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8' }}>
                  {facilitiesTickets.filter(t => t.status === 'in_progress').length}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <CheckCircle2 size={22} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Completed Relocations</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
                  {facilitiesTickets.filter(t => t.status === 'completed').length}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setActiveTab('inventory')}>
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '12px' }}>
                <Package size={22} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Furniture & Asset Stock</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>View Catalog ➔</div>
              </div>
            </div>
          </div>

          {/* Active Relocations Highlight */}
          {activeFurnitureMoves.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #a78bfa' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#c4b5fd', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} /> {t.dashboard.furnitureMovesAlert} ({activeFurnitureMoves.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {activeFurnitureMoves.map(mv => (
                  <div key={mv.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                      {mv.itemTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: '#c4b5fd', marginBottom: '6px' }}>
                      📍 {mv.moveDetails?.fromRoom} ➔ <strong>{mv.moveDetails?.toRoom}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Assigned: {mv.assignedWorker || 'Facilities Team'} • Teacher: {mv.teacherName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. IT SUPPORT VIEW */}
      {/* "help teachers with their problems like wifi or laptop not working and ect." */}
      {/* ============================================================== */}
      {role === 'it_support' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #38bdf8' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Laptop size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Active IT Tickets</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{itTickets.length}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #fbbf24' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Clock size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>In Diagnostics</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24' }}>
                {itTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle2 size={22} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Resolved Tech Issues</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
                {itTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CLEANING STAFF VIEW */}
      {/* "clean places that are need to be cleaned." */}
      {/* ============================================================== */}
      {role === 'cleaning' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Sparkles size={22} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Cleaning Requests</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{cleaningTickets.length}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #ef4444' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Flame size={22} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Urgent Floor Spills</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f87171' }}>
                {cleaningTickets.filter(t => t.urgency === 'critical').length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle size={22} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Rooms Cleaned Today</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
                {cleaningTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4a. ENGINEER VIEW (Lights, AC, Electrical, Ventilation) */}
      {/* ============================================================== */}
      {role === 'engineer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #f97316' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '22px' }}>🔧</span>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Engineering Jobs</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{engineeringTickets.length}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #fbbf24' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Clock size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Pending Repair</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24' }}>
                {engineeringTickets.filter(t => t.status === 'pending').length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #38bdf8' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Clock size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>In Repair</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8' }}>
                {engineeringTickets.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle2 size={22} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Fixed & Resolved</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
                {engineeringTickets.filter(t => t.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. STORAGE MANAGER VIEW */}
      {/* "Storage manager, what we have now." */}
      {/* ============================================================== */}
      {(role === 'storage_manager' || role === 'workerA') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #fbbf24' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Package size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Material Requests</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{storageTickets.length}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #34d399' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle2 size={22} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Given from Stock</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
                {storageTickets.filter(t => t.status === 'issued').length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #38bdf8' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <ShoppingBag size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>To be Purchased</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8' }}>
                {storageTickets.filter(t => t.status === 'purchasing').length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '3px solid #ef4444' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Low Stock Alert</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f87171' }}>{lowStockItems.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TEACHER VIEW */}
      {/* "Teachers, sends all their problem to facilities like IT, cleaning, security, storage manager." */}
      {/* ============================================================== */}
      {role === 'teacher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Quick Problem Launchpad for Teachers */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 12px 0' }}>
              ⚡ {t.dashboard.quickActions}:
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              
              {/* Send to IT */}
              <button
                onClick={() => openNewRequestForDept('it')}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: '700', fontSize: '14px' }}>
                  <Laptop size={18} /> IT Support
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Wi-Fi disconnected, laptop screen black, projector signal failed
                </p>
              </button>

              {/* Send to Cleaning */}
              <button
                onClick={() => openNewRequestForDept('cleaning')}
                style={{
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', fontSize: '14px' }}>
                  <Sparkles size={18} /> Cleaning Staff
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Spilled liquid, classroom deep cleaning, trash bin overflow
                </p>
              </button>

              {/* Send to Facilities (Furniture & Repairs) */}
              <button
                onClick={() => openNewRequestForDept('facilities')}
                style={{
                  background: 'rgba(167, 139, 250, 0.12)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: '700', fontSize: '14px' }}>
                  <Truck size={18} /> Facilities Manager
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Move desks & chairs between rooms, fix door lock/handle
                </p>
              </button>

              {/* Send to Storage */}
              <button
                onClick={() => openNewRequestForDept('storage')}
                style={{
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: '700', fontSize: '14px' }}>
                  <Package size={18} /> Storage Manager
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  A4 printing paper, whiteboard markers, science consumables
                </p>
              </button>

              {/* Send to Engineering */}
              <button
                onClick={() => openNewRequestForDept('engineering')}
                style={{
                  background: 'rgba(249, 115, 22, 0.12)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb923c', fontWeight: '700', fontSize: '14px' }}>
                  🔧 Engineering (Lights & AC)
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Flickering lights, broken AC, burnt socket, ventilation noise
                </p>
              </button>

              {/* Send to Security */}
              <button
                onClick={() => openNewRequestForDept('security')}
                style={{
                  background: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '14px' }}>
                  <Shield size={18} /> Security Desk
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  RFID keycard access failure, broken lock, lost & found
                </p>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* Low Stock Warning Card (for Storage, Facilities & Director) */}
      {(role === 'storage_manager' || role === 'facilities_manager' || role === 'director' || role === 'workerA' || role === 'admin' || role === 'engineer') && lowStockItems.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--warning)" />
            <div>
              <strong style={{ fontSize: '14px', color: '#fff' }}>{t.dashboard.lowStockAlert}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {lowStockItems.length} items in warehouse below minimum threshold (e.g. {lowStockItems[0].name}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--warning)',
              border: '1px solid var(--warning)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Check Warehouse
          </button>
        </div>
      )}

      {/* Recent Requests Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
          {t.dashboard.allJobsOverview}
        </h3>
        <button
          onClick={() => setActiveTab('tickets')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--secondary)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          View All Requests ({tickets.length}) <ArrowRight size={14} />
        </button>
      </div>

      {/* Ticket Preview List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {tickets.slice(0, 4).map(ticket => {
          const targetDept = ticket.department || 'storage';
          return (
            <div key={ticket.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                  {targetDept} • #{ticket.id}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: ticket.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: ticket.status === 'completed' ? '#34d399' : '#38bdf8'
                }}>
                  {ticket.status}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                {ticket.itemTitle}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                📍 {ticket.roomNumber} • Teacher: {ticket.teacherName}
              </div>
              {ticket.notes && (
                <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '6px' }}>
                  "{ticket.notes}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for creating a ticket */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDepartment={modalDepartment}
      />

    </div>
  );
};
