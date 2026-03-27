import pandas as pd
import numpy as np
from typing import Tuple


class TechnicalIndicators:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def rsi(self, period: int = 14) -> pd.Series:
        delta = self.df['Close'].diff()
        gains = delta.where(delta > 0, 0).rolling(window=period).mean()
        losses = -delta.where(delta < 0, 0).rolling(window=period).mean()
        rs = gains / losses
        return 100 - (100 / (1 + rs))

    def macd(self, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        ema_fast = self.df['Close'].ewm(span=fast).mean()
        ema_slow = self.df['Close'].ewm(span=slow).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram

    def stochastic(self, period: int = 14, smooth_k: int = 3, smooth_d: int = 3) -> Tuple[pd.Series, pd.Series]:
        low_min = self.df['Low'].rolling(window=period).min()
        high_max = self.df['High'].rolling(window=period).max()
        k_percent = 100 * (self.df['Close'] - low_min) / (high_max - low_min)
        k = k_percent.rolling(window=smooth_k).mean()
        d = k.rolling(window=smooth_d).mean()
        return k, d

    def atr(self, period: int = 14) -> pd.Series:
        tr1 = self.df['High'] - self.df['Low']
        tr2 = abs(self.df['High'] - self.df['Close'].shift())
        tr3 = abs(self.df['Low'] - self.df['Close'].shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        return tr.rolling(window=period).mean()

    def bollinger_bands(self, period: int = 20, std_dev: float = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
        sma = self.df['Close'].rolling(window=period).mean()
        std = self.df['Close'].rolling(window=period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        return upper, sma, lower

    def moving_average(self, period: int = 20, ma_type: str = 'SMA') -> pd.Series:
        if ma_type == 'SMA':
            return self.df['Close'].rolling(window=period).mean()
        elif ma_type == 'EMA':
            return self.df['Close'].ewm(span=period).mean()
        raise ValueError("ma_type must be 'SMA' or 'EMA'")

    def fibonacci_retracements(self, high: float, low: float) -> dict:
        diff = high - low
        return {
            '0.0%': high,
            '23.6%': high - (diff * 0.236),
            '38.2%': high - (diff * 0.382),
            '50.0%': high - (diff * 0.5),
            '61.8%': high - (diff * 0.618),
            '78.6%': high - (diff * 0.786),
            '100%': low
        }
