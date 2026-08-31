"""
BALLON Valuation Engine — Model Training & Evaluation Pipeline

Trains baseline models and log-target regression models on qualified permanent transfers
using a strict chronological split (train < 2022-07-01, test >= 2022-07-01).
Evaluates Performance-Only and Market-Aware feature sets and exports models and authentic metrics.
"""

import json
import sqlite3
from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import DATABASE_PATH, MODEL_DIR, TRAIN_TEST_SPLIT_DATE
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


def load_qualified_transfer_dataset(conn: sqlite3.Connection) -> pd.DataFrame:
    """
    Extract qualified permanent paid transfers with pre-transfer performance statistics.
    All metrics are strictly pre-transfer to prevent data leakage.
    """
    query = """
    WITH PreTransferStats AS (
        SELECT 
            t.player_id,
            t.transfer_date,
            COUNT(a.appearance_id) AS prior_appearances,
            COALESCE(SUM(a.minutes_played), 0) AS prior_minutes,
            COALESCE(SUM(a.goals), 0) AS prior_goals,
            COALESCE(SUM(a.assists), 0) AS prior_assists
        FROM transfers t
        LEFT JOIN appearances a 
            ON t.player_id = a.player_id 
            AND a.date < t.transfer_date
            AND a.date >= DATE(t.transfer_date, '-365 days')
        WHERE t.transfer_fee IS NOT NULL AND t.transfer_fee > 0
        GROUP BY t.player_id, t.transfer_date
    )
    SELECT 
        t.player_id,
        p.name AS player_name,
        p.position,
        p.sub_position,
        p.date_of_birth,
        t.transfer_date,
        t.transfer_season,
        t.from_club_name,
        t.to_club_name,
        t.transfer_fee,
        t.market_value_in_eur AS market_value_before,
        ROUND((JULIANDAY(t.transfer_date) - JULIANDAY(p.date_of_birth)) / 365.25, 1) AS age_at_transfer,
        COALESCE(s.prior_appearances, 0) AS prior_appearances,
        COALESCE(s.prior_minutes, 0) AS prior_minutes,
        COALESCE(s.prior_goals, 0) AS prior_goals,
        COALESCE(s.prior_assists, 0) AS prior_assists
    FROM transfers t
    JOIN players p ON t.player_id = p.player_id
    LEFT JOIN PreTransferStats s 
        ON t.player_id = s.player_id 
        AND t.transfer_date = s.transfer_date
    WHERE t.transfer_fee IS NOT NULL 
      AND t.transfer_fee >= 100000
      AND p.date_of_birth IS NOT NULL
      AND t.transfer_date IS NOT NULL
    """
    logger.info("Extracting qualified transfers from SQLite...")
    df = pd.read_sql_query(query, conn)

    # Feature engineering
    df["position"] = df["position"].fillna("Missing")
    df["market_value_before"] = df["market_value_before"].fillna(0)
    
    # Safe per-90 rates
    df["goals_per_90"] = np.where(
        df["prior_minutes"] >= 270,
        (df["prior_goals"] / df["prior_minutes"]) * 90,
        0.0,
    )
    df["assists_per_90"] = np.where(
        df["prior_minutes"] >= 270,
        (df["prior_assists"] / df["prior_minutes"]) * 90,
        0.0,
    )

    # Clean age
    df["age_at_transfer"] = df["age_at_transfer"].clip(lower=15, upper=42)

    logger.info(f"Loaded {len(df):,} qualified transfers for modeling.")
    return df


class LogTargetRegressor:
    """Wrapper that fits on log1p(y) and predicts via expm1(y_pred)."""

    def __init__(self, base_regressor):
        self.base_regressor = base_regressor

    def fit(self, X, y):
        log_y = np.log1p(np.maximum(0, y))
        self.base_regressor.fit(X, log_y)
        return self

    def predict(self, X):
        log_pred = self.base_regressor.predict(X)
        return np.expm1(np.maximum(0, log_pred))

    @property
    def named_steps(self):
        return self.base_regressor.named_steps


