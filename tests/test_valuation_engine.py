"""Regression tests for temporal correctness and honest estimator behaviour."""

import sqlite3

from fastapi.testclient import TestClient

from api.main import app
from src.config import DATABASE_PATH
from src.valuation.data_snapshot import load_historical_transfer_snapshot


def test_no_future_data_leakage():
    """A transfer snapshot must exclude all same-player appearances on/after its date."""
    with sqlite3.connect(str(DATABASE_PATH)) as conn:
        transfer_id = conn.execute(
            """
            SELECT t.rowid FROM transfers t
            WHERE t.transfer_fee > 0 AND EXISTS (
                SELECT 1 FROM appearances a WHERE a.player_id = t.player_id AND a.date >= t.transfer_date
            )
            ORDER BY t.transfer_date DESC LIMIT 1
            """
        ).fetchone()[0]
        snapshot = load_historical_transfer_snapshot(conn, transfer_id).iloc[0]
        future_minutes = conn.execute(
            "SELECT COALESCE(SUM(minutes_played), 0) FROM appearances WHERE player_id = ? AND date >= ?",
            (int(snapshot.player_id), snapshot.transfer_date),
        ).fetchone()[0]
        expected_minutes = conn.execute(
            """SELECT COALESCE(SUM(minutes_played), 0) FROM appearances
               WHERE player_id = ? AND date < ? AND date >= DATE(?, '-365 days')""",
            (int(snapshot.player_id), snapshot.transfer_date, snapshot.transfer_date),
        ).fetchone()[0]
    assert future_minutes > 0  # the fixture would expose a future-data join
    assert snapshot.prior_minutes == expected_minutes


def test_market_aware_requires_dated_market_value():
    client = TestClient(app)
    response = client.post("/api/estimator/predict", json={
        "age": 23, "position": "Attack", "prior_minutes": 1_000, "goals": 5, "assists": 2,
        "configuration": "market_aware",
    })
    assert response.status_code == 422


def test_scenario_uses_model_and_discloses_transform():
    client = TestClient(app)
    response = client.post("/api/estimator/predict", json={
        "age": 23, "position": "Attack", "prior_minutes": 2_500, "goals": 16, "assists": 9,
        "market_value_before": 40_000_000, "configuration": "market_aware",
    })
    assert response.status_code == 200
    valuation = response.json()["valuation"]
    assert valuation["model_type"] == "ridge_market_aware"
    assert valuation["target_transform"] == "log1p(transfer_fee_eur)"
    assert valuation["model_explanation"]["contributions"]
