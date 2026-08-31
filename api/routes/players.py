"""
FastAPI Router for Players & Player Intelligence
"""

import sqlite3
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from src.config import DATABASE_PATH
from src.data_collection.transfermarkt_live import TransfermarktLiveClient

router = APIRouter(prefix="/api/players", tags=["Players"])
tm_client = TransfermarktLiveClient()



def get_db():
    if not DATABASE_PATH.exists():
        raise HTTPException(status_code=500, detail="Database file not found.")
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn


class CompareRequest(BaseModel):
    player_ids: List[int]


@router.get("/search")
def search_players(q: str = Query(..., min_length=2), limit: int = 15):
    """Case-insensitive search players by name or partial name."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 
            player_id, 
            name, 
            current_club_name, 
            position, 
            sub_position,
            date_of_birth, 
            country_of_citizenship, 
            market_value_in_eur,
            image_url,
            ROUND((JULIANDAY('now') - JULIANDAY(date_of_birth)) / 365.25, 0) AS age
        FROM players
        WHERE name LIKE ? OR (first_name || ' ' || last_name) LIKE ?
        ORDER BY market_value_in_eur DESC
        LIMIT ?
        """,
        (f"%{q}%", f"%{q}%", limit),
    )
    players = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"query": q, "count": len(players), "players": players}


