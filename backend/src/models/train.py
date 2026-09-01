"""Reproducible, chronological training for the BALLON valuation engine."""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import ElasticNet, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, median_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import MODEL_DIR, RANDOM_SEED, TRAIN_TEST_SPLIT_DATE
from src.database import SessionLocal
from src.models.wrappers import LogTargetRegressor
from src.valuation.data_snapshot import FEATURE_COLUMNS, MARKET_FEATURE_COLUMNS, load_paid_transfer_snapshots
from src.valuation.registry import register_model

MODEL_VERSION = "ballon-valuation-v2"


def _pipeline(numeric_features: list[str], estimator: Any) -> Pipeline:
    return Pipeline([
        ("prep", ColumnTransformer([
            ("num", Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric_features),
            ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                               ("encode", OneHotEncoder(handle_unknown="ignore"))]), ["position"]),
        ])),
        ("reg", estimator),
    ])


def _metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    return {
        "mae_eur": round(float(mean_absolute_error(actual, predicted)), 2),
        "rmse_eur": round(float(np.sqrt(mean_squared_error(actual, predicted))), 2),
        "r2": round(float(r2_score(actual, predicted)), 4),
        "median_absolute_error_eur": round(float(median_absolute_error(actual, predicted)), 2),
    }


def _split(frame: pd.DataFrame):
    # The final test window is never used for model selection.
    train = frame[frame.transfer_date < "2021-07-01"].copy()
    validation = frame[(frame.transfer_date >= "2021-07-01") & (frame.transfer_date < TRAIN_TEST_SPLIT_DATE)].copy()
    test = frame[frame.transfer_date >= TRAIN_TEST_SPLIT_DATE].copy()
    return train, validation, test


def train_and_evaluate_all(as_of_date: str | None = None) -> dict[str, Any]:
    """Train candidates using snapshots known before each transfer date."""
    as_of_date = as_of_date or date.today().isoformat()
    with SessionLocal() as session:
        frame = load_paid_transfer_snapshots(session, as_of_date)
    frame = frame.dropna(subset=["transfer_fee", "transfer_date", "age_at_transfer"])
    train, validation, test = _split(frame)
    if min(len(train), len(validation), len(test)) < 2:
        raise RuntimeError("Insufficient chronological data to train and evaluate valuation models.")

    perf_features = FEATURE_COLUMNS
    market_features = MARKET_FEATURE_COLUMNS
    candidates: dict[str, tuple[Any, list[str]]] = {
        "mean_baseline": (DummyRegressor(strategy="mean"), perf_features),
        "median_baseline": (DummyRegressor(strategy="median"), perf_features),
        "linear_performance_only": (LogTargetRegressor(_pipeline([f for f in perf_features if f != "position"], LinearRegression())), perf_features),
        "ridge_performance_only": (LogTargetRegressor(_pipeline([f for f in perf_features if f != "position"], Ridge(alpha=10.0))), perf_features),
        "elastic_net_performance_only": (LogTargetRegressor(_pipeline([f for f in perf_features if f != "position"], ElasticNet(alpha=0.03, l1_ratio=0.2, random_state=RANDOM_SEED))), perf_features),
        "random_forest_performance_only": (LogTargetRegressor(_pipeline([f for f in perf_features if f != "position"], RandomForestRegressor(n_estimators=150, min_samples_leaf=4, random_state=RANDOM_SEED, n_jobs=-1))), perf_features),
        "ridge_market_aware": (LogTargetRegressor(_pipeline([f for f in market_features if f != "position"], Ridge(alpha=10.0))), market_features),
    }
    validation_results: dict[str, dict[str, float]] = {}
    fitted: dict[str, Any] = {}
    for name, (model, features) in candidates.items():
        model.fit(train[features], train.transfer_fee)
        validation_results[name] = _metrics(validation.transfer_fee.to_numpy(), model.predict(validation[features]))
        fitted[name] = model

    perf_names = [name for name in validation_results if name.endswith("performance_only")]
    selected_perf = min(perf_names, key=lambda name: validation_results[name]["mae_eur"])
    selected = {"performance_only": selected_perf, "market_aware": "ridge_market_aware"}
    test_results = {name: _metrics(test.transfer_fee.to_numpy(), model.predict(test[candidates[name][1]])) for name, model in fitted.items()}

    development = pd.concat([train, validation], ignore_index=True)
    artifacts = {}
    for config, name in selected.items():
        model, features = candidates[name]
        model.fit(development[features], development.transfer_fee)
        path = MODEL_DIR / f"valuation_{config}.joblib"
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, path)
        artifacts[config] = {"model_name": name, "path": path.name, "features": features}

    metadata: dict[str, Any] = {
        "model_version": MODEL_VERSION,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "dataset_version": "transfermarkt-postgres-source",
        "as_of_date": as_of_date,
        "transfer_type_limitation": "The source transfers table has no transfer_type column. Training rows are known positive-fee paid-transfer proxies, not verified permanent-only transfers.",
        "target": "log1p(transfer_fee_eur)",
        "random_seed": RANDOM_SEED,
        "periods": {"train_end_exclusive": "2021-07-01", "validation": ["2021-07-01", TRAIN_TEST_SPLIT_DATE], "test_start": TRAIN_TEST_SPLIT_DATE},
        "sample_counts": {"all_paid_transfer_proxies": int(len(frame)), "train": int(len(train)), "validation": int(len(validation)), "test": int(len(test))},
        "validation_results": validation_results,
        "test_results": test_results,
        "selected_models": selected,
        "artifacts": artifacts,
        "feature_schema": {"performance_only": perf_features, "market_aware": market_features},
        "data_quality_method": "Completeness score based on pre-snapshot market value, position, age, and at least 270 pre-transfer minutes; this is not prediction confidence.",
    }
    with open(MODEL_DIR / "model_metadata.json", "w", encoding="utf-8") as output:
        json.dump(metadata, output, indent=2)
    with SessionLocal() as session:
        register_model(session, metadata)
    return metadata


if __name__ == "__main__":
    print(json.dumps(train_and_evaluate_all(), indent=2))
