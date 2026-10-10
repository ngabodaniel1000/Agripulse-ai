
---

# 🌾 AgriPulse Rwanda

> **Produce smarter. Lose less. Sell better.**

AI-powered agricultural productivity, yield & market intelligence platform for Rwanda — built with **Flask + Python**.

## What it does

Three AI engines, one unified platform:

| Engine | Problem Solved | Outputs |
|--------|---------------|---------|
| 🌱 **Input Optimizer** | Poor input allocation | Data-supported input patterns (seed + organic + inorganic + pesticide) by district & crop |
| 📊 **Yield Predictor** | Uncertain yield expectations | Estimated yield + confidence intervals + Explainable AI factor breakdown |
| 💰 **Market Intelligence** | Sell-vs-store dilemma & post-harvest losses | Price trends, storage trade-off analysis, sell/store recommendations, loss-risk alerts |

## Tech stack

- **Backend:** Flask 3, Python 3.11+
- **ML:** scikit-learn (Gradient Boosting), pandas, numpy, joblib
- **Frontend:** Jinja2 + Bootstrap 5 + Chart.js
- **Data:** NISR AHS 2024, SAS 2026 Season A & B

## Quick start

```bash
# 1. Clone
git clone https://github.com/<your-username>/agripulse-rwanda.git
cd agripulse-rwanda

# 2. Virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 4. Generate datasets from NISR distributions
python -m ml.data_generator

# 5. Train all 3 AI engines
python -m ml.train_all

# 6. Run
python app.py