# Data Provenance

Our ML datasets are synthesized from NISR published aggregates. Specifically:

- **Distributions** (means, province breakdowns, adoption rates) → NISR AHS 2024, SAS 2026 A/B reports (exact tables listed below).
- **Row-level variation** → Monte Carlo sampling from those distributions + agronomic literature ranges for quantities not published by NISR.
- **Market prices** → Approximated from Rwanda e-Soko ranges (NISR market price dataset not included in provided reports).
- **Weather** → Simulated; production system would use CHIRPS via Google Earth Engine.

We do NOT claim to have NISR microdata. NISR microdata requires formal request via info@statistics.gov.rw.

# Data Provenance — AgriPulse Rwanda AI Engines

## Honest Summary

The ML datasets in `data/raw/` are **statistically calibrated** to NISR published
aggregates from:

- **AHS 2024** — Agricultural Household Survey 2024
- **SAS 2026 Season A** — Seasonal Agricultural Survey
- **SAS 2026 Season B** — Seasonal Agricultural Survey

They are **NOT** extracted from NISR microdata (which requires formal request
to info@statistics.gov.rw). Individual rows are **Monte Carlo draws** from the
distributions published in those reports, combined with plausible agronomic
ranges for values NISR does not publish (input quantities, weather, market
prices, post-harvest loss rates).

## Legend

| Marker | Meaning |
|--------|---------|
| 🟢 DIRECT | Value copied directly from an NISR table |
| 🟡 DERIVED | Computed from NISR values |
| 🔴 SYNTHESIZED | Not in NISR reports — assumed from agronomic literature |
| ⚪ SIMULATED | Generated with a random process calibrated to a mean/range |

## Engine 1 — Input Optimizer (`data/raw/input_optimizer.csv`)

| Column | Status | NISR Source |
|--------|--------|-------------|
| `district` | 🟢 DIRECT | AHS 2024, Table 3, p. 13 (30 districts) |
| `province` | 🟢 DIRECT | AHS 2024, Table 3, p. 13 |
| `crop` | 🟢 DIRECT | AHS 2024, Table 16, p. 23 |
| `season` | 🟢 DIRECT | SAS 2026 A, §1.1 (A, B, C) |
| `farm_size_ha` | ⚪ SIMULATED | Sampled from AHS 2024 Table 14 (p. 21) log-normal |
| `used_improved_seed` | ⚪ SIMULATED | Bernoulli from AHS 2024 Table 19 (p. 26) |
| `seed_qty_kg_ha` | 🔴 SYNTHESIZED | Agronomic norms (~15 kg/ha trad, ~25 kg/ha improved) |
| `used_organic_fertilizer` | ⚪ SIMULATED | AHS 2024 Table 19 (p. 26) |
| `organic_qty_kg_ha` | 🔴 SYNTHESIZED | ~2000 kg/ha manure assumption |
| `used_inorganic_fertilizer` | ⚪ SIMULATED | AHS 2024 Table 19 (p. 26) |
| `inorganic_qty_kg_ha` | 🔴 SYNTHESIZED | ~100 kg/ha NPK assumption |
| `used_pesticide` | ⚪ SIMULATED | AHS 2024 Table 19 (p. 26) |
| `pesticide_qty_l_ha` | 🔴 SYNTHESIZED | ~2 L/ha assumption |
| `expected_yield_kg_ha` | 🟡 DERIVED | SAS 2026 A Table 13 (p. 39) × multiplier model |
| `yield_lower_kg_ha` | 🟡 DERIVED | ±15–25% band around expected |
| `yield_upper_kg_ha` | 🟡 DERIVED | ±15–25% band around expected |

## Engine 2 — Yield Predictor (`data/raw/yield_predictor.csv`)

