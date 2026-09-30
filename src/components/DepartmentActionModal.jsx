import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Wrench,
  Camera,
  ImagePlus,
  Globe,
  RotateCcw
} from 'lucide-react';
import { DEPARTMENTS, resolveDepartment, translateSubcategory } from '../departments';
import { translateText, detectLanguage } from '../services/translator';

export const DepartmentActionModal = ({ ticket, isOpen, onClose }) => {
  const { 
    t, 
    currentUser, 
    updateTicket,
    issueTicketFromStock, 
    markTicketToPurchase, 
    startTicketWork, 
    completeTicketDelivery, 
    updateFacilitiesMove, 
    addPhotosToTicket,
    inventory,
    lang
  } = useApp();

  const [transferSuccess, setTransferSuccess] = useState(false);

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

  // Ticket translation states for engineer / staff
  const { translatorTargetLang } = useApp();
  const [modalLang, setModalLang] = useState(translatorTargetLang || 'ru');
  const [modalTransData, setModalTransData] = useState(null);
  const [isModalTranslating, setIsModalTranslating] = useState(false);
  const [showModalOriginal, setShowModalOriginal] = useState(false);

  // Resolution note translator to English for teacher
  const [isTranslatingNotes, setIsTranslatingNotes] = useState(false);
  const [translatedNotePreview, setTranslatedNotePreview] = useState(null);

  // Completion photos
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const completionFileRef = useRef(null);
  const completionCamRef = useRef(null);

  const processCompletionFiles = (files) => {
    const remaining = 5 - completionPhotos.length;
    if (remaining <= 0) return;
    Array.from(files).slice(0, remaining).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => setCompletionPhotos(prev => prev.length < 5 ? [...prev, e.target.result] : prev);
      reader.readAsDataURL(file);
    });
  };

  const removeCompletionPhoto = (idx) => setCompletionPhotos(prev => prev.filter((_, i) => i !== idx));

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
      setTranslatedNotePreview(null);
    }
  }, [ticket, currentUser]);

  // Effect to perform translation on the active ticket
  useEffect(() => {
    if (!ticket) return;
    let isMounted = true;

    const performTranslation = async () => {
      const detected = detectLanguage(`${ticket.itemTitle || ''} ${ticket.description || ''}`);
      if (modalLang === 'orig' || detected === modalLang) {
        if (isMounted) setModalTransData(null);
        return;
      }

      setIsModalTranslating(true);
      try {
        const [titleRes, descRes] = await Promise.all([
          ticket.itemTitle ? translateText(ticket.itemTitle, modalLang, detected) : Promise.resolve({ translatedText: '' }),
          ticket.description ? translateText(ticket.description, modalLang, detected) : Promise.resolve({ translatedText: '' })
        ]);
        const transSubcat = ticket.subcategory ? translateSubcategory(ticket.subcategory, modalLang) : '';

        if (isMounted) {
          setModalTransData({
            title: titleRes.translatedText || ticket.itemTitle,
            description: descRes.translatedText || ticket.description,
            subcategory: transSubcat || ticket.subcategory,
            lang: modalLang,
            detected
          });
        }
      } catch (err) {
        // ignore
      } finally {
        if (isMounted) setIsModalTranslating(false);
      }
    };

    performTranslation();
    return () => { isMounted = false; };
  }, [ticket, modalLang]);

  // Note translator helper
  const handleTranslateNoteToEnglish = async () => {
    if (!notes || !notes.trim()) return;
    setIsTranslatingNotes(true);
    try {
      const res = await translateText(notes, 'en', 'auto');
      setTranslatedNotePreview(res.translatedText);
    } catch (e) {
      // ignore
    } finally {
      setIsTranslatingNotes(false);
    }
  };

  const renderNoteTranslatorHelper = () => {
    if (!notes || !notes.trim()) return null;
    return (
      <div style={{ marginTop: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleTranslateNoteToEnglish}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#818cf8',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: '600'
            }}
          >
            <Globe size={12} />
            {isTranslatingNotes ? (t.translator?.translating || 'Translating...') : (t.translator?.translateNoteForTeacher || '🌐 Translate note to English for Teacher')}
          </button>
        </div>

        {translatedNotePreview && (
          <div style={{
            marginTop: '6px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
              🇬🇧 English for Teacher: "{translatedNotePreview}"
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => {
                  setNotes(translatedNotePreview);
                  setTranslatedNotePreview(null);
                }}
                style={{
                  background: '#38bdf8',
                  color: '#000',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Use English
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotes(prev => `${prev}\n[EN for Teacher]: ${translatedNotePreview}`);
                  setTranslatedNotePreview(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Keep Both (RU + EN)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !ticket) return null;

  const deptMeta = resolveDepartment(ticket.department);
  const targetDept = deptMeta.id;

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
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    }
    onClose();
  };

  const handleITSubmit = (e, markResolved = false) => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || 'IT issue resolved and verified.');
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || 'IT technician diagnosing issue.');
    }
    onClose();
  };

  const handleCleaningSubmit = (e, markDone = false) => {
    e.preventDefault();
    if (markDone) {
      completeTicketDelivery(ticket.id, notes || 'Area thoroughly cleaned and sanitized.');
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || 'Cleaning staff in progress.');
    }
    onClose();
  };

  const handleEngineeringSubmit = (e, markResolved = false) => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || 'Electrical/Engineering maintenance completed and verified.');
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || 'Inspection and repair in progress.');
    }
    onClose();
  };

  const handlePlumbingSubmit = (e, markResolved = false) => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || 'Plumbing maintenance completed and leak/blockage resolved.');
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || 'Plumber diagnosing pipe, fixture or heating system.');
    }
    onClose();
  };

  const handleGroundsSubmit = (e, markResolved = false) => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || 'Grounds maintenance and safety measures completed.');
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || 'Grounds maintenance crew in progress.');
    }
    onClose();
  };

  const handleGeneralSubmit = (e, markResolved = false) => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || 'Request resolved and verified.');
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || 'Request in progress.');
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: '0' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '24px', maxHeight: '94vh', overflowY: 'auto', borderRadius: '24px 24px 0 0', margin: '0 auto' }}>

        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0 auto 16px' }} />
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: `${deptMeta.color}25`, border: `1px solid ${deptMeta.color}50`, padding: '9px', borderRadius: '10px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {deptMeta.emoji}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#fff' }}>
                {deptMeta.translations?.[lang] || deptMeta.name}
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
          
          {/* Translator Bar inside Snapshot */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
              <Globe size={13} />
              <span>{t.translator?.badge || 'Ticket Translator'}:</span>
              {modalTransData && (
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                  ({modalTransData.detected === 'en' ? 'English Request 🇬🇧' : modalTransData.detected.toUpperCase()})
                </span>
              )}
              {isModalTranslating && (
                <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={11} /> {t.translator?.translating || 'Translating...'}
                </span>
              )}
            </div>

            {/* Language switch buttons */}
            <div style={{ display: 'inline-flex', gap: '3px', background: 'rgba(15, 23, 42, 0.8)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => { setModalLang('ru'); setShowModalOriginal(false); }}
                style={{
                  background: modalLang === 'ru' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                  border: modalLang === 'ru' ? '1px solid #38bdf8' : 'none',
                  color: modalLang === 'ru' ? '#fff' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🇷🇺 Русский
              </button>
              <button
                type="button"
                onClick={() => { setModalLang('kk'); setShowModalOriginal(false); }}
                style={{
                  background: modalLang === 'kk' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                  border: modalLang === 'kk' ? '1px solid #38bdf8' : 'none',
                  color: modalLang === 'kk' ? '#fff' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🇰🇿 Қазақша
              </button>
              <button
                type="button"
                onClick={() => { setModalLang('orig'); setShowModalOriginal(false); }}
                style={{
                  background: modalLang === 'orig' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  border: modalLang === 'orig' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                  color: modalLang === 'orig' ? '#fff' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🇬🇧 Original
              </button>

              {modalTransData && (
                <button
                  type="button"
                  onClick={() => setShowModalOriginal(prev => !prev)}
                  title={showModalOriginal ? (t.translator?.showTranslation || 'Hide original') : (t.translator?.showOriginal || 'Show original')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: showModalOriginal ? '#38bdf8' : 'var(--text-muted)',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                {modalTransData ? modalTransData.title : ticket.itemTitle} {ticket.quantity ? `x ${ticket.quantity} ${ticket.unit}` : ''}
              </div>
              {modalTransData && showModalOriginal && (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                  English: "{ticket.itemTitle}"
                </div>
              )}
              {(modalTransData?.subcategory || ticket.subcategory) && (
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    🏷️ {modalTransData ? modalTransData.subcategory : ticket.subcategory}
                  </span>
                </div>
              )}
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

          {/* Description with Translation & Original */}
          {(modalTransData?.description || ticket.description) && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, fontStyle: 'italic', background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                "{modalTransData ? modalTransData.description : ticket.description}"
              </p>
              {modalTransData && showModalOriginal && ticket.description && (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 8px', borderRadius: '4px', borderLeft: '2px solid #38bdf8' }}>
                  Original English: "{ticket.description}"
                </div>
              )}
            </div>
          )}

          {/* Show existing ticket photos (submitted by requester) */}
          {ticket.photos && ticket.photos.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>📸 Submitted Photos:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ticket.photos.map((src, i) => (
                  <img key={i} src={src} alt={`ticket-photo-${i}`} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => window.open(src, '_blank')} />
                ))}
              </div>
            </div>
          )}

          {/* Show existing completion photos if already uploaded */}
          {ticket.completionPhotos && ticket.completionPhotos.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '6px', fontWeight: '600' }}>✅ Completion Photos:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ticket.completionPhotos.map((src, i) => (
                  <img key={i} src={src} alt={`completion-photo-${i}`} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #34d399', cursor: 'pointer' }} onClick={() => window.open(src, '_blank')} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Completion Photo Upload (shown for in-progress or pending tickets) */}
        {ticket.status !== 'completed' && ticket.status !== 'issued' && (
          <div style={{ marginBottom: '16px', background: 'rgba(52, 211, 153, 0.06)', border: '1px dashed rgba(52, 211, 153, 0.3)', padding: '12px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={14} /> Completion Photos <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>(optional, attach after-work photos)</span>
            </div>

            {completionPhotos.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {completionPhotos.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #34d399' }}>
                    <img src={src} alt={`cp-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeCompletionPhoto(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(15,23,42,0.85)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                      <X size={10} color="#f87171" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {completionPhotos.length < 5 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => completionCamRef.current?.click()} style={{ flex: 1, background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52,211,153,0.4)', borderRadius: '10px', padding: '10px', color: '#34d399', fontWeight: '600', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Camera size={18} /> Take Photo
                </button>
                <button type="button" onClick={() => completionFileRef.current?.click()} style={{ flex: 1, background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52,211,153,0.4)', borderRadius: '10px', padding: '10px', color: '#34d399', fontWeight: '600', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <ImagePlus size={18} /> Gallery
                </button>
              </div>
            )}

            <input ref={completionCamRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => { processCompletionFiles(e.target.files); e.target.value = ''; }} />
            <input ref={completionFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { processCompletionFiles(e.target.files); e.target.value = ''; }} />
          </div>
        )}

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

        {/* 2. FACILITIES / CARPENTRY / EVENT PREP WORKFLOW */}
        {(targetDept === 'facilities' || targetDept === 'carpentry' || targetDept === 'event_prep' || ticket.moveDetails) && (
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
                placeholder="e.g. Facilities Logistics Crew"
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

        {/* 3. IT HELPDESK WORKFLOW */}
        {(targetDept === 'it' || targetDept === 'it_helpdesk') && (
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
              {renderNoteTranslatorHelper()}
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

        {/* 6. ELECTRICAL & TECHNICAL UTILITIES WORKFLOW */}
        {(targetDept === 'engineering' || targetDept === 'electrical') && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={14} /> 💡 Electrical & Utility Inspection
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Diagnose lighting fixtures, circuits, switches, breakers, sockets, and electrical equipment.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {t.tickets.engineeringCompletedNotes || 'Diagnostics & Repair Notes'}
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Replaced LED driver ballast, rewired loose terminal, or tested socket voltage..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
              {renderNoteTranslatorHelper()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handleEngineeringSubmit(e, false)} style={{ background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', color: '#fbbf24', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ⚡ In Diagnostics / Repair
              </button>
              <button type="button" onClick={(e) => handleEngineeringSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Fixed & Operational
              </button>
            </div>
          </form>
        )}

        {/* 6a. PLUMBING WORKFLOW */}
        {targetDept === 'plumbing' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#06b6d4', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={14} /> 🔧 Plumbing & Heating Diagnostics
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Unclog drains, repair pipe leaks, replace faucet/flush mechanisms, bleed radiators.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Plumbing Action & Repair Notes
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Cleared drain blockage with auger, tightened valve gasket, bled radiator air..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
              {renderNoteTranslatorHelper()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handlePlumbingSubmit(e, false)} style={{ background: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06b6d4', color: '#06b6d4', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                🔧 In Diagnostics / Repair
              </button>
              <button type="button" onClick={(e) => handlePlumbingSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Plumbing Fixed
              </button>
            </div>
          </form>
        )}

        {/* 6b. GROUNDS & TERRITORY WORKFLOW */}
        {targetDept === 'grounds' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🌳</span> Grounds Maintenance & Campus Safety
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Snow/ice removal, walkway sanding, rooftop clearing, outdoor path safety.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Grounds Action Notes
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Cleared snow from entrance stairs, spread anti-slip sand along main pathway..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handleGroundsSubmit(e, false)} style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                🌳 In Progress
              </button>
              <button type="button" onClick={(e) => handleGroundsSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Grounds Work Complete
              </button>
            </div>
          </form>
        )}

        {/* 6c. ADMIN / BI EDUCATION / GENERAL WORKFLOW */}
        {(targetDept === 'admin' || targetDept === 'bi_education' || (targetDept === 'other' && !stockItem)) && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{deptMeta.emoji}</span> {deptMeta.translations?.[lang] || deptMeta.name} Action
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Process institutional appeals, administrative paperwork, or custom services.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                Resolution / Response Notes
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Log resolution steps, documents prepared, or administrative feedback..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                {t.common.cancel}
              </button>
              <button type="button" onClick={(e) => handleGeneralSubmit(e, false)} style={{ background: 'rgba(129, 140, 248, 0.2)', border: '1px solid #818cf8', color: '#818cf8', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                In Review
              </button>
              <button type="button" onClick={(e) => handleGeneralSubmit(e, true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Mark Resolved
              </button>
            </div>
          </form>
        )}

        {/* 7. RE-ROUTE / FORWARD TICKET TO ANOTHER FACILITY */}
        <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔄 Re-route / Transfer Ticket to Another Facility:
          </div>

          {transferSuccess ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
              ✓ Ticket successfully transferred to new facility!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {Object.values(DEPARTMENTS).map(fac => {
                if (fac.id === targetDept) return null;
                const facLabel = fac.translations?.[lang] || fac.name;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => {
                      const transferNote = `[Transferred to ${facLabel} by ${currentUser.name || 'Staff'}]: ${notes || 'Transferred for specialized facility resolution.'}`;
                      updateTicket(ticket.id, {
                        department: fac.id,
                        status: 'pending',
                        assignedWorker: null,
                        assignedRole: null,
                        notes: transferNote
                      });
                      setTransferSuccess(true);
                      setTimeout(() => {
                        setTransferSuccess(false);
                        onClose();
                      }, 1000);
                    }}
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: `1px solid ${fac.color}60`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = fac.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = `${fac.color}60`}
                  >
                    <span>{fac.emoji}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {facLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Also export as WorkerAActionModal for backwards compatibility
export const WorkerAActionModal = DepartmentActionModal;
