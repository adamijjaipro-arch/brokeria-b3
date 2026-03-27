// Projection long terme (courbe ascendante)
import React from 'react';

const ProjectionLongTerme: React.FC = () => (
  <div className="w-full flex items-center justify-center">
    <svg width="320" height="120" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="320" height="120" rx="18" fill="#0A0E17" />
      <path d="M20 100 Q80 60 160 80 Q240 100 300 30" stroke="#00FFD0" strokeWidth="4" fill="none" filter="url(#glow)"/>
      <path d="M300 30 Q310 40 320 20" stroke="#00FFD0" strokeWidth="2" fill="none" strokeDasharray="6 4"/>
      <circle cx="300" cy="30" r="7" fill="#00FFD0" fillOpacity="0.5" />
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

export default ProjectionLongTerme;
