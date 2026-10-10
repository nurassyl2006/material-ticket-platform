/**
 * Device Notification Suite
 * Powers Native OS Push Notifications, Device Vibration, and Web Audio Chimes
 * for EduOps School & Campus Operations.
 */

// Web Audio synthesizer for pleasant alert chimes (zero dependencies, 0ms latency)
export function playNotificationSound() {
  const isMuted = localStorage.getItem('app_notification_sound_muted') === 'true';
  if (isMuted) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic 2-tone melodic chime: Note 1 (D5 ~587Hz) -> Note 2 (A5 ~880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio context may be restricted before initial user gesture
  }
}

// Device vibration for mobile phones (Android / Chrome)
export function vibrateDevice(pattern = [200, 100, 200]) {
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

// Request permission from the user's browser / OS
export async function requestDeviceNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('app_notification_permission', permission);
    return permission;
  } catch (e) {
    return 'denied';
  }
}

// Trigger a native notification directly on the device
export async function sendDeviceNotification({ title, message, ticketId, tag }) {
  // 1. Play audio chime on device speakers
  playNotificationSound();

  // 2. Vibrate mobile device
  vibrateDevice([200, 100, 200]);

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
    body: message || 'New update in EduOps Platform',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: notifTag,
    renotify: true,
    data: { ticketId, url: window.location.origin }
  };

  // Try via Service Worker first if available
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (e) {
      // fallback to standard Notification
    }
  }

  // Standard Web Notification fallback
  try {
    const notification = new Notification(title, notifOptions);
    notification.onclick = function () {
      window.focus();
      if (ticketId && typeof window.__onSelectTicketGlobal === 'function') {
        window.__onSelectTicketGlobal(ticketId);
      }
      this.close();
    };
    return true;
  } catch (e) {
    return false;
  }
}

