from typing import List, Dict
from dataclasses import dataclass
import re


@dataclass
class Rule:
    condition: str
    action: str
    signal_type: str
    confidence_boost: float
    description: str


class NLPRuleExtractor:
    def __init__(self):
        self.rules = []
        self.patterns = self._init_patterns()

    def _init_patterns(self) -> Dict[str, str]:
        return {
            'rsi_oversold': r'(rsi|RSI).{0,10}(below|<).{0,5}(30|twenty\s?five|twenty\s?nine)',
            'rsi_overbought': r'(rsi|RSI).{0,10}(above|>).{0,5}(70|seventy|eighty)',
            'bullish_cross': r'(bullish|upside|cross).{0,10}(above|cross)',
            'bearish_cross': r'(bearish|downside|cross).{0,10}(below|cross)',
            'breakout': r'(break|breakout).{0,10}(resistance|above)',
            'breakdown': r'(break|breakdown).{0,10}(support|below)',
            'trend_up': r'(uptrend|trending|up).{0,10}(up|higher|bullish)',
            'trend_down': r'(downtrend|trending|down).{0,10}(down|lower|bearish)',
            'consolidation': r'(consolidat|squeeze|ranging).{0,10}(consolidat|squeeze)',
            'support': r'(support).{0,10}(bounce|hold|test)',
            'resistance': r'(resistance).{0,10}(reject|fail|test)',
            'golden_cross': r'(golden|death).{0,10}(cross)',
            'divergence': r'(divergence).{0,10}(bullish|bearish)',
            'volume': r'(volume).{0,10}(increase|spike|high)'
        }

    def extract_rules(self, text: str) -> List[Rule]:
        text_lower = text.lower()
        extracted_rules = []

        if self._match_pattern('rsi_oversold', text_lower):
            extracted_rules.append(Rule(
                condition='RSI < 30',
                action='BUY',
                signal_type='momentum',
                confidence_boost=15,
                description='RSI oversold condition indicates potential reversal'
            ))

        if self._match_pattern('rsi_overbought', text_lower):
            extracted_rules.append(Rule(
                condition='RSI > 70',
                action='SELL',
                signal_type='momentum',
                confidence_boost=15,
                description='RSI overbought condition indicates potential reversal'
            ))

        if self._match_pattern('bullish_cross', text_lower):
            extracted_rules.append(Rule(
                condition='EMA_fast > EMA_slow',
                action='BUY',
                signal_type='trend',
                confidence_boost=20,
                description='Bullish cross detected - trend reversal upward'
            ))

        if self._match_pattern('bearish_cross', text_lower):
            extracted_rules.append(Rule(
                condition='EMA_fast < EMA_slow',
                action='SELL',
                signal_type='trend',
                confidence_boost=20,
                description='Bearish cross detected - trend reversal downward'
            ))

        if self._match_pattern('breakout', text_lower):
            extracted_rules.append(Rule(
                condition='Price > Resistance',
                action='BUY',
                signal_type='breakout',
                confidence_boost=25,
                description='Breakout above resistance level'
            ))

        if self._match_pattern('breakdown', text_lower):
            extracted_rules.append(Rule(
                condition='Price < Support',
                action='SELL',
                signal_type='breakdown',
                confidence_boost=25,
                description='Breakdown below support level'
            ))

        if self._match_pattern('trend_up', text_lower):
            extracted_rules.append(Rule(
                condition='Uptrend confirmed',
                action='BUY',
                signal_type='trend',
                confidence_boost=10,
                description='Uptrend continuation signal'
            ))

        if self._match_pattern('trend_down', text_lower):
            extracted_rules.append(Rule(
                condition='Downtrend confirmed',
                action='SELL',
                signal_type='trend',
                confidence_boost=10,
                description='Downtrend continuation signal'
            ))

        if self._match_pattern('volume', text_lower):
            extracted_rules.append(Rule(
                condition='Volume > Average',
                action='CONFIRM',
                signal_type='volume',
                confidence_boost=10,
                description='High volume confirms signal strength'
            ))

        if self._match_pattern('divergence', text_lower):
            extracted_rules.append(Rule(
                condition='Price-Indicator Divergence',
                action='REVERSAL',
                signal_type='divergence',
                confidence_boost=20,
                description='Divergence indicates potential reversal'
            ))

        self.rules.extend(extracted_rules)
        return extracted_rules

    def _match_pattern(self, pattern_key: str, text: str) -> bool:
        pattern = self.patterns.get(pattern_key, '')
        return bool(re.search(pattern, text))

    def extract_numeric_values(self, text: str) -> Dict[str, float]:
        values = {}

        rsi_match = re.search(r'rsi.{0,10}(\d+)', text.lower())
        if rsi_match:
            values['rsi'] = float(rsi_match.group(1))

        ma_match = re.search(r'(?:ma|moving\s?average).{0,10}(\d+)', text.lower())
        if ma_match:
            values['ma_period'] = float(ma_match.group(1))

        tp_match = re.search(r'take\s?profit.{0,10}([\d.]+)', text.lower())
        if tp_match:
            values['take_profit'] = float(tp_match.group(1))

        sl_match = re.search(r'stop\s?loss.{0,10}([\d.]+)', text.lower())
        if sl_match:
            values['stop_loss'] = float(sl_match.group(1))

        return values

    def extract_conditions(self, text: str) -> List[str]:
        conditions = []

        if 'if' in text.lower():
            condition_match = re.findall(r'if\s+(.+?)(?:then|,)', text.lower())
            conditions.extend(condition_match)

        if 'when' in text.lower():
            condition_match = re.findall(r'when\s+(.+?)(?:then|,)', text.lower())
            conditions.extend(condition_match)

        return conditions

    def generate_strategy_code(self) -> str:
        code = "class ExtractedStrategy:\n"
        code += "    def __init__(self):\n"
        code += "        self.rules = []\n\n"

        code += "    def check_conditions(self, data: Dict) -> Dict:\n"
        code += "        signals = {'buy': 0, 'sell': 0, 'confidence': 0}\n\n"

        for i, rule in enumerate(self.rules):
            code += f"        # Rule {i + 1}: {rule.description}\n"
            if rule.action == 'BUY':
                code += f"        if data.get('{rule.signal_type}'):\n"
                code += f"            signals['buy'] += 1\n"
                code += f"            signals['confidence'] += {rule.confidence_boost}\n\n"
            elif rule.action == 'SELL':
                code += f"        if data.get('{rule.signal_type}'):\n"
                code += f"            signals['sell'] += 1\n"
                code += f"            signals['confidence'] += {rule.confidence_boost}\n\n"

        code += "        return signals\n"

        return code
