// Athenaeum API Client

const BASE_URL = '/api';
const TOKEN_KEY = 'athenaeum_session_token';

let onUnauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedHandler = fn;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    clearToken();
    if (onUnauthorizedHandler) {
      onUnauthorizedHandler();
    }
    const errorMsg = data.error || 'Session expired. Please log in.';
    throw new Error(errorMsg);
  }

  if (!response.ok || data.success === false) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', {
    method: 'POST'
  }),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),

  // User Management (Admin only)
  getUsers: () => request('/users'),
  createUser: (userData) => request('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  resetUserPassword: (userId, newPassword) => request(`/users/${encodeURIComponent(userId)}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword })
  }),
  deleteUser: (userId) => request(`/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  }),

  // Stats
  getStats: () => request('/stats'),

  // Books
  getBooks: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/books${searchParams ? `?${searchParams}` : ''}`);
  },
  getBook: (barcode) => request(`/books/${encodeURIComponent(barcode)}`),
  createBook: (bookData) => request('/books', {
    method: 'POST',
    body: JSON.stringify(bookData)
  }),
  updateBook: (barcode, bookData) => request(`/books/${encodeURIComponent(barcode)}`, {
    method: 'PUT',
    body: JSON.stringify(bookData)
  }),
  deleteBook: (barcode) => request(`/books/${encodeURIComponent(barcode)}`, {
    method: 'DELETE'
  }),

  // Borrowers
  getBorrowers: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/borrowers${searchParams ? `?${searchParams}` : ''}`);
  },
  getBorrower: (id) => request(`/borrowers/${encodeURIComponent(id)}`),
  createBorrower: (borrowerData) => request('/borrowers', {
    method: 'POST',
    body: JSON.stringify(borrowerData)
  }),
  updateBorrower: (id, borrowerData) => request(`/borrowers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(borrowerData)
  }),
  deleteBorrower: (id) => request(`/borrowers/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // Loans & Circulation
  getLoans: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/loans${searchParams ? `?${searchParams}` : ''}`);
  },
  calculateDueDate: (barcode) => request(`/loans/calculate-due-date?barcode=${encodeURIComponent(barcode)}`),
  createLoan: (loanData) => request('/loans', {
    method: 'POST',
    body: JSON.stringify(loanData)
  }),
  returnLoan: (loanId) => request(`/loans/${encodeURIComponent(loanId)}/return`, {
    method: 'POST'
  }),
  updateLoan: (loanId, loanData) => request(`/loans/${encodeURIComponent(loanId)}`, {
    method: 'PUT',
    body: JSON.stringify(loanData)
  }),
  renewLoan: (loanId) => request(`/loans/${encodeURIComponent(loanId)}/renew`, {
    method: 'POST'
  }),

  // Barcode / Scanner Universal Lookup
  lookupCode: (code) => request(`/lookup/${encodeURIComponent(code)}`),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settingsData) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData)
  }),

  // Database Schema & Tables
  getDbSchema: () => request('/db/schema'),
  getTableData: (tableName) => request(`/db/table/${encodeURIComponent(tableName)}`),

  // External ISBN lookup helper (Open Library API)
  lookupIsbnOnline: async (isbn) => {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (!cleanIsbn) throw new Error('Invalid ISBN');
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
    const data = await res.json();
    const bookKey = `ISBN:${cleanIsbn}`;
    if (!data[bookKey]) throw new Error('Book not found in Open Library database');

    const item = data[bookKey];
    return {
      title: item.title || '',
      author: item.authors ? item.authors.map(a => a.name).join(', ') : '',
      published_year: item.publish_date ? parseInt(item.publish_date.replace(/\D/g, '').slice(0, 4), 10) : null,
      cover_url: item.cover ? (item.cover.large || item.cover.medium || item.cover.small) : '',
      genre: item.subjects ? item.subjects.slice(0, 2).map(s => s.name).join(', ') : '',
      isbn: cleanIsbn
    };
  }
};
