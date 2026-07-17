import React, { useRef, useState, useEffect } from 'react';

// Normalized SVG canvas: 900x620
// Pitch occupies centre from roughly (250,155) to (650,465)
const PITCH = { x: 250, y: 155, w: 400, h: 310 };

// Static zone layout matching the screenshot visual
// Coordinates in SVG space (900x620)
const ZONE_LAYOUT = {
  'GATE-A':    { x: 450, y: 52,  label: 'Gate A',           shape: 'rect' },
  'GATE-B':    { x: 450, y: 568, label: 'Gate B',           shape: 'rect' },
  'GATE-W':    { x: 52,  y: 310, label: 'Gate W',           shape: 'rect' },
  'GATE-E':    { x: 848, y: 310, label: 'Gate E',           shape: 'rect' },
  'CONC-NORTH':{ x: 450, y: 115, label: 'North Concourse',  shape: 'rect' },
  'CONC-SOUTH':{ x: 450, y: 505, label: 'South Concourse',  shape: 'rect' },
  'CONC-WEST': { x: 165, y: 310, label: 'West Concourse',   shape: 'circle' },
  'CONC-EAST': { x: 735, y: 310, label: 'East Concourse',   shape: 'circle' },
  'SEC-101':   { x: 310, y: 115, label: 'Section 101',      shape: 'circle' },
  'SEC-102':   { x: 590, y: 115, label: 'Section 102',      shape: 'rect' },
  'SEC-103':   { x: 310, y: 505, label: 'Section 103',      shape: 'rect' },
  'SEC-104':   { x: 590, y: 505, label: 'Section 104',      shape: 'rect' },
  'FOOD-1':    { x: 175, y: 430, label: 'Food Court',       shape: 'circle' },
  'REST-1':    { x: 725, y: 430, label: 'Restrooms',        shape: 'circle' },
  'RESET-N':   { x: 805, y: 240, label: 'North Quiet Room', shape: 'circle' },
  'RESET-S':   { x: 95,  y: 400, label: 'South Quiet Room', shape: 'circle' },
};

const getLoadColor = (noiseDb) => {
  const load = noiseDb / 130;
  if (load < 0.55) return '#0F766E';   // calm teal
  if (load < 0.75) return '#F59E0B';   // amber
  return '#BE123C';                     // rose
};

const getLoadLabel = (noiseDb, t) => {
  const load = noiseDb / 130;
  if (load < 0.55) return t('calm');
  if (load < 0.75) return t('building');
  return t('overstimulating');
};

