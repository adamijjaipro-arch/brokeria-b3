// Illustration IA centrale (cerveau digital, néon)
import React from 'react';

const IllustrationIA: React.FC = () => (
  <div className="flex items-center justify-center">
    {/* Remplacez ce SVG par votre illustration IA personnalisée */}
    <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="80" rx="90" ry="60" fill="#0A0E17" />
      <path d="M40 80 Q110 10 180 80 Q110 150 40 80" stroke="#00FFD0" strokeWidth="4" fill="none" filter="url(#glow)"/>
      <circle cx="110" cy="80" r="32" fill="#00FFD0" fillOpacity="0.12" />
      <circle cx="110" cy="80" r="16" fill="#00FFD0" fillOpacity="0.25" />
      <defs>
        <filter id="glow" x="-20" y="-20" width="260" height="200">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  </div>
);

export default IllustrationIA;
