// Date utilities for Library System

export const DEFAULT_LOAN_DAYS = {
  Fiction: 14,
  Nonfiction: 21,
  Textbooks: 120
};

export function getTodayFormatted() {
  return new Date().toISOString().split('T')[0];
}

export function addDaysToDate(baseDate, days) {
  const d = new Date(baseDate || new Date());
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split('T')[0];
}

export function calculateDueDateForBookType(bookType, customDays = null) {
  const days = customDays !== null ? customDays : (DEFAULT_LOAN_DAYS[bookType] || 14);
  return {
    days,
    dueDate: addDaysToDate(new Date(), days)
  };
}

// Calculate days remaining or days overdue
export function getLoanTimeStatus(dueDate, returnDate = null) {
  if (returnDate) {
    return {
      status: 'returned',
      label: `Returned ${returnDate}`,
      color: 'slate'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'overdue',
      diffDays,
      overdueDays,
      label: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
      badgeClass: 'badge-overdue'
    };
  } else if (diffDays === 0) {
    return {
      status: 'due-today',
      diffDays: 0,
      label: 'Due today',
      badgeClass: 'badge-warning'
    };
  } else if (diffDays <= 3) {
    return {
      status: 'due-soon',
      diffDays,
      label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      badgeClass: 'badge-warning'
    };
  } else {
    return {
      status: 'active',
      diffDays,
      label: `${diffDays} days remaining`,
      badgeClass: 'badge-active'
    };
  }
}

export function formatDatePretty(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}
