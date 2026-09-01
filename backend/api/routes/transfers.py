"""
FastAPI Router for Transfers Database Explorer
"""

import math
import sqlite3
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from src.config import DATABASE_PATH

router = APIRouter(prefix="/api/transfers", tags=["Transfers"])


def get_db():
    if not DATABASE_PATH.exists():
        raise HTTPException(status_code=500, detail="Database file not found.")
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn


@router.get("")
def get_transfers(
    min_fee: float = Query(default=1_000_000, ge=0),
    max_fee: Optional[float] = Query(default=None),
    club: Optional[str] = Query(default=None),
    position: Optional[str] = Query(default=None),
    season: Optional[str] = Query(default=None),
    sort_by: str = Query(default="fee_desc", pattern="^(fee_desc|fee_asc|date_desc|date_asc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
):
    """Query, filter, and paginate transfer deals."""
    conn = get_db()
    cursor = conn.cursor()

    where_clauses = ["t.transfer_fee >= ?"]
    params = [min_fee]

    if max_fee is not None:
        where_clauses.append("t.transfer_fee <= ?")
        params.append(max_fee)

    if club:
        where_clauses.append("(t.from_club_name LIKE ? OR t.to_club_name LIKE ?)")
        params.extend([f"%{club}%", f"%{club}%"])

    if position:
        where_clauses.append("p.position = ?")
        params.append(position)

    if season:
        where_clauses.append("t.transfer_season = ?")
        params.append(season)

    sort_map = {
        "fee_desc": "t.transfer_fee DESC",
        "fee_asc": "t.transfer_fee ASC",
        "date_desc": "t.transfer_date DESC",
        "date_asc": "t.transfer_date ASC",
    }
    order_clause = sort_map.get(sort_by, "t.transfer_fee DESC")
    where_sql = " AND ".join(where_clauses)

    # Count total matching
    cursor.execute(
        f"""
        SELECT COUNT(*) AS total
        FROM transfers t
        JOIN players p ON t.player_id = p.player_id
        WHERE {where_sql}
        """,
        tuple(params),
    )
    total_count = cursor.fetchone()["total"]

    # Fetch page
    offset = (page - 1) * page_size
    params.extend([page_size, offset])

    cursor.execute(
        f"""
        SELECT 
            p.player_id,
            p.name AS player_name,
            p.position,
            p.country_of_citizenship AS nationality,
            t.transfer_fee,
            t.market_value_in_eur AS market_value_before,
            t.transfer_date,
            t.transfer_season,
            t.from_club_name,
            t.to_club_name
        FROM transfers t
        JOIN players p ON t.player_id = p.player_id
        WHERE {where_sql}
        ORDER BY {order_clause}
        LIMIT ? OFFSET ?
        """,
        tuple(params),
    )
    transfers = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_count / page_size) if total_count > 0 else 1,
        "transfers": transfers,
    }


@router.get("/top")
def get_top_transfers(limit: int = 10, min_fee: float = 1_000_000):
    """Get all-time top transfers."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 
            p.player_id,
            p.name AS player_name,
            p.position,
            t.transfer_fee,
            t.transfer_date,
            t.from_club_name,
            t.to_club_name,
            t.market_value_in_eur AS market_value_before
        FROM transfers t
        JOIN players p ON t.player_id = p.player_id
        WHERE t.transfer_fee >= ?
        ORDER BY t.transfer_fee DESC
        LIMIT ?
        """,
        (min_fee, limit),
    )
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"count": len(rows), "transfers": rows}
