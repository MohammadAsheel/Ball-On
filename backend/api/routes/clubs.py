"""
FastAPI Router for Clubs & Stadiums
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database import get_db

router = APIRouter(prefix="/api/clubs", tags=["Clubs"])


@router.get("")
def get_clubs(limit: int = 20, db: Session = Depends(get_db)):
    """Get top clubs by squad valuation and largest stadiums."""
    squad_stmt = text(
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
        LIMIT :limit
        """
    )
    squad_res = db.execute(squad_stmt, {"limit": limit})
    top_squads = [dict(row) for row in squad_res.mappings().all()]

    stadium_stmt = text(
        """
        SELECT 
            name AS club_name,
            stadium_name,
            stadium_seats
        FROM clubs
        WHERE stadium_seats IS NOT NULL AND stadium_seats > 35000
        ORDER BY stadium_seats DESC
        LIMIT :limit
        """
    )
    stadium_res = db.execute(stadium_stmt, {"limit": limit})
    stadiums = [dict(row) for row in stadium_res.mappings().all()]

    return {"top_squads": top_squads, "stadiums": stadiums}
