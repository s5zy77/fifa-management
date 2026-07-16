import React, { useState } from 'react';
import { createProfile } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const ProfileWizard = ({ onComplete }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    preferredLanguage: 'en',
    sensitivity: {
      noise: 5,
      light: 5,
      crowd: 5,
      movement: 5,
      quietExit: false,
      serviceAnimal: false
    }
  });
  const [loading, setLoading] = useState(false);

  const updateSensitivity = (key, value) => {
    setProfile(p => ({ ...p, sensitivity: { ...p.sensitivity, [key]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await createProfile(profile);
      localStorage.setItem('calmgate_profile_id', saved.id);
      if (onComplete) onComplete(saved);
      navigate('/dashboard');
    } catch (err) {
      alert("Error saving profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (key, label, desc) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label className="font-display text-slate-200">{label}</label>
        <span className="text-calm-amber font-display font-bold">{profile.sensitivity[key]}</span>
      </div>
      <p className="text-xs text-slate-400 mb-2">{desc}</p>
      <input 
        type="range" min="0" max="10" 
        value={profile.sensitivity[key]}
        onChange={e => updateSensitivity(key, parseInt(e.target.value))}
        className="w-full accent-calm-teal bg-slate-700 h-2 rounded-lg appearance-none cursor-pointer"
        data-testid={`slider-${key}`}
      />
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-800/80 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-700 mt-10">
      <h2 className="text-2xl font-display text-slate-100 mb-6">Create Sensory Profile</h2>
      <form onSubmit={handleSubmit} data-testid="profile-form">
        
        <div className="mb-6">
          <label className="font-display text-slate-200 block mb-2">Preferred Language</label>
          <select 
            value={profile.preferredLanguage}
            onChange={e => setProfile({...profile, preferredLanguage: e.target.value})}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-calm-teal"
            data-testid="lang-select"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="pt">Português</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        {renderSlider('noise', 'Noise Sensitivity', '0 = Highly tolerant, 10 = Needs absolute quiet')}
        {renderSlider('light', 'Light Sensitivity', '0 = Tolerant to bright/flashing, 10 = Needs dim/steady')}
        {renderSlider('crowd', 'Crowd Density', '0 = Fine in crowds, 10 = Needs wide personal space')}
        {renderSlider('movement', 'Unpredictable Movement', '0 = Unaffected, 10 = Overwhelmed by busy motion')}

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display text-slate-200">Quiet Exit Required</div>
            <div className="text-xs text-slate-400">Needs a low-stimulus egress path</div>
          </div>
          <input 
            type="checkbox" 
            checked={profile.sensitivity.quietExit}
            onChange={e => updateSensitivity('quietExit', e.target.checked)}
            className="w-5 h-5 accent-calm-teal cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-display text-slate-200">Service Animal</div>
            <div className="text-xs text-slate-400">Travels with a support animal</div>
          </div>
          <input 
            type="checkbox" 
            checked={profile.sensitivity.serviceAnimal}
            onChange={e => updateSensitivity('serviceAnimal', e.target.checked)}
            className="w-5 h-5 accent-calm-teal cursor-pointer"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-calm-teal text-slate-900 font-display font-bold py-3 px-4 rounded-xl hover:bg-teal-300 transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
};
