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
  Sparkles
} from 'lucide-react';
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
  const [activeLang, setActiveLang] = useState(autoTranslate ? targetLang : 'orig');
  const [showOriginal, setShowOriginal] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState(null);

  const cleanPhone = (ticket.teacherPhone || '').replace(/[^\d+]/g, '');
  const targetDept = ticket.department || 'storage';
  const isCompleted = ticket.status === 'completed' || ticket.status === 'delivered';

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
        borderLeft: `4px solid ${
          targetDept === 'it' ? '#38bdf8' :
          targetDept === 'cleaning' ? '#34d399' :
          targetDept === 'facilities' ? '#a78bfa' :
          targetDept === 'security' ? '#f87171' : '#fbbf24'
        }`,
        position: 'relative'
      }}
    >
      {/* Top Row: Department, Title, Urgency, Status & Translation Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {getDepartmentBadge(ticket)}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>#{ticket.id}</span>
            {getUrgencyBadge(ticket.urgency)}

            {/* Translation Badge & Toggle */}
            {isShowingTranslation && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                <Globe size={11} /> {t.translator?.translatedTo || 'Translated to'} {currentLangLabel}
              </span>
            )}

            {isTranslating && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                <Sparkles size={11} className="animate-spin" /> {t.translator?.translating || 'Translating...'}
              </span>
            )}
          </div>

          {/* Ticket Title */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 1.3 }}>
              {displayTitle}
              {ticket.quantity ? ` (${ticket.quantity} ${ticket.unit})` : ''}
            </h3>

            {/* Show Original English underneath if translated and requested */}
            {isShowingTranslation && showOriginal && ticket.itemTitle && (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginTop: '3px' }}>
                Original: "{ticket.itemTitle}"
              </div>
            )}
          </div>
        </div>

        {/* Status Badge & Translation Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStatusBadge(ticket.status)}
          </div>

          {/* Language Selector Buttons */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '2px',
            gap: '2px'
          }}>
            <button
              type="button"
              title="Перевести на русский"
              onClick={() => handleTranslateTo('ru')}
              style={{
                background: activeLang === 'ru' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                border: activeLang === 'ru' ? '1px solid #38bdf8' : 'none',
                color: activeLang === 'ru' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🇷🇺 RU
            </button>
            <button
              type="button"
              title="Қазақшаға аудару"
              onClick={() => handleTranslateTo('kk')}
              style={{
                background: activeLang === 'kk' ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                border: activeLang === 'kk' ? '1px solid #38bdf8' : 'none',
                color: activeLang === 'kk' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🇰🇿 KK
            </button>
            <button
              type="button"
              title="Original text"
              onClick={() => handleTranslateTo('orig')}
              style={{
                background: activeLang === 'orig' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: activeLang === 'orig' ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                color: activeLang === 'orig' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🇬🇧 Orig
            </button>

            {isShowingTranslation && (
              <button
                type="button"
                onClick={() => setShowOriginal(prev => !prev)}
                title={showOriginal ? (t.translator?.showTranslation || 'Hide original') : (t.translator?.showOriginal || 'Show original')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: showOriginal ? '#38bdf8' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '2px 5px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RotateCcw size={10} />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Facilities Furniture Moving Info Banner (if present) */}
      {ticket.moveDetails && (
        <div style={{
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px dashed rgba(167, 139, 250, 0.4)',
          padding: '8px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#e2e8f0',
          flexWrap: 'wrap'
        }}>
          <Truck size={16} color="#a78bfa" />
          <span><strong>Relocation:</strong> {ticket.moveDetails.fromRoom} ➔ <strong style={{ color: '#a78bfa' }}>{ticket.moveDetails.toRoom}</strong></span>
          {ticket.moveDetails.items && <span style={{ color: 'var(--text-muted)' }}>({ticket.moveDetails.items})</span>}
        </div>
      )}

      {/* Description */}
      {(displayDesc || (showOriginal && ticket.description)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {displayDesc && (
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
              {displayDesc}
            </p>
          )}
          {isShowingTranslation && showOriginal && ticket.description && ticket.description !== displayDesc && (
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              fontStyle: 'italic',
              background: 'rgba(15, 23, 42, 0.4)',
              borderLeft: '2px solid rgba(56, 189, 248, 0.5)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              Original English: "{ticket.description}"
            </div>
          )}
        </div>
      )}

      {/* Attached Request Photos */}
      {ticket.photos && ticket.photos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>📸 Photos ({ticket.photos.length}):</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {ticket.photos.map((imgSrc, idx) => (
              <img 
                key={idx} 
                src={imgSrc} 
                alt={`ticket-photo-${idx}`}
                onClick={() => window.open(imgSrc, '_blank')}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completion Photos */}
      {ticket.completionPhotos && ticket.completionPhotos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>✅ Completed Work Proof:</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {ticket.completionPhotos.map((imgSrc, idx) => (
              <img 
                key={idx} 
                src={imgSrc} 
                alt={`completion-photo-${idx}`}
                onClick={() => window.open(imgSrc, '_blank')}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid #34d399',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row: Metadata & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
        
        {/* Left: Room, Requesting Teacher, Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
          {renderLocationBadge(ticket.roomNumber)}

          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={13} color="var(--text-muted)" /> {ticket.teacherName}
            {cleanPhone && (
              <span style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px' }}>
                <a href={`tel:${cleanPhone}`} title={t.profile.call} style={{ color: 'var(--accent-emerald)', padding: '2px', display: 'flex', alignItems: 'center' }}>
                  <PhoneCall size={12} />
                </a>
                <a href={`https://wa.me/${cleanPhone.replace('+', '')}`} target="_blank" rel="noopener noreferrer" title={t.profile.whatsapp} style={{ color: '#4ade80', padding: '2px', display: 'flex', alignItems: 'center' }}>
                  <MessageSquare size={12} />
                </a>
              </span>
            )}
          </span>

          <span>{t.tickets.createdAt}: {new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Right: Handler details & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Handled by info */}
          {ticket.assignedWorker && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 8px', borderRadius: '6px' }}>
              Assigned: <strong style={{ color: '#e2e8f0' }}>{ticket.assignedWorker}</strong>
              {ticket.purchaseCost ? ` (Cost: ₸${ticket.purchaseCost.toLocaleString()})` : ''}
            </div>
          )}

          {/* Department Processing Button */}
          {canProcessTicket(ticket) && !isCompleted && (
            <button
              onClick={() => onSelectTicket(ticket)}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
              }}
            >
              {getProcessButtonLabel(ticket)}
            </button>
          )}

          {/* Mark Completed Button */}
          {canProcessTicket(ticket) && !isCompleted && ticket.status !== 'pending' && (
            <button
              onClick={() => onCompleteTicket(ticket.id)}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                border: '1px solid var(--success)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={13} /> {t.tickets.markComplete}
            </button>
          )}

        </div>

      </div>

      {/* Handler Notes Banner (if any) */}
      {displayNotes && (
        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px' }}>
          Note: "{displayNotes}"
        </div>
      )}

    </div>
  );
};
