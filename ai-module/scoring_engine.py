import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class SignalScore:
    pattern_score: float
    indicator_score: float
    overall_score: float
    direction: str
    confidence: float


class ScoringEngine:
    def __init__(self):
        self.weights = {
            'pattern': 0.5,
            'indicators': 0.5
        }

    def calculate_signal_score(self,
                              patterns: List[any],
                              indicators: Dict) -> SignalScore:
        pattern_score = self._score_patterns(patterns) if patterns else 0.5
        indicator_score = self._score_indicators(indicators)
        overall_score = (pattern_score * self.weights['pattern'] +
                        indicator_score * self.weights['indicators'])

        buy_count = sum(1 for p in patterns if p.direction == 'BUY') if patterns else 0
        sell_count = sum(1 for p in patterns if p.direction == 'SELL') if patterns else 0

        if buy_count > sell_count:
            direction = 'BUY'
        elif sell_count > buy_count:
            direction = 'SELL'
        else:
            direction = 'HOLD'

        return SignalScore(
            pattern_score=pattern_score,
            indicator_score=indicator_score,
            overall_score=overall_score,
            direction=direction,
            confidence=min(100, overall_score * 100)
        )

    def _score_patterns(self, patterns: List) -> float:
        if not patterns:
            return 0.5
        avg_confidence = sum(p.confidence for p in patterns) / len(patterns) / 100
        return avg_confidence

    def _score_indicators(self, indicators: Dict) -> float:
        score = 0.5

        if 'RSI' in indicators:
            rsi = indicators['RSI'].iloc[-1]
            if rsi < 30:
                score += 0.15
            elif rsi > 70:
                score -= 0.15

        if 'MACD' in indicators:
            macd, signal, _ = indicators['MACD']
            if macd.iloc[-1] > signal.iloc[-1]:
                score += 0.10
            else:
                score -= 0.10

        return max(0, min(1, score))
