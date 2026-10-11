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
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: '#292929',
        border: '1px solid #383838',
        borderRadius: '4px',
        borderLeft: `3px solid ${
          targetDept === 'it' ? '#0f6cbd' :
          targetDept === 'cleaning' ? '#107c41' :
          targetDept === 'facilities' ? '#5b5fc7' :
          targetDept === 'security' ? '#d13438' : '#d83b01'
        }`,
        position: 'relative',
        boxShadow: 'var(--shadow-depth-2)'
      }}
    >
      {/* Top Row: Department, Title, Urgency, Status & Translation Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {getDepartmentBadge(ticket)}
            <span style={{ fontSize: '11px', color: '#797775', fontWeight: '600' }}>#{ticket.id}</span>
            {getUrgencyBadge(ticket.urgency)}

            {/* Translation Badge & Toggle */}
            {isShowingTranslation && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#142436',
                border: '1px solid #154e7d',
                color: '#70b5f9',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                <Globe size={11} /> {t.translator?.translatedTo || 'Translated to'} {currentLangLabel}
              </span>
            )}

            {isTranslating && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#2d2314',
                color: '#f59e0b',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                <Sparkles size={11} className="animate-spin" /> {t.translator?.translating || 'Translating...'}
              </span>
            )}
          </div>

          {/* Ticket Title */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f3f2f1', margin: 0, lineHeight: 1.3 }}>
              {displayTitle}
              {ticket.quantity ? ` (${ticket.quantity} ${ticket.unit})` : ''}
            </h3>

            {/* Show Original English underneath if translated and requested */}
            {isShowingTranslation && showOriginal && ticket.itemTitle && (
              <div style={{ fontSize: '12px', color: '#adadad', fontStyle: 'italic', marginTop: '2px' }}>
                Original: "{ticket.itemTitle}"
              </div>
            )}
          </div>
        </div>

        {/* Status Badge & Translation Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getStatusBadge(ticket.status)}
          </div>

          {/* Language Selector Buttons */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#202020',
            border: '1px solid #383838',
            borderRadius: '3px',
            padding: '1px',
            gap: '1px'
          }}>
            <button
              type="button"
              title="Перевести на русский"
              onClick={() => handleTranslateTo('ru')}
              style={{
                background: activeLang === 'ru' ? '#0f6cbd' : 'transparent',
                border: 'none',
                color: activeLang === 'ru' ? '#fff' : '#adadad',
                borderRadius: '2px',
                padding: '2px 5px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              RU
            </button>
            <button
              type="button"
              title="Қазақшаға аудару"
              onClick={() => handleTranslateTo('kk')}
              style={{
                background: activeLang === 'kk' ? '#0f6cbd' : 'transparent',
                border: 'none',
                color: activeLang === 'kk' ? '#fff' : '#adadad',
                borderRadius: '2px',
                padding: '2px 5px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              KK
            </button>
            <button
              type="button"
              title="Original text"
              onClick={() => handleTranslateTo('orig')}
              style={{
                background: activeLang === 'orig' ? '#333333' : 'transparent',
                border: 'none',
                color: activeLang === 'orig' ? '#fff' : '#adadad',
                borderRadius: '2px',
                padding: '2px 5px',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              EN
            </button>

            {isShowingTranslation && (
              <button
                type="button"
                onClick={() => setShowOriginal(prev => !prev)}
                title={showOriginal ? (t.translator?.showTranslation || 'Hide original') : (t.translator?.showOriginal || 'Show original')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: showOriginal ? '#0f6cbd' : '#797775',
                  padding: '2px 4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {showOriginal ? 'Hide' : 'Orig'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Description */}
      {displayDesc && (
        <p style={{ fontSize: '13px', color: '#adadad', margin: 0, lineHeight: 1.45 }}>
          {displayDesc}
        </p>
      )}

      {/* Relocation Logistics info (Fluent style) */}
      {ticket.moveDetails && (
        <div style={{
          background: '#242424',
          border: '1px solid #383838',
          borderLeft: '3px solid #5b5fc7',
          padding: '6px 10px',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#d1d1d1',
          flexWrap: 'wrap'
        }}>
          <Truck size={14} color="#5b5fc7" />
          <span><strong>Relocation:</strong> {ticket.moveDetails.fromRoom} ➔ <strong style={{ color: '#8b8fe8' }}>{ticket.moveDetails.toRoom}</strong></span>
          {ticket.moveDetails.items && <span style={{ color: '#8a8a8a' }}>({ticket.moveDetails.items})</span>}
        </div>
      )}

      {/* Materials / Purchase info (Fluent style) */}
      {ticket.requiredMaterials && (
        <div style={{
          background: '#242424',
          border: '1px solid #383838',
          borderLeft: '3px solid #c19c00',
          padding: '6px 10px',
          borderRadius: '3px',
          fontSize: '11px',
          color: '#d1d1d1'
        }}>
          <span style={{ color: '#e0b500', fontWeight: '600' }}>📦 Materials: </span>
          <span>{ticket.requiredMaterials}</span>
          {ticket.estimatedCost && (
            <span style={{ color: '#e0b500', marginLeft: '6px', fontWeight: '600' }}>
              (₸{ticket.estimatedCost.toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Photos Preview (if any) */}
      {ticket.photos && ticket.photos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '10px', color: '#8a8a8a', fontWeight: '600', textTransform: 'uppercase' }}>
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
                  border: '1px solid #383838',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #383838', paddingTop: '8px', marginTop: '2px' }}>
        
        {/* Left: Room, Requesting Teacher, Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: '#adadad' }}>
          {renderLocationBadge(ticket.roomNumber)}

          {(() => {
            const lowerName = (ticket.teacherName || '').toLowerCase();
            const isParentTicket = lowerName.includes('parent') || lowerName.includes('родитель') || lowerName.includes('ата-ана');
            const isGuestTicket = lowerName.includes('guest') || lowerName.includes('гость') || lowerName.includes('қонақ');

            return (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isParentTicket ? (
                  <span style={{
                    background: '#231f2d',
                    color: '#c4b5fd',
                    border: '1px solid #3d3154',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    👨‍👩‍👧 {t.auth?.parentTag || 'Parent'}
                  </span>
                ) : isGuestTicket ? (
                  <span style={{
                    background: '#142436',
                    color: '#70b5f9',
                    border: '1px solid #154e7d',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    👤 {t.auth?.guestTag || 'Guest'}
                  </span>
                ) : (
                  <User size={12} color="#adadad" />
                )}
                <span>{ticket.teacherName}</span>
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

          <span>{t.tickets.createdAt}: {new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Right: Handled by & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {ticket.assignedWorker && (
            <div style={{ fontSize: '11px', color: '#adadad', background: '#202020', border: '1px solid #383838', padding: '3px 6px', borderRadius: '3px' }}>
              Assigned: <strong style={{ color: '#f3f2f1' }}>{ticket.assignedWorker}</strong>
              {ticket.purchaseCost ? ` (Cost: ₸${ticket.purchaseCost.toLocaleString()})` : ''}
            </div>
          )}

          {/* Department Processing Button (Fluent Primary) */}
          {canProcessTicket(ticket) && !isCompleted && (
            <button
              onClick={() => onSelectTicket(ticket)}
              className="fluent-btn-primary"
              style={{ height: '28px', padding: '0 12px', fontSize: '12px' }}
            >
              {getProcessButtonLabel(ticket)}
            </button>
          )}

          {/* Mark Completed Button (Fluent Success) */}
          {canProcessTicket(ticket) && !isCompleted && ticket.status !== 'pending' && (
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
        <div style={{ fontSize: '11px', color: '#adadad', fontStyle: 'italic', background: '#202020', border: '1px solid #383838', padding: '6px 10px', borderRadius: '3px' }}>
          Note: "{displayNotes}"
        </div>
      )}

    </div>
  );
};

export default TicketCard;
