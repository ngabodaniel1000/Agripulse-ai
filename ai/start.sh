#!/usr/bin/env bash
set -e

echo "=================================================="
echo " AgriPulse Rwanda — Render Startup"
echo "=================================================="

# 1. Generate datasets if they don't exist
if [ ! -f "data/raw/input_optimizer.csv" ] || \
   [ ! -f "data/raw/yield_predictor.csv" ] || \
   [ ! -f "data/raw/market_postharvest.csv" ]; then
    echo "📦 Datasets missing — generating from NISR distributions..."
    python -m ml.data_generator
else
    echo "✅ Datasets already present"
fi

# 2. Train models if they don't exist
if [ ! -f "models/input_optimizer_model.pkl" ] || \
   [ ! -f "models/yield_predictor_model.pkl" ] || \
   [ ! -f "models/market_model.pkl" ]; then
    echo "🧠 Models missing — training all 3 engines..."
    python -m ml.train_all
else
    echo "✅ Models already present"
fi

# 3. Start Flask with gunicorn
echo "🚀 Starting Flask app on port ${PORT:-10000}..."
exec gunicorn app:app \
    --bind 0.0.0.0:${PORT:-10000} \
    --workers 1 \
    --threads 4 \
    --timeout 120 \
    --log-level info