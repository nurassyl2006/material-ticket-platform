/**
 * API client for EduOps Backend & Database
 * Provides seamless CRUD for Tickets, Goods Inventory, Users, and Notifications.
 */

// Dynamic API Base URL resolver: checks user-configured custom server URL, VITE_API_URL, or defaults to '/api'
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('app_custom_api_url');
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
      return `${clean}/api`;
    }
  }
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${clean}/api`;
  }
  return '/api';
}

export function getCurrentApiServerUrl() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('app_custom_api_url') || import.meta.env.VITE_API_URL || '';
}

export function setCustomApiServerUrl(url) {
  if (typeof window === 'undefined') return;
  const cleaned = (url || '').trim();
  if (!cleaned) {
    localStorage.removeItem('app_custom_api_url');
  } else {
    const normalized = cleaned.replace(/\/api\/?$/, '').replace(/\/$/, '');
    localStorage.setItem('app_custom_api_url', normalized);
  }
}

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const apiBase = getApiBaseUrl();
  const url = `${apiBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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

    // If a custom external URL failed, but app is on a server serving /api, automatically fallback
    if (apiBase !== '/api' && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      try {
        const localUrl = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const localRes = await fetch(localUrl, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...options.headers
          }
        });
        if (localRes.ok) {
          console.warn(`[EduOps] Remote URL ${apiBase} failed, fell back to local /api`);
          return await localRes.json();
        }
      } catch (fallbackErr) {
        // continue throwing original error
      }
    }

    throw err;
  }
}

// -------------------------------------------------------------
// Health / DB Status
// -------------------------------------------------------------
export async function checkDbHealth(customServerUrl = null) {
  if (customServerUrl && typeof customServerUrl === 'string' && customServerUrl.trim()) {
    const clean = customServerUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
    const targetUrl = `${clean}/api/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
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

export async function markTicketReturnedByTeacherInDb(id, notes = '') {
  return request(`/tickets/${id}/return-by-teacher`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  });
}

export async function confirmTicketReturnInDb(id, { confirmedBy, notes } = {}) {
  return request(`/tickets/${id}/confirm-return`, {
    method: 'POST',
    body: JSON.stringify({ confirmedBy, notes })
  });
}

// -------------------------------------------------------------
// Storage List of Goods (Inventory) API
// -------------------------------------------------------------
export async function fetchInventoryFromDb(category) {
  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/inventory${query}`);
}

export async function fetchInventoryCategoriesFromDb() {
  return request('/inventory/categories');
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

export async function addPhotoToInventoryItemInDb(id, photos) {
  return request(`/inventory/${id}/photos`, {
    method: 'POST',
    body: JSON.stringify({ photos })
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

// -------------------------------------------------------------
// Telegram Push Alerts API
// -------------------------------------------------------------
export async function getTelegramConfigApi() {
  return request('/notifications/telegram');
}

export async function saveTelegramConfigApi(config) {
  return request('/notifications/telegram', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

export async function sendTelegramTestApi() {
  return request('/notifications/telegram/test', {
    method: 'POST'
  });
}

// -------------------------------------------------------------
// Roles & Storage Categories Matrix API (Director Controls)
// -------------------------------------------------------------
export async function fetchRolesApi() {
  return request('/roles');
}

export async function saveRolesApi(roles) {
  return request('/roles', {
    method: 'POST',
    body: JSON.stringify({ roles })
  });
}

export async function fetchCategoriesApi() {
  return request('/categories');
}

export async function saveCategoriesApi(categories) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify({ categories })
  });
}

