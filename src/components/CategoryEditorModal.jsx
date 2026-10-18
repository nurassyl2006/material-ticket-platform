import React, { useState, useEffect } from 'react';
import { X, Layers, Clock, Package, Check } from 'lucide-react';

const EMOJI_PRESETS = ['✏️', '⏱️', '📢', '🪑', '💻', '⚡', '🧹', '❄️', '🔬', '📦', '🤖', '⚽', '🎵', '📚', '🎨', '🛡️', '🩺'];
const COLOR_PRESETS = ['#3b82f6', '#f97316', '#ec4899', '#f59e0b', '#06b6d4', '#eab308', '#10b981', '#38bdf8', '#a855f7', '#94a3b8'];

export const CategoryEditorModal = ({
  isOpen,
  onClose,
  categoryData,
  onSave,
  lang = 'en'
}) => {
  const isEditing = Boolean(categoryData && categoryData.id);

  const [formData, setFormData] = useState({
    id: '',
    icon: '📦',
    color: '#3b82f6',
    nameEn: '',
    nameRu: '',
    nameKk: '',
    shortEn: '',
    shortRu: '',
    defaultLocation: '',
    isReturnable: false,
    descEn: '',
    descRu: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoryData) {
      setFormData({
        id: categoryData.id || '',
        icon: categoryData.icon || '📦',
        color: categoryData.color || '#3b82f6',
        nameEn: categoryData.translations?.en || categoryData.nameEn || '',
        nameRu: categoryData.translations?.ru || categoryData.nameRu || '',
        nameKk: categoryData.translations?.kk || categoryData.nameKk || '',
        shortEn: categoryData.shortTranslations?.en || categoryData.shortEn || '',
        shortRu: categoryData.shortTranslations?.ru || categoryData.shortRu || '',
        defaultLocation: categoryData.defaultLocation || '',
        isReturnable: Boolean(categoryData.isReturnable),
        descEn: categoryData.description?.en || categoryData.descEn || '',
        descRu: categoryData.description?.ru || categoryData.descRu || ''
      });
    } else {
      setFormData({
        id: '',
        icon: '📦',
        color: '#3b82f6',
        nameEn: '',
        nameRu: '',
        nameKk: '',
        shortEn: '',
        shortRu: '',
        defaultLocation: 'Main Warehouse Central Shelf',
        isReturnable: false,
        descEn: '',
        descRu: ''
      });
    }
    setErrorMsg('');
  }, [categoryData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.id.trim()) {
      setErrorMsg('Category ID slug is required');
      return;
    }
    if (!formData.nameEn.trim()) {
      setErrorMsg('Category Name in English is required');
      return;
    }

    const cleanId = formData.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    setSaving(true);
    try {
      const payload = {
        ...formData,
        id: cleanId,
        key: cleanId,
        nameRu: formData.nameRu.trim() || formData.nameEn.trim(),
        nameKk: formData.nameKk.trim() || formData.nameEn.trim(),
        shortEn: formData.shortEn.trim() || formData.nameEn.trim(),
        shortRu: formData.shortRu.trim() || formData.nameRu.trim() || formData.nameEn.trim()
      };

      await onSave(payload, isEditing);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog-responsive"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          background: '#242424',
          border: '1px solid #383838',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #383838',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1f1f1f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{formData.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                {isEditing
                  ? (lang === 'ru' ? `Редактирование категории: ${formData.nameRu || formData.nameEn}` : `Edit Category: ${formData.nameEn}`)
                  : (lang === 'ru' ? 'Добавить категорию склада' : 'Create New Storage Category')}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#8a8a8a' }}>
                {lang === 'ru' ? 'Задайте параметры, политику возврата и расположение' : 'Define category details, return policy, and storage location'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8a8a',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorMsg && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Emoji & Color Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '5px' }}>
              Icon & Emoji
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {EMOJI_PRESETS.map((em, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: em }))}
                  style={{
                    fontSize: '16px',
                    padding: '6px 9px',
                    borderRadius: '8px',
                    background: formData.icon === em ? 'rgba(56, 189, 248, 0.25)' : '#1f1f1f',
                    border: `1px solid ${formData.icon === em ? '#38bdf8' : '#383838'}`,
                    cursor: 'pointer'
                  }}
                >
                  {em}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: c,
                    border: formData.color === c ? '2px solid #fff' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Category ID and Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                Category ID (Slug) *
              </label>
              <input
                type="text"
                disabled={isEditing}
                required
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                placeholder="e.g. robotics, sports"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isEditing ? '#181818' : '#1f1f1f',
                  border: '1px solid #383838',
                  color: isEditing ? '#8a8a8a' : '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                Title (English) *
              </label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="e.g. Robotics & STEM Kits"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#1f1f1f',
                  border: '1px solid #383838',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                Название (Русский)
              </label>
              <input
                type="text"
                value={formData.nameRu}
                onChange={(e) => setFormData(prev => ({ ...prev, nameRu: e.target.value }))}
                placeholder="например, Робототехника и STEM"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#1f1f1f',
                  border: '1px solid #383838',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#adadad', marginBottom: '4px' }}>
                Default Storage Location
              </label>
              <input
                type="text"
                value={formData.defaultLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultLocation: e.target.value }))}
                placeholder="e.g. Robotics Lab Cabinet 3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#1f1f1f',
                  border: '1px solid #383838',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Returnable Policy Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            background: formData.isReturnable ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            padding: '10px 12px',
            borderRadius: '8px',
            border: `1px solid ${formData.isReturnable ? 'rgba(249, 115, 22, 0.35)' : '#383838'}`
          }}>
            <input
              type="checkbox"
              checked={formData.isReturnable}
              onChange={(e) => setFormData(prev => ({ ...prev, isReturnable: e.target.checked }))}
              style={{ marginTop: '2px' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#f97316" />
                <span>{lang === 'ru' ? 'Временная выдача на 1-2 урока (С обязательным возвратом)' : 'Temporary Loan (1-2 Lessons • Returnable to Storage)'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#8a8a8a', marginTop: '2px' }}>
                {lang === 'ru'
                  ? 'При выдаче предмета учитель должен вернуть его после урока, а завскладом подтвердить возврат'
                  : 'Items in this category must be returned by the teacher and confirmed by the storage manager'}
              </div>
            </div>
          </label>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#1f1f1f',
                border: '1px solid #383838',
                color: '#adadad',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {lang === 'ru' ? 'Отмена' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0f6cbd, #2b88d8)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 108, 189, 0.4)'
              }}
            >
              {saving ? 'Saving...' : (lang === 'ru' ? 'Сохранить категорию' : 'Save Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
