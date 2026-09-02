"""
FastAPI Router for Players & Player Intelligence
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database import get_db
from src.data_collection.transfermarkt_live import TransfermarktLiveClient

router = APIRouter(prefix="/api/players", tags=["Players"])
tm_client = TransfermarktLiveClient()


class CompareRequest(BaseModel):
    player_ids: List[int]


def _get_dialect(db: Session) -> str:
    return db.bind.dialect.name if db.bind else "postgresql"


def _age_sql(dialect: str) -> str:
    if dialect == "postgresql":
        return "CASE WHEN date_of_birth IS NOT NULL THEN CAST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, CAST(date_of_birth AS DATE))) AS INT) ELSE NULL END"
    return "ROUND((JULIANDAY('now') - JULIANDAY(date_of_birth)) / 365.25, 0)"


def _like_op(dialect: str) -> str:
    return "ILIKE" if dialect == "postgresql" else "LIKE"


@router.get("/search")
def search_players(
    q: str = Query(..., min_length=2),
    limit: int = 15,
    db: Session = Depends(get_db),
):
    """Case-insensitive search players by name or partial name."""
    dialect = _get_dialect(db)
    age_col = _age_sql(dialect)
    like_op = _like_op(dialect)

    stmt = text(
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
            {age_col} AS age
        FROM players
        WHERE name {like_op} :q_pattern OR (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) {like_op} :q_pattern
        ORDER BY market_value_in_eur DESC
        LIMIT :limit
        """
    )
    res = db.execute(stmt, {"q_pattern": f"%{q}%", "limit": limit})
    players = [dict(row) for row in res.mappings().all()]
    return {"query": q, "count": len(players), "players": players}


@router.get("/directory")
def get_players_directory(
    position: Optional[str] = Query(default=None),
    min_market_value: Optional[float] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Browse players directory with pagination and filters."""
    dialect = _get_dialect(db)
    age_col = _age_sql(dialect)

    where_clauses = ["market_value_in_eur IS NOT NULL"]
    params = {}

    if position:
        where_clauses.append("position = :position")
        params["position"] = position
    if min_market_value is not None:
        where_clauses.append("market_value_in_eur >= :min_market_value")
        params["min_market_value"] = min_market_value

    where_sql = " AND ".join(where_clauses)

    count_stmt = text(f"SELECT COUNT(*) AS total FROM players WHERE {where_sql}")
    total_res = db.execute(count_stmt, params)
    total_count = total_res.scalar() or 0

    offset = (page - 1) * page_size
    query_params = dict(params)
    query_params["limit"] = page_size
    query_params["offset"] = offset

    fetch_stmt = text(
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
            {age_col} AS age
        FROM players
        WHERE {where_sql}
        ORDER BY market_value_in_eur DESC
        LIMIT :limit OFFSET :offset
        """
    )
    res = db.execute(fetch_stmt, query_params)
    players = [dict(row) for row in res.mappings().all()]

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "players": players,
    }


