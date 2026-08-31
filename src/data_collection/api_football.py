"""
API-Football — Supplementary Data Collection Module (Skeleton)

Uses the API-Football service via RapidAPI to fetch current-season
player statistics and transfer data.

This module is OPTIONAL and not required for the MVP.
The transfermarkt-datasets provide sufficient data for training.

API docs: https://www.api-football.com/documentation-v3
Free tier: 100 requests/day

Required environment variable:
    RAPIDAPI_KEY — your RapidAPI subscription key
"""

from typing import Any, Dict, List, Optional

import requests

from src.config import API_FOOTBALL_BASE_URL, RAPIDAPI_HOST, RAPIDAPI_KEY
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class APIFootballClient:
    """
    Client for the API-Football REST API (v3).

    Provides methods for fetching player statistics and transfer data.
    All methods include error handling and rate-limit awareness.

    NOTE: This is a skeleton for future implementation.
    The MVP uses transfermarkt-datasets exclusively.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or RAPIDAPI_KEY
        self.base_url = "https://v3.football.api-sports.io"
        self.headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": RAPIDAPI_HOST,
        }
        self._request_count = 0
        self._daily_limit = 100  # Free tier

    @property
    def is_configured(self) -> bool:
        """Check if the API key is set."""
        return bool(self.api_key) and self.api_key != "your_rapidapi_key_here"

    def _make_request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict]:
        """
        Make an authenticated request to the API.

        Args:
            endpoint: API endpoint path (e.g., '/players').
            params: Query parameters.

        Returns:
            JSON response dict, or None on failure.
        """
        if not self.is_configured:
            logger.warning(
                "API-Football not configured. Set RAPIDAPI_KEY in .env"
            )
            return None

        if self._request_count >= self._daily_limit:
            logger.warning(
                f"Daily request limit reached ({self._daily_limit}). "
                "Upgrade plan or wait until tomorrow."
            )
            return None

        url = f"{self.base_url}{endpoint}"
        logger.info(f"API request: {endpoint} params={params}")

        try:
            response = requests.get(
                url, headers=self.headers, params=params, timeout=30
            )
            response.raise_for_status()
            self._request_count += 1

            data = response.json()

            # Check for API-level errors
            if data.get("errors"):
                logger.error(f"API error: {data['errors']}")
                return None

            remaining = response.headers.get("x-ratelimit-requests-remaining")
            logger.info(
                f"Request {self._request_count} successful. "
                f"Remaining today: {remaining or 'unknown'}"
            )

            return data

        except requests.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            return None
        except requests.ConnectionError as e:
            logger.error(f"Connection error: {e}")
            return None
        except requests.Timeout:
            logger.error(f"Request timed out: {endpoint}")
            return None

    # ──────────────────────────────────────────
    # Player Statistics (future implementation)
    # ──────────────────────────────────────────

    def get_player_stats(
        self, player_id: int, season: int
    ) -> Optional[Dict]:
        """
        Fetch a player's season statistics.

        Args:
            player_id: API-Football player ID.
            season: Season year (e.g., 2024).

        Returns:
            Player statistics dict, or None.
        """
        # TODO: Implement when enrichment is needed
        raise NotImplementedError(
            "Player stats enrichment is planned for post-MVP. "
            "Use transfermarkt-datasets for training data."
        )

    # ──────────────────────────────────────────
    # Transfers (future implementation)
    # ──────────────────────────────────────────

    def get_player_transfers(self, player_id: int) -> Optional[List[Dict]]:
        """
        Fetch a player's transfer history.

        Args:
            player_id: API-Football player ID.

        Returns:
            List of transfer records, or None.
        """
        # TODO: Implement when enrichment is needed
        raise NotImplementedError(
            "Transfer enrichment is planned for post-MVP. "
            "Use transfermarkt-datasets for training data."
        )

    def get_status(self) -> Optional[Dict]:
        """
        Check API status and remaining quota.

        Returns:
            Status info dict, or None.
        """
        return self._make_request("/status")
