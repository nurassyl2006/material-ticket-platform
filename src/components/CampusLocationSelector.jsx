import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

export const CampusLocationSelector = ({
  value = '',
  onChange,
  department = 'engineering',
  t
}) => {
  const [mode, setMode] = useState('structured'); // 'structured' | 'freeform'
  const [block, setBlock] = useState('blockA');
  const [floor, setFloor] = useState('floor2');
  const [areaType, setAreaType] = useState(() => {
    if (department === 'cleaning') return 'corridor';
    if (department === 'engineering') return 'classroom';
    return 'classroom';
  });
  const [specificSpot, setSpecificSpot] = useState('');
  const [customRoom, setCustomRoom] = useState('');

  // Synchronize initial default area type if department switches
  useEffect(() => {
    if (department === 'cleaning' && (areaType === 'classroom' || !areaType)) {
      setAreaType('corridor');
    }
  }, [department]);

  // Construct structured location string
  const constructLocationString = (b, f, type, spot, custom) => {
    const blockText = t?.tickets?.blocks?.[b] || b || 'Block A';
    const floorText = t?.tickets?.floors?.[f] || f || '2nd Floor';
    const typeText = t?.tickets?.areaTypes?.[type] || type || 'Room';

    const parts = [blockText, floorText];

    const detailText = custom.trim() || spot.trim();

    if (type === 'classroom') {
      if (detailText) {
        parts.push(detailText.startsWith('Room') || detailText.startsWith('Кабинет') ? detailText : `Room ${detailText}`);
      } else {
        parts.push(typeText);
      }
    } else {
      if (detailText) {
        parts.push(`${typeText} (${detailText})`);
      } else {
        parts.push(typeText);
      }
    }

    return parts.join(' • ');
  };

  // Trigger change whenever structured options change
  const handleUpdate = (newB, newF, newType, newSpot, newCustom) => {
    setBlock(newB);
    setFloor(newF);
    setAreaType(newType);
    setSpecificSpot(newSpot);
    setCustomRoom(newCustom);

    const formatted = constructLocationString(newB, newF, newType, newSpot, newCustom);
    if (onChange) {
      onChange(formatted);
    }
  };

  const areaTypeIcons = {
    classroom: DoorOpen,
    corridor: Footprints,
    restroom: Droplets,
    cafeteria: Utensils,
    gym: Dumbbell,
    stairs: Compass,
    library: School,
    other: MapPin
  };

  const areaTypeColors = {
    classroom: '#38bdf8',
    corridor: '#34d399',
    restroom: '#a78bfa',
    cafeteria: '#fbbf24',
    gym: '#f97316',
    stairs: '#94a3b8',
    library: '#818cf8',
    other: '#f43f5e'
  };

  const blocksList = ['blockA', 'blockB', 'blockC', 'blockD', 'outdoor'];
  const floorsList = ['basement', 'floor1', 'floor2', 'floor3', 'floor4'];

  // Quick spot recommendations based on selected area type
  const getAreaSpots = () => {
    const q = t?.tickets?.quickSpots || {};
    switch (areaType) {
      case 'restroom':
        return [
          q.girlsRestroom || 'Girls Restroom',
          q.boysRestroom || 'Boys Restroom',
          q.staffRestroom || 'Staff Restroom',
          q.accessibleRestroom || 'Accessible WC'
        ];
      case 'corridor':
        return [
          q.northCorridor || 'North Wing',
          q.centralHall || 'Central Hallway',
          q.southCorridor || 'South Wing',
          q.nearElevator || 'Near Elevators'
        ];
      case 'classroom':
        return [
          'Room 101',
          'Room 204',
          'Room 305',
          'Physics Lab',
          'Chemistry Lab',
          'Computer Lab'
        ];
      case 'cafeteria':
        return [
          q.mainDining || 'Main Dining Area',
          q.foodCounter || 'Serving Counter',
          'Kitchen Entrance',
          'Staff Tables'
        ];
      case 'gym':
        return [
          q.mainGym || 'Main Sports Hall',
          q.lockerRoom || 'Locker Rooms',
          'Gymnasium 2',
          'Fitness Room'
        ];
      case 'stairs':
        return [
          q.mainEntrance || 'Main Entrance Lobby',
          q.eastStairs || 'East Stairwell',
          q.westStairs || 'West Stairwell'
        ];
      default:
        return [];
    }
  };

  const spots = getAreaSpots();

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.45)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header with Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} color="var(--primary)" />
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
            {t?.tickets?.locationTitle || 'School Campus Location (Block, Floor & Area)'} *
          </label>
        </div>

        <button
          type="button"
          onClick={() => setMode(m => m === 'structured' ? 'freeform' : 'structured')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
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
            ? (t?.tickets?.useFreeformLocation || 'Manual input')
            : (t?.tickets?.useStructuredLocation || 'Interactive map')}
        </button>
      </div>

      {mode === 'freeform' ? (
        <div>
          <input
            type="text"
            required
            placeholder="e.g. Block A, 2nd Floor, Girls Restroom (near 204)"
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. Area Type Chips (Classroom, Corridor, Restroom, etc.) */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. {t?.tickets?.areaType || 'Area Type'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
              {Object.keys(areaTypeIcons).map(typeKey => {
                const Icon = areaTypeIcons[typeKey];
                const isSelected = areaType === typeKey;
                const activeColor = areaTypeColors[typeKey] || 'var(--primary)';
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => handleUpdate(block, floor, typeKey, '', customRoom)}
                    style={{
                      background: isSelected ? `${activeColor}22` : 'rgba(30, 41, 59, 0.5)',
                      border: `1px solid ${isSelected ? activeColor : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '7px 10px',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: isSelected ? '700' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={14} color={isSelected ? activeColor : 'var(--text-muted)'} />
                    <span>{t?.tickets?.areaTypes?.[typeKey] || typeKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Block / Building & Floor Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Block / Wing */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. {t?.tickets?.block || 'Building / Block'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {blocksList.map(bKey => {
                  const isSelected = block === bKey;
                  return (
                    <button
                      key={bKey}
                      type="button"
                      onClick={() => handleUpdate(bKey, floor, areaType, specificSpot, customRoom)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                        border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '6px',
                        padding: '5px 8px',
                        color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {t?.tickets?.blocks?.[bKey]?.split(' ')[0] || bKey}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floor */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                3. {t?.tickets?.floor || 'Floor'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {floorsList.map(fKey => {
                  const isSelected = floor === fKey;
                  return (
                    <button
                      key={fKey}
                      type="button"
                      onClick={() => handleUpdate(block, fKey, areaType, specificSpot, customRoom)}
                      style={{
                        background: isSelected ? 'rgba(167, 139, 250, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                        border: `1px solid ${isSelected ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '6px',
                        padding: '5px 8px',
                        color: isSelected ? '#a78bfa' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {t?.tickets?.floors?.[fKey]?.split(' ')[0] || fKey}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Specific Spot / Room Details */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              4. {t?.tickets?.specificLocation || 'Room # or Specific Section'}
            </div>

            {spots.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                {spots.map(spotName => {
                  const isSelected = specificSpot === spotName;
                  return (
                    <button
                      key={spotName}
                      type="button"
                      onClick={() => {
                        const nextSpot = isSelected ? '' : spotName;
                        handleUpdate(block, floor, areaType, nextSpot, '');
                      }}
                      style={{
                        background: isSelected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isSelected ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '6px',
                        padding: '4px 9px',
                        color: isSelected ? '#34d399' : '#cbd5e1',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {spotName}
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              placeholder={
                areaType === 'restroom'
                  ? 'e.g. Girls Restroom, Stall 2, Near Gym'
                  : areaType === 'corridor'
                  ? 'e.g. Near Room 204, Opposite Library, West Stairwell'
                  : 'e.g. Room 204 / Chemistry Lab / Office 12'
              }
              value={customRoom || specificSpot}
              onChange={e => {
                const val = e.target.value;
                setCustomRoom(val);
                setSpecificSpot(val);
                handleUpdate(block, floor, areaType, val, val);
              }}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
          </div>

          {/* 4. Live Composed Preview Badge */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px dashed rgba(52, 211, 153, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t?.tickets?.locationPreview || 'Selected Location'}:</span>
              <strong style={{ color: '#34d399' }}>
                {value || constructLocationString(block, floor, areaType, specificSpot, customRoom)}
              </strong>
            </div>
            <Sparkles size={14} color="#34d399" />
          </div>
        </div>
      )}
    </div>
  );
};
