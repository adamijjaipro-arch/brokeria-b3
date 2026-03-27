// Dashboard futuriste (mockup visuel)
import React from 'react';

const DashboardFuturiste: React.FC = () => (
  <div className="relative w-full max-w-2xl mx-auto p-6 glass border-accent/20 shadow-glass">
    {/* Placez ici un mockup SVG ou image de dashboard */}
    <svg width="100%" height="180" viewBox="0 0 480 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="460" height="140" rx="24" fill="#101622" stroke="#00FFD0" strokeWidth="2"/>
      <rect x="40" y="50" width="120" height="32" rx="10" fill="#00FFD0" fillOpacity="0.12" />
      <rect x="180" y="50" width="80" height="32" rx="10" fill="#00FFD0" fillOpacity="0.12" />
      <rect x="280" y="50" width="160" height="32" rx="10" fill="#00FFD0" fillOpacity="0.12" />
      <rect x="40" y="100" width="400" height="18" rx="6" fill="#00FFD0" fillOpacity="0.08" />
      <rect x="40" y="125" width="320" height="12" rx="6" fill="#00FFD0" fillOpacity="0.06" />
    </svg>
  </div>
);

export default DashboardFuturiste;
