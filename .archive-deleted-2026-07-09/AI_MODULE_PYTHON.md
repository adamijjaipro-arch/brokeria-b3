# 🤖 MODULE IA - PYTHON (STANDALONE)

## ARCHITECTURE

Le module IA est un service Python séparé qui:
- Reçoit les données de marché (OHLCV)
- Détecte les patterns de chandeliers (Hammer, Doji, Engulfing, etc.)
- Calcule les indicateurs techniques (RSI, MACD, Bollinger)
- Génère les signaux avec scores de confiance
- Retourne les résultats au Backend via API

---

## 📦 requirements.txt

```
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
scipy==1.11.4
ta-lib==0.4.28  # Technical Analysis
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
requests==2.31.0
```

---

## 🔧 MODULE 1: Détection de Patterns Chandeliers

### 1. pattern_detector.py

```python
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

class PatternType(str, Enum):
    HAMMER = "hammer"
    DOJI = "doji"
    ENGULFING = "engulfing"
    MORNING_STAR = "morning_star"
    EVENING_STAR = "evening_star"
    THREE_WHITE_SOLDIERS = "three_white_soldiers"
    THREE_BLACK_CROWS = "three_black_crows"
    PIERCING_LINE = "piercing_line"
    DARK_CLOUD = "dark_cloud"
    SHOOTING_STAR = "shooting_star"

@dataclass
class Pattern:
    """Représente un pattern détecté"""
    type: PatternType
    confidence: float  # 0-100
    index: int  # Position dans la série
    direction: str  # "BUY" ou "SELL"
    description: str

class CandlestickPatternDetector:
    """Détecte les patterns de chandeliers japonais"""
    
    def __init__(self, df: pd.DataFrame):
        """
        Args:
            df: DataFrame avec colonnes [Open, High, Low, Close, Volume]
        """
        self.df = df.copy()
        self.df['BodySize'] = abs(self.df['Close'] - self.df['Open'])
        self.df['UpperWick'] = self.df['High'] - self.df[['Open', 'Close']].max(axis=1)
        self.df['LowerWick'] = self.df[['Open', 'Close']].min(axis=1) - self.df['Low']
        self.df['Range'] = self.df['High'] - self.df['Low']
    
    def detect_all_patterns(self) -> List[Pattern]:
        """Détecte tous les patterns dans la série"""
        patterns = []
        
        for i in range(2, len(self.df)):
            # Single candle patterns
            patterns.extend(self._detect_hammer(i))
            patterns.extend(self._detect_doji(i))
            patterns.extend(self._detect_shooting_star(i))
            
            # Two candle patterns
            patterns.extend(self._detect_engulfing(i))
            patterns.extend(self._detect_piercing_line(i))
            patterns.extend(self._detect_dark_cloud(i))
            
            # Three candle patterns
            if i >= 2:
                patterns.extend(self._detect_morning_star(i))
                patterns.extend(self._detect_evening_star(i))
                patterns.extend(self._detect_three_white_soldiers(i))
                patterns.extend(self._detect_three_black_crows(i))
        
        return patterns
    
    def _detect_hammer(self, i: int) -> List[Pattern]:
        """Détecte un Hammer (marteau)"""
        patterns = []
        row = self.df.iloc[i]
        
        body_size = row['BodySize']
        lower_wick = row['LowerWick']
        upper_wick = row['UpperWick']
        
        # Hammer: small body, long lower wick, small upper wick
        if body_size > 0 and lower_wick >= 2 * body_size and upper_wick < body_size:
            # Check if bullish (close > open)
            if row['Close'] > row['Open']:
                confidence = min(100, 70 + (lower_wick / body_size) * 10)
                patterns.append(Pattern(
                    type=PatternType.HAMMER,
                    confidence=confidence,
                    index=i,
                    direction="BUY",
                    description=f"Hammer at index {i}"
                ))
        
        return patterns
    
    def _detect_doji(self, i: int) -> List[Pattern]:
        """Détecte un Doji (indécision)"""
        patterns = []
        row = self.df.iloc[i]
        
        body_size = row['BodySize']
        upper_wick = row['UpperWick']
        lower_wick = row['LowerWick']
        range_ = row['Range']
        
        # Doji: very small body, wicks on both sides
        if body_size < range_ * 0.05 and upper_wick > 0 and lower_wick > 0:
            confidence = min(100, 60 + (range_ - body_size) / range_ * 40)
            
            # Determine direction based on previous candles
            if i > 0 and self.df.iloc[i-1]['Close'] < self.df.iloc[i]['Close']:
                direction = "BUY"
            else:
                direction = "SELL"
            
            patterns.append(Pattern(
                type=PatternType.DOJI,
                confidence=confidence,
                index=i,
                direction=direction,
                description=f"Doji at index {i}"
            ))
        
        return patterns
    
    def _detect_engulfing(self, i: int) -> List[Pattern]:
        """Détecte un Engulfing (avalement)"""
        patterns = []
        if i < 1:
            return patterns
        
        prev = self.df.iloc[i-1]
        curr = self.df.iloc[i]
        
        # Bullish engulfing
        if (prev['Close'] <= prev['Open'] and  # Previous bearish
            curr['Close'] > curr['Open'] and   # Current bullish
            curr['Open'] < prev['Close'] and
            curr['Close'] > prev['Open']):
            
            confidence = min(100, 75 + (curr['BodySize'] / prev['BodySize']) * 10)
            patterns.append(Pattern(
                type=PatternType.ENGULFING,
                confidence=confidence,
                index=i,
                direction="BUY",
                description=f"Bullish Engulfing at index {i}"
            ))
        
        # Bearish engulfing
        if (prev['Close'] >= prev['Open'] and  # Previous bullish
            curr['Close'] < curr['Open'] and   # Current bearish
            curr['Open'] > prev['Close'] and
            curr['Close'] < prev['Open']):
            
            confidence = min(100, 75 + (curr['BodySize'] / prev['BodySize']) * 10)
            patterns.append(Pattern(
                type=PatternType.ENGULFING,
                confidence=confidence,
                index=i,
                direction="SELL",
                description=f"Bearish Engulfing at index {i}"
            ))
        
        return patterns
    
    def _detect_morning_star(self, i: int) -> List[Pattern]:
        """Détecte une Morning Star"""
        patterns = []
        if i < 2:
            return patterns
        
        c1 = self.df.iloc[i-2]  # Long red candle
        c2 = self.df.iloc[i-1]  # Small candle
        c3 = self.df.iloc[i]    # Long green candle
        
        # Morning star pattern
        if (c1['Close'] < c1['Open'] and  # Red
            c2['BodySize'] < c1['BodySize'] * 0.5 and  # Small
            c3['Close'] > c3['Open'] and  # Green
            c3['Close'] > c1['Open']):  # Above first close
            
            confidence = 80
            patterns.append(Pattern(
                type=PatternType.MORNING_STAR,
                confidence=confidence,
                index=i,
                direction="BUY",
                description=f"Morning Star at index {i}"
            ))
        
        return patterns
    
    def _detect_shooting_star(self, i: int) -> List[Pattern]:
        """Détecte une Shooting Star"""
        patterns = []
        row = self.df.iloc[i]
        
        body_size = row['BodySize']
        upper_wick = row['UpperWick']
        lower_wick = row['LowerWick']
        
        # Shooting star: small body, long upper wick
        if body_size > 0 and upper_wick >= 2 * body_size and lower_wick < body_size:
            if row['Close'] < row['Open']:  # Bearish
                confidence = min(100, 70 + (upper_wick / body_size) * 10)
                patterns.append(Pattern(
                    type=PatternType.SHOOTING_STAR,
                    confidence=confidence,
                    index=i,
                    direction="SELL",
                    description=f"Shooting Star at index {i}"
                ))
        
        return patterns
    
    def _detect_piercing_line(self, i: int) -> List[Pattern]:
        """Détecte une Piercing Line"""
        patterns = []
        if i < 1:
            return patterns
        
        prev = self.df.iloc[i-1]
        curr = self.df.iloc[i]
        
        # Piercing line: first red, second green goes above midpoint
        if (prev['Close'] < prev['Open'] and  # Red candle
            curr['Close'] > curr['Open'] and  # Green candle
            curr['Close'] > ((prev['Open'] + prev['Close']) / 2) and
            curr['Open'] < prev['Close']):
            
            confidence = 75
            patterns.append(Pattern(
                type=PatternType.PIERCING_LINE,
                confidence=confidence,
                index=i,
                direction="BUY",
                description=f"Piercing Line at index {i}"
            ))
        
        return patterns
    
    def _detect_dark_cloud(self, i: int) -> List[Pattern]:
        """Détecte une Dark Cloud"""
        patterns = []
        if i < 1:
            return patterns
        
        prev = self.df.iloc[i-1]
        curr = self.df.iloc[i]
        
        # Dark cloud: first green, second red goes below midpoint
        if (prev['Close'] > prev['Open'] and  # Green candle
            curr['Close'] < curr['Open'] and  # Red candle
            curr['Close'] < ((prev['Open'] + prev['Close']) / 2) and
            curr['Open'] > prev['Close']):
            
            confidence = 75
            patterns.append(Pattern(
                type=PatternType.DARK_CLOUD,
                confidence=confidence,
                index=i,
                direction="SELL",
                description=f"Dark Cloud at index {i}"
            ))
        
        return patterns
    
    def _detect_three_white_soldiers(self, i: int) -> List[Pattern]:
        """Détecte Three White Soldiers"""
        patterns = []
        if i < 2:
            return patterns
        
        c1 = self.df.iloc[i-2]
        c2 = self.df.iloc[i-1]
        c3 = self.df.iloc[i]
        
        # Three consecutive bullish candles with rising closes
        if (c1['Close'] > c1['Open'] and
            c2['Close'] > c2['Open'] and
            c3['Close'] > c3['Open'] and
            c1['Close'] < c2['Close'] < c3['Close']):
            
            confidence = 85
            patterns.append(Pattern(
                type=PatternType.THREE_WHITE_SOLDIERS,
                confidence=confidence,
                index=i,
                direction="BUY",
                description=f"Three White Soldiers at index {i}"
            ))
        
        return patterns
    
    def _detect_three_black_crows(self, i: int) -> List[Pattern]:
        """Détecte Three Black Crows"""
        patterns = []
        if i < 2:
            return patterns
        
        c1 = self.df.iloc[i-2]
        c2 = self.df.iloc[i-1]
        c3 = self.df.iloc[i]
        
        # Three consecutive bearish candles with falling closes
        if (c1['Close'] < c1['Open'] and
            c2['Close'] < c2['Open'] and
            c3['Close'] < c3['Open'] and
            c1['Close'] > c2['Close'] > c3['Close']):
            
            confidence = 85
            patterns.append(Pattern(
                type=PatternType.THREE_BLACK_CROWS,
                confidence=confidence,
                index=i,
                direction="SELL",
                description=f"Three Black Crows at index {i}"
            ))
        
        return patterns
    
    def _detect_evening_star(self, i: int) -> List[Pattern]:
        """Détecte une Evening Star"""
        patterns = []
        if i < 2:
            return patterns
        
        c1 = self.df.iloc[i-2]
        c2 = self.df.iloc[i-1]
        c3 = self.df.iloc[i]
        
        # Evening star pattern
        if (c1['Close'] > c1['Open'] and  # Green
            c2['BodySize'] < c1['BodySize'] * 0.5 and  # Small
            c3['Close'] < c3['Open'] and  # Red
            c3['Close'] < c1['Open']):  # Below first close
            
            confidence = 80
            patterns.append(Pattern(
                type=PatternType.EVENING_STAR,
                confidence=confidence,
                index=i,
                direction="SELL",
                description=f"Evening Star at index {i}"
            ))
        
        return patterns
```

