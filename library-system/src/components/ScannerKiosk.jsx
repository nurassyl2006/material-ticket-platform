import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, QrCode, BookOpen, User, CheckCircle2, 
  AlertTriangle, RotateCcw, ArrowRight, Clock, Sparkles,
  GraduationCap, Users
} from 'lucide-react';
import { api } from '../api';
import { playScanBeep, playAlertTone, playReturnChime } from '../utils/sound';
import { getLoanTimeStatus } from '../utils/dateUtils';

export default function ScannerKiosk({ onSelectBook, onSelectBorrower }) {
  const [inputCode, setInputCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Keep focus locked to scanner input in Kiosk mode
    const interval = setInterval(() => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'BUTTON') {
        inputRef.current?.focus();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleScanSubmit = async (e) => {
    if (e) e.preventDefault();
    const code = inputCode.trim();
    if (!code) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.lookupCode(code);
      setScanResult(res);
      playScanBeep();
      setInputCode('');

      // Add to session history
      setScanHistory(prev => [
        { code, type: res.type, title: res.data.title || res.data.name, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      playAlertTone();
      setErrorMsg(err.message || `No book or borrower found matching "${code}"`);
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnFromKiosk = async (loanId, bookTitle) => {
    try {
      await api.returnLoan(loanId);
      playReturnChime();

      // Refresh current scanned entity
      if (scanResult && scanResult.type === 'book') {
        const updated = await api.lookupCode(scanResult.data.barcode);
        setScanResult(updated);
      } else if (scanResult && scanResult.type === 'borrower') {
        const updated = await api.lookupCode(scanResult.data.id);
        setScanResult(updated);
      }
    } catch (err) {
      playAlertTone();
      alert(err.message || 'Return failed');
    }
  };

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      alignItems: 'center'
    }}>
      {/* Kiosk Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ScanLine size={28} style={{ color: 'var(--primary-500)' }} />
          Barcode Terminal & Kiosk
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Universal Scanner: Scan barcode, student ID card, or search student / book title
        </p>
      </div>

      {/* Big Scanner Target Area */}
      <div style={{
        width: '100%',
        maxWidth: '700px',
        background: 'var(--bg-secondary)',
        border: '2px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        boxShadow: 'var(--shadow-glow)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        position: 'relative'
      }}>
        {/* Animated Scanner Reticle */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid var(--primary-500)',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <QrCode size={40} style={{ color: '#c7d2fe' }} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleScanSubmit} style={{ width: '100%' }}>
          <div className="barcode-input-wrapper">
            <ScanLine size={20} className="scan-icon" />
            <input 
              ref={inputRef}
              type="text"
              className="barcode-input"
              style={{ fontSize: '1.05rem', padding: '0.95rem 1rem 0.95rem 3.25rem' }}
              placeholder="Scan barcode / ID or type name / book title (e.g. Tagir, Granny)..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              autoFocus
            />
            <button 
              type="submit" 
              className="barcode-submit-btn"
              style={{ fontSize: '0.9rem', padding: '0 18px' }}
            >
              Scan
            </button>
          </div>
        </form>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>⌨️ Press <strong style={{ color: '#a5b4fc' }}>Enter</strong> to submit</span>
          <span>•</span>
          <span>⚡ Hardware scanner reader auto-trigger</span>
          <span>•</span>
          <span>🔍 Supports name & title search</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div style={{
          padding: '12px 18px',
          background: 'var(--rose-bg)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '8px',
          color: '#fda4af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scan Result Card */}
      {scanResult && (
        <div style={{
          width: '100%',
          maxWidth: '700px',
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--primary-500)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'scaleUp 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {scanResult.type === 'book' ? (
                <BookOpen size={20} style={{ color: 'var(--primary-500)' }} />
              ) : (
                <User size={20} style={{ color: 'var(--sky-500)' }} />
              )}
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                {scanResult.type === 'book' ? 'Book Record Found' : 'Borrower Patron Found'}
              </span>
            </div>
            <span className="code-pill">{scanResult.data.barcode || scanResult.data.id}</span>
          </div>

          {/* Book Content */}
          {scanResult.type === 'book' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{scanResult.data.title}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
                by {scanResult.data.author} • {scanResult.data.genre || 'General'} • Shelf: {scanResult.data.shelf_location || 'Main Floor'}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className={`type-pill type-${scanResult.data.book_type?.toLowerCase()}`}>
                  {scanResult.data.book_type} ({scanResult.data.defaultLoanDays || 14} days loan)
                </span>
                <span className="badge" style={{
                  background: scanResult.data.available_copies > 0 ? 'var(--emerald-bg)' : 'var(--rose-bg)',
                  color: scanResult.data.available_copies > 0 ? 'var(--emerald-500)' : 'var(--rose-500)'
                }}>
                  {scanResult.data.available_copies} of {scanResult.data.total_copies} available
                </span>
                {scanResult.data.isbn && (
                  <span className="code-pill">ISBN: {scanResult.data.isbn}</span>
                )}
              </div>

              {/* List of Who Has Borrowed this Book */}
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} style={{ color: 'var(--primary-500)' }} />
                  <span>Currently Borrowed By ({scanResult.data.activeLoans?.length || 0}):</span>
                </div>

                {(!scanResult.data.activeLoans || scanResult.data.activeLoans.length === 0) ? (
                  <div style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--emerald-500)', fontSize: '0.82rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px' }}>
                    ✓ All {scanResult.data.total_copies} copies currently available on the shelf.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {scanResult.data.activeLoans.map((loan) => {
                      const isOverdue = loan.status === 'overdue';
                      const timeStatus = getLoanTimeStatus(loan.due_date);
                      return (
                        <div key={loan.id} className={`active-copy-card ${isOverdue ? 'overdue' : ''}`}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loan.borrowerName}</span>
                              {loan.borrowerClass && (
                                <span className="borrower-class-tag" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                                  <GraduationCap size={11} />
                                  {loan.borrowerClass}
                                </span>
                              )}
                              <span className="code-pill" style={{ fontSize: '0.68rem' }}>{loan.borrower_id || loan.borrowerId}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                              <span>Due: <strong style={{ color: isOverdue ? 'var(--rose-500)' : 'var(--text-secondary)' }}>{loan.due_date}</strong></span>
                              <span>•</span>
                              <span className={`badge ${timeStatus.badgeClass}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                {timeStatus.label}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="table-btn primary"
                            onClick={() => handleReturnFromKiosk(loan.id, scanResult.data.title)}
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            <RotateCcw size={11} />
                            Return Copy
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button 
                  className="primary-button"
                  onClick={() => onSelectBook && onSelectBook(scanResult.data)}
                >
                  <span>Open in Fast Desk</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Borrower Content */}
          {scanResult.type === 'borrower' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{scanResult.data.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span className="code-pill">{scanResult.data.id}</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{scanResult.data.role}</span>
                {scanResult.data.class && (
                  <span className="borrower-class-tag">
                    <GraduationCap size={13} style={{ color: '#818cf8' }} />
                    <span>Class: {scanResult.data.class}</span>
                  </span>
                )}
                {scanResult.data.email && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{scanResult.data.email}</span>
                  </>
                )}
              </div>

              {/* Overdue alert if applicable */}
              {(scanResult.data.overdueLoansCount > 0 || scanResult.data.loans?.some(l => l.status === 'overdue')) && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--rose-bg)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#fda4af',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}>
                  <AlertTriangle size={16} />
                  <span>
                    ⚠️ Overdue Alert: Patron has {scanResult.data.overdueLoansCount || scanResult.data.loans?.filter(l => l.status === 'overdue').length || 1} book(s) overdue!
                  </span>
                </div>
              )}

              {/* All Borrowed Books */}
              {scanResult.data.activeLoans && scanResult.data.activeLoans.length > 0 ? (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Currently Borrowed Books ({scanResult.data.activeLoans.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {scanResult.data.activeLoans.map((l) => {
                      const timeStatus = getLoanTimeStatus(l.due_date);
                      const isOverdue = l.status === 'overdue';
                      return (
                        <div key={l.id} style={{
                          background: isOverdue ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-tertiary)',
                          border: isOverdue ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          gap: '8px'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong>{l.bookTitle}</strong>
                              {l.bookType && (
                                <span className={`type-pill type-${l.bookType.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                                  {l.bookType}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px' }}>
                              <span>Barcode: <strong style={{ color: '#c7d2fe' }}>{l.book_barcode || l.bookBarcode}</strong></span>
                              <span>•</span>
                              <span>Due: <strong style={{ color: isOverdue ? 'var(--rose-500)' : 'var(--text-secondary)' }}>{l.due_date}</strong></span>
                              <span>•</span>
                              <span className={`badge ${timeStatus.badgeClass}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                {timeStatus.label}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="table-btn primary"
                            onClick={() => handleReturnFromKiosk(l.id, l.bookTitle)}
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            <RotateCcw size={12} />
                            Return
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Patron currently has 0 active loans.
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <button 
                  className="primary-button"
                  onClick={() => onSelectBorrower && onSelectBorrower(scanResult.data)}
                >
                  <span>Open in Fast Desk</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Scan History */}
      {scanHistory.length > 0 && (
        <div style={{ width: '100%', maxWidth: '700px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Recent Terminal Scans
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {scanHistory.map((h, i) => (
              <div key={i} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="code-pill">{h.code}</span>
                  <span style={{ fontWeight: 600 }}>{h.title}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {h.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
