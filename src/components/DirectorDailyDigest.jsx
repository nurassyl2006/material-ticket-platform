import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  UserCheck, 
  Users, 
  Sparkles, 
  Printer, 
  Download, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  Eye, 
  Zap, 
  CalendarCheck2, 
  Plus,
  ChevronRight
} from 'lucide-react';
import { resolveDepartment, DEPARTMENTS } from '../departments';
import { DepartmentActionModal } from './DepartmentActionModal';

// Helper to format date as YYYY-MM-DD in local timezone
const formatLocalDate = (d) => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format time as HH:MM
const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper to calculate human-readable turnaround time
const formatDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;

  const diffMs = end - start;
  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  if (remainingMins === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${hours}h ${remainingMins}m`;
};

// Helper to check if a ticket is completed/resolved
const isTicketFinished = (t) => {
  return t.status === 'completed' || t.status === 'delivered' || t.status === 'issued';
};

// Helper to check if a ticket is in process
const isTicketInProgress = (t) => {
  return t.status === 'in_progress' || t.status === 'purchasing';
};

export const DirectorDailyDigest = ({ onOpenNewTicket }) => {
  const { t, lang, tickets, addTicket } = useApp();

  // Selected date (defaults to today's local date)
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, finished, in_progress, pending, urgent
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedHour, setSelectedHour] = useState(null); // hour 0-23
  const [personFilter, setPersonFilter] = useState(null); // { type: 'requester'|'handler', name: string }
  const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [showBriefingBox, setShowBriefingBox] = useState(true);

  // Find all dates that have tickets in the system (for fast jumping)
  const activeDatesWithTickets = useMemo(() => {
    const dates = new Set();
    (tickets || []).forEach(tk => {
      const d = formatLocalDate(tk.createdAt);
      if (d) dates.add(d);
    });
    return Array.from(dates).sort().reverse();
  }, [tickets]);

  const latestActiveDate = activeDatesWithTickets[0] || todayStr;

  // Change date helpers
  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatLocalDate(d));
    setSelectedHour(null);
    setPersonFilter(null);
  };

  const handleSetQuickPreset = (preset) => {
    if (preset === 'today') {
      setSelectedDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      setSelectedDate(formatLocalDate(y));
    } else if (preset === 'latest') {
      setSelectedDate(latestActiveDate);
    }
    setSelectedHour(null);
    setPersonFilter(null);
  };

  // Filter tickets that have activity on selected date:
  // Either created on selected date, OR completed on selected date, OR in progress
  const dayTickets = useMemo(() => {
    return (tickets || []).filter(tk => {
      const createdDay = formatLocalDate(tk.createdAt);
      const updatedDay = formatLocalDate(tk.completedAt || tk.updatedAt);
      return createdDay === selectedDate || updatedDay === selectedDate;
    });
  }, [tickets, selectedDate]);

  // Tickets specifically created on this date
  const ticketsCreatedOnDate = useMemo(() => {
    return (tickets || []).filter(tk => formatLocalDate(tk.createdAt) === selectedDate);
  }, [tickets, selectedDate]);

  // Tickets finished on this date (completed, issued, delivered)
  const ticketsFinishedOnDate = useMemo(() => {
    return (tickets || []).filter(tk => {
      const finishDate = formatLocalDate(tk.completedAt || tk.updatedAt);
      return isTicketFinished(tk) && (finishDate === selectedDate || formatLocalDate(tk.createdAt) === selectedDate);
    });
  }, [tickets, selectedDate]);

  // Tickets currently in process
  const ticketsInProgressOnDate = useMemo(() => {
    return dayTickets.filter(tk => isTicketInProgress(tk));
  }, [dayTickets]);

  // Tickets pending assignment/review
  const ticketsPendingOnDate = useMemo(() => {
    return dayTickets.filter(tk => tk.status === 'pending');
  }, [dayTickets]);

  // High urgency tickets
  const urgentTicketsOnDate = useMemo(() => {
    return dayTickets.filter(tk => tk.urgency === 'high' || tk.urgency === 'critical');
  }, [dayTickets]);

  // Calculate resolution rate & average turnaround SLA
  const resolutionRate = useMemo(() => {
    if (ticketsCreatedOnDate.length === 0) return 0;
    const resolvedFromToday = ticketsCreatedOnDate.filter(isTicketFinished).length;
    return Math.round((resolvedFromToday / ticketsCreatedOnDate.length) * 100);
  }, [ticketsCreatedOnDate]);

  const avgTurnaroundText = useMemo(() => {
    const finishedWithTimes = ticketsFinishedOnDate.filter(tk => tk.createdAt && (tk.completedAt || tk.updatedAt));
    if (finishedWithTimes.length === 0) return '--';

    const totalMinutes = finishedWithTimes.reduce((acc, tk) => {
      const start = new Date(tk.createdAt).getTime();
      const end = new Date(tk.completedAt || tk.updatedAt).getTime();
      return acc + Math.max(1, Math.round((end - start) / (1000 * 60)));
    }, 0);

    const avgMins = Math.round(totalMinutes / finishedWithTimes.length);
    if (avgMins < 60) return `${avgMins} mins`;
    const hrs = Math.floor(avgMins / 60);
    const mins = avgMins % 60;
    return `${hrs}h ${mins}m`;
  }, [ticketsFinishedOnDate]);

  // Total procurement cost for today's requests
  const totalDaySpent = useMemo(() => {
    return dayTickets.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);
  }, [dayTickets]);

  // Hourly Activity Histogram (07:00 to 20:00)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 to 20
    const createdByHour = {};
    const finishedByHour = {};

    hours.forEach(h => {
      createdByHour[h] = 0;
      finishedByHour[h] = 0;
    });

    ticketsCreatedOnDate.forEach(tk => {
      if (tk.createdAt) {
        const h = new Date(tk.createdAt).getHours();
        if (createdByHour[h] !== undefined) {
          createdByHour[h] += 1;
        }
      }
    });

    ticketsFinishedOnDate.forEach(tk => {
      const finishTime = tk.completedAt || tk.updatedAt;
      if (finishTime) {
        const h = new Date(finishTime).getHours();
        if (finishedByHour[h] !== undefined) {
          finishedByHour[h] += 1;
        }
      }
    });

    let maxCount = 1;
    let peakHour = null;
    let peakHourVolume = 0;

    hours.forEach(h => {
      const total = createdByHour[h] + finishedByHour[h];
      if (total > maxCount) maxCount = total;
      if (createdByHour[h] > peakHourVolume) {
        peakHourVolume = createdByHour[h];
        peakHour = h;
      }
    });

    return {
      hours,
      createdByHour,
      finishedByHour,
      maxCount,
      peakHour,
      peakHourVolume
    };
  }, [ticketsCreatedOnDate, ticketsFinishedOnDate]);

  // Requesters breakdown (Who created them)
  const requestersList = useMemo(() => {
    const map = new Map();
    ticketsCreatedOnDate.forEach(tk => {
      const name = tk.teacherName || 'Staff Member';
      const roleName = tk.createdByRole || (name.includes('[Guest') ? 'guest' : 'teacher');
      const room = tk.roomNumber || 'Campus';
      const existing = map.get(name) || { name, role: roleName, count: 0, rooms: new Set(), tickets: [] };
      existing.count += 1;
      if (room) existing.rooms.add(room);
      existing.tickets.push(tk);
      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [ticketsCreatedOnDate]);

  // Handlers breakdown (Who worked on / finished them)
  const handlersList = useMemo(() => {
    const map = new Map();
    dayTickets.forEach(tk => {
      const worker = tk.assignedWorker;
      if (!worker) return;
      const workerRole = tk.assignedRole || 'specialist';
      const isDone = isTicketFinished(tk);
      const isProg = isTicketInProgress(tk);

      const existing = map.get(worker) || {
        name: worker,
        role: workerRole,
        total: 0,
        finished: 0,
        inProgress: 0,
        tickets: []
      };

      existing.total += 1;
      if (isDone) existing.finished += 1;
      if (isProg) existing.inProgress += 1;
      existing.tickets.push(tk);
      map.set(worker, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [dayTickets]);

  // Filtered tickets ledger for the table / cards
  const filteredLedgerTickets = useMemo(() => {
    return dayTickets.filter(tk => {
      // 1. Status Filter
      if (statusFilter === 'finished' && !isTicketFinished(tk)) return false;
      if (statusFilter === 'in_progress' && !isTicketInProgress(tk)) return false;
      if (statusFilter === 'pending' && tk.status !== 'pending') return false;
      if (statusFilter === 'urgent' && tk.urgency !== 'high' && tk.urgency !== 'critical') return false;

      // 2. Department Filter
      if (deptFilter !== 'all') {
        const resolvedDept = resolveDepartment(tk.department)?.id || tk.department;
        if (resolvedDept !== deptFilter) return false;
      }

      // 3. Hour Filter
      if (selectedHour !== null) {
        const createdH = tk.createdAt ? new Date(tk.createdAt).getHours() : -1;
        const finishedH = (tk.completedAt || tk.updatedAt) ? new Date(tk.completedAt || tk.updatedAt).getHours() : -1;
        if (createdH !== selectedHour && finishedH !== selectedHour) {
          return false;
        }
      }

      // 4. Person Filter
      if (personFilter) {
        if (personFilter.type === 'requester' && tk.teacherName !== personFilter.name) {
          return false;
        }
        if (personFilter.type === 'handler' && tk.assignedWorker !== personFilter.name) {
          return false;
        }
      }

      // 5. Search Term Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const titleMatch = (tk.itemTitle || '').toLowerCase().includes(q);
        const descMatch = (tk.description || '').toLowerCase().includes(q);
        const roomMatch = (tk.roomNumber || '').toLowerCase().includes(q);
        const teacherMatch = (tk.teacherName || '').toLowerCase().includes(q);
        const workerMatch = (tk.assignedWorker || '').toLowerCase().includes(q);
        const idMatch = (tk.id || '').toLowerCase().includes(q);
        return titleMatch || descMatch || roomMatch || teacherMatch || workerMatch || idMatch;
      }

      return true;
    }).sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [dayTickets, statusFilter, deptFilter, selectedHour, personFilter, searchTerm]);

  // Formatted date string for human reading (e.g. "Monday, October 26, 2026")
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate, lang]);

  // Executive narrative summary briefing generated for the Director
  const executiveBriefing = useMemo(() => {
    const totalCreated = ticketsCreatedOnDate.length;
    const totalFinished = ticketsFinishedOnDate.length;
    const totalInProg = ticketsInProgressOnDate.length;
    const totalPending = ticketsPendingOnDate.length;
    const peakText = hourlyData.peakHour !== null
      ? `${String(hourlyData.peakHour).padStart(2, '0')}:00 - ${String(hourlyData.peakHour + 1).padStart(2, '0')}:00 (${hourlyData.peakHourVolume} tickets)`
      : 'Evenly distributed';

    if (lang === 'ru') {
      return `Оперативная сводка за ${formattedSelectedDate}: зарегистрировано обращений — ${totalCreated}, успешно выполнено — ${totalFinished} (${resolutionRate}% выполнения). В процессе исполнения персоналом находится ${totalInProg} заявок, ожидают назначения — ${totalPending}. Пиковая нагрузка обращений пришлась на интервал ${peakText}. Среднее время реагирования и закрытия задач составило ${avgTurnaroundText}. Задействовано специалистов: ${handlersList.length}.`;
    }
    if (lang === 'kk') {
      return `${formattedSelectedDate} күнгі жедел есеп: барлығы ${totalCreated} өтінім тіркелді, ${totalFinished} өтінім сәтті орындалды (${resolutionRate}% шешу көрсеткіші). Қазіргі уақытта мамандар ${totalInProg} өтінімді орындауда, ${totalPending} өтінім қаралуды күтуде. Ең жоғары жүктеме уақыты: ${peakText}. Өтінімдердің орташа орындалу уақыты ${avgTurnaroundText} құрады. Жұмылдырылған мамандар саны: ${handlersList.length}.`;
    }
    return `Executive briefing for ${formattedSelectedDate}: Total tickets registered today — ${totalCreated}, successfully resolved and closed — ${totalFinished} (${resolutionRate}% resolution SLA). There are currently ${totalInProg} active tasks in progress, and ${totalPending} requests pending review. Peak request intake occurred at ${peakText}. Average resolution turnaround was ${avgTurnaroundText}. Assigned staff specialists active: ${handlersList.length}.`;
  }, [ticketsCreatedOnDate, ticketsFinishedOnDate, ticketsInProgressOnDate, ticketsPendingOnDate, resolutionRate, hourlyData, avgTurnaroundText, handlersList, formattedSelectedDate, lang]);

  // Print Executive Briefing
  const handlePrintReport = () => {
    window.print();
  };

  // Export Daily Report as CSV
  const handleExportCSV = () => {
    if (dayTickets.length === 0) {
      alert(lang === 'ru' ? 'Нет данных для экспорта за этот день.' : 'No ticket data for this date to export.');
      return;
    }
    const headers = ['ID', 'Department', 'Item Title', 'Status', 'Urgency', 'Room', 'Submitted By', 'Handled By', 'Created At', 'Finished At', 'Turnaround'];
    const rows = dayTickets.map(tk => [
      tk.id,
      tk.department,
      `"${(tk.itemTitle || '').replace(/"/g, '""')}"`,
      tk.status,
      tk.urgency,
      `"${tk.roomNumber || ''}"`,
      `"${tk.teacherName || ''}"`,
      `"${tk.assignedWorker || 'Unassigned'}"`,
      tk.createdAt || '',
      tk.completedAt || (isTicketFinished(tk) ? tk.updatedAt : ''),
      formatDuration(tk.createdAt, tk.completedAt || tk.updatedAt) || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduops-director-daily-digest-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Sample Day Activity for Director Demonstration if day is empty
  const handleGenerateSampleActivity = async () => {
    setIsGeneratingSamples(true);
    const dateBase = selectedDate;
    
    const sampleItems = [
      {
        dept: 'it_helpdesk',
        title: 'Projector HDMI Signal Lost in Classroom',
        teacher: 'Aigul Karimova (Physics)',
        room: 'B-2-4 (Science Wing)',
        hour: 8,
        min: 15,
        status: 'completed',
        worker: 'Alexey IT Support',
        durationMins: 35,
        desc: 'Smartboard projection stopped working before 1st lesson. Cable replaced.'
      },
      {
        dept: 'cleaning',
        title: 'Water & Juice Spill Emergency near Corridor East',
        teacher: 'Elena Volkova (English)',
        room: 'A-1-2 (Year 1A)',
        hour: 9,
        min: 10,
        status: 'completed',
        worker: 'Cleaning Staff (Gulnara)',
        durationMins: 20,
        desc: 'Spilled juice on slippery tile corridor sanitized and dried.'
      },
      {
        dept: 'storage',
        title: 'A4 Printing Paper & Whiteboard Markers Set',
        teacher: 'Marat Sadykov (Maths)',
        room: 'C-3-10 (High School)',
        hour: 10,
        min: 5,
        status: 'completed',
        worker: 'Erzhan (Storage Manager)',
        durationMins: 45,
        desc: 'Issued 2 packs A4 and 4 markers from warehouse shelf 102.'
      },
      {
        dept: 'electrical',
        title: 'Ceiling Fluorescent Light Flickering Rapidly',
        teacher: 'Sarah Jenkins (Art)',
        room: 'C-1-4 (Art Studio)',
        hour: 11,
        min: 30,
        status: 'in_progress',
        worker: 'Bakhyt (Electrician)',
        durationMins: null,
        desc: 'Ballast replacement underway in Art Studio C-1-4.'
      },
      {
        dept: 'carpentry',
        title: 'Relocate 12 Student Desks and 24 Chairs',
        teacher: 'Kairat Ospanov (Admin)',
        room: 'D-2-1 (Auditorium)',
        hour: 13,
        min: 45,
        status: 'in_progress',
        worker: 'Facilities Moving Team',
        durationMins: null,
        desc: 'Setup furniture for parent-teacher assembly.'
      },
      {
        dept: 'plumbing',
        title: 'Washbasin Faucet Water Leak in 2nd Floor Restroom',
        teacher: 'Saule Baizhanova (Teacher)',
        room: 'B-2-WC (Girls Restroom)',
        hour: 15,
        min: 20,
        status: 'pending',
        worker: null,
        durationMins: null,
        desc: 'Slow steady leak from cold water valve under sink.'
      }
    ];

    try {
      for (const item of sampleItems) {
        const createdDate = new Date(`${dateBase}T${String(item.hour).padStart(2, '0')}:${String(item.min).padStart(2, '0')}:00`);
        let completedDate = null;
        if (item.status === 'completed' && item.durationMins) {
          completedDate = new Date(createdDate.getTime() + item.durationMins * 60000);
        }

        const ticketData = {
          department: item.dept,
          itemTitle: item.title,
          subcategory: item.title,
          category: 'other',
          quantity: 1,
          unit: 'pcs',
          urgency: item.status === 'pending' ? 'high' : 'medium',
          roomNumber: item.room,
          description: item.desc,
          teacherName: item.teacher,
          createdById: 'demo-director',
          createdByRole: 'teacher',
          status: item.status,
          assignedWorker: item.worker,
          assignedRole: item.worker ? 'engineer' : null,
          handledAction: item.status,
          createdAt: createdDate.toISOString(),
          updatedAt: completedDate ? completedDate.toISOString() : createdDate.toISOString(),
          completedAt: completedDate ? completedDate.toISOString() : null,
          notes: item.status === 'completed' ? `Resolved successfully in ${item.durationMins} minutes.` : 'Under active maintenance.'
        };

        if (addTicket) {
          addTicket(ticketData);
        }
      }
    } catch {
      // Demo creation error fallback
    } finally {
      setTimeout(() => {
        setIsGeneratingSamples(false);
      }, 600);
    }
  };

  const dDict = t.dailyDigest || {};
  const kpiDict = dDict.kpi || {};
  const hourlyDict = dDict.hourly || {};
  const personnelDict = dDict.personnel || {};
  const ledgerDict = dDict.ledger || {};

  return (
    <div className="daily-digest-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ============================================================== */}
      {/* 1. EXECUTIVE COCKPIT HEADER WITH DATE CONTROLS                 */}
      {/* ============================================================== */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          background: 'rgba(18, 25, 44, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: '4px solid #8b5cf6',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-depth-4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(139, 92, 246, 0.18)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#c4b5fd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <ShieldAlert size={12} color="#a78bfa" />
                <span>{dDict.directorBadge || 'Director Executive Intelligence'}</span>
              </span>

              {selectedDate === todayStr && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#34d399'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  Live Today
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarCheck2 size={24} color="#a78bfa" />
              <span>{dDict.title || 'Everyday Ticket Operations & Analytics'}</span>
            </h1>

            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, maxWidth: '780px', lineHeight: 1.4 }}>
              {dDict.subtitle || 'Executive school oversight: see how many tickets were created, exact timestamps, resolved vs in-process status, and staff accountability.'}
            </p>
          </div>

          {/* Action Center Buttons (Print & Export) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePrintReport}
              className="fluent-btn-secondary"
              style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Print formatted executive briefing"
            >
              <Printer size={14} color="#818cf8" />
              <span>{dDict.printReport || 'Print Briefing'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="fluent-btn-secondary"
              style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Export this day's ticket data as CSV"
            >
              <Download size={14} color="#34d399" />
              <span>{dDict.exportCsv || 'Export CSV'}</span>
            </button>

            {onOpenNewTicket && (
              <button
                onClick={() => onOpenNewTicket('engineering')}
                className="fluent-btn-primary"
                style={{ height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>{t.tickets?.createTitle || 'New Ticket'}</span>
              </button>
            )}
          </div>
        </div>

        {/* DATE SELECTOR BAR */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Quick Date Presets & Step Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleShiftDate(-1)}
              className="fluent-btn-secondary"
              style={{ height: '30px', padding: '0 9px' }}
              title={dDict.previousDay || 'Previous Day'}
            >
              <ArrowLeft size={13} />
            </button>

            <button
              onClick={() => handleSetQuickPreset('today')}
              style={{
                height: '30px',
                padding: '0 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: selectedDate === todayStr ? '700' : '500',
                background: selectedDate === todayStr ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: selectedDate === todayStr ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedDate === todayStr ? '#f3f4f6' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {dDict.today || 'Today'}
            </button>

            <button
              onClick={() => handleSetQuickPreset('yesterday')}
              style={{
                height: '30px',
                padding: '0 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {dDict.yesterday || 'Yesterday'}
            </button>

            {latestActiveDate && latestActiveDate !== todayStr && selectedDate !== latestActiveDate && (
              <button
                onClick={() => handleSetQuickPreset('latest')}
                style={{
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#818cf8',
                  cursor: 'pointer'
                }}
                title={`Jump to latest activity: ${latestActiveDate}`}
              >
                {dDict.jumpToLatest || 'Latest Active Day'} ({latestActiveDate})
              </button>
            )}

            <button
              onClick={() => handleShiftDate(1)}
              className="fluent-btn-secondary"
              style={{ height: '30px', padding: '0 9px' }}
              title={dDict.nextDay || 'Next Day'}
            >
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Formatted Date & Native Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                {formattedSelectedDate}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {dayTickets.length} ticket(s) recorded
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Calendar size={14} color="#818cf8" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setSelectedHour(null);
                    setPersonFilter(null);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. EXECUTIVE BRIEFING NARRATIVE CALLOUT BOX                     */}
      {/* ============================================================== */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.55)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: 'var(--shadow-depth-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Sparkles size={16} color="#818cf8" />
            <strong style={{ fontSize: '13px', fontWeight: '700', color: '#c7d2fe' }}>
              {dDict.executiveSummaryTitle || 'Director Daily Operational Briefing'}
            </strong>
          </div>
          <button
            onClick={() => setShowBriefingBox(!showBriefingBox)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}
          >
            {showBriefingBox ? 'Hide' : 'Expand'}
          </button>
        </div>

        {showBriefingBox && (
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0, lineHeight: 1.5, opacity: 0.95 }}>
            {executiveBriefing}
          </p>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. KEY METRICS KPI CARDS GRID (DAILY BREAKDOWN)                 */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        
        {/* Total Created on Day */}
        <div
          onClick={() => { setStatusFilter('all'); setSelectedHour(null); setPersonFilter(null); }}
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #8b5cf6',
            borderRadius: '12px',
            padding: '16px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-depth-2)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpiDict.createdToday || 'Created On Day'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', margin: '4px 0 2px 0' }}>
                {ticketsCreatedOnDate.length}
              </div>
              <div style={{ fontSize: '11px', color: '#a78bfa' }}>
                {kpiDict.createdSubtitle || 'Total ticket volume'}
              </div>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <Activity size={20} color="#a78bfa" />
            </div>
          </div>
        </div>

        {/* Finished / Resolved */}
        <div
          onClick={() => { setStatusFilter('finished'); setSelectedHour(null); }}
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: statusFilter === 'finished' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #10b981',
            borderRadius: '12px',
            padding: '16px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-depth-2)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = statusFilter === 'finished' ? '#10b981' : 'rgba(255, 255, 255, 0.08)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpiDict.finishedToday || 'Finished / Resolved'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#34d399', margin: '4px 0 2px 0' }}>
                {ticketsFinishedOnDate.length}
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                {resolutionRate}% {kpiDict.resolutionRate || 'resolution rate'}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <CheckCircle2 size={20} color="#34d399" />
            </div>
          </div>
        </div>

        {/* In Process / Active */}
        <div
          onClick={() => { setStatusFilter('in_progress'); setSelectedHour(null); }}
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: statusFilter === 'in_progress' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-depth-2)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = statusFilter === 'in_progress' ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpiDict.inProgress || 'In Process'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#60a5fa', margin: '4px 0 2px 0' }}>
                {ticketsInProgressOnDate.length}
              </div>
              <div style={{ fontSize: '11px', color: '#60a5fa' }}>
                {kpiDict.inProgressSubtitle || 'Active staff workload'}
              </div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <Clock size={20} color="#60a5fa" />
            </div>
          </div>
        </div>

        {/* Pending Assignment */}
        <div
          onClick={() => { setStatusFilter('pending'); setSelectedHour(null); }}
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: statusFilter === 'pending' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-depth-2)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#f59e0b')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = statusFilter === 'pending' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpiDict.pending || 'Pending Review'}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#fbbf24', margin: '4px 0 2px 0' }}>
                {ticketsPendingOnDate.length}
              </div>
              <div style={{ fontSize: '11px', color: '#fbbf24' }}>
                {kpiDict.pendingSubtitle || 'Awaiting assignment'}
              </div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <AlertTriangle size={20} color="#fbbf24" />
            </div>
          </div>
        </div>

        {/* Avg SLA Resolution Turnaround */}
        <div
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #06b6d4',
            borderRadius: '12px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-depth-2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpiDict.avgTurnaround || 'Avg Resolution Time'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#22d3ee', margin: '6px 0 2px 0' }}>
                {avgTurnaroundText}
              </div>
              <div style={{ fontSize: '11px', color: '#67e8f9' }}>
                Campus SLA Turnaround
              </div>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <Zap size={20} color="#22d3ee" />
            </div>
          </div>
        </div>

        {/* Total Cost / Procurement */}
        <div
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #ec4899',
            borderRadius: '12px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-depth-2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpiDict.totalCost || 'Parts & Supplies Cost'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#f472b6', margin: '6px 0 2px 0' }}>
                ₸{totalDaySpent.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#f472b6' }}>
                Warehouse & parts spent
              </div>
            </div>
            <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <DollarSign size={20} color="#f472b6" />
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. VISUAL PROGRESS RATIO BAR (FINISHED vs IN PROCESS vs PENDING) */}
      {/* ============================================================== */}
      {dayTickets.length > 0 && (
        <div
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ fontWeight: '600', color: '#f8fafc' }}>
              {dDict.statusDistribution || 'Daily Status Distribution'}
            </span>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ color: '#34d399' }}>● Finished: {ticketsFinishedOnDate.length}</span>
              <span style={{ color: '#60a5fa' }}>● In Process: {ticketsInProgressOnDate.length}</span>
              <span style={{ color: '#fbbf24' }}>● Pending: {ticketsPendingOnDate.length}</span>
            </div>
          </div>

          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                width: `${(ticketsFinishedOnDate.length / Math.max(1, dayTickets.length)) * 100}%`,
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.3s ease'
              }}
              title={`Finished: ${ticketsFinishedOnDate.length}`}
            />
            <div
              style={{
                width: `${(ticketsInProgressOnDate.length / Math.max(1, dayTickets.length)) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                transition: 'width 0.3s ease'
              }}
              title={`In Process: ${ticketsInProgressOnDate.length}`}
            />
            <div
              style={{
                width: `${(ticketsPendingOnDate.length / Math.max(1, dayTickets.length)) * 100}%`,
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                transition: 'width 0.3s ease'
              }}
              title={`Pending: ${ticketsPendingOnDate.length}`}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. HOURLY REQUEST & RESOLUTION TIMELINE ("AT WHAT TIME")        */}
      {/* ============================================================== */}
      <div
        style={{
          background: 'rgba(18, 25, 44, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '20px 22px',
          boxShadow: 'var(--shadow-depth-4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#818cf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                {hourlyDict.title || 'Hourly Request Timeline & Peak Volume'}
              </h3>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {hourlyDict.subtitle || 'Distribution of when tickets were submitted and resolved across working hours'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontWeight: '600' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4b5fd' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#8b5cf6' }} />
              {hourlyDict.createdLegend || 'Created (Demand)'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} />
              {hourlyDict.finishedLegend || 'Finished (Resolved)'}
            </span>

            {selectedHour !== null && (
              <button
                onClick={() => setSelectedHour(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ✕ {hourlyDict.clearedFilter || 'Clear Hour'} ({String(selectedHour).padStart(2, '0')}:00)
              </button>
            )}
          </div>
        </div>

        {/* Peak Hour Callout Badge */}
        {hourlyData.peakHour !== null && hourlyData.peakHourVolume > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#fca5a5',
              fontWeight: '600',
              marginBottom: '16px'
            }}
          >
            <span>🔥 {hourlyDict.peakBadge || 'Peak Request Intake'}:</span>
            <span style={{ color: '#ffffff', fontWeight: '800' }}>
              {String(hourlyData.peakHour).padStart(2, '0')}:00 - {String(hourlyData.peakHour + 1).padStart(2, '0')}:00
            </span>
            <span>({hourlyData.peakHourVolume} tickets submitted)</span>
          </div>
        )}

        {/* Hourly Histogram Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hourlyData.hours.length}, 1fr)`, gap: '6px', alignItems: 'flex-end', minHeight: '120px', padding: '10px 0 6px 0' }}>
          {hourlyData.hours.map(h => {
            const createdCount = hourlyData.createdByHour[h] || 0;
            const finishedCount = hourlyData.finishedByHour[h] || 0;
            const isSelected = selectedHour === h;
            const totalInHour = createdCount + finishedCount;

            const createdHeightPercent = Math.min(100, Math.round((createdCount / Math.max(1, hourlyData.maxCount)) * 90));
            const finishedHeightPercent = Math.min(100, Math.round((finishedCount / Math.max(1, hourlyData.maxCount)) * 90));

            return (
              <div
                key={h}
                onClick={() => setSelectedHour(isSelected ? null : h)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '4px 2px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                  transition: 'all 0.12s ease'
                }}
                title={`${String(h).padStart(2, '0')}:00 - ${createdCount} created, ${finishedCount} finished`}
              >
                {/* Volume Badge */}
                <div style={{ fontSize: '10px', fontWeight: '700', color: totalInHour > 0 ? '#f8fafc' : '#475569', minHeight: '14px' }}>
                  {totalInHour > 0 ? totalInHour : ''}
                </div>

                {/* Dual Bars Container */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px', width: '100%', justifyContent: 'center' }}>
                  {/* Created Bar */}
                  <div
                    style={{
                      width: '45%',
                      maxWidth: '16px',
                      height: `${Math.max(4, createdHeightPercent)}%`,
                      background: createdCount > 0 ? 'linear-gradient(180deg, #a78bfa, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.25s ease'
                    }}
                  />
                  {/* Finished Bar */}
                  <div
                    style={{
                      width: '45%',
                      maxWidth: '16px',
                      height: `${Math.max(4, finishedHeightPercent)}%`,
                      background: finishedCount > 0 ? 'linear-gradient(180deg, #34d399, #059669)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.25s ease'
                    }}
                  />
                </div>

                {/* Hour Label */}
                <div style={{ fontSize: '10px', color: isSelected ? '#ffffff' : '#94a3b8', fontWeight: isSelected ? '700' : '500', marginTop: '2px' }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
          💡 {hourlyDict.filterHourPrompt || 'Click any hour column above to filter the tickets ledger below.'}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. "BY WHOM" — PERSONNEL & ACCOUNTABILITY MATRIX                */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        
        {/* CARD A: CREATED BY (REQUESTERS) */}
        <div
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-depth-3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="#818cf8" />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                {personnelDict.requestersTab || 'Created By (Requesters)'}
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              {requestersList.length} staff member(s)
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
            {personnelDict.requestersSubtitle || 'Teachers and staff who raised tickets on this day'}
          </div>

          {requestersList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              {personnelDict.noRequesters || 'No tickets submitted on this date.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {requestersList.map(req => {
                const isSelected = personFilter?.type === 'requester' && personFilter?.name === req.name;
                const roomList = Array.from(req.rooms).slice(0, 2).join(', ');
                return (
                  <div
                    key={req.name}
                    onClick={() => {
                      if (isSelected) setPersonFilter(null);
                      else setPersonFilter({ type: 'requester', name: req.name });
                    }}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#c4b5fd'
                        }}
                      >
                        {req.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#f8fafc' }}>
                          {req.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          📍 {roomList || 'Campus'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.18)',
                          color: '#a5b4fc',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}
                      >
                        {req.count} {personnelDict.ticketsCount || 'tickets'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CARD B: HANDLED / FINISHED BY (SPECIALISTS) */}
        <div
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-depth-3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={16} color="#34d399" />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                {personnelDict.handlersTab || 'Handled & Finished By (Specialists)'}
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              {handlersList.length} specialist(s) active
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
            {personnelDict.handlersSubtitle || 'Staff members resolving or actively processing requests'}
          </div>

          {handlersList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              {personnelDict.noHandlers || 'No staff assigned yet for this date.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {handlersList.map(h => {
                const isSelected = personFilter?.type === 'handler' && personFilter?.name === h.name;
                return (
                  <div
                    key={h.name}
                    onClick={() => {
                      if (isSelected) setPersonFilter(null);
                      else setPersonFilter({ type: 'handler', name: h.name });
                    }}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#34d399'
                        }}
                      >
                        {h.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#f8fafc' }}>
                          {h.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          {t.roles?.[h.role] || h.role}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {h.finished > 0 && (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          ✓ {h.finished} {personnelDict.finishedCount || 'done'}
                        </span>
                      )}
                      {h.inProgress > 0 && (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}
                        >
                          ⏳ {h.inProgress} {personnelDict.activeCount || 'active'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 7. CHRONOLOGICAL TICKETS ACTIVITY LEDGER                        */}
      {/* ============================================================== */}
      <div
        style={{
          background: 'rgba(18, 25, 44, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '20px 22px',
          boxShadow: 'var(--shadow-depth-4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              {ledgerDict.title || 'Daily Tickets Activity Log'} ({filteredLedgerTickets.length})
            </h3>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {ledgerDict.subtitle || 'Detailed chronological record of every ticket created or processed on this date'}
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedHour !== null || personFilter !== null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {selectedHour !== null && (
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#c4b5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={11} />
                  <span>{String(selectedHour).padStart(2, '0')}:00 - {String(selectedHour + 1).padStart(2, '0')}:00</span>
                  <button onClick={() => setSelectedHour(null)} style={{ background: 'transparent', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              )}

              {personFilter && (
                <span
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#c4b5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <User size={11} />
                  <span>{personFilter.name}</span>
                  <button onClick={() => setPersonFilter(null)} style={{ background: 'transparent', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* LEDGER FILTER BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: ledgerDict.allStatus || 'All Tickets', count: dayTickets.length },
              { id: 'finished', label: ledgerDict.finishedOnly || 'Finished', count: ticketsFinishedOnDate.length },
              { id: 'in_progress', label: ledgerDict.inProgressOnly || 'In Process', count: ticketsInProgressOnDate.length },
              { id: 'pending', label: ledgerDict.pendingOnly || 'Pending Review', count: ticketsPendingOnDate.length },
              { id: 'urgent', label: ledgerDict.urgentOnly || 'High Urgency', count: urgentTicketsOnDate.length }
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: active ? '700' : '500',
                    background: active ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: active ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: active ? '#f8fafc' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{ fontSize: '11px', background: active ? '#6366f1' : 'rgba(255, 255, 255, 0.1)', padding: '0 5px', borderRadius: '4px', color: '#ffffff' }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box & Dept Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Search size={13} color="#94a3b8" />
              <input
                type="text"
                placeholder={ledgerDict.searchPlaceholder || 'Search tickets, rooms, teachers...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  width: '180px'
                }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>✕</button>
              )}
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                height: '30px',
                padding: '0 8px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '11.5px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">{ledgerDict.departmentFilter || 'All Departments'}</option>
              {Object.values(DEPARTMENTS).map(d => (
                <option key={d.id} value={d.id}>
                  {d.emoji} {d.translations?.[lang] || d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TICKETS LIST */}
        {filteredLedgerTickets.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <AlertTriangle size={32} color="#94a3b8" style={{ opacity: 0.6 }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
              {ledgerDict.emptyMessage || 'No tickets found matching the selected filters for this date.'}
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '480px', margin: 0 }}>
              Try selecting a different date (e.g. today or yesterday), or click below to generate realistic sample tickets for testing the daily analytics dashboard.
            </p>

            {/* Test Sample Activity Button */}
            <button
              onClick={handleGenerateSampleActivity}
              disabled={isGeneratingSamples}
              className="fluent-btn-primary"
              style={{ height: '32px', fontSize: '12px', marginTop: '6px' }}
            >
              <Sparkles size={14} />
              <span>{isGeneratingSamples ? (ledgerDict.seeding || 'Generating...') : (ledgerDict.seedSampleBtn || 'Generate Sample Day Activity for Testing')}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLedgerTickets.map(tk => {
              const deptMeta = resolveDepartment(tk.department);
              const deptName = deptMeta.translations?.[lang] || deptMeta.name;
              const isDone = isTicketFinished(tk);
              const isProg = isTicketInProgress(tk);
              const createdTimeStr = formatTime(tk.createdAt);
              const finishedTimeStr = formatTime(tk.completedAt || (isDone ? tk.updatedAt : null));
              const turnaroundStr = formatDuration(tk.createdAt, tk.completedAt || tk.updatedAt);

              return (
                <div
                  key={tk.id}
                  onClick={() => setSelectedTicketForModal(tk)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${tk.itemTitle} - #${tk.id}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTicketForModal(tk);
                    }
                  }}
                  style={{
                    background: 'var(--bg-card, rgba(15, 23, 42, 0.75))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    borderLeft: `4px solid ${isDone ? '#10b981' : isProg ? '#3b82f6' : '#f59e0b'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                    userSelect: 'none',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = deptMeta.color || '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.85)';
                    const indicator = e.currentTarget.querySelector('.digest-inspect-pill');
                    if (indicator) {
                      indicator.style.borderColor = '#818cf8';
                      indicator.style.color = '#ffffff';
                      indicator.style.background = 'rgba(99, 102, 241, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'var(--bg-card, rgba(15, 23, 42, 0.75))';
                    const indicator = e.currentTarget.querySelector('.digest-inspect-pill');
                    if (indicator) {
                      indicator.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      indicator.style.color = '#e2e8f0';
                      indicator.style.background = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                >
                  {/* Top Bar: Dept, ID, Urgency, Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                      <span style={{ fontSize: '14px' }}>{deptMeta.emoji}</span>
                      <strong style={{ color: '#f8fafc' }}>{deptName}</strong>
                      <span>•</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#818cf8' }}>#{tk.id}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#c4b5fd', fontWeight: '600' }}>
                        <Clock size={11} />
                        {createdTimeStr}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Urgency Badge */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: tk.urgency === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: tk.urgency === 'high' ? '#f87171' : '#94a3b8',
                          border: tk.urgency === 'high' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {tk.urgency ? tk.urgency.toUpperCase() : 'MEDIUM'}
                      </span>

                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isDone ? 'rgba(16, 185, 129, 0.2)' : isProg ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isDone ? '#34d399' : isProg ? '#60a5fa' : '#fbbf24',
                          border: isDone ? '1px solid rgba(16, 185, 129, 0.35)' : isProg ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
                        }}
                      >
                        {isDone ? '✓ Finished' : isProg ? '⏳ In Process' : '⚠ Pending Review'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Title & Room */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', margin: '0 0 3px 0' }}>
                        {tk.itemTitle}
                      </h4>
                      {tk.description && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4, maxWidth: '820px' }}>
                          {tk.description}
                        </p>
                      )}
                    </div>

                    <div
                      className="digest-inspect-pill"
                      style={{
                        height: '28px',
                        padding: '0 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        pointerEvents: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Eye size={12} />
                      <span>{ledgerDict.inspectBtn || 'Inspect'}</span>
                      <ChevronRight size={12} style={{ opacity: 0.8 }} />
                    </div>
                  </div>

                  {/* Bottom: Accountability (Submitted By, Handled By, Timestamps) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '11px',
                      color: '#94a3b8'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      {/* Location */}
                      <span>
                        📍 <strong>{tk.roomNumber || 'Campus Ground'}</strong>
                      </span>

                      {/* Requester (Created By) */}
                      <span>
                        👤 {ledgerDict.requester || 'Submitted by'}: <strong style={{ color: '#f8fafc' }}>{tk.teacherName || 'Staff'}</strong>
                      </span>

                      {/* Handler (Assigned Worker) */}
                      <span>
                        🛠️ {ledgerDict.assignee || 'Handled by'}:{' '}
                        {tk.assignedWorker ? (
                          <strong style={{ color: '#38bdf8' }}>{tk.assignedWorker}</strong>
                        ) : (
                          <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>({ledgerDict.unassigned || 'Unassigned'})</span>
                        )}
                      </span>
                    </div>

                    {/* Completion Info */}
                    {isDone && turnaroundStr && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '600' }}>
                        <CheckCircle2 size={12} />
                        <span>Resolved at {finishedTimeStr} ({turnaroundStr} SLA)</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Ticket Details & Action Modal */}
      {selectedTicketForModal && (
        <DepartmentActionModal
          ticket={selectedTicketForModal}
          isOpen={!!selectedTicketForModal}
          onClose={() => setSelectedTicketForModal(null)}
        />
      )}

    </div>
  );
};
