import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../AppContext';
import {
  getApiBaseUrl,
  getCurrentApiServerUrl,
  setCustomApiServerUrl,
  checkDbHealth
} from '../api';

export default function ServerStatusModal({ isOpen, onClose }) {
  const { dbStatus, syncWithDb, t } = useApp();

  const [currentUrl, setCurrentUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [pingMs, setPingMs] = useState(null);
  const [testResult, setTestResult] = useState(null); // { success: boolean, msg: string, latency: number }
  const [copiedCmd, setCopiedCmd] = useState('');

  // Translations
  const trans = t?.serverStatus || {
    title: 'Server & SQLite Database Status',
    subtitle: "Verify database synchronization and connect to the school's server remotely",
    connected: 'Connected to School SQLite DB',
    offline: 'Offline Mode (Local Browser Storage)',
    syncing: 'Syncing with Database...',
    verifyNow: 'Verify Connection Now',
    verifying: 'Checking...',
    ping: 'Ping',
    ticketsInDb: 'Tickets in DB',
    inventoryInDb: 'Inventory Items',
    usersInDb: 'System Users',
    dbFilePath: 'Database File: server/data/platform.db',
    remoteSectionTitle: 'Connect to School Server Remotely',
    remoteSectionSubtitle: 'Connect from home, mobile, or GitHub Pages without being at school',
    serverUrlLabel: 'School Server Address / Tunnel URL',
    serverUrlPlaceholder: 'https://your-tunnel.trycloudflare.com or https://school-api.edu',
    useDefault: 'Use Localhost / Default',
    testBtn: 'Test Connection',
    saveBtn: 'Save & Connect',
    guideTitle: 'How to connect from outside the school:',
    guideStep1: '1. On the school server computer, run: npm run tunnel',
    guideStep2: '2. Copy the generated public HTTPS URL (e.g. https://xxx.trycloudflare.com)',
    guideStep3: '3. Paste that URL above in this window and click Save & Connect',
    guideStep4: "4. Your live app will instantly synchronize with the school's central SQLite database!"
  };

  useEffect(() => {
    if (isOpen) {
      const active = getCurrentApiServerUrl();
      setCurrentUrl(active);
      setCustomInput(active);
      setTestResult(null);
      handleVerify();
    }
  }, [isOpen]);

  const handleVerify = async () => {
    setIsVerifying(true);
    const start = performance.now();
    try {
      const data = await checkDbHealth();
      const elapsed = Math.round(performance.now() - start);
      setPingMs(elapsed);
      setHealthData(data);
      await syncWithDb();
    } catch {
      setPingMs(null);
      setHealthData(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestCustomUrl = async () => {
    if (!customInput.trim()) {
      setTestResult({
        success: false,
        msg: 'Please enter a valid URL (e.g., https://xxx.trycloudflare.com)'
      });
      return;
    }

    setIsTestingUrl(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await checkDbHealth(customInput);
      const elapsed = Math.round(performance.now() - start);
      setTestResult({
        success: true,
        latency: elapsed,
        msg: `Connected! Server responded in ${elapsed}ms (Tickets: ${res?.counts?.tickets ?? 0}, Users: ${res?.counts?.users ?? 0})`
      });
    } catch (err) {
      setTestResult({
        success: false,
        msg: err.message || 'Could not reach server. Verify that your tunnel/server is running.'
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleSaveUrl = async () => {
    const cleaned = customInput.trim();
    setCustomApiServerUrl(cleaned);
    setCurrentUrl(cleaned);
    setTestResult(null);
    setIsVerifying(true);
    try {
      await syncWithDb();
      await handleVerify();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetToDefault = async () => {
    setCustomApiServerUrl('');
    setCurrentUrl('');
    setCustomInput('');
    setTestResult(null);
    setIsVerifying(true);
    try {
      await syncWithDb();
      await handleVerify();
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(''), 2500);
  };

  if (!isOpen) return null;

  const isConnected = dbStatus === 'connected';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#242424',
          borderRadius: '6px',
          border: '1px solid #383838',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #383838',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#202020'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                background: isConnected ? 'rgba(16, 124, 65, 0.15)' : 'rgba(216, 59, 1, 0.15)',
                border: `1px solid ${isConnected ? '#107c41' : '#d83b01'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isConnected ? '#62c789' : '#ff8a75'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                {trans.title}
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                {trans.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Card 1: Live Status & SQLite Diagnostics */}
          <div
            style={{
              padding: '18px',
              borderRadius: '14px',
              background: isConnected ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isConnected ? '#10b981' : '#f59e0b',
                    boxShadow: isConnected ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
                    animation: isConnected ? 'pulse 2s infinite' : 'none'
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: '800', color: isConnected ? '#34d399' : '#fbbf24' }}>
                  {isConnected ? trans.connected : trans.offline}
                </span>
                {pingMs !== null && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#94a3b8'
                    }}
                  >
                    {trans.ping}: {pingMs}ms
                  </span>
                )}
              </div>

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: isVerifying ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <RefreshCw size={13} style={{ animation: isVerifying ? 'spin 1s linear infinite' : 'none' }} />
                {isVerifying ? trans.verifying : trans.verifyNow}
              </button>
            </div>

            {/* Current Active API Endpoint */}
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#94a3b8',
                wordBreak: 'break-all'
              }}
            >
              <Globe size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span>
                Active API Endpoint: <strong style={{ color: '#f1f5f9' }}>{getApiBaseUrl()}</strong>
              </span>
            </div>

            {/* Live Database Record Counters */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginTop: '14px'
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{trans.ticketsInDb}</div>
                <div style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '800', marginTop: '3px' }}>
                  {healthData?.counts?.tickets ?? (isConnected ? 'Active' : 'Cached')}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{trans.inventoryInDb}</div>
                <div style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '800', marginTop: '3px' }}>
                  {healthData?.counts?.inventory ?? (isConnected ? 'Active' : 'Cached')}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{trans.usersInDb}</div>
                <div style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '800', marginTop: '3px' }}>
                  {healthData?.counts?.users ?? (isConnected ? 'Active' : 'Cached')}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Remote School Server Connection Form */}
          <div
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Server size={18} style={{ color: '#38bdf8' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                {trans.remoteSectionTitle}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              {trans.remoteSectionSubtitle}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>
                {trans.serverUrlLabel}
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={trans.serverUrlPlaceholder}
                  style={{
                    flex: '1',
                    minWidth: '220px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                />

                <button
                  onClick={handleTestCustomUrl}
                  disabled={isTestingUrl || !customInput.trim()}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isTestingUrl || !customInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: !customInput.trim() ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isTestingUrl ? 'Testing...' : trans.testBtn}
                </button>

                <button
                  onClick={handleSaveUrl}
                  disabled={isVerifying}
                  className="fluent-btn-primary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: isVerifying ? 'wait' : 'pointer'
                  }}
                >
                  {trans.saveBtn}
                </button>
              </div>

              {currentUrl && (
                <div style={{ marginTop: '4px' }}>
                  <button
                    onClick={handleResetToDefault}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {trans.useDefault}
                  </button>
                </div>
              )}

              {/* Test Connection Output */}
              {testResult && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: testResult.success ? '#34d399' : '#f87171'
                  }}
                >
                  {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Interactive Guide & Quick Tunnel Commands */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.04)',
              border: '1px solid rgba(56, 189, 248, 0.18)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Terminal size={16} style={{ color: '#38bdf8' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                {trans.guideTitle}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#cbd5e1' }}>
              {/* Step 1: Tunnel Command */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.35)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <code>npm run tunnel</code>
                <button
                  onClick={() => copyToClipboard('npm run tunnel', 'tunnel')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedCmd === 'tunnel' ? '#34d399' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px'
                  }}
                >
                  {copiedCmd === 'tunnel' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedCmd === 'tunnel' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div>{trans.guideStep2}</div>
              <div>{trans.guideStep3}</div>
              <div style={{ color: '#34d399', fontWeight: '600' }}>{trans.guideStep4}</div>

              {/* Step 4: DB Viewer Command */}
              <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                  Inspect raw SQLite tables anytime in terminal:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.35)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                  <code>npm run db:view</code>
                  <button
                    onClick={() => copyToClipboard('npm run db:view', 'dbview')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedCmd === 'dbview' ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}
                  >
                    {copiedCmd === 'dbview' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedCmd === 'dbview' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
