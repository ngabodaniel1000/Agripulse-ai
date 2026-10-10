# routes/market_routes.py
from flask import Blueprint, render_template, request, jsonify
import joblib
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.market_intelligence import MarketIntelligence
from config import Config

market_bp = Blueprint('market', __name__)

_engine = MarketIntelligence()
if os.path.exists(Config.MARKET_MODEL):
    saved = joblib.load(Config.MARKET_MODEL)
    _engine.classifier = saved.get('classifier')
    _engine.regressor = saved.get('regressor')


@market_bp.route('/market-intelligence')
def page():
    return render_template(
        'market_intelligence.html',
        districts=Config.DISTRICTS,
        crops=Config.CROPS,
        seasons=Config.SEASONS,
        storage_methods=Config.STORAGE_METHODS,
    )


@market_bp.route('/api/market-intelligence', methods=['POST'])
def api_predict():
    data = request.get_json(silent=True) or {}
    required = ['district', 'crop']
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({'success': False, 'error': f'Missing fields: {missing}'}), 400

    try:
        input_dict = {
            'district': data['district'],
            'province': MarketIntelligence._get_province(data['district']),
            'crop': data['crop'],
            'season': data.get('season', 'A'),
            'harvest_quantity_kg': float(data.get('harvest_quantity_kg', 1000)),
            'current_price_rwf_kg': float(data.get('current_price_rwf_kg', 500)),
            'price_trend_pct': float(data.get('price_trend_pct', 0)),
            'storage_method': data.get('storage_method', 'Traditional granary'),
            'storage_duration_weeks': int(data.get('storage_duration_weeks', 4)),
            'storage_cost_per_kg_week': float(data.get('storage_cost_per_kg_week', 2)),
            'humidity_pct': float(data.get('humidity_pct', 65)),
            'temperature_c': float(data.get('temperature_c', 22)),
            'total_loss_rate_pct': float(data.get('total_loss_rate_pct', 5)),
        }
        result = _engine.predict(input_dict)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@market_bp.route('/api/market-intelligence/health')
def health():
    return jsonify({
        'engine': 'market_intelligence',
        'loaded': _engine.classifier is not None and _engine.regressor is not None,
    })