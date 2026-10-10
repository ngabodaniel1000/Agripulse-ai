# app.py
from flask import Flask, render_template, jsonify
from flask_cors import CORS

from config import Config
from routes import input_optimizer_bp, yield_predictor_bp, market_bp

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Register blueprints
app.register_blueprint(input_optimizer_bp)
app.register_blueprint(yield_predictor_bp)
app.register_blueprint(market_bp)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


@app.route('/api/districts')
def api_districts():
    return jsonify(Config.DISTRICTS)


@app.route('/api/crops')
def api_crops():
    return jsonify(Config.CROPS)


@app.route('/api/metadata')
def api_metadata():
    return jsonify({
        'districts': Config.DISTRICTS,
        'crops': Config.CROPS,
        'seasons': Config.SEASONS,
        'soil_types': Config.SOIL_TYPES,
        'storage_methods': Config.STORAGE_METHODS,
    })


@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'engines': {
            'input_optimizer': True,
            'yield_predictor': True,
            'market_intelligence': True,
        }
    })


if __name__ == '__main__':
    app.run(
        debug=Config.DEBUG,
        host=Config.HOST,
        port=Config.PORT,
    )