from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime


@dataclass
class TradeRecord:
    entry_price: float
    exit_price: float
    direction: str
    quantity: float
    entry_date: datetime
    exit_date: datetime
    pnl: float
    pnl_percent: float
    signal_confidence: float


class PerformanceTracker:
    def __init__(self):
        self.trades: List[TradeRecord] = []

    def add_trade(self, entry: float, exit: float, direction: str,
                 quantity: float, entry_date: datetime, exit_date: datetime,
                 confidence: float):
        if direction == "BUY":
            pnl = (exit - entry) * quantity
        else:
            pnl = (entry - exit) * quantity

        pnl_percent = (pnl / (entry * quantity)) * 100

        trade = TradeRecord(
            entry_price=entry,
            exit_price=exit,
            direction=direction,
            quantity=quantity,
            entry_date=entry_date,
            exit_date=exit_date,
            pnl=pnl,
            pnl_percent=pnl_percent,
            signal_confidence=confidence
        )

        self.trades.append(trade)

    def get_monthly_stats(self, year: int, month: int) -> Dict:
        monthly_trades = [
            t for t in self.trades
            if t.entry_date.year == year and t.entry_date.month == month
        ]

        if not monthly_trades:
            return {
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'win_rate': 0,
                'total_pnl': 0,
                'avg_pnl_percent': 0,
                'best_trade': 0,
                'worst_trade': 0
            }

        total_trades = len(monthly_trades)
        winning_trades = len([t for t in monthly_trades if t.pnl > 0])
        losing_trades = len([t for t in monthly_trades if t.pnl < 0])

        win_rate = (winning_trades / total_trades) * 100
        total_pnl = sum(t.pnl for t in monthly_trades)
        avg_pnl_percent = sum(t.pnl_percent for t in monthly_trades) / total_trades
        best_trade = max(monthly_trades, key=lambda t: t.pnl).pnl if monthly_trades else 0
        worst_trade = min(monthly_trades, key=lambda t: t.pnl).pnl if monthly_trades else 0

        return {
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round(win_rate, 2),
            'total_pnl': round(total_pnl, 2),
            'avg_pnl_percent': round(avg_pnl_percent, 2),
            'best_trade': round(best_trade, 2),
            'worst_trade': round(worst_trade, 2),
            'trades': monthly_trades
        }
