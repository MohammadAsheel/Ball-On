"""
FastAPI Router for BALLON Transfer Valuation Engine
"""

import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.config import DATABASE_PATH, MODEL_DIR

router = APIRouter(prefix="/api/estimator", tags=["Estimator"])

# Load models and metadata on startup
market_model = None
perf_model = None
model_meta = {}

market_model_path = MODEL_DIR / "valuation_market_aware.joblib"
perf_model_path = MODEL_DIR / "valuation_perf_only.joblib"
meta_path = MODEL_DIR / "model_metadata.json"

if market_model_path.exists():
    try:
        market_model = joblib.load(market_model_path)
    except Exception as e:
        print(f"Error loading market model: {e}")

if perf_model_path.exists():
    try:
        perf_model = joblib.load(perf_model_path)
    except Exception as e:
        print(f"Error loading perf model: {e}")

if meta_path.exists():
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            model_meta = json.load(f)
    except Exception as e:
        print(f"Error loading model metadata: {e}")


def get_db():
    if not DATABASE_PATH.exists():
        raise HTTPException(status_code=500, detail="Database file not found.")
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn


class PredictScenarioRequest(BaseModel):
    name: Optional[str] = "Custom Player"
    age: float = Field(default=24.0, ge=15.0, le=45.0, description="Player age at transfer")
    position: str = Field(default="Attack", description="Attack, Midfield, Defender, or Goalkeeper")
    market_value_before: float = Field(default=25_000_000, ge=0, description="Pre-transfer market value in EUR")
    prior_minutes: int = Field(default=2200, ge=0, description="Prior season minutes played")
    goals: int = Field(default=12, ge=0, description="Prior season goals")
    assists: int = Field(default=8, ge=0, description="Prior season assists")
    use_market_value: bool = Field(default=True, description="True for Market-Aware Model, False for Performance-Only Model")


@router.get("/models")
def get_models_benchmark():
    """Return authentic test-set evaluation metrics and feature weights from training."""
    return model_meta


@router.post("/predict")
def predict_scenario(req: PredictScenarioRequest):
    """
    Run valuation engine on Scenario Mode inputs using authentic trained Log-Target Ridge models.
    """
    mins = max(1, req.prior_minutes)
    goals_p90 = (req.goals / mins) * 90 if mins >= 270 else 0.0
    assists_p90 = (req.assists / mins) * 90 if mins >= 270 else 0.0

    # Build input DataFrame
    input_data = {
        "age_at_transfer": [req.age],
        "prior_minutes": [req.prior_minutes],
        "goals_per_90": [goals_p90],
        "assists_per_90": [assists_p90],
        "position": [req.position],
    }

    if req.use_market_value and market_model is not None:
        input_data["log_market_value_before"] = [np.log1p(max(0, req.market_value_before))]
        df_input = pd.DataFrame(input_data)
        pred_fee = float(market_model.predict(df_input)[0])
        model_used = "LogRidge_MarketAware"
    elif perf_model is not None:
        df_input = pd.DataFrame(input_data)
        pred_fee = float(perf_model.predict(df_input)[0])
        model_used = "LogRidge_PerfOnly"
    else:
        # Fallback baseline
        pred_fee = float(req.market_value_before) if req.market_value_before > 0 else 5_000_000.0
        model_used = "Heuristic_Fallback"

    # Clean estimated value
    pred_fee = max(100_000.0, pred_fee)

    # Feature contribution direction
    feature_impacts = [
        {
            "feature": "Prior Market Value",
            "value": f"€{req.market_value_before / 1_000_000:.1f}M" if req.use_market_value else "Excluded (Perf-Only)",
            "effect": "Positive" if req.use_market_value and req.market_value_before > 0 else "Neutral",
            "description": "Baseline anchor establishing player pricing tier in the market.",
        },
        {
            "feature": "Prior Season Minutes",
            "value": f"{req.prior_minutes:,} mins",
            "effect": "Positive" if req.prior_minutes >= 1500 else "Negative",
            "description": "Sustained starter workload increases deal confidence.",
        },
        {
            "feature": "Age at Transfer",
            "value": f"{req.age:.1f} years",
            "effect": "Positive" if req.age <= 25 else "Negative",
            "description": "Younger players command higher future resale premium.",
        },
        {
            "feature": "Goals / 90",
            "value": f"{goals_p90:.2f} per 90",
            "effect": "Positive" if goals_p90 > 0.2 else "Neutral",
            "description": "Direct scoring productivity contribution.",
        },
        {
            "feature": "Assists / 90",
            "value": f"{assists_p90:.2f} per 90",
            "effect": "Positive" if assists_p90 > 0.15 else "Neutral",
            "description": "Playmaking and chance creation rate.",
        },
        {
            "feature": "Position",
            "value": req.position,
            "effect": "Positive" if req.position == "Attack" else "Neutral",
            "description": "Attackers trade at higher fee multiples.",
        },
    ]

    return {
        "player_name": req.name,
        "model_used": model_used,
        "estimated_transfer_value": round(pred_fee, -4),
        "raw_prediction": pred_fee,
        "feature_impacts": feature_impacts,
        "inputs": req.model_dump(),
    }


