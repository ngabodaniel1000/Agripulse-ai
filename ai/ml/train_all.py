# ml/train_all.py
"""Trains all three AI engines and saves metrics."""

import json
import os
from ml.input_optimizer import InputOptimizer
from ml.yield_predictor import YieldPredictor
from ml.market_intelligence import MarketIntelligence

def main():
    print("=" * 60)
    print("AgriPulse Rwanda — Training All AI Engines")
    print("=" * 60)

    all_metrics = {}

    # Engine 1
    e1 = InputOptimizer()
    all_metrics['input_optimizer'] = e1.train()

    # Engine 2
    e2 = YieldPredictor()
    all_metrics['yield_predictor'] = e2.train()

    # Engine 3
    e3 = MarketIntelligence()
    all_metrics['market_intelligence'] = e3.train()

    os.makedirs('models', exist_ok=True)
    with open('models/model_metrics.json', 'w') as f:
        json.dump(all_metrics, f, indent=2)

    print("\n" + "=" * 60)
    print("All engines trained successfully!")
    print("Metrics saved to models/model_metrics.json")
    print("=" * 60)


if __name__ == '__main__':
    main()