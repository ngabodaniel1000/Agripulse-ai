# ml/yield_predictor.py
"""
Engine 2: Yield Predictor
Problem: Uncertain Yield Expectations
Goal: Predict yield with confidence intervals + XAI factor breakdown.
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

try:
    from config import Config
    DATA_PATH = Config.YIELD_PREDICTOR_CSV
    MODEL_PATH = Config.YIELD_PREDICTOR_MODEL
    RANDOM_STATE = Config.RANDOM_STATE
    TEST_SIZE = Config.TEST_SIZE
except ImportError:
    DATA_PATH = 'data/raw/yield_predictor.csv'
    MODEL_PATH = 'models/yield_predictor_model.pkl'
    RANDOM_STATE = 42
    TEST_SIZE = 0.2


class YieldPredictor:
    CATEGORICAL_FEATURES = ['district', 'province', 'crop', 'season', 'soil_type']
    NUMERIC_FEATURES = [
        'farm_size_ha', 'elevation_m', 'rainfall_mm', 'temperature_c',
        'used_improved_seed', 'used_organic_fertilizer',
        'used_inorganic_fertilizer', 'used_pesticide',
        'used_irrigation', 'used_erosion_control', 'used_agroforestry',
    ]

    def __init__(self, model_path=None):
        self.model_path = model_path or MODEL_PATH
        self.pipeline = None
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

        model = GradientBoostingRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.04,
            subsample=0.8,
            random_state=RANDOM_STATE,
        )

        self.pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model),
        ])

    def train(self, data_path=None):
        data_path = data_path or DATA_PATH
        print(f"[Engine 2] Loading data from {data_path} ...")
        df = pd.read_csv(data_path)

        required_cols = self.categorical_features + self.numeric_features
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(
                f"[Engine 2] Missing columns in CSV: {missing}\n"
                f"Available: {list(df.columns)}"
            )

        X = df[self.categorical_features + self.numeric_features]
        y = df['predicted_yield_kg_ha']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )

        self.build_pipeline()
        print("[Engine 2] Training GradientBoostingRegressor ...")
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

        print(f"[Engine 2] Metrics: {self.metrics}")

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.pipeline, self.model_path)
        print(f"[Engine 2] Model saved → {self.model_path}")

        return self.metrics

    def predict(self, input_dict):
        if self.pipeline is None:
            raise RuntimeError(
                "Engine 2 pipeline not loaded. Run `python -m ml.train_all` first."
            )
        df = pd.DataFrame([input_dict])
        pred = self.pipeline.predict(df)[0]

        consistency_features = [
            input_dict.get('used_improved_seed', 0),
            input_dict.get('used_organic_fertilizer', 0),
            input_dict.get('used_inorganic_fertilizer', 0),
            input_dict.get('used_pesticide', 0),
        ]
        consistency = sum(consistency_features) / 4
        uncertainty = 0.25 - 0.10 * consistency

        return {
            'predicted_yield_kg_ha': round(float(pred), 1),
            'yield_lower_kg_ha': round(float(pred) * (1 - uncertainty), 1),
            'yield_upper_kg_ha': round(float(pred) * (1 + uncertainty), 1),
            'confidence_level_pct': round((1 - uncertainty) * 100, 1),
        }

    def explain_prediction(self, input_dict):
        if self.pipeline is None:
            raise RuntimeError(
                "Engine 2 pipeline not loaded. Run `python -m ml.train_all` first."
            )
        df = pd.DataFrame([input_dict])
        pred = self.pipeline.predict(df)[0]

        preprocessor = self.pipeline.named_steps['preprocessor']
        model = self.pipeline.named_steps['model']

        cat_encoder = preprocessor.named_transformers_['cat']
        cat_feature_names = list(
            cat_encoder.get_feature_names_out(self.categorical_features)
        )
        all_feature_names = cat_feature_names + self.numeric_features
        importances = model.feature_importances_

        category_importance = {
            'Crop': 0.0, 'District/Location': 0.0, 'Season': 0.0,
            'Soil Type': 0.0, 'Farm Size': 0.0, 'Weather (Rainfall)': 0.0,
            'Temperature': 0.0, 'Improved Seeds': 0.0,
            'Organic Fertilizer': 0.0, 'Inorganic Fertilizer': 0.0,
            'Pesticide': 0.0, 'Irrigation': 0.0,
            'Erosion Control': 0.0, 'Agroforestry': 0.0,
            'Elevation': 0.0,
        }

        for name, imp in zip(all_feature_names, importances):
            if name.startswith('crop_'):
                category_importance['Crop'] += imp
            elif name.startswith('district_') or name.startswith('province_'):
                category_importance['District/Location'] += imp
            elif name.startswith('season_'):
                category_importance['Season'] += imp
            elif name.startswith('soil_type_'):
                category_importance['Soil Type'] += imp
            elif 'farm_size_ha' in name:
                category_importance['Farm Size'] += imp
            elif 'rainfall_mm' in name:
                category_importance['Weather (Rainfall)'] += imp
            elif 'temperature_c' in name:
                category_importance['Temperature'] += imp
            elif 'elevation_m' in name:
                category_importance['Elevation'] += imp
            elif 'used_improved_seed' in name:
                category_importance['Improved Seeds'] += imp
            elif 'used_organic_fertilizer' in name:
                category_importance['Organic Fertilizer'] += imp
            elif 'used_inorganic_fertilizer' in name:
                category_importance['Inorganic Fertilizer'] += imp
            elif 'used_pesticide' in name:
                category_importance['Pesticide'] += imp
            elif 'used_irrigation' in name:
                category_importance['Irrigation'] += imp
            elif 'used_erosion_control' in name:
                category_importance['Erosion Control'] += imp
            elif 'used_agroforestry' in name:
                category_importance['Agroforestry'] += imp

        total = sum(category_importance.values())
        if total > 0:
            category_importance = {
                k: round(v / total * 100, 1)
                for k, v in category_importance.items()
            }

        sorted_importance = dict(sorted(
            category_importance.items(), key=lambda x: x[1], reverse=True
        ))

        return {
            'predicted_yield_kg_ha': round(float(pred), 1),
            'factor_importance_pct': sorted_importance,
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
    engine = YieldPredictor()
    metrics = engine.train()
    print("Engine 2 trained. Metrics:", metrics)