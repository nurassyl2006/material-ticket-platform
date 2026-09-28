/**
 * Cloud Synchronization Service for Multi-Device Support
 * Uses resilient cloud endpoints with local fallback & LWW conflict resolution.
 */

const PRIMARY_API = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0e7d6c2543201';
const FALLBACK_API = 'https://mantledb.sh/v2/material-tickets-v1/data';

/**
 * Fetch all tickets currently stored in cloud storage.
 * Tries PRIMARY_API first, falls back to FALLBACK_API.
 */
export async function fetchCloudTickets() {
  // 1. Try Primary API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(PRIMARY_API, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.tickets)) {
        return json.data.tickets;
      }
    }
  } catch (err) {
    // Primary failed or timed out, try fallback
  }

  // 2. Try Fallback API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(FALLBACK_API, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.tickets)) {
        return json.tickets;
      }
    }
  } catch (err) {
    // Both endpoints unreachable
  }

  return null;
}

/**
 * Push latest tickets array to cloud storage.
 * Broadcasts to both endpoints asynchronously.
 */
export async function pushCloudTickets(tickets) {
  if (!Array.isArray(tickets)) return;

  const payloadData = {
    tickets,
    lastSync: Date.now()
  };

  // Push to primary
  const pushPrimary = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      await fetch(PRIMARY_API, {
        method: 'PUT',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'material_ticket_platform_nurassyl2006_store',
          data: payloadData
        })
      });
      clearTimeout(timeoutId);
    } catch (e) {
      // ignore
    }
  };

  // Mirror to fallback
  const pushFallback = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      await fetch(FALLBACK_API, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });
      clearTimeout(timeoutId);
    } catch (e) {
      // ignore
    }
  };

  await Promise.allSettled([pushPrimary(), pushFallback()]);
}

/**
 * Merge local tickets with remote tickets.
 * Conflict resolution: Last-Write-Wins (LWW) based on updatedAt / createdAt.
 */
export function mergeTickets(localList = [], remoteList = []) {
  const map = new Map();

  // 1. Load remote tickets
  for (const remote of remoteList) {
    if (remote && remote.id) {
      map.set(remote.id, remote);
    }
  }

  // 2. Merge local tickets
  for (const local of localList) {
    if (!local || !local.id) continue;
    const remote = map.get(local.id);
    if (!remote) {
      map.set(local.id, local);
    } else {
      const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
      const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
      if (localTime >= remoteTime) {
        map.set(local.id, local);
      }
    }
  }

  // Sort newest first
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}
