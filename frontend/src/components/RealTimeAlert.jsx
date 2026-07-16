import React, { useEffect, useState, useRef } from 'react';
import { getLiveSignals, getReroute } from '../utils/api';
import { AlertTriangle, Map } from 'lucide-react';

export const RealTimeAlert = ({ profileId, currentZoneId, onRerouteData }) => {
  const [alert, setAlert] = useState(null); // { message, isLoading, route }
  const intervalRef = useRef(null);

  const checkSignals = async () => {
    // Only poll if tab is visible
    if (document.visibilityState !== 'visible') return;
    
    try {
      const data = await getLiveSignals();
      const currentSignal = data.liveSignals[currentZoneId];
      if (!currentSignal) return;

      // Simplistic threshold check for demo purposes (if noise > 100 we flag a spike)
      if (currentSignal.noiseDb > 100 && !alert) {
        setAlert({ message: 'Sensory spike detected ahead. Generating safe alternative...', isLoading: true });
        
        // Call GenAI reroute
        try {
          const res = await getReroute(profileId, currentZoneId);
          setAlert({ 
            message: 'New route generated to avoid spike.', 
            isLoading: false, 
            route: res.reroute 
          });
          if (onRerouteData) onRerouteData(res.reroute);
        } catch (err) {
          setAlert({ message: 'Spike detected, but AI rerouting is currently unavailable.', isLoading: false });
        }
      }
    } catch (err) {
      console.error("Signal poll failed:", err);
    }
  };

  useEffect(() => {
    // 10 second polling
    intervalRef.current = setInterval(checkSignals, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentZoneId, profileId, alert]); // Dependency on alert ensures we don't spam once alerted

  if (!alert) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-800 border border-slate-700 shadow-2xl p-4 rounded-2xl flex flex-col gap-3 z-50">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${alert.isLoading ? 'bg-calm-amber/20 text-calm-amber' : 'bg-calm-teal/20 text-calm-teal'}`}>
          {alert.isLoading ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Map className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-slate-200 font-medium text-sm">{alert.message}</p>
          {alert.route && (
            <div className="mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-sm text-slate-300">
              <span className="block font-display font-semibold text-calm-teal mb-1">
                New Target: {alert.route.recommendedZone}
              </span>
              {alert.route.explanation}
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={() => setAlert(null)}
        className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
      >
        Acknowledge
      </button>
    </div>
  );
};
