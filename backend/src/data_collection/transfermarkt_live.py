"""
Transfermarkt Live API Client (Apify Scraper Integration)

Fetches verified, real-time player profiles, trophy cabinet, contract details,
outfitter sponsorships, agent representation, social media, and transfer history
from Transfermarkt using Apify.
"""

import json
import time
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from src.config import (
    TRANSFERMARKT_API_KEY,
    TRANSFERMARKT_ACTOR_ID,
    TRANSFERMARKT_CACHE_DIR,
)
from src.utils.logging_config import get_logger

logger = get_logger(__name__)


class TransfermarktLiveClient:
    """
    Client for live Transfermarkt player intelligence via Apify.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or TRANSFERMARKT_API_KEY
        self.actor_id = TRANSFERMARKT_ACTOR_ID
        self.cache_dir = TRANSFERMARKT_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    @property
    def is_configured(self) -> bool:
        """Check if Apify/Transfermarkt API key is configured."""
        return bool(self.api_key) and self.api_key.startswith("apify_api_")

    def _get_cache_path(self, query: str) -> Path:
        """Generate safe filename for caching player profile."""
        clean_name = re.sub(r"[^\w\s-]", "", query).strip().lower().replace(" ", "_")
        return self.cache_dir / f"player_{clean_name}.json"

    def get_cached_player(self, query: str) -> Optional[Dict[str, Any]]:
        """Retrieve player data from disk cache if exists."""
        cache_path = self._get_cache_path(query)
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                logger.info(f"Loaded Transfermarkt data from cache for '{query}'")
                return data
            except Exception as e:
                logger.warning(f"Failed to read cache for '{query}': {e}")
        return None

    def save_to_cache(self, query: str, data: Dict[str, Any]) -> None:
        """Save normalized player data to disk cache."""
        cache_path = self._get_cache_path(query)
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved Transfermarkt data to cache for '{query}'")
        except Exception as e:
            logger.error(f"Failed to write cache for '{query}': {e}")

    def scrape_player_profile(self, player_name_or_url: str, timeout_secs: int = 45) -> Optional[Dict[str, Any]]:
        """
        Trigger the Apify Transfermarkt Scraper actor and fetch real-time player data.
        """
        if not self.is_configured:
            logger.warning("Transfermarkt API key not configured in .env")
            return None

        url = f"https://api.apify.com/v2/acts/{self.actor_id}/runs?token={self.api_key}"
        payload = {
            "items": [player_name_or_url],
            "scrapeType": "players",
            "playerMarketValueHistory": False,
            "playerAgentDetails": True,
            "playersWithoutStatistics": False,
            "playerStatsSelection": ["last_6"],
            "proxyConfig": {
                "useApifyProxy": True
            }
        }

        try:
            logger.info(f"Starting Apify scraper run for '{player_name_or_url}'...")
            res = requests.post(url, json=payload, timeout=15)
            res.raise_for_status()

            run_data = res.json().get("data", {})
            run_id = run_data.get("id")
            dataset_id = run_data.get("defaultDatasetId")

            if not run_id or not dataset_id:
                logger.error(f"Apify did not return run_id or dataset_id for '{player_name_or_url}'")
                return None

            # Poll for completion
            t0 = time.time()
            status = "RUNNING"
            while time.time() - t0 < timeout_secs:
                time.sleep(2.5)
                stat_res = requests.get(
                    f"https://api.apify.com/v2/actor-runs/{run_id}?token={self.api_key}",
                    timeout=10,
                )
                if stat_res.status_code == 200:
                    status = stat_res.json().get("data", {}).get("status")
                    if status in ["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"]:
                        break

            if status != "SUCCEEDED":
                logger.warning(f"Apify actor run ended with status '{status}' for '{player_name_or_url}'")
                return None

            # Fetch dataset
            ds_res = requests.get(
                f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={self.api_key}",
                timeout=15,
            )
            ds_res.raise_for_status()
            items = ds_res.json()

            if not items:
                logger.warning(f"No items returned by scraper for '{player_name_or_url}'")
                return None

            raw_item = items[0]
            normalized = self.normalize_player_data(raw_item)
            self.save_to_cache(player_name_or_url, normalized)
            # Also save under normalized player name if different
            if normalized.get("player_name") and normalized["player_name"].lower() != player_name_or_url.lower():
                self.save_to_cache(normalized["player_name"], normalized)

            return normalized

        except Exception as e:
            logger.error(f"Error scraping Transfermarkt for '{player_name_or_url}': {e}")
            return None

    def get_player_info(self, player_name: str, force_refresh: bool = False) -> Optional[Dict[str, Any]]:
        """
        Get player info, checking cache first unless force_refresh is True.
        """
        if not force_refresh:
            cached = self.get_cached_player(player_name)
            if cached:
                return cached

        # Scrape live from Transfermarkt
        return self.scrape_player_profile(player_name)

    @staticmethod
    def normalize_player_data(raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw scraped Transfermarkt dictionary into a clean schema.
        """
        details = raw.get("playerDetails", {}) or {}
        trophies_raw = raw.get("trophies", []) or []
        transfer_raw = raw.get("transferHistory", []) or []
        stats_raw = raw.get("playerStats", []) or []

        # Trophies
        trophies = []
        for t in trophies_raw:
            t_name = t.get("trophy") or t.get("name") or "Honor"
            t_count = int(t.get("count", 1)) if str(t.get("count", 1)).isdigit() else 1
            trophies.append({
                "trophy": t_name,
                "count": t_count,
            })

        # Social Media
        social_media = []
        raw_social = details.get("Social-Media", []) or []
        if isinstance(raw_social, list):
            for s in raw_social:
                if isinstance(s, dict) and s.get("url"):
                    social_media.append({
                        "type": s.get("type") or "Website",
                        "url": s.get("url"),
                    })

        # Transfers
        transfers = []
        for tr in transfer_raw:
            transfers.append({
                "season": tr.get("season"),
                "date": tr.get("date"),
                "left": tr.get("left"),
                "joined": tr.get("joined"),
                "market_value": tr.get("market_value"),
                "fee": tr.get("fee"),
            })

        # Stats summary
        season_stats = []
        for s in stats_raw:
            s_name = s.get("season")
            comps = s.get("stats", []) or []
            comp_list = []
            for c in comps:
                comp_list.append({
                    "competition": c.get("competition"),
                    "appearances": int(c.get("appearances", 0)) if str(c.get("appearances", 0)).isdigit() else 0,
                    "goals": int(c.get("goals", 0)) if str(c.get("goals", 0)).isdigit() else 0,
                    "assists": int(c.get("assists", 0)) if str(c.get("assists", 0)).isdigit() else 0,
                    "minutes_played": int(c.get("minutes_played", 0)) if str(c.get("minutes_played", 0)).isdigit() else 0,
                    "yellow_cards": int(c.get("yellow_cards", 0)) if str(c.get("yellow_cards", 0)).isdigit() else 0,
                    "red_cards": int(c.get("red_cards", 0)) if str(c.get("red_cards", 0)).isdigit() else 0,
                    "penalty_goals": int(c.get("penalty_goals", 0)) if str(c.get("penalty_goals", 0)).isdigit() else 0,
                })
            season_stats.append({
                "season": s_name,
                "competitions": comp_list,
            })

        return {
            "player_id": raw.get("playerId"),
            "player_name": raw.get("playerName"),
            "profile_url": raw.get("profileUrl"),
            "jersey_number": raw.get("jerseyNumber"),
            "current_club": raw.get("currentClub"),
            "league": raw.get("playerLeague"),
            "arrival_date": raw.get("arrivalDate") or details.get("Joined"),
            "contract_end": raw.get("contractEnd") or details.get("Contract expires"),
            "market_value": raw.get("marketValue"),
            "full_name": details.get("Name in home country") or raw.get("playerName"),
            "age": details.get("Age"),
            "place_of_birth": details.get("Place of birth"),
            "citizenship": details.get("Citizenship"),
            "height": details.get("Height"),
            "position": details.get("Position"),
            "foot": details.get("Foot"),
            "agent": details.get("Player agent"),
            "outfitter": details.get("Outfitter"),
            "last_contract_extension": details.get("Last contract extension"),
            "social_media": social_media,
            "trophies": trophies,
            "transfer_history": transfers,
            "season_stats": season_stats,
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
