from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime, timedelta
import pandas as pd


@dataclass
class MonthlyReport:
    month: str
    year: int
    total_signals: int
    buy_signals: int
    sell_signals: int
    hold_signals: int
    win_rate: float
    avg_confidence: float
    best_signal_confidence: float
    worst_signal_confidence: float
    total_pnl_estimate: float
    total_trades_expected: int
    high_confidence_signals: int
    patterns_detected: Dict[str, int]
    indicators_used: List[str]
    summary: str


class ReportGenerator:
    def __init__(self, signals_data: List[Dict]):
        self.signals = signals_data

    def generate_monthly_report(self, year: int, month: int) -> MonthlyReport:
        month_signals = [
            s for s in self.signals
            if s['timestamp'].year == year and s['timestamp'].month == month
        ]

        if not month_signals:
            return self._empty_report(year, month)

        total = len(month_signals)
        buy = len([s for s in month_signals if s['direction'] == 'BUY'])
        sell = len([s for s in month_signals if s['direction'] == 'SELL'])
        hold = len([s for s in month_signals if s['direction'] == 'HOLD'])

        confidences = [s['confidence'] for s in month_signals]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        best_confidence = max(confidences) if confidences else 0
        worst_confidence = min(confidences) if confidences else 0

        high_confidence = len([c for c in confidences if c >= 75])

        win_rate = len([s for s in month_signals if s['confidence'] >= 70]) / total * 100 if total > 0 else 0

        pattern_counts = {}
        for signal in month_signals:
            for pattern in signal.get('patterns', []):
                pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1

        indicators_set = set()
        for signal in month_signals:
            for indicator in signal.get('indicators', []):
                indicators_set.add(indicator.split(':')[0])

        total_pnl_estimate = sum([s.get('risk_reward_ratio', 0) for s in month_signals]) * 100

        month_name = datetime(year, month, 1).strftime('%B')

        summary = f"Generated {total} trading signals in {month_name} {year}. "
        summary += f"Buy: {buy}, Sell: {sell}, Hold: {hold}. "
        summary += f"Average confidence: {round(avg_confidence, 1)}%. "
        summary += f"{high_confidence} high-confidence signals ({high_confidence}/{total}). "
        summary += f"Top pattern: {max(pattern_counts, key=pattern_counts.get) if pattern_counts else 'N/A'}."

        report = MonthlyReport(
            month=month_name,
            year=year,
            total_signals=total,
            buy_signals=buy,
            sell_signals=sell,
            hold_signals=hold,
            win_rate=round(win_rate, 2),
            avg_confidence=round(avg_confidence, 2),
            best_signal_confidence=best_confidence,
            worst_signal_confidence=worst_confidence,
            total_pnl_estimate=round(total_pnl_estimate, 2),
            total_trades_expected=max(buy, sell),
            high_confidence_signals=high_confidence,
            patterns_detected=pattern_counts,
            indicators_used=sorted(list(indicators_set)),
            summary=summary
        )

        return report

    def generate_yearly_report(self, year: int) -> Dict:
        yearly_signals = [
            s for s in self.signals
            if s['timestamp'].year == year
        ]

        if not yearly_signals:
            return {
                'year': year,
                'total_signals': 0,
                'monthly_reports': [],
                'summary': f"No signals generated in {year}"
            }

        monthly_reports = []
        for month in range(1, 13):
            report = self.generate_monthly_report(year, month)
            if report.total_signals > 0:
                monthly_reports.append(report.__dict__)

        total_signals = len(yearly_signals)
        buy_signals = len([s for s in yearly_signals if s['direction'] == 'BUY'])
        sell_signals = len([s for s in yearly_signals if s['direction'] == 'SELL'])

        avg_confidence = sum([s['confidence'] for s in yearly_signals]) / len(yearly_signals)
        avg_win_rate = sum([m['win_rate'] for m in monthly_reports]) / len(monthly_reports) if monthly_reports else 0

        summary = f"Year {year}: {total_signals} signals generated. "
        summary += f"Buy: {buy_signals}, Sell: {sell_signals}. "
        summary += f"Average confidence: {round(avg_confidence, 1)}%. "
        summary += f"Average monthly win rate: {round(avg_win_rate, 1)}%."

        return {
            'year': year,
            'total_signals': total_signals,
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'avg_confidence': round(avg_confidence, 2),
            'monthly_reports': monthly_reports,
            'summary': summary
        }

    def _empty_report(self, year: int, month: int) -> MonthlyReport:
        month_name = datetime(year, month, 1).strftime('%B')

        return MonthlyReport(
            month=month_name,
            year=year,
            total_signals=0,
            buy_signals=0,
            sell_signals=0,
            hold_signals=0,
            win_rate=0,
            avg_confidence=0,
            best_signal_confidence=0,
            worst_signal_confidence=0,
            total_pnl_estimate=0,
            total_trades_expected=0,
            high_confidence_signals=0,
            patterns_detected={},
            indicators_used=[],
            summary=f"No signals generated in {month_name} {year}"
        )

    def get_performance_metrics(self) -> Dict:
        if not self.signals:
            return {
                'total_signals': 0,
                'confidence_distribution': {},
                'direction_distribution': {},
                'pattern_frequency': {}
            }

        confidences = [s['confidence'] for s in self.signals]
        confidence_ranges = {
            '0-30%': len([c for c in confidences if 0 <= c < 30]),
            '30-50%': len([c for c in confidences if 30 <= c < 50]),
            '50-70%': len([c for c in confidences if 50 <= c < 70]),
            '70-85%': len([c for c in confidences if 70 <= c < 85]),
            '85-100%': len([c for c in confidences if 85 <= c <= 100])
        }

        directions = {}
        for signal in self.signals:
            direction = signal.get('direction', 'UNKNOWN')
            directions[direction] = directions.get(direction, 0) + 1

        patterns = {}
        for signal in self.signals:
            for pattern in signal.get('patterns', []):
                patterns[pattern] = patterns.get(pattern, 0) + 1

        return {
            'total_signals': len(self.signals),
            'confidence_distribution': confidence_ranges,
            'direction_distribution': directions,
            'pattern_frequency': patterns,
            'avg_confidence': round(sum(confidences) / len(confidences), 2)
        }
