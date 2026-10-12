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
  Layers,
  Wrench,
  MapPin,
  Droplets,
  Footprints,
  DoorOpen,
  Globe
} from 'lucide-react';
import { DepartmentActionModal } from './DepartmentActionModal';
import { TicketCard } from './TicketCard';
import { DEPARTMENTS, resolveDepartment } from '../departments';

export const TicketList = ({ onOpenNewTicket, initialSearchTerm = '' }) => {
  const { 
    t, 
    tickets, 
    scopedTickets,
    role, 
    currentUser, 
    completeTicketDelivery, 
    lang,
    autoTranslateTickets,
    setAutoTranslateTickets,
    translatorTargetLang,
    setTranslatorTargetLang
  } = useApp();
  
  // Available departments based on DEPARTMENTS core specification
  const allDepartments = React.useMemo(() => [
    { id: 'all', label: t.departments.all || 'All Facilities', emoji: '🏢', color: '#94a3b8' },
    ...Object.values(DEPARTMENTS).map(d => ({
      id: d.id,
      label: d.translations?.[lang] || d.name,
      emoji: d.emoji,
      color: d.color
    }))
  ], [lang, t]);

  // Determine authorized department filter options and default filter
  const departments = React.useMemo(() => {
    if (role === 'director' || role === 'admin') {
      return allDepartments;
    }
    if (role === 'it_support') {
      return allDepartments.filter(d => d.id === 'all' || d.id === 'it_helpdesk');
    }
    if (role === 'cleaning') {
      return allDepartments.filter(d => d.id === 'all' || d.id === 'cleaning');
    }
    if (role === 'engineer') {
      return allDepartments.filter(d => d.id === 'all' || d.id === 'plumbing' || d.id === 'electrical');
    }
    if (role === 'storage_manager' || role === 'workerA') {
      return allDepartments.filter(d => d.id === 'all' || d.id === 'other');
    }
    if (role === 'facilities_manager') {
      return allDepartments.filter(d => d.id === 'all' || d.id === 'carpentry' || d.id === 'event_prep' || d.id === 'grounds');
    }
    if (role === 'teacher') {
      return allDepartments;
    }
    return allDepartments;
  }, [allDepartments, role]);

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState(() => {
    if (role === 'it_support') return 'it_helpdesk';
    if (role === 'cleaning') return 'cleaning';
    if (role === 'engineer') return 'plumbing';
    if (role === 'facilities_manager') return 'carpentry';
    return 'all';
  });
  const [selectedTicket, setSelectedTicket] = useState(null);

  React.useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      setStatusFilter('all');
      setDeptFilter('all');
    }
  }, [initialSearchTerm]);

  // Synchronize dept filter if role changes
  React.useEffect(() => {
    if (role === 'it_support') setDeptFilter('it_helpdesk');
    else if (role === 'cleaning') setDeptFilter('cleaning');
    else if (role === 'engineer') setDeptFilter('plumbing');
    else if (role === 'facilities_manager') setDeptFilter('carpentry');
    else setDeptFilter('all');
  }, [role]);

  // Scoped tickets that this user is authorized/related to view
  // Active tickets are strictly hidden for users who are not related
  const authorizedTickets = React.useMemo(() => {
    return scopedTickets || [];
  }, [scopedTickets]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#2d2314', border: '1px solid #573a11', color: '#f59e0b', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
            <Clock size={12} /> {t.tickets.status.pending}
          </span>
        );
      case 'in_progress':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#142436', border: '1px solid #154e7d', color: '#70b5f9', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
            <Clock size={12} /> {t.tickets.status.in_progress}
          </span>
        );
      case 'issued':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#122a1c', border: '1px solid #136136', color: '#62c789', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
            <CheckCircle2 size={12} /> {t.tickets.status.issued}
          </span>
        );
      case 'purchasing':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#231f2d', border: '1px solid #3d3154', color: '#c4b5fd', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
            <ShoppingBag size={12} /> {t.tickets.status.purchasing}
          </span>
        );
      case 'completed':
      case 'delivered':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#122a1c', border: '1px solid #136136', color: '#62c789', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
            <CheckCircle size={12} /> {t.tickets.status.completed}
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#252525', border: '1px solid #383838', color: '#adadad', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
            {status}
          </span>
        );
    }
  };

  const getDepartmentBadge = (ticket) => {
    const rawDept = typeof ticket === 'string' ? ticket : ticket?.department;
    const subcat = typeof ticket === 'object' ? ticket?.subcategory : null;
    const d = resolveDepartment(rawDept);
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: '#202020',
          color: '#f3f2f1',
          border: '1px solid #383838',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          <span>{d.emoji}</span>
          <span>{d.translations?.[lang] || d.name}</span>
        </span>
        {subcat && (
          <span style={{
            background: '#252525',
            border: '1px solid #383838',
            color: '#adadad',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            {subcat}
          </span>
        )}
      </div>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const map = {
      low: { bg: '#252525', border: '#383838', color: '#adadad' },
      medium: { bg: '#142436', border: '#154e7d', color: '#70b5f9' },
      high: { bg: '#2d2314', border: '#573a11', color: '#f59e0b' },
      critical: { bg: '#331518', border: '#63181d', color: '#f87171' }
    };
    const style = map[urgency] || map.low;
    return (
      <span style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color, padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {t.tickets.urgencies[urgency] || urgency}
      </span>
    );
  };

  const filteredTickets = authorizedTickets.filter(ticket => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (ticket.itemTitle || '').toLowerCase().includes(term) ||
                          (ticket.teacherName || '').toLowerCase().includes(term) ||
                          (ticket.teacherPhone || '').toLowerCase().includes(term) ||
                          (ticket.roomNumber || '').toLowerCase().includes(term) ||
                          (ticket.assignedWorker || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const resolvedDeptId = resolveDepartment(ticket.department).id;
    const matchesDept = deptFilter === 'all' || resolvedDeptId === deptFilter;

    const matchesLocation = locationFilter === 'all' || (() => {
      const loc = (ticket.roomNumber || '').toLowerCase();
      if (locationFilter === 'restroom') {
        return loc.includes('restroom') || loc.includes('wc') || loc.includes('туалет') || loc.includes('санузел') || loc.includes('әжетхана');
      }
      if (locationFilter === 'corridor') {
        return loc.includes('corridor') || loc.includes('hallway') || loc.includes('коридор') || loc.includes('рекреация') || loc.includes('дәліз');
      }
      if (locationFilter === 'classroom') {
        return loc.includes('room') || loc.includes('кабинет') || loc.includes('lab') || loc.includes('зертхана');
      }
      return true;
    })();

    return matchesSearch && matchesStatus && matchesDept && matchesLocation;
  });

  const renderLocationBadge = (locStr = '') => {
    const lower = locStr.toLowerCase();
    let LocIcon = MapPin;
    let iconColor = '#38bdf8';
    let badgeBg = 'rgba(56, 189, 248, 0.1)';
    let badgeBorder = 'rgba(56, 189, 248, 0.25)';

    if (lower.includes('restroom') || lower.includes('wc') || lower.includes('санузел') || lower.includes('туалет') || lower.includes('әжетхана')) {
      LocIcon = Droplets;
      iconColor = '#a78bfa';
      badgeBg = 'rgba(167, 139, 250, 0.12)';
      badgeBorder = 'rgba(167, 139, 250, 0.3)';
    } else if (lower.includes('corridor') || lower.includes('hallway') || lower.includes('коридор') || lower.includes('дәліз')) {
      LocIcon = Footprints;
      iconColor = '#34d399';
      badgeBg = 'rgba(52, 211, 153, 0.12)';
      badgeBorder = 'rgba(52, 211, 153, 0.3)';
    } else if (lower.includes('room') || lower.includes('кабинет') || lower.includes('lab') || lower.includes('класс')) {
      LocIcon = DoorOpen;
      iconColor = '#60a5fa';
      badgeBg = 'rgba(96, 165, 250, 0.12)';
      badgeBorder = 'rgba(96, 165, 250, 0.3)';
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: badgeBg,
        border: `1px solid ${badgeBorder}`,
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <LocIcon size={13} color={iconColor} />
        <strong style={{ color: '#fff' }}>{locStr || 'Main Campus'}</strong>
      </span>
    );
  };

  // Calculate counts per department within authorized scope
  const getDeptCount = (deptId) => {
    if (deptId === 'all') return authorizedTickets.length;
    return authorizedTickets.filter(tk => resolveDepartment(tk.department).id === deptId).length;
  };

  // Determine if current user can process ticket
  const canProcessTicket = (ticket) => {
    if (role === 'director' || role === 'admin') return true;
    const dept = resolveDepartment(ticket.department).id;
    if (role === 'it_support') return dept === 'it_helpdesk';
    if (role === 'cleaning') return dept === 'cleaning';
    if (role === 'engineer') return dept === 'plumbing' || dept === 'electrical';
    if (role === 'facilities_manager') return dept === 'carpentry' || dept === 'event_prep' || dept === 'grounds';
    if (role === 'storage_manager' || role === 'workerA') return dept === 'other';
    return false;
  };

  const getProcessButtonLabel = (ticket) => {
    const dept = ticket.department || 'storage';
    if (dept === 'it') return '⚡ Troubleshoot (IT)';
    if (dept === 'cleaning') return '🧹 Accept & Clean';
    if (dept === 'facilities') return '🚚 Move Furniture / Repair';
    if (dept === 'engineering') return '🔧 Repair (Engineer)';
    if (dept === 'storage') return '📦 Issue / Buy Stock';
    return '⚡ Process Request';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            {role === 'teacher' ? (t.nav.myTickets || 'My Requests') : t.tickets.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredTickets.length} of {authorizedTickets.length} requests
            </span>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              fontWeight: '600'
            }}>
              🔒 {t.auth.scopeLabel} {role === 'teacher' ? t.auth.onlyMyTickets : (role === 'it_support' ? t.auth.onlyIT : (role === 'cleaning' ? t.auth.onlyCleaning : (role === 'engineer' ? t.auth.onlyEngineering : (role === 'storage_manager' ? t.auth.onlyStorage : (role === 'facilities_manager' ? t.auth.onlyFacilities : t.auth.allOperations)))))}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={t.tickets.searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card, rgba(15, 23, 42, 0.75))',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '7px 12px 7px 34px',
                color: 'var(--text-main)',
                fontSize: '12px',
                height: '36px',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card, rgba(15, 23, 42, 0.75))', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', height: '36px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'transparent',
                color: 'var(--text-main)',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>{t.tickets.filterAll}</option>
              <option value="pending" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>{t.tickets.status.pending}</option>
              <option value="in_progress" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>{t.tickets.status.in_progress}</option>
              <option value="issued" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>{t.tickets.status.issued}</option>
              <option value="purchasing" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>{t.tickets.status.purchasing}</option>
              <option value="completed" style={{ background: 'var(--bg-dialog, #111827)', color: 'var(--text-main, #fff)' }}>{t.tickets.status.completed}</option>
            </select>
          </div>

          {/* Ticket Translator Toolbar Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: autoTranslateTickets ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.75)',
            border: autoTranslateTickets ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
            padding: '2px 8px',
            borderRadius: '8px',
            height: '36px'
          }}>
            <button
              type="button"
              onClick={() => setAutoTranslateTickets(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: autoTranslateTickets ? '#a5b4fc' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={t.translator?.autoTranslateHelp || 'Auto-translates English teacher requests to Russian/Kazakh'}
            >
              <Globe size={13} color={autoTranslateTickets ? '#818cf8' : 'var(--text-muted)'} />
              <span>{autoTranslateTickets ? 'Auto-Translate: ON' : 'Auto-Translate: OFF'}</span>
            </button>

            {/* Target language selector */}
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setTranslatorTargetLang('ru')}
                style={{
                  background: translatorTargetLang === 'ru' ? 'var(--accent-primary)' : 'transparent',
                  border: 'none',
                  color: translatorTargetLang === 'ru' ? '#fff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Translate to Russian"
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setTranslatorTargetLang('kk')}
                style={{
                  background: translatorTargetLang === 'kk' ? 'var(--accent-primary)' : 'transparent',
                  border: 'none',
                  color: translatorTargetLang === 'kk' ? '#fff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Translate to Kazakh"
              >
                KK
              </button>
              <button
                type="button"
                onClick={() => setTranslatorTargetLang('en')}
                style={{
                  background: translatorTargetLang === 'en' ? 'var(--accent-primary)' : 'transparent',
                  border: 'none',
                  color: translatorTargetLang === 'en' ? '#fff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Keep Original English"
              >
                EN
              </button>
            </div>
          </div>

          {/* New Request Button */}
          {onOpenNewTicket && (
            <button
              onClick={onOpenNewTicket}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={15} /> {t.nav.newTicket}
            </button>
          )}

        </div>
      </div>

      {/* Department Filter Tabs */}
      <div className="mobile-overflow-x" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {departments.map(dept => {
                const isActive = deptFilter === dept.id;
                const count = getDeptCount(dept.id);
                return (
                  <button
                    key={dept.id}
                    onClick={() => setDeptFilter(dept.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      border: isActive ? `1px solid ${dept.color}` : '1px solid var(--border-color)',
                      background: isActive ? `${dept.color}22` : 'var(--bg-card, rgba(15, 23, 42, 0.6))',
                      color: isActive ? 'var(--text-main, #ffffff)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>{dept.emoji}</span>
                    {dept.label}
                    <span style={{ 
                      background: isActive ? dept.color : 'var(--bg-subtle, rgba(255, 255, 255, 0.08))', 
                      color: isActive ? '#ffffff' : 'var(--text-main)', 
                      padding: '1px 6px', 
                      borderRadius: '6px', 
                      fontSize: '11px',
                      fontWeight: '700' 
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
      </div>

      {/* Location Area Quick-Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', padding: '2px 0' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
          <MapPin size={12} color="var(--accent-primary)" />
          {t?.tickets?.areaType || 'Location'}:
        </span>
        {[
          { id: 'all', label: t?.tickets?.locationFilters?.all || 'All Areas', icon: MapPin },
          { id: 'restroom', label: t?.tickets?.locationFilters?.restrooms || 'Restrooms', icon: Droplets, color: '#5b5fc7' },
          { id: 'corridor', label: t?.tickets?.locationFilters?.corridors || 'Corridors', icon: Footprints, color: '#107c41' },
          { id: 'classroom', label: t?.tickets?.locationFilters?.classrooms || 'Classrooms', icon: DoorOpen, color: '#0f6cbd' }
        ].map(locItem => {
          const isSelected = locationFilter === locItem.id;
          const LocIcon = locItem.icon;
          return (
            <button
              key={locItem.id}
              onClick={() => setLocationFilter(locItem.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: isSelected ? '600' : '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(15, 23, 42, 0.5)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              <LocIcon size={12} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              {locItem.label}
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
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              targetLang={translatorTargetLang}
              autoTranslate={autoTranslateTickets}
              t={t}
              lang={lang}
              role={role}
              currentUser={currentUser}
              canProcessTicket={canProcessTicket}
              getProcessButtonLabel={getProcessButtonLabel}
              getStatusBadge={getStatusBadge}
              getDepartmentBadge={getDepartmentBadge}
              getUrgencyBadge={getUrgencyBadge}
              renderLocationBadge={renderLocationBadge}
              onSelectTicket={setSelectedTicket}
              onCompleteTicket={completeTicketDelivery}
            />
          ))}
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
