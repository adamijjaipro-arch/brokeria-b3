// Signal de trading visuel (BUY/SELL/HOLD)
import React from 'react';

export const SignalIcon: React.FC<{ type: 'BUY' | 'SELL' | 'HOLD' }> = ({ type }) => {
  if (type === 'BUY') return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent text-black font-bold shadow-neon animate-pulse">
      BUY <svg className="ml-1 w-4 h-4" fill="none" stroke="#00FFD0" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
    </span>
  );
  if (type === 'SELL') return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-alert-error text-white font-bold shadow-neon animate-pulse">
      SELL <svg className="ml-1 w-4 h-4" fill="none" stroke="#FF3B30" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12l-5 5L4 7"/></svg>
    </span>
  );
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-alert-warning text-black font-bold shadow-neon animate-pulse">
      HOLD <svg className="ml-1 w-4 h-4" fill="none" stroke="#FFD60A" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>
    </span>
  );
};
