# ml/input_optimizer.py
"""
Engine 1: Input Optimizer
Problem: Poor Input Allocation
Goal: Recommend data-supported input patterns tailored by district & crop.
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Make sure this works when imported as `ml.input_optimizer`
try:
    from config import Config
    DATA_PATH = Config.INPUT_OPTIMIZER_CSV
    MODEL_PATH = Config.INPUT_OPTIMIZER_MODEL
    RANDOM_STATE = Config.RANDOM_STATE
    TEST_SIZE = Config.TEST_SIZE
except ImportError:
    DATA_PATH = 'data/raw/input_optimizer.csv'
    MODEL_PATH = 'models/input_optimizer_model.pkl'
    RANDOM_STATE = 42
    TEST_SIZE = 0.2


class InputOptimizer:
    # Class-level feature definitions (so they exist even before __init__ returns)
    CATEGORICAL_FEATURES = ['district', 'province', 'crop', 'season']
    NUMERIC_FEATURES = [
        'farm_size_ha', 'used_improved_seed', 'seed_qty_kg_ha',
        'used_organic_fertilizer', 'organic_qty_kg_ha',
        'used_inorganic_fertilizer', 'inorganic_qty_kg_ha',
        'used_pesticide', 'pesticide_qty_l_ha',
    ]

    def __init__(self, model_path=None):
        self.model_path = model_path or MODEL_PATH
        self.pipeline = None
        self.metrics = {}

        # ---- CRITICAL: initialize feature lists HERE ----
        self.categorical_features = list(self.CATEGORICAL_FEATURES)
        self.numeric_features = list(self.NUMERIC_FEATURES)

    def build_pipeline(self):
        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', OneHotEncoder(handle_unknown='ignore'),
                 self.categorical_features),
                ('num', StandardScaler(), self.numeric_features),
            ]
        )

        model = GradientBoostingRegressor(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            random_state=RANDOM_STATE,
        )

        self.pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model),
        ])

    def train(self, data_path=None):
        data_path = data_path or DATA_PATH
        print(f"[Engine 1] Loading data from {data_path} ...")
        df = pd.read_csv(data_path)

        # Sanity check — verify all required columns exist
        required_cols = self.categorical_features + self.numeric_features
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(
                f"[Engine 1] Missing columns in CSV: {missing}\n"
                f"Available: {list(df.columns)}"
            )

        X = df[self.categorical_features + self.numeric_features]
        y = df['expected_yield_kg_ha']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )

        self.build_pipeline()
        print("[Engine 1] Training GradientBoostingRegressor ...")
        self.pipeline.fit(X_train, y_train)

        y_pred = self.pipeline.predict(X_test)

        self.metrics = {
            'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
            'mae': float(mean_absolute_error(y_test, y_pred)),
            'r2': float(r2_score(y_test, y_pred)),
            'mape': float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100),
            'n_train': int(len(X_train)),
            'n_test': int(len(X_test)),
        }

        print(f"[Engine 1] Metrics: {self.metrics}")

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.pipeline, self.model_path)
        print(f"[Engine 1] Model saved → {self.model_path}")

        return self.metrics

    def predict(self, input_dict):
        if self.pipeline is None:
            raise RuntimeError(
                "Engine 1 pipeline not loaded. Run `python -m ml.train_all` first."
            )
        df = pd.DataFrame([input_dict])
        pred = self.pipeline.predict(df)[0]
        return {
            'expected_yield_kg_ha': round(float(pred), 1),
            'yield_lower_kg_ha': round(float(pred) * 0.85, 1),
            'yield_upper_kg_ha': round(float(pred) * 1.15, 1),
        }

    def recommend_inputs(self, district, crop, season='A',
                         farm_size_ha=0.5, budget_level='medium'):
        if self.pipeline is None:
            raise RuntimeError(
                "Engine 1 pipeline not loaded. Run `python -m ml.train_all` first."
            )

        strategies_by_budget = {
            'low': [
                {'improved_seed': 0, 'organic': 1, 'inorganic': 0, 'pesticide': 0},
                {'improved_seed': 0, 'organic': 1, 'inorganic': 0, 'pesticide': 1},
            ],
            'medium': [
                {'improved_seed': 1, 'organic': 1, 'inorganic': 1, 'pesticide': 0},
                {'improved_seed': 1, 'organic': 1, 'inorganic': 0, 'pesticide': 0},
                {'improved_seed': 1, 'organic': 1, 'inorganic': 0, 'pesticide': 1},
                {'improved_seed': 0, 'organic': 1, 'inorganic': 1, 'pesticide': 0},
                {'improved_seed': 1, 'organic': 0, 'inorganic': 1, 'pesticide': 1},
            ],
            'high': [
                {'improved_seed': 1, 'organic': 1, 'inorganic': 1, 'pesticide': 1},
            ],
        }
        strategies = strategies_by_budget.get(budget_level,
                                              strategies_by_budget['medium'])

        province = self._get_province(district)
        recommendations = []

        for strat in strategies:
            input_dict = {
                'district': district, 'province': province,
                'crop': crop, 'season': season,
                'farm_size_ha': farm_size_ha,
                'used_improved_seed': strat['improved_seed'],
                'seed_qty_kg_ha': 25 if strat['improved_seed'] else 15,
                'used_organic_fertilizer': strat['organic'],
                'organic_qty_kg_ha': 2000 if strat['organic'] else 0,
                'used_inorganic_fertilizer': strat['inorganic'],
                'inorganic_qty_kg_ha': 100 if strat['inorganic'] else 0,
                'used_pesticide': strat['pesticide'],
                'pesticide_qty_l_ha': 2 if strat['pesticide'] else 0,
            }
            result = self.predict(input_dict)
            result['strategy'] = strat
            recommendations.append(result)

        recommendations.sort(key=lambda x: x['expected_yield_kg_ha'], reverse=True)
        return recommendations

    @staticmethod
    def _get_province(district):
        try:
            return Config.PROVINCES.get(district, 'South')
        except Exception:
            mapping = {
                'Nyarugenge': 'Kigali', 'Gasabo': 'Kigali', 'Kicukiro': 'Kigali',
                'Nyanza': 'South', 'Gisagara': 'South', 'Nyaruguru': 'South',
                'Huye': 'South', 'Nyamagabe': 'South', 'Ruhango': 'South',
                'Muhanga': 'South', 'Kamonyi': 'South',
                'Karongi': 'West', 'Rutsiro': 'West', 'Rubavu': 'West',
                'Nyabihu': 'West', 'Ngororero': 'West', 'Rusizi': 'West',
                'Nyamasheke': 'West',
                'Rulindo': 'North', 'Gakenke': 'North', 'Musanze': 'North',
                'Burera': 'North', 'Gicumbi': 'North',
                'Rwamagana': 'East', 'Nyagatare': 'East', 'Gatsibo': 'East',
                'Kayonza': 'East', 'Kirehe': 'East', 'Ngoma': 'East',
                'Bugesera': 'East',
            }
            return mapping.get(district, 'South')


if __name__ == '__main__':
    engine = InputOptimizer()
    metrics = engine.train()
    print("Engine 1 trained. Metrics:", metrics)