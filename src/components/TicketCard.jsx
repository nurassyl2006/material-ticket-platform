import React, { useState, useEffect } from 'react';
import { 
  User, 
  Truck, 
  PhoneCall, 
  MessageSquare, 
  Globe, 
  Languages, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Clock,
  Check
} from 'lucide-react';
import { useApp } from '../AppContext';
import { translateText, detectLanguage, TRANSLATOR_LANGUAGES } from '../services/translator';
import { translateSubcategory } from '../departments';

export const TicketCard = ({
  ticket,
  targetLang = 'ru',
  autoTranslate = true,
  t,
  lang,
  role,
  currentUser,
  canProcessTicket,
  getProcessButtonLabel,
  getStatusBadge,
  getDepartmentBadge,
  getUrgencyBadge,
  renderLocationBadge,
  onSelectTicket,
  onCompleteTicket
}) => {
  const { markTicketReturnedByTeacher, confirmTicketReturn } = useApp();
  const [activeLang, setActiveLang] = useState(autoTranslate ? targetLang : 'orig');
  const [showOriginal, setShowOriginal] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState(null);

  const cleanPhone = (ticket.teacherPhone || '').replace(/[^\d+]/g, '');
  const targetDept = ticket.department || 'storage';
  const isCompleted = ticket.status === 'completed' || ticket.status === 'delivered';
  const isStorageManager = role === 'storage_manager' || role === 'workerA' || role === 'director' || role === 'admin';
  const isMyTicket = Boolean(
    (currentUser?.name && ticket.teacherName && ticket.teacherName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
    (currentUser?.id && ticket.createdById === currentUser.id) ||
    role === 'teacher'
  );

  // Detect original language of ticket
  const detectedSource = React.useMemo(() => {
    return detectLanguage(`${ticket.itemTitle || ''} ${ticket.description || ''}`);
  }, [ticket.itemTitle, ticket.description]);

  // Effect to automatically translate when autoTranslate is on or targetLang changes
  useEffect(() => {
    if (!autoTranslate) {
      return;
    }

    let isMounted = true;
    const performTranslation = async () => {
      // If already in target language, no need for translation
      if (detectedSource === targetLang) {
        if (isMounted) {
          setTranslatedData({
            title: ticket.itemTitle,
            description: ticket.description,
            notes: ticket.notes,
            subcategory: ticket.subcategory,
            lang: targetLang,
            sameAsSource: true
          });
        }
        return;
      }

      setIsTranslating(true);
      try {
        const [titleRes, descRes, notesRes] = await Promise.all([
          ticket.itemTitle ? translateText(ticket.itemTitle, targetLang, detectedSource) : Promise.resolve({ translatedText: '' }),
          ticket.description ? translateText(ticket.description, targetLang, detectedSource) : Promise.resolve({ translatedText: '' }),
          ticket.notes ? translateText(ticket.notes, targetLang, detectedSource) : Promise.resolve({ translatedText: '' })
        ]);

        const transSubcat = ticket.subcategory ? translateSubcategory(ticket.subcategory, targetLang) : '';

        if (isMounted) {
          setTranslatedData({
            title: titleRes.translatedText || ticket.itemTitle,
            description: descRes.translatedText || ticket.description,
            notes: notesRes.translatedText || ticket.notes,
            subcategory: transSubcat || ticket.subcategory,
            lang: targetLang
          });
          setActiveLang(targetLang);
        }
      } catch (err) {
        // Ignore translation error
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
  }, [ticket, targetLang, autoTranslate, detectedSource]);

  // Manual translation trigger for specific language
  const handleTranslateTo = async (destLang) => {
    if (destLang === 'orig') {
      setActiveLang('orig');
      return;
    }

    if (destLang === detectedSource) {
      setActiveLang('orig');
      return;
    }

    setIsTranslating(true);
    try {
      const [titleRes, descRes, notesRes] = await Promise.all([
        ticket.itemTitle ? translateText(ticket.itemTitle, destLang, detectedSource) : Promise.resolve({ translatedText: '' }),
        ticket.description ? translateText(ticket.description, destLang, detectedSource) : Promise.resolve({ translatedText: '' }),
        ticket.notes ? translateText(ticket.notes, destLang, detectedSource) : Promise.resolve({ translatedText: '' })
      ]);

      const transSubcat = ticket.subcategory ? translateSubcategory(ticket.subcategory, destLang) : '';

      setTranslatedData({
        title: titleRes.translatedText || ticket.itemTitle,
        description: descRes.translatedText || ticket.description,
        notes: notesRes.translatedText || ticket.notes,
        subcategory: transSubcat || ticket.subcategory,
        lang: destLang
      });
      setActiveLang(destLang);
      setShowOriginal(false);
    } catch (err) {
      // Ignore
    } finally {
      setIsTranslating(false);
    }
  };

  const isShowingTranslation = activeLang !== 'orig' && translatedData && !translatedData.sameAsSource;
  const displayTitle = isShowingTranslation ? translatedData.title : ticket.itemTitle;
  const displayDesc = isShowingTranslation ? translatedData.description : ticket.description;
  const displayNotes = isShowingTranslation ? translatedData.notes : ticket.notes;
  const displaySubcat = isShowingTranslation ? (translatedData.subcategory || ticket.subcategory) : ticket.subcategory;

  const currentLangLabel = activeLang === 'ru' ? 'Русский' : (activeLang === 'kk' ? 'Қазақша' : 'English');

  return (
    <div 
      className="glass-panel"
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-card, rgba(18, 25, 44, 0.75))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        borderRadius: '12px',
        borderLeft: `4px solid ${
          targetDept === 'it' ? '#3b82f6' :
          targetDept === 'cleaning' ? '#10b981' :
          targetDept === 'facilities' ? '#8b5cf6' :
          targetDept === 'security' ? '#ef4444' : '#f59e0b'
        }`,
        position: 'relative',
        boxShadow: 'var(--shadow-depth-2)',
        transition: 'all 0.18s ease'
      }}
    >
      {/* Top Row: Department, Title, Urgency, Status & Translation Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {getDepartmentBadge(ticket)}
            <span className="ticket-id-badge">#{ticket.id}</span>

            {/* Translation Badge & Toggle */}
            {isShowingTranslation && (
              <span className="ticket-badge-translated">
                <Globe size={11} /> {t.translator?.translatedTo || 'Translated to'} {currentLangLabel}
              </span>
            )}

            {isTranslating && (
              <span className="ticket-badge-translating">
                <Sparkles size={11} className="animate-spin" /> {t.translator?.translating || 'Translating...'}
              </span>
            )}
          </div>

          {/* Ticket Title */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
              {displayTitle}
              {ticket.quantity ? ` (${ticket.quantity} ${ticket.unit})` : ''}
            </h3>

            {/* Show Original English underneath if translated and requested */}
            {isShowingTranslation && showOriginal && ticket.itemTitle && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                Original: "{ticket.itemTitle}"
              </div>
            )}
          </div>
        </div>

        {/* Status Badge & Translation Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {getStatusBadge(ticket.status)}

            {/* Temporary Lesson Loan Status Badge */}
            {ticket.isReturnable && (
              ticket.returnStatus === 'borrowed' ? (
                <span className="ticket-badge-status" style={{ background: 'rgba(249, 115, 22, 0.18)', border: '1px solid #f97316', color: '#fb923c' }}>
                  <Clock size={12} /> {t.tickets?.status?.borrowed || 'On Loan (1-2 Lessons)'}
                </span>
              ) : ticket.returnStatus === 'returned_by_teacher' ? (
                <span className="ticket-badge-status" style={{ background: 'rgba(14, 165, 233, 0.18)', border: '1px solid #0284c7', color: '#38bdf8' }}>
                  <RotateCcw size={12} /> {t.tickets?.status?.returned_by_teacher || 'Returned • Awaiting Warehouse'}
                </span>
              ) : ticket.returnStatus === 'returned' ? (
                <span className="ticket-badge-status" style={{ background: 'rgba(16, 185, 129, 0.18)', border: '1px solid #10b981', color: '#34d399' }}>
                  <CheckCircle2 size={12} /> {t.tickets?.status?.returned || 'Returned to Warehouse'}
                </span>
              ) : (
                <span className="ticket-badge-status" style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#fed7aa', fontSize: '10px' }}>
                  ⏱️ {t.tickets?.loanNoticeShort || 'Temporary Loan'}
                </span>
              )
            )}
          </div>

          {/* Language Selector Buttons */}
          <div className="ticket-lang-switch">
            <button
              type="button"
              title="Перевести на русский"
              onClick={() => handleTranslateTo('ru')}
              className={`ticket-lang-btn ${activeLang === 'ru' ? 'active' : ''}`}
            >
              RU
            </button>
            <button
              type="button"
              title="Қазақшаға аудару"
              onClick={() => handleTranslateTo('kk')}
              className={`ticket-lang-btn ${activeLang === 'kk' ? 'active' : ''}`}
            >
              KK
            </button>
            <button
              type="button"
              title="Original text"
              onClick={() => handleTranslateTo('orig')}
              className={`ticket-lang-btn ${activeLang === 'orig' ? 'active-orig' : ''}`}
            >
              EN
            </button>

            {isShowingTranslation && (
              <button
                type="button"
                onClick={() => setShowOriginal(prev => !prev)}
                title={showOriginal ? (t.translator?.showTranslation || 'Hide original') : (t.translator?.showOriginal || 'Show original')}
                className="ticket-lang-btn-toggle"
              >
                {showOriginal ? 'Hide' : 'Orig'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Description */}
      {displayDesc && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
          {displayDesc}
        </p>
      )}

      {/* Relocation Logistics info */}
      {ticket.moveDetails && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderLeft: '3px solid #8b5cf6',
          padding: '8px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-main, #e2e8f0)',
          flexWrap: 'wrap'
        }}>
          <Truck size={14} color="#8b5cf6" />
          <span><strong>Relocation:</strong> {ticket.moveDetails.fromRoom} ➔ <strong style={{ color: 'var(--primary, #6366f1)' }}>{ticket.moveDetails.toRoom}</strong></span>
          {ticket.moveDetails.items && <span style={{ color: 'var(--text-muted, #94a3b8)' }}>({ticket.moveDetails.items})</span>}
        </div>
      )}

      {/* Materials / Purchase info */}
      {ticket.requiredMaterials && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderLeft: '3px solid #f59e0b',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'var(--text-main, #e2e8f0)'
        }}>
          <span style={{ color: 'var(--warning, #d97706)', fontWeight: '700' }}>📦 Materials: </span>
          <span>{ticket.requiredMaterials}</span>
          {ticket.estimatedCost && (
            <span style={{ color: 'var(--warning, #d97706)', marginLeft: '6px', fontWeight: '700' }}>
              (₸{ticket.estimatedCost.toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Photos Preview (if any) */}
      {ticket.photos && ticket.photos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Attachments ({ticket.photos.length})
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
            {ticket.photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt="attachment"
                onClick={() => window.open(photo, '_blank')}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '3px',
                  objectFit: 'cover',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completion Photos Proof (Fluent style) */}
      {ticket.completionPhotos && ticket.completionPhotos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '10px', color: '#107c41', fontWeight: '600', textTransform: 'uppercase' }}>
            Completion Proof ({ticket.completionPhotos.length})
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
            {ticket.completionPhotos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt="proof"
                onClick={() => window.open(photo, '_blank')}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '3px',
                  objectFit: 'cover',
                  border: '1px solid #107c41',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row: Metadata & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '2px' }}>
        
        {/* Left: Room, Requesting Teacher, Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
          {renderLocationBadge(ticket.roomNumber)}

          {(() => {
            const lowerName = (ticket.teacherName || '').toLowerCase();
            const isParentTicket = lowerName.includes('parent') || lowerName.includes('родитель') || lowerName.includes('ата-ана');
            const isGuestTicket = lowerName.includes('guest') || lowerName.includes('гость') || lowerName.includes('қонақ');

            return (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isParentTicket ? (
                  <span className="ticket-tag-parent">
                    👨‍👩‍👧 {t.auth?.parentTag || 'Parent'}
                  </span>
                ) : isGuestTicket ? (
                  <span className="ticket-tag-guest">
                    👤 {t.auth?.guestTag || 'Guest'}
                  </span>
                ) : (
                  <User size={12} color="var(--text-muted)" />
                )}
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{ticket.teacherName}</span>
                {cleanPhone && (
                  <span style={{ display: 'inline-flex', gap: '4px', marginLeft: '2px' }}>
                    <a href={`tel:${cleanPhone}`} title={t.profile?.call || 'Call'} style={{ color: '#107c41', padding: '1px', display: 'flex', alignItems: 'center' }}>
                      <PhoneCall size={12} />
                    </a>
                    <a href={`https://wa.me/${cleanPhone.replace('+', '')}`} target="_blank" rel="noopener noreferrer" title={t.profile?.whatsapp || 'WhatsApp'} style={{ color: '#62c789', padding: '1px', display: 'flex', alignItems: 'center' }}>
                      <MessageSquare size={12} />
                    </a>
                  </span>
                )}
              </span>
            );
          })()}

          <span style={{ color: 'var(--text-muted)' }}>{t.tickets.createdAt}: {new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Right: Handled by & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {ticket.assignedWorker && (
            <div className="ticket-assigned-pill">
              Assigned: <strong style={{ color: 'var(--text-main)' }}>{ticket.assignedWorker}</strong>
              {ticket.purchaseCost ? ` (Cost: ₸${ticket.purchaseCost.toLocaleString()})` : ''}
            </div>
          )}

          {/* Teacher: Return item to warehouse button */}
          {ticket.isReturnable && ticket.returnStatus === 'borrowed' && isMyTicket && (
            <button
              onClick={() => markTicketReturnedByTeacher(ticket.id)}
              className="fluent-btn-primary"
              style={{
                height: '28px',
                padding: '0 12px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid #38bdf8',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title={t.tickets?.returnItem || 'I Have Returned This Item to Warehouse'}
            >
              <RotateCcw size={13} />
              <span>{t.tickets?.returnItem || 'I Have Returned This Item'}</span>
            </button>
          )}

          {/* Storage Manager / Admin: Confirm receipt of returned item */}
          {ticket.isReturnable && (ticket.returnStatus === 'borrowed' || ticket.returnStatus === 'returned_by_teacher') && isStorageManager && (
            <button
              onClick={() => confirmTicketReturn(ticket.id)}
              className="fluent-btn-primary"
              style={{
                height: '28px',
                padding: '0 12px',
                fontSize: '12px',
                background: ticket.returnStatus === 'returned_by_teacher' 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title={t.tickets?.confirmReturnPrompt || 'Confirm return and restore warehouse inventory stock'}
            >
              <CheckCircle2 size={13} />
              <span>{t.tickets?.confirmReturn || 'Confirm Return to Warehouse'}</span>
            </button>
          )}

          {/* Department Processing Button (Fluent Primary) */}
          {canProcessTicket(ticket) && !isCompleted && !(ticket.isReturnable && ticket.returnStatus === 'borrowed') && (
            <button
              onClick={() => onSelectTicket(ticket)}
              className="fluent-btn-primary"
              style={{ height: '28px', padding: '0 12px', fontSize: '12px' }}
            >
              {getProcessButtonLabel(ticket)}
            </button>
          )}

          {/* Mark Completed Button (Fluent Success) */}
          {canProcessTicket(ticket) && !isCompleted && ticket.status !== 'pending' && !(ticket.isReturnable && ticket.returnStatus === 'borrowed') && (
            <button
              onClick={() => onCompleteTicket(ticket.id)}
              className="fluent-btn-primary"
              style={{ height: '28px', padding: '0 12px', fontSize: '12px', background: '#107c41' }}
            >
              <CheckCircle2 size={13} />
              <span>{t.tickets.markComplete}</span>
            </button>
          )}

        </div>

      </div>

      {/* Handler Notes Banner (if any) */}
      {displayNotes && (
        <div className="ticket-note-banner">
          Note: "{displayNotes}"
        </div>
      )}

    </div>
  );
};

export default TicketCard;
