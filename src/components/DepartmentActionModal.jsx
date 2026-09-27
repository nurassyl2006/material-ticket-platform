import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  CheckCircle2, 
  ShoppingBag, 
  User, 
  Building, 
  ShieldCheck, 
  Laptop, 
  Sparkles, 
  Truck, 
  X, 
  PhoneCall, 
  MessageSquare
} from 'lucide-react';

export const DepartmentActionModal = ({ ticket, isOpen, onClose }) => {
  const { 
    t, 
    currentUser, 
    issueTicketFromStock, 
    markTicketToPurchase, 
    startTicketWork, 
    completeTicketDelivery, 
    updateFacilitiesMove, 
    inventory 
  } = useApp();

  // Storage states
  const [storageActionType, setStorageActionType] = useState('stock'); // 'stock' | 'purchase'
  const [purchaseCost, setPurchaseCost] = useState('');
  const [supplier, setSupplier] = useState('');

  // Facilities moving states
  const [fromRoom, setFromRoom] = useState('');
  const [toRoom, setToRoom] = useState('');
  const [furnitureItems, setFurnitureItems] = useState('');
  const [movingCrew, setMovingCrew] = useState('');

  // General notes
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (ticket) {
      setNotes(ticket.notes || '');
      if (ticket.moveDetails) {
        setFromRoom(ticket.moveDetails.fromRoom || '');
        setToRoom(ticket.moveDetails.toRoom || '');
        setFurnitureItems(ticket.moveDetails.items || '');
      } else {
        setFromRoom('');
        setToRoom(ticket.roomNumber || '');
        setFurnitureItems(ticket.itemTitle || '');
      }
      setMovingCrew(ticket.assignedWorker || currentUser.name || '');
    }
  }, [ticket, currentUser]);

  if (!isOpen || !ticket) return null;

  const targetDept = ticket.department || 'storage';

  // Check matching stock level for storage requests
  const stockItem = inventory.find(i => i.name.toLowerCase() === ticket.itemTitle.toLowerCase());
  const availableQty = stockItem ? stockItem.quantity : 0;
  const isEnoughStock = availableQty >= (ticket.quantity || 1);

  const cleanPhone = (ticket.teacherPhone || '').replace(/[^\d+]/g, '');

  const handleStorageSubmit = (e) => {
    e.preventDefault();
    if (storageActionType === 'stock') {
      issueTicketFromStock(ticket.id, notes);
    } else {
      markTicketToPurchase(ticket.id, purchaseCost, supplier, notes);
    }
    onClose();
  };

  const handleFacilitiesSubmit = (e, markCompleted = false) => {
    e.preventDefault();
    updateFacilitiesMove(ticket.id, {
      fromRoom: fromRoom || 'Storage',
      toRoom: toRoom || ticket.roomNumber,
      items: furnitureItems
    }, notes || `Facilities dispatched moving team (${movingCrew}).`);

    if (markCompleted) {
      completeTicketDelivery(ticket.id, notes || 'Furniture relocation and setup completed.');
    }
    onClose();
  };

  const handleITSubmit = (e, markResolved = false) => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || 'IT issue resolved and verified.');
    } else {
      startTicketWork(ticket.id, notes || 'IT technician diagnosing issue.');
    }
    onClose();
  };

  const handleCleaningSubmit = (e, markDone = false) => {
    e.preventDefault();
    if (markDone) {
      completeTicketDelivery(ticket.id, notes || 'Area thoroughly cleaned and sanitized.');
    } else {
      startTicketWork(ticket.id, notes || 'Cleaning staff in progress.');
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '9px', borderRadius: '10px' }}>
              <ShieldCheck size={22} color="var(--secondary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
                {targetDept === 'storage' && t.tickets.actionStorage}
                {targetDept === 'facilities' && t.tickets.actionFacilities}
                {targetDept === 'it' && t.tickets.actionIT}
                {targetDept === 'cleaning' && t.tickets.actionCleaning}
                {targetDept === 'security' && 'Security Service Action'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ticket #{ticket.id} • Assigned Handler: <strong style={{ color: '#fff' }}>{currentUser.name}</strong></span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Ticket Snapshot Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
              {ticket.itemTitle} {ticket.quantity ? `x ${ticket.quantity} ${ticket.unit}` : ''}
            </div>
            <span style={{ 
              background: ticket.urgency === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
              color: ticket.urgency === 'critical' ? '#f87171' : '#60a5fa', 
              padding: '2px 8px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              {ticket.urgency}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <span><Building size={13} style={{ verticalAlign: 'middle' }} /> {ticket.roomNumber}</span>
            <span><User size={13} style={{ verticalAlign: 'middle' }} /> {ticket.teacherName}</span>
            {cleanPhone && (
              <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                <a href={`tel:${cleanPhone}`} title={t.profile.call} style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                  <PhoneCall size={12} /> Call
                </a>
                <a href={`https://wa.me/${cleanPhone.replace('+', '')}`} target="_blank" rel="noopener noreferrer" title={t.profile.whatsapp} style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                  <MessageSquare size={12} /> WA
                </a>
              </div>
            )}
          </div>

          {ticket.description && (
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '8px', marginBottom: 0, fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
              "{ticket.description}"
            </p>
          )}
        </div>

        {/* 1. STORAGE MANAGER WORKFLOW */}
        {targetDept === 'storage' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setStorageActionType('stock')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: storageActionType === 'stock' ? '2px solid var(--success)' : '1px solid var(--border-color)',
                  background: storageActionType === 'stock' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  textAlign: 'left',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--success)', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 size={16} /> {t.tickets.issueFromStock}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  In Stock: <strong style={{ color: isEnoughStock ? 'var(--success)' : 'var(--danger)' }}>{availableQty} {ticket.unit}</strong>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStorageActionType('purchase')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: storageActionType === 'purchase' ? '2px solid var(--warning)' : '1px solid var(--border-color)',
                  background: storageActionType === 'purchase' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  textAlign: 'left',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--warning)', fontWeight: '700', fontSize: '13px' }}>
                  <ShoppingBag size={16} /> {t.tickets.markToPurchase}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Procure / Buy from Vendor
                </div>
              </button>
            </div>

            <form onSubmit={handleStorageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {storageActionType === 'purchase' && (
                <>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      {t.tickets.purchaseCost} *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 15000"
                      value={purchaseCost}
                      onChange={e => setPurchaseCost(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      {t.tickets.supplier}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sulpak / Abdi / Local Store"
                      value={supplier}
                      onChange={e => setSupplier(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  {t.tickets.notes}
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes for teacher and warehouse records..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  {t.common.cancel}
                </button>
                <button type="submit" style={{ background: storageActionType === 'stock' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  {storageActionType === 'stock' ? '✓ Confirm Give from Stock' : '🛒 Confirm Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. FACILITIES MANAGER (ME) WORKFLOW */}
        {targetDept === 'facilities' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#c4b5fd', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} /> Furniture Relocation & Setup Tracking
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{t.tickets.fromRoom}</label>
                  <input
                    type="text"
                    value={fromRoom}
                    onChange={e => setFromRoom(e.target.value)}
                    placeholder="Origin (e.g. Room 102)"
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{t.tickets.toRoom}</label>
                  <input
                    type="text"
                    value={toRoom}
                    onChange={e => setToRoom(e.target.value)}
                    placeholder="Destination (e.g. Assembly Hall)"
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{t.tickets.furnitureItems}</label>
                <input
                  type="text"
                  value={furnitureItems}
                  onChange={e => setFurnitureItems(e.target.value)}
                  placeholder="e.g. 15 student desks, 30 blue chairs, 1 podium"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '12px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {t.tickets.assignedWorkersList}
              </label>
              <input
                type="text"
                value={movingCrew}
                onChange={e => setMovingCrew(e.target.value)}
                placeholder="e.g. Nurassyl + Facilities Logistics Team"
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {t.tickets.notes}
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Log moving status, equipment used (dollies), or repair notes..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handleFacilitiesSubmit(e, false)} style={{ background: 'rgba(167, 139, 250, 0.2)', border: '1px solid #a78bfa', color: '#c4b5fd', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                🚚 Dispatch / Moving in Progress
              </button>
              <button type="button" onClick={(e) => handleFacilitiesSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Relocation Complete
              </button>
            </div>
          </form>
        )}

        {/* 3. IT SUPPORT WORKFLOW */}
        {targetDept === 'it' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Laptop size={14} /> IT Support Troubleshooting & Diagnostics
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Investigate Wi-Fi access points, teacher laptop hardware/software, projectors, or credentials.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {t.tickets.diagnosticNotes}
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Tested Wi-Fi AP signal, updated graphics drivers, or replaced HDMI cable..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handleITSubmit(e, false)} style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ⚡ In Diagnostics
              </button>
              <button type="button" onClick={(e) => handleITSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Issue Resolved
              </button>
            </div>
          </form>
        )}

        {/* 4. CLEANING WORKFLOW */}
        {targetDept === 'cleaning' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Campus Hygiene & Cleaning Response
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Respond to floor spills, empty overflowing waste bins, or deep clean classrooms.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {t.tickets.cleaningCompletedNotes}
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Floor washed with disinfectant, dried, and hazard cone removed..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handleCleaningSubmit(e, false)} style={{ background: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                🧹 Start Cleaning
              </button>
              <button type="button" onClick={(e) => handleCleaningSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Cleaned & Sanitized
              </button>
            </div>
          </form>
        )}

        {/* 5. SECURITY OR GENERAL WORKFLOW */}
        {targetDept === 'security' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Security Action & Resolution Notes
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Re-encoded teacher RFID card, checked magnetic door lock..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={() => { completeTicketDelivery(ticket.id, notes || 'Security check completed.'); onClose(); }} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Resolve Security Request
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

// Also export as WorkerAActionModal for backwards compatibility
export const WorkerAActionModal = DepartmentActionModal;
