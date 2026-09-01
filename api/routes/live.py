"""
FastAPI Router for Live European Football API Data (API-Football, SportMonks v3 & Football-Data.org)
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from src.data_collection.sportmonks import SportMonksClient
from src.data_collection.football_data_org import FootballDataOrgClient
from src.data_collection.api_football import APIFootballClient
from src.data_collection.bigballs import bigballs_client

router = APIRouter(prefix="/api/live", tags=["Live Data"])

sportmonks_client = SportMonksClient()
fd_client = FootballDataOrgClient()
api_football_client = APIFootballClient()


@router.get("/status")
def get_live_api_status():
    """Check configuration status of all connected football data providers and account quotas."""
    apifootball_status = None
    if api_football_client.is_configured:
        try:
            apifootball_status = api_football_client.get_status()
        except Exception:
            apifootball_status = None

    return {
        "sportmonks_configured": sportmonks_client.is_configured,
        "football_data_org_configured": fd_client.is_configured,
        "api_football_configured": api_football_client.is_configured,
        "bigballs_configured": bigballs_client.is_configured,
        "api_football_status": apifootball_status,
    }


@router.get("/bigballs/matches")
def get_bigballs_matches(
    league: Optional[str] = Query(None, description="League code (epl, laliga, seriea, bundesliga, ligue1, ucl)"),
    status: Optional[str] = Query(None, description="Match status (scheduled, live, finished, postponed, cancelled)"),
    limit: int = Query(36, ge=1, le=100, description="Number of matches to return"),
    date: Optional[str] = Query(None, description="Match date filter (YYYY-MM-DD)"),
):
    """
    Fetch live and scheduled match fixtures via BigBallsData SDK / REST API.
    """
    matches = bigballs_client.get_matches(
        league=league,
        status=status,
        limit=limit,
        date=date,
    )
    return {
        "count": len(matches),
        "filter": {"league": league or "all", "status": status or "all", "limit": limit, "date": date},
        "data": matches,
    }


# ──────────────────────────────────────────────
# 1. API-Football / API-Sports REST Endpoints
# ──────────────────────────────────────────────

@router.get("/injuries")
def get_live_injuries(
    league: int = Query(39, description="API-Football league ID (39=PL, 140=LaLiga, 135=SerieA, 78=Bundesliga, 61=Ligue1, 2=UCL)"),
    season: int = Query(2024, description="Season year (e.g. 2024)"),
    team: Optional[int] = Query(None, description="API-Football team ID filter"),
    player: Optional[int] = Query(None, description="API-Football player ID filter"),
    date: Optional[str] = Query(None, description="Date filter YYYY-MM-DD"),
    limit: int = Query(50, ge=1, le=200, description="Max injury items to return"),
):
    """
    Fetch active player injuries, fitness statuses, sidelined reasons, and suspensions.
    """
    if not api_football_client.is_configured:
        raise HTTPException(status_code=503, detail="API-Football key not configured in .env")

    injuries = api_football_client.get_injuries(
        league=league, season=season, team=team, player=player, date=date
    )
    return {
        "count": len(injuries[:limit]),
        "total_available": len(injuries),
        "league_id": league,
        "season": season,
        "injuries": injuries[:limit],
    }


@router.get("/topscorers")
def get_api_football_topscorers(
    league: int = Query(39, description="API-Football league ID (39=PL, 140=LaLiga, 135=SerieA, 78=Bundesliga, 61=Ligue1, 2=UCL)"),
    season: int = Query(2024, description="Season year"),
    limit: int = Query(20, ge=1, le=50, description="Number of top scorers"),
):
    """
    Retrieve live top goalscorers with detailed stats, club badges, and player photos.
    """
    if not api_football_client.is_configured:
        raise HTTPException(status_code=503, detail="API-Football key not configured in .env")

    scorers = api_football_client.get_top_scorers(league=league, season=season)
    return {
        "league_id": league,
        "season": season,
        "count": len(scorers[:limit]),
        "scorers": scorers[:limit],
    }


@router.get("/topassists")
def get_api_football_topassists(
    league: int = Query(39, description="API-Football league ID (39=PL, 140=LaLiga, 135=SerieA, 78=Bundesliga, 61=Ligue1, 2=UCL)"),
    season: int = Query(2024, description="Season year"),
    limit: int = Query(20, ge=1, le=50, description="Number of top assist leaders"),
):
    """
    Retrieve top assist rankings for any selected league.
    """
    if not api_football_client.is_configured:
        raise HTTPException(status_code=503, detail="API-Football key not configured in .env")

    assists = api_football_client.get_top_assists(league=league, season=season)
    return {
        "league_id": league,
        "season": season,
        "count": len(assists[:limit]),
        "assists": assists[:limit],
    }


@router.get("/apifootball/fixtures")
def get_apifootball_fixtures(
    live: bool = Query(False, description="Fetch live in-play matches"),
    date: Optional[str] = Query(None, description="Date YYYY-MM-DD"),
    league: Optional[int] = Query(None, description="League ID"),
    season: Optional[int] = Query(2024, description="Season year"),
):
    """
    Returns live or scheduled match fixtures via API-Football.
    """
    if not api_football_client.is_configured:
        raise HTTPException(status_code=503, detail="API-Football key not configured in .env")

    if live:
        matches = api_football_client.get_live_fixtures(league=league)
    elif date:
        matches = api_football_client.get_fixtures_by_date(date=date, league=league, season=season)
    else:
        matches = api_football_client.get_live_fixtures(league=league)

    return {
        "count": len(matches),
        "matches": matches,
    }


@router.get("/apifootball/search")
def search_apifootball_players(
    query: str = Query(..., min_length=3, description="Player name to search"),
    league: Optional[int] = Query(None, description="Optional league ID"),
    season: Optional[int] = Query(2024, description="Season year"),
):
    """Search player career profiles and stats on API-Football."""
    if not api_football_client.is_configured:
        raise HTTPException(status_code=503, detail="API-Football key not configured in .env")

    players = api_football_client.search_player(search=query, league=league, season=season)
    return {"query": query, "count": len(players), "players": players}


@router.get("/apifootball/transfers")
def get_apifootball_transfers(
    player_id: Optional[int] = Query(None, description="Player ID"),
    team_id: Optional[int] = Query(None, description="Team ID"),
):
    """Retrieve official verified transfer transactions for a player or team."""
    if not api_football_client.is_configured:
        raise HTTPException(status_code=503, detail="API-Football key not configured in .env")
    if not player_id and not team_id:
        raise HTTPException(status_code=400, detail="Must provide either player_id or team_id")

    transfers = api_football_client.get_player_transfers(player=player_id, team=team_id)
    return {"count": len(transfers), "transfers": transfers}


# ──────────────────────────────────────────────
# 2. SportMonks v3 Endpoints (Live Scores, Fixtures & Match Details)
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
# 3. Football-Data.org Compatibility Endpoints
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
