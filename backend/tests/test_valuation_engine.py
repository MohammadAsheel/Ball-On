"""Regression tests for temporal correctness and honest estimator behaviour."""

from fastapi.testclient import TestClient
from sqlalchemy import text

from api.main import app
from src.database import SessionLocal
from src.valuation.data_snapshot import load_historical_transfer_snapshot


def test_no_future_data_leakage():
    """A transfer snapshot must exclude all same-player appearances on/after its date."""
    with SessionLocal() as session:
        dialect = session.bind.dialect.name if session.bind else "postgresql"
        id_col = "t.transfer_id" if dialect == "postgresql" else "t.rowid AS transfer_id"

        query = f"""
            SELECT {id_col}, t.player_id, t.transfer_date FROM transfers t
            WHERE t.transfer_fee > 0 AND EXISTS (
                SELECT 1 FROM appearances a WHERE a.player_id = t.player_id AND a.date >= t.transfer_date
            )
            ORDER BY t.transfer_date DESC LIMIT 1
        """
        row = session.execute(text(query)).mappings().first()
        if not row:
            return

        transfer_id = row["transfer_id"]
        snapshot_df = load_historical_transfer_snapshot(session, transfer_id)
        assert not snapshot_df.empty
        snapshot = snapshot_df.iloc[0]

        future_res = session.execute(
            text("SELECT COALESCE(SUM(minutes_played), 0) FROM appearances WHERE player_id = :pid AND date >= :tdate"),
            {"pid": int(snapshot.player_id), "tdate": snapshot.transfer_date},
        )
        future_minutes = future_res.scalar() or 0

        if dialect == "postgresql":
            expected_sql = """
                SELECT COALESCE(SUM(minutes_played), 0) FROM appearances
                WHERE player_id = :pid AND date < :tdate AND date >= (CAST(:tdate AS DATE) - INTERVAL '365 days')
            """
        else:
            expected_sql = """
                SELECT COALESCE(SUM(minutes_played), 0) FROM appearances
                WHERE player_id = :pid AND date < :tdate AND date >= DATE(:tdate, '-365 days')
            """

        expected_res = session.execute(
            text(expected_sql),
            {"pid": int(snapshot.player_id), "tdate": snapshot.transfer_date},
        )
        expected_minutes = expected_res.scalar() or 0

    assert future_minutes > 0  # the fixture would expose a future-data join
    assert snapshot.prior_minutes == expected_minutes


def test_market_aware_requires_dated_market_value():
    client = TestClient(app)
    response = client.post(
        "/api/estimator/predict",
        json={
            "age": 23,
            "position": "Attack",
            "prior_minutes": 1_000,
            "goals": 5,
            "assists": 2,
            "configuration": "market_aware",
        },
    )
    assert response.status_code == 422


def test_scenario_uses_model_and_discloses_transform():
    client = TestClient(app)
    response = client.post(
        "/api/estimator/predict",
        json={
            "age": 23,
            "position": "Attack",
            "prior_minutes": 2_500,
            "goals": 16,
            "assists": 9,
            "market_value_before": 40_000_000,
            "configuration": "market_aware",
        },
    )
    assert response.status_code == 200
    valuation = response.json()["valuation"]
    assert valuation["model_type"] == "ridge_market_aware"
    assert valuation["target_transform"] == "log1p(transfer_fee_eur)"
    assert valuation["model_explanation"]["contributions"]
