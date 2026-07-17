import React, { useEffect, useState } from 'react';
import { api } from './utils/api';
import { ProfileWizard } from './components/ProfileWizard';
import { PlanDisplay } from './components/PlanDisplay';
import { StadiumMap } from './components/StadiumMap';
import { LoadMeter } from './components/LoadMeter';
import { AuthOverlay } from './components/AuthOverlay';
import { translations } from './utils/translations';

export const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('calmgate_theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('calmgate_lang') || 'en');
  const [authVisible, setAuthVisible] = useState(!localStorage.getItem('calmgate_token') && !localStorage.getItem('calmgate_guest'));
  const [userId, setUserId] = useState(localStorage.getItem('calmgate_user_id'));
  const [profileId, setProfileId] = useState(localStorage.getItem('calmgate_profile_id'));
  const [liveData, setLiveData] = useState({ zones: [], liveSignals: {} });
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Translation helper function
  const t = (key) => {
    const dict = translations[lang] || translations['en'];
    return dict[key] || translations['en'][key] || key;
  };

  // Handle Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('calmgate_theme', theme);
  }, [theme]);

  // Handle Language
  useEffect(() => {
    localStorage.setItem('calmgate_lang', lang);
  }, [lang]);

  // Handle live signals polling
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const data = await api.getLiveSignals();
        setLiveData(data);
      } catch (err) {
        console.error("Live signals error:", err);
      }
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthSuccess = (data) => {
    setUserId(data.userId);
    setTheme(data.theme);
    setAuthVisible(false);
  };

  const handleGuest = () => {
    localStorage.setItem('calmgate_guest', 'true');
    setAuthVisible(false);
  };

  const handleGeneratePlan = async (profileData) => {
    setIsGenerating(true);
    try {
      // Force recreation of profile if language has changed, so AI reasons in correct language
      let pId = null;
      
      const res = await api.createProfile({
        preferredLanguage: lang,
        sensitivity: {
          noise: profileData.noise,
          light: profileData.light,
          crowd: profileData.crowd,
          movement: profileData.movement,
          quietExit: profileData.quietExit,
          serviceAnimal: profileData.serviceAnimal
        }
      });
      pId = res.id;
      setProfileId(pId);
      localStorage.setItem('calmgate_profile_id', pId);

      const planRes = await api.generatePlan(
        pId, 
        'SEC_101', 
        profileData.companion || null,
        userId
      );
      setPlan(planRes);
    } catch (e) {
      alert("Error generating plan: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = async (direction) => {
    if (!plan || !userId) return;
    try {
      await api.submitFeedback(plan.plan.recommendedGate, direction, userId);
      await api.submitFeedback(plan.plan.nearestResetZone, direction, userId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (!plan) return null;
    try {
      const res = await api.sharePlan({
        gate_name: plan.plan.recommendedGate,
        arrival_window: plan.plan.bestArrivalWindow,
        reset_zone_name: plan.plan.nearestResetZone,
        reasoning: plan.plan.explanation
      }, userId);
      const url = `${window.location.origin}/share/${res.short_id}`;
      navigator.clipboard.writeText(url);
      return url;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const getMeterZone = () => {
    if (plan && plan.plan.recommendedGate) {
      const z = liveData.zones.find(z => z.zoneId === plan.plan.recommendedGate);
      return z;
    }
    return liveData.zones[0];
  };

  const meterZone = getMeterZone();
  const meterLoad = meterZone ? (liveData.liveSignals[meterZone.zoneId]?.noiseDb || 0) : 0;

  return (
    <>
      {authVisible && (
        <AuthOverlay onAuthSuccess={handleAuthSuccess} onGuest={handleGuest} />
      )}
      
      <header className="top">
        <div className="brand-block">
          <div className="brand-mark">C</div>
          <div className="brand-text">
            <h1>CalmGate</h1>
            <p>{t('companion')}</p>
          </div>
        </div>
        <div className="top-controls">
          <select 
            className="theme-toggle" 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            aria-label="Language Selector"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </header>

      <main>
        <div className="stack">
          <ProfileWizard onGeneratePlan={handleGeneratePlan} isGenerating={isGenerating} t={t} />
          <PlanDisplay plan={plan} onFeedback={handleFeedback} onShare={handleShare} t={t} />
          {meterZone && (
            <LoadMeter zoneName={meterZone.name} loadScore={meterLoad} t={t} />
          )}
        </div>
        
        <div className="stack">
          <StadiumMap 
            zones={liveData.zones}
            liveSignals={liveData.liveSignals}
            recommendedGate={plan?.plan?.recommendedGate}
            recommendedSection="SEC_101"
            recommendedReset={plan?.plan?.nearestResetZone}
            t={t}
          />
        </div>
      </main>

      <footer>CalmGate · Built for PromptWars Virtual — Challenge 4</footer>
    </>
  );
};

export default App;