@router.get("/{player_id}")
def get_player_profile(player_id: int, db: Session = Depends(get_db)):
    """
    Get deep player intelligence: bio, transfer value comparison,
    season-by-season performance stats, historical valuations, and transfers timeline.
    """
    dialect = _get_dialect(db)
    age_col = _age_sql(dialect)

    # 1. Player Bio
    bio_stmt = text(
        f"""
        SELECT 
            player_id, name, first_name, last_name, current_club_name,
            position, sub_position, foot, height_in_cm, date_of_birth,
            country_of_citizenship, market_value_in_eur, highest_market_value_in_eur,
            image_url, agent_name,
            {age_col} AS age
        FROM players 
        WHERE player_id = :player_id
        """
    )
    bio_res = db.execute(bio_stmt, {"player_id": player_id})
    player_row = bio_res.mappings().first()
    if not player_row:
        raise HTTPException(status_code=404, detail="Player not found")
    player = dict(player_row)

    # 2. Latest Transfer Deal
    trans_stmt = text(
        """
        SELECT transfer_date, transfer_season, from_club_name, to_club_name, transfer_fee, market_value_in_eur
        FROM transfers
        WHERE player_id = :player_id AND transfer_fee > 0
        ORDER BY transfer_date DESC
        LIMIT 1
        """
    )
    trans_res = db.execute(trans_stmt, {"player_id": player_id})
    latest_transfer_row = trans_res.mappings().first()
    latest_transfer = dict(latest_transfer_row) if latest_transfer_row else None

    # 3. Season-by-season match performance
    perf_stmt = text(
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
        WHERE a.player_id = :player_id
        GROUP BY g.season
        ORDER BY g.season ASC
        """
    )
    perf_res = db.execute(perf_stmt, {"player_id": player_id})
    season_rows = perf_res.mappings().all()
    season_stats = []
    for row in season_rows:
        r = dict(row)
        mins = r["minutes"]
        r["goals_per_90"] = round((float(r["goals"]) / mins) * 90, 2) if mins >= 270 else 0.0
        r["assists_per_90"] = round((float(r["assists"]) / mins) * 90, 2) if mins >= 270 else 0.0
        season_stats.append(r)

    # 4. Valuation History
    val_stmt = text(
        """
        SELECT date, market_value_in_eur, current_club_name
        FROM player_valuations
        WHERE player_id = :player_id
        ORDER BY date ASC
        """
    )
    val_res = db.execute(val_stmt, {"player_id": player_id})
    valuations = [dict(row) for row in val_res.mappings().all()]

    # 5. Full Career Transfers Timeline
    career_trans_stmt = text(
        """
        SELECT transfer_date, transfer_season, from_club_name, to_club_name, transfer_fee, market_value_in_eur
        FROM transfers
        WHERE player_id = :player_id
        ORDER BY transfer_date DESC
        """
    )
    career_trans_res = db.execute(career_trans_stmt, {"player_id": player_id})
    transfers = [dict(row) for row in career_trans_res.mappings().all()]

    # 6. Career Aggregates
    agg_stmt = text(
        """
        SELECT 
            COUNT(*) AS total_matches,
            COALESCE(SUM(goals), 0) AS total_goals,
            COALESCE(SUM(assists), 0) AS total_assists,
            COALESCE(SUM(minutes_played), 0) AS total_minutes,
            COALESCE(SUM(yellow_cards), 0) AS yellow_cards,
            COALESCE(SUM(red_cards), 0) AS red_cards
        FROM appearances
        WHERE player_id = :player_id
        """
    )
    agg_res = db.execute(agg_stmt, {"player_id": player_id})
    career_stats_row = agg_res.mappings().first()
    career_stats = dict(career_stats_row) if career_stats_row else {}

    return {
        "player": player,
        "latest_transfer": latest_transfer,
        "season_stats": season_stats,
        "valuations": valuations,
        "transfers": transfers,
        "career_stats": career_stats,
    }


@router.post("/compare")
def compare_players(req: CompareRequest, db: Session = Depends(get_db)):
    """Compare 2 to 4 players side-by-side on performance, market value, and metrics."""
    if not req.player_ids or len(req.player_ids) > 4:
        raise HTTPException(status_code=400, detail="Provide between 1 and 4 player IDs to compare.")

    dialect = _get_dialect(db)
    age_col = _age_sql(dialect)

    players_data = []

    for pid in req.player_ids:
        p_stmt = text(
            f"""
            SELECT 
                player_id, name, current_club_name, position, sub_position,
                date_of_birth, country_of_citizenship, market_value_in_eur,
                highest_market_value_in_eur, image_url,
                {age_col} AS age
            FROM players 
            WHERE player_id = :pid
            """
        )
        p_res = db.execute(p_stmt, {"pid": pid})
        p_row = p_res.mappings().first()
        if not p_row:
            continue
        p = dict(p_row)

        # Career stats
        app_stmt = text(
            """
            SELECT 
                COUNT(*) AS total_matches,
                COALESCE(SUM(goals), 0) AS total_goals,
                COALESCE(SUM(assists), 0) AS total_assists,
                COALESCE(SUM(minutes_played), 0) AS total_minutes
            FROM appearances
            WHERE player_id = :pid
            """
        )
        app_res = db.execute(app_stmt, {"pid": pid})
        app_row = app_res.mappings().first()
        app_stats = dict(app_row) if app_row else {"total_matches": 0, "total_goals": 0, "total_assists": 0, "total_minutes": 0}
        
        mins = app_stats.get("total_minutes", 0)
        app_stats["goals_per_90"] = round((float(app_stats["total_goals"]) / mins) * 90, 2) if mins >= 450 else 0.0
        app_stats["assists_per_90"] = round((float(app_stats["total_assists"]) / mins) * 90, 2) if mins >= 450 else 0.0

        p["stats"] = app_stats
        players_data.append(p)

    return {"count": len(players_data), "players": players_data}


@router.get("/{player_id}/live-transfermarkt")
def get_player_transfermarkt_live(
    player_id: int,
    refresh: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    """
    Fetch real-time / verified Transfermarkt intelligence for a player:
    trophies cabinet, contract status, outfitter, agent, social media, and transfer timeline.
    Uses local cache for instant sub-millisecond retrieval unless refresh=true.
    """
    stmt = text("SELECT player_id, name, first_name, last_name FROM players WHERE player_id = :player_id")
    res = db.execute(stmt, {"player_id": player_id})
    row = res.mappings().first()

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
