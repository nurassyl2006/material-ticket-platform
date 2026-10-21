import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Check, Database, RefreshCw, BookOpen, AlertCircle,
  Users, ShieldCheck, KeyRound, Lock, Eye, EyeOff, UserPlus, CheckCircle2, X
} from 'lucide-react';
import { api } from '../api';
import { playCheckoutChime, playAlertTone } from '../utils/sound';

export default function SettingsModal({ currentUser, onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' | 'accounts'
  const [settings, setSettings] = useState({
    fiction_loan_days: '14',
    nonfiction_loan_days: '21',
    textbooks_loan_days: '120',
    library_name: 'Ardingly Central Library',
    max_loans_student: '3',
    max_loans_teacher: '10'
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Staff accounts management state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingPasswordUserId, setEditingPasswordUserId] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [accountAlert, setAccountAlert] = useState({ type: '', message: '' });

  // Add staff modal state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newStaff, setNewStaff] = useState({ username: '', full_name: '', password: '', role: 'librarian' });
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error('Settings fetch error:', err);
      }
    };
    fetchSettings();
  }, []);

  const fetchUsers = async () => {
    if (currentUser?.role !== 'admin') return;
    setLoadingUsers(true);
    try {
      const res = await api.getUsers();
      if (res.data) setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch staff accounts:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'accounts') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateSettings(settings);
      playCheckoutChime();
      setSavedSuccess(true);
      if (onSettingsUpdated) onSettingsUpdated(settings);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (userId, targetUsername) => {
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setAccountAlert({ type: 'error', message: 'Password must be at least 4 characters long' });
      playAlertTone();
      return;
    }

    setPasswordUpdating(true);
    setAccountAlert({ type: '', message: '' });
    try {
      await api.resetUserPassword(userId, newPasswordInput);
      playCheckoutChime();
      setAccountAlert({ type: 'success', message: `Password for "${targetUsername}" was successfully updated!` });
      setEditingPasswordUserId(null);
      setNewPasswordInput('');
      setTimeout(() => setAccountAlert({ type: '', message: '' }), 4000);
    } catch (err) {
      setAccountAlert({ type: 'error', message: err.message || 'Failed to update password' });
      playAlertTone();
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.username.trim() || !newStaff.password) {
      setAccountAlert({ type: 'error', message: 'Username and password are required' });
      playAlertTone();
      return;
    }

    setAddStaffLoading(true);
    setAccountAlert({ type: '', message: '' });
    try {
      await api.createUser(newStaff);
      playCheckoutChime();
      setAccountAlert({ type: 'success', message: `Staff account "${newStaff.username}" created successfully!` });
      setIsAddingUser(false);
      setNewStaff({ username: '', full_name: '', password: '', role: 'librarian' });
      fetchUsers();
      setTimeout(() => setAccountAlert({ type: '', message: '' }), 4000);
    } catch (err) {
      setAccountAlert({ type: 'error', message: err.message || 'Failed to create account' });
      playAlertTone();
    } finally {
      setAddStaffLoading(false);
    }
  };

  return (
    <div className="data-view-container" style={{ maxWidth: '840px' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>System Configuration & Security</h1>
          <p>Configure circulation policies, lending periods, and manage authorized staff accounts</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`btn ${activeTab === 'policies' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Settings size={15} />
          <span>Lending Policies & Rules</span>
        </button>

        {currentUser?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ShieldCheck size={15} />
            <span>Staff Accounts & Passwords</span>
          </button>
        )}
      </div>

      {/* TAB 1: Lending Policies */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSaveSettings}>
          <div className="table-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {savedSuccess && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--emerald-bg)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#6ee7b7',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={16} />
                <span>Settings updated successfully! New loan calculations are now active.</span>
              </div>
            )}

            {/* Library Identity */}
            <div className="form-group">
              <label className="form-label">Library Organization Name</label>
              <input 
                type="text"
                className="form-input"
                value={settings.library_name}
                onChange={(e) => setSettings({ ...settings, library_name: e.target.value })}
              />
            </div>

            {/* Book Type Loan Durations */}
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Default Due Date Calculation Rules:
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                When a book is scanned at the Circulation Desk, its due date is automatically set by these default periods. Librarians can always adjust or override on checkout.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                  <label className="form-label" style={{ color: 'var(--type-fiction)', fontWeight: 700 }}>
                    📖 Fiction Loan Days
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="365"
                    className="form-input"
                    value={settings.fiction_loan_days}
                    onChange={(e) => setSettings({ ...settings, fiction_loan_days: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Recommended: 14 days (2 wks)
                  </span>
                </div>

                <div className="form-group" style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                  <label className="form-label" style={{ color: 'var(--type-nonfiction)', fontWeight: 700 }}>
                    🧠 Nonfiction Loan Days
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="365"
                    className="form-input"
                    value={settings.nonfiction_loan_days}
                    onChange={(e) => setSettings({ ...settings, nonfiction_loan_days: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Recommended: 21 days (3 wks)
                  </span>
                </div>

                <div className="form-group" style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                  <label className="form-label" style={{ color: 'var(--type-textbooks)', fontWeight: 700 }}>
                    📐 Textbooks Loan Days
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="365"
                    className="form-input"
                    value={settings.textbooks_loan_days}
                    onChange={(e) => setSettings({ ...settings, textbooks_loan_days: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Recommended: 120 days (Term)
                  </span>
                </div>
              </div>
            </div>

            {/* Database Specs Card */}
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <Database size={15} style={{ color: 'var(--primary-500)' }} />
                <span>Isolated Database Information</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Location: <code style={{ color: '#a5b4fc' }}>library-system/server/data/library.db</code>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Mode: SQLite 3 with Write-Ahead Logging (WAL) enabled for high concurrency
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Server Port: <code style={{ color: '#a5b4fc' }}>5002</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="primary-button" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Policies & Settings'}</span>
              </button>
            </div>

          </div>
        </form>
      )}

      {/* TAB 2: Staff Accounts & Access Security */}
      {activeTab === 'accounts' && (
        <div className="table-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} className="text-amber" />
                <span>Authorized Library Accounts</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Only the accounts listed below have permission to log in and access circulation records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingUser(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={15} />
              <span>Add Staff Account</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {accountAlert.message && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: accountAlert.type === 'success' ? 'var(--emerald-bg)' : 'rgba(239, 68, 68, 0.15)',
              border: accountAlert.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: accountAlert.type === 'success' ? '#6ee7b7' : '#fca5a5'
            }}>
              {accountAlert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{accountAlert.message}</span>
            </div>
          )}

          {/* Accounts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                Loading staff accounts...
              </div>
            ) : (
              users.map(u => {
                const isNurassyl = u.username.toLowerCase() === 'nurassyl';
                const isEditingThisUser = editingPasswordUserId === u.id;

                return (
                  <div 
                    key={u.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: isNurassyl ? '1.5px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-medium)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: u.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: u.role === 'admin' ? '#fbbf24' : '#818cf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{u.username}</strong>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: u.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                              color: u.role === 'admin' ? '#fbbf24' : '#a5b4fc'
                            }}>
                              {u.role === 'admin' ? 'Administrator' : 'Librarian'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {u.full_name} • ID: {u.id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isEditingThisUser ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPasswordUserId(u.id);
                              setNewPasswordInput('');
                              setAccountAlert({ type: '', message: '' });
                            }}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <KeyRound size={14} />
                            <span>Change Password</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingPasswordUserId(null)}
                            className="btn btn-ghost"
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Password Change Box */}
                    {isEditingThisUser && (
                      <div style={{
                        marginTop: '4px',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                          Set new password for <span style={{ color: '#fbbf24' }}>{u.username}</span>:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input
                              type={showPasswordText ? 'text' : 'password'}
                              placeholder="Enter new password (min. 4 characters)"
                              className="form-input"
                              value={newPasswordInput}
                              onChange={(e) => setNewPasswordInput(e.target.value)}
                              autoFocus
                              style={{ width: '100%', paddingRight: '36px' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordText(!showPasswordText)}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {showPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdatePassword(u.id, u.username)}
                            className="primary-button"
                            disabled={passwordUpdating || !newPasswordInput}
                            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                          >
                            {passwordUpdating ? 'Updating...' : 'Save Password'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Lock size={15} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span>
              All passwords are encrypted with individual cryptographic salts via Node.js scrypt. Only <strong>nurassyl</strong> and <strong>librarian</strong> can log in.
            </span>
          </div>

        </div>
      )}

      {/* Add Staff Account Modal */}
      {isAddingUser && (
        <div className="modal-backdrop" onClick={() => setIsAddingUser(false)}>
          <div className="modal-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} className="text-amber" />
                <h3 className="modal-title">Create Staff Account</h3>
              </div>
              <button className="icon-button" onClick={() => setIsAddingUser(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. librarian2"
                  className="form-input"
                  value={newStaff.username}
                  onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Assistant Librarian"
                  className="form-input"
                  value={newStaff.full_name}
                  onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 4 characters"
                  className="form-input"
                  value={newStaff.password}
                  onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="librarian">Librarian (Circulation & Catalog)</option>
                  <option value="admin">Administrator (Full System Access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddingUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={addStaffLoading}>
                  {addStaffLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
