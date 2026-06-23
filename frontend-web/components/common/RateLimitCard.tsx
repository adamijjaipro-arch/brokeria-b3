import React, { useState, useEffect, useCallback } from 'react';

export interface RateLimitCardProps {
  onRetry:          () => void;
  /** Label for the data context, e.g. "marchés" or "graphique" */
  context?:         string;
  /** Seconds before auto-retry. Default: 30 */
  retrySeconds?:    number;
  /** Use dark glassmorphism (inside dark charts). Default: false */
  dark?:            boolean;
}

const RateLimitCard: React.FC<RateLimitCardProps> = ({
  onRetry,
  context       = 'données',
  retrySeconds  = 30,
  dark          = false,
}) => {
  const [countdown, setCountdown] = useState(retrySeconds);

  const doRetry = useCallback(() => {
    setCountdown(retrySeconds);
    onRetry();
  }, [onRetry, retrySeconds]);

  // Decrement countdown every second, auto-retry at 0
  useEffect(() => {
    if (countdown <= 0) { doRetry(); return; }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1_000);
    return () => clearTimeout(id);
  }, [countdown, doRetry]);

  // Reset when retrySeconds prop changes (e.g. parent remounts)
  useEffect(() => {
    setCountdown(retrySeconds);
  }, [retrySeconds]);

  const bg     = dark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)';
  const border = 'rgba(245,158,11,0.28)';
  const title  = dark ? '#fde68a' : '#92400e';
  const sub    = dark ? '#d97706' : '#b45309';
  const cnt    = dark ? '#fbbf24' : '#d97706';
  const btn    = dark
    ? { bg: 'rgba(245,158,11,0.15)', hover: 'rgba(245,158,11,0.25)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' }
    : { bg: 'rgba(245,158,11,0.1)',  hover: 'rgba(245,158,11,0.2)',  text: '#92400e', border: 'rgba(245,158,11,0.3)' };

  // Animated progress ring
  const radius      = 18;
  const circumference = 2 * Math.PI * radius;
  const progress    = countdown / retrySeconds;
  const dashOffset  = circumference * (1 - progress);

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100%',
      minHeight:      '180px',
      padding:        '24px',
    }}>
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '16px',
        background:    bg,
        border:        `1px solid ${border}`,
        borderRadius:  '16px',
        padding:       '28px 36px',
        backdropFilter: 'blur(12px)',
        maxWidth:      '360px',
        width:         '100%',
        textAlign:     'center',
      }}>

        {/* Warning icon */}
        <div style={{ position: 'relative', width: '52px', height: '52px' }}>
          {/* Countdown ring */}
          <svg
            width="52" height="52"
            viewBox="0 0 52 52"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            <circle cx="26" cy="26" r={radius}
              fill="none"
              stroke="rgba(245,158,11,0.15)"
              strokeWidth="3"
            />
            <circle cx="26" cy="26" r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          {/* Icon center */}
          <div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div>
          <p style={{
            margin:     '0 0 6px',
            fontSize:   '14px',
            fontWeight: 700,
            color:      title,
            lineHeight: 1.4,
          }}>
            Données en cours de chargement...
          </p>
          <p style={{
            margin:   0,
            fontSize: '12px',
            color:    sub,
            lineHeight: 1.5,
          }}>
            Limite d&apos;appels API {context} atteinte.
          </p>
        </div>

        {/* Countdown */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
          fontSize:   '13px',
          color:      sub,
        }}>
          <span>Réessai automatique dans</span>
          <span style={{
            fontWeight:   800,
            fontSize:     '18px',
            color:        cnt,
            minWidth:     '28px',
            textAlign:    'center',
            fontVariant:  'tabular-nums',
          }}>
            {countdown}
          </span>
          <span>s</span>
        </div>

        {/* Manual retry button */}
        <button
          onClick={doRetry}
          style={{
            padding:      '8px 22px',
            borderRadius: '8px',
            border:       `1px solid ${btn.border}`,
            background:   btn.bg,
            color:        btn.text,
            fontSize:     '12px',
            fontWeight:   700,
            cursor:       'pointer',
            fontFamily:   'inherit',
            transition:   'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = btn.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = btn.bg)}
        >
          Réessayer maintenant
        </button>
      </div>
    </div>
  );
};

export default RateLimitCard;
