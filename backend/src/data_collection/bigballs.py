"""
BigBallsData REST Client & In-Memory Cache
Provides real-time and scheduled match fixtures across top European leagues with parallel concurrency.
"""

import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional
from src.config import BIGBALLSDATA_API_KEY, BIGBALLSDATA_BASE_URL

VALID_STATUSES = {"scheduled", "live", "finished", "postponed", "cancelled"}
TOP_LEAGUES = ["epl", "laliga", "seriea", "bundesliga", "ligue1", "ucl"]


class BigBallsClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or BIGBALLSDATA_API_KEY
        self.base_url = BIGBALLSDATA_BASE_URL
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 120  # 2 minutes cache

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.startswith("bbs_"))

    def get_matches(
        self,
        league: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 36,
        date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch matches for a specific league or across top leagues concurrently.
        """
        clean_status = status.lower().strip() if status else None
        if clean_status not in VALID_STATUSES:
            clean_status = None

        clean_league = league.lower().strip() if league and league.lower().strip() != "all" else None

        cache_key = f"{clean_league or 'all'}:{clean_status or 'all'}:{limit}:{date or 'all'}"
        now = time.time()
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if now - entry["time"] < self.cache_ttl:
                return entry["data"]

        headers = {
            "x-api-key": self.api_key,
            "accept": "application/json",
        }

        if not clean_league:
            all_matches = []
            per_league_limit = max(6, limit // len(TOP_LEAGUES))
            with ThreadPoolExecutor(max_workers=len(TOP_LEAGUES)) as executor:
                futures = {
                    executor.submit(
                        self._fetch_single_league, l, clean_status, per_league_limit, date, headers
                    ): l
                    for l in TOP_LEAGUES
                }
                for f in as_completed(futures):
                    try:
                        matches = f.result()
                        all_matches.extend(matches)
                    except Exception:
                        pass

            all_matches.sort(key=lambda m: m.get("kickoff_utc") or "")
            self._cache[cache_key] = {"time": now, "data": all_matches}
            return all_matches
        else:
            matches = self._fetch_single_league(clean_league, clean_status, limit, date, headers)
            self._cache[cache_key] = {"time": now, "data": matches}
            return matches

    def _fetch_single_league(
        self,
        league: str,
        status: Optional[str],
        limit: int,
        date: Optional[str],
        headers: Dict[str, str],
    ) -> List[Dict[str, Any]]:
        params: Dict[str, Any] = {
            "sport": "football",
            "league": league.lower(),
            "limit": limit,
        }
        if status:
            params["status"] = status
        if date:
            params["date"] = date

        try:
            res = requests.get(self.base_url, headers=headers, params=params, timeout=8)
            if res.status_code == 200:
                data = res.json().get("data", [])
                for m in data:
                    if not m.get("league"):
                        m["league"] = league.upper()
                return data
            else:
                return []
        except Exception:
            return []


bigballs_client = BigBallsClient()
