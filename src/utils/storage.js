/**
 * Safe localStorage wrapper that handles QuotaExceededError and prevents crashes.
 */

// Cleanup old/obsolete localStorage keys to prevent hitting browser quotas (5MB limit)
export function cleanupObsoleteStorage() {
  try {
    if (typeof localStorage === 'undefined') return;
    const obsoletePrefixes = [
      'app_tickets_v1',
      'app_tickets_v2',
      'app_notifications_v1',
      'app_notifications_v2',
      'app_inventory_v1',
      'app_inventory_v2',
      'app_tickets',
      'app_notifications',
      'app_inventory',
      'eduops_translation_cache'
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && obsoletePrefixes.some(prefix => key === prefix || key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }

    // Check total size of localStorage. If > 2MB, purge heavy cached collections
    let totalLen = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        totalLen += (localStorage.getItem(k) || '').length;
      }
    }
    // If usage > 2MB (2,000,000 chars), clear bulky caches to stay safe
    if (totalLen > 2000000) {
      localStorage.removeItem('app_tickets_v3');
      localStorage.removeItem('app_notifications_v3');
      localStorage.removeItem('app_inventory_v3');
      localStorage.removeItem('eduops_translation_cache_v1');
    }
  } catch (err) {
    console.warn('[Storage] Cleanup error:', err);
  }
}

// Strip heavy base64 photo payloads before caching tickets in localStorage
export function sanitizeTicketsForStorage(tickets) {
  if (!Array.isArray(tickets)) return [];
  // Keep only the 20 most recent tickets and strip photos completely
  return tickets.slice(0, 20).map(t => {
    if (!t) return t;
    const { photos, completionPhotos, ...rest } = t;
    return {
      ...rest,
      photos: [],
      completionPhotos: []
    };
  });
}

export function safeGetItem(key, fallback = null) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (err) {
    console.warn(`[Storage] Failed to read "${key}":`, err);
    return fallback;
  }
}

export function safeSetItem(key, val) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const serialized = typeof val === 'string' ? val : JSON.stringify(val);
    // Don't store oversized blobs in localStorage (which has a 5MB limit)
    if (serialized.length > 500000 && (key === 'app_tickets_v3' || key === 'app_notifications_v3')) {
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    // If quota exceeded, perform aggressive recovery
    if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
      try {
        cleanupObsoleteStorage();
        // Remove large caches
        localStorage.removeItem('app_tickets_v3');
        localStorage.removeItem('app_notifications_v3');
        localStorage.removeItem('app_inventory_v3');
        localStorage.removeItem('eduops_translation_cache_v1');

        // Retry saving non-bulky essential keys (auth, token, role, theme)
        if (!key.includes('tickets') && !key.includes('notifications') && !key.includes('inventory')) {
          const serialized = typeof val === 'string' ? val : JSON.stringify(val);
          localStorage.setItem(key, serialized);
          return true;
        }
      } catch (recoveryErr) {
        console.warn('[Storage] Recovery failed:', recoveryErr);
      }
    }
    return false;
  }
}

export function safeRemoveItem(key) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] Failed to remove "${key}":`, err);
  }
}
