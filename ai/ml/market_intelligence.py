# ml/market_intelligence.py
"""
Engine 3: Market & Post-Harvest Intelligence
Problems: Post-Harvest Losses + Sell-vs-Store Dilemma
Goal: Recommend whether to sell now or store, with loss-risk analysis.
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

try:
    from config import Config
    DATA_PATH = Config.MARKET_CSV
    MODEL_PATH = Config.MARKET_MODEL
    RANDOM_STATE = Config.RANDOM_STATE
    TEST_SIZE = Config.TEST_SIZE
except ImportError:
    DATA_PATH = 'data/raw/market_postharvest.csv'
    MODEL_PATH = 'models/market_model.pkl'
    RANDOM_STATE = 42
    TEST_SIZE = 0.2


class MarketIntelligence:
    CATEGORICAL_FEATURES = ['district', 'province', 'crop', 'season', 'storage_method']
    NUMERIC_FEATURES = [
        'harvest_quantity_kg', 'current_price_rwf_kg', 'price_trend_pct',
        'storage_duration_weeks', 'storage_cost_per_kg_week',
        'humidity_pct', 'temperature_c', 'total_loss_rate_pct',
    ]

    def __init__(self, model_path=None):
        self.model_path = model_path or MODEL_PATH
        self.classifier = None
        self.regressor = None
        self.metrics = {}
        # ---- initialize feature lists in __init__ ----
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

        self.classifier = Pipeline([
            ('preprocessor', preprocessor),
            ('model', GradientBoostingClassifier(
                n_estimators=300, max_depth=4,
                learning_rate=0.05, random_state=RANDOM_STATE)),
        ])

        self.regressor = Pipeline([
            ('preprocessor', preprocessor),
            ('model', GradientBoostingRegressor(
                n_estimators=300, max_depth=4,
                learning_rate=0.05, random_state=RANDOM_STATE)),
        ])

    def train(self, data_path=None):
        data_path = data_path or DATA_PATH
        print(f"[Engine 3] Loading data from {data_path} ...")
        df = pd.read_csv(data_path)

        required_cols = self.categorical_features + self.numeric_features
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(
                f"[Engine 3] Missing columns in CSV: {missing}\n"
                f"Available: {list(df.columns)}"
            )

        X = df[self.categorical_features + self.numeric_features]
        y_cls = df['store_recommendation']
        y_reg = df['net_gain_store_rwf']

        X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
            X, y_cls, y_reg, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )

        self.build_pipeline()

        print("[Engine 3] Training classifier ...")
        self.classifier.fit(X_train, yc_train)

        print("[Engine 3] Training regressor ...")
        self.regressor.fit(X_train, yr_train)

        yc_pred = self.classifier.predict(X_test)
        yc_proba = self.classifier.predict_proba(X_test)[:, 1]

        self.metrics = {
            'accuracy': float(accuracy_score(yc_test, yc_pred)),
            'roc_auc': float(roc_auc_score(yc_test, yc_proba)),
            'n_train': int(len(X_train)),
            'n_test': int(len(X_test)),
        }

        print(f"[Engine 3] Metrics: accuracy={self.metrics['accuracy']:.4f}, "
              f"roc_auc={self.metrics['roc_auc']:.4f}")

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(
            {'classifier': self.classifier, 'regressor': self.regressor},
            self.model_path,
        )
        print(f"[Engine 3] Model saved → {self.model_path}")

        return self.metrics

    def predict(self, input_dict):
        if self.classifier is None or self.regressor is None:
            raise RuntimeError(
                "Engine 3 models not loaded. Run `python -m ml.train_all` first."
            )
        df = pd.DataFrame([input_dict])

        store_prob = self.classifier.predict_proba(df)[0][1]
        recommendation = 'STORE' if store_prob > 0.5 else 'SELL NOW'
        net_gain = self.regressor.predict(df)[0]

        loss_rate = input_dict.get('total_loss_rate_pct', 0)
        if loss_rate < 5:
            risk = 'Low'
        elif loss_rate < 15:
            risk = 'Medium'
        else:
            risk = 'High'

        qty = input_dict.get('harvest_quantity_kg', 1000)
        price = input_dict.get('current_price_rwf_kg', 500)
        revenue_now = qty * price

        return {
            'recommendation': recommendation,
            'store_probability_pct': round(float(store_prob) * 100, 1),
            'sell_probability_pct': round(float(1 - store_prob) * 100, 1),
            'net_gain_from_storing_rwf': round(float(net_gain), 1),
            'revenue_if_sell_now_rwf': round(revenue_now, 1),
            'revenue_if_store_rwf': round(revenue_now + float(net_gain), 1),
            'post_harvest_loss_risk': risk,
            'loss_rate_pct': round(loss_rate, 2),
        }

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
    engine = MarketIntelligence()
    metrics = engine.train()
    print("Engine 3 trained. Metrics:", metrics)