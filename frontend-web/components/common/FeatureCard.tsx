import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  return (
    <div
      className="glass-card border border-slate-200 hover:border-sky-300 hover:scale-[1.03] transition-all duration-300 fadeIn group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform duration-300 pulse">
        {icon}
      </div>
      <h3 className="text-2xl font-extrabold gradient-text mb-3 transition-all">
        {title}
      </h3>
      <p className="text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
