# routes/__init__.py
from .input_optimizer_routes import input_optimizer_bp
from .yield_predictor_routes import yield_predictor_bp
from .market_routes import market_bp

__all__ = ['input_optimizer_bp', 'yield_predictor_bp', 'market_bp']