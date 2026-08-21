import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { ClipboardList, CheckCircle2, ShoppingBag, AlertTriangle, ArrowRight, UserCheck, Plus, Sparkles } from 'lucide-react';
import { TicketList } from './TicketList';
import { TicketModal } from './TicketModal';

export const Dashboard = ({ setActiveTab }) => {
  const { t, role, currentUser, tickets, inventory } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Metrics
  const totalTickets = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const issuedCount = tickets.filter(t => t.status === 'issued').length;
  const purchasingCount = tickets.filter(t => t.status === 'purchasing').length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.minLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'var(--secondary)', marginBottom: '8px' }}>
              <UserCheck size={14} /> Active Role: {t.roles[role]}
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}>
              {t.dashboard.welcome} {currentUser.name}!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '600px' }}>
              {role === 'teacher' && t.dashboard.teacherSummary}
              {role === 'workerA' && t.dashboard.workerASummary}
              {role === 'admin' && 'Comprehensive breakdown of school supply operations and budget metrics.'}
            </p>
          </div>

          {role === 'teacher' && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Plus size={18} /> {t.tickets.createTitle}
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Total Requests */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '12px' }}>
            <ClipboardList size={24} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dashboard.totalTickets}</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>{totalTickets}</div>
          </div>
        </div>

        {/* Pending Worker A */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '12px' }}>
            <AlertTriangle size={24} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dashboard.pendingAction}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)' }}>{pendingCount}</div>
          </div>
        </div>

        {/* Issued from Stock */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px' }}>
            <CheckCircle2 size={24} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dashboard.givenFromStock}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>{issuedCount}</div>
          </div>
        </div>

        {/* Bought by Worker A */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px' }}>
            <ShoppingBag size={24} color="var(--info)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dashboard.boughtByWorkerA}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--info)' }}>{purchasingCount}</div>
          </div>
        </div>

      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--warning)" />
            <div>
              <strong style={{ fontSize: '14px', color: '#fff' }}>{t.dashboard.lowStockAlert}</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {lowStockItems.length} items in warehouse are below minimum threshold (e.g. {lowStockItems[0].name}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
          >
            Check Inventory <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* Embedded Main Tickets Overview */}
      <div style={{ marginTop: '10px' }}>
        <TicketList onOpenNewTicket={() => setIsModalOpen(true)} />
      </div>

      {/* New Ticket Modal */}
      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
};
