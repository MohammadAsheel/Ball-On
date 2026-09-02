"""
FastAPI Router for Overview & Platform Intelligence
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database import get_db

router = APIRouter(prefix="/api/overview", tags=["Overview"])


@router.get("")
def get_overview_kpis(db: Session = Depends(get_db)):
    """Get high-level summary KPIs, Transfer Intelligence highlights, and cleaned chronological season spend."""

    # Core platform metrics
    res_kpis = db.execute(
        text(
            """
            SELECT 
                (SELECT COUNT(*) FROM players) AS total_players,
                (SELECT COUNT(*) FROM transfers) AS total_transfers,
                (SELECT COUNT(*) FROM transfers WHERE transfer_fee > 0) AS paid_transfers,
                (SELECT COUNT(DISTINCT transfer_season) FROM transfers WHERE transfer_season IS NOT NULL) AS seasons_covered,
                (SELECT MAX(transfer_fee) FROM transfers) AS record_fee,
                (SELECT AVG(transfer_fee) FROM transfers WHERE transfer_fee > 0) AS avg_transfer_fee,
                (SELECT COUNT(*) FROM clubs) AS total_clubs,
                (SELECT COUNT(*) FROM competitions) AS total_competitions
            """
        )
    )
    first_kpi = res_kpis.mappings().first()
    kpis = dict(first_kpi) if first_kpi else {}

    # All-Time Top 10 Transfers
    res_top = db.execute(
        text(
            """
            SELECT 
                p.player_id,
                p.name AS player_name,
                p.position,
                t.transfer_fee,
                t.transfer_date,
                t.transfer_season,
                t.from_club_name,
                t.to_club_name,
                t.market_value_in_eur AS market_value_before
            FROM transfers t
            JOIN players p ON t.player_id = p.player_id
            WHERE t.transfer_fee IS NOT NULL AND t.transfer_fee > 0
            ORDER BY t.transfer_fee DESC
            LIMIT 10
            """
        )
    )
    top_transfers = [dict(row) for row in res_top.mappings().all()]

    # Transfer Intelligence Highlights
    # 1. Most transferred position
    res_pos = db.execute(
        text(
            """
            SELECT p.position, COUNT(*) as count, AVG(t.transfer_fee) as avg_fee
            FROM transfers t
            JOIN players p ON t.player_id = p.player_id
            WHERE t.transfer_fee > 0 AND p.position IS NOT NULL AND p.position != ''
            GROUP BY p.position
            ORDER BY count DESC
            LIMIT 1
            """
        )
    )
    top_pos_row = res_pos.mappings().first()
    most_transferred_pos = dict(top_pos_row) if top_pos_row else {"position": "Attack", "count": 0, "avg_fee": 0}

    # 2. Highest spending season
    res_season = db.execute(
        text(
            """
            SELECT transfer_season, SUM(transfer_fee) as total_spend, COUNT(*) as deal_count
            FROM transfers
            WHERE transfer_fee > 0 AND transfer_season IS NOT NULL
            GROUP BY transfer_season
            ORDER BY total_spend DESC
            LIMIT 1
            """
        )
    )
    top_season_row = res_season.mappings().first()
    highest_spend_season = dict(top_season_row) if top_season_row else {"transfer_season": "23/24", "total_spend": 0}

    # 3. Clean Chronological Spending by Season (Modern era: 2010/11 through 2024/25)
    res_spend = db.execute(
        text(
            """
            SELECT 
                transfer_season AS season,
                SUM(transfer_fee) AS total_spend,
                COUNT(*) AS transfer_count,
                AVG(transfer_fee) AS avg_fee,
                CASE 
                    WHEN CAST(SUBSTR(transfer_season, 1, 2) AS INT) >= 70 
                    THEN 1900 + CAST(SUBSTR(transfer_season, 1, 2) AS INT)
                    ELSE 2000 + CAST(SUBSTR(transfer_season, 1, 2) AS INT)
                END AS start_year
            FROM transfers
            WHERE transfer_season IS NOT NULL 
              AND transfer_fee > 0
              AND CAST(SUBSTR(transfer_season, 1, 2) AS INT) BETWEEN 10 AND 24
            GROUP BY transfer_season
            ORDER BY start_year ASC
            """
        )
    )
    season_spend = [dict(row) for row in res_spend.mappings().all()]

    # Players by Position
    res_players_pos = db.execute(
        text(
            """
            SELECT 
                position,
                COUNT(*) AS count,
                AVG(market_value_in_eur) AS avg_market_value
            FROM players
            WHERE position IS NOT NULL AND position != ''
            GROUP BY position
            ORDER BY count DESC
            """
        )
    )
    positions = [dict(row) for row in res_players_pos.mappings().all()]

    # Top Leagues by Valuation
    res_leagues = db.execute(
        text(
            """
            SELECT 
                c.competition_id,
                c.name AS competition_name,
                c.country_name,
                SUM(p.market_value_in_eur) AS total_valuation,
                COUNT(p.player_id) AS player_count
            FROM players p
            JOIN clubs cl ON p.current_club_id = cl.club_id
            JOIN competitions c ON cl.domestic_competition_id = c.competition_id
            WHERE p.market_value_in_eur IS NOT NULL
            GROUP BY c.competition_id, c.name, c.country_name
            ORDER BY total_valuation DESC
            LIMIT 8
            """
        )
    )
    top_leagues = [dict(row) for row in res_leagues.mappings().all()]

    return {
        "kpis": kpis,
        "transfer_intelligence": {
            "highest_fee": kpis.get("record_fee", 0),
            "highest_fee_player": top_transfers[0]["player_name"] if top_transfers else "Neymar",
            "average_transfer_fee": kpis.get("avg_transfer_fee", 0),
            "highest_spending_season": highest_spend_season["transfer_season"],
            "highest_season_spend": highest_spend_season["total_spend"],
            "most_transferred_position": most_transferred_pos["position"],
            "most_transferred_position_count": most_transferred_pos["count"],
        },
        "top_transfers": top_transfers,
        "season_spend": season_spend,
        "positions": positions,
        "top_leagues": top_leagues,
    }
