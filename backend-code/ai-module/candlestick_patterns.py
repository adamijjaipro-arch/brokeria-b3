import pandas as pd
import numpy as np
from typing import List, Dict
from dataclasses import dataclass


@dataclass
class CandlePattern:
    name: str
    direction: str
    confidence: float
    index: int


class CandlestickPatternDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self._calculate_metrics()

    def _calculate_metrics(self):
        self.df['BodySize'] = abs(self.df['Close'] - self.df['Open'])
        self.df['HighWick'] = self.df['High'] - self.df[['Open', 'Close']].max(axis=1)
        self.df['LowWick'] = self.df[['Open', 'Close']].min(axis=1) - self.df['Low']
        self.df['Range'] = self.df['High'] - self.df['Low']
        self.df['IsBullish'] = self.df['Close'] > self.df['Open']

    def detect_all(self) -> List[CandlePattern]:
        patterns = []
        for i in range(2, len(self.df)):
            patterns.extend(self.detect_hammer(i))
            patterns.extend(self.detect_doji(i))
            patterns.extend(self.detect_engulfing(i))
            patterns.extend(self.detect_shooting_star(i))
            patterns.extend(self.detect_three_white_soldiers(i))
        return patterns

    def detect_hammer(self, i: int) -> List[CandlePattern]:
        candle = self.df.iloc[i]
        body = candle['BodySize']
        low_wick = candle['LowWick']
        high_wick = candle['HighWick']

        if body > 0 and low_wick >= 2 * body and high_wick < body:
            confidence = 75 + (low_wick / body) * 10
            return [CandlePattern('Hammer', 'BUY', min(100, confidence), i)]
        return []

    def detect_doji(self, i: int) -> List[CandlePattern]:
        candle = self.df.iloc[i]
        body = candle['BodySize']
        high_wick = candle['HighWick']
        low_wick = candle['LowWick']
        range_ = candle['Range']

        if body < range_ * 0.1 and abs(high_wick - low_wick) < range_ * 0.2:
            direction = 'SELL' if i > 0 and self.df.iloc[i-1]['Close'] > candle['Close'] else 'BUY'
            return [CandlePattern('Doji', direction, 70, i)]
        return []

    def detect_engulfing(self, i: int) -> List[CandlePattern]:
        if i < 1:
            return []
        curr = self.df.iloc[i]
        prev = self.df.iloc[i-1]

        if not prev['IsBullish'] and curr['IsBullish'] and curr['Open'] < prev['Close'] and curr['Close'] > prev['Open']:
            return [CandlePattern('Bullish Engulfing', 'BUY', 80, i)]

        if prev['IsBullish'] and not curr['IsBullish'] and curr['Open'] > prev['Close'] and curr['Close'] < prev['Open']:
            return [CandlePattern('Bearish Engulfing', 'SELL', 80, i)]

        return []

    def detect_shooting_star(self, i: int) -> List[CandlePattern]:
        candle = self.df.iloc[i]
        body = candle['BodySize']
        high_wick = candle['HighWick']
        low_wick = candle['LowWick']

        if body > 0 and high_wick >= 2 * body and low_wick < body and not candle['IsBullish']:
            confidence = 75 + (high_wick / body) * 10
            return [CandlePattern('Shooting Star', 'SELL', min(100, confidence), i)]
        return []

    def detect_three_white_soldiers(self, i: int) -> List[CandlePattern]:
        if i < 2:
            return []
        c1 = self.df.iloc[i-2]
        c2 = self.df.iloc[i-1]
        c3 = self.df.iloc[i]

        if c1['IsBullish'] and c2['IsBullish'] and c3['IsBullish'] and c1['Close'] < c2['Close'] < c3['Close']:
            return [CandlePattern('Three White Soldiers', 'BUY', 85, i)]
        return []
