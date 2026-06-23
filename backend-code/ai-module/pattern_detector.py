#!/usr/bin/env python3
"""
pattern_detector.py — Module 3 : Détection de patterns en temps réel
Évalue les conditions d'entrée/sortie d'une stratégie JSON (module 2)
contre des données OHLCV en temps réel.

Usage:
    python pattern_detector.py test_input.json
    echo '{"strategy": {...}, "market_data": [...]}' | python pattern_detector.py
"""

import sys
import json
import re
import math
from typing import Optional
import pandas as pd
import numpy as np


# ─────────────────────────────────────────────────────────────────────────────
# Calcul des indicateurs (même formule que indicators_calculator.py)
# ─────────────────────────────────────────────────────────────────────────────

def _parse_nums(s: str) -> list[int]:
    """Extrait tous les entiers d'une chaîne de paramètres."""
    return [int(x) for x in re.findall(r'\d+', s)]


def calc_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    """RSI Wilder — rolling window (identique à indicators_calculator.py)."""
    delta = close.diff()
    gains  = delta.where(delta > 0, 0.0).rolling(window=period).mean()
    losses = (-delta.where(delta < 0, 0.0)).rolling(window=period).mean()
    rs = gains / losses.replace(0.0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50.0)


def calc_ema(close: pd.Series, period: int) -> pd.Series:
    return close.ewm(span=period, adjust=False).mean()


def calc_sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(window=period).mean()


def calc_macd(close: pd.Series, fast=12, slow=26, signal=9):
    ema_fast   = close.ewm(span=fast,   adjust=False).mean()
    ema_slow   = close.ewm(span=slow,   adjust=False).mean()
    macd_line  = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram  = macd_line - signal_line
    return macd_line, signal_line, histogram


def calc_bollinger(close: pd.Series, period=20, std_dev=2.0):
    sma   = close.rolling(window=period).mean()
    std   = close.rolling(window=period).std()
    upper = sma + std_dev * std
    lower = sma - std_dev * std
    return upper, sma, lower


def calc_atr(high: pd.Series, low: pd.Series, close: pd.Series, period=14) -> pd.Series:
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low  - close.shift()).abs()
    tr  = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()


def compute_indicator_series(name: str, params_str: str, df: pd.DataFrame) -> pd.Series:
    """Calcule et retourne la série complète d'un indicateur."""
    nums  = _parse_nums(params_str)
    upper = name.upper().strip()

    if upper == 'RSI':
        return calc_rsi(df['close'], nums[0] if nums else 14)

    if upper in ('EMA', 'EXPONENTIAL MOVING AVERAGE'):
        return calc_ema(df['close'], nums[0] if nums else 50)

    if upper in ('SMA', 'SIMPLE MOVING AVERAGE', 'MA', 'MOVING AVERAGE'):
        return calc_sma(df['close'], nums[0] if nums else 20)

    if upper == 'MACD':
        fast, slow, sig = (nums + [12, 26, 9])[:3]
        macd_line, _, _ = calc_macd(df['close'], fast, slow, sig)
        return macd_line

    if upper in ('BB', 'BOLLINGER', 'BOLLINGER BANDS'):
        period = nums[0] if nums else 20
        _, mid, _ = calc_bollinger(df['close'], period)
        return mid

    if upper == 'ATR':
        return calc_atr(df['high'], df['low'], df['close'], nums[0] if nums else 14)

    # Fallback : EMA avec le premier paramètre trouvé
    return calc_ema(df['close'], nums[0] if nums else 20)


# ─────────────────────────────────────────────────────────────────────────────
# Garde-fou données insuffisantes
# ─────────────────────────────────────────────────────────────────────────────

def _min_candles(period: int) -> int:
    """Minimum de bougies pour un indicateur fiable : max(period*2, period+20)."""
    return max(period * 2, period + 20)


def _normalize_ind(name: str) -> str:
    """Normalise le nom d'un indicateur pour correspondre aux tokens de parse_condition."""
    n = name.upper().strip()
    if n in ('EXPONENTIAL MOVING AVERAGE',): return 'EMA'
    if n in ('SIMPLE MOVING AVERAGE', 'MA', 'MOVING AVERAGE'): return 'SMA'
    if n in ('BOLLINGER', 'BOLLINGER BANDS'): return 'BB'
    return n.split()[0]  # 'RSI', 'EMA', 'MACD', 'ATR', ...


