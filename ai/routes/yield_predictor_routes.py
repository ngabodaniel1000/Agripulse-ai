# routes/yield_predictor_routes.py
from flask import Blueprint, render_template, request, jsonify
import joblib
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.yield_predictor import YieldPredictor
from config import Config

yield_predictor_bp = Blueprint('yield_predictor', __name__)

_engine = YieldPredictor()
if os.path.exists(Config.YIELD_PREDICTOR_MODEL):
    _engine.pipeline = joblib.load(Config.YIELD_PREDICTOR_MODEL)


@yield_predictor_bp.route('/yield-predictor')
def page():
    return render_template(
        'yield_predictor.html',
        districts=Config.DISTRICTS,
        crops=Config.CROPS,
        seasons=Config.SEASONS,
        soil_types=Config.SOIL_TYPES,
    )


@yield_predictor_bp.route('/api/yield-predictor', methods=['POST'])
def api_predict():
    data = request.get_json(silent=True) or {}
    required = ['district', 'crop']
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({'success': False, 'error': f'Missing fields: {missing}'}), 400

    try:
        input_dict = {
            'district': data['district'],
            'province': YieldPredictor._get_province(data['district']),
            'crop': data['crop'],
            'season': data.get('season', 'A'),
            'soil_type': data.get('soil_type', 'Loam'),
            'farm_size_ha': float(data.get('farm_size_ha', 0.5)),
            'elevation_m': float(data.get('elevation_m', 1600)),
            'rainfall_mm': float(data.get('rainfall_mm', 450)),
            'temperature_c': float(data.get('temperature_c', 21)),
            'used_improved_seed': int(data.get('used_improved_seed', 0)),
            'used_organic_fertilizer': int(data.get('used_organic_fertilizer', 0)),
            'used_inorganic_fertilizer': int(data.get('used_inorganic_fertilizer', 0)),
            'used_pesticide': int(data.get('used_pesticide', 0)),
            'used_irrigation': int(data.get('used_irrigation', 0)),
            'used_erosion_control': int(data.get('used_erosion_control', 0)),
            'used_agroforestry': int(data.get('used_agroforestry', 0)),
        }
        prediction = _engine.predict(input_dict)
        explanation = _engine.explain_prediction(input_dict)
        return jsonify({
            'success': True,
            'prediction': prediction,
            'explanation': explanation,
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@yield_predictor_bp.route('/api/yield-predictor/health')
def health():
    return jsonify({
        'engine': 'yield_predictor',
        'loaded': _engine.pipeline is not None,
    })