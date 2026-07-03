import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
  };

  const valueColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
  };

  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-slate-400',
  };

  return (
    <div className={`glass border-2 ${colorClasses[color]} hover:scale-[1.03] transition-all duration-300 fadeIn group shadow-glass`}> 
      <div className="flex justify-between items-start mb-2">
        <p className="text-text-secondary text-sm font-semibold tracking-wide uppercase">{title}</p>
        {icon && <div className={`text-2xl ${valueColors[color]} drop-shadow-lg`}>{icon}</div>}
      </div>
      <p className={`text-4xl font-extrabold gradient-text mb-1 drop-shadow-xl`}>{value}</p>
      {change && (
        <p className={`text-sm ${changeColors[changeType]} font-medium tracking-tight`}> 
          {changeType === 'positive' && <span className="text-green-400">↑ </span>}
          {changeType === 'negative' && <span className="text-red-400">↓ </span>}
          {change}
        </p>
      )}
    </div>
  );
};

export default StatCard;
