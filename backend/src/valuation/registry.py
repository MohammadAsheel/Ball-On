"""SQLite audit storage for valuation artifacts and individual predictions."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any


def ensure_registry_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS model_versions (
        model_version TEXT PRIMARY KEY, training_date TEXT NOT NULL, metadata_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS model_evaluations (
        model_version TEXT NOT NULL, model_name TEXT NOT NULL, split_name TEXT NOT NULL,
        metrics_json TEXT NOT NULL, PRIMARY KEY (model_version, model_name, split_name)
    );
    CREATE TABLE IF NOT EXISTS feature_snapshots (
        snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER, snapshot_date TEXT,
        feature_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS valuation_predictions (
        prediction_id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER, snapshot_id INTEGER,
        model_version TEXT NOT NULL, configuration TEXT NOT NULL, estimated_transfer_value REAL NOT NULL,
        explanation_json TEXT, created_at TEXT NOT NULL
    );
    """)
    conn.commit()


def register_model(conn: sqlite3.Connection, metadata: dict[str, Any]) -> None:
    ensure_registry_tables(conn)
    version = metadata["model_version"]
    conn.execute("INSERT OR REPLACE INTO model_versions VALUES (?, ?, ?)", (version, metadata["training_date"], json.dumps(metadata)))
    for split, results in (("validation", metadata["validation_results"]), ("test", metadata["test_results"])):
        for model_name, metrics in results.items():
            conn.execute("INSERT OR REPLACE INTO model_evaluations VALUES (?, ?, ?, ?)", (version, model_name, split, json.dumps(metrics)))
    conn.commit()


def record_prediction(conn: sqlite3.Connection, snapshot: dict[str, Any], result: dict[str, Any], configuration: str) -> int:
    ensure_registry_tables(conn)
    now = datetime.now(timezone.utc).isoformat()
    serializable_snapshot = json.loads(json.dumps(snapshot, default=str))
    cursor = conn.execute(
        "INSERT INTO feature_snapshots (player_id, snapshot_date, feature_json, created_at) VALUES (?, ?, ?, ?)",
        (snapshot.get("player_id"), snapshot.get("transfer_date"), json.dumps(serializable_snapshot), now),
    )
    snapshot_id = cursor.lastrowid
    cursor = conn.execute(
        """INSERT INTO valuation_predictions
           (player_id, snapshot_id, model_version, configuration, estimated_transfer_value, explanation_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (snapshot.get("player_id"), snapshot_id, result["model_version"], configuration,
         result["estimated_transfer_value"], json.dumps(result["model_explanation"]), now),
    )
    conn.commit()
    return int(cursor.lastrowid)
