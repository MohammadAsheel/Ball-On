"""
FastAPI Router for Transfers Database Explorer
"""

import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from src.database import get_db

router = APIRouter(prefix="/api/transfers", tags=["Transfers"])


def _get_dialect(db: Session) -> str:
    return db.bind.dialect.name if db.bind else "postgresql"


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
    db: Session = Depends(get_db),
):
    """Query, filter, and paginate transfer deals."""
    dialect = _get_dialect(db)
    like_op = "ILIKE" if dialect == "postgresql" else "LIKE"

    where_clauses = ["t.transfer_fee >= :min_fee"]
    params = {"min_fee": min_fee}

    if max_fee is not None:
        where_clauses.append("t.transfer_fee <= :max_fee")
        params["max_fee"] = max_fee

    if club:
        where_clauses.append(f"(t.from_club_name {like_op} :club OR t.to_club_name {like_op} :club)")
        params["club"] = f"%{club}%"

    if position:
        where_clauses.append("p.position = :position")
        params["position"] = position

    if season:
        where_clauses.append("t.transfer_season = :season")
        params["season"] = season

    sort_map = {
        "fee_desc": "t.transfer_fee DESC",
        "fee_asc": "t.transfer_fee ASC",
        "date_desc": "t.transfer_date DESC",
        "date_asc": "t.transfer_date ASC",
    }
    order_clause = sort_map.get(sort_by, "t.transfer_fee DESC")
    where_sql = " AND ".join(where_clauses)

    # Count total matching
    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM transfers t
        JOIN players p ON t.player_id = p.player_id
        WHERE {where_sql}
    """
    total_res = db.execute(text(count_sql), params)
    total_count = total_res.scalar() or 0

    # Fetch page
    offset = (page - 1) * page_size
    query_params = dict(params)
    query_params["limit"] = page_size
    query_params["offset"] = offset

    fetch_sql = f"""
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
        LIMIT :limit OFFSET :offset
    """
    res = db.execute(text(fetch_sql), query_params)
    transfers = [dict(row) for row in res.mappings().all()]

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_count / page_size) if total_count > 0 else 1,
        "transfers": transfers,
    }


@router.get("/top")
def get_top_transfers(
    limit: int = 10,
    min_fee: float = 1_000_000,
    db: Session = Depends(get_db),
):
    """Get all-time top transfers."""
    fetch_sql = """
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
        WHERE t.transfer_fee >= :min_fee
        ORDER BY t.transfer_fee DESC
        LIMIT :limit
    """
    res = db.execute(text(fetch_sql), {"min_fee": min_fee, "limit": limit})
    rows = [dict(row) for row in res.mappings().all()]
    return {"count": len(rows), "transfers": rows}
