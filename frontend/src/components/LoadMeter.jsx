import React from 'react';

export const LoadMeter = ({ zoneName, loadScore, t = (k) => k }) => {
  const normalized = Math.min(Math.max(loadScore, 0), 100);
  const dashOffset = 289 - (normalized / 100) * 289;
  
  const getStrokeColor = (val) => {
    if (val < 40) return 'var(--brand)';
    if (val < 70) return 'var(--amber-fill)';
    return 'var(--rose)';
  };

  return (
    <section className="card">
      <span className="eyebrow">{t('live')}</span>
      <h2>{t('current_load')}</h2>
      <div className="meter-wrap">
        <svg className="meter-svg" width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="46" fill="none" stroke="#E2E8F0" strokeWidth="10"/>
          <circle 
            id="meterArc" 
            cx="55" cy="55" r="46" 
            fill="none" 
            stroke={getStrokeColor(normalized)} 
            strokeWidth="10"
            strokeLinecap="round" 
            strokeDasharray="289" 
            strokeDashoffset={dashOffset}
            transform="rotate(-90 55 55)" 
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
          />
        </svg>
        <div className="meter-legend">
          <div className="val">{normalized}<span style={{ fontSize: '13px' }}>%</span></div>
          <div>{zoneName} {t('load_suffix')}</div>
        </div>
      </div>
      <div className="legend-dots">
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--brand)' }}></span> {t('calm')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--amber-fill)' }}></span> {t('building')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--rose)' }}></span> {t('overstimulating')}</div>
        <div className="legend-dot"><span className="dot" style={{ background: 'var(--sky)' }}></span> {t('reset_legend')}</div>
      </div>
    </section>
  );
};