---

## 📊 MODULE 2: Indicateurs Techniques

### 2. technical_indicators.py

```python
import pandas as pd
import numpy as np
from typing import Tuple, Dict
from dataclasses import dataclass

@dataclass
class IndicatorValues:
    rsi: float
    macd: float
    macd_signal: float
    bollinger_upper: float
    bollinger_lower: float
    bollinger_mid: float
    atr: float

class TechnicalIndicators:
    """Calcule les indicateurs techniques"""
    
    @staticmethod
    def calculate_rsi(data: pd.Series, period: int = 14) -> pd.Series:
        """Relative Strength Index"""
        deltas = data.diff()
        gains = (deltas.where(deltas > 0, 0)).rolling(window=period).mean()
        losses = (-deltas.where(deltas < 0, 0)).rolling(window=period).mean()
        rs = gains / losses
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def calculate_macd(data: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series]:
        """MACD (Moving Average Convergence Divergence)"""
        ema_fast = data.ewm(span=fast).mean()
        ema_slow = data.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        signal_line = macd.ewm(span=signal).mean()
        return macd, signal_line
    
    @staticmethod
    def calculate_bollinger_bands(data: pd.Series, period: int = 20, std_dev: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Bollinger Bands"""
        sma = data.rolling(window=period).mean()
        std = data.rolling(window=period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        return upper, lower, sma
    
    @staticmethod
    def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
        """Average True Range"""
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        return atr
    
    @staticmethod
    def calculate_fibonacci_retracements(high: float, low: float) -> Dict[str, float]:
        """Niveaux de retracement Fibonacci"""
        diff = high - low
        return {
            "0%": high,
            "23.6%": high - diff * 0.236,
            "38.2%": high - diff * 0.382,
            "50%": high - diff * 0.5,
            "61.8%": high - diff * 0.618,
            "100%": low,
        }
```

