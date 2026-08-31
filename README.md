# Football Transfer Value Predictor ⚽

An end-to-end machine learning system that predicts football player transfer fees using historical performance data, then compares predictions against actual transfer values.

> **Note:** All predictions are model-estimated values, not objective truth. Transfer fees depend on many factors (negotiations, release clauses, agent influence, market dynamics) that cannot be captured by player statistics alone.

---

## 🎯 Problem Statement

Football transfer fees are driven by a complex mix of on-pitch performance, market dynamics, and negotiation. This project builds a regression model to estimate transfer values from historical player statistics and contextual features, and evaluates how well statistical models can approximate real-world transfer pricing.

## 📊 Data Sources

| Source | What It Provides | Role |
|---|---|---|
| [transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) | Players, transfers (with fees), appearances, valuations, clubs, competitions | **Primary** |
| [API-Football](https://www.api-football.com/) | Current-season player stats, transfers | Supplementary (optional) |

Data © Transfermarkt. Used for educational/portfolio purposes only.

## 🏗️ Architecture

```
src/
├── data_collection/      # Download & cache datasets
├── preprocessing/        # Cleaning, feature engineering, validation
├── models/               # Training, evaluation, prediction, baselines
├── explainability/       # SHAP feature importance
└── utils/                # Logging, helpers

api/                      # FastAPI prediction endpoints
frontend/                 # Streamlit dashboard (MVP)
notebooks/                # Exploratory data analysis
tests/                    # Unit & integration tests
```

## 🔧 Tech Stack

- **Data:** Pandas, NumPy, SQLite
- **ML:** scikit-learn, XGBoost
- **Visualization:** Matplotlib, Seaborn, Plotly
- **Explainability:** SHAP
- **API:** FastAPI
- **Frontend:** Streamlit (MVP)

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd BallOn

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
copy .env.example .env
# Edit .env with your settings (API keys are optional for MVP)
```

### 3. Download Data

```bash
python -m src.data_collection.transfermarkt
```

This downloads ~7 CSV files from the transfermarkt-datasets CDN, validates them, and loads them into a SQLite database at `db/football_transfers.db`.

### 4. Run Data Pipeline

```bash
# (Coming in Phase 3-5)
python -m src.preprocessing.cleaning
python -m src.preprocessing.feature_engineering
```

### 5. Train Model

```bash
# (Coming in Phase 6)
python -m src.models.train
```

### 6. Start API

```bash
# (Coming in Phase 9)
uvicorn api.main:app --reload
```

### 7. Launch Dashboard

```bash
# (Coming in Phase 10)
streamlit run frontend/app.py
```

## 📋 Feature Definitions

### Player Performance Features

| Feature | Description | Temporal Safety |
|---|---|---|
| `age_at_transfer` | Age at transfer date | ✅ Computed from DOB |
| `position` | Simplified: GK/DEF/MID/FWD | ✅ Static attribute |
| `appearances` | Matches in prior season | ✅ Pre-transfer only |
| `minutes_played` | Minutes in prior season | ✅ Pre-transfer only |
| `goals` | Goals in prior season | ✅ Pre-transfer only |
| `assists` | Assists in prior season | ✅ Pre-transfer only |
| `goals_per_90` | Goals per 90 minutes | ✅ Derived from above |
| `assists_per_90` | Assists per 90 minutes | ✅ Derived from above |
| `market_value_before` | Latest valuation before transfer | ✅ Strictly before date |

### Data Leakage Prevention

Every feature is computed using data available **before** the transfer date. Post-transfer performance, the transfer fee itself, and future valuations are never used as inputs.

## 📈 Models

| Model | Type | Purpose |
|---|---|---|
| Mean Baseline | Always predict mean fee | Trivial baseline |
| Median Baseline | Always predict median fee | Trivial baseline |
| Previous Value | Use last known market value | Informed baseline |
| Linear Regression | Interpretable linear model | ML baseline |
| Ridge Regression | Regularized linear model | Handle multicollinearity |
| Random Forest | Ensemble of decision trees | Non-linear patterns |
| XGBoost | Gradient-boosted trees | State-of-art tabular |

## ⚠️ Limitations

1. Transfer fees depend on non-quantifiable factors (negotiations, agent influence, release clauses)
2. Market values are community estimates, not objective truth
3. Dataset is skewed toward European football
4. Free transfers, loans, and undisclosed fees are excluded
5. Transfer fee inflation over time may affect older data
6. Model outputs are **estimates**, not predictions with certainty

## 📁 Project Status

- [x] Phase 1: Project Setup
- [x] Phase 2: Data Acquisition
- [ ] Phase 3: Data Cleaning
- [ ] Phase 4: Exploratory Analysis
- [ ] Phase 5: Feature Engineering
- [ ] Phase 6: Linear Regression Baseline
- [ ] Phase 7: Advanced Models
- [ ] Phase 8: Explainability
- [ ] Phase 9: Prediction API
- [ ] Phase 10: Dashboard
- [ ] Phase 11: Testing
- [ ] Phase 12: Documentation

## 📜 License

This project is for educational and portfolio purposes. Football data is sourced from [Transfermarkt](https://www.transfermarkt.com/) via the [transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) project.
