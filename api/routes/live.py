"""
FastAPI Router for Live European Football API Data (SportMonks v3 & Football-Data.org)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from src.data_collection.sportmonks import SportMonksClient
from src.data_collection.football_data_org import FootballDataOrgClient
from src.data_collection.api_football import APIFootballClient

router = APIRouter(prefix="/api/live", tags=["Live Data"])

sportmonks_client = SportMonksClient()
fd_client = FootballDataOrgClient()
api_football_client = APIFootballClient()


@router.get("/status")
def get_live_api_status():
    """Check configuration status of football data providers."""
    return {
        "sportmonks_configured": sportmonks_client.is_configured,
        "football_data_org_configured": fd_client.is_configured,
        "rapidapi_configured": api_football_client.is_configured,
    }


# ──────────────────────────────────────────────
# SportMonks v3 Endpoints (Live Scores, Fixtures & Match Details)
# ──────────────────────────────────────────────

@router.get("/livescores")
def get_livescores(inplay_only: bool = False):
    """
    Fetch active live scores from SportMonks v3.
    Returns in-play and today's live matches with real-time score updates.
    """
    if not sportmonks_client.is_configured:
        raise HTTPException(status_code=503, detail="SportMonks API token not configured in .env")
    
    matches = sportmonks_client.get_livescores(inplay_only=inplay_only)
    return {
        "count": len(matches),
        "inplay_only": inplay_only,
        "matches": matches,
    }


@router.get("/fixtures")
def get_fixtures(
    days: int = Query(7, ge=1, le=30, description="Number of future days to fetch"),
    date: Optional[str] = Query(None, description="Specific date YYYY-MM-DD"),
    league_id: Optional[int] = Query(None, description="Filter by SportMonks league ID"),
):
    """
    Fetch upcoming match fixtures from SportMonks v3.
    """
    if not sportmonks_client.is_configured:
        raise HTTPException(status_code=503, detail="SportMonks API token not configured in .env")

    if date:
        matches = sportmonks_client.get_fixtures_by_date(date)
        if league_id:
            matches = [m for m in matches if m.get("league", {}).get("id") == league_id]
    else:
        matches = sportmonks_client.get_upcoming_fixtures(days=days, league_id=league_id)

    return {
        "count": len(matches),
        "filter": {"days": days, "date": date, "league_id": league_id},
        "matches": matches,
    }


@router.get("/finished")
def get_finished_matches(
    days: int = Query(7, ge=1, le=30, description="Number of past days to fetch"),
    date: Optional[str] = Query(None, description="Specific date YYYY-MM-DD"),
    league_id: Optional[int] = Query(None, description="Filter by SportMonks league ID"),
):
    """
    Fetch finished matches and final scores from SportMonks v3.
    """
    if not sportmonks_client.is_configured:
        raise HTTPException(status_code=503, detail="SportMonks API token not configured in .env")

    if date:
        matches = sportmonks_client.get_fixtures_by_date(date)
        matches = [m for m in matches if m.get("is_finished") is True]
        if league_id:
            matches = [m for m in matches if m.get("league", {}).get("id") == league_id]
    else:
        matches = sportmonks_client.get_finished_matches(days=days, league_id=league_id)

    return {
        "count": len(matches),
        "filter": {"days": days, "date": date, "league_id": league_id},
        "matches": matches,
    }


@router.get("/match/{fixture_id}")
def get_match_details(fixture_id: int):
    """
    Fetch detailed breakdown of a match from SportMonks v3:
    - Events timeline (goals, penalties, cards, substitutions)
    - Head-to-head match statistics comparison (possession, shots, corners, etc.)
    - Lineups (starting XI and bench for home and away teams)
    - Stadium venue and referee info
    """
    if not sportmonks_client.is_configured:
        raise HTTPException(status_code=503, detail="SportMonks API token not configured in .env")

    details = sportmonks_client.get_fixture_details(fixture_id)
    if not details:
        raise HTTPException(status_code=404, detail=f"Match fixture #{fixture_id} not found on SportMonks")

    return details


@router.get("/leagues")
def get_supported_leagues():
    """Fetch available football leagues on SportMonks."""
    if not sportmonks_client.is_configured:
        raise HTTPException(status_code=503, detail="SportMonks API token not configured in .env")

    leagues = sportmonks_client.get_leagues(per_page=50)
    return {"count": len(leagues), "leagues": leagues}


# ──────────────────────────────────────────────
# Football-Data.org Compatibility Endpoints
# ──────────────────────────────────────────────

@router.get("/standings/{competition_code}")
def get_live_standings(competition_code: str = "PL"):
    """Fetch live league standings via Football-Data.org."""
    if not fd_client.is_configured:
        raise HTTPException(status_code=503, detail="Football-Data.org API key not configured")
    data = fd_client.get_standings(competition_code)
    if not data or "standings" not in data:
        raise HTTPException(status_code=404, detail=f"No standings found for competition '{competition_code}'")

    standings_table = data["standings"][0].get("table", []) if data.get("standings") else []
    competition_info = data.get("competition", {})
    season_info = data.get("season", {})

    return {
        "competition": competition_info,
        "season": season_info,
        "table": standings_table,
    }


@router.get("/scorers/{competition_code}")
def get_live_top_scorers(competition_code: str = "PL", limit: int = 15):
    """Fetch live top scorers via Football-Data.org."""
    if not fd_client.is_configured:
        raise HTTPException(status_code=503, detail="Football-Data.org API key not configured")
    scorers = fd_client.get_top_scorers(competition_code, limit=limit)
    return {"competition": competition_code, "scorers": scorers}


@router.get("/matches/{competition_code}")
def get_live_matches(competition_code: str = "PL"):
    """Fetch recent/upcoming match fixtures via Football-Data.org."""
    if not fd_client.is_configured:
        raise HTTPException(status_code=503, detail="Football-Data.org API key not configured")
    matches = fd_client.get_matches(competition_code)
    return {"competition": competition_code, "count": len(matches), "matches": matches[-20:]}
