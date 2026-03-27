from typing import List, Dict
from dataclasses import dataclass
import pandas as pd


@dataclass
class ElliottWave:
    wave_number: int
    start_idx: int
    end_idx: int
    start_price: float
    end_price: float
    direction: str
    confidence: float


class ElliottWaveDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df.reset_index(drop=True)
        self.close = df['close'].values
        self.high = df['high'].values
        self.low = df['low'].values

    def detect_waves(self) -> Dict:
        if len(self.close) < 50:
            return {'waves': [], 'pattern': None, 'overall_direction': None}

        waves = []
        wave_1 = self._find_wave_1()

        if wave_1:
            waves.append(wave_1)
            wave_2 = self._find_wave_2(wave_1)

            if wave_2:
                waves.append(wave_2)
                wave_3 = self._find_wave_3(wave_1, wave_2)

                if wave_3:
                    waves.append(wave_3)
                    wave_4 = self._find_wave_4(wave_2, wave_3)

                    if wave_4:
                        waves.append(wave_4)
                        wave_5 = self._find_wave_5(wave_3, wave_4)

                        if wave_5:
                            waves.append(wave_5)

        pattern = None
        overall_direction = None

        if len(waves) >= 5:
            wave_3_size = abs(waves[2].end_price - waves[2].start_price)
            wave_1_size = abs(waves[0].end_price - waves[0].start_price)

            if wave_3_size > wave_1_size:
                pattern = "Complete Elliott Wave (Impulse)"
                overall_direction = waves[4].direction
            else:
                pattern = "Potential Elliott Wave"
                overall_direction = waves[0].direction

        return {
            'waves': waves,
            'pattern': pattern,
            'overall_direction': overall_direction,
            'wave_count': len(waves)
        }

    def _find_wave_1(self) -> ElliottWave:
        if len(self.close) < 20:
            return None

        for i in range(5, min(20, len(self.close))):
            direction = "UP" if self.close[i] > self.close[0] else "DOWN"
            if abs(self.close[i] - self.close[0]) / self.close[0] > 0.02:
                return ElliottWave(
                    wave_number=1,
                    start_idx=0,
                    end_idx=i,
                    start_price=self.close[0],
                    end_price=self.close[i],
                    direction=direction,
                    confidence=70
                )

        return None

    def _find_wave_2(self, wave_1: ElliottWave) -> ElliottWave:
        start_idx = wave_1.end_idx
        lookback = 10

        if start_idx + lookback >= len(self.close):
            return None

        for i in range(start_idx + 2, min(start_idx + lookback, len(self.close))):
            retracement = abs(self.close[i] - self.close[start_idx])
            wave_1_size = abs(wave_1.end_price - wave_1.start_price)

            if 0.15 < (retracement / wave_1_size) < 0.65:
                direction = "DOWN" if wave_1.direction == "UP" else "UP"
                return ElliottWave(
                    wave_number=2,
                    start_idx=start_idx,
                    end_idx=i,
                    start_price=self.close[start_idx],
                    end_price=self.close[i],
                    direction=direction,
                    confidence=65
                )

        return None

    def _find_wave_3(self, wave_1: ElliottWave, wave_2: ElliottWave) -> ElliottWave:
        start_idx = wave_2.end_idx
        lookback = 15

        if start_idx + lookback >= len(self.close):
            return None

        for i in range(start_idx + 2, min(start_idx + lookback, len(self.close))):
            wave_3_size = abs(self.close[i] - self.close[start_idx])
            wave_1_size = abs(wave_1.end_price - wave_1.start_price)

            if wave_3_size > wave_1_size * 1.5:
                direction = wave_1.direction
                return ElliottWave(
                    wave_number=3,
                    start_idx=start_idx,
                    end_idx=i,
                    start_price=self.close[start_idx],
                    end_price=self.close[i],
                    direction=direction,
                    confidence=75
                )

        return None

    def _find_wave_4(self, wave_2: ElliottWave, wave_3: ElliottWave) -> ElliottWave:
        start_idx = wave_3.end_idx
        lookback = 8

        if start_idx + lookback >= len(self.close):
            return None

        for i in range(start_idx + 2, min(start_idx + lookback, len(self.close))):
            retracement = abs(self.close[i] - self.close[start_idx])
            wave_3_size = abs(wave_3.end_price - wave_3.start_price)

            if 0.15 < (retracement / wave_3_size) < 0.50:
                direction = wave_2.direction
                return ElliottWave(
                    wave_number=4,
                    start_idx=start_idx,
                    end_idx=i,
                    start_price=self.close[start_idx],
                    end_price=self.close[i],
                    direction=direction,
                    confidence=60
                )

        return None

    def _find_wave_5(self, wave_3: ElliottWave, wave_4: ElliottWave) -> ElliottWave:
        start_idx = wave_4.end_idx
        lookback = 10

        if start_idx + lookback >= len(self.close):
            return None

        for i in range(start_idx + 2, min(start_idx + lookback, len(self.close))):
            wave_5_size = abs(self.close[i] - self.close[start_idx])
            wave_1_size = abs(wave_3.end_price - wave_3.start_price)

            if wave_5_size > wave_1_size * 0.5:
                direction = wave_3.direction
                return ElliottWave(
                    wave_number=5,
                    start_idx=start_idx,
                    end_idx=i,
                    start_price=self.close[start_idx],
                    end_price=self.close[i],
                    direction=direction,
                    confidence=70
                )

        return None
