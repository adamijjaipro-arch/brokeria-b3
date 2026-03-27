from typing import List, Dict
from dataclasses import dataclass
import pandas as pd


@dataclass
class HarmonicPattern:
    name: str
    direction: str
    confidence: float
    x_price: float
    a_price: float
    b_price: float
    c_price: float
    d_price: float
    entry_level: float
    stop_loss: float
    take_profit: float
    index: int


class HarmonicDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df.reset_index(drop=True)
        self.close = df['close'].values
        self.high = df['high'].values
        self.low = df['low'].values

    def detect_all(self) -> List[HarmonicPattern]:
        patterns = []
        patterns.extend(self.detect_gartley())
        patterns.extend(self.detect_bat())
        patterns.extend(self.detect_butterfly())
        patterns.extend(self.detect_crab())
        return patterns

    def detect_gartley(self) -> List[HarmonicPattern]:
        patterns = []
        if len(self.close) < 50:
            return patterns

        for i in range(40, len(self.close)):
            x = self.close[i-40]
            a = max(self.high[i-40:i-30]) if max(self.high[i-40:i-30]) > x else x
            a_idx = i - 40 + list(self.high[i-40:i-30]).index(a) if a in self.high[i-40:i-30] else i-35

            b = min(self.low[a_idx:i-10])
            b_price = b

            c = max(self.high[i-10:i])
            c_price = c

            d = min(self.low[i-5:i])

            xab_ratio = (b_price - x) / (a - x) if (a - x) != 0 else 0
            abc_ratio = (c_price - b_price) / (a - x) if (a - x) != 0 else 0
            xad_ratio = (d - x) / (a - x) if (a - x) != 0 else 0

            if (0.55 < xab_ratio < 0.65 and 0.45 < abc_ratio < 0.55 and
                0.75 < xad_ratio < 0.85):

                entry = d
                stop_loss = a * 1.01
                take_profit = x

                pattern = HarmonicPattern(
                    name="Gartley",
                    direction="SELL",
                    confidence=85,
                    x_price=x,
                    a_price=a,
                    b_price=b_price,
                    c_price=c_price,
                    d_price=d,
                    entry_level=entry,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    index=i
                )
                patterns.append(pattern)

        return patterns

    def detect_bat(self) -> List[HarmonicPattern]:
        patterns = []
        if len(self.close) < 50:
            return patterns

        for i in range(40, len(self.close)):
            x = self.close[i-40]
            a = max(self.high[i-40:i-30])
            a_idx = i - 40 + list(self.high[i-40:i-30]).index(a) if a in self.high[i-40:i-30] else i-35

            b = min(self.low[a_idx:i-10])
            b_price = b

            c = max(self.high[i-10:i])
            c_price = c

            d = min(self.low[i-5:i])

            xab_ratio = (b_price - x) / (a - x) if (a - x) != 0 else 0
            abc_ratio = (c_price - b_price) / (a - x) if (a - x) != 0 else 0
            xad_ratio = (d - x) / (a - x) if (a - x) != 0 else 0

            if (0.40 < xab_ratio < 0.50 and 0.45 < abc_ratio < 0.55 and
                0.80 < xad_ratio < 0.90):

                entry = d
                stop_loss = a * 1.015
                take_profit = x

                pattern = HarmonicPattern(
                    name="Bat",
                    direction="SELL",
                    confidence=80,
                    x_price=x,
                    a_price=a,
                    b_price=b_price,
                    c_price=c_price,
                    d_price=d,
                    entry_level=entry,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    index=i
                )
                patterns.append(pattern)

        return patterns

    def detect_butterfly(self) -> List[HarmonicPattern]:
        patterns = []
        if len(self.close) < 50:
            return patterns

        for i in range(40, len(self.close)):
            x = self.close[i-40]
            a = max(self.high[i-40:i-30])
            a_idx = i - 40 + list(self.high[i-40:i-30]).index(a) if a in self.high[i-40:i-30] else i-35

            b = min(self.low[a_idx:i-10])
            b_price = b

            c = max(self.high[i-10:i])
            c_price = c

            d = min(self.low[i-5:i])

            xab_ratio = (b_price - x) / (a - x) if (a - x) != 0 else 0
            abc_ratio = (c_price - b_price) / (a - x) if (a - x) != 0 else 0
            xad_ratio = (d - x) / (a - x) if (a - x) != 0 else 0

            if (0.65 < xab_ratio < 0.75 and 0.45 < abc_ratio < 0.55 and
                1.15 < xad_ratio < 1.25):

                entry = d
                stop_loss = a * 1.02
                take_profit = x

                pattern = HarmonicPattern(
                    name="Butterfly",
                    direction="SELL",
                    confidence=75,
                    x_price=x,
                    a_price=a,
                    b_price=b_price,
                    c_price=c_price,
                    d_price=d,
                    entry_level=entry,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    index=i
                )
                patterns.append(pattern)

        return patterns

    def detect_crab(self) -> List[HarmonicPattern]:
        patterns = []
        if len(self.close) < 50:
            return patterns

        for i in range(40, len(self.close)):
            x = self.close[i-40]
            a = max(self.high[i-40:i-30])
            a_idx = i - 40 + list(self.high[i-40:i-30]).index(a) if a in self.high[i-40:i-30] else i-35

            b = min(self.low[a_idx:i-10])
            b_price = b

            c = max(self.high[i-10:i])
            c_price = c

            d = min(self.low[i-5:i])

            xab_ratio = (b_price - x) / (a - x) if (a - x) != 0 else 0
            abc_ratio = (c_price - b_price) / (a - x) if (a - x) != 0 else 0
            xad_ratio = (d - x) / (a - x) if (a - x) != 0 else 0

            if (0.35 < xab_ratio < 0.45 and 0.45 < abc_ratio < 0.55 and
                1.55 < xad_ratio < 1.65):

                entry = d
                stop_loss = a * 1.025
                take_profit = x

                pattern = HarmonicPattern(
                    name="Crab",
                    direction="SELL",
                    confidence=85,
                    x_price=x,
                    a_price=a,
                    b_price=b_price,
                    c_price=c_price,
                    d_price=d,
                    entry_level=entry,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    index=i
                )
                patterns.append(pattern)

        return patterns
