import React from 'react';

const getLoadColor = (score) => {
  if (score < 70) return 'bg-calm-teal text-calm-teal';
  if (score < 95) return 'bg-calm-amber text-calm-amber';
  return 'bg-calm-red text-calm-red';
};

export const LoadMeter = ({ score, label = "Sensory Load" }) => {
  const normalized = Math.min(100, Math.max(0, ((score - 30) / 100) * 100));
  const colorClass = getLoadColor(score);
  const [bg, text] = colorClass.split(' ');
  
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-slate-300">{label}</span>
        <span className={`font-display font-bold ${text}`}>{Math.round(score)} dB</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${bg}`}
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
};
