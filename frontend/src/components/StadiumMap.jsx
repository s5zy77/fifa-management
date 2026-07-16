import React from 'react';

export const StadiumMap = ({ zones = [], liveSignals = {}, recommendedGate, recommendedReset }) => {
  const getZoneColor = (zoneId) => {
    const sig = liveSignals[zoneId];
    if (!sig) return '#334155'; // slate-700
    const score = sig.noiseDb; 
    if (score < 70) return '#2DD4BF'; // calm-teal
    if (score < 95) return '#FBBF24'; // calm-amber
    return '#F87171'; // calm-red
  };

  return (
    <div className="w-full aspect-square bg-slate-800/40 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-700/50 flex items-center justify-center">
      <svg viewBox="-150 -150 300 300" className="w-full h-full max-w-md drop-shadow-md">
        {/* Draw edges */}
        {zones.map(zone => 
          (zone.adjacentZones || []).map(adj => {
            const target = zones.find(z => z.zoneId === adj);
            if (!target) return null;
            // To avoid double drawing edges, only draw if zoneId < adj
            if (zone.zoneId > adj) return null;
            return (
              <line 
                key={`${zone.zoneId}-${adj}`}
                x1={zone.coordinates?.x || 0}
                y1={zone.coordinates?.y || 0}
                x2={target.coordinates?.x || 0}
                y2={target.coordinates?.y || 0}
                stroke="#1E293B" // slate-800
                strokeWidth="3"
                className="transition-all duration-500"
              />
            )
          })
        )}
        
        {/* Draw nodes */}
        {zones.map(zone => {
          const isRecommended = recommendedGate === zone.zoneId || recommendedReset === zone.zoneId;
          const color = getZoneColor(zone.zoneId);
          const x = zone.coordinates?.x || 0;
          const y = zone.coordinates?.y || 0;
          return (
            <g key={zone.zoneId} className="transition-all duration-700 ease-out cursor-pointer hover:opacity-80">
              {isRecommended && (
                <circle cx={x} cy={y} r="16" fill="none" stroke={color} strokeWidth="2" className="animate-pulse" />
              )}
              <circle cx={x} cy={y} r={isRecommended ? "10" : "6"} fill={color} />
              <text 
                x={x} 
                y={y + (isRecommended ? 22 : 16)} 
                fontSize="7" 
                fill="#F1F5F9" 
                textAnchor="middle"
                className="font-display font-medium"
              >
                {zone.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  );
};
