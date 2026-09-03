"""Historical feature snapshots assembled exclusively from pre-cutoff records."""

from __future__ import annotations

from datetime import date
from typing import Any

import numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session


FEATURE_COLUMNS = [
    "age_at_transfer", "prior_minutes", "goals_per_90", "assists_per_90", "position",
]
MARKET_FEATURE_COLUMNS = FEATURE_COLUMNS + ["log_market_value_before"]


def ensure_snapshot_indexes(session: Session) -> None:
    """Ensure indexes support point-in-time lookups."""
    stmts = [
        "CREATE INDEX IF NOT EXISTS idx_appearances_player_date ON appearances(player_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_valuations_player_date ON player_valuations(player_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(transfer_date)",
    ]
    for stmt in stmts:
        session.execute(text(stmt))
    session.commit()


def _snapshot_query(where_clause: str, dialect: str = "postgresql") -> str:
    if dialect == "postgresql":
        transfer_id_col = "t.transfer_id"
        date_cutoff = "AND a.date >= (st.transfer_date - INTERVAL '365 days')"
        age_calc = "ROUND(CAST((st.transfer_date - p.date_of_birth) / 365.25 AS numeric), 3)"
    else:
        transfer_id_col = "t.rowid AS transfer_id"
        date_cutoff = "AND a.date >= DATE(st.transfer_date, '-365 days')"
        age_calc = "ROUND((JULIANDAY(st.transfer_date) - JULIANDAY(p.date_of_birth)) / 365.25, 3)"

    return f"""
    WITH selected_transfers AS (
        SELECT {transfer_id_col}, t.player_id, t.transfer_date, t.transfer_season,
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
            {date_cutoff}
        GROUP BY st.transfer_id
    )
    SELECT st.*, p.name AS player_name, p.position AS raw_position, p.date_of_birth,
           {age_calc} AS age_at_transfer,
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
        if column in frame.columns:
            frame[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)
    if "raw_position" in frame.columns:
        frame["position"] = frame["raw_position"].map(normalize_position)
    minutes = frame.get("prior_minutes", pd.Series([0] * len(frame)))
    eligible = minutes >= 270
    if "prior_goals" in frame.columns:
        frame["goals_per_90"] = (frame["prior_goals"] / minutes.where(eligible, 1) * 90).where(eligible, 0.0)
    if "prior_assists" in frame.columns:
        frame["assists_per_90"] = (frame["prior_assists"] / minutes.where(eligible, 1) * 90).where(eligible, 0.0)
    if "market_value_before" in frame.columns:
        frame["market_value_before"] = pd.to_numeric(
            frame["market_value_before"], errors="coerce"
        )
        frame["log_market_value_before"] = np.log1p(
            frame["market_value_before"].clip(lower=0)
        )
    return frame


def load_paid_transfer_snapshots(session: Session, as_of_date: str) -> pd.DataFrame:
    """Return known, positive-fee transfers up to ``as_of_date``."""
    dialect = session.bind.dialect.name if session.bind else "postgresql"
    query = _snapshot_query(
        "t.transfer_fee IS NOT NULL AND t.transfer_fee > 0 "
        "AND t.transfer_date IS NOT NULL AND t.transfer_date <= :as_of_date",
        dialect=dialect,
    )
    bind = session.get_bind()
    frame = pd.read_sql_query(text(query), bind, params={"as_of_date": as_of_date})
    frame = finalise_snapshot(frame)
    frame["paid_transfer_proxy"] = True
    return frame


def load_historical_transfer_snapshot(session: Session, transfer_id: int) -> pd.DataFrame:
    dialect = session.bind.dialect.name if session.bind else "postgresql"
    where = "t.transfer_id = :transfer_id" if dialect == "postgresql" else "t.rowid = :transfer_id"
    query = _snapshot_query(where, dialect=dialect)
    bind = session.get_bind()
    frame = pd.read_sql_query(text(query), bind, params={"transfer_id": transfer_id})
    return finalise_snapshot(frame)


def load_player_snapshot(session: Session, player_id: int, snapshot_date: str | None = None) -> dict[str, Any] | None:
    """Construct a current hypothetical snapshot using only data before the supplied date."""
    if snapshot_date is None:
        snapshot_date = date.today().isoformat()

    dialect = session.bind.dialect.name if session.bind else "postgresql"

    player_stmt = text("SELECT player_id, name, position, date_of_birth FROM players WHERE player_id = :player_id")
    player_res = session.execute(player_stmt, {"player_id": player_id}).mappings().first()
    if player_res is None:
        return None

    player = dict(player_res)

    if dialect == "postgresql":
        stats_sql = """
            SELECT 
                COUNT(a.appearance_id) AS prior_appearances, 
                COALESCE(SUM(a.minutes_played), 0) AS prior_minutes,
                COALESCE(SUM(a.goals), 0) AS prior_goals, 
                COALESCE(SUM(a.assists), 0) AS prior_assists,
                (
                    SELECT market_value_in_eur 
                    FROM player_valuations pv
                    WHERE pv.player_id = :player_id AND pv.date <= CAST(:snapshot_date AS DATE) 
                    ORDER BY pv.date DESC 
                    LIMIT 1
                ) AS market_value_before
            FROM appearances a
            WHERE a.player_id = :player_id 
              AND a.date < CAST(:snapshot_date AS DATE) 
              AND a.date >= (CAST(:snapshot_date AS DATE) - INTERVAL '365 days')
        """
    else:
        stats_sql = """
            SELECT 
                COUNT(a.appearance_id) AS prior_appearances, 
                COALESCE(SUM(a.minutes_played), 0) AS prior_minutes,
                COALESCE(SUM(a.goals), 0) AS prior_goals, 
                COALESCE(SUM(a.assists), 0) AS prior_assists,
                (
                    SELECT market_value_in_eur 
                    FROM player_valuations pv
                    WHERE pv.player_id = :player_id AND pv.date <= :snapshot_date 
                    ORDER BY pv.date DESC 
                    LIMIT 1
                ) AS market_value_before
            FROM appearances a
            WHERE a.player_id = :player_id 
              AND a.date < :snapshot_date 
              AND a.date >= DATE(:snapshot_date, '-365 days')
        """

    stats_res = session.execute(text(stats_sql), {"player_id": player_id, "snapshot_date": snapshot_date}).mappings().first()
    stats = dict(stats_res) if stats_res else {}

    dob = player.get("date_of_birth")
    age = None
    if dob:
        age = (pd.Timestamp(snapshot_date) - pd.Timestamp(dob)).days / 365.25

    frame = pd.DataFrame([{
        "player_id": player["player_id"],
        "player_name": player["name"],
        "raw_position": player["position"],
        "date_of_birth": dob,
        "transfer_date": snapshot_date,
        "age_at_transfer": age,
        "prior_appearances": stats.get("prior_appearances", 0),
        "prior_minutes": stats.get("prior_minutes", 0),
        "prior_goals": stats.get("prior_goals", 0),
        "prior_assists": stats.get("prior_assists", 0),
        "market_value_before": stats.get("market_value_before"),
    }])
    
    final_df = finalise_snapshot(frame)
    return final_df.iloc[0].to_dict()
