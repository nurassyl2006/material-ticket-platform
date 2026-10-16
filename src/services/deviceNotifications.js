/**
 * Device Notification Suite
 * Powers Native OS Push Notifications, Device Vibration, and Web Audio Chimes
 * for EduOps School & Campus Operations across Desktop (Chrome, Edge, Safari, Firefox)
 * and Mobile Devices (Android Chrome, iOS PWA / WebPush).
 */

let sharedAudioCtx = null;

// User gesture unlocker for Web Audio API (ensures audio plays smoothly even on locked-down mobile browsers)
export function unlockAudioContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContext();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch (e) {
    // restricted until gesture
  }
}

// Auto-bind unlock listener on first user interaction with the window
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('pointerdown', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };
  window.addEventListener('pointerdown', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('keydown', handleInteraction, { passive: true });
}

// Web Audio synthesizer for pleasant alert chimes (zero dependencies, 0ms latency)
export function playNotificationSound() {
  const isMuted = localStorage.getItem('app_notification_sound_muted') === 'true';
  if (isMuted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContext();
    }
    const ctx = sharedAudioCtx;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic 2-tone melodic chime: Note 1 (D5 ~587Hz) -> Note 2 (A5 ~880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (e) {
    // Audio context may be restricted before initial user gesture
  }
}

// Device vibration for mobile phones (Android / Chrome)
export function vibrateDevice(pattern = [300, 150, 300, 150, 300]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

// Check if browser supports notifications
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status: 'granted' | 'denied' | 'default' | 'unsupported'
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Helper: Ensure service worker registration is active & ready
export async function ensureServiceWorkerReady() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    // Wait for ready registration with a 2-second timeout
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 2000));
    let reg = await Promise.race([readyPromise, timeoutPromise]);
    if (reg) return reg;

    reg = await navigator.serviceWorker.getRegistration();
    if (reg) return reg;

    reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.warn('[EduOps] Service Worker readiness check warning:', err);
    return null;
  }
}

// Request permission from the user's browser / OS
export async function requestDeviceNotificationPermission() {
  unlockAudioContext();
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('app_notification_permission', permission);

    // Warm up service worker registration when permission is granted
    if (permission === 'granted') {
      ensureServiceWorkerReady().catch(() => {});
    }

    return permission;
  } catch (e) {
    return 'denied';
  }
}

// Trigger a native notification directly on the device
export async function sendDeviceNotification({ title, message, ticketId, tag }) {
  // 1. Play audio chime on device speakers
  playNotificationSound();

  // 2. Vibrate mobile device (triple pulse)
  vibrateDevice([300, 150, 300, 150, 300]);

  // 3. Dispatch an in-app event so on-screen toast popup shows immediately
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('eduops-device-alert', {
        detail: { title, message, ticketId, tag, timestamp: Date.now() }
      }));
    } catch (e) {}
  }

  // 4. Try native OS notification if supported and granted
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const notifTag = tag || ticketId || `eduops-${Date.now()}`;
  const notifOptions = {
    body: message || 'New operational update in EduOps Platform',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: notifTag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [300, 150, 300],
    data: {
      ticketId,
      url: typeof window !== 'undefined' ? window.location.origin : '/'
    }
  };

  let displayed = false;

  // Approach A: Service Worker showNotification
  // REQUIRED for mobile Android Chrome (where `new Notification()` throws Illegal Constructor error)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await ensureServiceWorkerReady();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        displayed = true;
      }
    } catch (swErr) {
      console.warn('[EduOps] SW showNotification error:', swErr);
    }

    // Also bridge via postMessage to service worker controller if available
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: notifOptions
        });
        displayed = true;
      }
    } catch (msgErr) {}
  }

  // Approach B: Standard Web Notification fallback (desktop Chrome / Firefox / Safari macOS)
  if (!displayed && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const notification = new Notification(title, notifOptions);
      notification.onclick = function () {
        window.focus();
        if (ticketId && typeof window.__onSelectTicketGlobal === 'function') {
          window.__onSelectTicketGlobal(ticketId);
        }
        this.close();
      };
      displayed = true;
    } catch (constructorErr) {
      // Android Chrome throws: Failed to construct 'Notification': Illegal constructor.
      // Handled via Service Worker above.
    }
  }

  return displayed;
}

// Complete diagnostic & test alert runner for the user's current device
export async function sendTestDeviceNotification() {
  unlockAudioContext();
  const supported = isNotificationSupported();
  const permission = getNotificationPermission();
  const isSecure = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;

  const delivered = await sendDeviceNotification({
    title: '🔔 EduOps Test Alert',
    message: 'Sound, vibration and device alerts are working directly on this device!',
    tag: `test-alert-${Date.now()}`
  });

  return {
    supported,
    permission,
    isSecure,
    delivered
  };
}
