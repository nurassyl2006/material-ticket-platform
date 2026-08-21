import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, Filter, Clock, CheckCircle2, ShoppingBag, Truck, AlertTriangle, User, Building, Plus, Phone, MessageSquare, PhoneCall } from 'lucide-react';
import { WorkerAActionModal } from './WorkerAActionModal';

export const TicketList = ({ onOpenNewTicket }) => {
  const { t, tickets, role, completeTicketDelivery } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            <Clock size={14} /> {t.tickets.status.pending}
          </span>
        );
      case 'issued':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            <CheckCircle2 size={14} /> {t.tickets.status.issued}
          </span>
        );
      case 'purchasing':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--info)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            <ShoppingBag size={14} /> {t.tickets.status.purchasing}
          </span>
        );
      case 'delivered':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            <Truck size={14} /> {t.tickets.status.delivered}
          </span>
        );
      default:
        return null;
    }
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
                          (ticket.roomNumber || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{t.tickets.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {filteredTickets.length} of {tickets.length} requests
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
                padding: '8px 12px 8px 36px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.6)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '13px'
              }}
            >
              <option value="all" style={{ background: '#1e293b' }}>{t.tickets.filterAll}</option>
              <option value="pending" style={{ background: '#1e293b' }}>{t.tickets.status.pending}</option>
              <option value="issued" style={{ background: '#1e293b' }}>{t.tickets.status.issued}</option>
              <option value="purchasing" style={{ background: '#1e293b' }}>{t.tickets.status.purchasing}</option>
              <option value="delivered" style={{ background: '#1e293b' }}>{t.tickets.status.delivered}</option>
            </select>
          </div>

          {/* New Ticket Button for Teacher */}
          {role === 'teacher' && (
            <button
              onClick={onOpenNewTicket}
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-glow)',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> {t.nav.newTicket}
            </button>
          )}

        </div>
      </div>

      {/* Ticket List Grid / Table */}
      {filteredTickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertTriangle size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>{t.tickets.noTickets}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
          {filteredTickets.map(ticket => {
            const cleanPhone = (ticket.teacherPhone || '').replace(/[^\d+]/g, '');

            return (
              <div key={ticket.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', transition: 'all 0.2s' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  
                  {/* Left info */}
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {ticket.id}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getUrgencyBadge(ticket.urgency)}
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                      {ticket.itemTitle}
                    </h3>

                    <div style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: '600', marginBottom: '8px' }}>
                      Quantity: {ticket.quantity} {ticket.unit}
                    </div>

                    {ticket.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', maxWidth: '650px' }}>
                        "{ticket.description}"
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-dim)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} color="var(--text-muted)" /> {t.tickets.teacher}: <strong style={{ color: 'var(--text-muted)' }}>{ticket.teacherName}</strong>
                      </span>
                      
                      {/* Teacher Contact Phone pill & quick actions */}
                      {ticket.teacherPhone && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '2px 8px', borderRadius: '8px' }}>
                          <Phone size={12} color="var(--primary)" />
                          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{ticket.teacherPhone}</span>
                          {cleanPhone && (
                            <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                              <a 
                                href={`tel:${cleanPhone}`} 
                                title={t.profile.call}
                                style={{ color: 'var(--accent-emerald)', padding: '2px', display: 'flex', alignItems: 'center' }}
                              >
                                <PhoneCall size={12} />
                              </a>
                              <a 
                                href={`https://wa.me/${cleanPhone.replace('+', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title={t.profile.whatsapp}
                                style={{ color: '#4ade80', padding: '2px', display: 'flex', alignItems: 'center' }}
                              >
                                <MessageSquare size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building size={13} color="var(--text-muted)" /> Room: <strong style={{ color: 'var(--text-muted)' }}>{ticket.roomNumber}</strong>
                      </span>
                      <span>{t.tickets.createdAt}: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right / Processing status panel */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '100%', maxWidth: '280px' }}>
                    
                    {/* Worker A Action Details */}
                    {ticket.handledAction && (
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'left', width: '100%' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Processed by {ticket.assignedWorker}
                        </div>
                        
                        {ticket.handledAction === 'issued' ? (
                          <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
                            ✓ Given from Stock
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: '600' }}>
                            🛒 Bought / Cost: ₸{ticket.purchaseCost?.toLocaleString()}
                            {ticket.supplier && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Store: {ticket.supplier}</div>}
                          </div>
                        )}

                        {ticket.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            Note: "{ticket.notes}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Worker A Action Button */}
                    {(role === 'workerA' || role === 'admin') && ticket.status === 'pending' && (
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                          color: '#fff',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '700',
                          boxShadow: 'var(--shadow-glow)',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Process Ticket (Worker A)
                      </button>
                    )}

                    {/* Mark as Delivered button */}
                    {(role === 'workerA' || role === 'admin') && (ticket.status === 'issued' || ticket.status === 'purchasing') && (
                      <button
                        onClick={() => completeTicketDelivery(ticket.id)}
                        style={{
                          width: '100%',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: 'var(--success)',
                          border: '1px solid var(--success)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Mark Delivered
                      </button>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Worker A Action Modal */}
      <WorkerAActionModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

    </div>
  );
};
