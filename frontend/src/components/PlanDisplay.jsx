import React from 'react';
import { LoadMeter } from './LoadMeter';

export const PlanDisplay = ({ plan, liveSignals }) => {
  if (!plan) return null;
  const gateSignal = liveSignals[plan.recommendedGate];
  
  return (
    <div className="bg-slate-800/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-700 w-full mb-6">
      <h2 className="text-xl font-display text-slate-100 mb-4">Your AI Visit Plan</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Arrival Window</p>
          <p className="text-lg font-display text-calm-teal">{plan.bestArrivalWindow}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Recommended Gate</p>
          <p className="text-lg font-display text-slate-200">{plan.recommendedGate}</p>
        </div>
      </div>
      
      {gateSignal && (
        <div className="mb-6">
          <LoadMeter score={gateSignal.noiseDb} label={`Live Load at ${plan.recommendedGate}`} />
        </div>
      )}

      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700">
        <p className="text-sm text-slate-300 leading-relaxed font-body">
          <span className="font-semibold text-calm-teal font-display block mb-1">Why this route?</span>
          {plan.explanation}
        </p>
      </div>
    </div>
  );
};
