import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ProfileWizard } from './components/ProfileWizard';
import { UploadDataset } from './components/UploadDataset';
import { StadiumMap } from './components/StadiumMap';
import { PlanDisplay } from './components/PlanDisplay';
import { RealTimeAlert } from './components/RealTimeAlert';
import { generatePlan, getLiveSignals } from './utils/api';

const Dashboard = () => {
  const profileId = localStorage.getItem('calmgate_profile_id');
  const [plan, setPlan] = useState(null);
  const [liveData, setLiveData] = useState({ zones: [], liveSignals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlan = async () => {
    try {
      const res = await generatePlan(profileId, 'SEC-101'); // Hardcoded seat for demo
      setPlan(res.plan);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSignals = async () => {
    try {
      const data = await getLiveSignals();
      setLiveData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const initialize = async () => {
    setLoading(true);
    await fetchSignals();
    await fetchPlan();
    setLoading(false);
  };

  useEffect(() => {
    initialize();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center font-display text-calm-teal">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-100">CalmGate</h1>
        <p className="text-slate-400">Your sensory-friendly stadium companion</p>
      </header>

      {error ? (
        <div className="bg-calm-red/10 border border-calm-red/20 text-calm-red p-4 rounded-xl mb-6">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <PlanDisplay plan={plan} liveSignals={liveData.liveSignals} />
            <UploadDataset onUploadSuccess={initialize} />
          </div>
          <div className="flex items-start justify-center">
            <StadiumMap 
              zones={liveData.zones} 
              liveSignals={liveData.liveSignals}
              recommendedGate={plan?.recommendedGate}
              recommendedReset={plan?.nearestResetZone}
            />
          </div>
        </div>
      )}

      {plan && (
        <RealTimeAlert 
          profileId={profileId}
          currentZoneId={plan.recommendedGate} // Mocking current location as the recommended gate
          onRerouteData={(newRoute) => {
            // Update plan softly to reflect new target
            setPlan(p => ({...p, recommendedGate: newRoute.recommendedZone, explanation: newRoute.explanation}))
          }}
        />
      )}
    </div>
  );
};

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<ProfileWizard />} />
      <Route 
        path="/dashboard" 
        element={
          localStorage.getItem('calmgate_profile_id') ? 
          <Dashboard /> : 
          <Navigate to="/onboarding" replace />
        } 
      />
    </Routes>
  );
};

export default App;
