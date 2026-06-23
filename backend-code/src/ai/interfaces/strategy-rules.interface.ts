export interface StrategyIndicator {
  name:   string;
  params: string;
}

export interface RiskManagement {
  stop_loss:     string;
  take_profit:   string;
  position_size: string;
  risk_reward:   string;
}

export interface StrategyRules {
  name:              string;
  description:       string;
  entry_conditions:  string[];
  exit_conditions:   string[];
  indicators:        StrategyIndicator[];
  timeframe:         string;
  asset_type:        string;
  risk_management:   RiskManagement;
  sessions:          string[];
  confidence_score:  number;
}