@router.get("/directory")
def get_players_directory(
    position: Optional[str] = Query(default=None),
    min_market_value: Optional[float] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
):
    """Browse players directory with pagination and filters."""
    conn = get_db()
    cursor = conn.cursor()

    where_clauses = ["market_value_in_eur IS NOT NULL"]
    params = []

    if position:
        where_clauses.append("position = ?")
        params.append(position)
    if min_market_value is not None:
        where_clauses.append("market_value_in_eur >= ?")
        params.append(min_market_value)

    where_sql = " AND ".join(where_clauses)

    cursor.execute(f"SELECT COUNT(*) AS total FROM players WHERE {where_sql}", tuple(params))
    total_count = cursor.fetchone()["total"]

    offset = (page - 1) * page_size
    params.extend([page_size, offset])

    cursor.execute(
        f"""
        SELECT 
            player_id, 
            name, 
            current_club_name, 
            position, 
            sub_position,
            date_of_birth, 
            country_of_citizenship, 
            market_value_in_eur,
            image_url,
            ROUND((JULIANDAY('now') - JULIANDAY(date_of_birth)) / 365.25, 0) AS age
        FROM players
        WHERE {where_sql}
        ORDER BY market_value_in_eur DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params),
    )
    players = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "players": players,
    }


@router.get("/{player_id}")
def get_player_profile(player_id: int):
    """
    Get deep player intelligence: bio, transfer value comparison,
    season-by-season performance stats, historical valuations, and transfers timeline.
    """
    conn = get_db()
    cursor = conn.cursor()

    # 1. Player Bio
    cursor.execute(
        """
        SELECT 
            player_id, name, first_name, last_name, current_club_name,
            position, sub_position, foot, height_in_cm, date_of_birth,
            country_of_citizenship, market_value_in_eur, highest_market_value_in_eur,
            image_url, agent_name,
            ROUND((JULIANDAY('now') - JULIANDAY(date_of_birth)) / 365.25, 0) AS age
        FROM players 
        WHERE player_id = ?
        """,
        (player_id,),
    )
    player_row = cursor.fetchone()
    if not player_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Player not found")
    player = dict(player_row)

    # 2. Latest Transfer Deal
    cursor.execute(
        """
        SELECT transfer_date, transfer_season, from_club_name, to_club_name, transfer_fee, market_value_in_eur
        FROM transfers
        WHERE player_id = ? AND transfer_fee > 0
        ORDER BY transfer_date DESC
        LIMIT 1
        """,
        (player_id,),
    )
    latest_transfer_row = cursor.fetchone()
    latest_transfer = dict(latest_transfer_row) if latest_transfer_row else None

    # 3. Season-by-season match performance
    cursor.execute(
        """
        SELECT 
            g.season,
            COUNT(a.appearance_id) AS appearances,
            COALESCE(SUM(a.goals), 0) AS goals,
            COALESCE(SUM(a.assists), 0) AS assists,
            COALESCE(SUM(a.minutes_played), 0) AS minutes,
            COALESCE(SUM(a.yellow_cards), 0) AS yellow_cards,
            COALESCE(SUM(a.red_cards), 0) AS red_cards
        FROM appearances a
        JOIN games g ON a.game_id = g.game_id
        WHERE a.player_id = ?
        GROUP BY g.season
        ORDER BY g.season ASC
        """,
        (player_id,),
    )
    season_rows = cursor.fetchall()
    season_stats = []
    for row in season_rows:
        r = dict(row)
        mins = r["minutes"]
        r["goals_per_90"] = round((r["goals"] / mins) * 90, 2) if mins >= 270 else 0.0
        r["assists_per_90"] = round((r["assists"] / mins) * 90, 2) if mins >= 270 else 0.0
        season_stats.append(r)

    # 4. Valuation History
    cursor.execute(
        """
        SELECT date, market_value_in_eur, current_club_name
        FROM player_valuations
        WHERE player_id = ?
        ORDER BY date ASC
        """,
        (player_id,),
    )
    valuations = [dict(row) for row in cursor.fetchall()]

    # 5. Full Career Transfers Timeline
    cursor.execute(
        """
        SELECT transfer_date, transfer_season, from_club_name, to_club_name, transfer_fee, market_value_in_eur
        FROM transfers
        WHERE player_id = ?
        ORDER BY transfer_date DESC
        """,
        (player_id,),
    )
    transfers = [dict(row) for row in cursor.fetchall()]

    # 6. Career Aggregates
    cursor.execute(
        """
        SELECT 
            COUNT(*) AS total_matches,
            COALESCE(SUM(goals), 0) AS total_goals,
            COALESCE(SUM(assists), 0) AS total_assists,
            COALESCE(SUM(minutes_played), 0) AS total_minutes,
            COALESCE(SUM(yellow_cards), 0) AS yellow_cards,
            COALESCE(SUM(red_cards), 0) AS red_cards
        FROM appearances
        WHERE player_id = ?
        """,
        (player_id,),
    )
    career_stats = dict(cursor.fetchone())

    conn.close()

    return {
        "player": player,
        "latest_transfer": latest_transfer,
        "season_stats": season_stats,
        "valuations": valuations,
        "transfers": transfers,
        "career_stats": career_stats,
    }


@router.post("/compare")
def compare_players(req: CompareRequest):
    """Compare 2 to 4 players side-by-side on performance, market value, and metrics."""
    if not req.player_ids or len(req.player_ids) > 4:
        raise HTTPException(status_code=400, detail="Provide between 1 and 4 player IDs to compare.")

    conn = get_db()
    cursor = conn.cursor()

    players_data = []

    for pid in req.player_ids:
        cursor.execute(
            """
            SELECT 
                player_id, name, current_club_name, position, sub_position,
                date_of_birth, country_of_citizenship, market_value_in_eur,
                highest_market_value_in_eur, image_url,
                ROUND((JULIANDAY('now') - JULIANDAY(date_of_birth)) / 365.25, 0) AS age
            FROM players 
            WHERE player_id = ?
            """,
            (pid,),
        )
        p_row = cursor.fetchone()
        if not p_row:
            continue
        p = dict(p_row)

        # Career stats
        cursor.execute(
            """
            SELECT 
                COUNT(*) AS total_matches,
                COALESCE(SUM(goals), 0) AS total_goals,
                COALESCE(SUM(assists), 0) AS total_assists,
                COALESCE(SUM(minutes_played), 0) AS total_minutes
            FROM appearances
            WHERE player_id = ?
            """,
            (pid,),
        )
        app_stats = dict(cursor.fetchone())
        mins = app_stats["total_minutes"]
        app_stats["goals_per_90"] = round((app_stats["total_goals"] / mins) * 90, 2) if mins >= 450 else 0.0
        app_stats["assists_per_90"] = round((app_stats["total_assists"] / mins) * 90, 2) if mins >= 450 else 0.0

        p["stats"] = app_stats
        players_data.append(p)

    conn.close()
    return {"count": len(players_data), "players": players_data}


@router.get("/{player_id}/live-transfermarkt")
def get_player_transfermarkt_live(player_id: int, refresh: bool = Query(default=False)):
    """
    Fetch real-time / verified Transfermarkt intelligence for a player:
    trophies cabinet, contract status, outfitter, agent, social media, and transfer timeline.
    Uses local cache for instant sub-millisecond retrieval unless refresh=true.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT player_id, name, first_name, last_name FROM players WHERE player_id = ?", (player_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Player not found in database")

    player_name = row["name"]
    is_cached = tm_client.get_cached_player(player_name) is not None if not refresh else False

    data = tm_client.get_player_info(player_name, force_refresh=refresh)
    if not data:
        # Fallback search by ID or name
        data = tm_client.get_cached_player(str(player_id))

    return {
        "player_id": player_id,
        "player_name": player_name,
        "configured": tm_client.is_configured,
        "cached": is_cached,
        "data": data,
    }


@router.get("/live-transfermarkt/search")
def search_transfermarkt_live(q: str = Query(..., min_length=2), refresh: bool = Query(default=False)):
    """
    Directly query Transfermarkt live intelligence for any player name or Transfermarkt profile URL.
    """
    if not tm_client.is_configured:
        raise HTTPException(status_code=503, detail="Transfermarkt API key not configured")

    is_cached = tm_client.get_cached_player(q) is not None if not refresh else False
    data = tm_client.get_player_info(q, force_refresh=refresh)

    if not data:
        raise HTTPException(status_code=404, detail=f"No Transfermarkt profile found for '{q}'")

    return {
        "query": q,
        "configured": True,
        "cached": is_cached,
        "data": data,
    }

