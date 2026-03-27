from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
import pandas as pd
from candlestick_patterns import CandlestickPatternDetector
from chart_patterns import ChartPatternDetector
from indicators_calculator import TechnicalIndicators
from scoring_engine import ScoringEngine


@dataclass
class TradingSignal:
    asset: str
    direction: str
    entry_price: float
    stop_loss: float
    take_profit: float
    confidence: float
    patterns: List[str]
    indicators: List[str]
    timestamp: datetime
    analysis_summary: str
    risk_reward_ratio: float


class SignalGenerator:
    def __init__(self, df: pd.DataFrame, asset: str):
        self.df = df
        self.asset = asset
        self.close = df['close'].values
        self.high = df['high'].values
        self.low = df['low'].values

    def generate_signal(self) -> TradingSignal:
        current_price = self.close[-1]
        atr = TechnicalIndicators(self.df).atr(14)[-1]

        pattern_detector = CandlestickPatternDetector(self.df)
        patterns = pattern_detector.detect_all()

        chart_detector = ChartPatternDetector(self.df)
        chart_patterns = chart_detector.detect_all()

        indicators = TechnicalIndicators(self.df)
        rsi = indicators.rsi(14)[-1]
        macd_values = indicators.macd(12, 26, 9)
        macd_line = macd_values[-1]
        stoch = indicators.stochastic(14, 3, 3)
        bollinger = indicators.bollinger_bands(20, 2)
        bb_upper = bollinger['upper'][-1]
        bb_lower = bollinger['lower'][-1]
        bb_middle = bollinger['middle'][-1]

        buy_signals = 0
        sell_signals = 0
        active_patterns = []

        for pattern in patterns:
            active_patterns.append(pattern.name)
            if pattern.direction == "BUY":
                buy_signals += 1
            else:
                sell_signals += 1

        for pattern in chart_patterns:
            active_patterns.append(pattern.name)
            if pattern.direction == "BUY":
                buy_signals += 1
            else:
                sell_signals += 1

        if rsi < 30:
            buy_signals += 2
        elif rsi > 70:
            sell_signals += 2

        if macd_line > 0:
            buy_signals += 1
        else:
            sell_signals += 1

        if current_price < bb_lower:
            buy_signals += 1
        elif current_price > bb_upper:
            sell_signals += 1

        active_indicators = []
        if rsi:
            active_indicators.append(f"RSI: {round(rsi, 2)}")
        if macd_line:
            active_indicators.append(f"MACD: {round(macd_line, 2)}")

        if buy_signals > sell_signals:
            direction = "BUY"
            entry_price = current_price
            stop_loss = current_price - (atr * 2)
            take_profit = current_price + (atr * 3)
            confidence = min(95, 50 + (buy_signals * 10))
        elif sell_signals > buy_signals:
            direction = "SELL"
            entry_price = current_price
            stop_loss = current_price + (atr * 2)
            take_profit = current_price - (atr * 3)
            confidence = min(95, 50 + (sell_signals * 10))
        else:
            direction = "HOLD"
            entry_price = current_price
            stop_loss = current_price - atr
            take_profit = current_price + atr
            confidence = 50

        stop_loss = round(max(stop_loss, self.low[-20:].min()), 2)
        take_profit = round(take_profit, 2)
        entry_price = round(entry_price, 2)

        if direction == "HOLD":
            risk_reward_ratio = 0
        else:
            risk = abs(entry_price - stop_loss)
            reward = abs(take_profit - entry_price)
            risk_reward_ratio = round(reward / risk if risk > 0 else 0, 2)

        analysis_summary = f"{active_patterns.__len__()} patterns detected: {', '.join(active_patterns[:3])}. "
        analysis_summary += f"RSI at {round(rsi, 1)}, "
        analysis_summary += f"Price {'below' if current_price < bb_middle else 'above'} Bollinger middle band. "
        analysis_summary += f"Direction: {direction} with {confidence}% confidence."

        signal = TradingSignal(
            asset=self.asset,
            direction=direction,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            confidence=confidence,
            patterns=active_patterns,
            indicators=active_indicators,
            timestamp=datetime.now(),
            analysis_summary=analysis_summary,
            risk_reward_ratio=risk_reward_ratio
        )

        return signal

    def backtest_signals(self, entry_prices: List[float]) -> Dict:
        results = {
            'total_trades': len(entry_prices),
            'winning_trades': 0,
            'losing_trades': 0,
            'win_rate': 0,
            'total_pnl': 0
        }

        for entry in entry_prices:
            if entry < self.close[-1]:
                results['winning_trades'] += 1
                results['total_pnl'] += (self.close[-1] - entry)
            else:
                results['losing_trades'] += 1
                results['total_pnl'] -= (entry - self.close[-1])

        if results['total_trades'] > 0:
            results['win_rate'] = round(
                (results['winning_trades'] / results['total_trades']) * 100, 2
            )

        results['total_pnl'] = round(results['total_pnl'], 2)

        return results
