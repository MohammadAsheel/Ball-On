"""
SportMonks v3 — Live Scores, Fixtures & Match Details Data Collection Client

Provides real-time access to live football matches, upcoming fixtures,
finished match results, event timelines, head-to-head statistics, and lineups
via the SportMonks Football API v3.

API docs: https://docs.sportmonks.com/football/
"""

import datetime
from typing import Any, Dict, List, Optional
import requests

from src.config import SPORTMONKS_API_KEY, SPORTMONKS_BASE_URL
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class SportMonksClient:
    """
    Client for SportMonks Football API (v3).
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or SPORTMONKS_API_KEY
        self.base_url = SPORTMONKS_BASE_URL.rstrip("/")

    @property
    def is_configured(self) -> bool:
        """Check if API key is provided and valid."""
        return bool(self.api_key) and self.api_key != "your_sportmonks_api_token_here"

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict]:
        """Make authenticated GET request to SportMonks v3 API."""
        if not self.is_configured:
            logger.warning("SportMonks API key not configured. Set SPORTMONKS_API_KEY in .env")
            return None

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        query_params = {"api_token": self.api_key}
        if params:
            query_params.update(params)

        try:
            response = requests.get(url, params=query_params, timeout=15)
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as e:
            logger.error(f"SportMonks HTTP error querying {endpoint}: {e} (Status: {getattr(response, 'status_code', 'unknown')})")
            return None
        except requests.RequestException as e:
            logger.error(f"SportMonks request error querying {endpoint}: {e}")
            return None

    def get_leagues(self, per_page: int = 50) -> List[Dict]:
        """Fetch list of supported leagues/competitions."""
        data = self._get("leagues", {"per_page": per_page})
        return data.get("data", []) if data else []

    def get_livescores(self, inplay_only: bool = False) -> List[Dict]:
        """
        Fetch live scores.
        If inplay_only=True, calls /livescores/inplay.
        Otherwise calls /livescores.
        """
        endpoint = "livescores/inplay" if inplay_only else "livescores"
        params = {
            "include": "scores;participants;league;state;events.type;venue;periods",
        }
        data = self._get(endpoint, params=params)
        raw_list = data.get("data", []) if data else []
        return [self.normalize_fixture(f) for f in raw_list]

    def get_fixtures_by_date(self, date_str: str) -> List[Dict]:
        """Fetch fixtures for a specific date (YYYY-MM-DD)."""
        params = {
            "include": "scores;participants;league;state;events.type;venue;periods",
        }
        data = self._get(f"fixtures/date/{date_str}", params=params)
        raw_list = data.get("data", []) if data else []
        return [self.normalize_fixture(f) for f in raw_list]

    def get_fixtures_between(self, start_date: str, end_date: str) -> List[Dict]:
        """Fetch fixtures between two dates (inclusive)."""
        params = {
            "include": "scores;participants;league;state;events.type;venue;periods",
        }
        data = self._get(f"fixtures/between/{start_date}/{end_date}", params=params)
        raw_list = data.get("data", []) if data else []
        return [self.normalize_fixture(f) for f in raw_list]

    def get_upcoming_fixtures(self, days: int = 7, league_id: Optional[int] = None) -> List[Dict]:
        """
        Fetch upcoming fixtures for the next N days.
        Filter by state: NS (Not Started) or upcoming timestamps.
        """
        today = datetime.date.today()
        end_day = today + datetime.timedelta(days=max(1, days))
        fixtures = self.get_fixtures_between(today.strftime("%Y-%m-%d"), end_day.strftime("%Y-%m-%d"))

        # Filter to upcoming/not started matches
        upcoming = [
            f for f in fixtures
            if f.get("state_code") in ["NS", "TBA", "POSTP", "INT"] or f.get("is_finished") is False
        ]
        if league_id:
            upcoming = [f for f in upcoming if f.get("league", {}).get("id") == league_id]

        upcoming.sort(key=lambda x: x.get("starting_at") or "")
        return upcoming

    def get_finished_matches(self, days: int = 7, league_id: Optional[int] = None) -> List[Dict]:
        """
        Fetch completed matches from the past N days.
        """
        today = datetime.date.today()
        start_day = today - datetime.timedelta(days=max(1, days))
        fixtures = self.get_fixtures_between(start_day.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d"))

        finished = [
            f for f in fixtures
            if f.get("state_code") in ["FT", "AET", "FT_PEN", "AWARDED"] or f.get("is_finished") is True
        ]
        if league_id:
            finished = [f for f in finished if f.get("league", {}).get("id") == league_id]

        finished.sort(key=lambda x: x.get("starting_at") or "", reverse=True)
        return finished

    def get_fixture_details(self, fixture_id: int) -> Optional[Dict]:
        """
        Fetch comprehensive fixture details including events, statistics, lineups, venue, and referees.
        """
        params = {
            "include": (
                "scores;participants;league;state;events.type;periods;venue;"
                "statistics.type;lineups.player;lineups.type;lineups.position"
            )
        }
        data = self._get(f"fixtures/{fixture_id}", params=params)
        if not data or "data" not in data:
            return None

        raw = data["data"]
        normalized = self.normalize_fixture(raw)
        normalized["statistics"] = self.normalize_statistics(raw.get("statistics", []), raw.get("participants", []))
        normalized["lineups"] = self.normalize_lineups(raw.get("lineups", []), raw.get("participants", []))
        return normalized

    @staticmethod
    def normalize_fixture(f: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a raw SportMonks fixture dict into a clean, unified dictionary.
        """
        participants = f.get("participants", [])
        home_p = next((p for p in participants if p.get("meta", {}).get("location") == "home"), {})
        away_p = next((p for p in participants if p.get("meta", {}).get("location") == "away"), {})

        home_id = home_p.get("id")
        away_id = away_p.get("id")

        scores = f.get("scores", [])

        def get_score_val(desc: str, participant_id: Optional[int]) -> Optional[int]:
            if not participant_id:
                return None
            for s in scores:
                if s.get("description") == desc and s.get("participant_id") == participant_id:
                    return s.get("score", {}).get("goals")
            return None

        current_home = get_score_val("CURRENT", home_id)
        current_away = get_score_val("CURRENT", away_id)

        ht_home = get_score_val("1ST_HALF", home_id)
        ht_away = get_score_val("1ST_HALF", away_id)

        ft_home = get_score_val("2ND_HALF", home_id)
        ft_away = get_score_val("2ND_HALF", away_id)

        et_home = get_score_val("EXTRA_TIME", home_id)
        et_away = get_score_val("EXTRA_TIME", away_id)

        pen_home = get_score_val("PENALTIES", home_id)
        pen_away = get_score_val("PENALTIES", away_id)

        state_obj = f.get("state", {})
        state_code = state_obj.get("short_name", "") or state_obj.get("state", "NS")
        state_name = state_obj.get("name", "") or state_code

        is_live = state_code in ["LIVE", "INPLAY", "1H", "2H", "HT", "ET", "PEN_LIVE", "BREAK"]
        is_finished = state_code in ["FT", "AET", "FT_PEN", "AWARDED"]
        is_upcoming = state_code in ["NS", "TBA", "POSTP", "INT"] or (not is_live and not is_finished)

        # Match Events
        raw_events = f.get("events", [])
        events = []
        for e in raw_events:
            event_type = e.get("type", {})
            type_name = event_type.get("name") if isinstance(event_type, dict) else str(e.get("type_id", "Event"))
            events.append({
                "id": e.get("id"),
                "minute": e.get("minute"),
                "extra_minute": e.get("extra_minute"),
                "type": type_name,
                "player_name": e.get("player_name"),
                "related_player_name": e.get("related_player_name"),
                "participant_id": e.get("participant_id"),
                "is_home": e.get("participant_id") == home_id,
                "result": e.get("result"),
                "addition": e.get("addition"),
                "info": e.get("info"),
            })
        events.sort(key=lambda x: (x.get("minute") or 0, x.get("extra_minute") or 0))

        venue_obj = f.get("venue", {}) or {}
        league_obj = f.get("league", {}) or {}

        return {
            "id": f.get("id"),
            "name": f.get("name"),
            "starting_at": f.get("starting_at"),
            "starting_at_timestamp": f.get("starting_at_timestamp"),
            "result_info": f.get("result_info"),
            "length": f.get("length", 90),
            "state_code": state_code,
            "state_name": state_name,
            "is_live": is_live,
            "is_finished": is_finished,
            "is_upcoming": is_upcoming,
            "league": {
                "id": league_obj.get("id"),
                "name": league_obj.get("name", "Unknown League"),
                "short_code": league_obj.get("short_code"),
                "image_path": league_obj.get("image_path"),
                "sub_type": league_obj.get("sub_type"),
            },
            "home_team": {
                "id": home_p.get("id"),
                "name": home_p.get("name", "Home Team"),
                "short_code": home_p.get("short_code", "HOME"),
                "image_path": home_p.get("image_path"),
                "is_winner": home_p.get("meta", {}).get("winner", False),
            },
            "away_team": {
                "id": away_p.get("id"),
                "name": away_p.get("name", "Away Team"),
                "short_code": away_p.get("short_code", "AWAY"),
                "image_path": away_p.get("image_path"),
                "is_winner": away_p.get("meta", {}).get("winner", False),
            },
            "score": {
                "home": current_home,
                "away": current_away,
                "display": f"{current_home if current_home is not None else 0} - {current_away if current_away is not None else 0}" if (is_live or is_finished) else "VS",
                "ht_home": ht_home,
                "ht_away": ht_away,
                "ft_home": ft_home,
                "ft_away": ft_away,
                "et_home": et_home,
                "et_away": et_away,
                "pen_home": pen_home,
                "pen_away": pen_away,
            },
            "venue": {
                "id": venue_obj.get("id"),
                "name": venue_obj.get("name", "Stadium"),
                "city_name": venue_obj.get("city_name"),
                "capacity": venue_obj.get("capacity"),
                "image_path": venue_obj.get("image_path"),
            },
            "events": events,
        }

    @staticmethod
    def normalize_statistics(raw_stats: List[Dict], participants: List[Dict]) -> List[Dict]:
        """
        Pair up home and away statistics into unified comparison metrics.
        """
        home_p = next((p for p in participants if p.get("meta", {}).get("location") == "home"), {})
        away_p = next((p for p in participants if p.get("meta", {}).get("location") == "away"), {})
        home_id = home_p.get("id")
        away_id = away_p.get("id")

        stats_by_type: Dict[str, Dict[str, Any]] = {}
        for s in raw_stats:
            type_obj = s.get("type", {})
            type_name = type_obj.get("name") if isinstance(type_obj, dict) else str(s.get("type_id", "Stat"))
            type_code = type_obj.get("code") if isinstance(type_obj, dict) else type_name.lower().replace(" ", "-")

            if type_name not in stats_by_type:
                stats_by_type[type_name] = {
                    "name": type_name,
                    "code": type_code,
                    "home_value": 0,
                    "away_value": 0,
                }

            val = s.get("data", {}).get("value", 0)
            if s.get("participant_id") == home_id or s.get("location") == "home":
                stats_by_type[type_name]["home_value"] = val
            elif s.get("participant_id") == away_id or s.get("location") == "away":
                stats_by_type[type_name]["away_value"] = val

        return list(stats_by_type.values())

    @staticmethod
    def normalize_lineups(raw_lineups: List[Dict], participants: List[Dict]) -> Dict[str, Any]:
        """
        Organize lineups into home & away starting XI and bench.
        """
        home_p = next((p for p in participants if p.get("meta", {}).get("location") == "home"), {})
        away_p = next((p for p in participants if p.get("meta", {}).get("location") == "away"), {})
        home_id = home_p.get("id")
        away_id = away_p.get("id")

        result = {
            "home": {"starting_xi": [], "bench": []},
            "away": {"starting_xi": [], "bench": []},
        }

        for item in raw_lineups:
            player_info = item.get("player", {}) or {}
            type_info = item.get("type", {}) or {}
            type_name = type_info.get("name") if isinstance(type_info, dict) else str(item.get("type_id", ""))
            is_starting = type_name.lower() in ["lineup", "starting", "11"] or item.get("formation_position") is not None

            pos_info = item.get("position", {}) or {}
            pos_name = pos_info.get("name") if isinstance(pos_info, dict) else None

            player_data = {
                "id": item.get("player_id"),
                "name": item.get("player_name") or player_info.get("display_name") or player_info.get("name", "Player"),
                "jersey_number": item.get("jersey_number"),
                "formation_position": item.get("formation_position"),
                "position": pos_name,
                "image_path": player_info.get("image_path"),
            }

            team_key = "home" if item.get("team_id") == home_id else "away"
            if is_starting:
                result[team_key]["starting_xi"].append(player_data)
            else:
                result[team_key]["bench"].append(player_data)

        # Sort starting XIs by formation position
        result["home"]["starting_xi"].sort(key=lambda x: x.get("formation_position") or 99)
        result["away"]["starting_xi"].sort(key=lambda x: x.get("formation_position") or 99)
        return result
