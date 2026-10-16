import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Bell, Smartphone, Send, X, CheckCircle2, AlertTriangle, Volume2 } from 'lucide-react';
import { TelegramNotificationModal } from './TelegramNotificationModal';

export const DeviceNotificationBanner = () => {
  const {
    lang,
    devicePermission,
    enableDeviceNotifications,
    sendTestDeviceNotification
  } = useApp();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('app_notif_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('app_notif_banner_dismissed', 'true');
    } catch {}
  };

  const handleEnable = async () => {
    const res = await enableDeviceNotifications();
    if (res === 'granted') {
      setTestResult({
        success: true,
        text: lang === 'ru' ? '✅ Уведомления активированы на этом устройстве!' : lang === 'kk' ? '✅ Хабарландырулар осы құрылғыда қосылды!' : '✅ Device alerts activated on this device!'
      });
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const diag = await sendTestDeviceNotification();
      if (diag.delivered) {
        setTestResult({
          success: true,
          text: lang === 'ru' ? '✅ Тестовый алерт со звуком и вибрацией отправлен!' : '✅ Test alert with sound & vibration delivered!'
        });
      } else {
        setTestResult({
          success: false,
          text: lang === 'ru' ? '⚠️ Разрешите уведомления в браузере или подключите Telegram' : '⚠️ Please allow browser permissions or connect Telegram'
        });
      }
    } catch {
      setTestResult({ success: false, text: 'Test alert failed' });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  // If dismissed or if permission is already granted and no active test result, don't occupy screen space
  if (dismissed && !testResult) return null;
  if (devicePermission === 'granted' && !testResult) return null;

  return (
    <>
      <div
        className="fluent-card animate-fade-in"
        style={{
          maxWidth: '1360px',
          margin: '-4px auto 14px',
          padding: '12px 18px',
          background: devicePermission === 'denied'
            ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
            : 'linear-gradient(90deg, rgba(99, 102, 241, 0.16) 0%, rgba(56, 189, 248, 0.12) 100%)',
          border: `1px solid ${devicePermission === 'denied' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: devicePermission === 'denied' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: devicePermission === 'denied' ? '#f87171' : '#818cf8',
              flexShrink: 0
            }}
          >
            {devicePermission === 'denied' ? <AlertTriangle size={18} /> : <Bell size={18} />}
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {devicePermission === 'denied'
                  ? (lang === 'ru' ? 'Уведомления заблокированы браузером' : lang === 'kk' ? 'Хабарландырулар браузерде бұғатталған' : 'Device Notifications Blocked')
                  : (lang === 'ru' ? 'Включите уведомления прямо на это устройство' : lang === 'kk' ? 'Хабарландыруларды осы құрылғыға қосыңыз' : 'Enable Direct Device Push & Sound Alerts')}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: devicePermission === 'denied' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                  color: devicePermission === 'denied' ? '#fca5a5' : '#38bdf8'
                }}
              >
                {devicePermission === 'denied' ? 'Settings Required' : 'Instant Sound & Push'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
              {devicePermission === 'denied'
                ? (lang === 'ru'
                    ? 'Нажмите на замочек или иконку настроек возле строки адреса и разрешите «Уведомления», либо используйте Telegram.'
                    : lang === 'kk'
                    ? 'Мекенжай жолындағы құлып белгішесін басып, «Хабарландыруларға» рұқсат беріңіз немесе Telegram пайдаланыңыз.'
                    : 'Click the tune/lock icon in your browser URL bar and allow Notifications, or connect Telegram.')
                : (lang === 'ru'
                    ? 'Мгновенно получайте звуковые оповещения, вибрацию и пуши на экран телефона или компьютера при новых заявках и изменениях статусов.'
                    : lang === 'kk'
                    ? 'Өтініштер мен күйлер өзгерген кезде дыбыстық сигналдар, діріл және телефонға пуш хабарландырулар алыңыз.'
                    : 'Receive real-time chime, vibration & popups directly on your phone or laptop whenever tickets are created or updated.')}
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: testResult.success ? '#34d399' : '#f87171'
                }}
              >
                {testResult.text}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {devicePermission !== 'denied' && (
            <button
              type="button"
              onClick={handleEnable}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
              }}
            >
              <Bell size={13} />
              <span>{lang === 'ru' ? 'Включить на этом устройстве' : lang === 'kk' ? 'Құрылғыда қосу' : 'Turn On on This Device'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: '#e2e8f0',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Volume2 size={13} />
            <span>{testing ? 'Testing...' : (lang === 'ru' ? 'Проверить звук/пуш' : 'Test Device Alert')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTelegramOpen(true)}
            style={{
              background: 'rgba(2, 132, 199, 0.18)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={13} />
            <span>{lang === 'ru' ? 'Пуши на телефон (Telegram)' : 'Phone Alerts (Telegram)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            title={lang === 'ru' ? 'Скрыть баннер' : 'Dismiss'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <TelegramNotificationModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        lang={lang}
      />
    </>
  );
};
