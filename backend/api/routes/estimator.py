"""Honest API surface for the BALLON historical valuation engine."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, model_validator

from src.config import DATABASE_PATH, MODEL_DIR
from src.valuation.data_snapshot import MARKET_FEATURE_COLUMNS, FEATURE_COLUMNS, load_historical_transfer_snapshot, load_player_snapshot, normalize_position
from src.valuation.explainer import ridge_contributions
from src.valuation.registry import record_prediction

router = APIRouter(prefix="/api/estimator", tags=["Estimator"])


def _metadata() -> dict[str, Any]:
    path = MODEL_DIR / "model_metadata.json"
    if not path.exists():
        raise HTTPException(status_code=503, detail="No trained valuation model is available. Run `python -m src.models.train` first.")
    return json.loads(path.read_text(encoding="utf-8"))


def _model(configuration: Literal["performance_only", "market_aware"]):
    metadata = _metadata()
    artifact = metadata["artifacts"].get(configuration)
    if not artifact:
        raise HTTPException(status_code=503, detail=f"The {configuration} model artifact is unavailable.")
    path = MODEL_DIR / artifact["path"]
    if not path.exists():
        raise HTTPException(status_code=503, detail=f"Model artifact missing: {path.name}")
    return joblib.load(path), metadata, artifact


def _quality(snapshot: dict[str, Any]) -> dict[str, Any]:
    fields = {
        "age": snapshot.get("age_at_transfer") is not None,
        "position": snapshot.get("position") != "UNKNOWN",
        "pre_transfer_market_value": snapshot.get("market_value_before") is not None,
        "minimum_minutes": float(snapshot.get("prior_minutes") or 0) >= 270,
    }
    count = sum(fields.values())
    return {"level": "High" if count == 4 else "Medium" if count >= 2 else "Low", "available_fields": fields,
            "note": "Data quality measures input completeness, not prediction confidence."}


def _predict(snapshot: dict[str, Any], configuration: Literal["performance_only", "market_aware"]) -> dict[str, Any]:
    if snapshot.get("age_at_transfer") is None:
        raise HTTPException(status_code=422, detail="A valid date of birth is required to calculate age at the valuation date.")
    if configuration == "market_aware" and snapshot.get("market_value_before") is None:
        raise HTTPException(status_code=422, detail="Market-aware valuation requires a dated market value at or before the snapshot date. Use performance_only instead.")
    model, metadata, artifact = _model(configuration)
    columns = MARKET_FEATURE_COLUMNS if configuration == "market_aware" else FEATURE_COLUMNS
    row = pd.DataFrame([{column: snapshot.get(column) for column in columns}])
    value = float(model.predict(row)[0])
    explanation = ridge_contributions(model, row) if artifact["model_name"].startswith(("ridge_", "linear_")) else []
    return {
        "estimated_transfer_value": round(value, 2),
        "model_version": metadata["model_version"],
        "model_type": artifact["model_name"],
        "target_transform": metadata["target"],
        "data_quality": _quality(snapshot),
        "model_explanation": {
            "method": "additive transformed-feature contributions in log-fee space" if explanation else "No individual explanation is implemented for this selected model.",
            "contributions": explanation,
            "note": "Contributions are model-derived log-target terms; they are not independently calculated EUR premiums.",
        },
    }


def _db() -> sqlite3.Connection:
    if not DATABASE_PATH.exists():
        raise HTTPException(status_code=500, detail="Database file not found.")
    connection = sqlite3.connect(str(DATABASE_PATH))
    connection.row_factory = sqlite3.Row
    return connection


def _record(snapshot: dict[str, Any], valuation: dict[str, Any], configuration: str) -> int:
    with _db() as connection:
        return record_prediction(connection, snapshot, valuation, configuration)


class PredictScenarioRequest(BaseModel):
    name: str | None = "Custom Player"
    age: float = Field(ge=15, le=45, description="Age at the hypothetical valuation date")
    position: str
    prior_minutes: int = Field(ge=0)
    goals: int = Field(ge=0)
    assists: int = Field(ge=0)
    market_value_before: float | None = Field(default=None, ge=0, description="Dated pre-transfer market value in EUR")
    configuration: Literal["performance_only", "market_aware"] = "market_aware"

    @model_validator(mode="after")
    def validate_market_value(self):
        if self.configuration == "market_aware" and self.market_value_before is None:
            raise ValueError("market_value_before is required for market_aware predictions")
        return self


class HistoricalRequest(BaseModel):
    player_id: int
    transfer_id: int = Field(description="SQLite row id exposed by transfer lookup; this source has no native transfer ID column")
    configuration: Literal["performance_only", "market_aware"] = "market_aware"


@router.get("/models")
def models() -> dict[str, Any]:
    """Validation and untouched-test metrics for every evaluated candidate."""
    return _metadata()


@router.get("/model-info")
def model_info() -> dict[str, Any]:
    return _metadata()


@router.post("/predict")
def predict_scenario(request: PredictScenarioRequest) -> dict[str, Any]:
    minutes = request.prior_minutes
    snapshot = {
        "player_name": request.name, "transfer_date": None, "age_at_transfer": request.age,
        "position": normalize_position(request.position), "prior_minutes": minutes,
        "prior_appearances": None, "prior_goals": request.goals, "prior_assists": request.assists,
        "goals_per_90": (request.goals / minutes * 90) if minutes >= 270 else 0.0,
        "assists_per_90": (request.assists / minutes * 90) if minutes >= 270 else 0.0,
        "market_value_before": request.market_value_before,
        "log_market_value_before": np.log1p(request.market_value_before) if request.market_value_before is not None else None,
    }
    result = _predict(snapshot, request.configuration)
    return {"mode": "scenario", "label": "HYPOTHETICAL BALLON ESTIMATED TRANSFER VALUE", "snapshot": snapshot,
            "valuation": result, "prediction_id": _record(snapshot, result, request.configuration), "actual_transfer_fee": None}


@router.post("/historical")
def historical(request: HistoricalRequest) -> dict[str, Any]:
    with _db() as connection:
        frame = load_historical_transfer_snapshot(connection, request.transfer_id)
    if frame.empty:
        raise HTTPException(status_code=404, detail="Transfer not found")
    snapshot = frame.iloc[0].to_dict()
    if int(snapshot["player_id"]) != request.player_id:
        raise HTTPException(status_code=422, detail="transfer_id does not belong to player_id")
    result = _predict(snapshot, request.configuration)
    actual = float(snapshot["transfer_fee"])
    estimate = result["estimated_transfer_value"]
    return {"mode": "historical", "label": "HISTORICAL BALLON ESTIMATED TRANSFER VALUE", "transfer_id": request.transfer_id,
            "feature_snapshot_date": snapshot["transfer_date"], "snapshot": snapshot, "valuation": result,
            "prediction_id": _record(snapshot, result, request.configuration), "actual_transfer_fee": actual, "difference_vs_actual": round(estimate - actual, 2)}


@router.get("/player/{player_id}")
def player_value(player_id: int, snapshot_date: str | None = Query(default=None), configuration: Literal["performance_only", "market_aware"] = "market_aware") -> dict[str, Any]:
    with _db() as connection:
        snapshot = load_player_snapshot(connection, player_id, snapshot_date)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Player not found")
    result = _predict(snapshot, configuration)
    return {"mode": "player", "label": "CURRENT BALLON ESTIMATED TRANSFER VALUE", "feature_snapshot_date": snapshot["transfer_date"],
            "snapshot": snapshot, "valuation": result, "prediction_id": _record(snapshot, result, configuration), "actual_transfer_fee": None}
