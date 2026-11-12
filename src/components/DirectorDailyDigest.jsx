import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../AppContext';
import { 
  Calendar, 
  CalendarDays,
  CalendarRange,
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
  ChevronRight,
  TrendingUp,
  BarChart3,
  Layers,
  Filter
} from 'lucide-react';
import { resolveDepartment, DEPARTMENTS } from '../departments';
import { DepartmentActionModal } from './DepartmentActionModal';
import { navigate } from '../router';

// ============================================================================
// DATE & PERIOD MATH HELPERS (LOCAL TIMEZONE AWARE)
// ============================================================================

const formatLocalDate = (d) => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLocalMonth = (d) => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

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

const isTicketFinished = (t) => {
  return t.status === 'completed' || t.status === 'delivered' || t.status === 'issued';
};

const isTicketInProgress = (t) => {
  return t.status === 'in_progress' || t.status === 'purchasing';
};

// Monday of the week for given date
const getStartOfWeek = (d) => {
  const date = typeof d === 'string' ? new Date(`${d}T00:00:00`) : new Date(d);
  if (isNaN(date.getTime())) return new Date();
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0);
};

// Sunday of the week
const getEndOfWeek = (startOfWeek) => {
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

// ISO week number calculation
const getWeekNumber = (d) => {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Start & End of Month
const getStartOfMonth = (yearMonthStr) => {
  if (typeof yearMonthStr === 'string' && yearMonthStr.includes('-')) {
    const [y, m] = yearMonthStr.split('-');
    return new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

const getEndOfMonth = (yearMonthStr) => {
  if (typeof yearMonthStr === 'string' && yearMonthStr.includes('-')) {
    const [y, m] = yearMonthStr.split('-');
    return new Date(Number(y), Number(m), 0, 23, 59, 59, 999);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DirectorDailyDigest = ({ onOpenNewTicket, currentPath, initialPeriod }) => {
  const { t, lang, tickets, addTicket, role } = useApp();

  // Determine initial period: 'daily' | 'weekly' | 'monthly'
  const determineInitialPeriod = () => {
    if (initialPeriod) return initialPeriod;
    if (typeof window !== 'undefined') {
      const path = (currentPath || window.location.pathname || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      if (path.includes('weekly') || search.includes('weekly')) return 'weekly';
      if (path.includes('monthly') || search.includes('monthly')) return 'monthly';
    }
    return 'daily';
  };

  const [reportPeriod, setReportPeriod] = useState(determineInitialPeriod);

  // Sync with currentPath and initialPeriod changes
  useEffect(() => {
    if (initialPeriod) {
      setReportPeriod(initialPeriod);
    } else if (currentPath) {
      if (currentPath.includes('weekly')) setReportPeriod('weekly');
      else if (currentPath.includes('monthly')) setReportPeriod('monthly');
      else if (currentPath.includes('daily')) setReportPeriod('daily');
    }
  }, [initialPeriod, currentPath]);

  // Today helpers
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const todayMonthStr = useMemo(() => formatLocalMonth(new Date()), []);

  // 1. DAILY state
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedHour, setSelectedHour] = useState(null); // hour 0-23

  // 2. WEEKLY state
  const [selectedWeekDate, setSelectedWeekDate] = useState(todayStr);
  const [selectedWeekdayFilter, setSelectedWeekdayFilter] = useState(null); // YYYY-MM-DD or null

  // 3. MONTHLY state
  const [selectedMonth, setSelectedMonth] = useState(todayMonthStr);
  const [monthlyViewMode, setMonthlyViewMode] = useState('weeks'); // 'weeks' | 'daily'
  const [selectedWeekOfMonth, setSelectedWeekOfMonth] = useState(null); // 1-5 or null
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(null); // 1-31 or null

  // Common filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, finished, in_progress, pending, urgent
  const [deptFilter, setDeptFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState(null); // { type: 'requester'|'handler', name: string }
  const [selectedTicketForModal, setSelectedTicketForModal] = useState(null);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [showBriefingBox, setShowBriefingBox] = useState(true);

  // Switch Period Handler with URL navigation
  const handleSwitchPeriod = (newPeriod) => {
    setReportPeriod(newPeriod);
    setSelectedHour(null);
    setSelectedWeekdayFilter(null);
    setSelectedWeekOfMonth(null);
    setSelectedDayOfMonth(null);
    setPersonFilter(null);

    const targetUrl = newPeriod === 'weekly' 
      ? '/weekly-report' 
      : newPeriod === 'monthly' 
      ? '/monthly-report' 
      : '/daily-digest';
    navigate(targetUrl, { replace: true });
  };

  // Find all dates that have tickets in the system (for jumping)
  const activeDatesWithTickets = useMemo(() => {
    const dates = new Set();
    (tickets || []).forEach(tk => {
      const d = formatLocalDate(tk.createdAt);
      if (d) dates.add(d);
    });
    return Array.from(dates).sort().reverse();
  }, [tickets]);

  const latestActiveDate = activeDatesWithTickets[0] || todayStr;

  // ============================================================================
  // DATE RANGE CALCULATIONS FOR SELECTED PERIOD
  // ============================================================================

  // Weekly Date Range
  const startOfWeek = useMemo(() => getStartOfWeek(selectedWeekDate), [selectedWeekDate]);
  const endOfWeek = useMemo(() => getEndOfWeek(startOfWeek), [startOfWeek]);
  const weekNumber = useMemo(() => getWeekNumber(startOfWeek), [startOfWeek]);

  // Monthly Date Range
  const startOfMonth = useMemo(() => getStartOfMonth(selectedMonth), [selectedMonth]);
  const endOfMonth = useMemo(() => getEndOfMonth(selectedMonth), [selectedMonth]);

  // ============================================================================
  // NAVIGATION CONTROLS (DAY, WEEK, MONTH)
  // ============================================================================

  // DAILY SHIFT
  const handleShiftDate = (days) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatLocalDate(d));
    setSelectedHour(null);
    setPersonFilter(null);
  };

  // WEEKLY SHIFT
  const handleShiftWeek = (weeks) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + (weeks * 7));
    setSelectedWeekDate(formatLocalDate(d));
    setSelectedWeekdayFilter(null);
    setPersonFilter(null);
  };

  // MONTHLY SHIFT
  const handleShiftMonth = (months) => {
    const [y, m] = selectedMonth.split('-');
    const d = new Date(Number(y), Number(m) - 1 + months, 1);
    setSelectedMonth(formatLocalMonth(d));
    setSelectedWeekOfMonth(null);
    setSelectedDayOfMonth(null);
    setPersonFilter(null);
  };

  // Presets
  const handleSetQuickPreset = (preset) => {
    if (reportPeriod === 'daily') {
      if (preset === 'today') setSelectedDate(todayStr);
      else if (preset === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        setSelectedDate(formatLocalDate(y));
      } else if (preset === 'latest') {
        setSelectedDate(latestActiveDate);
      }
      setSelectedHour(null);
    } else if (reportPeriod === 'weekly') {
      if (preset === 'current') setSelectedWeekDate(todayStr);
      else if (preset === 'last') {
        const last = new Date();
        last.setDate(last.getDate() - 7);
        setSelectedWeekDate(formatLocalDate(last));
      } else if (preset === 'latest') {
        setSelectedWeekDate(latestActiveDate);
      }
      setSelectedWeekdayFilter(null);
    } else if (reportPeriod === 'monthly') {
      if (preset === 'current') setSelectedMonth(todayMonthStr);
      else if (preset === 'last') {
        const lm = new Date();
        lm.setMonth(lm.getMonth() - 1);
        setSelectedMonth(formatLocalMonth(lm));
      } else if (preset === 'latest') {
        setSelectedMonth(latestActiveDate.slice(0, 7));
      }
      setSelectedWeekOfMonth(null);
      setSelectedDayOfMonth(null);
    }
    setPersonFilter(null);
  };

  // ============================================================================
  // PERIOD TICKETS FILTERING
  // ============================================================================

  // Filter all tickets active in the chosen timeframe
  const periodTickets = useMemo(() => {
    const all = tickets || [];

    if (reportPeriod === 'daily') {
      return all.filter(tk => {
        const createdDay = formatLocalDate(tk.createdAt);
        const updatedDay = formatLocalDate(tk.completedAt || tk.updatedAt);
        return createdDay === selectedDate || updatedDay === selectedDate;
      });
    }

    if (reportPeriod === 'weekly') {
      const sMs = startOfWeek.getTime();
      const eMs = endOfWeek.getTime();
      return all.filter(tk => {
        const cMs = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
        const uMs = (tk.completedAt || tk.updatedAt) ? new Date(tk.completedAt || tk.updatedAt).getTime() : 0;
        return (cMs >= sMs && cMs <= eMs) || (uMs >= sMs && uMs <= eMs);
      });
    }

    if (reportPeriod === 'monthly') {
      const sMs = startOfMonth.getTime();
      const eMs = endOfMonth.getTime();
      return all.filter(tk => {
        const cMs = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
        const uMs = (tk.completedAt || tk.updatedAt) ? new Date(tk.completedAt || tk.updatedAt).getTime() : 0;
        return (cMs >= sMs && cMs <= eMs) || (uMs >= sMs && uMs <= eMs);
      });
    }

    return all;
  }, [tickets, reportPeriod, selectedDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth]);

  // Tickets specifically created in this period
  const ticketsCreatedInPeriod = useMemo(() => {
    const all = tickets || [];

    if (reportPeriod === 'daily') {
      return all.filter(tk => formatLocalDate(tk.createdAt) === selectedDate);
    }
    if (reportPeriod === 'weekly') {
      const sMs = startOfWeek.getTime();
      const eMs = endOfWeek.getTime();
      return all.filter(tk => {
        const cMs = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
        return cMs >= sMs && cMs <= eMs;
      });
    }
    if (reportPeriod === 'monthly') {
      const sMs = startOfMonth.getTime();
      const eMs = endOfMonth.getTime();
      return all.filter(tk => {
        const cMs = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
        return cMs >= sMs && cMs <= eMs;
      });
    }
    return [];
  }, [tickets, reportPeriod, selectedDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth]);

  // Tickets finished in this period
  const ticketsFinishedInPeriod = useMemo(() => {
    return periodTickets.filter(tk => isTicketFinished(tk));
  }, [periodTickets]);

  const ticketsInProgressInPeriod = useMemo(() => {
    return periodTickets.filter(tk => isTicketInProgress(tk));
  }, [periodTickets]);

  const ticketsPendingInPeriod = useMemo(() => {
    return periodTickets.filter(tk => tk.status === 'pending');
  }, [periodTickets]);

  const urgentTicketsInPeriod = useMemo(() => {
    return periodTickets.filter(tk => tk.urgency === 'high' || tk.urgency === 'critical');
  }, [periodTickets]);

  // Resolution Rate SLA
  const resolutionRate = useMemo(() => {
    if (ticketsCreatedInPeriod.length === 0) {
      if (ticketsFinishedInPeriod.length > 0) return 100;
      return 0;
    }
    const resolvedFromCreated = ticketsCreatedInPeriod.filter(isTicketFinished).length;
    return Math.round((resolvedFromCreated / ticketsCreatedInPeriod.length) * 100);
  }, [ticketsCreatedInPeriod, ticketsFinishedInPeriod]);

  // Avg Turnaround SLA Text
  const avgTurnaroundText = useMemo(() => {
    const finishedWithTimes = ticketsFinishedInPeriod.filter(tk => tk.createdAt && (tk.completedAt || tk.updatedAt));
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
    if (hrs >= 24) {
      const days = Math.floor(hrs / 24);
      const remHours = hrs % 24;
      return `${days}d ${remHours}h`;
    }
    return `${hrs}h ${mins}m`;
  }, [ticketsFinishedInPeriod]);

  // Total procurement cost for period
  const totalPeriodSpent = useMemo(() => {
    return periodTickets.reduce((sum, tk) => sum + (Number(tk.purchaseCost) || 0), 0);
  }, [periodTickets]);

  // Quick live volume counts for switcher badges
  const liveSwitcherCounts = useMemo(() => {
    const all = tickets || [];
    const tStart = new Date();
    tStart.setHours(0, 0, 0, 0);

    const wStart = getStartOfWeek(new Date());
    const mStart = new Date(tStart.getFullYear(), tStart.getMonth(), 1, 0, 0, 0, 0);

    const todayCount = all.filter(tk => formatLocalDate(tk.createdAt) === todayStr).length;
    const weekCount = all.filter(tk => {
      const c = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
      return c >= wStart.getTime();
    }).length;
    const monthCount = all.filter(tk => {
      const c = tk.createdAt ? new Date(tk.createdAt).getTime() : 0;
      return c >= mStart.getTime();
    }).length;

    return { todayCount, weekCount, monthCount };
  }, [tickets, todayStr]);

  // ============================================================================
  // VISUAL TIMELINES (HOURLY FOR DAY, 7-DAY FOR WEEK, WEEKS/30-DAY FOR MONTH)
  // ============================================================================

  // 1. Daily Hourly Data (07:00 to 20:00)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    const createdByHour = {};
    const finishedByHour = {};

    hours.forEach(h => {
      createdByHour[h] = 0;
      finishedByHour[h] = 0;
    });

    ticketsCreatedInPeriod.forEach(tk => {
      if (tk.createdAt) {
        const h = new Date(tk.createdAt).getHours();
        if (createdByHour[h] !== undefined) createdByHour[h] += 1;
      }
    });

    ticketsFinishedInPeriod.forEach(tk => {
      const finishTime = tk.completedAt || tk.updatedAt;
      if (finishTime) {
        const h = new Date(finishTime).getHours();
        if (finishedByHour[h] !== undefined) finishedByHour[h] += 1;
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

    return { hours, createdByHour, finishedByHour, maxCount, peakHour, peakHourVolume };
  }, [ticketsCreatedInPeriod, ticketsFinishedInPeriod]);

  // 2. Weekly Day-of-Week Data (Monday through Sunday)
  const weeklyData = useMemo(() => {
    const days = [];
    const start = new Date(startOfWeek);

    for (let i = 0; i < 7; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const dateStr = formatLocalDate(cur);
      const dayShort = cur.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', { weekday: 'short' });
      const dayFull = cur.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', { weekday: 'long' });
      const dayMonth = `${cur.getDate()} ${cur.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', { month: 'short' })}`;

      const createdCount = ticketsCreatedInPeriod.filter(tk => formatLocalDate(tk.createdAt) === dateStr).length;
      const finishedCount = ticketsFinishedInPeriod.filter(tk => formatLocalDate(tk.completedAt || tk.updatedAt) === dateStr).length;

      days.push({
        index: i,
        date: cur,
        dateStr,
        dayShort,
        dayFull,
        dayMonth,
        createdCount,
        finishedCount,
        total: createdCount + finishedCount
      });
    }

    let maxCount = 1;
    let peakDay = null;
    let peakDayVolume = 0;

    days.forEach(d => {
      if (d.total > maxCount) maxCount = d.total;
      if (d.createdCount > peakDayVolume) {
        peakDayVolume = d.createdCount;
        peakDay = d;
      }
    });

    return { days, maxCount, peakDay, peakDayVolume };
  }, [startOfWeek, ticketsCreatedInPeriod, ticketsFinishedInPeriod, lang]);

  // 3. Monthly Weeks & Daily Trend Data
  const monthlyData = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = Number(yStr) || new Date().getFullYear();
    const month = Number(mStr) || (new Date().getMonth() + 1);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Weeks breakdown (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-end)
    const weeks = [
      { id: 1, startDay: 1, endDay: 7, label: lang === 'ru' ? 'Неделя 1 (1–7)' : lang === 'kk' ? '1-апта (1–7)' : 'Week 1 (1–7)' },
      { id: 2, startDay: 8, endDay: 14, label: lang === 'ru' ? 'Неделя 2 (8–14)' : lang === 'kk' ? '2-апта (8–14)' : 'Week 2 (8–14)' },
      { id: 3, startDay: 15, endDay: 21, label: lang === 'ru' ? 'Неделя 3 (15–21)' : lang === 'kk' ? '3-апта (15–21)' : 'Week 3 (15–21)' },
      { id: 4, startDay: 22, endDay: 28, label: lang === 'ru' ? 'Неделя 4 (22–28)' : lang === 'kk' ? '4-апта (22–28)' : 'Week 4 (22–28)' },
      { id: 5, startDay: 29, endDay: totalDaysInMonth, label: lang === 'ru' ? `Неделя 5 (29–${totalDaysInMonth})` : lang === 'kk' ? `5-апта (29–${totalDaysInMonth})` : `Week 5 (29–${totalDaysInMonth})` }
    ];

    let maxWeekCount = 1;
    let peakWeek = null;
    let peakWeekVolume = 0;

    weeks.forEach(w => {
      const createdCount = ticketsCreatedInPeriod.filter(tk => {
        if (!tk.createdAt) return false;
        const day = new Date(tk.createdAt).getDate();
        return day >= w.startDay && day <= w.endDay;
      }).length;

      const finishedCount = ticketsFinishedInPeriod.filter(tk => {
        const time = tk.completedAt || tk.updatedAt;
        if (!time) return false;
        const day = new Date(time).getDate();
        return day >= w.startDay && day <= w.endDay;
      }).length;

      w.createdCount = createdCount;
      w.finishedCount = finishedCount;
      w.total = createdCount + finishedCount;

      if (w.total > maxWeekCount) maxWeekCount = w.total;
      if (w.createdCount > peakWeekVolume) {
        peakWeekVolume = w.createdCount;
        peakWeek = w;
      }
    });

    // 30-Day Activity Curve
    const dailyPoints = [];
    let maxDailyCount = 1;
    let peakDayNum = null;
    let peakDayVol = 0;

    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dayDateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
      const createdCount = ticketsCreatedInPeriod.filter(tk => formatLocalDate(tk.createdAt) === dayDateStr).length;
      const finishedCount = ticketsFinishedInPeriod.filter(tk => formatLocalDate(tk.completedAt || tk.updatedAt) === dayDateStr).length;
      const total = createdCount + finishedCount;

      if (total > maxDailyCount) maxDailyCount = total;
      if (createdCount > peakDayVol) {
        peakDayVol = createdCount;
        peakDayNum = dayNum;
      }

      dailyPoints.push({
        dayNum,
        dayDateStr,
        createdCount,
        finishedCount,
        total
      });
    }

    return { weeks, maxWeekCount, peakWeek, peakWeekVolume, dailyPoints, maxDailyCount, peakDayNum, peakDayVol, totalDaysInMonth };
  }, [selectedMonth, ticketsCreatedInPeriod, ticketsFinishedInPeriod, lang]);

  // ============================================================================
  // DEPARTMENT BREAKDOWN & COST DISTRIBUTION
  // ============================================================================

  const departmentStats = useMemo(() => {
    const map = new Map();

    Object.values(DEPARTMENTS).forEach(d => {
      map.set(d.id, {
        id: d.id,
        name: d.translations?.[lang] || d.name,
        emoji: d.emoji,
        color: d.color,
        total: 0,
        finished: 0,
        inProgress: 0,
        pending: 0,
        cost: 0,
        tickets: []
      });
    });

    periodTickets.forEach(tk => {
      const deptId = resolveDepartment(tk.department)?.id || tk.department || 'other';
      const entry = map.get(deptId) || {
        id: deptId,
        name: deptId,
        emoji: '📋',
        color: '#8b5cf6',
        total: 0,
        finished: 0,
        inProgress: 0,
        pending: 0,
        cost: 0,
        tickets: []
      };

      entry.total += 1;
      if (isTicketFinished(tk)) entry.finished += 1;
      else if (isTicketInProgress(tk)) entry.inProgress += 1;
      else entry.pending += 1;

      entry.cost += Number(tk.purchaseCost) || 0;
      entry.tickets.push(tk);
      map.set(deptId, entry);
    });

    return Array.from(map.values())
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [periodTickets, lang]);

  // ============================================================================
  // PERSONNEL & ACCOUNTABILITY MATRIX
  // ============================================================================

  // Requesters breakdown
  const requestersList = useMemo(() => {
    const map = new Map();
    ticketsCreatedInPeriod.forEach(tk => {
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
  }, [ticketsCreatedInPeriod]);

  // Handlers breakdown
  const handlersList = useMemo(() => {
    const map = new Map();
    periodTickets.forEach(tk => {
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
  }, [periodTickets]);

  // ============================================================================
  // LEDGER FILTERING
  // ============================================================================

  const filteredLedgerTickets = useMemo(() => {
    return periodTickets.filter(tk => {
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

      // 3. Time-Slice Filters:
      // a) Daily Hour Filter
      if (reportPeriod === 'daily' && selectedHour !== null) {
        const createdH = tk.createdAt ? new Date(tk.createdAt).getHours() : -1;
        const finishedH = (tk.completedAt || tk.updatedAt) ? new Date(tk.completedAt || tk.updatedAt).getHours() : -1;
        if (createdH !== selectedHour && finishedH !== selectedHour) return false;
      }

      // b) Weekly Weekday Filter
      if (reportPeriod === 'weekly' && selectedWeekdayFilter !== null) {
        const cDate = formatLocalDate(tk.createdAt);
        const uDate = formatLocalDate(tk.completedAt || tk.updatedAt);
        if (cDate !== selectedWeekdayFilter && uDate !== selectedWeekdayFilter) return false;
      }

      // c) Monthly Week-of-Month Filter
      if (reportPeriod === 'monthly' && selectedWeekOfMonth !== null) {
        const weekConfig = monthlyData.weeks.find(w => w.id === selectedWeekOfMonth);
        if (weekConfig) {
          const cDay = tk.createdAt ? new Date(tk.createdAt).getDate() : -1;
          const uDay = (tk.completedAt || tk.updatedAt) ? new Date(tk.completedAt || tk.updatedAt).getDate() : -1;
          const cInWeek = cDay >= weekConfig.startDay && cDay <= weekConfig.endDay;
          const uInWeek = uDay >= weekConfig.startDay && uDay <= weekConfig.endDay;
          if (!cInWeek && !uInWeek) return false;
        }
      }

      // d) Monthly Specific Day-of-Month Filter
      if (reportPeriod === 'monthly' && selectedDayOfMonth !== null) {
        const dayStr = `${selectedMonth}-${String(selectedDayOfMonth).padStart(2, '0')}`;
        const cDate = formatLocalDate(tk.createdAt);
        const uDate = formatLocalDate(tk.completedAt || tk.updatedAt);
        if (cDate !== dayStr && uDate !== dayStr) return false;
      }

      // 4. Person Filter
      if (personFilter) {
        if (personFilter.type === 'requester' && tk.teacherName !== personFilter.name) return false;
        if (personFilter.type === 'handler' && tk.assignedWorker !== personFilter.name) return false;
      }

      // 5. Search Query
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
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [periodTickets, statusFilter, deptFilter, reportPeriod, selectedHour, selectedWeekdayFilter, selectedWeekOfMonth, selectedDayOfMonth, monthlyData.weeks, selectedMonth, personFilter, searchTerm]);

  // ============================================================================
  // FORMATTED LABELS & EXECUTIVE BRIEFING NARRATIVE
  // ============================================================================

  // Formatted Date string for Daily
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

  // Formatted Week Label for Weekly
  const formattedWeekLabel = useMemo(() => {
    try {
      const s = startOfWeek.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', { day: 'numeric', month: 'short' });
      const e = endOfWeek.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const weekSuffix = lang === 'ru' ? `Неделя ${weekNumber}` : lang === 'kk' ? `${weekNumber}-апта` : `Week ${weekNumber}`;
      return `${s} — ${e} (${weekSuffix})`;
    } catch {
      return `${formatLocalDate(startOfWeek)} — ${formatLocalDate(endOfWeek)}`;
    }
  }, [startOfWeek, endOfWeek, weekNumber, lang]);

  // Formatted Month Label for Monthly
  const formattedMonthLabel = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'kk' ? 'kk-KZ' : 'en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth, lang]);

  // Executive narrative briefing adapted per period
  const executiveBriefing = useMemo(() => {
    const totalCreated = ticketsCreatedInPeriod.length;
    const totalFinished = ticketsFinishedInPeriod.length;
    const totalInProg = ticketsInProgressInPeriod.length;
    const totalPending = ticketsPendingInPeriod.length;
    const costFormatted = totalPeriodSpent.toLocaleString();

    // 1. DAILY
    if (reportPeriod === 'daily') {
      const peakText = hourlyData.peakHour !== null
        ? `${String(hourlyData.peakHour).padStart(2, '0')}:00 - ${String(hourlyData.peakHour + 1).padStart(2, '0')}:00 (${hourlyData.peakHourVolume} tickets)`
        : 'Evenly distributed';

      if (lang === 'ru') {
        return `Оперативная сводка за ${formattedSelectedDate}: зарегистрировано обращений — ${totalCreated}, успешно выполнено — ${totalFinished} (${resolutionRate}% выполнения). В процессе исполнения персоналом находится ${totalInProg} заявок, ожидают назначения — ${totalPending}. Пиковая нагрузка обращений пришлась на интервал ${peakText}. Среднее время реагирования и закрытия задач составило ${avgTurnaroundText}. Затраты на детали: ₸${costFormatted}. Задействовано специалистов: ${handlersList.length}.`;
      }
      if (lang === 'kk') {
        return `${formattedSelectedDate} күнгі жедел есеп: барлығы ${totalCreated} өтінім тіркелді, ${totalFinished} өтінім сәтті орындалды (${resolutionRate}% шешу көрсеткіші). Қазіргі уақытта мамандар ${totalInProg} өтінімді орындауда, ${totalPending} өтінім қаралуды күтуде. Ең жоғары жүктеме уақыты: ${peakText}. Өтінімдердің орташа орындалу уақыты ${avgTurnaroundText} құрады. Сатып алулар мен бөлшектер шығыны: ₸${costFormatted}. Жұмылдырылған мамандар саны: ${handlersList.length}.`;
      }
      return `Executive briefing for ${formattedSelectedDate}: Total tickets registered today — ${totalCreated}, successfully resolved and closed — ${totalFinished} (${resolutionRate}% resolution SLA). There are currently ${totalInProg} active tasks in progress, and ${totalPending} requests pending review. Peak request intake occurred at ${peakText}. Average resolution turnaround was ${avgTurnaroundText}. Spare parts expenditure: ₸${costFormatted}. Assigned staff specialists active: ${handlersList.length}.`;
    }

    // 2. WEEKLY
    if (reportPeriod === 'weekly') {
      const peakDayText = weeklyData.peakDay 
        ? `${weeklyData.peakDay.dayFull} (${weeklyData.peakDayVolume} tickets)`
        : 'Uniformly paced';

      if (lang === 'ru') {
        return `Еженедельный оперативный отчет за ${formattedWeekLabel}: за неделю зарегистрировано обращений — ${totalCreated}, успешно закрыто — ${totalFinished} (${resolutionRate}% показатель выполнения). В активной работе находится ${totalInProg} задач, ожидают назначения — ${totalPending}. Наибольший приток обращений пришелся на день: ${peakDayText}. Общие затраты на детали и расходные материалы за неделю составили ₸${costFormatted}. Средний норматив закрытия: ${avgTurnaroundText}. Активных специалистов: ${handlersList.length}.`;
      }
      if (lang === 'kk') {
        return `${formattedWeekLabel} бойынша апталық жедел есеп: апта ішінде барлығы ${totalCreated} өтінім тіркелді, ${totalFinished} өтінім сәтті орындалды (${resolutionRate}% орындалу көрсеткіші). Қазір мамандар ${totalInProg} өтінімді орындауда, ${totalPending} өтінім кезекте. Ең жоғары жүктеме түскен күн: ${peakDayText}. Бөлшектер мен сатып алуларға жұмсалған апталық шығын ₸${costFormatted} құрады. Орташа орындалу уақыты — ${avgTurnaroundText}. Жұмыс істеген мамандар саны: ${handlersList.length}.`;
      }
      return `Weekly Executive Briefing for ${formattedWeekLabel}: Across this week, ${totalCreated} tickets were registered, and ${totalFinished} successfully completed (${resolutionRate}% resolution SLA). Active tasks currently in progress: ${totalInProg}, awaiting assignment: ${totalPending}. Peak workday volume occurred on ${peakDayText}. Total weekly parts & procurement expenditure: ₸${costFormatted}. Average resolution SLA: ${avgTurnaroundText}. Active staff specialists: ${handlersList.length}.`;
    }

    // 3. MONTHLY
    const peakWeekText = monthlyData.peakWeek 
      ? `${monthlyData.peakWeek.label} (${monthlyData.peakWeekVolume} tickets)`
      : 'Even intake';
    const topDepts = departmentStats.slice(0, 3).map(d => `${d.emoji} ${d.name} (${d.total})`).join(', ') || 'General campus operations';

    if (lang === 'ru') {
      return `Сводный ежемесячный отчет за ${formattedMonthLabel}: за месяц поступило ${totalCreated} обращений от персонала школы, успешно закрыто ${totalFinished} задач (${resolutionRate}% месячный показатель SLA). Переходящих задач в работе: ${totalInProg}. Самый интенсивный период пришелся на ${peakWeekText}. Со склада отпущено материалов и деталей на сумму ₸${costFormatted}. Средний срок решения заявок составил ${avgTurnaroundText}. Ведущие направления обращений: ${topDepts}. Всего задействовано специалистов: ${handlersList.length}.`;
    }
    if (lang === 'kk') {
      return `${formattedMonthLabel} бойынша айлық жиынтық есеп: мектеп қызметкерлерінен ${totalCreated} өтінім қабылданды, ${totalFinished} тапсырма сәтті аяқталды (${resolutionRate}% айлық SLA көрсеткіші). Орындалу үстіндегі өтінімдер: ${totalInProg}. Ең жоғары сұраныс кезеңі: ${peakWeekText}. Қоймадан ₸${costFormatted} сомасына бөлшектер мен жабдықтар берілді. Орташа шешу уақыты: ${avgTurnaroundText}. Ең көп өтінім қабылдаған бағыттар: ${topDepts}. Қатысқан мамандар: ${handlersList.length}.`;
    }
    return `Monthly Executive Performance Report for ${formattedMonthLabel}: Total of ${totalCreated} requests registered campus-wide this month, with ${totalFinished} closed (${resolutionRate}% monthly SLA). Active rollover tasks: ${totalInProg}. Peak demand intake occurred during ${peakWeekText}. Total warehouse parts & supplies utilized: ₸${costFormatted}. Average resolution SLA: ${avgTurnaroundText}. Top service categories: ${topDepts}. Staff specialists active: ${handlersList.length}.`;
  }, [reportPeriod, ticketsCreatedInPeriod, ticketsFinishedInPeriod, ticketsInProgressInPeriod, ticketsPendingInPeriod, totalPeriodSpent, resolutionRate, hourlyData, weeklyData, monthlyData, avgTurnaroundText, handlersList, departmentStats, formattedSelectedDate, formattedWeekLabel, formattedMonthLabel, lang]);

  // ============================================================================
  // EXPORT CSV & PRINT
  // ============================================================================

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (periodTickets.length === 0) {
      alert(lang === 'ru' ? 'Нет данных для экспорта за выбранный период.' : 'No ticket data for this period to export.');
      return;
    }

    const headers = ['ID', 'Department', 'Item Title', 'Status', 'Urgency', 'Room', 'Submitted By', 'Handled By', 'Created At', 'Finished At', 'Turnaround', 'Purchase Cost (KZT)'];
    const rows = periodTickets.map(tk => [
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
      formatDuration(tk.createdAt, tk.completedAt || tk.updatedAt) || '',
      Number(tk.purchaseCost) || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    const filename = reportPeriod === 'daily'
      ? `eduops-daily-report-${selectedDate}.csv`
      : reportPeriod === 'weekly'
      ? `eduops-weekly-report-${formatLocalDate(startOfWeek)}-to-${formatLocalDate(endOfWeek)}.csv`
      : `eduops-monthly-report-${selectedMonth}.csv`;

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================================
  // SAMPLE DATA GENERATOR
  // ============================================================================

  const handleGenerateSampleActivity = async () => {
    setIsGeneratingSamples(true);

    try {
      if (reportPeriod === 'daily') {
        const dateBase = selectedDate;
        const sampleItems = [
          { dept: 'it_helpdesk', title: 'Projector HDMI Signal Lost in Classroom', teacher: 'Aigul Karimova (Physics)', room: 'B-2-4 (Science)', hour: 8, min: 15, status: 'completed', worker: 'Alexey IT Support', durationMins: 35, cost: 4500 },
          { dept: 'cleaning', title: 'Sanitization & Floor Cleaning in Medical Block', teacher: 'Elena Volkova (Nurse)', room: 'A-1-2 (Medical Block)', hour: 9, min: 10, status: 'completed', worker: 'Cleaning Staff (Gulnara)', durationMins: 20, cost: 0 },
          { dept: 'storage', title: 'A4 Printing Paper & Whiteboard Markers Set', teacher: 'Marat Sadykov (Maths)', room: 'C-3-10 (High School)', hour: 10, min: 5, status: 'completed', worker: 'Erzhan (Storage Manager)', durationMins: 45, cost: 8200 },
          { dept: 'electrical', title: 'Ceiling Fluorescent Light Flickering Rapidly', teacher: 'Sarah Jenkins (Art)', room: 'C-1-4 (Art Studio)', hour: 11, min: 30, status: 'in_progress', worker: 'Bakhyt (Electrician)', durationMins: null, cost: 3200 },
          { dept: 'carpentry', title: 'Relocate 12 Student Desks and 24 Chairs', teacher: 'Kairat Ospanov (Admin)', room: 'D-2-1 (Auditorium)', hour: 13, min: 45, status: 'in_progress', worker: 'Facilities Moving Team', durationMins: null, cost: 0 },
          { dept: 'plumbing', title: 'Washbasin Faucet Water Leak in 2nd Floor Restroom', teacher: 'Saule Baizhanova (Teacher)', room: 'B-2-WC (Girls Restroom)', hour: 15, min: 20, status: 'pending', worker: null, durationMins: null, cost: 5000 }
        ];

        for (const item of sampleItems) {
          const createdDate = new Date(`${dateBase}T${String(item.hour).padStart(2, '0')}:${String(item.min).padStart(2, '0')}:00`);
          let completedDate = null;
          if (item.status === 'completed' && item.durationMins) {
            completedDate = new Date(createdDate.getTime() + item.durationMins * 60000);
          }
          if (addTicket) {
            addTicket({
              department: item.dept,
              itemTitle: item.title,
              subcategory: item.title,
              category: 'other',
              quantity: 1,
              unit: 'pcs',
              urgency: item.status === 'pending' ? 'high' : 'medium',
              roomNumber: item.room,
              description: `Generated daily report test ticket for ${item.title}`,
              teacherName: item.teacher,
              createdById: 'demo-director',
              createdByRole: 'teacher',
              status: item.status,
              assignedWorker: item.worker,
              assignedRole: item.worker ? 'engineer' : null,
              handledAction: item.status,
              purchaseCost: item.cost,
              createdAt: createdDate.toISOString(),
              updatedAt: completedDate ? completedDate.toISOString() : createdDate.toISOString(),
              completedAt: completedDate ? completedDate.toISOString() : null
            });
          }
        }
      } else if (reportPeriod === 'weekly') {
        const sampleWeekItems = [
          { dayOffset: 0, dept: 'electrical', title: 'Main Corridor LED Panel Replacement', teacher: 'Yerbol Akhmetov (Physics)', room: 'A-2-Corridor', status: 'completed', worker: 'Bakhyt (Electrician)', cost: 12500 },
          { dayOffset: 1, dept: 'it_helpdesk', title: 'Smartboard Calibration & Audio Setup', teacher: 'Dinara Nurgali (English)', room: 'B-1-12 (Lab)', status: 'completed', worker: 'Alexey IT Support', cost: 0 },
          { dayOffset: 1, dept: 'storage', title: 'Stationery & Test Booklets Supply Batch', teacher: 'Zhanar Alieva (Admin)', room: 'Print Center', status: 'completed', worker: 'Erzhan (Storage)', cost: 18000 },
          { dayOffset: 2, dept: 'plumbing', title: 'Cafeteria Kitchen Sink Drain Unclogging', teacher: 'Head Chef Kairat', room: 'Kitchen Ground', status: 'completed', worker: 'Samat (Plumber)', cost: 7400 },
          { dayOffset: 2, dept: 'carpentry', title: 'Assemble 6 Library Bookshelves', teacher: 'Gulmira Librarian', room: 'Campus Library', status: 'in_progress', worker: 'Facilities Team', cost: 35000 },
          { dayOffset: 3, dept: 'cleaning', title: 'Deep Sanitization of Gymnasium Bleachers', teacher: 'PE Coach Timur', room: 'Sports Complex', status: 'completed', worker: 'Cleaning Crew A', cost: 6500 },
          { dayOffset: 4, dept: 'it_helpdesk', title: 'Server Room UPS Battery Health Check', teacher: 'IT Directorate', room: 'Server Room 01', status: 'completed', worker: 'Alexey IT Support', cost: 24000 },
          { dayOffset: 4, dept: 'electrical', title: 'External Security Floodlight Sensor Fault', teacher: 'Security Post 1', room: 'North Gate', status: 'pending', worker: null, cost: 9500 }
        ];

        for (const item of sampleWeekItems) {
          const itemDate = new Date(startOfWeek);
          itemDate.setDate(startOfWeek.getDate() + item.dayOffset);
          itemDate.setHours(9 + (item.dayOffset * 2), 15, 0);

          let compDate = null;
          if (item.status === 'completed') {
            compDate = new Date(itemDate.getTime() + 90 * 60000);
          }

          if (addTicket) {
            addTicket({
              department: item.dept,
              itemTitle: item.title,
              subcategory: item.title,
              category: 'other',
              quantity: 1,
              unit: 'pcs',
              urgency: item.status === 'pending' ? 'high' : 'medium',
              roomNumber: item.room,
              description: `Generated weekly test ticket for ${item.title}`,
              teacherName: item.teacher,
              createdById: 'demo-director',
              createdByRole: 'teacher',
              status: item.status,
              assignedWorker: item.worker,
              assignedRole: item.worker ? 'engineer' : null,
              handledAction: item.status,
              purchaseCost: item.cost,
              createdAt: itemDate.toISOString(),
              updatedAt: compDate ? compDate.toISOString() : itemDate.toISOString(),
              completedAt: compDate ? compDate.toISOString() : null
            });
          }
        }
      } else if (reportPeriod === 'monthly') {
        const [yStr, mStr] = selectedMonth.split('-');
        const year = Number(yStr);
        const month = Number(mStr);

        const sampleMonthItems = [
          { day: 2, dept: 'storage', title: 'Quarterly Office & Classroom Stationery Batch', teacher: 'Admin Directorate', room: 'Warehouse B', status: 'completed', worker: 'Erzhan (Storage)', cost: 65000 },
          { day: 5, dept: 'it_helpdesk', title: 'Annual Wi-Fi Access Points Firmware Upgrade', teacher: 'IT Department', room: 'Wings A, B, C', status: 'completed', worker: 'Alexey IT Support', cost: 42000 },
          { day: 9, dept: 'electrical', title: 'Emergency Exit Lighting Inspection & Replacement', teacher: 'Safety Officer', room: 'All Wings', status: 'completed', worker: 'Bakhyt (Electrician)', cost: 28500 },
          { day: 12, dept: 'plumbing', title: 'Central Boiler Valve Maintenance', teacher: 'Main Engineer', room: 'Boiler Room', status: 'completed', worker: 'Samat (Plumber)', cost: 54000 },
          { day: 16, dept: 'carpentry', title: 'New Interactive Desks for Robotics Lab', teacher: 'Robotics Teacher', room: 'Lab C-102', status: 'completed', worker: 'Facilities Team', cost: 89000 },
          { day: 20, dept: 'cleaning', title: 'Post-Exhibition Deep Steam Cleaning of Auditorium', teacher: 'Events Coordinator', room: 'Assembly Hall', status: 'completed', worker: 'Cleaning Crew A', cost: 18000 },
          { day: 24, dept: 'electrical', title: 'Dining Hall Ventilation Hood Motor Overhaul', teacher: 'Catering Lead', room: 'Canteen Kitchen', status: 'in_progress', worker: 'Bakhyt (Electrician)', cost: 36000 },
          { day: 27, dept: 'it_helpdesk', title: 'Replace Damaged Keyboards & Mice in Computer Lab', teacher: 'Informatics Dept', room: 'Lab A-201', status: 'pending', worker: null, cost: 22000 }
        ];

        for (const item of sampleMonthItems) {
          const itemDate = new Date(year, month - 1, item.day, 10, 30, 0);
          let compDate = null;
          if (item.status === 'completed') {
            compDate = new Date(itemDate.getTime() + 180 * 60000);
          }

          if (addTicket) {
            addTicket({
              department: item.dept,
              itemTitle: item.title,
              subcategory: item.title,
              category: 'other',
              quantity: 1,
              unit: 'pcs',
              urgency: item.status === 'pending' ? 'high' : 'medium',
              roomNumber: item.room,
              description: `Generated monthly test ticket for ${item.title}`,
              teacherName: item.teacher,
              createdById: 'demo-director',
              createdByRole: 'teacher',
              status: item.status,
              assignedWorker: item.worker,
              assignedRole: item.worker ? 'engineer' : null,
              handledAction: item.status,
              purchaseCost: item.cost,
              createdAt: itemDate.toISOString(),
              updatedAt: compDate ? compDate.toISOString() : itemDate.toISOString(),
              completedAt: compDate ? compDate.toISOString() : null
            });
          }
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

  // Dicts
  const dDict = t.dailyDigest || {};
  const periodDict = dDict.periodSelector || {};
  const weeklyTimelineDict = dDict.weeklyTimeline || {};
  const monthlyTimelineDict = dDict.monthlyTimeline || {};
  const deptAnalysisDict = dDict.departmentAnalysis || {};
  const kpiDict = dDict.kpi || {};
  const hourlyDict = dDict.hourly || {};
  const personnelDict = dDict.personnel || {};
  const ledgerDict = dDict.ledger || {};

  // Dynamic Header Title & Subtitle based on reportPeriod
  const pageTitle = useMemo(() => {
    if (reportPeriod === 'weekly') return dDict.weeklyTitle || 'Executive Weekly Operations Report';
    if (reportPeriod === 'monthly') return dDict.monthlyTitle || 'Executive Monthly Performance Digest';
    return dDict.dailyTitle || dDict.title || 'Executive Daily Ticket Digest';
  }, [reportPeriod, dDict]);

  const pageSubtitle = useMemo(() => {
    if (reportPeriod === 'weekly') {
      return dDict.weeklySubtitle || 'Weekly operational intelligence: Monday to Sunday trends, weekday peak workload, resolution SLA, and department budgets';
    }
    if (reportPeriod === 'monthly') {
      return dDict.monthlySubtitle || 'Full monthly analysis: 30-day demand curves, week-by-week comparisons, department procurement spend, and team rankings';
    }
    return dDict.dailySubtitle || dDict.subtitle || 'Daily operational intelligence: requests created, hourly timelines, resolution rates, and staff assignments';
  }, [reportPeriod, dDict]);

  const adaptedBriefingTitle = useMemo(() => {
    if (reportPeriod === 'weekly') return dDict.weeklySummaryTitle || 'Director Weekly Operational Briefing';
    if (reportPeriod === 'monthly') return dDict.monthlySummaryTitle || 'Director Monthly Operational Briefing';
    return dDict.executiveSummaryTitle || 'Director Daily Operational Briefing';
  }, [reportPeriod, dDict]);

  const roleBadgeTitle = useMemo(() => {
    if (role === 'engineer' || role === 'head_engineer') return dDict.mainEngineerBadge || 'Main Engineer Oversight';
    if (role === 'cleaning_head' || role === 'cleaning') return dDict.cleaningHeadBadge || 'Head of Cleaning Oversight';
    if (role === 'it_support') return dDict.itHeadBadge || 'Head of IT Oversight';
    if (role === 'storage_manager' || role === 'workerA') return dDict.storageBadge || 'Head of Storage Oversight';
    if (role === 'finance' || role === 'accountant') return dDict.financeBadge || 'Head of Finance Oversight';
    if (role === 'facilities_manager') return dDict.facilitiesBadge || 'Facilities Management Oversight';
    return dDict.directorBadge || 'Director Executive Intelligence';
  }, [role, dDict]);

  return (
    <div className="daily-digest-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ============================================================== */}
      {/* 1. EXECUTIVE COCKPIT HEADER WITH PERIOD SELECTOR               */}
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
        {/* TOP ROW: ROLE BADGE & PERIOD SELECTOR TABS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <span>{roleBadgeTitle}</span>
            </span>

            {reportPeriod === 'daily' && selectedDate === todayStr && (
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

          {/* PERIOD SWITCHER PILL (DAILY / WEEKLY / MONTHLY) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9px',
              padding: '3px',
              gap: '4px'
            }}
          >
            {/* Daily Tab */}
            <button
              onClick={() => handleSwitchPeriod('daily')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: reportPeriod === 'daily' ? '700' : '500',
                background: reportPeriod === 'daily' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(99, 102, 241, 0.35))' : 'transparent',
                border: reportPeriod === 'daily' ? '1px solid #8b5cf6' : '1px solid transparent',
                color: reportPeriod === 'daily' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: reportPeriod === 'daily' ? '0 2px 8px rgba(139, 92, 246, 0.25)' : 'none'
              }}
            >
              <Calendar size={13} color={reportPeriod === 'daily' ? '#c4b5fd' : 'currentColor'} />
              <span>{periodDict.daily || 'Daily Report'}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: reportPeriod === 'daily' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: '700'
                }}
              >
                {liveSwitcherCounts.todayCount}
              </span>
            </button>

            {/* Weekly Tab */}
            <button
              onClick={() => handleSwitchPeriod('weekly')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: reportPeriod === 'weekly' ? '700' : '500',
                background: reportPeriod === 'weekly' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(99, 102, 241, 0.35))' : 'transparent',
                border: reportPeriod === 'weekly' ? '1px solid #8b5cf6' : '1px solid transparent',
                color: reportPeriod === 'weekly' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: reportPeriod === 'weekly' ? '0 2px 8px rgba(139, 92, 246, 0.25)' : 'none'
              }}
            >
              <CalendarRange size={13} color={reportPeriod === 'weekly' ? '#c4b5fd' : 'currentColor'} />
              <span>{periodDict.weekly || 'Weekly Report'}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: reportPeriod === 'weekly' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: '700'
                }}
              >
                {liveSwitcherCounts.weekCount}
              </span>
            </button>

            {/* Monthly Tab */}
            <button
              onClick={() => handleSwitchPeriod('monthly')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: reportPeriod === 'monthly' ? '700' : '500',
                background: reportPeriod === 'monthly' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(99, 102, 241, 0.35))' : 'transparent',
                border: reportPeriod === 'monthly' ? '1px solid #8b5cf6' : '1px solid transparent',
                color: reportPeriod === 'monthly' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: reportPeriod === 'monthly' ? '0 2px 8px rgba(139, 92, 246, 0.25)' : 'none'
              }}
            >
              <CalendarDays size={13} color={reportPeriod === 'monthly' ? '#c4b5fd' : 'currentColor'} />
              <span>{periodDict.monthly || 'Monthly Report'}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: reportPeriod === 'monthly' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: '700'
                }}
              >
                {liveSwitcherCounts.monthCount}
              </span>
            </button>
          </div>
        </div>

        {/* TITLE & ACTION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {reportPeriod === 'daily' && <CalendarCheck2 size={24} color="#a78bfa" />}
              {reportPeriod === 'weekly' && <CalendarRange size={24} color="#a78bfa" />}
              {reportPeriod === 'monthly' && <CalendarDays size={24} color="#a78bfa" />}
              <span>{pageTitle}</span>
            </h1>

            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, maxWidth: '780px', lineHeight: 1.4 }}>
              {pageSubtitle}
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
              title="Export ticket data as CSV"
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

        {/* DATE / TIMEFRAME SELECTOR BAR */}
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
          {/* ======================= DAILY CONTROLS ======================= */}
          {reportPeriod === 'daily' && (
            <>
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
                    {periodTickets.length} ticket(s) recorded
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
            </>
          )}

          {/* ======================= WEEKLY CONTROLS ======================= */}
          {reportPeriod === 'weekly' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleShiftWeek(-1)}
                  className="fluent-btn-secondary"
                  style={{ height: '30px', padding: '0 9px' }}
                  title={dDict.previousWeek || 'Previous Week'}
                >
                  <ArrowLeft size={13} />
                </button>

                <button
                  onClick={() => handleSetQuickPreset('current')}
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'rgba(139, 92, 246, 0.25)',
                    border: '1px solid #8b5cf6',
                    color: '#f3f4f6',
                    cursor: 'pointer'
                  }}
                >
                  {dDict.thisWeek || 'This Week'}
                </button>

                <button
                  onClick={() => handleSetQuickPreset('last')}
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
                  {dDict.lastWeek || 'Last Week'}
                </button>

                <button
                  onClick={() => handleShiftWeek(1)}
                  className="fluent-btn-secondary"
                  style={{ height: '30px', padding: '0 9px' }}
                  title={dDict.nextWeek || 'Next Week'}
                >
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Formatted Week Span & Jump Date Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                    {formattedWeekLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {periodTickets.length} ticket(s) recorded in week
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <CalendarRange size={14} color="#818cf8" />
                  <input
                    type="date"
                    value={selectedWeekDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedWeekDate(e.target.value);
                        setSelectedWeekdayFilter(null);
                        setPersonFilter(null);
                      }
                    }}
                    title={dDict.customWeek || 'Pick any date to view that week'}
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
            </>
          )}

          {/* ======================= MONTHLY CONTROLS ======================= */}
          {reportPeriod === 'monthly' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleShiftMonth(-1)}
                  className="fluent-btn-secondary"
                  style={{ height: '30px', padding: '0 9px' }}
                  title={dDict.previousMonth || 'Previous Month'}
                >
                  <ArrowLeft size={13} />
                </button>

                <button
                  onClick={() => handleSetQuickPreset('current')}
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: selectedMonth === todayMonthStr ? '700' : '500',
                    background: selectedMonth === todayMonthStr ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: selectedMonth === todayMonthStr ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: selectedMonth === todayMonthStr ? '#f3f4f6' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {dDict.thisMonth || 'This Month'}
                </button>

                <button
                  onClick={() => handleSetQuickPreset('last')}
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
                  {dDict.lastMonth || 'Last Month'}
                </button>

                <button
                  onClick={() => handleShiftMonth(1)}
                  className="fluent-btn-secondary"
                  style={{ height: '30px', padding: '0 9px' }}
                  title={dDict.nextMonth || 'Next Month'}
                >
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Formatted Month Label & Month Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                    {formattedMonthLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {periodTickets.length} ticket(s) recorded in month
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.06)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <CalendarDays size={14} color="#818cf8" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                        setSelectedWeekOfMonth(null);
                        setSelectedDayOfMonth(null);
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
            </>
          )}

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
              {adaptedBriefingTitle}
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
      {/* 3. KEY METRICS KPI CARDS GRID (PERIOD ADAPTED)                  */}
      {/* ============================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        
        {/* Total Created in Period */}
        <div
          onClick={() => { setStatusFilter('all'); setSelectedHour(null); setSelectedWeekdayFilter(null); setSelectedWeekOfMonth(null); setPersonFilter(null); }}
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
                {reportPeriod === 'weekly' ? (kpiDict.createdPeriod || 'Created in Week') : reportPeriod === 'monthly' ? (kpiDict.createdPeriod || 'Created in Month') : (kpiDict.createdToday || 'Created On Day')}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', margin: '4px 0 2px 0' }}>
                {ticketsCreatedInPeriod.length}
              </div>
              <div style={{ fontSize: '11px', color: '#a78bfa' }}>
                {reportPeriod === 'weekly' ? (kpiDict.createdWeekSubtitle || 'Weekly intake volume') : reportPeriod === 'monthly' ? (kpiDict.createdMonthSubtitle || 'Monthly intake volume') : (kpiDict.createdSubtitle || 'Total ticket volume')}
              </div>
            </div>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '10px' }}>
              <Activity size={20} color="#a78bfa" />
            </div>
          </div>
        </div>

        {/* Finished / Resolved in Period */}
        <div
          onClick={() => { setStatusFilter('finished'); setSelectedHour(null); setSelectedWeekdayFilter(null); setSelectedWeekOfMonth(null); }}
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
                {reportPeriod === 'weekly' ? (kpiDict.finishedPeriod || 'Resolved in Week') : reportPeriod === 'monthly' ? (kpiDict.finishedPeriod || 'Resolved in Month') : (kpiDict.finishedToday || 'Finished / Resolved')}
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#34d399', margin: '4px 0 2px 0' }}>
                {ticketsFinishedInPeriod.length}
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
          onClick={() => { setStatusFilter('in_progress'); setSelectedHour(null); setSelectedWeekdayFilter(null); setSelectedWeekOfMonth(null); }}
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
                {ticketsInProgressInPeriod.length}
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
          onClick={() => { setStatusFilter('pending'); setSelectedHour(null); setSelectedWeekdayFilter(null); setSelectedWeekOfMonth(null); }}
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
                {ticketsPendingInPeriod.length}
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
                ₸{totalPeriodSpent.toLocaleString()}
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
      {periodTickets.length > 0 && (
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
              {dDict.statusDistribution || 'Status Distribution'}
            </span>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ color: '#34d399' }}>● Finished: {ticketsFinishedInPeriod.length}</span>
              <span style={{ color: '#60a5fa' }}>● In Process: {ticketsInProgressInPeriod.length}</span>
              <span style={{ color: '#fbbf24' }}>● Pending: {ticketsPendingInPeriod.length}</span>
            </div>
          </div>

          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                width: `${(ticketsFinishedInPeriod.length / Math.max(1, periodTickets.length)) * 100}%`,
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.3s ease'
              }}
              title={`Finished: ${ticketsFinishedInPeriod.length}`}
            />
            <div
              style={{
                width: `${(ticketsInProgressInPeriod.length / Math.max(1, periodTickets.length)) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                transition: 'width 0.3s ease'
              }}
              title={`In Process: ${ticketsInProgressInPeriod.length}`}
            />
            <div
              style={{
                width: `${(ticketsPendingInPeriod.length / Math.max(1, periodTickets.length)) * 100}%`,
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                transition: 'width 0.3s ease'
              }}
              title={`Pending: ${ticketsPendingInPeriod.length}`}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DYNAMIC PERIOD TIMELINES & VISUAL CHARTS                    */}
      {/* ============================================================== */}

      {/* -------------------- 5A. DAILY: HOURLY TIMELINE -------------------- */}
      {reportPeriod === 'daily' && (
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
                  <div style={{ fontSize: '10px', fontWeight: '700', color: totalInHour > 0 ? '#f8fafc' : '#475569', minHeight: '14px' }}>
                    {totalInHour > 0 ? totalInHour : ''}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px', width: '100%', justifyContent: 'center' }}>
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
      )}

      {/* -------------------- 5B. WEEKLY: 7-DAY WEEKDAY TIMELINE -------------------- */}
      {reportPeriod === 'weekly' && (
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
                <CalendarRange size={16} color="#818cf8" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  {weeklyTimelineDict.title || 'Weekday Request & Resolution Distribution (Mon – Sun)'}
                </h3>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {weeklyTimelineDict.subtitle || 'Daily comparison of incoming requests versus completed tasks across the week'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c4b5fd' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#8b5cf6' }} />
                {weeklyTimelineDict.createdLegend || 'Created (Demand)'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} />
                {weeklyTimelineDict.finishedLegend || 'Finished (Resolved)'}
              </span>

              {selectedWeekdayFilter !== null && (
                <button
                  onClick={() => setSelectedWeekdayFilter(null)}
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
                  ✕ {weeklyTimelineDict.clearFilter || 'Clear Day Filter'} ({selectedWeekdayFilter})
                </button>
              )}
            </div>
          </div>

          {/* Peak Workday Callout Badge */}
          {weeklyData.peakDay && weeklyData.peakDayVolume > 0 && (
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
              <span>🔥 {weeklyTimelineDict.peakBadge || 'Peak Workload Day'}:</span>
              <span style={{ color: '#ffffff', fontWeight: '800' }}>
                {weeklyData.peakDay.dayFull} ({weeklyData.peakDay.dayMonth})
              </span>
              <span>({weeklyData.peakDayVolume} tickets submitted)</span>
            </div>
          )}

          {/* 7-Day Histogram Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', alignItems: 'flex-end', minHeight: '130px', padding: '10px 0 6px 0' }}>
            {weeklyData.days.map(d => {
              const isSelected = selectedWeekdayFilter === d.dateStr;
              const createdHeightPercent = Math.min(100, Math.round((d.createdCount / Math.max(1, weeklyData.maxCount)) * 90));
              const finishedHeightPercent = Math.min(100, Math.round((d.finishedCount / Math.max(1, weeklyData.maxCount)) * 90));

              return (
                <div
                  key={d.dateStr}
                  onClick={() => setSelectedWeekdayFilter(isSelected ? null : d.dateStr)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.15s ease'
                  }}
                  title={`${d.dayFull} (${d.dateStr}) — ${d.createdCount} created, ${d.finishedCount} finished`}
                >
                  {/* Volume Label */}
                  <div style={{ fontSize: '11px', fontWeight: '700', color: d.total > 0 ? '#f8fafc' : '#475569', minHeight: '15px' }}>
                    {d.total > 0 ? d.total : ''}
                  </div>

                  {/* Dual Bars Container */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '90px', width: '100%', justifyContent: 'center' }}>
                    {/* Created Bar */}
                    <div
                      style={{
                        width: '42%',
                        maxWidth: '24px',
                        height: `${Math.max(4, createdHeightPercent)}%`,
                        background: d.createdCount > 0 ? 'linear-gradient(180deg, #a78bfa, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.25s ease'
                      }}
                    />
                    {/* Finished Bar */}
                    <div
                      style={{
                        width: '42%',
                        maxWidth: '24px',
                        height: `${Math.max(4, finishedHeightPercent)}%`,
                        background: d.finishedCount > 0 ? 'linear-gradient(180deg, #34d399, #059669)' : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.25s ease'
                      }}
                    />
                  </div>

                  {/* Day Name & Date */}
                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: '700', color: isSelected ? '#ffffff' : '#f8fafc' }}>
                      {d.dayShort}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {d.dayMonth}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
            💡 {weeklyTimelineDict.filterWeekdayPrompt || 'Click any day column above to filter tickets in the ledger.'}
          </div>
        </div>
      )}

      {/* -------------------- 5C. MONTHLY: WEEKS BREAKDOWN & 30-DAY TREND -------------------- */}
      {reportPeriod === 'monthly' && (
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
                <CalendarDays size={16} color="#818cf8" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  {monthlyTimelineDict.title || 'Week-by-Week & Daily Monthly Intake Progression'}
                </h3>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {monthlyTimelineDict.subtitle || 'Comparison of ticket volumes across weeks and daily trends of the month'}
              </div>
            </div>

            {/* View Mode Toggle (Weeks vs 30-Day Curve) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.04)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  onClick={() => setMonthlyViewMode('weeks')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: monthlyViewMode === 'weeks' ? '700' : '500',
                    background: monthlyViewMode === 'weeks' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                    color: monthlyViewMode === 'weeks' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {monthlyTimelineDict.weeksTab || 'Weeks Breakdown'}
                </button>
                <button
                  onClick={() => setMonthlyViewMode('daily')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: monthlyViewMode === 'daily' ? '700' : '500',
                    background: monthlyViewMode === 'daily' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                    color: monthlyViewMode === 'daily' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {monthlyTimelineDict.dailyTrendTab || '30-Day Curve'}
                </button>
              </div>

              {(selectedWeekOfMonth !== null || selectedDayOfMonth !== null) && (
                <button
                  onClick={() => { setSelectedWeekOfMonth(null); setSelectedDayOfMonth(null); }}
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
                  ✕ {monthlyTimelineDict.clearFilter || 'Clear Filter'}
                </button>
              )}
            </div>
          </div>

          {/* Peak Callout Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {monthlyData.peakWeek && monthlyData.peakWeekVolume > 0 && (
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
                  fontWeight: '600'
                }}
              >
                <span>🔥 {monthlyTimelineDict.peakWeekBadge || 'Busiest Week'}:</span>
                <span style={{ color: '#ffffff', fontWeight: '800' }}>
                  {monthlyData.peakWeek.label}
                </span>
                <span>({monthlyData.peakWeekVolume} tickets)</span>
              </div>
            )}

            {monthlyData.peakDayNum && monthlyData.peakDayVol > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#c7d2fe',
                  fontWeight: '600'
                }}
              >
                <span>⭐ {monthlyTimelineDict.peakDayBadge || 'Peak Day of Month'}:</span>
                <span style={{ color: '#ffffff', fontWeight: '800' }}>
                  {selectedMonth}-{String(monthlyData.peakDayNum).padStart(2, '0')}
                </span>
                <span>({monthlyData.peakDayVol} tickets)</span>
              </div>
            )}
          </div>

          {/* VIEW A: WEEKS BREAKDOWN */}
          {monthlyViewMode === 'weeks' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {monthlyData.weeks.map(w => {
                const isSelected = selectedWeekOfMonth === w.id;
                const completionPct = w.total > 0 ? Math.round((w.finishedCount / Math.max(1, w.createdCount)) * 100) : 0;

                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedDayOfMonth(null);
                      setSelectedWeekOfMonth(isSelected ? null : w.id);
                    }}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc' }}>
                        {w.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700' }}>
                        {w.total} total
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '8px' }}>
                      <span style={{ color: '#c4b5fd' }}>📥 Created: <strong>{w.createdCount}</strong></span>
                      <span style={{ color: '#34d399' }}>✓ Done: <strong>{w.finishedCount}</strong></span>
                    </div>

                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (w.finishedCount / Math.max(1, w.total)) * 100)}%`,
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          height: '100%'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW B: 30-DAY DAILY CURVE HISTOGRAM */}
          {monthlyViewMode === 'daily' && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${monthlyData.totalDaysInMonth}, 1fr)`, gap: '3px', alignItems: 'flex-end', minHeight: '120px', padding: '10px 0 6px 0' }}>
              {monthlyData.dailyPoints.map(dp => {
                const isSelected = selectedDayOfMonth === dp.dayNum;
                const createdHeightPercent = Math.min(100, Math.round((dp.createdCount / Math.max(1, monthlyData.maxDailyCount)) * 85));
                const finishedHeightPercent = Math.min(100, Math.round((dp.finishedCount / Math.max(1, monthlyData.maxDailyCount)) * 85));

                return (
                  <div
                    key={dp.dayNum}
                    onClick={() => {
                      setSelectedWeekOfMonth(null);
                      setSelectedDayOfMonth(isSelected ? null : dp.dayNum);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                      border: isSelected ? '1px solid #818cf8' : '1px solid transparent'
                    }}
                    title={`Day ${dp.dayNum} (${dp.dayDateStr}) — ${dp.createdCount} created, ${dp.finishedCount} finished`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px', width: '100%', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '45%',
                          height: `${Math.max(4, createdHeightPercent)}%`,
                          background: dp.createdCount > 0 ? '#8b5cf6' : 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '2px 2px 0 0'
                        }}
                      />
                      <div
                        style={{
                          width: '45%',
                          height: `${Math.max(4, finishedHeightPercent)}%`,
                          background: dp.finishedCount > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '2px 2px 0 0'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '9px', color: isSelected ? '#ffffff' : '#94a3b8', fontWeight: isSelected ? '700' : '400' }}>
                      {dp.dayNum}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
            💡 {monthlyTimelineDict.filterWeekPrompt || 'Click any week card or day column above to filter tickets in the ledger.'}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DEPARTMENT & BUDGET BREAKDOWN (WEEKLY & MONTHLY)            */}
      {/* ============================================================== */}
      {departmentStats.length > 0 && (
        <div
          style={{
            background: 'rgba(18, 25, 44, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-depth-3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="#818cf8" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  {deptAnalysisDict.title || 'Department Ticket Distribution & Procurement Budget'}
                </h3>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {deptAnalysisDict.subtitle || 'Breakdown of requests, completion rates, and parts expenditure across campus departments'}
              </div>
            </div>

            {deptFilter !== 'all' && (
              <button
                onClick={() => setDeptFilter('all')}
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
                ✕ Clear Dept Filter
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {departmentStats.map(dept => {
              const isSelected = deptFilter === dept.id;
              const rate = dept.total > 0 ? Math.round((dept.finished / dept.total) * 100) : 0;

              return (
                <div
                  key={dept.id}
                  onClick={() => setDeptFilter(isSelected ? 'all' : dept.id)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderLeft: `4px solid ${dept.color || '#8b5cf6'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = dept.color || '#8b5cf6')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.07)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px' }}>{dept.emoji}</span>
                      <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{dept.name}</strong>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#c4b5fd' }}>
                      {dept.total}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                    <span>{rate}% {deptAnalysisDict.completed || 'done'} ({dept.finished}/{dept.total})</span>
                    {dept.cost > 0 && (
                      <span style={{ color: '#f472b6', fontWeight: '600' }}>₸{dept.cost.toLocaleString()}</span>
                    )}
                  </div>

                  <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${rate}%`,
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        height: '100%'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. "BY WHOM" — PERSONNEL & ACCOUNTABILITY MATRIX                */}
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
            {personnelDict.requestersSubtitle || 'Teachers and staff who raised tickets in this period'}
          </div>

          {requestersList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              {personnelDict.noRequesters || 'No tickets submitted in this period.'}
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
              {personnelDict.noHandlers || 'No staff assigned yet for this period.'}
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
      {/* 8. CHRONOLOGICAL TICKETS ACTIVITY LEDGER                        */}
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
              {ledgerDict.title || 'Tickets Activity Log'} ({filteredLedgerTickets.length})
            </h3>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {ledgerDict.subtitle || 'Detailed chronological record of every ticket in this period'}
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedHour !== null || selectedWeekdayFilter !== null || selectedWeekOfMonth !== null || selectedDayOfMonth !== null || personFilter !== null || deptFilter !== 'all') && (
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

              {selectedWeekdayFilter !== null && (
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
                  <CalendarRange size={11} />
                  <span>{selectedWeekdayFilter}</span>
                  <button onClick={() => setSelectedWeekdayFilter(null)} style={{ background: 'transparent', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              )}

              {selectedWeekOfMonth !== null && (
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
                  <CalendarDays size={11} />
                  <span>Week {selectedWeekOfMonth}</span>
                  <button onClick={() => setSelectedWeekOfMonth(null)} style={{ background: 'transparent', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              )}

              {selectedDayOfMonth !== null && (
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
                  <Calendar size={11} />
                  <span>Day {selectedDayOfMonth}</span>
                  <button onClick={() => setSelectedDayOfMonth(null)} style={{ background: 'transparent', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              )}

              {deptFilter !== 'all' && (
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
                  <Layers size={11} />
                  <span>{resolveDepartment(deptFilter)?.name || deptFilter}</span>
                  <button onClick={() => setDeptFilter('all')} style={{ background: 'transparent', border: 'none', color: '#c4b5fd', cursor: 'pointer', padding: 0 }}>✕</button>
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
              { id: 'all', label: ledgerDict.allStatus || 'All Tickets', count: periodTickets.length },
              { id: 'finished', label: ledgerDict.finishedOnly || 'Finished', count: ticketsFinishedInPeriod.length },
              { id: 'in_progress', label: ledgerDict.inProgressOnly || 'In Process', count: ticketsInProgressInPeriod.length },
              { id: 'pending', label: ledgerDict.pendingOnly || 'Pending Review', count: ticketsPendingInPeriod.length },
              { id: 'urgent', label: ledgerDict.urgentOnly || 'High Urgency', count: urgentTicketsInPeriod.length }
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
              {ledgerDict.emptyMessage || 'No tickets found matching the selected filters for this period.'}
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '480px', margin: 0 }}>
              Try selecting a different date/week/month, or click below to generate realistic sample tickets for testing this report.
            </p>

            {/* Test Sample Activity Button */}
            <button
              onClick={handleGenerateSampleActivity}
              disabled={isGeneratingSamples}
              className="fluent-btn-primary"
              style={{ height: '32px', fontSize: '12px', marginTop: '6px' }}
            >
              <Sparkles size={14} />
              <span>{isGeneratingSamples ? (ledgerDict.seeding || 'Generating...') : (ledgerDict.seedSampleBtn || 'Generate Sample Activity for Testing')}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLedgerTickets.map(tk => {
              const deptMeta = resolveDepartment(tk.department);
              const deptName = deptMeta.translations?.[lang] || deptMeta.name;
              const isDone = isTicketFinished(tk);
              const isProg = isTicketInProgress(tk);
              const createdDateStr = formatLocalDate(tk.createdAt);
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
                  {/* Top Bar: Dept, ID, Date, Time, Urgency, Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                      <span style={{ fontSize: '14px' }}>{deptMeta.emoji}</span>
                      <strong style={{ color: '#f8fafc' }}>{deptName}</strong>
                      <span>•</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#818cf8' }}>#{tk.id}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#c4b5fd', fontWeight: '600' }}>
                        <Clock size={11} />
                        {reportPeriod !== 'daily' ? `${createdDateStr} ${createdTimeStr}` : createdTimeStr}
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

                  {/* Bottom: Accountability (Submitted By, Handled By, Cost, Timestamps) */}
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
                      <span>
                        📍 <strong>{tk.roomNumber || 'Campus Ground'}</strong>
                      </span>

                      <span>
                        👤 {ledgerDict.requester || 'Submitted by'}: <strong style={{ color: '#f8fafc' }}>{tk.teacherName || 'Staff'}</strong>
                      </span>

                      <span>
                        🛠️ {ledgerDict.assignee || 'Handled by'}:{' '}
                        {tk.assignedWorker ? (
                          <strong style={{ color: '#38bdf8' }}>{tk.assignedWorker}</strong>
                        ) : (
                          <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>({ledgerDict.unassigned || 'Unassigned'})</span>
                        )}
                      </span>

                      {Number(tk.purchaseCost) > 0 && (
                        <span style={{ color: '#f472b6', fontWeight: '700' }}>
                          ₸{Number(tk.purchaseCost).toLocaleString()}
                        </span>
                      )}
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
