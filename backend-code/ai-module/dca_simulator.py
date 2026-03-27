import numpy as np
from typing import Dict, List


class DCASimulator:
    @staticmethod
    def simulate_dca(initial_amount: float,
                    monthly_investment: float,
                    months: int,
                    annual_return: float = 0.08,
                    volatility: float = 0.15) -> Dict:
        monthly_rate = annual_return / 12
        balance = initial_amount
        total_invested = initial_amount
        monthly_data = []

        np.random.seed(42)

        for month in range(1, months + 1):
            balance += monthly_investment
            total_invested += monthly_investment

            random_return = np.random.normal(monthly_rate, volatility / np.sqrt(12))
            balance = balance * (1 + random_return)

            monthly_data.append({
                'month': month,
                'balance': round(balance, 2),
                'total_invested': round(total_invested, 2),
                'monthly_contribution': monthly_investment,
                'gain_loss': round(balance - total_invested, 2)
            })

        total_gains = balance - total_invested
        roi = (total_gains / total_invested * 100) if total_invested > 0 else 0

        return {
            'initial_amount': initial_amount,
            'monthly_investment': monthly_investment,
            'months': months,
            'total_invested': round(total_invested, 2),
            'final_balance': round(balance, 2),
            'total_gains': round(total_gains, 2),
            'roi': round(roi, 2),
            'monthly_data': monthly_data
        }
