import { resolveDepartment } from '../departments';

/**
 * Checks whether a given user/role is directly related to a ticket.
 * Related users include:
 * 1. School Directors and System Administrators (executive oversight)
 * 2. The author/requester of the ticket (teacher, parent, guest)
 * 3. The assigned technician/worker (e.g. designated engineer, IT tech)
 * 4. The responsible department specialists (e.g. IT support for IT tickets, Cleaning for cleaning, etc.)
 *
 * Unrelated users MUST NOT see active tickets of other people/departments.
 */
export function isUserRelatedToTicket(ticket, currentUser, role, createdTicketIds = []) {
  if (!ticket) return false;

  // 1. School Directors and Administrators see all tickets for executive management
  if (role === 'director' || role === 'admin') {
    return true;
  }

  const myName = (currentUser?.name || '').trim().toLowerCase();
  const myId = currentUser?.id;
  const myPhone = (currentUser?.phone || '').trim().toLowerCase();
  const teacherName = (ticket.teacherName || '').trim().toLowerCase();
  const teacherPhone = (ticket.teacherPhone || '').trim().toLowerCase();
  const assignedWorker = (ticket.assignedWorker || '').trim().toLowerCase();

  // 2. Did the current user create this ticket?
  if (myId && ticket.createdById && ticket.createdById === myId) {
    return true;
  }
  if (myName && teacherName && (teacherName === myName || teacherName.includes(myName) || myName.includes(teacherName))) {
    return true;
  }
  if (myPhone && teacherPhone && myPhone === teacherPhone) {
    return true;
  }
  if (Array.isArray(createdTicketIds) && createdTicketIds.includes(ticket.id)) {
    return true;
  }

  // 3. Is the ticket assigned directly to this user or role?
  if (myName && assignedWorker && (assignedWorker === myName || assignedWorker.includes(myName) || myName.includes(assignedWorker))) {
    return true;
  }
  if (ticket.assignedRole && ticket.assignedRole === role) {
    return true;
  }

  // 4. Responsible Department Specialists
  const resolvedDept = resolveDepartment(ticket.department)?.id || ticket.department;

  if (role === 'it_support' && (resolvedDept === 'it_helpdesk' || resolvedDept === 'it')) {
    return true;
  }
  if (role === 'cleaning' && resolvedDept === 'cleaning') {
    return true;
  }
  if (role === 'engineer' && (resolvedDept === 'plumbing' || resolvedDept === 'electrical' || resolvedDept === 'engineering')) {
    return true;
  }
  if ((role === 'storage_manager' || role === 'workerA') && (
    resolvedDept === 'other' || 
    resolvedDept === 'storage' || 
    ticket.status === 'purchasing' || 
    ticket.status === 'issued' || 
    Number(ticket.purchaseCost) > 0 ||
    ticket.handledAction === 'purchased' ||
    ticket.handledAction === 'issued'
  )) {
    return true;
  }
  if (role === 'facilities_manager' && (
    ['carpentry', 'event_prep', 'grounds'].includes(resolvedDept) || 
    resolvedDept === 'facilities' || 
    ticket.moveDetails !== null
  )) {
    return true;
  }

  // 5. Teachers, Parents, and Guests:
  // Strictly restricted to tickets they authored or are assigned to (checked above).
  return false;
}

/**
 * Filters tickets based on whether the user is authorized/related to view them.
 * Active tickets (pending, in_progress, purchasing, etc.) are strictly hidden
 * if the user is not related to them.
 */
export function filterVisibleTickets(tickets, currentUser, role, createdTicketIds = []) {
  if (!Array.isArray(tickets)) return [];

  // Directors see all tickets
  if (role === 'director' || role === 'admin') {
    return tickets;
  }

  return tickets.filter(ticket => {
    const isRelated = isUserRelatedToTicket(ticket, currentUser, role, createdTicketIds);
    if (isRelated) return true;

    // If not related, active tickets are strictly hidden!
    const isActive = ticket.status !== 'completed' && 
                     ticket.status !== 'delivered' && 
                     ticket.status !== 'cancelled' && 
                     ticket.status !== 'rejected';

    if (isActive) {
      return false;
    }

    // Unrelated guests/parents cannot see any tickets other than their own
    if (role === 'guest' || role === 'parent') {
      return false;
    }

    // For staff roles (e.g. teacher browsing), allow seeing completed tickets as historical archive
    return false;
  });
}
