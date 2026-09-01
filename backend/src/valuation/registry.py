"""Storage and audit logging for valuation artifacts and individual predictions."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_registry_tables(session: Session) -> None:
    """Ensure valuation registry tables exist across both PostgreSQL and SQLite."""
    dialect = session.bind.dialect.name if session.bind else "postgresql"

    if dialect == "postgresql":
        statements = [
            """
            CREATE TABLE IF NOT EXISTS model_versions (
                model_version TEXT PRIMARY KEY,
                training_date TIMESTAMP WITH TIME ZONE NOT NULL,
                metadata_json JSONB NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS model_evaluations (
                model_version TEXT NOT NULL,
                model_name TEXT NOT NULL,
                split_name TEXT NOT NULL,
                metrics_json JSONB NOT NULL,
                PRIMARY KEY (model_version, model_name, split_name)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS feature_snapshots (
                snapshot_id SERIAL PRIMARY KEY,
                player_id INTEGER,
                snapshot_date DATE,
                feature_json JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS valuation_predictions (
                prediction_id SERIAL PRIMARY KEY,
                player_id INTEGER,
                snapshot_id INTEGER,
                model_version TEXT NOT NULL,
                configuration TEXT NOT NULL,
                estimated_transfer_value NUMERIC(15, 2) NOT NULL,
                explanation_json JSONB,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL
            )
            """,
        ]
    else:
        statements = [
            """
            CREATE TABLE IF NOT EXISTS model_versions (
                model_version TEXT PRIMARY KEY,
                training_date TEXT NOT NULL,
                metadata_json TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS model_evaluations (
                model_version TEXT NOT NULL,
                model_name TEXT NOT NULL,
                split_name TEXT NOT NULL,
                metrics_json TEXT NOT NULL,
                PRIMARY KEY (model_version, model_name, split_name)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS feature_snapshots (
                snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                snapshot_date TEXT,
                feature_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS valuation_predictions (
                prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                snapshot_id INTEGER,
                model_version TEXT NOT NULL,
                configuration TEXT NOT NULL,
                estimated_transfer_value REAL NOT NULL,
                explanation_json TEXT,
                created_at TEXT NOT NULL
            )
            """,
        ]

    for stmt in statements:
        session.execute(text(stmt))
    session.commit()


def register_model(session: Session, metadata: dict[str, Any]) -> None:
    ensure_registry_tables(session)
    version = metadata["model_version"]
    dialect = session.bind.dialect.name if session.bind else "postgresql"

    if dialect == "postgresql":
        session.execute(
            text(
                """
                INSERT INTO model_versions (model_version, training_date, metadata_json)
                VALUES (:version, :training_date, :metadata_json)
                ON CONFLICT (model_version) DO UPDATE 
                SET training_date = EXCLUDED.training_date,
                    metadata_json = EXCLUDED.metadata_json
                """
            ),
            {
                "version": version,
                "training_date": metadata["training_date"],
                "metadata_json": json.dumps(metadata),
            },
        )

        for split, results in (("validation", metadata["validation_results"]), ("test", metadata["test_results"])):
            for model_name, metrics in results.items():
                session.execute(
                    text(
                        """
                        INSERT INTO model_evaluations (model_version, model_name, split_name, metrics_json)
                        VALUES (:version, :model_name, :split_name, :metrics_json)
                        ON CONFLICT (model_version, model_name, split_name) DO UPDATE
                        SET metrics_json = EXCLUDED.metrics_json
                        """
                    ),
                    {
                        "version": version,
                        "model_name": model_name,
                        "split_name": split,
                        "metrics_json": json.dumps(metrics),
                    },
                )
    else:
        session.execute(
            text("INSERT OR REPLACE INTO model_versions VALUES (:version, :training_date, :metadata_json)"),
            {
                "version": version,
                "training_date": metadata["training_date"],
                "metadata_json": json.dumps(metadata),
            },
        )
        for split, results in (("validation", metadata["validation_results"]), ("test", metadata["test_results"])):
            for model_name, metrics in results.items():
                session.execute(
                    text("INSERT OR REPLACE INTO model_evaluations VALUES (:version, :model_name, :split_name, :metrics_json)"),
                    {
                        "version": version,
                        "model_name": model_name,
                        "split_name": split,
                        "metrics_json": json.dumps(metrics),
                    },
                )

    session.commit()


def record_prediction(session: Session, snapshot: dict[str, Any], result: dict[str, Any], configuration: str) -> int:
    ensure_registry_tables(session)
    now = datetime.now(timezone.utc)
    serializable_snapshot = json.loads(json.dumps(snapshot, default=str))
    dialect = session.bind.dialect.name if session.bind else "postgresql"

    if dialect == "postgresql":
        snap_stmt = text(
            """
            INSERT INTO feature_snapshots (player_id, snapshot_date, feature_json, created_at)
            VALUES (:player_id, :snapshot_date, :feature_json, :created_at)
            RETURNING snapshot_id
            """
        )
        snap_res = session.execute(
            snap_stmt,
            {
                "player_id": snapshot.get("player_id"),
                "snapshot_date": snapshot.get("transfer_date"),
                "feature_json": json.dumps(serializable_snapshot),
                "created_at": now,
            },
        )
        snapshot_id = snap_res.scalar()

        pred_stmt = text(
            """
            INSERT INTO valuation_predictions
            (player_id, snapshot_id, model_version, configuration, estimated_transfer_value, explanation_json, created_at)
            VALUES (:player_id, :snapshot_id, :model_version, :configuration, :estimated_transfer_value, :explanation_json, :created_at)
            RETURNING prediction_id
            """
        )
        pred_res = session.execute(
            pred_stmt,
            {
                "player_id": snapshot.get("player_id"),
                "snapshot_id": snapshot_id,
                "model_version": result["model_version"],
                "configuration": configuration,
                "estimated_transfer_value": result["estimated_transfer_value"],
                "explanation_json": json.dumps(result["model_explanation"]),
                "created_at": now,
            },
        )
        prediction_id = pred_res.scalar()
    else:
        now_str = now.isoformat()
        snap_res = session.execute(
            text("INSERT INTO feature_snapshots (player_id, snapshot_date, feature_json, created_at) VALUES (:player_id, :snapshot_date, :feature_json, :created_at)"),
            {
                "player_id": snapshot.get("player_id"),
                "snapshot_date": snapshot.get("transfer_date"),
                "feature_json": json.dumps(serializable_snapshot),
                "created_at": now_str,
            },
        )
        # SQLite lastrowid
        snapshot_id = snap_res.lastrowid

        pred_res = session.execute(
            text(
                """
                INSERT INTO valuation_predictions
                (player_id, snapshot_id, model_version, configuration, estimated_transfer_value, explanation_json, created_at)
                VALUES (:player_id, :snapshot_id, :model_version, :configuration, :estimated_transfer_value, :explanation_json, :created_at)
                """
            ),
            {
                "player_id": snapshot.get("player_id"),
                "snapshot_id": snapshot_id,
                "model_version": result["model_version"],
                "configuration": configuration,
                "estimated_transfer_value": result["estimated_transfer_value"],
                "explanation_json": json.dumps(result["model_explanation"]),
                "created_at": now_str,
            },
        )
        prediction_id = pred_res.lastrowid

    session.commit()
    return int(prediction_id)
