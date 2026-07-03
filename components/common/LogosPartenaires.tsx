// LogosPartenaires.tsx — Grille de logos premium/ambitieux
import React from 'react';

const logos = [
  { name: 'Binance', svg: <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2"/><rect x="18" y="18" width="12" height="12" rx="3" fill="#00FFD0" fillOpacity="0.18"/></svg> },
  { name: 'TradingView', svg: <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2"/><path d="M16 32 Q24 16 32 32" stroke="#00FFD0" strokeWidth="3" fill="none"/></svg> },
  { name: 'AWS', svg: <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2"/><ellipse cx="24" cy="28" rx="10" ry="4" fill="#00FFD0" fillOpacity="0.12"/></svg> },
  { name: 'OpenAI', svg: <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2"/><polygon points="24,12 36,24 24,36 12,24" fill="#00FFD0" fillOpacity="0.14"/></svg> },
  { name: 'FrenchTech', svg: <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2"/><path d="M24 16 L28 32 L20 32 Z" fill="#00FFD0" fillOpacity="0.18"/></svg> },
  { name: 'Forbes', svg: <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2"/><rect x="16" y="20" width="16" height="8" rx="2" fill="#00FFD0" fillOpacity="0.10"/></svg> },
];

const LogosPartenaires: React.FC = () => (
  <div className="w-full py-8">
    <div className="text-center mb-6">
      <span className="uppercase text-xs tracking-widest text-accent font-bold">Partenaires &amp; Références</span>
      <h2 className="text-2xl md:text-3xl font-extrabold gradient-text mb-2">Ils nous font confiance</h2>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-center max-w-4xl mx-auto">
      {logos.map((logo, idx) => (
        <div key={logo.name} className="flex flex-col items-center group">
          <div className="glass p-3 rounded-2xl shadow-neon hover:scale-110 transition-transform duration-200">
            {logo.svg}
          </div>
          <span className="mt-2 text-xs text-text-secondary group-hover:text-accent transition-colors">{logo.name}</span>
        </div>
      ))}
    </div>
  </div>
);

export default LogosPartenaires;
