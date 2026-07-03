// Avatar IA stylisé
import React from 'react';

const AvatarIA: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <div className="rounded-full bg-gradient-to-br from-accent to-accent-gold shadow-neon flex items-center justify-center" style={{ width: size, height: size }}>
    {/* Remplacez ce SVG par un avatar IA personnalisé */}
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#0A0E17" stroke="#00FFD0" strokeWidth="2" />
      <ellipse cx="32" cy="38" rx="16" ry="10" fill="#00FFD0" fillOpacity="0.10" />
      <ellipse cx="32" cy="28" rx="12" ry="14" fill="#00FFD0" fillOpacity="0.18" />
      <ellipse cx="24" cy="28" rx="2.5" ry="3.5" fill="#00FFD0" />
      <ellipse cx="40" cy="28" rx="2.5" ry="3.5" fill="#00FFD0" />
      <rect x="26" y="40" width="12" height="3" rx="1.5" fill="#00FFD0" fillOpacity="0.5" />
    </svg>
  </div>
);

export default AvatarIA;
