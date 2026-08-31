"""
Data integrity and sanity tests for Phase 1 & 2.
"""

import sqlite3
from pathlib import Path

import pandas as pd
import pytest

from src.config import DATABASE_PATH, RAW_DATA_DIR


def test_raw_files_exist():
    """Verify all raw MVP CSV files are downloaded."""
    expected_files = [
        "players.csv.gz",
        "transfers.csv.gz",
        "appearances.csv.gz",
        "player_valuations.csv.gz",
        "clubs.csv.gz",
        "competitions.csv.gz",
        "games.csv.gz",
    ]
    for fname in expected_files:
        p = RAW_DATA_DIR / fname
        assert p.exists(), f"Missing raw file: {fname}"
        assert p.stat().st_size > 1000, f"File unexpectedly small: {fname}"


def test_sqlite_tables_and_counts():
    """Verify SQLite database exists and contains expected tables with valid row counts."""
    assert DATABASE_PATH.exists(), f"Database not found at {DATABASE_PATH}"

    conn = sqlite3.connect(str(DATABASE_PATH))
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]

    expected_tables = {
        "players": 30_000,
        "transfers": 70_000,
        "appearances": 1_000_000,
        "player_valuations": 400_000,
        "clubs": 300,
        "competitions": 30,
        "games": 60_000,
    }

    for tbl, min_rows in expected_tables.items():
        assert tbl in tables, f"Table {tbl} not in SQLite database"
        cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
        count = cursor.fetchone()[0]
        assert count >= min_rows, f"Table {tbl} has only {count} rows (expected >= {min_rows})"

    conn.close()


def test_transfers_fee_structure():
    """Verify transfer fees exist and contain positive fee values for permanent transfers."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    df_transfers = pd.read_sql_query(
        "SELECT player_id, transfer_fee, transfer_date, from_club_name, to_club_name "
        "FROM transfers WHERE transfer_fee IS NOT NULL AND transfer_fee > 0 LIMIT 100",
        conn,
    )
    conn.close()

    assert len(df_transfers) > 0, "No transfers with positive fee found"
    assert "transfer_fee" in df_transfers.columns
    assert (df_transfers["transfer_fee"] > 0).all()


def test_player_appearances_join():
    """Verify player IDs can be joined between players and appearances."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    df = pd.read_sql_query(
        """
        SELECT p.player_id, p.name, SUM(a.goals) as total_goals, SUM(a.minutes_played) as total_mins
        FROM players p
        JOIN appearances a ON p.player_id = a.player_id
        GROUP BY p.player_id, p.name
        HAVING total_goals > 10
        LIMIT 10
        """,
        conn,
    )
    conn.close()

    assert len(df) == 10
    assert (df["total_goals"] > 10).all()
