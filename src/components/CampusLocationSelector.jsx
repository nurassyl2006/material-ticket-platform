import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Building,
  Layers,
  DoorOpen,
  Edit3,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  CAMPUS_BLOCKS,
  CAMPUS_FLOORS,
  CAMPUS_ROOMS,
  recognizeRoom,
  getRoomsByBlockAndFloor,
  searchCampusRooms
} from '../campusRooms';

// Popular quick presets for high-frequency school locations
const POPULAR_LOCATIONS = [
  { label: '🏫 Library', code: 'D-3-1', block: 'blockD', floor: 'floor3', name: 'Library' },
  { label: '🍽️ Dining Hall', code: 'Canteen', block: 'blockD', floor: 'floor1', name: 'Dining Hall / Canteen' },
  { label: '⚽ Sports Hall', code: 'D-2-2', block: 'blockD', floor: 'floor2', name: 'Main Sports Hall' },
  { label: '💻 IT Lab', code: 'C-1-6', block: 'blockC', floor: 'floor1', name: 'IT 1' },
  { label: '🧪 Science Lab', code: 'C-3-6', block: 'blockC', floor: 'floor3', name: 'Science Laboratory 1' },
  { label: '🏊 Swimming Pool', code: 'Pool', block: 'blockD', floor: 'floor1', name: 'Swimming Pool' },
  { label: '🚻 Restroom', code: 'A-1-10', block: 'blockA', floor: 'floor1', name: 'Toilets & Stairs' },
  { label: '🎭 Assembly Hall', code: 'Lectorium', block: 'blockD', floor: 'floor1', name: 'Lectorium' }
];

