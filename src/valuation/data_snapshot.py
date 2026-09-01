"""Historical feature snapshots assembled exclusively from pre-cutoff records."""

from __future__ import annotations

import sqlite3
from datetime import date
from typing import Any

import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "age_at_transfer", "prior_minutes", "goals_per_90", "assists_per_90", "position",
]
MARKET_FEATURE_COLUMNS = FEATURE_COLUMNS + ["log_market_value_before"]


def ensure_snapshot_indexes(conn: sqlite3.Connection) -> None:
    """Indexes support point-in-time lookups; they do not alter source data."""
    conn.executescript(
        """
        CREATE INDEX IF NOT EXISTS idx_appearances_player_date ON appearances(player_id, date);
        CREATE INDEX IF NOT EXISTS idx_valuations_player_date ON player_valuations(player_id, date);
        CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(transfer_date);
        """
    )
    conn.commit()


def _snapshot_query(where_clause: str) -> str:
    return f"""
    WITH selected_transfers AS (
        SELECT t.rowid AS transfer_id, t.player_id, t.transfer_date, t.transfer_season,
               t.from_club_id, t.to_club_id, t.from_club_name, t.to_club_name,
               t.transfer_fee
        FROM transfers t
        WHERE {where_clause}
    ),
    pre_transfer_valuations AS (
        SELECT st.transfer_id, pv.market_value_in_eur,
               ROW_NUMBER() OVER (PARTITION BY st.transfer_id ORDER BY pv.date DESC) AS rn
        FROM selected_transfers st
        LEFT JOIN player_valuations pv ON pv.player_id = st.player_id
            AND pv.date <= st.transfer_date
    ),
    pre_transfer_stats AS (
        SELECT st.transfer_id,
               COUNT(a.appearance_id) AS prior_appearances,
               COALESCE(SUM(a.minutes_played), 0) AS prior_minutes,
               COALESCE(SUM(a.goals), 0) AS prior_goals,
               COALESCE(SUM(a.assists), 0) AS prior_assists
        FROM selected_transfers st
        LEFT JOIN appearances a ON a.player_id = st.player_id
            AND a.date < st.transfer_date
            AND a.date >= DATE(st.transfer_date, '-365 days')
        GROUP BY st.transfer_id
    )
    SELECT st.*, p.name AS player_name, p.position AS raw_position, p.date_of_birth,
           ROUND((JULIANDAY(st.transfer_date) - JULIANDAY(p.date_of_birth)) / 365.25, 3)
               AS age_at_transfer,
           v.market_value_in_eur AS market_value_before,
           s.prior_appearances, s.prior_minutes, s.prior_goals, s.prior_assists
    FROM selected_transfers st
    JOIN players p ON p.player_id = st.player_id
    LEFT JOIN pre_transfer_valuations v ON v.transfer_id = st.transfer_id AND v.rn = 1
    LEFT JOIN pre_transfer_stats s ON s.transfer_id = st.transfer_id
    """


def normalize_position(position: object) -> str:
    value = str(position or "").strip().lower()
    if value in {"goalkeeper", "gk"}:
        return "GK"
    if value in {"defender", "defence", "def"}:
        return "DEF"
    if value in {"midfield", "midfielder", "mid"}:
        return "MID"
    if value in {"attack", "forward", "fwd"}:
        return "FWD"
    return "UNKNOWN"


def finalise_snapshot(frame: pd.DataFrame) -> pd.DataFrame:
    """Apply deterministic feature derivations after temporal SQL filtering."""
    if frame.empty:
        return frame
    for column in ("prior_appearances", "prior_minutes", "prior_goals", "prior_assists"):
        frame[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)
    frame["position"] = frame["raw_position"].map(normalize_position)
    minutes = frame["prior_minutes"]
    eligible = minutes >= 270
    frame["goals_per_90"] = (frame["prior_goals"] / minutes.where(eligible, 1) * 90).where(eligible, 0.0)
    frame["assists_per_90"] = (frame["prior_assists"] / minutes.where(eligible, 1) * 90).where(eligible, 0.0)
    frame["log_market_value_before"] = frame["market_value_before"].clip(lower=0).map(
        lambda value: np.log1p(value) if pd.notna(value) else np.nan
    )
    return frame


def load_paid_transfer_snapshots(conn: sqlite3.Connection, as_of_date: str) -> pd.DataFrame:
    """Return known, positive-fee transfers up to ``as_of_date``.

    The source schema has no transfer-type column. Therefore `paid_transfer_proxy`
    is preserved in the output and this cannot be represented as verified permanent-only data.
    """
    ensure_snapshot_indexes(conn)
    query = _snapshot_query(
        "t.transfer_fee IS NOT NULL AND t.transfer_fee > 0 "
        "AND t.transfer_date IS NOT NULL AND t.transfer_date <= :as_of_date"
    )
    frame = pd.read_sql_query(query, conn, params={"as_of_date": as_of_date})
    frame = finalise_snapshot(frame)
    frame["paid_transfer_proxy"] = True
    return frame


def load_historical_transfer_snapshot(conn: sqlite3.Connection, transfer_id: int) -> pd.DataFrame:
    ensure_snapshot_indexes(conn)
    frame = pd.read_sql_query(_snapshot_query("t.rowid = :transfer_id"), conn, params={"transfer_id": transfer_id})
    return finalise_snapshot(frame)


def load_player_snapshot(conn: sqlite3.Connection, player_id: int, snapshot_date: str | None = None) -> dict[str, Any] | None:
    """Construct a current hypothetical snapshot using only data before the supplied date."""
    if snapshot_date is None:
        snapshot_date = date.today().isoformat()
    player = conn.execute(
        "SELECT player_id, name, position, date_of_birth FROM players WHERE player_id = ?", (player_id,)
    ).fetchone()
    if player is None:
        return None
    ensure_snapshot_indexes(conn)
    row = conn.execute(
        """
        SELECT COUNT(a.appearance_id), COALESCE(SUM(a.minutes_played), 0),
               COALESCE(SUM(a.goals), 0), COALESCE(SUM(a.assists), 0),
               (SELECT market_value_in_eur FROM player_valuations pv
                 WHERE pv.player_id = ? AND pv.date <= ? ORDER BY pv.date DESC LIMIT 1)
        FROM appearances a
        WHERE a.player_id = ? AND a.date < ? AND a.date >= DATE(?, '-365 days')
        """,
        (player_id, snapshot_date, player_id, snapshot_date, snapshot_date),
    ).fetchone()
    frame = pd.DataFrame([{
        "player_id": player[0], "player_name": player[1], "raw_position": player[2],
        "date_of_birth": player[3], "transfer_date": snapshot_date,
        "age_at_transfer": (pd.Timestamp(snapshot_date) - pd.Timestamp(player[3])).days / 365.25 if player[3] else None,
        "prior_appearances": row[0], "prior_minutes": row[1], "prior_goals": row[2],
        "prior_assists": row[3], "market_value_before": row[4],
    }])
    return finalise_snapshot(frame).iloc[0].to_dict()
