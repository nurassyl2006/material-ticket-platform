import React from 'react';
import { Printer, X, CheckCircle2, BookOpen, User, Calendar, ShieldCheck } from 'lucide-react';
import { formatDatePretty } from '../utils/dateUtils';

export default function LoanReceiptModal({ loan, onClose }) {
  if (!loan) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--emerald-500)' }} />
            <h2 className="modal-title">Loan Checkout Receipt</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {/* Printable Ticket Box */}
          <div className="printable-slip" style={{
            background: 'var(--bg-tertiary)',
            border: '1.5px dashed var(--border-medium)',
            borderRadius: '10px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontFamily: 'var(--font-sans)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Ardingly Central Library
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Official Book Loan Slip
              </div>
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                color: '#a5b4fc',
                marginTop: '4px' 
              }}>
                {loan.id}
              </div>
            </div>

            {/* Book Info */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Item Borrowed
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                {loan.bookTitle}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Barcode: <strong style={{ fontFamily: 'var(--font-mono)' }}>{loan.book_barcode || loan.bookBarcode}</strong> • {loan.bookType}
              </div>
            </div>

            {/* Borrower Info */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Issued To Patron
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {loan.borrowerName}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{loan.borrower_id || loan.borrowerId}</strong> • {loan.borrowerRole} {loan.borrowerClass && `(${loan.borrowerClass})`}
              </div>
            </div>

            {/* Dates Box */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Date Borrowed:</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatDatePretty(loan.loan_date)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--amber-500)', fontWeight: 700 }}>DUE DATE:</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {formatDatePretty(loan.due_date)}
                </div>
              </div>
            </div>

            {loan.notes && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Librarian note: "{loan.notes}"
              </div>
            )}

            {/* Terms notice */}
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
              Please return or renew before the due date. Books damaged or lost must be reported immediately to library staff.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-button" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