---

## 📈 MODULE 3: Génération de Signaux

### 3. signal_generator.py

```python
from dataclasses import dataclass
from typing import List, Dict
from pattern_detector import Pattern, CandlestickPatternDetector
from technical_indicators import TechnicalIndicators
import pandas as pd
import numpy as np

@dataclass
class Signal:
    asset: str
    timeframe: str
    direction: str  # BUY, SELL, HOLD
    confidence: int  # 0-100
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: float
    pattern_type: str
    indicators: Dict
    detected_patterns: List[str]

class SignalGenerator:
    """Génère les signaux avec scoring"""
    
    def __init__(self, df: pd.DataFrame, asset: str, timeframe: str):
        self.df = df
        self.asset = asset
        self.timeframe = timeframe
        self.current_price = df['Close'].iloc[-1]
    
    def generate_signal(self) -> Signal | None:
        """Génère un signal basé sur les patterns et indicateurs"""
        
        # Détecte les patterns
        detector = CandlestickPatternDetector(self.df)
        patterns = detector.detect_all_patterns()
        
        if not patterns:
            return None
        
        # Prend le dernier pattern détecté
        last_pattern = patterns[-1]
        
        # Calcule les indicateurs
        indicators = self._calculate_indicators()
        
        # Score global
        confidence = self._calculate_confidence(last_pattern, indicators)
        
        # Entry, SL, TP
        entry_price = self.current_price
        stop_loss, take_profit = self._calculate_levels(last_pattern.direction)
        risk_reward = (take_profit - entry_price) / (entry_price - stop_loss) if entry_price != stop_loss else 0
        
        return Signal(
            asset=self.asset,
            timeframe=self.timeframe,
            direction=last_pattern.direction,
            confidence=confidence,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            risk_reward=risk_reward,
            pattern_type=last_pattern.type.value,
            indicators=indicators,
            detected_patterns=[p.type.value for p in patterns[-3:]]  # Last 3 patterns
        )
    
    def _calculate_indicators(self) -> Dict:
        """Calcule les indicateurs techniques"""
        rsi = TechnicalIndicators.calculate_rsi(self.df['Close']).iloc[-1]
        macd, signal = TechnicalIndicators.calculate_macd(self.df['Close'])
        macd_val = macd.iloc[-1]
        signal_val = signal.iloc[-1]
        upper, lower, mid = TechnicalIndicators.calculate_bollinger_bands(self.df['Close'])
        atr = TechnicalIndicators.calculate_atr(
            self.df['High'], self.df['Low'], self.df['Close']
        ).iloc[-1]
        
        fib_levels = TechnicalIndicators.calculate_fibonacci_retracements(
            self.df['High'].max(), self.df['Low'].min()
        )
        
        return {
            'rsi': float(rsi),
            'macd': float(macd_val),
            'macd_signal': float(signal_val),
            'bollinger_upper': float(upper.iloc[-1]),
            'bollinger_lower': float(lower.iloc[-1]),
            'atr': float(atr),
            'fibonacci': fib_levels
        }
    
    def _calculate_confidence(self, pattern: Pattern, indicators: Dict) -> int:
        """Calcule le score de confiance global"""
        confidence = pattern.confidence
        
        # Adjust based on RSI
        rsi = indicators['rsi']
        if pattern.direction == "BUY" and rsi < 30:
            confidence += 10
        elif pattern.direction == "SELL" and rsi > 70:
            confidence += 10
        
        # Adjust based on MACD
        if (pattern.direction == "BUY" and 
            indicators['macd'] > indicators['macd_signal']):
            confidence += 5
        elif (pattern.direction == "SELL" and 
              indicators['macd'] < indicators['macd_signal']):
            confidence += 5
        
        # Adjust based on Bollinger Bands
        if (pattern.direction == "BUY" and 
            self.current_price < indicators['bollinger_lower']):
            confidence += 10
        elif (pattern.direction == "SELL" and 
              self.current_price > indicators['bollinger_upper']):
            confidence += 10
        
        return min(100, int(confidence))
    
    def _calculate_levels(self, direction: str) -> tuple[float, float]:
        """Calcule Stop Loss et Take Profit"""
        atr = TechnicalIndicators.calculate_atr(
            self.df['High'], self.df['Low'], self.df['Close']
        ).iloc[-1]
        
        if direction == "BUY":
            stop_loss = self.current_price - atr * 2
            take_profit = self.current_price + atr * 3
        else:  # SELL
            stop_loss = self.current_price + atr * 2
            take_profit = self.current_price - atr * 3
        
        return stop_loss, take_profit
```

