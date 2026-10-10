# routes/input_optimizer_routes.py
from flask import Blueprint, render_template, request, jsonify
import joblib
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.input_optimizer import InputOptimizer
from config import Config

input_optimizer_bp = Blueprint('input_optimizer', __name__)

# Load engine once at import
_engine = InputOptimizer()
if os.path.exists(Config.INPUT_OPTIMIZER_MODEL):
    _engine.pipeline = joblib.load(Config.INPUT_OPTIMIZER_MODEL)


@input_optimizer_bp.route('/input-optimizer')
def page():
    return render_template(
        'input_optimizer.html',
        districts=Config.DISTRICTS,
        crops=Config.CROPS,
        seasons=Config.SEASONS,
    )


@input_optimizer_bp.route('/api/input-optimizer', methods=['POST'])
def api_recommend():
    data = request.get_json(silent=True) or {}
    required = ['district', 'crop']
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({'success': False, 'error': f'Missing fields: {missing}'}), 400

    try:
        recommendations = _engine.recommend_inputs(
            district=data['district'],
            crop=data['crop'],
            season=data.get('season', 'A'),
            farm_size_ha=float(data.get('farm_size_ha', 0.5)),
            budget_level=data.get('budget_level', 'medium'),
        )
        return jsonify({'success': True, 'recommendations': recommendations})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@input_optimizer_bp.route('/api/input-optimizer/health')
def health():
    return jsonify({
        'engine': 'input_optimizer',
        'loaded': _engine.pipeline is not None,
    })