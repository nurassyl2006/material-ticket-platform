import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { 
  CheckCircle2, 
  ShoppingBag, 
  User, 
  Building, 
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
  RotateCcw,
  XCircle,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';
import { DEPARTMENTS, resolveDepartment, translateSubcategory } from '../departments';
import { translateText, detectLanguage } from '../services/translator';
import { DeclineTicketModal } from './DeclineTicketModal';
import { ImageViewerModal } from './ImageViewerModal';

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
    lang,
    translatorTargetLang
  } = useApp();

  const [transferSuccess, setTransferSuccess] = useState(false);
  const [showTransferList, setShowTransferList] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    title: '',
    subtitle: ''
  });

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
      setShowTransferList(false);
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
              background: 'var(--primary-tint)',
              border: '1px solid var(--border-color)',
              color: 'var(--primary)',
              padding: '4px 10px',
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
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '600' }}>
              🇬🇧 English for Teacher: <span style={{ fontStyle: 'italic' }}>"{translatedNotePreview}"</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setNotes(translatedNotePreview);
                  setTranslatedNotePreview(null);
                }}
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
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
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
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
  const stockItem = inventory.find(i => {
    const iName = (i.name || '').toLowerCase();
    const tTitle = (ticket.itemTitle || '').toLowerCase();
    const tSub = (ticket.subcategory || '').toLowerCase();
    return iName === tTitle || iName.includes(tTitle) || tTitle.includes(iName) ||
      (tSub && (iName.includes(tSub) || tSub.includes(iName)));
  });
  const availableQty = stockItem ? stockItem.quantity : 0;
  const isEnoughStock = availableQty >= (ticket.quantity || 1);

  const cleanPhone = (ticket.teacherPhone || '').replace(/[^\d+]/g, '');

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: 'var(--text-main)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const handleStorageSubmit = (e, andDeliver = false) => {
    e.preventDefault();
    if (storageActionType === 'stock') {
      issueTicketFromStock(ticket.id, notes);
      if (andDeliver) {
        completeTicketDelivery(ticket.id, notes || `Delivered directly to room ${ticket.roomNumber}.`);
      }
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

  const handleStandardDeptSubmit = (e, markResolved = false, defaultProgressNote = 'Request in progress.', defaultDoneNote = 'Request resolved and verified.') => {
    e.preventDefault();
    if (markResolved) {
      completeTicketDelivery(ticket.id, notes || defaultDoneNote);
      if (completionPhotos.length > 0) addPhotosToTicket(ticket.id, completionPhotos, true);
    } else {
      startTicketWork(ticket.id, notes || defaultProgressNote);
    }
    onClose();
  };

  const renderCompletionPhotoPicker = () => {
    if (ticket.status === 'completed' || ticket.status === 'issued') return null;
    return (
      <div style={{ marginTop: '4px' }}>
        {completionPhotos.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {completionPhotos.map((src, idx) => (
              <div 
                key={idx} 
                className="ticket-photo-thumb ticket-photo-thumb-completion"
                style={{ position: 'relative', width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
                onClick={() => setViewerState({
                  isOpen: true,
                  photos: completionPhotos,
                  initialIndex: idx,
                  title: ticket.itemTitle,
                  subtitle: `New Completion Photo ${idx + 1}/${completionPhotos.length}`
                })}
              >
                <img src={src} alt={`cp-${idx}`} />
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); removeCompletionPhoto(idx); }} 
                  style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(15,23,42,0.85)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 3 }}
                  title="Remove"
                >
                  <X size={11} color="#ffffff" />
                </button>
              </div>
            ))}
          </div>
        )}

        {completionPhotos.length < 5 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => completionCamRef.current?.click()}
              style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: 'var(--text-main)',
                fontWeight: '600',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Camera size={14} color="var(--success)" />
              {lang === 'ru' ? 'Фото результата' : 'Take Proof Photo'}
            </button>
            <button
              type="button"
              onClick={() => completionFileRef.current?.click()}
              style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: 'var(--text-main)',
                fontWeight: '600',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <ImagePlus size={14} color="var(--success)" />
              {lang === 'ru' ? 'Из галереи' : 'Attach Photo'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {lang === 'ru' ? '(фото выполненной работы, необязательно)' : '(optional completion proof)'}
            </span>
          </div>
        )}

        <input ref={completionCamRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={e => { processCompletionFiles(e.target.files); e.target.value = ''; }} />
        <input ref={completionFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { processCompletionFiles(e.target.files); e.target.value = ''; }} />
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="fluent-card animate-fade-in modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '580px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          margin: '0 auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-depth-16)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-tint)', border: '1px solid var(--border-color)', width: '42px', height: '42px', borderRadius: '12px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {deptMeta.emoji}
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                {deptMeta.translations?.[lang] || deptMeta.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Ticket #{ticket.id} • {lang === 'ru' ? 'Исполнитель' : 'Handler'}: <strong style={{ color: 'var(--text-main)' }}>{currentUser.name}</strong>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {ticket.status !== 'rejected' && ticket.status !== 'declined' && ticket.status !== 'completed' && (
              <button
                type="button"
                onClick={() => setShowDeclineModal(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                title={t.tickets?.declineTicket || 'Decline Request'}
              >
                <XCircle size={14} />
                <span>{t.tickets?.decline || 'Decline'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── TICKET SUMMARY CARD ───────────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-subtle)',
          padding: '16px',
          borderRadius: '14px',
          marginBottom: '18px',
          border: '1px solid var(--border-color)'
        }}>
          {/* Translator Bar inside Snapshot */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>
              <Globe size={13} />
              <span>{t.translator?.badge || 'Language'}:</span>
              {isModalTranslating && (
                <span style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={11} /> {t.translator?.translating || 'Translating...'}
                </span>
              )}
            </div>

            {/* Language switch buttons */}
            <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--bg-card)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {[
                { code: 'ru', label: '🇷🇺 RU' },
                { code: 'kk', label: '🇰🇿 KK' },
                { code: 'orig', label: '🇬🇧 Orig' }
              ].map(lBtn => {
                const active = modalLang === lBtn.code;
                return (
                  <button
                    key={lBtn.code}
                    type="button"
                    onClick={() => { setModalLang(lBtn.code); setShowModalOriginal(false); }}
                    style={{
                      background: active ? 'var(--primary)' : 'transparent',
                      border: 'none',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                      borderRadius: '6px',
                      padding: '3px 9px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {lBtn.label}
                  </button>
                );
              })}

              {modalTransData && (
                <button
                  type="button"
                  onClick={() => setShowModalOriginal(prev => !prev)}
                  title="Show original text"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: showModalOriginal ? 'var(--primary)' : 'var(--text-muted)',
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

          {/* Request Title & Subcategory */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.3 }}>
              {modalTransData ? modalTransData.title : ticket.itemTitle}
              {ticket.quantity ? ` (${ticket.quantity} ${ticket.unit || 'pcs'})` : ''}
            </div>
            {modalTransData && showModalOriginal && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                Original: "{ticket.itemTitle}"
              </div>
            )}
            {(modalTransData?.subcategory || ticket.subcategory) && (
              <div style={{ marginTop: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--primary)',
                  background: 'var(--primary-tint)',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  display: 'inline-block'
                }}>
                  🏷️ {modalTransData ? modalTransData.subcategory : ticket.subcategory}
                </span>
              </div>
            )}
          </div>

          {/* Location & Requester Contact Row */}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: (modalTransData?.description || ticket.description || (ticket.photos && ticket.photos.length > 0)) ? '10px' : '0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-main)', fontWeight: '600' }}>
              <Building size={14} color="var(--primary)" /> {ticket.roomNumber}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <User size={14} /> <strong style={{ color: 'var(--text-main)' }}>{ticket.teacherName}</strong>
            </span>
            {cleanPhone && (
              <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={`tel:${cleanPhone}`}
                  style={{
                    color: 'var(--success)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <PhoneCall size={12} /> Call
                </a>
                <a
                  href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--success)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <MessageSquare size={12} /> WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {(modalTransData?.description || ticket.description) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-main)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '10px 12px',
                borderRadius: '10px',
                lineHeight: 1.45
              }}>
                "{modalTransData ? modalTransData.description : ticket.description}"
              </div>
              {modalTransData && showModalOriginal && ticket.description && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '8px', borderLeft: '2px solid var(--primary)' }}>
                  Original: "{ticket.description}"
                </div>
              )}
            </div>
          )}

          {/* Submitted Photos */}
          {ticket.photos && ticket.photos.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                📸 Attached Photos ({ticket.photos.length}):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ticket.photos.map((src, i) => (
                  <div
                    key={i}
                    className="ticket-photo-thumb"
                    onClick={() => setViewerState({
                      isOpen: true,
                      photos: ticket.photos,
                      initialIndex: i,
                      title: ticket.itemTitle,
                      subtitle: `Ticket #${ticket.id} • ${ticket.teacherName || 'Requester'}`
                    })}
                  >
                    <img src={src} alt={`ticket-photo-${i + 1}`} />
                    <div className="ticket-photo-thumb-overlay">
                      <ZoomIn size={18} color="#fff" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Completion Photos */}
          {ticket.completionPhotos && ticket.completionPhotos.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--success)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                ✅ Completion Photos ({ticket.completionPhotos.length}):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ticket.completionPhotos.map((src, i) => (
                  <div
                    key={i}
                    className="ticket-photo-thumb ticket-photo-thumb-completion"
                    onClick={() => setViewerState({
                      isOpen: true,
                      photos: ticket.completionPhotos,
                      initialIndex: i,
                      title: ticket.itemTitle,
                      subtitle: `Ticket #${ticket.id} • Completion Proof`
                    })}
                  >
                    <img src={src} alt={`completion-photo-${i + 1}`} />
                    <div className="ticket-photo-thumb-overlay">
                      <ZoomIn size={18} color="#34d399" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 1. STORAGE MANAGER WORKFLOW ───────────────────────────────────── */}
        {targetDept === 'storage' && (
          <div>
            {/* Delivery destination card */}
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid var(--warning)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                  🚚 {lang === 'ru' ? 'Кабинет доставки' : lang === 'kk' ? 'Жеткізу кабинеті' : 'Delivery Destination'}
                </span>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                  {ticket.roomNumber || 'Main Campus'}
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--primary)', marginLeft: '8px', fontWeight: '700' }}>
                  ({ticket.quantity || 1} {ticket.unit || 'pcs'})
                </span>
              </div>

              {ticket.status === 'issued' && (
                <button
                  type="button"
                  onClick={() => {
                    completeTicketDelivery(ticket.id, notes || `Delivered to classroom ${ticket.roomNumber}`);
                    onClose();
                  }}
                  style={{
                    background: 'var(--success)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Truck size={14} /> {lang === 'ru' ? '✓ Подтвердить доставку' : '✓ Confirm Delivered'}
                </button>
              )}
            </div>

            {ticket.isReturnable && (
              <div style={{
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-main)'
              }}>
                <span style={{ fontSize: '18px' }}>⏱️</span>
                <div>
                  <strong style={{ color: 'var(--warning)', display: 'block' }}>
                    {lang === 'ru' ? 'Временная выдача на 1–2 урока (С возвратом)' : 'Temporary Lesson Loan (Returnable)'}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'ru'
                      ? 'Предмет выдается на время урока с последующим возвратом на склад.'
                      : 'Issued for class duration; teacher will return it afterwards.'}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setStorageActionType('stock')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: storageActionType === 'stock' ? '2px solid var(--success)' : '1px solid var(--border-color)',
                  background: storageActionType === 'stock' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-subtle)',
                  textAlign: 'left',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--success)', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 size={16} /> {t.tickets.issueFromStock}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  In Stock: <strong style={{ color: isEnoughStock ? 'var(--success)' : 'var(--danger)' }}>{availableQty} {ticket.unit}</strong>
                  {stockItem?.location && <span style={{ marginLeft: '6px' }}>• 📍 {stockItem.location}</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStorageActionType('purchase')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: storageActionType === 'purchase' ? '2px solid var(--warning)' : '1px solid var(--border-color)',
                  background: storageActionType === 'purchase' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-subtle)',
                  textAlign: 'left',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--warning)', fontWeight: '700', fontSize: '13px' }}>
                  <ShoppingBag size={16} /> {t.tickets.markToPurchase}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {lang === 'ru' ? 'Закупить у поставщика' : 'Order from Supplier'}
                </div>
              </button>
            </div>

            <form onSubmit={handleStorageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {storageActionType === 'purchase' && (
                <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                      {t.tickets.purchaseCost} *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 15000"
                      value={purchaseCost}
                      onChange={e => setPurchaseCost(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                      {t.tickets.supplier}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abdi / Local Store"
                      value={supplier}
                      onChange={e => setSupplier(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  {t.tickets.notes}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'ru' ? 'Комментарий к выдаче или доставке...' : 'Notes for teacher and warehouse records...'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button type="button" onClick={onClose} className="fluent-btn-secondary" style={{ borderRadius: '10px', height: '38px' }}>
                  {t.common.cancel}
                </button>
                {storageActionType === 'stock' && (
                  <button
                    type="button"
                    onClick={(e) => handleStorageSubmit(e, true)}
                    style={{
                      background: 'var(--success)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0 16px',
                      height: '38px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Truck size={14} /> {lang === 'ru' ? '✓ Выдать и доставить' : '✓ Issue & Deliver'}
                  </button>
                )}
                <button
                  type="submit"
                  className="fluent-btn-primary"
                  style={{ height: '38px', borderRadius: '10px', padding: '0 18px', fontSize: '12px', fontWeight: '700' }}
                >
                  {storageActionType === 'stock'
                    ? (ticket.isReturnable
                        ? (lang === 'ru' ? '⏱️ Выдать на урок' : '⏱️ Issue on Loan')
                        : (lang === 'ru' ? '✓ Выдать со склада' : '✓ Issue from Stock'))
                    : (lang === 'ru' ? '🛒 Отправить в закуп' : '🛒 Confirm Purchase Order')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── 2. FACILITIES / CARPENTRY / EVENT PREP WORKFLOW ───────────────── */}
        {(targetDept === 'facilities' || targetDept === 'carpentry' || targetDept === 'event_prep' || ticket.moveDetails) && targetDept !== 'storage' && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={15} /> {lang === 'ru' ? 'Детали перемещения / работ' : 'Relocation & Setup Details'}
              </div>
              
              <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', fontWeight: '600' }}>{t.tickets.fromRoom}</label>
                  <input
                    type="text"
                    value={fromRoom}
                    onChange={e => setFromRoom(e.target.value)}
                    placeholder="Origin (e.g. Room 102)"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', fontWeight: '600' }}>{t.tickets.toRoom}</label>
                  <input
                    type="text"
                    value={toRoom}
                    onChange={e => setToRoom(e.target.value)}
                    placeholder="Destination (e.g. Assembly Hall)"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px', fontWeight: '600' }}>{t.tickets.furnitureItems}</label>
                <input
                  type="text"
                  value={furnitureItems}
                  onChange={e => setFurnitureItems(e.target.value)}
                  placeholder="e.g. 15 student desks, 30 chairs"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                {t.tickets.notes}
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={lang === 'ru' ? 'Комментарий о выполненной работе...' : 'Work or repair notes...'}
                style={inputStyle}
              />
              {renderNoteTranslatorHelper()}
            </div>

            {renderCompletionPhotoPicker()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button type="button" onClick={onClose} className="fluent-btn-secondary" style={{ height: '38px', borderRadius: '10px' }}>
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={(e) => handleFacilitiesSubmit(e, false)}
                style={{
                  background: 'var(--primary-tint)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  padding: '0 14px',
                  height: '38px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Play size={13} /> {lang === 'ru' ? 'Взять в работу' : 'Mark In Progress'}
              </button>
              <button
                type="button"
                onClick={(e) => handleFacilitiesSubmit(e, true)}
                style={{
                  background: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 18px',
                  height: '38px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={15} /> {lang === 'ru' ? 'Завершить заявку' : 'Mark Completed'}
              </button>
            </div>
          </form>
        )}

        {/* ── 3. UNIFIED WORKFLOW FOR IT, CLEANING, ENGINEERING, PLUMBING, GROUNDS, SECURITY, GENERAL ── */}
        {targetDept !== 'storage' && targetDept !== 'facilities' && targetDept !== 'carpentry' && targetDept !== 'event_prep' && !ticket.moveDetails && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-main)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                {lang === 'ru' ? 'Комментарий специалиста / Что было сделано:' : lang === 'kk' ? 'Маманның түсініктемесі / Не істелді:' : 'Resolution / Work Notes:'}
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Опишите результат работы или причину проверки (необязательно)...'
                    : 'Briefly describe what was fixed or checked (optional)...'
                }
                style={inputStyle}
              />
              {renderNoteTranslatorHelper()}
            </div>

            {renderCompletionPhotoPicker()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                className="fluent-btn-secondary"
                style={{ height: '40px', borderRadius: '10px', padding: '0 16px' }}
              >
                {t.common.cancel}
              </button>

              {ticket.status === 'pending' && (
                <button
                  type="button"
                  onClick={(e) => handleStandardDeptSubmit(e, false)}
                  style={{
                    background: 'var(--primary-tint)',
                    border: '1.5px solid var(--primary)',
                    color: 'var(--primary)',
                    padding: '0 16px',
                    height: '40px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Play size={14} />
                  {lang === 'ru' ? 'Принять в работу' : lang === 'kk' ? 'Жұмысқа қабылдау' : 'Accept & Start Work'}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleStandardDeptSubmit(e, true)}
                style={{
                  background: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0 20px',
                  height: '40px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                <CheckCircle2 size={16} />
                {lang === 'ru' ? 'Выполнено (Закрыть заявку)' : lang === 'kk' ? 'Орындалды (Жабу)' : 'Mark Completed'}
              </button>
            </div>
          </form>
        )}

        {/* ── COLLAPSIBLE RE-ROUTE / TRANSFER TICKET ────────────────────────── */}
        <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setShowTransferList(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '4px 0'
            }}
          >
            <span>🔄 {lang === 'ru' ? 'Не ваш профиль? Перенаправить в другую службу' : 'Wrong department? Transfer ticket to another team'}</span>
            {showTransferList ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {transferSuccess && (
            <div style={{ marginTop: '8px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
              ✓ {lang === 'ru' ? 'Заявка перенаправлена в другую службу!' : 'Ticket transferred!'}
            </div>
          )}

          {showTransferList && !transferSuccess && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '8px', marginTop: '10px' }}>
              {Object.values(DEPARTMENTS).map(fac => {
                if (fac.id === targetDept) return null;
                const facLabel = fac.translations?.[lang] || fac.name;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => {
                      const transferNote = `[Transferred to ${facLabel} by ${currentUser.name || 'Staff'}]: ${notes || 'Transferred for specialized resolution.'}`;
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
                      }, 900);
                    }}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{fac.emoji}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {facLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Decline Ticket Modal */}
        <DeclineTicketModal
          ticket={ticket}
          isOpen={showDeclineModal}
          onClose={() => setShowDeclineModal(false)}
          onDeclineSuccess={() => {
            setShowDeclineModal(false);
            onClose();
          }}
        />

        {/* Full-Screen Lightbox Image Viewer */}
        <ImageViewerModal
          {...viewerState}
          onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        />

      </div>
    </div>
  );
};

// Also export as WorkerAActionModal for backwards compatibility
export const WorkerAActionModal = DepartmentActionModal;
