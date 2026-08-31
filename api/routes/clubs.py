"""
FastAPI Router for Clubs & Stadiums
"""

import sqlite3
from fastapi import APIRouter, HTTPException

from src.config import DATABASE_PATH

router = APIRouter(prefix="/api/clubs", tags=["Clubs"])


def get_db():
    if not DATABASE_PATH.exists():
        raise HTTPException(status_code=500, detail="Database file not found.")
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn


@router.get("")
def get_clubs(limit: int = 20):
    """Get top clubs by squad valuation and largest stadiums."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT 
            club_id,
            name,
            total_market_value,
            squad_size,
            average_age,
            stadium_name,
            stadium_seats,
            coach_name
        FROM clubs
        WHERE total_market_value IS NOT NULL AND total_market_value > 0
        ORDER BY total_market_value DESC
        LIMIT ?
        """,
        (limit,),
    )
    top_squads = [dict(row) for row in cursor.fetchall()]

    cursor.execute(
        """
        SELECT 
            name AS club_name,
            stadium_name,
            stadium_seats
        FROM clubs
        WHERE stadium_seats IS NOT NULL AND stadium_seats > 35000
        ORDER BY stadium_seats DESC
        LIMIT ?
        """,
        (limit,),
    )
    stadiums = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {"top_squads": top_squads, "stadiums": stadiums}