@router.get("/player/{player_id}")
def estimate_player_value(player_id: int):
    """
    Run valuation engine on authentic database statistics for a specific player (Player Mode).
    """
    conn = get_db()
    cursor = conn.cursor()

    # Bio
    cursor.execute(
        """
        SELECT player_id, name, position, market_value_in_eur, date_of_birth,
               ROUND((JULIANDAY('now') - JULIANDAY(date_of_birth)) / 365.25, 1) AS age
        FROM players WHERE player_id = ?
        """,
        (player_id,),
    )
    p_row = cursor.fetchone()
    if not p_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Player not found")
    player = dict(p_row)

    # Latest transfer
    cursor.execute(
        """
        SELECT transfer_date, transfer_fee, market_value_in_eur, from_club_name, to_club_name
        FROM transfers
        WHERE player_id = ? AND transfer_fee > 0
        ORDER BY transfer_date DESC LIMIT 1
        """,
        (player_id,),
    )
    latest_transfer_row = cursor.fetchone()
    latest_transfer = dict(latest_transfer_row) if latest_transfer_row else None

    # Performance in the last 365 days / past year
    cursor.execute(
        """
        SELECT 
            COUNT(appearance_id) AS prior_appearances,
            COALESCE(SUM(minutes_played), 0) AS prior_minutes,
            COALESCE(SUM(goals), 0) AS prior_goals,
            COALESCE(SUM(assists), 0) AS prior_assists
        FROM appearances
        WHERE player_id = ?
        """,
        (player_id,),
    )
    stats_row = cursor.fetchone()
    stats = dict(stats_row) if stats_row else {"prior_minutes": 0, "prior_goals": 0, "prior_assists": 0}

    conn.close()

    age = player.get("age") or 25.0
    pos = player.get("position") or "Attack"
    mv = player.get("market_value_in_eur") or 10_000_000
    mins = stats.get("prior_minutes", 0)
    goals = stats.get("prior_goals", 0)
    assists = stats.get("prior_assists", 0)

    # Run scenario predict
    req = PredictScenarioRequest(
        name=player["name"],
        age=age,
        position=pos,
        market_value_before=mv,
        prior_minutes=mins,
        goals=goals,
        assists=assists,
        use_market_value=True,
    )
    prediction_result = predict_scenario(req)

    # Comparison metrics
    actual_fee = latest_transfer["transfer_fee"] if latest_transfer else None
    estimated_fee = prediction_result["estimated_transfer_value"]

    diff_actual = (estimated_fee - actual_fee) if actual_fee is not None else None
    diff_actual_pct = round((diff_actual / actual_fee) * 100, 1) if (actual_fee and actual_fee > 0) else None

    diff_market = estimated_fee - mv if mv > 0 else None
    diff_market_pct = round((diff_market / mv) * 100, 1) if (mv and mv > 0) else None

    return {
        "player": player,
        "latest_transfer": latest_transfer,
        "stats": stats,
        "valuation": {
            "estimated_transfer_value": estimated_fee,
            "actual_transfer_fee": actual_fee,
            "market_value": mv,
            "diff_vs_actual": diff_actual,
            "diff_vs_actual_pct": diff_actual_pct,
            "diff_vs_market": diff_market,
            "diff_vs_market_pct": diff_market_pct,
        },
        "model_used": prediction_result["model_used"],
        "feature_impacts": prediction_result["feature_impacts"],
    }
