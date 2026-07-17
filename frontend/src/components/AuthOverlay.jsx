import React, { useState } from 'react';
import { api } from '../utils/api';

export const AuthOverlay = ({ onAuthSuccess, onGuest }) => {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@') || password.length < 6) {
      setError('Please enter a valid email and a password of at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = mode === 'signup' 
        ? await api.signup(email, password)
        : await api.signin(email, password);
      
      localStorage.setItem('calmgate_token', data.access_token);
      localStorage.setItem('calmgate_user_id', data.user_id);
      
      onAuthSuccess({ token: data.access_token, userId: data.user_id, theme: data.theme_preference });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" id="authOverlay">
      <div className="auth-card">
        <div className="brand-mark">C</div>
        <h2>Welcome to CalmGate</h2>
        <p className="sub" style={{ marginBottom: '20px' }}>Sign in to save your sensory profile and plans.</p>
        
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} 
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign in
          </button>
          <button 
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} 
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign up
          </button>
        </div>
        
        <form id="authForm" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="authEmail">Email</label>
            <input 
              type="email" id="authEmail" autoComplete="email" placeholder="you@example.com" required 
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="authPassword">Password</label>
            <input 
              type="password" id="authPassword" autoComplete="current-password" placeholder="••••••••" required minLength={6} 
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="auth-error" style={{ display: 'block' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ marginTop: '6px' }} disabled={loading}>
            {loading ? "Please wait..." : (mode === 'signup' ? 'Create account →' : 'Sign in →')}
          </button>
        </form>
        
        <div className="auth-guest">
          Just exploring? <button onClick={onGuest}>Continue as guest</button>
        </div>
      </div>
    </div>
  );
};
