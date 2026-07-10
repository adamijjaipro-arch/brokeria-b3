import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignalCard from './SignalCard';
import type { Signal } from '@/types';

const mockSignal: Signal = {
  id: '1',
  asset: 'BTC/USD',
  direction: 'BUY',
  confidence: 87.5,
  entry_price: 42000,
  stop_loss: 40000,
  take_profit: 46000,
  createdAt: '2026-03-21T10:00:00.000Z',
};

describe('SignalCard', () => {
  it('affiche le nom de l\'actif', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText('BTC/USD')).toBeInTheDocument();
  });

  it('affiche la direction du signal', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText('BUY')).toBeInTheDocument();
  });

  it('affiche le score de confiance IA', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('affiche les prix d\'entrée, stop-loss et take-profit', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText('$42000.00')).toBeInTheDocument();
    expect(screen.getByText('$40000.00')).toBeInTheDocument();
    expect(screen.getByText('$46000.00')).toBeInTheDocument();
  });

  it('appelle onClick quand on clique sur la carte', () => {
    const onClick = vi.fn();
    render(<SignalCard signal={mockSignal} onClick={onClick} />);
    fireEvent.click(screen.getByText('BTC/USD'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('rend correctement un signal SELL', () => {
    render(<SignalCard signal={{ ...mockSignal, direction: 'SELL' }} />);
    expect(screen.getByText('SELL')).toBeInTheDocument();
  });

  it('rend correctement un signal HOLD', () => {
    render(<SignalCard signal={{ ...mockSignal, direction: 'HOLD' }} />);
    expect(screen.getByText('HOLD')).toBeInTheDocument();
  });

  it('applique le badge accent (cyan néon) pour un signal BUY', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(screen.getByText('BUY')).toHaveClass('bg-accent', 'shadow-neon');
  });

  it('applique le badge alert-error (rouge) pour un signal SELL', () => {
    render(<SignalCard signal={{ ...mockSignal, direction: 'SELL' }} />);
    expect(screen.getByText('SELL')).toHaveClass('bg-alert-error');
  });

  it('applique le badge alert-warning (orange) pour un signal HOLD', () => {
    render(<SignalCard signal={{ ...mockSignal, direction: 'HOLD' }} />);
    expect(screen.getByText('HOLD')).toHaveClass('bg-alert-warning');
  });

  it('utilise les alias camelCase (entryPrice/stopLoss/takeProfit) quand les champs snake_case sont absents', () => {
    const { id, asset, direction, confidence, createdAt } = mockSignal;
    render(
      <SignalCard
        signal={{ id, asset, direction, confidence, createdAt, entryPrice: 43000, stopLoss: 41000, takeProfit: 47000 }}
      />,
    );
    expect(screen.getByText('$43000.00')).toBeInTheDocument();
    expect(screen.getByText('$41000.00')).toBeInTheDocument();
    expect(screen.getByText('$47000.00')).toBeInTheDocument();
  });

  it('affiche $0.00 quand aucun prix (snake_case ni camelCase) n\'est fourni', () => {
    const { id, asset, direction, confidence, createdAt } = mockSignal;
    render(<SignalCard signal={{ id, asset, direction, confidence, createdAt }} />);
    expect(screen.getAllByText('$0.00')).toHaveLength(3);
  });

  it('arrondit le score de confiance à l\'entier le plus proche (87.4 → 87%)', () => {
    render(<SignalCard signal={{ ...mockSignal, confidence: 87.4 }} />);
    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  it('ne plante pas au clic quand aucun onClick n\'est fourni', () => {
    render(<SignalCard signal={mockSignal} />);
    expect(() => fireEvent.click(screen.getByText('BTC/USD'))).not.toThrow();
  });
});
