import React from 'react';

interface SignalCardProps {
  signal: {
    id: string;
    asset: string;
    direction: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    entry_price?: number;
    entryPrice?: number;
    stop_loss?: number;
    stopLoss?: number;
    take_profit?: number;
    takeProfit?: number;
    createdAt: string;
  };
  onClick?: () => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onClick }) => {
  const entryPrice = signal.entry_price || signal.entryPrice || 0;
  const stopLoss = signal.stop_loss || signal.stopLoss || 0;
  const takeProfit = signal.take_profit || signal.takeProfit || 0;

  const directionStyles = {
    BUY: {
      badge: 'px-4 py-2 rounded-full font-bold text-black bg-accent shadow-neon pulse',
      border: 'border-accent',
      glow: 'hover:shadow-[0_0_24px_#00FFD0cc]'
    },
    SELL: {
      badge: 'px-4 py-2 rounded-full font-bold text-black bg-alert-error shadow-neon',
      border: 'border-alert-error',
      glow: 'hover:shadow-[0_0_24px_#FF3B30cc]'
    },
    HOLD: {
      badge: 'px-4 py-2 rounded-full font-bold text-black bg-alert-warning shadow-neon',
      border: 'border-alert-warning',
      glow: 'hover:shadow-[0_0_24px_#FFD60Acc]'
    }
  };

  const style = directionStyles[signal.direction];

  return (
    <div
      onClick={onClick}
      className={`glass border-2 ${style.border} ${style.glow} cursor-pointer hover:scale-[1.03] transition-all duration-300 fadeIn group`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        {/* Asset & Time */}
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold gradient-text mb-1 drop-shadow-lg">{signal.asset}</h3>
          <p className="text-xs text-text-secondary">
            {new Date(signal.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-text-secondary mb-1">Entrée</p>
            <p className="text-base font-semibold text-text-primary">${entryPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Stop Loss</p>
            <p className="text-base font-semibold text-alert-error">${stopLoss.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Take Profit</p>
            <p className="text-base font-semibold text-alert-success">${takeProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* Direction & Score IA */}
        <div className="flex flex-col items-center gap-2">
          <div className={style.badge}>
            {signal.direction}
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">Score IA</p>
            <p className="text-xl font-bold gradient-text drop-shadow-lg">{signal.confidence.toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
