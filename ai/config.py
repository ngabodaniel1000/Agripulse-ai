# config.py
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'agripulse-rwanda-secret-key-2026')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))

    # Paths
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    RAW_DATA_DIR = os.path.join(DATA_DIR, 'raw')
    PROCESSED_DATA_DIR = os.path.join(DATA_DIR, 'processed')
    MODELS_DIR = os.path.join(BASE_DIR, 'models')
    NOTEBOOKS_DIR = os.path.join(BASE_DIR, 'notebooks')

    # Model paths
    INPUT_OPTIMIZER_MODEL = os.path.join(MODELS_DIR, 'input_optimizer_model.pkl')
    YIELD_PREDICTOR_MODEL = os.path.join(MODELS_DIR, 'yield_predictor_model.pkl')
    MARKET_MODEL = os.path.join(MODELS_DIR, 'market_model.pkl')
    METRICS_FILE = os.path.join(MODELS_DIR, 'model_metrics.json')

    # Dataset paths
    INPUT_OPTIMIZER_CSV = os.path.join(RAW_DATA_DIR, 'input_optimizer.csv')
    YIELD_PREDICTOR_CSV = os.path.join(RAW_DATA_DIR, 'yield_predictor.csv')
    MARKET_CSV = os.path.join(RAW_DATA_DIR, 'market_postharvest.csv')

    # ML constants
    RANDOM_STATE = 42
    TEST_SIZE = 0.2

    # NISR constants
    DISTRICTS = [
        'Nyarugenge', 'Gasabo', 'Kicukiro', 'Nyanza', 'Gisagara',
        'Nyaruguru', 'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga',
        'Kamonyi', 'Karongi', 'Rutsiro', 'Rubavu', 'Nyabihu',
        'Ngororero', 'Rusizi', 'Nyamasheke', 'Rulindo', 'Gakenke',
        'Musanze', 'Burera', 'Gicumbi', 'Rwamagana', 'Nyagatare',
        'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera',
    ]

    PROVINCES = {
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

    CROPS = ['Maize', 'Beans', 'Irish potato', 'Cassava', 'Sweet potato',
             'Paddy rice', 'Wheat', 'Banana', 'Vegetables']

    SEASONS = ['A', 'B', 'C']

    STORAGE_METHODS = ['Traditional granary', 'Hermetic bag', 'Warehouse',
                       'Open air', 'Improved silo']

    SOIL_TYPES = ['Clay', 'Loam', 'Sandy', 'Volcanic']