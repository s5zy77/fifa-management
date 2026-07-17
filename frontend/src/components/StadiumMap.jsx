import React, { useRef, useState, useEffect } from 'react';

export const StadiumMap = ({ zones = [], liveSignals = {}, recommendedGate, recommendedSection, recommendedReset, t }) => {
  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  
  // Start with default scaling, useEffect will calculate actual centered values on mount
  const [transform, setTransform] = useState({ scale: 0.8, tx: 50, ty: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '', loadLabel: '', color: '' });

  // Dynamically calculate scale and translation to center map on load
  useEffect(() => {
    const handleResize = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const scale = Math.min(rect.width / 900, rect.height / 620) * 0.95;
      const tx = (rect.width - 900 * scale) / 2;
      const ty = (rect.height - 620 * scale) / 2;
      setTransform({ scale, tx, ty });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLoadColor = (load) => {
    if (load < 0.4) return 'var(--brand)';
    if (load < 0.7) return 'var(--amber-fill)';
    return 'var(--rose)';
  };

  const getLoadLabel = (load) => {
    if (load < 0.4) return t('calm');
    if (load < 0.7) return t('building');
    return t('overstimulating');
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setTransform(prev => ({ ...prev, scale: Math.min(3, Math.max(0.4, prev.scale + delta)) }));
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setTransform(prev => ({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => setIsDragging(false);

  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) vp.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      if (vp) vp.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, lastPos]);

  const showTooltip = (e, zone) => {
    const rect = viewportRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const load = liveSignals[zone.zoneId]?.noiseDb / 100 || 0;
    const isReset = zone.type === 'reset';
    const color = isReset ? '#7DD3FC' : (load < 0.4 ? '#5EEAD4' : load < 0.7 ? '#FCD34D' : '#FDA4AF');
    const label = isReset ? t('reset_legend') : getLoadLabel(load);
    setTooltip({ show: true, x: x + 14, y: y - 10, content: zone.name, loadLabel: label, color });
  };

  const hideTooltip = () => setTooltip(prev => ({ ...prev, show: false }));

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.15) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.4, prev.scale - 0.15) }));
  const zoomReset = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const scale = Math.min(rect.width / 900, rect.height / 620) * 0.95;
    const tx = (rect.width - 900 * scale) / 2;
    const ty = (rect.height - 620 * scale) / 2;
    setTransform({ scale, tx, ty });
  };

  const pitchX = 310, pitchY = 210, pitchW = 280, pitchH = 200;
  const stripes = Array.from({ length: 4 }).map((_, i) => i * 2);

  let pathD = null;
  if (recommendedGate && recommendedSection) {
    const gateZ = zones.find(z => z.zoneId === recommendedGate);
    const secZ = zones.find(z => z.zoneId === recommendedSection);
    if (gateZ && secZ && gateZ.coordinates && secZ.coordinates) {
      const midX = (gateZ.coordinates.x + secZ.coordinates.x) / 2;
      const midY = (gateZ.coordinates.y + secZ.coordinates.y) / 2 + 20;
      pathD = `M ${gateZ.coordinates.x} ${gateZ.coordinates.y} Q ${midX} ${midY} ${secZ.coordinates.x} ${secZ.coordinates.y}`;
    }
  }

  return (
    <section className="card map-card">
      <div className="map-head">
        <div>
          <span className="eyebrow">{t('live_map')}</span>
          <h2>{t('stadium_overview')}</h2>
          <p className="sub" style={{ marginBottom: 0 }}>{t('map_sub')}</p>
        </div>
        <div className="map-controls">
          <button className="icon-btn" onClick={zoomOut} aria-label="Zoom out">−</button>
          <button className="icon-btn" onClick={zoomReset} aria-label="Reset zoom">⟳</button>
          <button className="icon-btn" onClick={zoomIn} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div 
        className={`map-viewport ${isDragging ? 'grabbing' : ''}`} 
        ref={viewportRef}
        onPointerDown={handlePointerDown}
      >
        <svg 
          id="mapSvg" 
          className="map-svg" 
          width="900" 
          height="620" 
          viewBox="0 0 900 620" 
          ref={svgRef}
          style={{ transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})` }}
        >
          <rect x="20" y="20" width="860" height="580" rx="60" fill="#EEF2F6" />
          <rect x="70" y="70" width="760" height="480" rx="50" fill="none" stroke="#DCE3EA" strokeWidth="2" />
          <rect x="160" y="150" width="580" height="320" rx="40" fill="#F7FAFC" stroke="#E2E8F0" />
          
          <g>
            <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH} rx="6" fill="#2E9E4F" />
            {stripes.map(i => (
              <rect key={i} x={pitchX + i * (pitchW / 8)} y={pitchY} width={pitchW / 8} height={pitchH} fill="#34AC57" opacity="0.7" />
            ))}
            <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH} rx="6" fill="none" stroke="white" strokeWidth="2" />
            <line x1={pitchX} y1={pitchY + pitchH / 2} x2={pitchX + pitchW} y2={pitchY + pitchH / 2} stroke="white" strokeWidth="1.5" />
            <circle cx={pitchX + pitchW / 2} cy={pitchY + pitchH / 2} r="34" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx={pitchX + pitchW / 2} cy={pitchY + pitchH / 2} r="2" fill="white" />
            <rect x={pitchX + pitchW / 2 - 45} y={pitchY} width="90" height="26" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x={pitchX + pitchW / 2 - 45} y={pitchY + pitchH - 26} width="90" height="26" fill="none" stroke="white" strokeWidth="1.5" />
          </g>

          {pathD && (
            <g id="routeGroup">
              <path d={pathD} className="route-path animated" />
            </g>
          )}

          {zones.map(zone => {
            const load = liveSignals[zone.zoneId]?.noiseDb / 100 || 0;
            const color = zone.type === 'reset' ? 'var(--sky)' : getLoadColor(load);
            const cx = zone.coordinates?.x || 0;
            const cy = zone.coordinates?.y || 0;
            let shape;
            if (zone.type === 'gate') {
              shape = <rect x={cx - 14} y={cy - 11} width="28" height="22" rx="6" fill={color} />;
            } else if (zone.type === 'reset') {
              shape = <circle cx={cx} cy={cy} r="13" fill={color} />;
            } else if (zone.type === 'seating') {
              shape = <rect x={cx - 24} y={cy - 16} width="48" height="32" rx="9" fill={color} opacity="0.88" />;
            } else {
              shape = <circle cx={cx} cy={cy} r="11" fill={color} opacity="0.85" />;
            }

            return (
              <g 
                key={zone.zoneId} 
                className="zone-shape"
                onMouseEnter={(e) => showTooltip(e, zone)}
                onMouseMove={(e) => showTooltip(e, zone)}
                onMouseLeave={hideTooltip}
                onTouchStart={(e) => { showTooltip(e, zone); setTimeout(hideTooltip, 1800); }}
              >
                {shape}
              </g>
            );
          })}
        </svg>

        {tooltip.show && (
          <div className="tooltip show" style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.content}<br />
            <span className="t-load" style={{ color: tooltip.color }}>{tooltip.loadLabel}</span>
          </div>
        )}
      </div>

      <div className="map-legend">
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--brand)' }}></span> {t('calm')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--amber-fill)' }}></span> {t('building')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--rose)' }}></span> {t('overstimulating')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--sky)' }}></span> {t('reset_sensory')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--ink)' }}></span> {t('rec_route')}</div>
      </div>
    </section>
  );
};