| Column | Status | NISR Source |
|--------|--------|-------------|
| `district` | 🟢 DIRECT | AHS 2024, Table 3, p. 13 |
| `province` | 🟢 DIRECT | AHS 2024, Table 3, p. 13 |
| `crop` | 🟢 DIRECT | AHS 2024, Table 16, p. 23 |
| `season` | 🟢 DIRECT | SAS 2026 A, §1.1 |
| `farm_size_ha` | ⚪ SIMULATED | AHS 2024, Table 14, p. 21 |
| `soil_type` | 🔴 SYNTHESIZED | Not in PDFs — assumed distribution |
| `elevation_m` | 🔴 SYNTHESIZED | Not in PDFs — approximated from topography |
| `rainfall_mm` | ⚪ SIMULATED | CHIRPS mentioned but no numeric values in PDFs |
| `temperature_c` | ⚪ SIMULATED | Assumed seasonal means |
| `used_improved_seed` | ⚪ SIMULATED | AHS 2024, Table 20, p. 27 |
| `used_organic_fertilizer` | ⚪ SIMULATED | AHS 2024, Table 19, p. 26 |
| `used_inorganic_fertilizer` | ⚪ SIMULATED | AHS 2024, Table 19, p. 26 |
| `used_pesticide` | ⚪ SIMULATED | AHS 2024, Table 19, p. 26 |
| `used_irrigation` | ⚪ SIMULATED | AHS 2024, Table 22, p. 28 |
| `used_erosion_control` | ⚪ SIMULATED | AHS 2024, Table 22, p. 28 |
| `used_agroforestry` | ⚪ SIMULATED | AHS 2024, Table 22, p. 28 |
| `predicted_yield_kg_ha` | 🟡 DERIVED | SAS 2026 A Table 13 (p. 39) + SAS 2026 B Table 11 (p. 39) |
| `yield_lower_kg_ha` | 🟡 DERIVED | Confidence band |
| `yield_upper_kg_ha` | 🟡 DERIVED | Confidence band |

## Engine 3 — Market & Post-Harvest (`data/raw/market_postharvest.csv`)

| Column | Status | NISR Source |
|--------|--------|-------------|
| `district`, `province`, `crop`, `season` | 🟢 DIRECT | AHS 2024 + SAS 2026 |
| `harvest_quantity_kg` | 🟡 DERIVED | SAS 2026 yields × farm size |
| `current_price_rwf_kg` | 🔴 SYNTHESIZED | No crop prices in provided PDFs (only milk, AHS 2024 Table 53 p. 47). Approximated from e-Soko ranges. |
| `price_trend_pct` | 🔴 SYNTHESIZED | Not in PDFs — random walk |
| `storage_method` | 🟢 DIRECT | SAS 2026 A Table 16, p. 42 (production use %) |
| `storage_duration_weeks` | 🔴 SYNTHESIZED | Farmer decision — assumed |
| `storage_cost_per_kg_week` | 🔴 SYNTHESIZED | Post-harvest economics |
| `humidity_pct`, `temperature_c` | ⚪ SIMULATED | Environmental ranges |
| `total_loss_rate_pct` | 🔴 SYNTHESIZED | Not in PDFs — FAO post-harvest literature |
| `revenue_sell_now_rwf` | 🟡 DERIVED | qty × current price |
| `revenue_store_rwf` | 🟡 DERIVED | (qty × (1 − loss)) × future price − storage cost |
| `net_gain_store_rwf` | 🟡 DERIVED | revenue_store − revenue_sell_now |
| `store_recommendation` | 🟡 DERIVED | 1 if net_gain > 0 |
| `risk_level` | 🟡 DERIVED | Bands of loss rate |

## Exact NISR Table References

| Report | Page | Table | Value used |
|--------|------|-------|------------|
| AHS 2024 | 8 | § Agricultural household figures | 2.16M households, 65.3% |
| AHS 2024 | 9 | Table 1 | Input adoption %, farm size |
| AHS 2024 | 21 | Table 14 | Farm size distribution by province |
| AHS 2024 | 26 | Table 19 | Inputs by province/rural/sex |
| AHS 2024 | 27 | Table 20 | Improved seeds by crop |
| AHS 2024 | 28 | Table 21, 22 | Fertilizer sources, practices |
| AHS 2024 | 39 | Table 36 | Post-harvest tools % |
| AHS 2024 | 47 | Table 53 | Milk farm-gate prices |
| SAS 2026 A | 39 | Table 13 | Yield (Kg/Ha) by crop × district |
| SAS 2026 A | 45 | Table 19 | Sowing date by crop |
| SAS 2026 A | 47 | Table 21 | Seed type by crop |
| SAS 2026 A | 48 | Table 22 | Source of improved seeds |
| SAS 2026 A | 52 | Table 27 | Inorganic fertilizer by type |
| SAS 2026 A | 54 | Table 30 | Pesticides by type |
| SAS 2026 B | 32 | Figure 3 | Season B input use |
| SAS 2026 B | 39 | Table 11 | Season B yield by crop × district |

## Reproducing

```bash
python -m ml.data_generator    # regenerate all CSVs
python -m ml.train_all         # retrain all 3 engines