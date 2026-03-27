from typing import Dict
from dataclasses import dataclass
import pandas as pd


@dataclass
class IchimokuValues:
    tenkan_sen: float
    kijun_sen: float
    senkou_span_a: float
    senkou_span_b: float
    chikou_span: float
    kumo_color: str
    signal: str
    confidence: float


class IchimokuIndicator:
    def __init__(self, df: pd.DataFrame):
        self.df = df.reset_index(drop=True)
        self.close = df['close'].values
        self.high = df['high'].values
        self.low = df['low'].values

    def calculate(self, tenkan_period: int = 9, kijun_period: int = 26,
                 senkou_b_period: int = 52, chikou_period: int = 26) -> Dict:
        result = {}

        tenkan_sen = self._calculate_tenkan_sen(tenkan_period)
        kijun_sen = self._calculate_kijun_sen(kijun_period)
        senkou_span_a = (tenkan_sen + kijun_sen) / 2
        senkou_span_b = self._calculate_senkou_span_b(senkou_b_period)
        chikou_span = self._calculate_chikou_span(chikou_period)

        result['tenkan_sen'] = round(tenkan_sen, 2)
        result['kijun_sen'] = round(kijun_sen, 2)
        result['senkou_span_a'] = round(senkou_span_a, 2)
        result['senkou_span_b'] = round(senkou_span_b, 2)
        result['chikou_span'] = round(chikou_span, 2)

        current_price = self.close[-1]

        kumo_top = max(senkou_span_a, senkou_span_b)
        kumo_bottom = min(senkou_span_a, senkou_span_b)
        kumo_color = "BULLISH" if senkou_span_a > senkou_span_b else "BEARISH"

        result['kumo_color'] = kumo_color
        result['price_in_kumo'] = kumo_bottom <= current_price <= kumo_top

        tenkan_above_kijun = tenkan_sen > kijun_sen
        price_above_kumo = current_price > kumo_top
        chikou_above_price = chikou_span > current_price

        bullish_signals = sum([tenkan_above_kijun, price_above_kumo, chikou_above_price])
        bearish_signals = 3 - bullish_signals

        if bullish_signals >= 2:
            signal = "BUY"
            confidence = min(95, 70 + (bullish_signals * 10))
        elif bearish_signals >= 2:
            signal = "SELL"
            confidence = min(95, 70 + (bearish_signals * 10))
        else:
            signal = "HOLD"
            confidence = 50

        result['signal'] = signal
        result['confidence'] = confidence
        result['tenkan_above_kijun'] = tenkan_above_kijun
        result['price_above_kumo'] = price_above_kumo
        result['chikou_above_price'] = chikou_above_price

        return result

    def _calculate_tenkan_sen(self, period: int) -> float:
        if len(self.high) < period:
            return (max(self.high) + min(self.low)) / 2

        recent_high = max(self.high[-period:])
        recent_low = min(self.low[-period:])

        return (recent_high + recent_low) / 2

    def _calculate_kijun_sen(self, period: int) -> float:
        if len(self.high) < period:
            return (max(self.high) + min(self.low)) / 2

        recent_high = max(self.high[-period:])
        recent_low = min(self.low[-period:])

        return (recent_high + recent_low) / 2

    def _calculate_senkou_span_b(self, period: int) -> float:
        if len(self.high) < period:
            return (max(self.high) + min(self.low)) / 2

        recent_high = max(self.high[-period:])
        recent_low = min(self.low[-period:])

        return (recent_high + recent_low) / 2

    def _calculate_chikou_span(self, period: int) -> float:
        if len(self.close) < period:
            return self.close[-1]

        return self.close[-period]

    def get_support_resistance(self) -> Dict:
        tenkan = self._calculate_tenkan_sen(9)
        kijun = self._calculate_kijun_sen(26)

        support_levels = [
            min(self.low[-26:]),
            kijun,
            (tenkan + kijun) / 2
        ]

        resistance_levels = [
            max(self.high[-26:]),
            tenkan,
            (tenkan + kijun) / 2
        ]

        return {
            'support_levels': sorted(support_levels),
            'resistance_levels': sorted(resistance_levels, reverse=True),
            'pivot': (tenkan + kijun) / 2
        }
