// Pattern détecté (chart stylisé)
import React from 'react';

const PatternChart: React.FC = () => (
  <div className="w-full flex items-center justify-center">
    {/* Remplacez ce SVG par un pattern réel */}
    <svg width="320" height="120" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="320" height="120" rx="18" fill="#0A0E17" />
      <polyline points="20,100 60,40 100,80 140,30 180,90 220,50 260,100 300,60" stroke="#00FFD0" strokeWidth="4" fill="none" filter="url(#glow)"/>
      <rect x="60" y="40" width="80" height="40" rx="8" fill="#00FFD0" fillOpacity="0.08" />
      <defs>
        <filter id="glow" x="-10" y="-10" width="340" height="140">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  </div>
);

export default PatternChart;