export const StadiumMap = ({ zones = [], liveSignals = {}, recommendedGate, recommendedSection, recommendedReset, t }) => {
  const viewportRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '', loadLabel: '', color: '' });

  // Compute centred default scale on mount/resize
  useEffect(() => {
    const compute = () => {
      if (!viewportRef.current) return;
      const { width, height } = viewportRef.current.getBoundingClientRect();
      const scale = Math.min(width / 900, height / 620) * 0.96;
      setTransform({ scale, tx: (width - 900 * scale) / 2, ty: (height - 620 * scale) / 2 });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    setTransform(prev => ({ ...prev, scale: Math.min(4, Math.max(0.3, prev.scale + (e.deltaY > 0 ? -0.06 : 0.06))) }));
  };

  useEffect(() => {
    const vp = viewportRef.current;
    const onMove = (e) => {
      if (!isDragging) return;
      setTransform(prev => ({ ...prev, tx: prev.tx + e.clientX - lastPos.x, ty: prev.ty + e.clientY - lastPos.y }));
      setLastPos({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => setIsDragging(false);
    if (vp) vp.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      if (vp) vp.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, lastPos]);

  const zoomIn  = () => setTransform(p => ({ ...p, scale: Math.min(4, p.scale + 0.15) }));
  const zoomOut = () => setTransform(p => ({ ...p, scale: Math.max(0.3, p.scale - 0.15) }));
  const zoomReset = () => {
    if (!viewportRef.current) return;
    const { width, height } = viewportRef.current.getBoundingClientRect();
    const scale = Math.min(width / 900, height / 620) * 0.96;
    setTransform({ scale, tx: (width - 900 * scale) / 2, ty: (height - 620 * scale) / 2 });
  };

  const showTooltip = (e, zoneId, name, noiseDb, isReset) => {
    const rect = viewportRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left + 12;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top - 8;
    const color = isReset ? '#7DD3FC' : getLoadColor(noiseDb);
    const label = isReset ? t('reset_legend') : getLoadLabel(noiseDb, t);
    setTooltip({ show: true, x, y, content: name, loadLabel: label, color });
  };

  // Build a route path if we have gate + section info
  let pathPoints = null;
  const gateLayout = ZONE_LAYOUT[recommendedGate];
  const sectionLayout = ZONE_LAYOUT[recommendedSection];
  if (gateLayout && sectionLayout) {
    const mx = (gateLayout.x + sectionLayout.x) / 2;
    const my = (gateLayout.y + sectionLayout.y) / 2 + 30;
    pathPoints = `M ${gateLayout.x} ${gateLayout.y} Q ${mx} ${my} ${sectionLayout.x} ${sectionLayout.y}`;
  }

  // Merge live zone data with layout — fall back to static layout for zones without live data
  const renderZones = zones.length > 0 ? zones : Object.entries(ZONE_LAYOUT).map(([id, l]) => ({
    zoneId: id, type: id.startsWith('RESET') ? 'reset' : id.startsWith('GATE') ? 'gate' : id.startsWith('SEC') ? 'seating' : 'concourse', name: l.label
  }));

  return (
    <section className="card map-card">
      <div className="map-head">
        <div>
          <span className="eyebrow">{t('live_map')}</span>
          <h2>{t('stadium_overview')}</h2>
          <p className="sub" style={{ marginBottom: 0 }}>{t('map_sub')}</p>
        </div>
        <div className="map-controls">
          <button className="icon-btn" id="mapZoomOut" onClick={zoomOut} aria-label="Zoom out">−</button>
          <button className="icon-btn" id="mapZoomReset" onClick={zoomReset} aria-label="Reset zoom">⟳</button>
          <button className="icon-btn" id="mapZoomIn" onClick={zoomIn} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div
        className={`map-viewport${isDragging ? ' grabbing' : ''}`}
        ref={viewportRef}
        onPointerDown={e => { setIsDragging(true); setLastPos({ x: e.clientX, y: e.clientY }); }}
        onMouseLeave={() => setTooltip(p => ({ ...p, show: false }))}
      >
        <svg
          id="mapSvg"
          width="900" height="620"
          viewBox="0 0 900 620"
          style={{ transform: `translate(${transform.tx}px,${transform.ty}px) scale(${transform.scale})`, transformOrigin: '0 0', cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
        >
          {/* Stadium bowl bg */}
          <rect x="20" y="20" width="860" height="580" rx="70" fill="#EEF2F7" />
          {/* Inner seating ring */}
          <rect x="110" y="100" width="680" height="420" rx="50" fill="#E2E8F2" />

          {/* Pitch */}
          <rect x={PITCH.x} y={PITCH.y} width={PITCH.w} height={PITCH.h} rx="6" fill="#2E9E4F" />
          {/* Pitch stripes */}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={PITCH.x + i * (PITCH.w / 5)} y={PITCH.y} width={PITCH.w / 5} height={PITCH.h}
              fill="#35AD55" opacity={i % 2 === 0 ? 0 : 0.4} />
          ))}
          {/* Pitch markings */}
          <rect x={PITCH.x} y={PITCH.y} width={PITCH.w} height={PITCH.h} rx="6" fill="none" stroke="white" strokeWidth="2" />
          <line x1={PITCH.x} y1={PITCH.y + PITCH.h / 2} x2={PITCH.x + PITCH.w} y2={PITCH.y + PITCH.h / 2} stroke="white" strokeWidth="1.5" />
          <circle cx={PITCH.x + PITCH.w / 2} cy={PITCH.y + PITCH.h / 2} r="44" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx={PITCH.x + PITCH.w / 2} cy={PITCH.y + PITCH.h / 2} r="3" fill="white" />
          {/* Goal boxes */}
          <rect x={PITCH.x + PITCH.w / 2 - 60} y={PITCH.y} width="120" height="34" fill="none" stroke="white" strokeWidth="1.5" />
          <rect x={PITCH.x + PITCH.w / 2 - 60} y={PITCH.y + PITCH.h - 34} width="120" height="34" fill="none" stroke="white" strokeWidth="1.5" />

          {/* Recommended route path */}
          {pathPoints && (
            <path d={pathPoints} fill="none" stroke="#0F172A" strokeWidth="3" strokeDasharray="8 5"
              strokeLinecap="round" opacity="0.75" />
          )}

          {/* Zones */}
          {renderZones.map(zone => {
            const layout = ZONE_LAYOUT[zone.zoneId];
            if (!layout) return null;
            const sig = liveSignals[zone.zoneId];
            const noiseDb = sig?.noiseDb ?? 60;
            const isReset = zone.type === 'reset';
            const fill = isReset ? '#7DD3FC' : getLoadColor(noiseDb);
            const isHighlighted = zone.zoneId === recommendedGate || zone.zoneId === recommendedSection || zone.zoneId === recommendedReset;
            const { x, y, shape } = layout;

            return (
              <g key={zone.zoneId}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => showTooltip(e, zone.zoneId, layout.label, noiseDb, isReset)}
                onMouseMove={e => showTooltip(e, zone.zoneId, layout.label, noiseDb, isReset)}
                onMouseLeave={() => setTooltip(p => ({ ...p, show: false }))}
                onTouchStart={e => { showTooltip(e, zone.zoneId, layout.label, noiseDb, isReset); setTimeout(() => setTooltip(p => ({ ...p, show: false })), 2000); }}
              >
                {/* Highlight ring for recommended zones */}
                {isHighlighted && (shape === 'circle'
                  ? <circle cx={x} cy={y} r="22" fill="none" stroke="#0F172A" strokeWidth="3" strokeDasharray="4 3" opacity="0.7" />
                  : <rect x={x - 22} y={y - 18} width="44" height="36" rx="10" fill="none" stroke="#0F172A" strokeWidth="3" strokeDasharray="4 3" opacity="0.7" />
                )}
                {/* Zone shape */}
                {shape === 'circle'
                  ? <circle cx={x} cy={y} r="14" fill={fill} />
                  : <rect x={x - 20} y={y - 14} width="40" height="28" rx="8" fill={fill} />
                }
              </g>
            );
          })}
        </svg>

        {tooltip.show && (
          <div className="tooltip show" style={{ left: tooltip.x, top: tooltip.y }}>
            <strong>{tooltip.content}</strong><br />
            <span className="t-load" style={{ color: tooltip.color }}>{tooltip.loadLabel}</span>
          </div>
        )}
      </div>

      <div className="map-legend">
        <div className="legend-dot"><span className="dot" style={{ background: '#0F766E' }}></span>{t('calm')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: '#F59E0B' }}></span>{t('building')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: '#BE123C' }}></span>{t('overstimulating')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: '#7DD3FC' }}></span>{t('reset_sensory')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: '#0F172A' }}></span>{t('rec_route')}</div>
      </div>
    </section>
  );
};
