import React, { useState } from 'react';

export const PlanDisplay = ({ plan, onFeedback, onShare }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!plan) {
    return (
      <section className="card" aria-labelledby="plan-heading">
        <span className="eyebrow">Step 2</span>
        <h2 id="plan-heading">Your visit plan</h2>
        <div className="plan-empty">Set your profile and generate a plan to see your personalized route.</div>
      </section>
    );
  }

  const handleFeedback = (direction) => {
    setFeedbackGiven(true);
    if (onFeedback) onFeedback(direction);
  };

  const handleShare = async () => {
    if (onShare) {
      const url = await onShare();
      if (url) {
        setToastMsg('Link copied to clipboard!');
        setTimeout(() => setToastMsg(''), 2600);
      }
    }
  };

  const handleDownload = () => {
    // Basic canvas rendering for plan card (from prototype)
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 420;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F8FAFC'; ctx.fillRect(0,0,640,420);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(20,20,600,380);
    const grad = ctx.createLinearGradient(40,40,80,80);
    grad.addColorStop(0,'#0F766E'); grad.addColorStop(1,'#0369A1');
    ctx.fillStyle = grad; 
    ctx.beginPath();
    ctx.roundRect(40, 40, 44, 44, 12);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = '700 20px Outfit, sans-serif'; ctx.fillText('C', 55, 68);

    ctx.fillStyle = '#0F172A'; ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillText('CalmGate — Your Visit Plan', 98, 60);
    ctx.fillStyle = '#475569'; ctx.font = '400 13px Inter, sans-serif';
    ctx.fillText('Sensory-friendly stadium companion', 98, 78);

    let y = 130;
    const rows = [
      ['Recommended gate', plan.plan.recommendedGate],
      ['Best arrival window', plan.plan.bestArrivalWindow],
      ['Nearest reset zone', plan.plan.nearestResetZone],
    ];
    rows.forEach(([label, val]) => {
      ctx.fillStyle = '#0F766E'; ctx.font = '600 12px Inter, sans-serif';
      ctx.fillText(label.toUpperCase(), 40, y);
      ctx.fillStyle = '#0F172A'; ctx.font = '500 18px Inter, sans-serif';
      ctx.fillText(val, 40, y + 24);
      y += 66;
    });

    const link = document.createElement('a');
    link.download = 'calmgate-plan.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <section className="card" aria-labelledby="plan-heading">
      <span className="eyebrow">Step 2</span>
      <h2 id="plan-heading">Your visit plan</h2>
      
      <div>
        <div className="plan-row">
          <div className="plan-icon">🚪</div>
          <div>
            <h3>Recommended gate</h3>
            <p>{plan.plan.recommendedGate}</p>
          </div>
        </div>
        <div className="plan-row">
          <div className="plan-icon">🕒</div>
          <div>
            <h3>Best arrival window</h3>
            <p>{plan.plan.bestArrivalWindow}</p>
          </div>
        </div>
        <div className="plan-row">
          <div className="plan-icon">🌿</div>
          <div>
            <h3>Nearest reset zone</h3>
            <p>{plan.plan.nearestResetZone}</p>
          </div>
        </div>
        <div className="reasoning-box">
          <strong>Why this plan:</strong> {plan.plan.explanation}
        </div>

        <div className="feedback-block">
          {!feedbackGiven ? (
            <>
              <p>Was this route calm for you?</p>
              <div className="feedback-btns">
                <button className="feedback-btn" onClick={() => handleFeedback('up')} aria-label="Yes, this route was calm">👍</button>
                <button className="feedback-btn" onClick={() => handleFeedback('down')} aria-label="No, this route was overwhelming">👎</button>
              </div>
            </>
          ) : (
            <span className="feedback-thanks" style={{ display: 'inline' }}>Thanks — we'll factor this into future plans.</span>
          )}
        </div>

        <div className="share-row">
          <button className="btn-secondary" onClick={handleDownload}>⬇ Save plan card</button>
          <button className="btn-secondary" onClick={handleShare}>🔗 Copy shareable link</button>
        </div>
      </div>
      
      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </section>
  );
};
