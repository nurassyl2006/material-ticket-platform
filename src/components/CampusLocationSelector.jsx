import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Building,
  Layers,
  DoorOpen,
  Footprints,
  Droplets,
  Utensils,
  Dumbbell,
  Compass,
  Edit3,
  School,
  Sparkles,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  CAMPUS_BLOCKS,
  CAMPUS_FLOORS,
  CAMPUS_ROOMS,
  recognizeRoom,
  getRoomsByBlockAndFloor,
  searchCampusRooms
} from '../campusRooms';

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
  const [areaType, setAreaType] = useState(() => {
    if (department === 'cleaning') return 'corridor';
    if (department === 'engineering') return 'classroom';
    return 'classroom';
  });

  // Try to parse initial value to pre-populate block/floor/room
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
    if (onChange) {
      onChange(formatted);
    }
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
      background: 'var(--bg-card, #242424)',
      border: '1px solid var(--border-color, #383838)',
      borderRadius: '10px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header with Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} color={department === 'storage' ? '#f59e0b' : 'var(--primary, #6366f1)'} />
          <label style={{ fontSize: '12px', fontWeight: '700', color: department === 'storage' ? '#f59e0b' : 'var(--text-main, #f3f2f1)' }}>
            {department === 'storage'
              ? (t?.tickets?.storageDeliveryRoom || 'Кабинет доставки (куда принести заказ со склада)')
              : (t?.tickets?.locationTitle || 'School Campus Location (Official Floor Plan)')} *
          </label>
        </div>

        <button
          type="button"
          onClick={() => setMode(m => m === 'structured' ? 'freeform' : 'structured')}
          style={{
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '11px',
            color: 'var(--text-muted, #adadad)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Edit3 size={11} />
          {mode === 'structured'
            ? (t?.tickets?.useFreeformLocation || 'Manual text')
            : (t?.tickets?.useStructuredLocation || 'Floor plan selector')}
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
              background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-main, #ffffff)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Smart Room Search & Instant Recognition Bar */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Smart room search: type code or name (e.g. A-1-2, Robotics, Pool, Math, D-3-1, 1A)..."
                value={roomSearchTerm}
                onChange={e => setRoomSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                  border: recognizedFromSearch ? '1px solid #10b981' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 32px',
                  color: 'var(--text-main, #ffffff)',
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

            {/* Instant AI Recognition Pill */}
            {recognizedFromSearch && (
              <div
                onClick={() => handleApplyRecognizedSearch(recognizedFromSearch)}
                style={{
                  marginTop: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <Sparkles size={13} color="#10b981" />
                  <span style={{ color: '#10b981', fontWeight: '700' }}>Recognized:</span>
                  <strong style={{ color: 'var(--text-main, #ffffff)' }}>
                    {recognizedFromSearch.fullLabel}
                  </strong>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600', textDecoration: 'underline' }}>
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
                background: 'var(--bg-dialog, #1e293b)',
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
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-main, #ffffff)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <strong style={{ color: '#818cf8', marginRight: '6px' }}>{s.code}</strong>
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

          {/* 1. Building Block & Floor Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            {/* Block Selection */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                1. Building Block (A, B, C, D)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                {blocksList.map(bKey => {
                  const isSelected = block === bKey;
                  const bMeta = CAMPUS_BLOCKS[bKey];
                  return (
                    <button
                      key={bKey}
                      type="button"
                      onClick={() => handleBlockChange(bKey)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                        border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: isSelected ? '#ffffff' : 'var(--text-main, #1e293b)',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>{bMeta.name}</div>
                      <div style={{ fontSize: '9px', opacity: isSelected ? 0.95 : 0.85, color: isSelected ? '#ffffff' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bMeta.title.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floor Selection */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                2. Floor (Basement, 1, 2, 3)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                {floorsList.map(fKey => {
                  const isSelected = floor === fKey;
                  const fMeta = CAMPUS_FLOORS[fKey];
                  return (
                    <button
                      key={fKey}
                      type="button"
                      onClick={() => handleFloorChange(fKey)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: isSelected ? '#ffffff' : 'var(--text-main, #1e293b)',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : '600',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {fMeta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Official Rooms from Architectural Floor Plan */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                3. Recognized Rooms ({CAMPUS_BLOCKS[block]?.name} • {CAMPUS_FLOORS[floor]?.label})
              </span>
              <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: '600' }}>
                {currentFloorRooms.length} rooms mapped
              </span>
            </div>

            {currentFloorRooms.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '5px',
                maxHeight: '170px',
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
                        background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                        border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: isSelected ? '#ffffff' : 'var(--text-main, #e2e8f0)',
                        fontSize: '11px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
                      }}
                    >
                      <div style={{ fontWeight: '700', color: isSelected ? 'var(--primary, #4f46e5)' : 'var(--text-main)', fontSize: '11px' }}>
                        {r.code}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: isSelected ? 'var(--text-main)' : 'var(--text-muted, #94a3b8)',
                        fontWeight: isSelected ? '600' : 'normal',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {r.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px' }}>
                No rooms mapped on this specific floor/block.
              </div>
            )}
          </div>

          {/* 3. Specific Detail (e.g. Near board, Stall 2, Window) */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
              4. Specific Spot / Notes (Optional)
            </div>
            <input
              type="text"
              placeholder="e.g. Near projector screen, Teacher desk, Window side..."
              value={specificSpot}
              onChange={e => handleSpotChange(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                borderRadius: '8px',
                padding: '7px 10px',
                color: 'var(--text-main, #ffffff)',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 4. Live Composed Preview Badge */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t?.tickets?.locationPreview || 'Confirmed Location'}:</span>
              <strong style={{ color: '#34d399' }}>
                {value || constructLocationString(block, floor, selectedRoomCode, specificSpot)}
              </strong>
            </div>
            <Sparkles size={14} color="#34d399" />
          </div>

        </div>
      )}
    </div>
  );
};
