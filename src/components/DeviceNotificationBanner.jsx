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

  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  const isUnsupported = devicePermission === 'unsupported';

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
    } else if (res === 'unsupported' || isIOS) {
      setTestResult({
        success: true,
        text: lang === 'ru'
          ? '🔊 Звук в приложении включен! На iPhone для пушей подключите Telegram или нажмите «Поделиться ⬆️ → На экран Домой».'
          : lang === 'kk'
          ? '🔊 Дыбыс қосылды! iPhone-да хабарлама алу үшін Telegram қосыңыз немесе «Бөлісу ⬆️ → Басты экранға» басыңыз.'
          : '🔊 In-app sound enabled! On iPhone/iPad, connect Telegram or tap Share ⬆️ → "Add to Home Screen" for push alerts.'
      });
      setTimeout(() => setTestResult(null), 7000);
    } else {
      setTestResult({
        success: false,
        text: lang === 'ru' ? '⚠️ Разрешите уведомления в настройках браузера или подключите Telegram' : '⚠️ Allow notifications in browser settings or connect Telegram'
      });
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const diag = await sendTestDeviceNotification();
      if (diag.delivered) {
        setTestResult({
          success: true,
          text: lang === 'ru' ? '✅ Тестовый алерт со звуком отправлен!' : '✅ Test alert with sound delivered!'
        });
      } else if (isIOS || !diag.supported) {
        setTestResult({
          success: true,
          text: lang === 'ru'
            ? '🔊 Звуковой сигнал воспроизведен! Для пуш-уведомлений на iPhone подключите Telegram.'
            : '🔊 Audio chime played! Connect Telegram for instant iPhone lock-screen push alerts.'
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
      setTimeout(() => setTestResult(null), 6000);
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
          background: 'var(--bg-card)',
          border: `1px solid ${devicePermission === 'denied' ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
          borderLeft: `4px solid ${devicePermission === 'denied' ? 'var(--danger)' : 'var(--primary)'}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-depth-2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: devicePermission === 'denied' ? 'rgba(239, 68, 68, 0.12)' : 'var(--primary-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: devicePermission === 'denied' ? 'var(--danger)' : 'var(--primary)',
              flexShrink: 0
            }}
          >
            {devicePermission === 'denied' ? <AlertTriangle size={18} /> : <Bell size={18} />}
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>
                {devicePermission === 'denied'
                  ? (lang === 'ru' ? 'Уведомления заблокированы браузером' : lang === 'kk' ? 'Хабарландырулар браузерде бұғатталған' : 'Device Notifications Blocked')
                  : isIOS && isUnsupported
                  ? (lang === 'ru' ? 'Уведомления на iPhone / iPad' : lang === 'kk' ? 'iPhone / iPad хабарландырулары' : 'iPhone / iPad Instant Alerts')
                  : (lang === 'ru' ? 'Включите уведомления прямо на это устройство' : lang === 'kk' ? 'Хабарландыруларды осы құрылғыға қосыңыз' : 'Enable Direct Device Push & Sound Alerts')}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: devicePermission === 'denied' ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-tint)',
                  color: devicePermission === 'denied' ? 'var(--danger)' : 'var(--primary)'
                }}
              >
                {devicePermission === 'denied' ? 'Settings Required' : (isIOS ? 'iOS & Telegram' : 'Instant Sound & Push')}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
              {devicePermission === 'denied'
                ? (lang === 'ru'
                    ? 'Нажмите на замочек возле строки адреса и разрешите «Уведомления», либо подключите Telegram.'
                    : lang === 'kk'
                    ? 'Мекенжай жолындағы құлып белгішесін басып, «Хабарландыруларға» рұқсат беріңіз немесе Telegram пайдаланыңыз.'
                    : 'Click the lock icon in your browser URL bar and allow Notifications, or connect Telegram.')
                : isIOS && isUnsupported
                ? (lang === 'ru'
                    ? 'Для мгновенных уведомлений на iPhone подключите Telegram или добавьте сайт на экран «Домой» (Поделиться ⬆️ → На экран «Домой»).'
                    : lang === 'kk'
                    ? 'iPhone-да жедел хабарламалар алу үшін Telegram қосыңыз немесе сайтты «Басты экранға» қосыңыз.'
                    : 'For instant alerts on iPhone/iPad, connect Telegram or tap Share ⬆️ → "Add to Home Screen".')
                : (lang === 'ru'
                    ? 'Мгновенно получайте звуковые оповещения и пуши на экран телефона или компьютера при новых заявках и изменениях статусов.'
                    : lang === 'kk'
                    ? 'Өтініштер мен күйлер өзгерген кезде дыбыстық сигналдар және телефонға пуш хабарландырулар алыңыз.'
                    : 'Receive real-time chime & popups directly on your phone or laptop whenever tickets are created or updated.')}
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: testResult.success ? 'var(--success)' : 'var(--danger)'
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
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bell size={13} />
              <span>
                {isIOS && isUnsupported
                  ? (lang === 'ru' ? 'Включить звук' : lang === 'kk' ? 'Дыбысты қосу' : 'Enable Sound')
                  : (lang === 'ru' ? 'Включить на этом устройстве' : lang === 'kk' ? 'Құрылғыда қосу' : 'Turn On on This Device')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Volume2 size={13} />
            <span>{testing ? 'Testing...' : (lang === 'ru' ? 'Проверить звук' : 'Test Sound')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTelegramOpen(true)}
            style={{
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1px solid rgba(2, 132, 199, 0.35)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: '700',
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
              color: 'var(--text-muted)',
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