---

## 📡 MODULE 4: API FastAPI (optional - if running as separate service)

### 4. main.py

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from signal_generator import SignalGenerator
from typing import List

app = FastAPI(title="AI Trading Module")

class MarketData(BaseModel):
    asset: str
    timeframe: str
    ohlcv: List[dict]  # [{"open": ..., "high": ..., "low": ..., "close": ..., "volume": ...}]

@app.post("/generate-signal")
async def generate_signal(data: MarketData):
    """Génère un signal basé sur les données OHLCV"""
    try:
        # Convert to DataFrame
        df = pd.DataFrame(data.ohlcv)
        df.columns = ['Open', 'High', 'Low', 'Close', 'Volume']
        
        # Generate signal
        generator = SignalGenerator(df, data.asset, data.timeframe)
        signal = generator.generate_signal()
        
        if signal is None:
            return {"signal": None, "message": "No patterns detected"}
        
        return {
            "asset": signal.asset,
            "timeframe": signal.timeframe,
            "direction": signal.direction,
            "confidence": signal.confidence,
            "entry_price": signal.entry_price,
            "stop_loss": signal.stop_loss,
            "take_profit": signal.take_profit,
            "risk_reward": signal.risk_reward,
            "pattern_type": signal.pattern_type,
            "indicators": signal.indicators,
            "detected_patterns": signal.detected_patterns
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

---

## 🧪 EXEMPLE D'UTILISATION

### 5. example_usage.py

```python
import pandas as pd
import numpy as np
from signal_generator import SignalGenerator
from pattern_detector import CandlestickPatternDetector

# Create mock market data (60 candles)
np.random.seed(42)
base_price = 100
prices = [base_price]

for _ in range(59):
    change = np.random.randn() * 2  # Random walk
    prices.append(prices[-1] + change)

data = {
    'Open': prices[:-1],
    'High': [p + np.abs(np.random.randn()) for p in prices[:-1]],
    'Low': [p - np.abs(np.random.randn()) for p in prices[:-1]],
    'Close': prices[1:],
    'Volume': np.random.randint(1000000, 10000000, 59)
}

df = pd.DataFrame(data)

print("=" * 60)
print("PATTERN DETECTION")
print("=" * 60)

detector = CandlestickPatternDetector(df)
patterns = detector.detect_all_patterns()

print(f"Found {len(patterns)} patterns:\n")
for pattern in patterns[-5:]:  # Show last 5
    print(f"  {pattern.type.value}: {pattern.direction} (confidence: {pattern.confidence}%)")

print("\n" + "=" * 60)
print("SIGNAL GENERATION")
print("=" * 60)

generator = SignalGenerator(df, "AAPL", "1H")
signal = generator.generate_signal()

if signal:
    print(f"Signal: {signal.direction}")
    print(f"Asset: {signal.asset}")
    print(f"Confidence: {signal.confidence}%")
    print(f"Entry: ${signal.entry_price:.2f}")
    print(f"Stop Loss: ${signal.stop_loss:.2f}")
    print(f"Take Profit: ${signal.take_profit:.2f}")
    print(f"Risk/Reward: {signal.risk_reward:.2f}")
else:
    print("No signal generated")
```

---

**Module IA prêt pour:**
✅ Production deployment (FastAPI)
✅ Integration avec Backend
✅ Real-time signal generation
✅ Pattern detection (10+ patterns)
✅ Technical indicators + scoring
