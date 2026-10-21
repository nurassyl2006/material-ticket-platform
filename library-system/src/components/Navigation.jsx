import React from 'react';
import { 
  Zap, BookOpen, Users, ClipboardList, ScanLine, 
  Settings, Database, CheckCircle
} from 'lucide-react';

export default function Navigation({ 
  currentTab, 
  onSelectTab, 
  counts = { active: 0, overdue: 0, books: 0, borrowers: 0 } 
}) {
  return (
    <aside className="app-sidebar">
      <div className="nav-section-label">Circulation</div>
      
      <div 
        className={`nav-tab-item ${currentTab === 'circulation' ? 'active' : ''}`}
        onClick={() => onSelectTab('circulation')}
      >
        <div className="nav-tab-left">
          <Zap size={18} />
          <span>Fast Desk</span>
        </div>
        <span className="nav-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
          F1
        </span>
      </div>

      <div 
        className={`nav-tab-item ${currentTab === 'loans' ? 'active' : ''}`}
        onClick={() => onSelectTab('loans')}
      >
        <div className="nav-tab-left">
          <ClipboardList size={18} />
          <span>Loans & Due Dates</span>
        </div>
        {counts.overdue > 0 ? (
          <span className="nav-badge danger">
            {counts.overdue}
          </span>
        ) : (
          <span className="nav-badge">
            {counts.active}
          </span>
        )}
      </div>

      <div 
        className={`nav-tab-item ${currentTab === 'scanner' ? 'active' : ''}`}
        onClick={() => onSelectTab('scanner')}
      >
        <div className="nav-tab-left">
          <ScanLine size={18} />
          <span>Scanner Kiosk</span>
        </div>
        <span className="nav-badge">F2</span>
      </div>

      <div className="nav-section-label" style={{ marginTop: '0.8rem' }}>Database & Records</div>

      <div 
        className={`nav-tab-item ${currentTab === 'books' ? 'active' : ''}`}
        onClick={() => onSelectTab('books')}
      >
        <div className="nav-tab-left">
          <BookOpen size={18} />
          <span>Book Catalog</span>
        </div>
        <span className="nav-badge">{counts.books}</span>
      </div>

      <div 
        className={`nav-tab-item ${currentTab === 'borrowers' ? 'active' : ''}`}
        onClick={() => onSelectTab('borrowers')}
      >
        <div className="nav-tab-left">
          <Users size={18} />
          <span>Borrowers</span>
        </div>
        <span className="nav-badge">{counts.borrowers}</span>
      </div>

      <div 
        className={`nav-tab-item ${currentTab === 'database' ? 'active' : ''}`}
        onClick={() => onSelectTab('database')}
      >
        <div className="nav-tab-left">
          <Database size={18} />
          <span>Schema & ERD</span>
        </div>
        <span className="nav-badge" style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe' }}>4 Tables</span>
      </div>

      <div className="nav-section-label" style={{ marginTop: '0.8rem' }}>System</div>

      <div 
        className={`nav-tab-item ${currentTab === 'settings' ? 'active' : ''}`}
        onClick={() => onSelectTab('settings')}
      >
        <div className="nav-tab-left">
          <Settings size={18} />
          <span>Loan Policies</span>
        </div>
      </div>

      {/* Footer Info: Database Status */}
      <div className="sidebar-footer">
        <div className="db-pill">
          <Database size={13} style={{ color: 'var(--primary-500)' }} />
          <span>library.db (SQLite WAL)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 4px' }}>
          <CheckCircle size={12} style={{ color: 'var(--emerald-500)' }} />
          <span>Server Port: 5002</span>
        </div>
      </div>
    </aside>
  );
}
