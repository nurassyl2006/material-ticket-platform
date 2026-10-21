import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, Calendar, RotateCcw, Edit3, 
  Printer, AlertCircle, CheckCircle2, Clock, Filter, X, Check, ArrowUpRight
} from 'lucide-react';
import { api } from '../api';
import { getLoanTimeStatus, formatDatePretty, addDaysToDate } from '../utils/dateUtils';
import { playReturnChime, playCheckoutChime, playAlertTone } from '../utils/sound';

export default function LoanManager({ onOpenReceiptModal, onRefreshStats }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'overdue', 'returned', 'all'
  const [search, setSearch] = useState('');

  // Librarian Due Date Modifier Modal State
  const [editingLoan, setEditingLoan] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [librarianNotes, setLibrarianNotes] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (search) params.search = search;

      const res = await api.getLoans(params);
      setLoans(res.data || []);
    } catch (err) {
      console.error('Failed to load loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, [activeTab, search]);

  // Open Edit Due Date Modal
  const handleOpenEditModal = (loan) => {
    setEditingLoan(loan);
    setNewDueDate(loan.due_date);
    setLibrarianNotes(loan.notes || '');
  };

  // Submit Librarian Due Date Change
  const handleSaveDueDate = async (e) => {
    e.preventDefault();
    if (!editingLoan || !newDueDate) return;

    setSubmittingEdit(true);
    try {
      await api.updateLoan(editingLoan.id, {
        due_date: newDueDate,
        notes: librarianNotes
      });
      playCheckoutChime();
      setEditingLoan(null);
      loadLoans();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      playAlertTone();
      alert(err.message || 'Failed to update due date');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Renew Loan
  const handleRenewLoan = async (loanId) => {
    try {
      const res = await api.renewLoan(loanId);
      playCheckoutChime();
      alert(res.message);
      loadLoans();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      playAlertTone();
      alert(err.message || 'Failed to renew loan');
    }
  };

  // Return Loan
  const handleReturnLoan = async (loanId) => {
    try {
      await api.returnLoan(loanId);
      playReturnChime();
      loadLoans();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      playAlertTone();
      alert(err.message || 'Failed to return book');
    }
  };

  return (
    <div className="data-view-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Circulation & Loan Records</h1>
          <p>Minimum required table 3: Random ID, books.Barcode, borrowers.ID, Date of loan, Due date (auto-calculated & editable by librarian)</p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="filter-bar">
        {/* Status Tab Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            className={`preset-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Loans
          </button>
          <button 
            className={`preset-btn ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue Only
          </button>
          <button 
            className={`preset-btn ${activeTab === 'returned' ? 'active' : ''}`}
            onClick={() => setActiveTab('returned')}
          >
            Returned History
          </button>
          <button 
            className={`preset-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Loans
          </button>
        </div>

        {/* Search */}
        <div className="search-input-group" style={{ marginLeft: 'auto' }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-field" 
            placeholder="Search by Loan ID, Book, Borrower, Barcode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loans Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Book Title & Type</th>
              <th>Borrower Patron</th>
              <th>Date of Loan</th>
              <th>Due Date (Calculated / Adjusted)</th>
              <th>Status / Remaining</th>
              <th style={{ textAlign: 'right' }}>Librarian Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading loan records...
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No {activeTab} loans found.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const timeStatus = getLoanTimeStatus(loan.due_date, loan.return_date);
                return (
                  <tr key={loan.id}>
                    {/* Random ID */}
                    <td>
                      <span className="code-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe' }}>
                        {loan.id}
                      </span>
                    </td>

                    {/* Book */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loan.bookTitle}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span className="code-pill" style={{ fontSize: '0.7rem' }}>{loan.book_barcode}</span>
                        <span className={`type-pill type-${loan.bookType.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                          {loan.bookType}
                        </span>
                      </div>
                    </td>

                    {/* Borrower */}
                    <td>
                      <div style={{ fontWeight: 700 }}>{loan.borrowerName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span className="code-pill" style={{ fontSize: '0.7rem' }}>{loan.borrower_id}</span>
                        <span style={{ margin: '0 4px' }}>•</span>
                        <span style={{ textTransform: 'capitalize' }}>{loan.borrowerRole}</span>
                        {loan.borrowerClass && <span> ({loan.borrowerClass})</span>}
                      </div>
                    </td>

                    {/* Loan Date */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {formatDatePretty(loan.loan_date)}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '0.88rem', 
                          fontWeight: 700,
                          color: loan.status === 'overdue' ? 'var(--rose-500)' : 'var(--text-primary)'
                        }}>
                          {loan.due_date}
                        </span>
                        {!loan.return_date && (
                          <button 
                            className="table-btn"
                            style={{ padding: '2px 5px' }}
                            onClick={() => handleOpenEditModal(loan)}
                            title="Librarian: Change Due Date"
                          >
                            <Edit3 size={11} />
                          </button>
                        )}
                      </div>
                      {loan.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                          "{loan.notes}"
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge ${timeStatus.badgeClass || 'badge-returned'}`}>
                        {timeStatus.label}
                      </span>
                      {loan.return_date && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Returned: {loan.return_date}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {!loan.return_date && (
                          <>
                            <button 
                              className="table-btn primary"
                              onClick={() => handleReturnLoan(loan.id)}
                              title="Check In / Return Book"
                            >
                              <RotateCcw size={13} />
                              Return
                            </button>
                            <button 
                              className="table-btn"
                              onClick={() => handleRenewLoan(loan.id)}
                              title="Extend Due Date by Book Type default"
                            >
                              Renew
                            </button>
                          </>
                        )}
                        <button 
                          className="table-btn"
                          onClick={() => onOpenReceiptModal && onOpenReceiptModal(loan)}
                          title="Print Loan Slip / Receipt"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Librarian Due Date Modifier Modal */}
      {editingLoan && (
        <div className="modal-backdrop" onClick={() => setEditingLoan(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Librarian: Change Due Date ({editingLoan.id})
              </h2>
              <button className="icon-button" onClick={() => setEditingLoan(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDueDate}>
              <div className="modal-body">
                {/* Book & Borrower Summary */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{editingLoan.bookTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Borrower: <strong>{editingLoan.borrowerName}</strong> ({editingLoan.borrowerRole})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Book Type: <span className={`type-pill type-${editingLoan.bookType.toLowerCase()}`}>{editingLoan.bookType}</span>
                  </div>
                </div>

                {/* Due Date Picker */}
                <div className="form-group">
                  <label className="form-label">New Due Date *</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                  />
                </div>

                {/* Quick Presets for Librarian */}
                <div className="form-group">
                  <label className="form-label">Quick Extension Presets</label>
                  <div className="preset-buttons">
                    <button 
                      type="button" 
                      className="preset-btn"
                      onClick={() => setNewDueDate(addDaysToDate(new Date(), 7))}
                    >
                      +7 Days (1 Week)
                    </button>
                    <button 
                      type="button" 
                      className="preset-btn"
                      onClick={() => setNewDueDate(addDaysToDate(new Date(), 14))}
                    >
                      +14 Days (2 Weeks)
                    </button>
                    <button 
                      type="button" 
                      className="preset-btn"
                      onClick={() => setNewDueDate(addDaysToDate(new Date(), 30))}
                    >
                      +30 Days (1 Month)
                    </button>
                    <button 
                      type="button" 
                      className="preset-btn"
                      onClick={() => setNewDueDate(addDaysToDate(new Date(), 120))}
                    >
                      +120 Days (Semester)
                    </button>
                  </div>
                </div>

                {/* Librarian Notes */}
                <div className="form-group">
                  <label className="form-label">Librarian Reason / Notes</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Extended for project research, approved by teacher..."
                    value={librarianNotes}
                    onChange={(e) => setLibrarianNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setEditingLoan(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submittingEdit}>
                  <Check size={16} />
                  <span>Update Due Date</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
