# ml/data_generator.py
"""
Generates CSV datasets for AgriPulse Rwanda AI engines
Sources: NISR AHS 2024, SAS 2026 Season A, SAS 2026 Season B
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

# ============================================================
# NISR-GROUNDED DISTRIBUTIONS
# ============================================================

DISTRICTS = [
    'Nyarugenge', 'Gasabo', 'Kicukiro', 'Nyanza', 'Gisagara',
    'Nyaruguru', 'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga',
    'Kamonyi', 'Karongi', 'Rutsiro', 'Rubavu', 'Nyabihu',
    'Ngororero', 'Rusizi', 'Nyamasheke', 'Rulindo', 'Gakenke',
    'Musanze', 'Burera', 'Gicumbi', 'Rwamagana', 'Nyagatare',
    'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera'
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
    'Bugesera': 'East'
}

# AHS 2024: Farm size distribution by province
# East has larger farms; West/North smallest
FARM_SIZE_PARAMS = {
    'Kigali':  {'mean': 0.40, 'std': 0.30},
    'South':   {'mean': 0.38, 'std': 0.28},
    'West':    {'mean': 0.32, 'std': 0.25},
    'North':   {'mean': 0.30, 'std': 0.22},
    'East':    {'mean': 0.61, 'std': 0.45},
}

# AHS 2024 Table 19: Input adoption by province (%)
# Improved seeds, Organic fertilizer, Inorganic fertilizer, Pesticide
INPUT_ADOPTION = {
    'Kigali': {'improved_seed': 0.666, 'organic': 0.933, 'inorganic': 0.404, 'pesticide': 0.378},
    'South':  {'improved_seed': 0.634, 'organic': 0.963, 'inorganic': 0.587, 'pesticide': 0.488},
    'West':   {'improved_seed': 0.556, 'organic': 0.957, 'inorganic': 0.745, 'pesticide': 0.389},
    'North':  {'improved_seed': 0.653, 'organic': 0.978, 'inorganic': 0.726, 'pesticide': 0.566},
    'East':   {'improved_seed': 0.712, 'organic': 0.887, 'inorganic': 0.658, 'pesticide': 0.302},
}

# AHS 2024 Table 20: Improved seed use by crop (%)
IMPROVED_SEED_BY_CROP = {
    'Maize': 0.704, 'Paddy rice': 0.585, 'Wheat': 0.099,
    'Beans': 0.005, 'Irish potato': 0.037, 'Soybean': 0.010,
    'Vegetables': 0.376, 'Cassava': 0.002, 'Sweet potato': 0.005,
}

# SAS 2026 A Table 20-21: Seed types by crop
SAS_SEED_TYPES = {
    'Maize':      {'traditional': 0.357, 'improved': 0.643},
    'Paddy rice': {'traditional': 0.878, 'improved': 0.122},
    'Wheat':      {'traditional': 0.911, 'improved': 0.089},
    'Irish potato': {'traditional': 0.961, 'improved': 0.039},
    'Cassava':    {'traditional': 0.998, 'improved': 0.002},
    'Beans':      {'traditional': 0.995, 'improved': 0.005},
    'Vegetables': {'traditional': 0.540, 'improved': 0.460},
}

# AHS 2024 Table 21: Inorganic fertilizer sources
FERTILIZER_SOURCES = {
    'Government': 0.060, 'Agro-dealers': 0.497, 'NGOs': 0.384,
    'Market': 0.078, 'Cooperative': 0.067, 'Other': 0.015,
}

# SAS 2026 A Table 22: Sowing dates by crop (% distribution across windows)
SOWING_WINDOWS = ['Before 01/09', '01-15/09', '16-30/09',
                  '01-15/10', '16-31/10', 'After 31/10', 'Other season']

SOWING_BY_CROP = {
    'Maize':      [0.098, 0.276, 0.267, 0.257, 0.060, 0.041, 0.000],
    'Beans':      [0.021, 0.215, 0.278, 0.376, 0.092, 0.018, 0.000],
    'Irish potato': [0.158, 0.232, 0.204, 0.196, 0.067, 0.143, 0.000],
    'Cassava':    [0.099, 0.215, 0.176, 0.171, 0.050, 0.080, 0.209],
    'Sweet potato': [0.363, 0.098, 0.069, 0.113, 0.078, 0.279, 0.000],
    'Vegetables': [0.262, 0.122, 0.090, 0.131, 0.086, 0.310, 0.000],
}

# AHS 2024 Table 22: Agricultural practices by province (%)
PRACTICES = {
    'Kigali': {'erosion_control': 0.923, 'agroforestry': 0.743, 'irrigation': 0.160},
    'South':  {'erosion_control': 0.941, 'agroforestry': 0.589, 'irrigation': 0.192},
    'West':   {'erosion_control': 0.923, 'agroforestry': 0.688, 'irrigation': 0.064},
    'North':  {'erosion_control': 0.970, 'agroforestry': 0.679, 'irrigation': 0.086},
    'East':   {'erosion_control': 0.806, 'agroforestry': 0.727, 'irrigation': 0.179},
}

# SAS 2026 A Table 13: Yields (Kg/Ha) by crop and district
# Format: crop -> {district: yield_kg_ha} (from SAS 2026 A Table 13)
SAS_2026A_YIELDS = {
    'Maize': {
        'Nyarugenge': 1300, 'Gasabo': 1558, 'Kicukiro': 1611, 'Nyanza': 1797,
        'Gisagara': 1933, 'Nyaruguru': 1881, 'Huye': 1737, 'Nyamagabe': 1567,
        'Ruhango': 1382, 'Muhanga': 2081, 'Kamonyi': 1863, 'Karongi': 1517,
        'Rutsiro': 1452, 'Rubavu': 1753, 'Nyabihu': 1638, 'Ngororero': 1278,
        'Rusizi': 1905, 'Nyamasheke': 1641, 'Rulindo': 2096, 'Gakenke': 1699,
        'Musanze': 1929, 'Burera': 2042, 'Gicumbi': 1437, 'Rwamagana': 1665,
        'Nyagatare': 2887, 'Gatsibo': 1899, 'Kayonza': 1909, 'Kirehe': 2051,
        'Ngoma': 1904, 'Bugesera': 1853,
    },
    'Beans': {
        'Nyarugenge': 1043, 'Gasabo': 931, 'Kicukiro': 578, 'Nyanza': 723,
        'Gisagara': 710, 'Nyaruguru': 702, 'Huye': 716, 'Nyamagabe': 720,
        'Ruhango': 826, 'Muhanga': 680, 'Kamonyi': 712, 'Karongi': 652,
        'Rutsiro': 659, 'Rubavu': 677, 'Nyabihu': 628, 'Ngororero': 610,
        'Rusizi': 721, 'Nyamasheke': 683, 'Rulindo': 594, 'Gakenke': 614,
        'Musanze': 551, 'Burera': 656, 'Gicumbi': 656, 'Rwamagana': 587,
        'Nyagatare': 787, 'Gatsibo': 654, 'Kayonza': 627, 'Kirehe': 738,
        'Ngoma': 648, 'Bugesera': 809,
    },
    'Irish potato': {
        'Nyarugenge': 6290, 'Gasabo': 7428, 'Kicukiro': 13185, 'Nyanza': 5631,
        'Gisagara': 5206, 'Nyaruguru': 10293, 'Huye': 5961, 'Nyamagabe': 7423,
        'Ruhango': 3206, 'Muhanga': 9498, 'Kamonyi': 9449, 'Karongi': 7263,
        'Rutsiro': 7712, 'Rubavu': 15696, 'Nyabihu': 15212, 'Ngororero': 6541,
        'Rusizi': 5949, 'Nyamasheke': 3958, 'Rulindo': 6483, 'Gakenke': 6912,
        'Musanze': 9644, 'Burera': 9606, 'Gicumbi': 8844, 'Rwamagana': 4712,
        'Nyagatare': 4913, 'Gatsibo': 5206, 'Kayonza': 4948, 'Kirehe': 5015,
        'Ngoma': 4304, 'Bugesera': 5004,
    },
    'Cassava': {
        'Nyarugenge': 12061, 'Gasabo': 12061, 'Kicukiro': 10191, 'Nyanza': 10753,
        'Gisagara': 13284, 'Nyaruguru': 11002, 'Huye': 11430, 'Nyamagabe': 12060,
        'Ruhango': 13719, 'Muhanga': 10797, 'Kamonyi': 13203, 'Karongi': 10230,
        'Rutsiro': 11892, 'Rubavu': 9729, 'Nyabihu': 11825, 'Ngororero': 12323,
        'Rusizi': 13134, 'Nyamasheke': 11951, 'Rulindo': 13225, 'Gakenke': 13571,
        'Musanze': 13230, 'Burera': 12053, 'Gicumbi': 14208, 'Rwamagana': 13079,
        'Nyagatare': 10924, 'Gatsibo': 12387, 'Kayonza': 14103, 'Kirehe': 13728,
        'Ngoma': 12776, 'Bugesera': 13438,
    },
    'Sweet potato': {
        'Nyarugenge': 6290, 'Gasabo': 5827, 'Kicukiro': 5818, 'Nyanza': 5631,
        'Gisagara': 5206, 'Nyaruguru': 5933, 'Huye': 6256, 'Nyamagabe': 7150,
        'Ruhango': 3933, 'Muhanga': 6218, 'Kamonyi': 5589, 'Karongi': 4088,
        'Rutsiro': 5379, 'Rubavu': 5140, 'Nyabihu': 6516, 'Ngororero': 6471,
        'Rusizi': 5949, 'Nyamasheke': 5423, 'Rulindo': 6403, 'Gakenke': 5723,
        'Musanze': 5300, 'Burera': 6872, 'Gicumbi': 7183, 'Rwamagana': 6588,
        'Nyagatare': 6053, 'Gatsibo': 7337, 'Kayonza': 6319, 'Kirehe': 4984,
        'Ngoma': 5004, 'Bugesera': 6338,
    },
    'Paddy rice': {
        'Nyarugenge': 0, 'Gasabo': 3899, 'Kicukiro': 3452, 'Nyanza': 6248,
        'Gisagara': 4493, 'Nyaruguru': 3134, 'Huye': 4043, 'Nyamagabe': 3557,
        'Ruhango': 4943, 'Muhanga': 4339, 'Kamonyi': 5062, 'Karongi': 5277,
        'Rutsiro': 0, 'Rubavu': 0, 'Nyabihu': 0, 'Ngororero': 0,
        'Rusizi': 5377, 'Nyamasheke': 5601, 'Rulindo': 5388, 'Gakenke': 4275,
        'Musanze': 0, 'Burera': 0, 'Gicumbi': 0, 'Rwamagana': 5180,
        'Nyagatare': 5048, 'Gatsibo': 5196, 'Kayonza': 4883, 'Kirehe': 5110,
        'Ngoma': 4464, 'Bugesera': 5035,
    },
}

# SAS 2026 B Table 11: Average yield by crop type and district (Kg/Ha)
SAS_2026B_YIELDS = {
    'Maize': {
        'Nyarugenge': 1196, 'Gasabo': 1319, 'Kicukiro': 747, 'Nyanza': 1317,
        'Gisagara': 1034, 'Nyaruguru': 1141, 'Huye': 1199, 'Nyamagabe': 1260,
        'Ruhango': 704, 'Muhanga': 1036, 'Kamonyi': 1156, 'Karongi': 1162,
        'Rutsiro': 1064, 'Rubavu': 1447, 'Nyabihu': 1403, 'Ngororero': 1184,
        'Rusizi': 1011, 'Nyamasheke': 990, 'Rulindo': 1087, 'Gakenke': 1079,
        'Musanze': 1585, 'Burera': 1366, 'Gicumbi': 1070, 'Rwamagana': 894,
        'Nyagatare': 1555, 'Gatsibo': 1267, 'Kayonza': 1186, 'Kirehe': 2091,
        'Ngoma': 1436, 'Bugesera': 1988,
    },
    'Beans': {
        'Nyarugenge': 721, 'Gasabo': 758, 'Kicukiro': 622, 'Nyanza': 699,
        'Gisagara': 732, 'Nyaruguru': 672, 'Huye': 724, 'Nyamagabe': 717,
        'Ruhango': 637, 'Muhanga': 586, 'Kamonyi': 595, 'Karongi': 621,
        'Rutsiro': 614, 'Rubavu': 612, 'Nyabihu': 619, 'Ngororero': 623,
        'Rusizi': 659, 'Nyamasheke': 664, 'Rulindo': 665, 'Gakenke': 687,
        'Musanze': 616, 'Burera': 599, 'Gicumbi': 686, 'Rwamagana': 626,
        'Nyagatare': 579, 'Gatsibo': 642, 'Kayonza': 635, 'Kirehe': 679,
        'Ngoma': 695, 'Bugesera': 549,
    },
    'Irish potato': {
        'Nyarugenge': 8985, 'Gasabo': 8645, 'Kicukiro': 8691, 'Nyanza': 8543,
        'Gisagara': 7441, 'Nyaruguru': 8398, 'Huye': 7904, 'Nyamagabe': 8285,
        'Ruhango': 7214, 'Muhanga': 7558, 'Kamonyi': 7638, 'Karongi': 7123,
        'Rutsiro': 7892, 'Rubavu': 8612, 'Nyabihu': 8463, 'Ngororero': 7923,
        'Rusizi': 6851, 'Nyamasheke': 7294, 'Rulindo': 7851, 'Gakenke': 8224,
        'Musanze': 9234, 'Burera': 9538, 'Gicumbi': 8557, 'Rwamagana': 6435,
        'Nyagatare': 4939, 'Gatsibo': 6028, 'Kayonza': 5213, 'Kirehe': 5978,
        'Ngoma': 4568, 'Bugesera': 5123,
    },
    'Cassava': {
        'Nyarugenge': 12844, 'Gasabo': 13155, 'Kicukiro': 11526, 'Nyanza': 14278,
        'Gisagara': 13786, 'Nyaruguru': 13276, 'Huye': 13592, 'Nyamagabe': 12841,
        'Ruhango': 14193, 'Muhanga': 12190, 'Kamonyi': 12985, 'Karongi': 12428,
        'Rutsiro': 12674, 'Rubavu': 12028, 'Nyabihu': 13538, 'Ngororero': 12756,
        'Rusizi': 14221, 'Nyamasheke': 13146, 'Rulindo': 13815, 'Gakenke': 13925,
        'Musanze': 12782, 'Burera': 13079, 'Gicumbi': 14235, 'Rwamagana': 13678,
        'Nyagatare': 11637, 'Gatsibo': 12974, 'Kayonza': 14786, 'Kirehe': 14235,
        'Ngoma': 13217, 'Bugesera': 13892,
    },
    'Sweet potato': {
        'Nyarugenge': 6712, 'Gasabo': 6905, 'Kicukiro': 6108, 'Nyanza': 6284,
        'Gisagara': 6107, 'Nyaruguru': 6328, 'Huye': 6721, 'Nyamagabe': 7145,
        'Ruhango': 5274, 'Muhanga': 6812, 'Kamonyi': 5913, 'Karongi': 4817,
        'Rutsiro': 5394, 'Rubavu': 5047, 'Nyabihu': 6283, 'Ngororero': 5947,
        'Rusizi': 5786, 'Nyamasheke': 5278, 'Rulindo': 6247, 'Gakenke': 5831,
        'Musanze': 5142, 'Burera': 6392, 'Gicumbi': 6854, 'Rwamagana': 6421,
        'Nyagatare': 5976, 'Gatsibo': 7048, 'Kayonza': 6135, 'Kirehe': 5123,
        'Ngoma': 4876, 'Bugesera': 6124,
    },
}

# Market prices (RWF/Kg) — base price per crop (NISR market price datasets)
BASE_MARKET_PRICES = {
    'Maize':       450,
    'Beans':       650,
    'Irish potato': 320,
    'Cassava':     280,
    'Sweet potato': 250,
    'Paddy rice':  900,
    'Banana':      200,
    'Vegetables':  500,
}

# Seasonal price multipliers (based on typical Rwandan market patterns)
SEASONAL_PRICE_FACTORS = {
    'A': {'harvest': 0.85, 'lean': 1.15},
    'B': {'harvest': 0.90, 'lean': 1.10},
    'C': {'harvest': 0.95, 'lean': 1.05},
}


# ============================================================
# DATASET 1: INPUT OPTIMIZER
# ============================================================

def generate_input_optimizer_dataset(n_samples=8000):
    """
    Generates dataset for Engine 1: Input Optimizer
    Predicts expected yield based on input combinations.
    """
    rows = []
    crops = list(IMPROVED_SEED_BY_CROP.keys())

    for _ in range(n_samples):
        district = np.random.choice(DISTRICTS)
        province = PROVINCES[district]
        crop = np.random.choice(crops)
        season = np.random.choice(['A', 'B', 'C'], p=[0.45, 0.40, 0.15])

        # Farm size (hectares) — from AHS 2024 Table 14
        farm_params = FARM_SIZE_PARAMS[province]
        farm_size = max(0.05, np.random.lognormal(
            np.log(farm_params['mean']),
            np.log(1 + farm_params['std'] / farm_params['mean'])
        ))
        farm_size = min(farm_size, 5.0)

        # Improved seed use — probability depends on crop & province
        seed_prob = IMPROVED_SEED_BY_CROP.get(crop, 0.2)
        seed_prob = 0.5 * seed_prob + 0.5 * INPUT_ADOPTION[province]['improved_seed']
        used_improved_seed = int(np.random.random() < seed_prob)

        # Seed quantity (kg/ha) — higher for improved
        if used_improved_seed:
            seed_qty = np.random.normal(25, 5) * (1.2 if crop == 'Maize' else 1.0)
        else:
            seed_qty = np.random.normal(15, 4)
        seed_qty = max(5, seed_qty)

        # Organic fertilizer use
        org_prob = INPUT_ADOPTION[province]['organic']
        used_organic = int(np.random.random() < org_prob)
        organic_qty = max(0, np.random.normal(2000, 500)) if used_organic else 0

        # Inorganic fertilizer use
        inorg_prob = INPUT_ADOPTION[province]['inorganic']
        used_inorganic = int(np.random.random() < inorg_prob)
        inorganic_qty = max(0, np.random.normal(100, 30)) if used_inorganic else 0

        # Pesticide use
        pest_prob = INPUT_ADOPTION[province]['pesticide']
        used_pesticide = int(np.random.random() < pest_prob)
        pesticide_qty = max(0, np.random.normal(2, 0.8)) if used_pesticide else 0

        # Base yield from SAS 2026 A
        base_yield = SAS_2026A_YIELDS.get(crop, {}).get(district, 1000)
        if base_yield == 0:
            base_yield = SAS_2026B_YIELDS.get(crop, {}).get(district, 1000)

        # === IMPACT MODEL ===
        # Improved seed: +15-30% yield
        seed_effect = 1.0 + (0.25 * used_improved_seed) if crop in ['Maize', 'Paddy rice', 'Wheat'] else 1.0 + (0.15 * used_improved_seed)

        # Organic fertilizer: +10-20% yield (with diminishing returns)
        organic_effect = 1.0 + 0.18 * (1 - np.exp(-organic_qty / 1500))

        # Inorganic fertilizer: +20-40% (with diminishing returns, synergy with organic)
        if used_inorganic:
            inorganic_effect = 1.0 + 0.30 * (1 - np.exp(-inorganic_qty / 80))
            if used_organic:
                inorganic_effect *= 1.10  # synergy
        else:
            inorganic_effect = 1.0

        # Pesticide: +5-15% (reduces losses)
        pesticide_effect = 1.0 + 0.12 * used_pesticide

        # Farm size effect (smaller farms often more intensive)
        size_effect = 1.0 + 0.05 * np.log(1 + 1/farm_size)

        # Season effect (A generally best)
        season_effect = {'A': 1.05, 'B': 1.00, 'C': 0.90}[season]

        # Random noise (weather, pests, etc.)
        noise = np.random.normal(1.0, 0.08)

        # Final yield
        expected_yield = base_yield * seed_effect * organic_effect * inorganic_effect * pesticide_effect * size_effect * season_effect * noise
        expected_yield = max(100, expected_yield)

        # Yield uncertainty range (±15-25%)
        uncertainty = np.random.uniform(0.12, 0.25)
        yield_lower = expected_yield * (1 - uncertainty)
        yield_upper = expected_yield * (1 + uncertainty)

        rows.append({
            'district': district,
            'province': province,
            'crop': crop,
            'season': season,
            'farm_size_ha': round(farm_size, 3),
            'used_improved_seed': used_improved_seed,
            'seed_qty_kg_ha': round(seed_qty, 1),
            'used_organic_fertilizer': used_organic,
            'organic_qty_kg_ha': round(organic_qty, 1),
            'used_inorganic_fertilizer': used_inorganic,
            'inorganic_qty_kg_ha': round(inorganic_qty, 1),
            'used_pesticide': used_pesticide,
            'pesticide_qty_l_ha': round(pesticide_qty, 2),
            'expected_yield_kg_ha': round(expected_yield, 1),
            'yield_lower_kg_ha': round(yield_lower, 1),
            'yield_upper_kg_ha': round(yield_upper, 1),
        })

    return pd.DataFrame(rows)


# ============================================================
# DATASET 2: YIELD PREDICTOR
# ============================================================

def generate_yield_predictor_dataset(n_samples=10000):
    """
    Generates dataset for Engine 2: Yield Predictor
    Predicts yield with confidence intervals based on farm profile + weather.
    """
    rows = []
    crops = ['Maize', 'Beans', 'Irish potato', 'Cassava', 'Sweet potato', 'Paddy rice', 'Banana']

    for _ in range(n_samples):
        district = np.random.choice(DISTRICTS)
        province = PROVINCES[district]
        crop = np.random.choice(crops)
        season = np.random.choice(['A', 'B', 'C'], p=[0.45, 0.40, 0.15])

        # Farm characteristics
        farm_params = FARM_SIZE_PARAMS[province]
        farm_size = max(0.05, np.random.lognormal(
            np.log(farm_params['mean']),
            np.log(1 + farm_params['std'] / farm_params['mean'])
        ))
        farm_size = min(farm_size, 5.0)

        # Soil type
        soil_type = np.random.choice(['Clay', 'Loam', 'Sandy', 'Volcanic'],
                                      p=[0.25, 0.35, 0.20, 0.20])

        # Elevation (m) — based on province
        elevation_map = {
            'Kigali': (1400, 1600), 'South': (1500, 1900),
            'West': (1500, 2200), 'North': (1700, 2400), 'East': (1300, 1600),
        }
        elev_min, elev_max = elevation_map[province]
        elevation = np.random.uniform(elev_min, elev_max)

        # Weather (CHIRPS-compatible simulation)
        # Rainfall (mm) — season-dependent
        rainfall_base = {'A': 450, 'B': 400, 'C': 200}[season]
        rainfall = max(50, np.random.normal(rainfall_base, rainfall_base * 0.25))

        # Temperature (°C)
        temp_base = {'A': 21, 'B': 22, 'C': 23}[season]
        temperature = np.random.normal(temp_base, 1.5)

        # Input usage (from AHS 2024 patterns)
        used_improved_seed = int(np.random.random() < IMPROVED_SEED_BY_CROP.get(crop, 0.1))
        used_organic = int(np.random.random() < INPUT_ADOPTION[province]['organic'])
        used_inorganic = int(np.random.random() < INPUT_ADOPTION[province]['inorganic'])
        used_pesticide = int(np.random.random() < INPUT_ADOPTION[province]['pesticide'])

        # Practices
        used_irrigation = int(np.random.random() < PRACTICES[province]['irrigation'])
        used_erosion_control = int(np.random.random() < PRACTICES[province]['erosion_control'])
        used_agroforestry = int(np.random.random() < PRACTICES[province]['agroforestry'])

        # Base yield from SAS 2026
        base_yield = SAS_2026A_YIELDS.get(crop, {}).get(district, None)
        if base_yield is None or base_yield == 0:
            base_yield = SAS_2026B_YIELDS.get(crop, {}).get(district, 1000)

        # Adjust base yield for SAS 2026 B if season B
        if season == 'B':
            b_yield = SAS_2026B_YIELDS.get(crop, {}).get(district, None)
            if b_yield:
                base_yield = 0.6 * base_yield + 0.4 * b_yield

        # === YIELD IMPACT MODEL ===
        # Weather effects
        # Optimal rainfall: crop-specific
        optimal_rain = {'Maize': 500, 'Beans': 400, 'Irish potato': 450,
                        'Cassava': 600, 'Sweet potato': 500,
                        'Paddy rice': 800, 'Banana': 700}[crop]
        rain_ratio = rainfall / optimal_rain
        if rain_ratio < 0.5:
            rain_effect = 0.6
        elif rain_ratio < 0.8:
            rain_effect = 0.8
        elif rain_ratio <= 1.2:
            rain_effect = 1.0
        elif rain_ratio <= 1.5:
            rain_effect = 0.85
        else:
            rain_effect = 0.65

        # Temperature effect
        optimal_temp = {'Maize': 22, 'Beans': 20, 'Irish potato': 18,
                        'Cassava': 25, 'Sweet potato': 24,
                        'Paddy rice': 26, 'Banana': 24}[crop]
        temp_effect = max(0.7, 1.0 - 0.03 * abs(temperature - optimal_temp))

        # Input effects
        seed_effect = 1.25 if used_improved_seed else 1.0
        organic_effect = 1.12 if used_organic else 1.0
        inorganic_effect = 1.30 if used_inorganic else 1.0
        pesticide_effect = 1.10 if used_pesticide else 1.0

        # Practice effects
        irrigation_effect = 1.20 if used_irrigation else 1.0
        erosion_effect = 1.08 if used_erosion_control else 1.0
        agroforestry_effect = 1.05 if used_agroforestry else 1.0

        # Soil effect
        soil_effect = {'Clay': 1.0, 'Loam': 1.15, 'Sandy': 0.85, 'Volcanic': 1.10}[soil_type]

        # Elevation effect (crop-specific)
        if crop in ['Irish potato', 'Wheat']:
            elev_effect = 1.0 + 0.0002 * (elevation - 1500)
        else:
            elev_effect = 1.0 - 0.0001 * abs(elevation - 1600)

        # Farm size effect
        size_effect = 1.0 + 0.03 * np.log(1 + 1/farm_size)

        # Combine
        noise = np.random.normal(1.0, 0.10)
        predicted_yield = base_yield * rain_effect * temp_effect * seed_effect * \
                         organic_effect * inorganic_effect * pesticide_effect * \
                         irrigation_effect * erosion_effect * agroforestry_effect * \
                         soil_effect * elev_effect * size_effect * noise
        predicted_yield = max(100, predicted_yield)

        # Confidence interval (±10-30% based on input consistency)
        input_consistency = (used_improved_seed + used_organic + used_inorganic + used_pesticide) / 4
        uncertainty = 0.25 - 0.10 * input_consistency
        yield_lower = predicted_yield * (1 - uncertainty)
        yield_upper = predicted_yield * (1 + uncertainty)

        rows.append({
            'district': district,
            'province': province,
            'crop': crop,
            'season': season,
            'farm_size_ha': round(farm_size, 3),
            'soil_type': soil_type,
            'elevation_m': round(elevation, 0),
            'rainfall_mm': round(rainfall, 1),
            'temperature_c': round(temperature, 1),
            'used_improved_seed': used_improved_seed,
            'used_organic_fertilizer': used_organic,
            'used_inorganic_fertilizer': used_inorganic,
            'used_pesticide': used_pesticide,
            'used_irrigation': used_irrigation,
            'used_erosion_control': used_erosion_control,
            'used_agroforestry': used_agroforestry,
            'predicted_yield_kg_ha': round(predicted_yield, 1),
            'yield_lower_kg_ha': round(yield_lower, 1),
            'yield_upper_kg_ha': round(yield_upper, 1),
        })

    return pd.DataFrame(rows)


# ============================================================
# DATASET 3: MARKET & POST-HARVEST INTELLIGENCE
# ============================================================

def generate_market_dataset(n_samples=6000):
    """
    Generates dataset for Engine 3: Market & Post-Harvest Intelligence
    Predicts sell-vs-store recommendation and post-harvest losses.
    """
    rows = []
    crops = list(BASE_MARKET_PRICES.keys())

    for _ in range(n_samples):
        district = np.random.choice(DISTRICTS)
        province = PROVINCES[district]
        crop = np.random.choice(crops)
        season = np.random.choice(['A', 'B', 'C'], p=[0.45, 0.40, 0.15])

        # Harvest quantity (kg)
        farm_size = max(0.05, np.random.lognormal(np.log(0.5), 0.8))
        farm_size = min(farm_size, 5.0)
        yield_per_ha = SAS_2026A_YIELDS.get(crop, {}).get(district, 1000)
        if yield_per_ha == 0:
            yield_per_ha = SAS_2026B_YIELDS.get(crop, {}).get(district, 1000)
        harvest_qty = farm_size * yield_per_ha * np.random.uniform(0.7, 1.2)

        # Current market price (RWF/kg) — base + seasonal variation
        base_price = BASE_MARKET_PRICES.get(crop, 400)
        seasonal_factor = SEASONAL_PRICE_FACTORS[season]['harvest'] if np.random.random() < 0.5 else SEASONAL_PRICE_FACTORS[season]['lean']
        price_variation = np.random.normal(1.0, 0.10)
        current_price = base_price * seasonal_factor * price_variation
        current_price = max(50, current_price)

        # Historical price trend (last 3 months) — % change
        price_trend = np.random.normal(0, 0.08)
        price_trend = np.clip(price_trend, -0.20, 0.20)

        # Storage conditions
        storage_method = np.random.choice(
            ['Traditional granary', 'Hermetic bag', 'Warehouse', 'Open air', 'Improved silo'],
            p=[0.35, 0.10, 0.20, 0.25, 0.10]
        )

        # Storage duration (weeks) — farmer considering
        storage_duration_weeks = np.random.choice([1, 2, 4, 8, 12, 16, 24],
                                                   p=[0.20, 0.20, 0.20, 0.15, 0.10, 0.10, 0.05])

        # Storage cost (RWF/kg/week)
        storage_cost_per_kg_week = {
            'Traditional granary': 2, 'Hermetic bag': 5, 'Warehouse': 10,
            'Open air': 1, 'Improved silo': 8,
        }[storage_method]

        # Post-harvest loss rate (per week) — based on storage method and crop
        base_loss_rate = {
            'Traditional granary': 0.015, 'Hermetic bag': 0.002, 'Warehouse': 0.008,
            'Open air': 0.025, 'Improved silo': 0.004,
        }[storage_method]

        # Crop-specific loss multipliers
        crop_loss_mult = {
            'Maize': 1.0, 'Beans': 1.2, 'Irish potato': 1.8,
            'Cassava': 1.5, 'Sweet potato': 1.7, 'Paddy rice': 0.8,
            'Banana': 2.0, 'Vegetables': 2.5,
        }[crop]

        # Environmental factors
        humidity = np.random.uniform(40, 90)
        temperature = np.random.uniform(15, 30)
        env_loss_mult = 1.0 + 0.01 * max(0, humidity - 70) + 0.02 * max(0, temperature - 25)

        # Total loss over storage duration
        weekly_loss_rate = base_loss_rate * crop_loss_mult * env_loss_mult
        total_loss_rate = 1 - (1 - weekly_loss_rate) ** storage_duration_weeks

        # Expected future price (if stored)
        future_price = current_price * (1 + price_trend) * np.random.normal(1.0, 0.05)
        future_price = max(50, future_price)

        # Storage cost total
        storage_cost_total = storage_cost_per_kg_week * storage_duration_weeks

        # Revenue if sell now
        revenue_sell_now = harvest_qty * current_price

        # Revenue if store
        qty_after_loss = harvest_qty * (1 - total_loss_rate)
        revenue_store = qty_after_loss * future_price - harvest_qty * storage_cost_total

        # Net gain from storing
        net_gain_store = revenue_store - revenue_sell_now

        # Recommendation: 1 = Store, 0 = Sell
        store_recommendation = 1 if net_gain_store > 0 else 0

        # Risk level
        if total_loss_rate < 0.05:
            risk_level = 'Low'
        elif total_loss_rate < 0.15:
            risk_level = 'Medium'
        else:
            risk_level = 'High'

        rows.append({
            'district': district,
            'province': province,
            'crop': crop,
            'season': season,
            'harvest_quantity_kg': round(harvest_qty, 1),
            'current_price_rwf_kg': round(current_price, 1),
            'price_trend_pct': round(price_trend * 100, 2),
            'storage_method': storage_method,
            'storage_duration_weeks': storage_duration_weeks,
            'storage_cost_per_kg_week': storage_cost_per_kg_week,
            'humidity_pct': round(humidity, 1),
            'temperature_c': round(temperature, 1),
            'total_loss_rate_pct': round(total_loss_rate * 100, 2),
            'revenue_sell_now_rwf': round(revenue_sell_now, 1),
            'revenue_store_rwf': round(revenue_store, 1),
            'net_gain_store_rwf': round(net_gain_store, 1),
            'store_recommendation': store_recommendation,
            'risk_level': risk_level,
        })

    return pd.DataFrame(rows)


# ============================================================
# MAIN
# ============================================================

def generate_all_datasets():
    os.makedirs('data/raw', exist_ok=True)

    print("Generating Engine 1 dataset (Input Optimizer)...")
    df1 = generate_input_optimizer_dataset(8000)
    df1.to_csv('data/raw/input_optimizer.csv', index=False)
    print(f"  → {len(df1)} rows, {len(df1.columns)} columns")

    print("Generating Engine 2 dataset (Yield Predictor)...")
    df2 = generate_yield_predictor_dataset(10000)
    df2.to_csv('data/raw/yield_predictor.csv', index=False)
    print(f"  → {len(df2)} rows, {len(df2.columns)} columns")

    print("Generating Engine 3 dataset (Market & Post-Harvest)...")
    df3 = generate_market_dataset(6000)
    df3.to_csv('data/raw/market_postharvest.csv', index=False)
    print(f"  → {len(df3)} rows, {len(df3.columns)} columns")

    print("\nAll datasets generated successfully!")
    print("Location: data/raw/")


if __name__ == '__main__':
    generate_all_datasets()