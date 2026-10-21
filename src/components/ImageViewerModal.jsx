import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { openImageInNewTab, downloadImage } from '../utils/imageUtils';

export const ImageViewerModal = ({
  photos = [],
  initialIndex = 0,
  isOpen = false,
  onClose,
  title = '',
  subtitle = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, (photos.length || 1) - 1)));
      setZoomLevel(1);
    }
  }, [isOpen, initialIndex, photos.length]);

  const activePhoto = photos[currentIndex] || '';
  const totalPhotos = photos.length;

  const handlePrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    setZoomLevel(1);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalPhotos - 1));
  }, [totalPhotos]);

  const handleNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    setZoomLevel(1);
    setCurrentIndex(prev => (prev < totalPhotos - 1 ? prev + 1 : 0));
  }, [totalPhotos]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleToggleZoom = () => {
    setZoomLevel(prev => (prev > 1 ? 1 : 1.8));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !activePhoto) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        animation: 'fadeIn 0.18s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Title & Photo Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              flexShrink: 0
            }}
          >
            <ImageIcon size={13} />
            <span>{currentIndex + 1} / {totalPhotos}</span>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            {title && (
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls (Zoom, Open in Tab, Download, Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: zoomLevel <= 1 ? '#64748b' : '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: zoomLevel <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Уменьшить (-)"
          >
            <ZoomOut size={16} />
          </button>

          {/* Zoom Level Indicator & Reset */}
          <button
            type="button"
            onClick={handleResetZoom}
            style={{
              background: zoomLevel > 1 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: zoomLevel > 1 ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: zoomLevel > 1 ? '#a5b4fc' : '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              minWidth: '46px',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Сбросить масштаб (0)"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: zoomLevel >= 3 ? '#64748b' : '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Увеличить (+)"
          >
            <ZoomIn size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />

          {/* Open in new tab (via safe blob) */}
          <button
            type="button"
            onClick={() => openImageInNewTab(activePhoto, title || 'photo')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.15s ease'
            }}
            title="Открыть в новой вкладке без ошибок"
          >
            <ExternalLink size={15} />
            <span className="hide-on-mobile">В новой вкладке</span>
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={() => downloadImage(activePhoto, `${(title || 'ticket_photo').replace(/[^\w\d-]/g, '_')}_${currentIndex + 1}.jpg`)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#34d399',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.15s ease'
            }}
            title="Скачать фото"
          >
            <Download size={15} />
            <span className="hide-on-mobile">Скачать</span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Закрыть (Esc)"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Previous Arrow Button */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease'
            }}
            title="Предыдущее фото (Стрелка влево)"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* Displayed Image */}
        <div
          style={{
            maxWidth: '92vw',
            maxHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: `scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in'
          }}
          onClick={handleToggleZoom}
          title={zoomLevel > 1 ? 'Нажмите для уменьшения' : 'Нажмите для увеличения'}
        >
          <img
            src={activePhoto}
            alt={title || `photo-${currentIndex + 1}`}
            style={{
              maxWidth: '90vw',
              maxHeight: '78vh',
              borderRadius: '12px',
              boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'auto',
              background: '#090d16'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div style="color: #f87171; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                    <div style="font-weight: 700;">Не удалось загрузить изображение</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Формат файла поврежден или данные недоступны.</div>
                  </div>
                `;
              }
            }}
          />
        </div>

        {/* Next Arrow Button */}
        {totalPhotos > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease'
            }}
            title="Следующее фото (Стрелка вправо)"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple photos) */}
      {totalPhotos > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'rgba(15, 23, 42, 0.75)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            overflowX: 'auto',
            zIndex: 10
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((photo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: idx === currentIndex ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.2)',
                background: '#090d16',
                padding: 0,
                cursor: 'pointer',
                opacity: idx === currentIndex ? 1 : 0.5,
                transform: idx === currentIndex ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <img
                src={photo}
                alt={`thumb-${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewerModal;