# ─────────────────────────────────────────────────────────────────────────────
# Parser de conditions en langage naturel (FR + EN)
# ─────────────────────────────────────────────────────────────────────────────

_META_KEYWORDS = (
    'simultanément', 'simultanement', 'conditions doivent', 'timeframe',
    'simultaneously', 'both conditions',
)
_PRICE_LEVEL_KEYWORDS = (
    'stop loss', 'take profit', 'point d\'entrée', 'point d\'entree',
    'entry price', '% sous', '% au-dessus', 'atteint',
)

_BELOW_KW = ('sous', 'below', 'inférieur', 'inferieur', 'en dessous', 'under',
             'passe sous', 'under', 'crosses below', 'drops below', 'falls below')
_ABOVE_KW = ('au-dessus', 'above', 'supérieur', 'superieur', 'dépasse', 'depasse',
             'over', 'crosses above', 'exceeds', 'rises above', 'passe au-dessus')


def _is_meta(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in _META_KEYWORDS)


def _is_price_level(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in _PRICE_LEVEL_KEYWORDS)


def parse_condition(text: str) -> dict:
    """
    Parse une condition en langage naturel.
    Retourne un dict avec :
      type        : 'evaluable' | 'meta' | 'price_level'
      indicator   : 'RSI' | 'EMA' | 'SMA' | 'MACD' | 'PRICE' | None
      ind_period  : int | None
      operator    : '<' | '>' | None
      threshold_val       : float | None  (seuil numérique)
      threshold_indicator : str | None    (ex : 'EMA')
      threshold_period    : int | None
    """
    if _is_meta(text):
        return {'type': 'meta'}
    if _is_price_level(text):
        return {'type': 'price_level'}

    t = text.lower()

    # ── Opérateur ─────────────────────────────────────────────────────────────
    is_below = any(kw in t for kw in _BELOW_KW)
    is_above = any(kw in t for kw in _ABOVE_KW)
    operator = '<' if is_below else ('>' if is_above else None)

    # ── Positions des tokens clés dans la phrase ──────────────────────────────
    m_rsi   = re.search(r'\brsi\b', t)
    m_ema   = re.search(r'\bema\s*(\d+)', t)
    m_sma   = re.search(r'\b(?:sma|moyenne mobile simple)\s*(\d+)?', t)
    m_macd  = re.search(r'\bmacd\b', t)
    m_price = re.search(r'\b(?:prix|price|close|cours)\b', t)
    m_mm    = re.search(r'moyenne mobile\s+ema\s*(\d+)', t)  # "moyenne mobile EMA 50"

    # ── Règle de désambiguïsation : PRICE vs EMA/SMA ─────────────────────────
    # Si la phrase contient "prix/price" ET "EMA N" (ou "moyenne mobile EMA N"),
    # "prix" est l'indicateur comparé, "EMA N" est le seuil de référence.
    indicator    : Optional[str] = None
    ind_period   : Optional[int] = None
    threshold_indicator : Optional[str] = None
    threshold_period    : Optional[int] = None
    threshold_val       : Optional[float] = None

    price_before_ema = (
        m_price and m_ema
        and m_price.start() < m_ema.start()
    )
    price_before_sma = (
        m_price and m_sma
        and m_price.start() < m_sma.start()
    )

    if price_before_ema:
        # Ex : "Le prix est au-dessus de la moyenne mobile EMA 50"
        indicator           = 'PRICE'
        threshold_indicator = 'EMA'
        threshold_period    = int(m_ema.group(1))
    elif price_before_sma and m_sma.group(1):
        # Ex : "Le prix est au-dessus de la SMA 200"
        indicator           = 'PRICE'
        threshold_indicator = 'SMA'
        threshold_period    = int(m_sma.group(1))
    elif m_rsi:
        indicator = 'RSI'
    elif m_ema:
        indicator  = 'EMA'
        ind_period = int(m_ema.group(1))
    elif m_sma:
        indicator  = 'SMA'
        ind_period = int(m_sma.group(1)) if m_sma.group(1) else None
    elif m_macd:
        indicator = 'MACD'
    elif m_price:
        indicator = 'PRICE'

    # ── Seuil numérique (si pas déjà résolu en indicateur de référence) ───────
    if threshold_indicator is None:
        m_ref_ema = re.search(r'(?:de la |de l\')?(?:moyenne mobile )?ema\s*(\d+)', t)
        if m_ref_ema and indicator not in ('EMA',):
            threshold_indicator = 'EMA'
            threshold_period    = int(m_ref_ema.group(1))
        else:
            nums      = re.findall(r'\b(\d+(?:\.\d+)?)\b', t)
            used      = {str(ind_period)} if ind_period else set()
            candidates = [float(n) for n in nums if n not in used]
            if candidates:
                threshold_val = candidates[-1]

    return {
        'type'               : 'evaluable',
        'indicator'          : indicator,
        'ind_period'         : ind_period,
        'operator'           : operator,
        'threshold_val'      : threshold_val,
        'threshold_indicator': threshold_indicator,
        'threshold_period'   : threshold_period,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Évaluation d'une condition
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_condition(text: str, df: pd.DataFrame, cache: dict, insufficient: Optional[set] = None) -> dict:
    """
    Évalue une condition et retourne :
      met              : bool
      indicator        : str
      indicator_value  : float
      threshold_label  : str
      threshold_value  : float
      operator         : str
      margin           : float  (valeur absolue de l'écart)
      margin_pct       : float  (% par rapport au seuil)
    insufficient est un set de noms d'indicateurs normalisés sans assez de données.
    """
    if insufficient is None:
        insufficient = set()

    parsed = parse_condition(text)

    if parsed['type'] == 'meta':
        return {'condition': text, 'type': 'meta', 'met': True, 'skip': True}

    if parsed['type'] == 'price_level':
        return {
            'condition'      : text,
            'type'           : 'price_level',
            'met'            : False,
            'indicator'      : 'PRICE_LEVEL',
            'indicator_value': None,
            'threshold_label': 'géré externalement (SL/TP)',
            'threshold_value': None,
            'operator'       : None,
            'margin'         : None,
            'margin_pct'     : None,
            'skip'           : True,
        }

    # ── Garde : indicateurs avec données insuffisantes ────────────────────────
    ind_name = (parsed['indicator'] or 'PRICE').upper()
    thr_name = (parsed['threshold_indicator'] or '').upper()
    if ind_name in insufficient or (thr_name and thr_name in insufficient):
        blocking = ind_name if ind_name in insufficient else thr_name
        return {
            'condition'       : text,
            'type'            : 'evaluable',
            'met'             : False,
            'skip'            : True,
            'insufficient_data': True,
            'indicator'       : ind_name.lower(),
            'reason'          : f'Not enough candles for {blocking}',
        }

    # ── Valeur de l'indicateur principal ─────────────────────────────────────
    ind  = parsed['indicator'] or 'PRICE'
    prd  = parsed['ind_period']

    def get_series(name: str, period: Optional[int]) -> pd.Series:
        key = f'{name}_{period}'
        if key not in cache:
            if name == 'RSI':
                cache[key] = calc_rsi(df['close'], period or 14)
            elif name == 'EMA':
                cache[key] = calc_ema(df['close'], period or 50)
            elif name == 'SMA':
                cache[key] = calc_sma(df['close'], period or 20)
            elif name == 'MACD':
                ml, _, _ = calc_macd(df['close'])
                cache[key] = ml
            else:  # PRICE ou inconnu
                cache[key] = df['close']
        return cache[key]

    ind_series = get_series(ind, prd)
    ind_value  = float(ind_series.iloc[-1])
    # Pour PRICE, afficher le prix courant (plus lisible que "close")
    display_ind = 'price' if ind == 'PRICE' else ind

    # ── Valeur du seuil ───────────────────────────────────────────────────────
    t_ind = parsed['threshold_indicator']
    t_prd = parsed['threshold_period']
    t_val = parsed['threshold_val']

    if t_ind:
        thr_series    = get_series(t_ind, t_prd)
        threshold_val = float(thr_series.iloc[-1])
        threshold_lbl = f'{t_ind}({t_prd})'
    else:
        threshold_val = t_val if t_val is not None else 0.0
        threshold_lbl = str(threshold_val)

    # ── Comparaison ───────────────────────────────────────────────────────────
    op = parsed['operator']
    if op == '<':
        met    = ind_value < threshold_val
        margin = threshold_val - ind_value   # positif = bien en dessous
    elif op == '>':
        met    = ind_value > threshold_val
        margin = ind_value - threshold_val   # positif = bien au-dessus
    else:
        met    = False
        margin = 0.0

    margin_pct = abs(margin) / max(abs(threshold_val), 1e-9) * 100

    return {
        'condition'      : text,
        'type'           : 'evaluable',
        'met'            : bool(met),
        'indicator'      : display_ind,
        'indicator_value': round(ind_value, 4),
        'threshold_label': threshold_lbl,
        'threshold_value': round(threshold_val, 4),
        'operator'       : op,
        'margin'         : round(margin, 4),
        'margin_pct'     : round(margin_pct, 4),
        'skip'           : False,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Calcul du confidence_score
# ─────────────────────────────────────────────────────────────────────────────

def compute_confidence(
    entry_evals: list[dict],
    exit_evals : list[dict],
    status     : str,
) -> float:
    """
    Score [0–1] basé sur :
    - ratio de conditions remplies dans la direction du signal
    - marge moyenne par rapport aux seuils (plus on est loin = plus confiant)
    """
    def score_evals(evals: list[dict]) -> float:
        active = [e for e in evals if not e.get('skip')]
        if not active:
            return 0.0
        ratio = sum(1 for e in active if e['met']) / len(active)
        # Marge normalisée : 10% de marge → contribution max (+0.5)
        margin_bonus = sum(
            min(e['margin_pct'] / 10.0, 0.5)
            for e in active if e['met'] and e['margin_pct'] is not None
        ) / max(len(active), 1)
        return min(ratio * 0.6 + margin_bonus * 0.4, 1.0)

    if status == 'ENTRY_SIGNAL':
        return round(score_evals(entry_evals), 4)
    if status == 'EXIT_SIGNAL':
        return round(score_evals(exit_evals), 4)

    # NO_SIGNAL : score partiel basé sur l'approche du signal le plus proche
    entry_score = score_evals(entry_evals)
    exit_score  = score_evals(exit_evals)
    return round(max(entry_score, exit_score) * 0.5, 4)


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

HISTORY_LEN = 8


def main() -> None:
    # ── Lecture de l'input ────────────────────────────────────────────────────
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            input_data = json.load(f)
    else:
        input_data = json.load(sys.stdin)

    strategy    = input_data['strategy']
    market_data = input_data['market_data']

    # ── Construction du DataFrame ─────────────────────────────────────────────
    df = pd.DataFrame(market_data)
    df.columns = [c.lower() for c in df.columns]

    if 'timestamp' in df.columns:
        df = df.sort_values('timestamp').reset_index(drop=True)

    for col in ('open', 'high', 'low', 'close', 'volume'):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.dropna(subset=['close']).reset_index(drop=True)

    cache: dict = {}
    insufficient: set = set()  # noms normalisés des indicateurs sans assez de bougies

    # ── Calcul de tous les indicateurs de la stratégie ────────────────────────
    indicator_results: dict = {}

    for ind in strategy.get('indicators', []):
        name     = ind['name']
        params   = ind.get('params', '')
        nums     = _parse_nums(params)
        upper    = name.upper().strip()

        # ── Détermination de la période et garde-fou ──────────────────────────
        if upper == 'MACD':
            _period = nums[1] if len(nums) > 1 else 26   # slow period est le facteur limitant
        elif upper in ('RSI', 'ATR'):
            _period = nums[0] if nums else 14
        elif upper in ('EMA', 'EXPONENTIAL MOVING AVERAGE'):
            _period = nums[0] if nums else 50
        elif upper in ('SMA', 'SIMPLE MOVING AVERAGE', 'MA', 'MOVING AVERAGE'):
            _period = nums[0] if nums else 20
        elif upper in ('BB', 'BOLLINGER', 'BOLLINGER BANDS'):
            _period = nums[0] if nums else 20
        else:
            _period = nums[0] if nums else 20

        _needed = _min_candles(_period)
        if len(df) < _needed:
            norm = _normalize_ind(upper)
            insufficient.add(norm)
            indicator_results[name] = {
                'period'            : _period,
                'current'           : None,
                'history'           : [],
                'insufficient_data' : True,
                'candles_available' : len(df),
                'candles_needed'    : _needed,
                'unit'              : 'N/A',
            }
            continue

        if upper == 'RSI':
            period = nums[0] if nums else 14
            key    = f'RSI_{period}'
            series = calc_rsi(df['close'], period)
            cache[key] = series
            hist   = [round(float(v), 4) for v in series.dropna().tail(HISTORY_LEN)]
            indicator_results[name] = {
                'period' : period,
                'current': round(float(series.iloc[-1]), 4),
                'history': hist,
                'unit'   : 'score (0–100)',
            }

        elif upper == 'EMA':
            period = nums[0] if nums else 50
            key    = f'EMA_{period}'
            series = calc_ema(df['close'], period)
            cache[key] = series
            hist   = [round(float(v), 4) for v in series.tail(HISTORY_LEN)]
            indicator_results[name] = {
                'period' : period,
                'current': round(float(series.iloc[-1]), 4),
                'history': hist,
                'unit'   : 'price (USDT)',
            }

        elif upper == 'SMA':
            period = nums[0] if nums else 20
            key    = f'SMA_{period}'
            series = calc_sma(df['close'], period)
            cache[key] = series
            hist   = [round(float(v), 4) for v in series.dropna().tail(HISTORY_LEN)]
            indicator_results[name] = {
                'period' : period,
                'current': round(float(series.iloc[-1]), 4),
                'history': hist,
                'unit'   : 'price (USDT)',
            }

        elif upper == 'MACD':
            fast = nums[0] if len(nums) > 0 else 12
            slow = nums[1] if len(nums) > 1 else 26
            sig  = nums[2] if len(nums) > 2 else 9
            ml, sl, hl = calc_macd(df['close'], fast, slow, sig)
            cache['MACD_line'] = ml; cache['MACD_signal'] = sl
            hist = [round(float(v), 4) for v in ml.dropna().tail(HISTORY_LEN)]
            indicator_results[name] = {
                'fast'              : fast,
                'slow'              : slow,
                'signal_period'     : sig,
                'current_macd'      : round(float(ml.iloc[-1]), 4),
                'current_signal'    : round(float(sl.iloc[-1]), 4),
                'current_histogram' : round(float(hl.iloc[-1]), 4),
                'history_macd'      : hist,
                'unit'              : 'price difference',
            }

        else:
            period = nums[0] if nums else 20
            key    = f'{upper}_{period}'
            series = compute_indicator_series(name, params, df)
            cache[key] = series
            hist   = [round(float(v), 4) for v in series.dropna().tail(HISTORY_LEN)]
            indicator_results[name] = {
                'period' : period,
                'current': round(float(series.iloc[-1]), 4),
                'history': hist,
                'unit'   : 'computed',
            }

    # ── Évaluation des conditions ─────────────────────────────────────────────
    entry_evals = [
        evaluate_condition(c, df, cache, insufficient)
        for c in strategy.get('entry_conditions', [])
    ]
    exit_evals = [
        evaluate_condition(c, df, cache, insufficient)
        for c in strategy.get('exit_conditions', [])
    ]

    # ── Statut global ─────────────────────────────────────────────────────────
    active_entry = [e for e in entry_evals if not e.get('skip')]
    active_exit  = [e for e in exit_evals  if not e.get('skip')]

    all_entry_met = bool(active_entry) and all(e['met'] for e in active_entry)
    all_exit_met  = bool(active_exit)  and all(e['met'] for e in active_exit)

    if all_entry_met:
        global_status = 'ENTRY_SIGNAL'
    elif all_exit_met:
        global_status = 'EXIT_SIGNAL'
    else:
        global_status = 'NO_SIGNAL'

    # ── Confidence ────────────────────────────────────────────────────────────
    confidence = compute_confidence(entry_evals, exit_evals, global_status)

    # ── Prix courant ──────────────────────────────────────────────────────────
    current_price = round(float(df['close'].iloc[-1]), 2)
    last_ts       = str(df['timestamp'].iloc[-1]) if 'timestamp' in df.columns else 'N/A'

    # ── Sortie JSON ───────────────────────────────────────────────────────────
    output = {
        'strategy_name'  : strategy.get('name', 'Unknown'),
        'asset'          : strategy.get('asset_type', 'Unknown'),
        'timeframe'      : strategy.get('timeframe', 'Unknown'),
        'evaluated_at'   : last_ts,
        'current_price'  : current_price,
        'candles_used'   : len(df),
        'global_status'  : global_status,
        'confidence_score': confidence,
        'indicators'     : indicator_results,
        'entry_conditions': entry_evals,
        'exit_conditions' : exit_evals,
        'risk_management' : strategy.get('risk_management', {}),
        'sessions'        : strategy.get('sessions', []),
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
