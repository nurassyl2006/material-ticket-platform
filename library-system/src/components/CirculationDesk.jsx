import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, ScanLine, User, BookOpen, Calendar, Check, AlertCircle, 
  RotateCcw, Printer, ArrowRight, Clock, Plus, Tag, Layers, CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import { 
  getTodayFormatted, addDaysToDate, formatDatePretty, 
  calculateDueDateForBookType, getLoanTimeStatus 
} from '../utils/dateUtils';
import { playScanBeep, playCheckoutChime, playReturnChime, playAlertTone } from '../utils/sound';

export default function CirculationDesk({ 
  preselectedBook,
  preselectedBorrower,
  onClearPreselected,
  onRefreshStats,
  onOpenReceiptModal
}) {
  // Inputs
  const [borrowerCode, setBorrowerCode] = useState('');
  const [bookCode, setBookCode] = useState('');
  const [quickReturnCode, setQuickReturnCode] = useState('');

  // Selected Entities
  const [selectedBorrower, setSelectedBorrower] = useState(preselectedBorrower || null);
  const [selectedBook, setSelectedBook] = useState(preselectedBook || null);

  useEffect(() => {
    if (preselectedBook) setSelectedBook(preselectedBook);
  }, [preselectedBook]);

  useEffect(() => {
    if (preselectedBorrower) setSelectedBorrower(preselectedBorrower);
  }, [preselectedBorrower]);

  // Due Date & Loan Options
  const [calculatedDueDate, setCalculatedDueDate] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [loanDurationDays, setLoanDurationDays] = useState(14);
  const [activePreset, setActivePreset] = useState('auto');
  const [loanNotes, setLoanNotes] = useState('');
  const [borrowerLoanFilter, setBorrowerLoanFilter] = useState('all'); // 'all', 'overdue', 'active', 'returned'
  const [editingBorrowerLoan, setEditingBorrowerLoan] = useState(null);
  const [newBorrowerDueDate, setNewBorrowerDueDate] = useState('');

  // Loading & Messages
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Input refs for automatic focus & keyboard shortcuts
  const borrowerInputRef = useRef(null);
  const bookInputRef = useRef(null);
  const returnInputRef = useRef(null);

  // Focus borrower input on initial load
  useEffect(() => {
    borrowerInputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener: F1 focuses Circulation desk, Enter submits
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        borrowerInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        returnInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When selectedBook changes, recalculate due date based on book_type
  useEffect(() => {
    if (selectedBook) {
      const calc = calculateDueDateForBookType(selectedBook.book_type);
      setLoanDurationDays(calc.days);
      setCalculatedDueDate(calc.dueDate);
      setCustomDueDate(calc.dueDate);
      setActivePreset('auto');
    } else {
      setCalculatedDueDate('');
      setCustomDueDate('');
    }
  }, [selectedBook]);

  // Handle Borrower Barcode Scan or Enter
  const handleBorrowerScan = async (e) => {
    if (e) e.preventDefault();
    const code = borrowerCode.trim();
    if (!code) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.lookupCode(code);
      if (res.type === 'borrower') {
        setSelectedBorrower(res.data);
        setBorrowerCode('');
        playScanBeep();
        // Immediately shift focus to book barcode input for seamless scanning!
        setTimeout(() => bookInputRef.current?.focus(), 80);
      } else {
        playAlertTone();
        setStatusMessage({ type: 'error', text: `"${code}" is a book barcode, not a borrower card. Please scan borrower card here.` });
      }
    } catch (err) {
      playAlertTone();
      setStatusMessage({ type: 'error', text: err.message || 'Borrower not found' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Book Barcode Scan or Enter
  const handleBookScan = async (e) => {
    if (e) e.preventDefault();
    const code = bookCode.trim();
    if (!code) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.lookupCode(code);
      if (res.type === 'book') {
        setSelectedBook(res.data);
        setBookCode('');
        playScanBeep();
      } else {
        playAlertTone();
        setStatusMessage({ type: 'error', text: `"${code}" is a borrower ID, not a book barcode.` });
      }
    } catch (err) {
      playAlertTone();
      setStatusMessage({ type: 'error', text: err.message || 'Book not found' });
    } finally {
      setLoading(false);
    }
  };

  // Preset Date adjustment for Librarian
  const applyPresetDays = (days, label) => {
    const newDueDate = addDaysToDate(new Date(), days);
    setLoanDurationDays(days);
    setCustomDueDate(newDueDate);
    setActivePreset(label);
  };

  // Issue Loan Transaction
  const handleIssueLoan = async () => {
    if (!selectedBorrower || !selectedBook) return;

    if (selectedBook.available_copies <= 0) {
      playAlertTone();
      setStatusMessage({ type: 'error', text: `Cannot issue "${selectedBook.title}". All copies are currently checked out.` });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        book_barcode: selectedBook.barcode,
        borrower_id: selectedBorrower.id,
        due_date: customDueDate || calculatedDueDate,
        notes: loanNotes
      };

      const res = await api.createLoan(payload);
      playCheckoutChime();

      setStatusMessage({ 
        type: 'success', 
        text: `Success! "${selectedBook.title}" issued to ${selectedBorrower.name}. Due on ${payload.due_date}.`,
        loan: res.data 
      });

      // Refresh stats in header & sidebar
      if (onRefreshStats) onRefreshStats();

      // Refresh borrower active loans
      const updatedBorrower = await api.getBorrower(selectedBorrower.id);
      setSelectedBorrower(updatedBorrower.data);

      // Offer receipt modal
      if (onOpenReceiptModal && res.data) {
        onOpenReceiptModal(res.data);
      }

      // Clear book selection for next scan
      setSelectedBook(null);
      setLoanNotes('');
      setTimeout(() => bookInputRef.current?.focus(), 100);
    } catch (err) {
      playAlertTone();
      setStatusMessage({ type: 'error', text: err.message || 'Failed to issue loan' });
    } finally {
      setLoading(false);
    }
  };

  // Quick Return Handler (by code or active loan item)
  const handleReturnLoan = async (loanId, bookTitle) => {
    setLoading(true);
    try {
      await api.returnLoan(loanId);
      playReturnChime();
      setStatusMessage({ type: 'success', text: `Book "${bookTitle || 'Book'}" has been successfully returned!` });

      if (selectedBorrower) {
        const updatedBorrower = await api.getBorrower(selectedBorrower.id);
        setSelectedBorrower(updatedBorrower.data);
      }

      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      playAlertTone();
      setStatusMessage({ type: 'error', text: err.message || 'Failed to return book' });
    } finally {
      setLoading(false);
    }
  };

  // Standalone Quick Return Scan
  const handleQuickReturnScan = async (e) => {
    if (e) e.preventDefault();
    const code = quickReturnCode.trim();
    if (!code) return;

    setLoading(true);
    setStatusMessage(null);
    try {
      // Find active loan for this barcode
      const loansRes = await api.getLoans({ book_barcode: code, status: 'active' });
      let targetLoan = loansRes.data?.[0];

      if (!targetLoan) {
        // Also check overdue loans
        const overdueRes = await api.getLoans({ book_barcode: code, status: 'overdue' });
        targetLoan = overdueRes.data?.[0];
      }

      if (!targetLoan) {
        playAlertTone();
        setStatusMessage({ type: 'error', text: `No active loan found for book barcode "${code}".` });
        return;
      }

      await api.returnLoan(targetLoan.id);
      playReturnChime();
      setQuickReturnCode('');
      setStatusMessage({ 
        type: 'success', 
        text: `Checked in! "${targetLoan.bookTitle}" (Barcode: ${code}) returned from ${targetLoan.borrowerName}.` 
      });

      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      playAlertTone();
      setStatusMessage({ type: 'error', text: err.message || 'Return failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="circulation-container">
      {/* Title & Quick Return Bar */}
      <div className="desk-header">
        <div className="desk-title-group">
          <h1>
            <Zap size={24} style={{ color: 'var(--primary-500)' }} />
            Circulation Terminal
          </h1>
          <p>Rapid Barcode Scanner Desk: Scan borrower, scan book, auto-calculate due date, and checkout</p>
        </div>

        {/* Quick Return Input Bar */}
        <form onSubmit={handleQuickReturnScan} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="barcode-input-wrapper" style={{ minWidth: '280px' }}>
            <RotateCcw size={16} className="scan-icon" style={{ color: 'var(--emerald-500)' }} />
            <input 
              ref={returnInputRef}
              type="text" 
              className="barcode-input"
              placeholder="Scan Barcode to Check In... (F3)"
              value={quickReturnCode}
              onChange={(e) => setQuickReturnCode(e.target.value)}
            />
          </div>
          <button type="submit" className="table-btn primary" style={{ height: '38px', padding: '0 12px' }}>
            Return
          </button>
        </form>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: statusMessage.type === 'success' ? '#6ee7b7' : '#fda4af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.loan && (
            <button 
              className="table-btn primary"
              onClick={() => onOpenReceiptModal && onOpenReceiptModal(statusMessage.loan)}
            >
              <Printer size={13} />
              Print Receipt
            </button>
          )}
        </div>
      )}

      {/* Main Circulation Grid */}
      <div className="circulation-grid">
        
        {/* ====================================================
            PANEL 1: BORROWER
            ==================================================== */}
        <div className="desk-card">
          <div className="card-title-row">
            <div className="card-title-left">
              <User size={19} style={{ color: 'var(--primary-500)' }} />
              <span>Step 1: Borrower Patron</span>
            </div>
            {selectedBorrower && (
              <button 
                className="table-btn" 
                onClick={() => { setSelectedBorrower(null); borrowerInputRef.current?.focus(); }}
              >
                Change Borrower
              </button>
            )}
          </div>

          {/* Scanner Input */}
          <form onSubmit={handleBorrowerScan}>
            <div className="barcode-input-wrapper">
              <ScanLine size={18} className="scan-icon" />
              <input 
                ref={borrowerInputRef}
                type="text" 
                className="barcode-input"
                placeholder="Scan Borrower Card / Enter ID (e.g. STU-1001)..."
                value={borrowerCode}
                onChange={(e) => setBorrowerCode(e.target.value)}
              />
              <button type="submit" className="barcode-submit-btn">
                Scan ID
              </button>
            </div>
          </form>

          {/* Selected Borrower Details */}
          {selectedBorrower ? (
            <div className="entity-details-box">
              <div className="entity-header">
                <div>
                  <div className="entity-title">{selectedBorrower.name}</div>
                  <div className="entity-subtitle">
                    <span className="code-pill">{selectedBorrower.id}</span>
                    <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{selectedBorrower.role}</span>
                    {selectedBorrower.class && <span> ({selectedBorrower.class})</span>}
                  </div>
                </div>
                <span className={`badge ${selectedBorrower.status === 'active' ? 'badge-active' : 'badge-overdue'}`}>
                  {selectedBorrower.status.toUpperCase()}
                </span>
              </div>

              {/* Overdue Warning Notice if any book is overdue */}
              {(selectedBorrower.overdueLoansCount > 0 || (selectedBorrower.loans && selectedBorrower.loans.some(l => l.status === 'overdue'))) && (
                <div style={{
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
                  <AlertCircle size={16} />
                  <span>
                    ⚠️ Overdue Alert: Patron has {selectedBorrower.overdueLoansCount || selectedBorrower.loans?.filter(l => l.status === 'overdue').length || 1} book(s) overdue! Please request return.
                  </span>
                </div>
              )}

              <div className="entity-metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Email / Contact</span>
                  <span className="metadata-value" style={{ fontSize: '0.75rem' }}>{selectedBorrower.email || 'N/A'}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Loans Breakdown</span>
                  <span className="metadata-value" style={{ fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--rose-500)', fontWeight: 700 }}>
                      {selectedBorrower.overdueLoansCount || selectedBorrower.loans?.filter(l => l.status === 'overdue').length || 0} overdue
                    </span>
                    <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--emerald-500)', fontWeight: 700 }}>
                      {selectedBorrower.activeLoans?.length || selectedBorrower.loans?.filter(l => l.status === 'active').length || 0} active
                    </span>
                    <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {selectedBorrower.totalLoansCount || selectedBorrower.loans?.length || 0} total
                    </span>
                  </span>
                </div>
              </div>

              {/* Complete Loans Viewer (All, Overdue, Active, Returned) */}
              {(() => {
                const allLoans = selectedBorrower.loans || selectedBorrower.activeLoans || [];
                const overdueList = allLoans.filter(l => l.status === 'overdue');
                const activeList = allLoans.filter(l => l.status === 'active');
                const returnedList = allLoans.filter(l => l.status === 'returned');

                let filtered = allLoans;
                if (borrowerLoanFilter === 'overdue') filtered = overdueList;
                else if (borrowerLoanFilter === 'active') filtered = activeList;
                else if (borrowerLoanFilter === 'returned') filtered = returnedList;

                return (
                  <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
                    {/* Filter Tabs Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Patron Loan Records:
                      </div>

                      <div style={{ display: 'flex', gap: '3px' }}>
                        <button 
                          type="button"
                          className={`preset-btn ${borrowerLoanFilter === 'all' ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => setBorrowerLoanFilter('all')}
                        >
                          All ({allLoans.length})
                        </button>
                        <button 
                          type="button"
                          className={`preset-btn ${borrowerLoanFilter === 'overdue' ? 'active' : ''}`}
                          style={{ 
                            padding: '2px 6px', 
                            fontSize: '0.7rem',
                            color: overdueList.length > 0 ? 'var(--rose-500)' : undefined,
                            borderColor: overdueList.length > 0 ? 'rgba(244, 63, 94, 0.4)' : undefined
                          }}
                          onClick={() => setBorrowerLoanFilter('overdue')}
                        >
                          Overdue ({overdueList.length})
                        </button>
                        <button 
                          type="button"
                          className={`preset-btn ${borrowerLoanFilter === 'active' ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => setBorrowerLoanFilter('active')}
                        >
                          Active ({activeList.length})
                        </button>
                        <button 
                          type="button"
                          className={`preset-btn ${borrowerLoanFilter === 'returned' ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => setBorrowerLoanFilter('returned')}
                        >
                          History ({returnedList.length})
                        </button>
                      </div>
                    </div>

                    {/* Loan Items List */}
                    {filtered.length === 0 ? (
                      <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                        No loans found in this category.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                        {filtered.map((loan) => {
                          const timeStatus = getLoanTimeStatus(loan.due_date, loan.return_date);
                          const isOverdue = loan.status === 'overdue';

                          return (
                            <div 
                              key={loan.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isOverdue ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-elevated)',
                                border: isOverdue ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                gap: '8px'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {loan.bookTitle}
                                  </span>
                                  {loan.bookType && (
                                    <span className={`type-pill type-${loan.bookType.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                                      {loan.bookType}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <span>Barcode: <strong style={{ color: '#c7d2fe' }}>{loan.book_barcode || loan.bookBarcode}</strong></span>
                                  <span>•</span>
                                  <span>Due: <strong style={{ color: isOverdue ? 'var(--rose-500)' : 'var(--text-secondary)' }}>{loan.due_date}</strong></span>
                                  <span>•</span>
                                  <span className={`badge ${timeStatus.badgeClass || 'badge-returned'}`} style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                    {timeStatus.label}
                                  </span>
                                </div>
                              </div>

                              {/* Action buttons on loan item */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {!loan.return_date && (
                                  <button 
                                    className="table-btn primary"
                                    onClick={() => handleReturnLoan(loan.id, loan.bookTitle)}
                                    title="Check In / Return Book"
                                    style={{ padding: '3px 7px' }}
                                  >
                                    <RotateCcw size={11} />
                                    <span>Return</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{
              padding: '1.5rem',
              border: '1.5px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              Scan or enter student/teacher ID card to begin loan checkout.
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Sample IDs: <code style={{ color: '#a5b4fc' }}>STU-1001</code>, <code style={{ color: '#a5b4fc' }}>STU-1002</code>, <code style={{ color: '#a5b4fc' }}>TEA-2001</code>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================
            PANEL 2: BOOK & DUE DATE CALCULATION
            ==================================================== */}
        <div className="desk-card">
          <div className="card-title-row">
            <div className="card-title-left">
              <BookOpen size={19} style={{ color: 'var(--primary-500)' }} />
              <span>Step 2: Book & Auto Due Date</span>
            </div>
            {selectedBook && (
              <button 
                className="table-btn" 
                onClick={() => { setSelectedBook(null); bookInputRef.current?.focus(); }}
              >
                Clear Book
              </button>
            )}
          </div>

          {/* Scanner Input */}
          <form onSubmit={handleBookScan}>
            <div className="barcode-input-wrapper">
              <ScanLine size={18} className="scan-icon" />
              <input 
                ref={bookInputRef}
                type="text" 
                className="barcode-input"
                placeholder="Scan Book Barcode (e.g. BK-1001)..."
                value={bookCode}
                onChange={(e) => setBookCode(e.target.value)}
              />
              <button type="submit" className="barcode-submit-btn">
                Scan Book
              </button>
            </div>
          </form>

          {/* Selected Book Details & Auto-Calculated Due Date */}
          {selectedBook ? (
            <div className="entity-details-box">
              <div className="entity-header">
                <div>
                  <div className="entity-title">{selectedBook.title}</div>
                  <div className="entity-subtitle">
                    <span>by {selectedBook.author}</span>
                    <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
                    <span className="code-pill">{selectedBook.barcode}</span>
                  </div>
                </div>
                <span className={`type-pill type-${selectedBook.book_type.toLowerCase()}`}>
                  {selectedBook.book_type}
                </span>
              </div>

              <div className="entity-metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Genre</span>
                  <span className="metadata-value">{selectedBook.genre || 'General'}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Available Copies</span>
                  <span className="metadata-value" style={{ 
                    color: selectedBook.available_copies > 0 ? 'var(--emerald-500)' : 'var(--rose-500)' 
                  }}>
                    {selectedBook.available_copies} / {selectedBook.total_copies} copies
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Shelf Location</span>
                  <span className="metadata-value">{selectedBook.shelf_location || 'Main Floor'}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">ISBN</span>
                  <span className="metadata-value" style={{ fontSize: '0.72rem' }}>{selectedBook.isbn || 'N/A'}</span>
                </div>
              </div>

              {/* Due Date Calculation Section */}
              <div className="due-calc-card">
                <div className="due-calc-top">
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase' }}>
                      Calculated Due Date ({selectedBook.book_type}):
                    </div>
                    <div className="due-date-display">
                      <span className="due-date-big">{customDueDate || calculatedDueDate}</span>
                      <span className="due-date-days">({loanDurationDays} days loan)</span>
                    </div>
                  </div>
                  <Clock size={20} style={{ color: 'var(--primary-500)', opacity: 0.8 }} />
                </div>

                {/* Librarian Due Date Override Presets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Librarian Override / Quick Presets:
                  </div>
                  <div className="preset-buttons">
                    <button 
                      type="button" 
                      className={`preset-btn ${activePreset === 'auto' ? 'active' : ''}`}
                      onClick={() => applyPresetDays(calculateDueDateForBookType(selectedBook.book_type).days, 'auto')}
                    >
                      Default ({calculateDueDateForBookType(selectedBook.book_type).days}d)
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${activePreset === '7d' ? 'active' : ''}`}
                      onClick={() => applyPresetDays(7, '7d')}
                    >
                      1 Week (+7d)
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${activePreset === '14d' ? 'active' : ''}`}
                      onClick={() => applyPresetDays(14, '14d')}
                    >
                      2 Weeks (+14d)
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${activePreset === '21d' ? 'active' : ''}`}
                      onClick={() => applyPresetDays(21, '21d')}
                    >
                      3 Weeks (+21d)
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${activePreset === '30d' ? 'active' : ''}`}
                      onClick={() => applyPresetDays(30, '30d')}
                    >
                      1 Month (+30d)
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${activePreset === '120d' ? 'active' : ''}`}
                      onClick={() => applyPresetDays(120, '120d')}
                    >
                      Semester (+120d)
                    </button>
                  </div>

                  {/* Manual Date Input Override */}
                  <div className="custom-date-row">
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Or pick custom date:</span>
                    <input 
                      type="date" 
                      className="date-input"
                      value={customDueDate}
                      onChange={(e) => {
                        setCustomDueDate(e.target.value);
                        setActivePreset('custom');
                      }}
                    />
                  </div>
                </div>

                {/* Optional Loan Notes */}
                <input 
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                  placeholder="Optional librarian notes for this loan (e.g. project research, special permission)..."
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                />
              </div>

              {/* Checkout Action Button */}
              <button 
                className="checkout-action-btn"
                onClick={handleIssueLoan}
                disabled={!selectedBorrower || selectedBook.available_copies <= 0 || loading}
              >
                <Check size={18} />
                <span>
                  {selectedBook.available_copies <= 0 
                    ? 'No Copies Available' 
                    : !selectedBorrower 
                      ? 'Please Select a Borrower to Issue Loan' 
                      : `Issue Book Loan to ${selectedBorrower.name}`}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{
              padding: '1.5rem',
              border: '1.5px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              Scan book barcode to view details and calculate loan duration.
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Sample Barcodes: <code style={{ color: '#a5b4fc' }}>BK-1001</code> (Fiction: 14d), <code style={{ color: '#a5b4fc' }}>BK-2001</code> (Nonfiction: 21d), <code style={{ color: '#a5b4fc' }}>BK-3001</code> (Textbooks: 120d)
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
