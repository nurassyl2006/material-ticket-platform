import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Trash2, Edit3, 
  UserCheck, Shield, GraduationCap, Briefcase, BookOpen, RotateCcw, X, AlertTriangle, Check
} from 'lucide-react';
import { api } from '../api';
import { getLoanTimeStatus } from '../utils/dateUtils';
import { playReturnChime } from '../utils/sound';

export default function BorrowerDirectory({ onSelectBorrowerForCirculation, onRefreshStats }) {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Borrower Detail Modal / Drawer
  const [activeBorrowerDetail, setActiveBorrowerDetail] = useState(null);
  const [drawerLoanFilter, setDrawerLoanFilter] = useState('all'); // 'all', 'overdue', 'active', 'returned'

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: 'student',
    class: '',
    email: '',
    phone: '',
    status: 'active',
    notes: ''
  });
  const [errorMsg, setErrorMsg] = useState(null);

  const loadBorrowers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedRole !== 'All') params.role = selectedRole;
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await api.getBorrowers(params);
      setBorrowers(res.data || []);
    } catch (err) {
      console.error('Failed to load borrowers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBorrowers();
  }, [search, selectedRole, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingBorrower(null);
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      id: `STU-${randomId}`,
      name: '',
      role: 'student',
      class: 'Grade 10A',
      email: '',
      phone: '',
      status: 'active',
      notes: ''
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (borrower) => {
    setEditingBorrower(borrower);
    setFormData({
      id: borrower.id,
      name: borrower.name,
      role: borrower.role,
      class: borrower.class || '',
      email: borrower.email || '',
      phone: borrower.phone || '',
      status: borrower.status,
      notes: borrower.notes || ''
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.getBorrower(id);
      setActiveBorrowerDetail(res.data);
    } catch (err) {
      alert(err.message || 'Failed to load borrower profile');
    }
  };

  const handleSubmitBorrower = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingBorrower) {
        await api.updateBorrower(editingBorrower.id, formData);
      } else {
        await api.createBorrower(formData);
      }
      setIsModalOpen(false);
      loadBorrowers();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save borrower');
    }
  };

  const handleDeleteBorrower = async (id, name) => {
    if (!confirm(`Are you sure you want to delete borrower "${name}" (${id})?`)) return;
    try {
      await api.deleteBorrower(id);
      loadBorrowers();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message || 'Failed to delete borrower');
    }
  };

  const handleReturnFromDrawer = async (loanId) => {
    try {
      await api.returnLoan(loanId);
      playReturnChime();
      if (activeBorrowerDetail) {
        const res = await api.getBorrower(activeBorrowerDetail.id);
        setActiveBorrowerDetail(res.data);
      }
      loadBorrowers();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message || 'Return failed');
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'student') return <GraduationCap size={15} style={{ color: 'var(--sky-500)' }} />;
    if (role === 'teacher') return <Briefcase size={15} style={{ color: 'var(--amber-500)' }} />;
    return <Shield size={15} style={{ color: 'var(--purple-500)' }} />;
  };

  return (
    <div className="data-view-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Borrower Patrons</h1>
          <p>Minimum required table 2: ID, Name, Role (student, teacher, staff), Class</p>
        </div>
        <button className="primary-button" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add New Borrower</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-field" 
            placeholder="Search by ID, Name, Class, Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="select-field"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="All">All Roles (Student, Teacher, Staff)</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="staff">Staff Members</option>
        </select>

        <select 
          className="select-field"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="graduated">Graduated</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID (Barcode)</th>
              <th>Name</th>
              <th>Role</th>
              <th>Class / Dept</th>
              <th>Active Loans</th>
              <th>Status</th>
              <th>Contact</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading borrower records...
                </td>
              </tr>
            ) : borrowers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No borrowers found matching criteria.
                </td>
              </tr>
            ) : (
              borrowers.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="code-pill">{b.id}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize', fontWeight: 600 }}>
                      {getRoleIcon(b.role)}
                      <span>{b.role}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {b.class || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {b.activeLoansCount > 0 ? (
                      <button 
                        onClick={() => handleViewDetails(b.id)}
                        className={`badge ${b.overdueLoansCount > 0 ? 'badge-overdue' : 'badge-active'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to view checked out books"
                      >
                        {b.activeLoansCount} active {b.overdueLoansCount > 0 && `(${b.overdueLoansCount} overdue)`}
                      </button>
                    ) : (
                      <span className="badge badge-returned">0 loans</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${b.status === 'active' ? 'badge-active' : 'badge-overdue'}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {b.email || b.phone || '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button 
                        className="table-btn primary"
                        onClick={() => onSelectBorrowerForCirculation && onSelectBorrowerForCirculation(b)}
                        title="Start checkout for this borrower"
                      >
                        Desk
                      </button>
                      <button 
                        className="table-btn"
                        onClick={() => handleViewDetails(b.id)}
                        title="View Loan History"
                      >
                        <BookOpen size={13} />
                      </button>
                      <button 
                        className="table-btn"
                        onClick={() => handleOpenEdit(b)}
                        title="Edit Borrower"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="table-btn danger"
                        onClick={() => handleDeleteBorrower(b.id, b.name)}
                        title="Delete Borrower"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Borrower Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBorrower ? `Edit Borrower: ${editingBorrower.id}` : 'Register New Borrower'}
              </h2>
              <button className="icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitBorrower}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--rose-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* ID & Role (Core DB Fields) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">ID (Library Card / Student ID) *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. STU-1008"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!!editingBorrower}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select 
                      className="form-input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>

                {/* Name & Class (Core DB Fields) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. Alisher Nurgaliyev"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Class / Department</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. Grade 10A, Science"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input"
                      placeholder="e.g. user@ardingly.kz"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="+7 701 555 1234"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label">Patron Status</label>
                  <select 
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended (Borrowing restricted)</option>
                    <option value="graduated">Graduated / Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check size={16} />
                  <span>{editingBorrower ? 'Save Changes' : 'Register Borrower'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrower Profile & Loan History Drawer */}
      {activeBorrowerDetail && (
        <div className="modal-backdrop" onClick={() => setActiveBorrowerDetail(null)}>
          <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{activeBorrowerDetail.name}</h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span className="code-pill">{activeBorrowerDetail.id}</span>
                  <span style={{ margin: '0 6px' }}>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{activeBorrowerDetail.role}</span>
                  {activeBorrowerDetail.class && <span> ({activeBorrowerDetail.class})</span>}
                </div>
              </div>
              <button className="icon-button" onClick={() => setActiveBorrowerDetail(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Overdue Alert Notice */}
              {(activeBorrowerDetail.overdueLoansCount > 0 || activeBorrowerDetail.loans?.some(l => l.status === 'overdue')) && (
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
                  <AlertTriangle size={16} />
                  <span>
                    ⚠️ Overdue Alert: Patron has {activeBorrowerDetail.overdueLoansCount || activeBorrowerDetail.loans?.filter(l => l.status === 'overdue').length || 1} book(s) overdue! Please follow up for return.
                  </span>
                </div>
              )}

              {/* Loans Filter Tabs Header */}
              {(() => {
                const loans = activeBorrowerDetail.loans || [];
                const overdueList = loans.filter(l => l.status === 'overdue');
                const activeList = loans.filter(l => l.status === 'active');
                const returnedList = loans.filter(l => l.status === 'returned');

                let filtered = loans;
                if (drawerLoanFilter === 'overdue') filtered = overdueList;
                else if (drawerLoanFilter === 'active') filtered = activeList;
                else if (drawerLoanFilter === 'returned') filtered = returnedList;

                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        All Patron Loans ({loans.length}):
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          type="button"
                          className={`preset-btn ${drawerLoanFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setDrawerLoanFilter('all')}
                        >
                          All ({loans.length})
                        </button>
                        <button 
                          type="button"
                          className={`preset-btn ${drawerLoanFilter === 'overdue' ? 'active' : ''}`}
                          style={{
                            color: overdueList.length > 0 ? 'var(--rose-500)' : undefined,
                            borderColor: overdueList.length > 0 ? 'rgba(244, 63, 94, 0.4)' : undefined
                          }}
                          onClick={() => setDrawerLoanFilter('overdue')}
                        >
                          Overdue ({overdueList.length})
                        </button>
                        <button 
                          type="button"
                          className={`preset-btn ${drawerLoanFilter === 'active' ? 'active' : ''}`}
                          onClick={() => setDrawerLoanFilter('active')}
                        >
                          Active ({activeList.length})
                        </button>
                        <button 
                          type="button"
                          className={`preset-btn ${drawerLoanFilter === 'returned' ? 'active' : ''}`}
                          onClick={() => setDrawerLoanFilter('returned')}
                        >
                          Returned ({returnedList.length})
                        </button>
                      </div>
                    </div>

                    {filtered.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                        {filtered.map((loan) => {
                          const timeStatus = getLoanTimeStatus(loan.due_date, loan.return_date);
                          const isOverdue = loan.status === 'overdue';
                          return (
                            <div 
                              key={loan.id}
                              style={{
                                background: isOverdue ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-tertiary)',
                                border: isOverdue ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{loan.bookTitle}</span>
                                  {loan.bookType && (
                                    <span className={`type-pill type-${loan.bookType.toLowerCase()}`} style={{ fontSize: '0.62rem' }}>
                                      {loan.bookType}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                                  <span>Barcode: <strong style={{ color: '#c7d2fe' }}>{loan.book_barcode}</strong></span>
                                  <span>•</span>
                                  <span>Borrowed: {loan.loan_date}</span>
                                  <span>•</span>
                                  <span>Due: <strong style={{ color: isOverdue ? 'var(--rose-500)' : 'var(--text-secondary)' }}>{loan.due_date}</strong></span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`badge ${timeStatus.badgeClass || 'badge-returned'}`}>
                                  {timeStatus.label}
                                </span>
                                {!loan.return_date && (
                                  <button 
                                    className="table-btn primary"
                                    onClick={() => handleReturnFromDrawer(loan.id)}
                                  >
                                    <RotateCcw size={12} />
                                    Return
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        No loans found in this filter category.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="primary-button"
                onClick={() => {
                  onSelectBorrowerForCirculation(activeBorrowerDetail);
                  setActiveBorrowerDetail(null);
                }}
              >
                Go to Circulation Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
