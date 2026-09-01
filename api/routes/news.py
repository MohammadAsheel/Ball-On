"""
FastAPI Router for Real-Time Football News (Free & Open RSS Aggregator)
"""

from typing import Optional
from fastapi import APIRouter, Query
from src.data_collection.news import news_aggregator

router = APIRouter(prefix="/api/news", tags=["News"])


@router.get("")
def get_football_news(
    category: Optional[str] = Query(None, description="Filter category: transfers, injuries, matches, general, or all"),
    query: Optional[str] = Query(None, description="Search keyword in title/summary"),
    source: Optional[str] = Query(None, description="Filter by source outlet (e.g. 'BBC Sport', 'Sky Sports')"),
    limit: int = Query(50, ge=1, le=200, description="Max number of articles to return"),
    refresh: bool = Query(False, description="Bypass 10-minute in-memory cache and fetch fresh"),
):
    """
    Fetch live aggregated football news from BBC Sport, Sky Sports, The Guardian, and ESPN FC.
    Auto-categorized into Transfers, Injuries, Match Reports, and General News.
    """
    return news_aggregator.get_news(
        category=category,
        query=query,
        source=source,
        limit=limit,
        refresh=refresh,
    )


@router.get("/transfers")
def get_transfer_news(
    query: Optional[str] = Query(None, description="Filter transfer rumors/deals by player or club name"),
    limit: int = Query(30, ge=1, le=100, description="Max number of transfer articles"),
    refresh: bool = Query(False, description="Bypass cache and fetch fresh"),
):
    """
    Fetch breaking football transfer rumors, confirmed signings, contract extensions, and bids.
    """
    return news_aggregator.get_news(
        category="transfers",
        query=query,
        limit=limit,
        refresh=refresh,
    )


@router.get("/injuries")
def get_injury_news(
    query: Optional[str] = Query(None, description="Search injuries by player or club name"),
    limit: int = Query(30, ge=1, le=100, description="Max number of injury news articles"),
    refresh: bool = Query(False, description="Bypass cache and fetch fresh"),
):
    """
    Fetch latest football player medical updates, surgery reports, and recovery scans.
    """
    return news_aggregator.get_news(
        category="injuries",
        query=query,
        limit=limit,
        refresh=refresh,
    )
