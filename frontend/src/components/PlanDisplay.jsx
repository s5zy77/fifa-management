import React, { useState } from 'react';

export const PlanDisplay = ({ plan, onFeedback, onShare, t = (k) => k }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  if (!plan) {
    return (
      <section className="card" aria-labelledby="plan-heading">
        <span className="eyebrow">{t('step2')}</span>
        <h2 id="plan-heading">{t('plan_heading')}</h2>
        <div className="plan-empty">{t('plan_empty')}</div>
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
    ctx.fillText(t('companion'), 98, 78);

    let y = 130;
    const rows = [
      [t('rec_gate'), plan.plan.recommendedGate],
      [t('arrival_window'), plan.plan.bestArrivalWindow],
      [t('reset_zone'), plan.plan.nearestResetZone],
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
      <span className="eyebrow">{t('step2')}</span>
      <h2 id="plan-heading">{t('plan_heading')}</h2>
      
      <div>
        <div className="plan-row">
          <div className="plan-icon">🚪</div>
          <div>
            <h3>{t('rec_gate')}</h3>
            <p>{plan.plan.recommendedGate}</p>
          </div>
        </div>
        <div className="plan-row">
          <div className="plan-icon">🕒</div>
          <div>
            <h3>{t('arrival_window')}</h3>
            <p>{plan.plan.bestArrivalWindow}</p>
          </div>
        </div>
        <div className="plan-row">
          <div className="plan-icon">🌿</div>
          <div>
            <h3>{t('reset_zone')}</h3>
            <p>{plan.plan.nearestResetZone}</p>
          </div>
        </div>
        <div className="reasoning-box">
          <strong>{t('why_plan')}:</strong> {plan.plan.explanation}
        </div>

        <div className="feedback-block">
          {!feedbackGiven ? (
            <>
              <p>{t('route_calm')}</p>
              <div className="feedback-btns">
                <button className="feedback-btn" onClick={() => handleFeedback('up')} aria-label="Yes, this route was calm">👍</button>
                <button className="feedback-btn" onClick={() => handleFeedback('down')} aria-label="No, this route was overwhelming">👎</button>
              </div>
            </>
          ) : (
            <span className="feedback-thanks" style={{ display: 'inline' }}>{t('thanks')}</span>
          )}
        </div>

        <div className="share-row">
          <button className="btn-secondary" onClick={handleDownload}>{t('save_card')}</button>
          <button className="btn-secondary" onClick={handleShare}>{t('copy_link')}</button>
        </div>
      </div>
      
      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </section>
  );
};
