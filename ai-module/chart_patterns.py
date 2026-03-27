from typing import List, Dict
from dataclasses import dataclass
import pandas as pd


@dataclass
class ChartPattern:
    name: str
    direction: str
    confidence: float
    entry_level: float
    support: float
    resistance: float
    index: int


class ChartPatternDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df.reset_index(drop=True)
        self.close = df['close'].values
        self.high = df['high'].values
        self.low = df['low'].values
        self.open = df['open'].values

    def detect_all(self) -> List[ChartPattern]:
        patterns = []
        patterns.extend(self.detect_double_top())
        patterns.extend(self.detect_double_bottom())
        patterns.extend(self.detect_triangle())
        patterns.extend(self.detect_head_and_shoulders())
        patterns.extend(self.detect_pennant())
        return patterns

    def detect_double_top(self) -> List[ChartPattern]:
        patterns = []
        if len(self.high) < 30:
            return patterns

        for i in range(15, len(self.high) - 15):
            first_peak = max(self.high[i-15:i])
            first_peak_idx = i - 15 + list(self.high[i-15:i]).index(first_peak)

            valley = min(self.low[first_peak_idx:i+15])
            valley_idx = first_peak_idx + list(self.low[first_peak_idx:i+15]).index(valley)

            second_peak = max(self.high[valley_idx:i+15])
            second_peak_idx = valley_idx + list(self.high[valley_idx:i+15]).index(second_peak)

            if abs(self.high[first_peak_idx] - self.high[second_peak_idx]) / self.high[first_peak_idx] < 0.02:
                neckline = valley
                entry = neckline * 0.995
                support = neckline * 0.98
                resistance = max(self.high[first_peak_idx], self.high[second_peak_idx])

                pattern = ChartPattern(
                    name="Double Top",
                    direction="SELL",
                    confidence=80,
                    entry_level=entry,
                    support=support,
                    resistance=resistance,
                    index=i
                )
                patterns.append(pattern)
                break

        return patterns

    def detect_double_bottom(self) -> List[ChartPattern]:
        patterns = []
        if len(self.low) < 30:
            return patterns

        for i in range(15, len(self.low) - 15):
            first_trough = min(self.low[i-15:i])
            first_trough_idx = i - 15 + list(self.low[i-15:i]).index(first_trough)

            peak = max(self.high[first_trough_idx:i+15])
            peak_idx = first_trough_idx + list(self.high[first_trough_idx:i+15]).index(peak)

            second_trough = min(self.low[peak_idx:i+15])
            second_trough_idx = peak_idx + list(self.low[peak_idx:i+15]).index(second_trough)

            if abs(self.low[first_trough_idx] - self.low[second_trough_idx]) / self.low[first_trough_idx] < 0.02:
                neckline = peak
                entry = neckline * 1.005
                support = min(self.low[first_trough_idx], self.low[second_trough_idx])
                resistance = neckline * 1.02

                pattern = ChartPattern(
                    name="Double Bottom",
                    direction="BUY",
                    confidence=80,
                    entry_level=entry,
                    support=support,
                    resistance=resistance,
                    index=i
                )
                patterns.append(pattern)
                break

        return patterns

    def detect_triangle(self) -> List[ChartPattern]:
        patterns = []
        if len(self.high) < 20:
            return patterns

        for i in range(10, len(self.high) - 10):
            recent_high = self.high[max(0, i-20):i]
            recent_low = self.low[max(0, i-20):i]

            high_range = max(recent_high) - min(recent_high)
            low_range = max(recent_low) - min(recent_low)

            if high_range < low_range * 0.15 and low_range > 0:
                convergence_rate = low_range / 20

                if convergence_rate > 0:
                    direction = "BUY" if self.close[i] > (min(recent_high) + max(recent_low)) / 2 else "SELL"
                    entry = self.close[i]
                    support = min(recent_low)
                    resistance = max(recent_high)

                    pattern = ChartPattern(
                        name="Triangle",
                        direction=direction,
                        confidence=75,
                        entry_level=entry,
                        support=support,
                        resistance=resistance,
                        index=i
                    )
                    patterns.append(pattern)

        return patterns

    def detect_head_and_shoulders(self) -> List[ChartPattern]:
        patterns = []
        if len(self.high) < 40:
            return patterns

        for i in range(20, len(self.high) - 20):
            left_shoulder = max(self.high[i-20:i-10])
            head = max(self.high[i-10:i])
            right_shoulder = max(self.high[i:i+10])

            left_idx = i - 20 + list(self.high[i-20:i-10]).index(left_shoulder)
            head_idx = i - 10 + list(self.high[i-10:i]).index(head)
            right_idx = i + list(self.high[i:i+10]).index(right_shoulder)

            if (head > left_shoulder * 1.05 and head > right_shoulder * 1.05 and
                abs(left_shoulder - right_shoulder) / left_shoulder < 0.05):

                neckline = min(self.low[left_idx:head_idx] + self.low[head_idx:right_idx])
                entry = neckline * 0.995
                support = neckline * 0.98
                resistance = head

                pattern = ChartPattern(
                    name="Head and Shoulders",
                    direction="SELL",
                    confidence=85,
                    entry_level=entry,
                    support=support,
                    resistance=resistance,
                    index=i
                )
                patterns.append(pattern)

        return patterns

    def detect_pennant(self) -> List[ChartPattern]:
        patterns = []
        if len(self.close) < 30:
            return patterns

        for i in range(15, len(self.close) - 15):
            recent_high = self.high[i-15:i]
            recent_low = self.low[i-15:i]

            high_trend = (max(recent_high[:8]) - max(recent_high[8:])) / max(recent_high) if max(recent_high) != 0 else 0
            low_trend = (min(recent_low[:8]) - min(recent_low[8:])) / min(recent_low) if min(recent_low) != 0 else 0

            if abs(high_trend) > 0.01 and abs(low_trend) > 0.01:
                direction = "BUY" if self.close[i] > (max(recent_high) + min(recent_low)) / 2 else "SELL"
                entry = self.close[i]
                support = min(recent_low)
                resistance = max(recent_high)

                pattern = ChartPattern(
                    name="Pennant",
                    direction=direction,
                    confidence=72,
                    entry_level=entry,
                    support=support,
                    resistance=resistance,
                    index=i
                )
                patterns.append(pattern)

        return patterns
