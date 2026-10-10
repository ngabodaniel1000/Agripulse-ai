# Processed Data

This folder holds cleaned / feature-engineered versions of the raw CSVs.

Currently the pipeline trains directly from `data/raw/`. If you want to add
feature engineering (e.g., one-hot encoding saved to disk, target encoding,
outlier removal), save the output here as:

- `input_optimizer_clean.csv`
- `yield_predictor_clean.csv`
- `market_postharvest_clean.csv`

Then point the `train()` methods in `ml/*.py` at these files instead.