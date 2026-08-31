"""
API-Football / API-Sports — Live & Supplementary Data Collection Module

Uses the API-Football (api-sports.io) REST API v3 to fetch:
- Active player injuries and suspensions (/injuries)
- Live and historical top scorers (/players/topscorers)
- Live assist leaders (/players/topassists)
- Real-time in-play fixtures (/fixtures?live=all)
- Match schedules and results by date (/fixtures?date=...)
- Official verified transfer transactions (/transfers)
- Player career profiles and search (/players?search=...)
- Live standings (/standings)
- Account and rate limit status (/status)

API Docs: https://www.api-football.com/documentation-v3
"""

from typing import Any, Dict, List, Optional
import requests

from src.config import (
    API_FOOTBALL_KEY,
    API_FOOTBALL_BASE_URL,
    RAPIDAPI_KEY,
    RAPIDAPI_HOST,
)
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

# Top 5 European League IDs in API-Football
TOP_5_LEAGUE_IDS = {
    "PL": 39,      # Premier League
    "LALIGA": 140, # La Liga
    "SERIEA": 135, # Serie A
    "BUNDESLIGA": 78, # Bundesliga
    "LIGUE1": 61,  # Ligue 1
    "UCL": 2,      # Champions League
}


class APIFootballClient:
    """
    Client for the API-Football / API-Sports REST API (v3).

    Supports both direct API-Sports authentication (x-apisports-key)
    and RapidAPI authentication (x-rapidapi-key).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.api_key = api_key or API_FOOTBALL_KEY or RAPIDAPI_KEY
        self.base_url = base_url or API_FOOTBALL_BASE_URL or "https://v3.football.api-sports.io"
        
        # Determine authentication header format
        if API_FOOTBALL_KEY or (self.api_key and not RAPIDAPI_KEY):
            self.headers = {
                "x-apisports-key": self.api_key,
            }
        else:
            self.headers = {
                "x-rapidapi-key": self.api_key,
                "x-rapidapi-host": RAPIDAPI_HOST,
            }
            
        self._request_count = 0
        self._daily_limit = 100

    @property
    def is_configured(self) -> bool:
        """Check if the API key is configured."""
        return bool(self.api_key) and self.api_key not in (
            "your_api_football_key_here",
            "your_rapidapi_key_here",
        )

    def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Make an authenticated request to the API-Football endpoint.

        Args:
            endpoint: Endpoint path (e.g., '/injuries').
            params: Query parameters dict.

        Returns:
            JSON response dict, or None on failure.
        """
        if not self.is_configured:
            logger.warning("API-Football not configured. Set API_FOOTBALL_KEY in .env")
            return None

        # Clean params (drop None values)
        clean_params = {k: v for k, v in (params or {}).items() if v is not None}

        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        logger.info(f"API-Football request: {endpoint} params={clean_params}")

        try:
            response = requests.get(
                url, headers=self.headers, params=clean_params, timeout=30
            )
            response.raise_for_status()
            self._request_count += 1

            data = response.json()

            # Check for API-level errors
            if data.get("errors"):
                # Handle error dictionary or list
                errs = data["errors"]
                if errs and (isinstance(errs, list) or any(errs.values() if isinstance(errs, dict) else False)):
                    logger.warning(f"API-Football error response: {errs}")

            return data

        except requests.HTTPError as e:
            logger.error(f"API-Football HTTP error on {endpoint}: {e}")
            return None
        except requests.ConnectionError as e:
            logger.error(f"API-Football connection error: {e}")
            return None
        except requests.Timeout:
            logger.error(f"API-Football request timed out: {endpoint}")
            return None
        except Exception as e:
            logger.error(f"API-Football unexpected error: {e}")
            return None

    # ──────────────────────────────────────────
    # 1. Injuries & Squad Availability
    # ──────────────────────────────────────────

    def get_injuries(
        self,
        league: Optional[int] = 39,
        season: Optional[int] = 2024,
        team: Optional[int] = None,
        player: Optional[int] = None,
        date: Optional[str] = None,
        fixture: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch active player injuries, fitness statuses, sidelined reasons, and suspensions.

        Args:
            league: API-Football league ID (e.g., 39 for Premier League).
            season: Season year (e.g., 2024).
            team: Team ID.
            player: Player ID.
            date: Date YYYY-MM-DD.
            fixture: Fixture ID.

        Returns:
            List of injury incident records.
        """
        params: Dict[str, Any] = {
            "league": league,
            "season": season,
            "team": team,
            "player": player,
            "date": date,
            "fixture": fixture,
        }
        res = self._make_request("/injuries", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 2. Top Goalscorers
    # ──────────────────────────────────────────

    def get_top_scorers(
        self,
        league: int = 39,
        season: int = 2024,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve live top goalscorers with detailed stats, club badges, and player photos.

        Args:
            league: API-Football league ID (default 39 = Premier League).
            season: Season year (default 2024).

        Returns:
            List of player scoring records.
        """
        params = {"league": league, "season": season}
        res = self._make_request("/players/topscorers", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 3. Top Assists Leaders
    # ──────────────────────────────────────────

    def get_top_assists(
        self,
        league: int = 39,
        season: int = 2024,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve top assist leaders across leagues.

        Args:
            league: API-Football league ID.
            season: Season year.

        Returns:
            List of assist leader records.
        """
        params = {"league": league, "season": season}
        res = self._make_request("/players/topassists", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 4. Live In-Play Fixtures
    # ──────────────────────────────────────────

    def get_live_fixtures(
        self,
        league: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all real-time in-play football matches across leagues.

        Args:
            league: Optional league ID filter.

        Returns:
            List of active live match records.
        """
        params: Dict[str, Any] = {"live": "all"}
        if league:
            params["league"] = league
        res = self._make_request("/fixtures", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 5. Fixtures by Date
    # ──────────────────────────────────────────

    def get_fixtures_by_date(
        self,
        date: str,
        league: Optional[int] = None,
        season: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch match schedules and final scores for any specific date.

        Args:
            date: Date string YYYY-MM-DD.
            league: Optional league ID.
            season: Optional season year.

        Returns:
            List of match fixture records.
        """
        params: Dict[str, Any] = {"date": date}
        if league:
            params["league"] = league
        if season:
            params["season"] = season
        res = self._make_request("/fixtures", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 6. Official Verified Transfers
    # ──────────────────────────────────────────

    def get_player_transfers(
        self,
        player: Optional[int] = None,
        team: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve official verified transfer transaction records for clubs or players.

        Args:
            player: Optional API-Football player ID.
            team: Optional API-Football team ID.

        Returns:
            List of transfer records.
        """
        params: Dict[str, Any] = {}
        if player:
            params["player"] = player
        if team:
            params["team"] = team
        if not params:
            # Requires at least player or team
            logger.warning("get_player_transfers requires player or team parameter")
            return []
        res = self._make_request("/transfers", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 7. Player Profile Search
    # ──────────────────────────────────────────

    def search_player(
        self,
        search: str,
        league: Optional[int] = None,
        season: Optional[int] = 2024,
    ) -> List[Dict[str, Any]]:
        """
        Search player profiles and career metadata by name.

        Args:
            search: Player name query string (minimum 3 characters).
            league: Optional league ID.
            season: Season year (recommended).

        Returns:
            List of matching player profiles.
        """
        if len(search.strip()) < 3:
            return []
        params: Dict[str, Any] = {"search": search.strip()}
        if league:
            params["league"] = league
        if season:
            params["season"] = season
        res = self._make_request("/players", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 8. Standings
    # ──────────────────────────────────────────

    def get_standings(
        self,
        league: int = 39,
        season: int = 2024,
    ) -> List[Dict[str, Any]]:
        """
        Fetch live league tables and standings.

        Args:
            league: API-Football league ID.
            season: Season year.

        Returns:
            List of standings data tables.
        """
        params = {"league": league, "season": season}
        res = self._make_request("/standings", params)
        if not res or not res.get("response"):
            return []
        return res["response"]

    # ──────────────────────────────────────────
    # 9. API Status & Quota
    # ──────────────────────────────────────────

    def get_status(self) -> Optional[Dict[str, Any]]:
        """
        Check API account validity, subscription plan, and daily request quota remaining.

        Returns:
            Dict containing account, subscription, and request quota info.
        """
        res = self._make_request("/status")
        if not res or not res.get("response"):
            return None
        return res["response"]
