"""
Football-Data.org — Live League & Match Data Collection Module

Provides real-time access to live European football standings, matches,
teams, and top scorers via Football-Data.org API v4.

API docs: https://www.football-data.org/documentation/quickstart
Free tier: 10 requests/minute
"""

from typing import Any, Dict, List, Optional
import requests

from src.config import FOOTBALL_DATA_ORG_API_KEY, FOOTBALL_DATA_ORG_BASE_URL
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class FootballDataOrgClient:
    """
    Client for Football-Data.org REST API (v4).
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or FOOTBALL_DATA_ORG_API_KEY
        self.base_url = FOOTBALL_DATA_ORG_BASE_URL
        self.headers = {"X-Auth-Token": self.api_key}

    @property
    def is_configured(self) -> bool:
        """Check if API key is provided and valid format."""
        return bool(self.api_key) and self.api_key != "your_api_key_here"

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict]:
        """Make authenticated GET request."""
        if not self.is_configured:
            logger.warning("Football-Data.org API key not configured. Set FOOTBALL_DATA_ORG_API_KEY in .env")
            return None

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=15)
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as e:
            logger.error(f"HTTP error querying {endpoint}: {e} (Status: {response.status_code})")
            return None
        except requests.RequestException as e:
            logger.error(f"Request error querying {endpoint}: {e}")
            return None

    def get_competitions(self) -> List[Dict]:
        """Fetch list of available competitions."""
        data = self._get("competitions")
        return data.get("competitions", []) if data else []

    def get_standings(self, competition_code: str = "PL") -> Optional[Dict]:
        """
        Fetch standings for a competition (e.g. 'PL', 'PD', 'BL1', 'SA', 'FL1', 'CL').
        """
        return self._get(f"competitions/{competition_code}/standings")

    def get_matches(self, competition_code: str = "PL", matchday: Optional[int] = None) -> List[Dict]:
        """Fetch matches / fixtures for a competition."""
        params = {}
        if matchday is not None:
            params["matchday"] = matchday
        data = self._get(f"competitions/{competition_code}/matches", params=params)
        return data.get("matches", []) if data else []

    def get_top_scorers(self, competition_code: str = "PL", limit: int = 10) -> List[Dict]:
        """Fetch top goalscorers in a league."""
        data = self._get(f"competitions/{competition_code}/scorers", params={"limit": limit})
        return data.get("scorers", []) if data else []

    def get_teams(self, competition_code: str = "PL") -> List[Dict]:
        """Fetch clubs/teams in a competition."""
        data = self._get(f"competitions/{competition_code}/teams")
        return data.get("teams", []) if data else []
