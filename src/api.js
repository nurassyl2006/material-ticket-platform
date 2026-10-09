/**
 * API client for EduOps Backend & Database
 * Provides seamless CRUD for Tickets, Goods Inventory, Users, and Notifications.
 */

// API Base URL: supports configurable VITE_API_URL or defaults to Vite /api proxy
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Accept': 'application/json'
  };

  const token = localStorage.getItem('app_auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      let parsedMsg = `Request failed with status ${res.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        parsedMsg = errorJson.error || errorJson.message || parsedMsg;
      } catch (e) {
        // use default error message
      }
      throw new Error(parsedMsg);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// -------------------------------------------------------------
// Health / DB Status
// -------------------------------------------------------------
export async function checkDbHealth() {
  return request('/health');
}

// -------------------------------------------------------------
// Tickets API
// -------------------------------------------------------------
export async function fetchTicketsFromDb() {
  return request('/tickets');
}

export async function fetchTicketById(id) {
  return request(`/tickets/${id}`);
}

export async function createTicketInDb(ticketData) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  });
}

export async function updateTicketInDb(id, updates) {
  return request(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function deleteTicketFromDb(id) {
  return request(`/tickets/${id}`, {
    method: 'DELETE'
  });
}

export async function bulkSyncTicketsToDb(tickets) {
  return request('/tickets/bulk', {
    method: 'POST',
    body: JSON.stringify(tickets)
  });
}

// -------------------------------------------------------------
// Storage List of Goods (Inventory) API
// -------------------------------------------------------------
export async function fetchInventoryFromDb() {
  return request('/inventory');
}

export async function createInventoryItemInDb(itemData) {
  return request('/inventory', {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
}

export async function updateInventoryItemInDb(id, updates) {
  return request(`/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function updateInventoryQtyInDb(id, { quantity, delta }) {
  return request(`/inventory/${id}/quantity`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity, delta })
  });
}

export async function deleteInventoryItemFromDb(id) {
  return request(`/inventory/${id}`, {
    method: 'DELETE'
  });
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// Users API
// -------------------------------------------------------------
export async function fetchUsersFromDb() {
  return request('/users');
}

export async function fetchUserByRole(roleKey) {
  return request(`/users/${roleKey}`);
}

export async function updateUserProfileInDb(id, updates) {
  return request(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function createUserInDb(userData) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function updateUserRoleInDb(id, role) {
  return request(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export async function resetUserPasswordInDb(id, newPassword) {
  return request(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
}

export async function deleteUserFromDb(id) {
  return request(`/users/${id}`, {
    method: 'DELETE'
  });
}

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
export async function fetchNotificationsFromDb() {
  return request('/notifications');
}

export async function createNotificationInDb(notifData) {
  return request('/notifications', {
    method: 'POST',
    body: JSON.stringify(notifData)
  });
}

export async function markNotificationReadInDb(id) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH'
  });
}

export async function markAllNotificationsReadInDb() {
  return request('/notifications/read-all', {
    method: 'POST'
  });
}

export async function clearNotificationsInDb() {
  return request('/notifications', {
    method: 'DELETE'
  });
}

// -------------------------------------------------------------
// Database Reset
// -------------------------------------------------------------
export async function resetDatabaseInDb() {
  return request('/reset', {
    method: 'POST'
  });
}

// -------------------------------------------------------------
// Authentication & Password Management API
// -------------------------------------------------------------
export async function loginUserApi(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function registerUserApi(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function fetchAuthMeApi() {
  return request('/auth/me');
}

export async function changePasswordApi(data) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function logoutUserApi() {
  return request('/auth/logout', {
    method: 'POST'
  });
}

export async function fetchDemoCredentialsApi() {
  return request('/auth/demo-credentials');
}


