import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Truck, 
  AlertTriangle, 
  User, 
  Building, 
  Plus, 
  MessageSquare, 
  PhoneCall,
  Laptop,
  Sparkles,
  Shield,
  Package,
  CheckCircle,
  Layers
} from 'lucide-react';
import { DepartmentActionModal } from './DepartmentActionModal';

export const TicketList = ({ onOpenNewTicket }) => {
  const { t, tickets, role, completeTicketDelivery } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const departments = [
    { id: 'all', label: t.departments.all, icon: Layers, color: '#94a3b8' },
    { id: 'it', label: t.departments.it, icon: Laptop, color: '#38bdf8' },
    { id: 'cleaning', label: t.departments.cleaning, icon: Sparkles, color: '#34d399' },
    { id: 'storage', label: t.departments.storage, icon: Package, color: '#fbbf24' },
    { id: 'facilities', label: t.departments.facilities, icon: Truck, color: '#a78bfa' },
    { id: 'security', label: t.departments.security, icon: Shield, color: '#f87171' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            <Clock size={13} /> {t.tickets.status.pending}
          </span>
        );
      case 'in_progress':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            <Clock size={13} /> {t.tickets.status.in_progress}
          </span>
        );
      case 'issued':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            <CheckCircle2 size={13} /> {t.tickets.status.issued}
          </span>
        );
      case 'purchasing':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            <ShoppingBag size={13} /> {t.tickets.status.purchasing}
          </span>
        );
      case 'completed':
      case 'delivered':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            <CheckCircle size={13} /> {t.tickets.status.completed}
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
            {status}
          </span>
        );
    }
  };

  const getDepartmentBadge = (dept) => {
    const config = {
      it: { label: t.departments.it, icon: Laptop, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
      cleaning: { label: t.departments.cleaning, icon: Sparkles, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
      storage: { label: t.departments.storage, icon: Package, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
      facilities: { label: t.departments.facilities, icon: Truck, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
      security: { label: t.departments.security, icon: Shield, color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' }
    };
    const c = config[dept] || config.storage;
    const Icon = c.icon;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: c.bg, color: c.color, border: `1px solid ${c.color}40`, padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
        <Icon size={12} /> {c.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const map = {
      low: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
      medium: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' },
      high: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' },
      critical: { bg: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }
    };
    const style = map[urgency] || map.low;
    return (
      <span style={{ background: style.bg, color: style.color, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
        {t.tickets.urgencies[urgency] || urgency}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (ticket.itemTitle || '').toLowerCase().includes(term) ||
                          (ticket.teacherName || '').toLowerCase().includes(term) ||
                          (ticket.teacherPhone || '').toLowerCase().includes(term) ||
                          (ticket.roomNumber || '').toLowerCase().includes(term) ||
                          (ticket.assignedWorker || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesDept = deptFilter === 'all' || (ticket.department || 'storage') === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate counts per department
  const getDeptCount = (deptId) => {
    if (deptId === 'all') return tickets.length;
    return tickets.filter(tk => (tk.department || 'storage') === deptId).length;
  };

  // Determine if current user can process ticket
  const canProcessTicket = (ticket) => {
    if (role === 'director' || role === 'admin') return true;
    const dept = ticket.department || 'storage';
    if (role === 'storage_manager' || role === 'workerA') return dept === 'storage';
    if (role === 'facilities_manager') return dept === 'facilities' || dept === 'storage';
    if (role === 'it_support') return dept === 'it';
    if (role === 'cleaning') return dept === 'cleaning';
    return false;
  };

  const getProcessButtonLabel = (ticket) => {
    const dept = ticket.department || 'storage';
    if (dept === 'it') return '⚡ Troubleshoot (IT)';
    if (dept === 'cleaning') return '🧹 Accept & Clean';
    if (dept === 'facilities') return '🚚 Move Furniture / Repair';
    if (dept === 'storage') return '📦 Issue / Buy Stock';
    return '⚡ Process Request';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{t.tickets.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Showing {filteredTickets.length} of {tickets.length} total facility requests
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={t.tickets.searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '8px 12px 8px 34px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.6)', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ background: '#1e293b' }}>{t.tickets.filterAll}</option>
              <option value="pending" style={{ background: '#1e293b' }}>{t.tickets.status.pending}</option>
              <option value="in_progress" style={{ background: '#1e293b' }}>{t.tickets.status.in_progress}</option>
              <option value="issued" style={{ background: '#1e293b' }}>{t.tickets.status.issued}</option>
              <option value="purchasing" style={{ background: '#1e293b' }}>{t.tickets.status.purchasing}</option>
              <option value="completed" style={{ background: '#1e293b' }}>{t.tickets.status.completed}</option>
            </select>
          </div>

          {/* New Request Button */}
          {onOpenNewTicket && (
            <button
              onClick={onOpenNewTicket}
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-glow)',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <Plus size={16} /> {t.nav.newTicket}
            </button>
          )}

        </div>
      </div>

      {/* Department Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {departments.map(dept => {
          const Icon = dept.icon;
          const isActive = deptFilter === dept.id;
          const count = getDeptCount(dept.id);
          return (
            <button
              key={dept.id}
              onClick={() => setDeptFilter(dept.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                border: isActive ? `1px solid ${dept.color}` : '1px solid var(--border-color)',
                background: isActive ? `${dept.color}25` : 'rgba(30, 41, 59, 0.5)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} color={isActive ? dept.color : 'var(--text-muted)'} />
              {dept.label}
              <span style={{ 
                background: isActive ? dept.color : 'rgba(255,255,255,0.1)', 
                color: isActive ? '#000' : '#fff', 
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

      {/* Ticket List Grid */}
      {filteredTickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>{t.tickets.noTickets}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {filteredTickets.map(ticket => {
            const cleanPhone = (ticket.teacherPhone || '').replace(/[^\d+]/g, '');
            const targetDept = ticket.department || 'storage';
            const isCompleted = ticket.status === 'completed' || ticket.status === 'delivered';

            return (
              <div 
                key={ticket.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: `4px solid ${
                    targetDept === 'it' ? '#38bdf8' :
                    targetDept === 'cleaning' ? '#34d399' :
                    targetDept === 'facilities' ? '#a78bfa' :
                    targetDept === 'security' ? '#f87171' : '#fbbf24'
                  }`
                }}
              >
                {/* Top Row: Department, Title, Urgency, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {getDepartmentBadge(targetDept)}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>#{ticket.id}</span>
                      {getUrgencyBadge(ticket.urgency)}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0 }}>
                      {ticket.itemTitle}
                      {ticket.quantity ? ` (${ticket.quantity} ${ticket.unit})` : ''}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(ticket.status)}
                  </div>

                </div>

                {/* Facilities Furniture Moving Info Banner (if present) */}
                {ticket.moveDetails && (
                  <div style={{
                    background: 'rgba(167, 139, 250, 0.1)',
                    border: '1px dashed rgba(167, 139, 250, 0.4)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    flexWrap: 'wrap'
                  }}>
                    <Truck size={16} color="#a78bfa" />
                    <span><strong>Relocation:</strong> {ticket.moveDetails.fromRoom} ➔ <strong style={{ color: '#a78bfa' }}>{ticket.moveDetails.toRoom}</strong></span>
                    {ticket.moveDetails.items && <span style={{ color: 'var(--text-muted)' }}>({ticket.moveDetails.items})</span>}
                  </div>
                )}

                {/* Description */}
                {ticket.description && (
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                    {ticket.description}
                  </p>
                )}

                {/* Bottom Row: Metadata & Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                  
                  {/* Left: Room, Requesting Teacher, Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building size={13} color="var(--text-muted)" /> Room: <strong style={{ color: '#fff' }}>{ticket.roomNumber}</strong>
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} color="var(--text-muted)" /> {ticket.teacherName}
                      {cleanPhone && (
                        <span style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px' }}>
                          <a href={`tel:${cleanPhone}`} title={t.profile.call} style={{ color: 'var(--accent-emerald)', padding: '2px', display: 'flex', alignItems: 'center' }}>
                            <PhoneCall size={12} />
                          </a>
                          <a href={`https://wa.me/${cleanPhone.replace('+', '')}`} target="_blank" rel="noopener noreferrer" title={t.profile.whatsapp} style={{ color: '#4ade80', padding: '2px', display: 'flex', alignItems: 'center' }}>
                            <MessageSquare size={12} />
                          </a>
                        </span>
                      )}
                    </span>

                    <span>{t.tickets.createdAt}: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Right: Handler details & Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    
                    {/* Handled by info */}
                    {ticket.assignedWorker && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 8px', borderRadius: '6px' }}>
                        Assigned: <strong style={{ color: '#e2e8f0' }}>{ticket.assignedWorker}</strong>
                        {ticket.purchaseCost ? ` (Cost: ₸${ticket.purchaseCost.toLocaleString()})` : ''}
                      </div>
                    )}

                    {/* Department Processing Button */}
                    {canProcessTicket(ticket) && !isCompleted && (
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        style={{
                          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                        }}
                      >
                        {getProcessButtonLabel(ticket)}
                      </button>
                    )}

                    {/* Mark Completed Button */}
                    {canProcessTicket(ticket) && !isCompleted && ticket.status !== 'pending' && (
                      <button
                        onClick={() => completeTicketDelivery(ticket.id)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--success)',
                          border: '1px solid var(--success)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={13} /> {t.tickets.markComplete}
                      </button>
                    )}

                  </div>

                </div>

                {/* Handler Notes Banner (if any) */}
                {ticket.notes && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px' }}>
                    Note: "{ticket.notes}"
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      <DepartmentActionModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

    </div>
  );
};
