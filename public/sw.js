// EduOps Service Worker for Device Push Notifications & Background Alerts
// Supports Android Chrome, Desktop Chrome, Edge, Firefox, and macOS Safari PWA

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for direct notification requests from client windows
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(
        title || 'EduOps Notification',
        options || {}
      )
    );
  }
});

// Listen for background Web Push events
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {
      title: 'EduOps Alert',
      message: event.data ? event.data.text() : 'You have a new school operational update.'
    };
  }

  const title = payload.title || 'EduOps Notification';
  const options = {
    body: payload.message || payload.body || 'New operational update in EduOps Platform',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || payload.ticketId || `eduops-push-${Date.now()}`,
    renotify: true,
    vibrate: [300, 150, 300],
    data: {
      ticketId: payload.ticketId,
      url: payload.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle user clicking on a native device notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const ticketId = event.notification.data?.ticketId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and open the ticket
      for (const client of clientList) {
        if ('focus' in client) {
          if (ticketId) {
            client.postMessage({ type: 'SELECT_TICKET', ticketId });
          }
          return client.focus();
        }
      }
      // If no tab is open, open a new window to the platform
      if (self.clients.openWindow) {
        return self.clients.openWindow(ticketId ? `${targetUrl}#tickets` : targetUrl);
      }
    })
  );
});