export const CampusLocationSelector = ({
  value = '',
  onChange,
  department = 'engineering',
  t
}) => {
  const [mode, setMode] = useState('structured'); // 'structured' | 'freeform'
  const [block, setBlock] = useState('blockA');
  const [floor, setFloor] = useState('floor1');
  const [selectedRoomCode, setSelectedRoomCode] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [specificSpot, setSpecificSpot] = useState('');
  const [showAdvancedFloorGrid, setShowAdvancedFloorGrid] = useState(false);

  // Parse initial value to pre-populate block/floor/room
  useEffect(() => {
    if (value && typeof value === 'string') {
      const recognized = recognizeRoom(value);
      if (recognized) {
        setBlock(recognized.blockKey);
        setFloor(recognized.floorKey);
        setSelectedRoomCode(recognized.code);
      }
    }
  }, []);

  // Compute recognized room from search input
  const recognizedFromSearch = useMemo(() => {
    if (!roomSearchTerm.trim()) return null;
    return recognizeRoom(roomSearchTerm);
  }, [roomSearchTerm]);

  // Autocomplete suggestions
  const searchSuggestions = useMemo(() => {
    if (!roomSearchTerm.trim() || roomSearchTerm.length < 2) return [];
    return searchCampusRooms(roomSearchTerm, 6);
  }, [roomSearchTerm]);

  // Rooms on currently selected Block
  const blockRooms = useMemo(() => {
    const bLetter = block.replace('block', '');
    return CAMPUS_ROOMS.filter(r => r.block === bLetter);
  }, [block]);

  // Rooms on currently selected Block and Floor
  const currentFloorRooms = useMemo(() => {
    const floorNum = floor === 'basement' ? 0 : parseInt(floor.replace(/\D/g, ''), 10) || 1;
    return getRoomsByBlockAndFloor(block, floorNum);
  }, [block, floor]);

  // Construct official formatted location string
  const constructLocationString = (bKey, fKey, roomCode, spot) => {
    const blockMeta = CAMPUS_BLOCKS[bKey] || { name: bKey };
    const floorMeta = CAMPUS_FLOORS[fKey] || { label: fKey };

    const parts = [blockMeta.name, floorMeta.label];

    const matchedRoom = CAMPUS_ROOMS.find(r => r.code === roomCode);
    if (matchedRoom) {
      const roomDesc = matchedRoom.name ? `${matchedRoom.code} (${matchedRoom.name})` : matchedRoom.code;
      parts.push(roomDesc);
    } else if (roomCode) {
      parts.push(roomCode.startsWith('Room') ? roomCode : `Room ${roomCode}`);
    }

    if (spot && spot.trim()) {
      parts.push(spot.trim());
    }

    return parts.join(' • ');
  };

  const handleSelectRoom = (roomObj) => {
    const newBlockKey = `block${roomObj.block}`;
    const newFloorKey = roomObj.floor === 0 ? 'basement' : `floor${roomObj.floor}`;

    setBlock(newBlockKey);
    setFloor(newFloorKey);
    setSelectedRoomCode(roomObj.code);
    setRoomSearchTerm(roomObj.code);

    const formatted = constructLocationString(newBlockKey, newFloorKey, roomObj.code, specificSpot);
    if (onChange) onChange(formatted);
  };

  const handleSelectPreset = (preset) => {
    setBlock(preset.block);
    setFloor(preset.floor);
    setSelectedRoomCode(preset.code);
    setRoomSearchTerm(preset.code);

    const formatted = constructLocationString(preset.block, preset.floor, preset.code, specificSpot);
    if (onChange) onChange(formatted);
  };

  const handleBlockChange = (newBlockKey) => {
    setBlock(newBlockKey);
    setSelectedRoomCode('');
    const formatted = constructLocationString(newBlockKey, floor, '', specificSpot);
    if (onChange) onChange(formatted);
  };

  const handleFloorChange = (newFloorKey) => {
    setFloor(newFloorKey);
    setSelectedRoomCode('');
    const formatted = constructLocationString(block, newFloorKey, '', specificSpot);
    if (onChange) onChange(formatted);
  };

  const handleApplyRecognizedSearch = (recognized) => {
    if (!recognized) return;
    setBlock(recognized.blockKey);
    setFloor(recognized.floorKey);
    setSelectedRoomCode(recognized.code);
    setRoomSearchTerm(recognized.code);
    if (onChange) {
      onChange(recognized.formatted);
    }
  };

  const handleSpotChange = (val) => {
    setSpecificSpot(val);
    const formatted = constructLocationString(block, floor, selectedRoomCode, val);
    if (onChange) onChange(formatted);
  };

  const blocksList = ['blockA', 'blockB', 'blockC', 'blockD'];
  const floorsList = ['basement', 'floor1', 'floor2', 'floor3'];

  return (
    <div style={{
      background: 'var(--bg-subtle)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header with Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} color="var(--primary)" />
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
            {department === 'storage'
              ? (t?.tickets?.storageDeliveryRoom || 'Кабинет доставки (куда принести заказ со склада)')
              : (t?.tickets?.locationTitle || 'School Campus Location')} *
          </label>
        </div>

        <button
          type="button"
          onClick={() => setMode(m => m === 'structured' ? 'freeform' : 'structured')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Edit3 size={11} />
          {mode === 'structured'
            ? (t?.tickets?.useFreeformLocation || 'Manual text')
            : (t?.tickets?.useStructuredLocation || 'Location picker')}
        </button>
      </div>

      {mode === 'freeform' ? (
        <div>
          <input
            type="text"
            required
            placeholder="e.g. Block C • 1st Floor • C-1-5 (Robotics)"
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '9px 12px',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Quick Common Location Chips for 1-click select */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
              Quick Selection:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {POPULAR_LOCATIONS.map(loc => {
                const isSelected = selectedRoomCode === loc.code || (value && value.includes(loc.name));
                return (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => handleSelectPreset(loc)}
                    style={{
                      background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {loc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Room Search Bar with Live Suggestions */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search room: A-1-2, Robotics, Pool, Math, D-3-1, 1A..."
                value={roomSearchTerm}
                onChange={e => setRoomSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: recognizedFromSearch ? '1px solid #10b981' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 32px',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
              />
              {roomSearchTerm && (
                <button
                  type="button"
                  onClick={() => setRoomSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Instant Recognition Banner */}
            {recognizedFromSearch && (
              <div
                onClick={() => handleApplyRecognizedSearch(recognizedFromSearch)}
                style={{
                  marginTop: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <Sparkles size={14} color="#059669" />
                  <span style={{ color: '#059669', fontWeight: '700' }}>Match found:</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {recognizedFromSearch.fullLabel}
                  </strong>
                </div>
                <span style={{ fontSize: '10px', color: '#059669', fontWeight: '700', textDecoration: 'underline' }}>
                  Click to select
                </span>
              </div>
            )}

            {/* Dropdown Suggestions */}
            {searchSuggestions.length > 0 && !recognizedFromSearch && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginTop: '4px',
                zIndex: 50,
                boxShadow: 'var(--shadow-depth-8)',
                overflow: 'hidden'
              }}>
                {searchSuggestions.map(s => (
                  <div
                    key={s.code}
                    onClick={() => handleApplyRecognizedSearch(s)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <strong style={{ color: 'var(--primary)', marginRight: '6px' }}>{s.code}</strong>
                      <span>{s.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Block {s.block}, {s.floor === 0 ? 'Basement' : `${s.floor}F`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simple Dropdowns: Building Block & Room */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Building Block
              </label>
              <select
                value={block}
                onChange={e => handleBlockChange(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {blocksList.map(bKey => (
                  <option key={bKey} value={bKey}>
                    {CAMPUS_BLOCKS[bKey].name} ({CAMPUS_BLOCKS[bKey].title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Room / Area
              </label>
              <select
                value={selectedRoomCode}
                onChange={e => {
                  const r = blockRooms.find(item => item.code === e.target.value);
                  if (r) handleSelectRoom(r);
                }}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select Room --</option>
                {blockRooms.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.code} {r.name ? `(${r.name})` : ''} - {r.floor === 0 ? 'Basement' : `${r.floor}F`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expandable Floor Plan Browser (Optional for advanced users) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedFloorGrid(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0
              }}
            >
              <span>{showAdvancedFloorGrid ? 'Hide floor plan room grid' : 'Browse floor plan rooms by floor (1F, 2F, 3F)'}</span>
              {showAdvancedFloorGrid ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdvancedFloorGrid && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Floor buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {floorsList.map(fKey => {
                    const isSelected = floor === fKey;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => handleFloorChange(fKey)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontSize: '11px',
                          fontWeight: isSelected ? '700' : '500',
                          cursor: 'pointer'
                        }}
                      >
                        {CAMPUS_FLOORS[fKey].label}
                      </button>
                    );
                  })}
                </div>

                {/* Rooms on this floor */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '5px',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  paddingRight: '2px'
                }}>
                  {currentFloorRooms.map(r => {
                    const isSelected = selectedRoomCode === r.code;
                    return (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => handleSelectRoom(r)}
                        style={{
                          background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          fontSize: '11px',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: '700' }}>{r.code}</div>
                        <div style={{ fontSize: '9px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Specific Spot / Desk Notes */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Specific Spot / Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Near projector screen, Teacher desk, Window side..."
              value={specificSpot}
              onChange={e => handleSpotChange(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '7px 10px',
                color: 'var(--text-main)',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Live Selected Location Confirmation */}
          <div style={{
            background: 'var(--primary-tint)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Selected:</span>
              <strong style={{ color: 'var(--primary)' }}>
                {value || constructLocationString(block, floor, selectedRoomCode, specificSpot)}
              </strong>
            </div>
            <CheckCircle2 size={15} color="var(--primary)" />
          </div>

        </div>
      )}
    </div>
  );
};