def train_and_evaluate_all():
    conn = sqlite3.connect(str(DATABASE_PATH))
    df = load_qualified_transfer_dataset(conn)
    conn.close()

    # Chronological Split
    train_mask = df["transfer_date"] < TRAIN_TEST_SPLIT_DATE
    test_mask = df["transfer_date"] >= TRAIN_TEST_SPLIT_DATE

    df_train = df[train_mask].copy()
    df_test = df[test_mask].copy()

    logger.info(
        f"Chronological split at {TRAIN_TEST_SPLIT_DATE}: "
        f"Train={len(df_train):,} transfers, Test={len(df_test):,} transfers"
    )

    # Feature definitions
    num_features_perf = ["age_at_transfer", "prior_minutes", "goals_per_90", "assists_per_90"]
    cat_features = ["position"]

    # Preprocessing pipelines
    preprocessor_perf = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features_perf),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    # Market-aware includes log(1 + market_value_before)
    df_train["log_market_value_before"] = np.log1p(df_train["market_value_before"])
    df_test["log_market_value_before"] = np.log1p(df_test["market_value_before"])
    num_features_market = num_features_perf + ["log_market_value_before"]

    preprocessor_market = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features_market),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    y_train = df_train["transfer_fee"].values
    y_test = df_test["transfer_fee"].values

    models_to_train = {
        "Baseline_Mean": DummyRegressor(strategy="mean"),
        "Baseline_Median": DummyRegressor(strategy="median"),
        "LinearRegression_PerfOnly": Pipeline([
            ("prep", preprocessor_perf),
            ("reg", LinearRegression()),
        ]),
        "Ridge_PerfOnly": Pipeline([
            ("prep", preprocessor_perf),
            ("reg", Ridge(alpha=10.0)),
        ]),
        "LogLinear_PerfOnly": LogTargetRegressor(
            Pipeline([
                ("prep", preprocessor_perf),
                ("reg", LinearRegression()),
            ])
        ),
        "LogRidge_PerfOnly": LogTargetRegressor(
            Pipeline([
                ("prep", preprocessor_perf),
                ("reg", Ridge(alpha=10.0)),
            ])
        ),
        "LogRidge_MarketAware": LogTargetRegressor(
            Pipeline([
                ("prep", preprocessor_market),
                ("reg", Ridge(alpha=10.0)),
            ])
        ),
    }

    results = {}

    for name, model in models_to_train.items():
        if "MarketAware" in name:
            X_tr = df_train[num_features_market + cat_features]
            X_te = df_test[num_features_market + cat_features]
        else:
            X_tr = df_train[num_features_perf + cat_features]
            X_te = df_test[num_features_perf + cat_features]

        model.fit(X_tr, y_train)
        preds = model.predict(X_te)
        preds = np.maximum(0, preds)

        r2 = float(r2_score(y_test, preds))
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))

        results[name] = {
            "model_name": name,
            "R2": round(r2, 4),
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
        }
        logger.info(f"[{name}] Test R²={r2:.4f} | MAE=€{mae:,.0f} | RMSE=€{rmse:,.0f}")

    # Extract coefficients from LogRidge_MarketAware for honest feature impact reporting
    market_model = models_to_train["LogRidge_MarketAware"]
    fitted_prep = market_model.named_steps["prep"]
    fitted_reg = market_model.named_steps["reg"]

    ohe_categories = fitted_prep.named_transformers_["cat"].get_feature_names_out(cat_features).tolist()
    feature_names = num_features_market + ohe_categories
    coefficients = fitted_reg.coef_.tolist()

    feature_weights = [
        {
            "feature": f,
            "weight": round(w, 4),
            "direction": "Positive" if w > 0 else "Negative",
            "relative_importance": round(abs(w), 4),
        }
        for f, w in sorted(zip(feature_names, coefficients), key=lambda x: abs(x[1]), reverse=True)
    ]

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    market_model_path = MODEL_DIR / "valuation_market_aware.joblib"
    perf_model_path = MODEL_DIR / "valuation_perf_only.joblib"
    meta_path = MODEL_DIR / "model_metadata.json"

    joblib.dump(market_model, market_model_path)
    joblib.dump(models_to_train["LogRidge_PerfOnly"], perf_model_path)

    metadata = {
        "split_date": TRAIN_TEST_SPLIT_DATE,
        "train_samples": int(len(df_train)),
        "test_samples": int(len(df_test)),
        "models_benchmark": results,
        "market_aware_coefficients": feature_weights,
        "features": {
            "performance_only": num_features_perf + cat_features,
            "market_aware": num_features_market + cat_features,
        },
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Model artifacts successfully saved to {MODEL_DIR}")
    return metadata


if __name__ == "__main__":
    train_and_evaluate_all()
