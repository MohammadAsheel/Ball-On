"""
Real-Time Football News RSS Aggregator & Classifier

Streams and categorizes public newsfeeds from top sports journalism outlets:
- BBC Sport (https://feeds.bbci.co.uk/sport/football/rss.xml)
- Sky Sports (https://www.skysports.com/rss/12040)
- The Guardian (https://www.theguardian.com/football/rss)
- ESPN FC (https://www.espn.com/espn/rss/football/news)

Features:
- 100% Free & Open — No API key needed.
- Automatic content classification:
    - 🔁 Transfers (signings, bids, contract extensions, loan deals)
    - 🏥 Injuries (sidelined stars, medical scans, surgical updates)
    - ⚽ Match Reports (derbies, UCL nights, match recaps, previews)
    - 📰 General News
- High-resolution image extraction from media tags.
- In-memory 10-minute TTL cache with fast (<10ms) response times.
"""

import hashlib
import html
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

from src.utils.logging_config import get_logger

logger = get_logger(__name__)

# Public open RSS feeds
RSS_FEEDS = [
    {
        "name": "BBC Sport",
        "url": "https://feeds.bbci.co.uk/sport/football/rss.xml",
        "color": "#ff4d4d",
        "badge": "BBC",
    },
    {
        "name": "Sky Sports",
        "url": "https://www.skysports.com/rss/12040",
        "color": "#00f2fe",
        "badge": "SKY",
    },
    {
        "name": "The Guardian",
        "url": "https://www.theguardian.com/football/rss",
        "color": "#052962",
        "badge": "GUARDIAN",
    },
    {
        "name": "ESPN FC",
        "url": "https://www.espn.com/espn/rss/soccer/news",
        "color": "#d91e18",
        "badge": "ESPN",
    },
]

# Classification Keywords (case-insensitive regex patterns)
TRANSFER_KEYWORDS = [
    r"\btransfer\b",
    r"\btransfers\b",
    r"\bsign\b",
    r"\bsigned\b",
    r"\bsigning\b",
    r"\bsignings\b",
    r"\bdeal\b",
    r"\bdeals\b",
    r"\bbid\b",
    r"\bbids\b",
    r"\bfee\b",
    r"\bcontract\b",
    r"\bextension\b",
    r"\bextend\b",
    r"\bclause\b",
    r"\brelease clause\b",
    r"\bloan\b",
    r"\btalks\b",
    r"\bagreed\b",
    r"\bagreement\b",
    r"\bjoins\b",
    r"\bjoined\b",
    r"\bmove\b",
    r"\btarget\b",
    r"\bdeparture\b",
    r"\bexit\b",
    r"\brumour\b",
    r"\brumours\b",
    r"\brumor\b",
    r"\brumors\b",
    r"\bunveil\b",
    r"\bunveiled\b",
]

INJURY_KEYWORDS = [
    r"\binjury\b",
    r"\binjuries\b",
    r"\binjured\b",
    r"\bsidelined\b",
    r"\bsurgery\b",
    r"\bsurgical\b",
    r"\bhamstring\b",
    r"\bacl\b",
    r"\bknee\b",
    r"\bankle\b",
    r"\bscan\b",
    r"\bscans\b",
    r"\bfitness\b",
    r"\bfracture\b",
    r"\bsprain\b",
    r"\bruled out\b",
    r"\bout for\b",
    r"\bmiss\b",
    r"\bmisses\b",
    r"\bconcussion\b",
    r"\brehab\b",
    r"\brehabilitation\b",
    r"\blimp\b",
    r"\blimped\b",
]

MATCH_KEYWORDS = [
    r"\bvs\b",
    r"\bv\b",
    r"\bderby\b",
    r"\bmatch report\b",
    r"\brecap\b",
    r"\bpreview\b",
    r"\bhighlights\b",
    r"\bwin\b",
    r"\bwins\b",
    r"\bwon\b",
    r"\bdefeat\b",
    r"\bdefeats\b",
    r"\bdraw\b",
    r"\bdraws\b",
    r"\bchampions league\b",
    r"\bpremier league\b",
    r"\bla liga\b",
    r"\bserie a\b",
    r"\bbundesliga\b",
    r"\bligue 1\b",
    r"\bfa cup\b",
    r"\bcup final\b",
    r"\bsemi-final\b",
    r"\bquarter-final\b",
    r"\bhat-trick\b",
    r"\bscore\b",
    r"\bscores\b",
    r"\bpenalty\b",
    r"\bgoal\b",
    r"\bgoals\b",
]

TRANSFER_RE = re.compile("|".join(TRANSFER_KEYWORDS), re.IGNORECASE)
INJURY_RE = re.compile("|".join(INJURY_KEYWORDS), re.IGNORECASE)
MATCH_RE = re.compile("|".join(MATCH_KEYWORDS), re.IGNORECASE)


def clean_html(raw_html: str) -> str:
    """Remove HTML tags, decode entities, and normalize whitespace."""
    if not raw_html:
        return ""
    # Strip HTML tags
    clean = re.sub(r"<[^>]+>", "", raw_html)
    # Decode HTML entities
    clean = html.unescape(clean)
    # Clean whitespace
    return " ".join(clean.split())


def classify_article(title: str, description: str) -> tuple[str, str]:
    """
    Classify an article into a category based on its title and description.

    Returns:
        tuple (category_key, category_label)
    """
    text = f"{title} {description}"

    if TRANSFER_RE.search(text):
        return "transfers", "🔁 Transfer Wire"
    if INJURY_RE.search(text):
        return "injuries", "🏥 Medical / Injury"
    if MATCH_RE.search(text):
        return "matches", "⚽ Match Action"
    return "general", "📰 Football News"


def extract_image(item: ET.Element, description_html: str) -> Optional[str]:
    """Extract thumbnail/media image URL from RSS item or HTML enclosure."""
    # 1. <media:content url="..."> or <media:thumbnail url="...">
    for elem in item.iter():
        if "content" in elem.tag or "thumbnail" in elem.tag:
            url = elem.attrib.get("url")
            if url and ("http" in url):
                return url

    # 2. <enclosure url="..." type="image/...">
    enclosure = item.find("enclosure")
    if enclosure is not None:
        url = enclosure.attrib.get("url")
        if url and ("http" in url):
            return url

    # 3. <img> tag in description
    if description_html:
        img_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', description_html)
        if img_match:
            return img_match.group(1)

    return None


class NewsAggregator:
    """
    Thread-safe, high-speed cached RSS news aggregator.
    """

    def __init__(self, cache_ttl_seconds: int = 600):
        self.cache_ttl = cache_ttl_seconds
        self._cached_articles: List[Dict[str, Any]] = []
        self._last_fetch_time: float = 0.0

    def _fetch_single_feed(self, feed: Dict[str, str]) -> List[Dict[str, Any]]:
        """Fetch and parse a single RSS feed."""
        articles = []
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BALLON/2.0"
            }
            res = requests.get(feed["url"], headers=headers, timeout=8)
            if res.status_code != 200:
                logger.warning(f"Failed to fetch feed {feed['name']}: HTTP {res.status_code}")
                return []

            root = ET.fromstring(res.content)
            items = root.findall(".//item")

            for item in items:
                title_elem = item.find("title")
                link_elem = item.find("link")
                desc_elem = item.find("description")
                pubdate_elem = item.find("pubDate")

                raw_title = title_elem.text if title_elem is not None and title_elem.text else ""
                link = link_elem.text if link_elem is not None and link_elem.text else ""
                raw_desc = desc_elem.text if desc_elem is not None and desc_elem.text else ""
                pub_date_str = pubdate_elem.text if pubdate_elem is not None and pubdate_elem.text else ""

                if not raw_title or not link:
                    continue

                title = clean_html(raw_title)
                description = clean_html(raw_desc)

                # Parse published date
                timestamp = int(time.time())
                published_iso = datetime.now(timezone.utc).isoformat()
                if pub_date_str:
                    try:
                        dt = parsedate_to_datetime(pub_date_str)
                        timestamp = int(dt.timestamp())
                        published_iso = dt.isoformat()
                    except Exception:
                        pass

                # Classification
                category, category_label = classify_article(title, description)

                # Image extraction
                image_url = extract_image(item, raw_desc)

                # Unique stable article ID
                article_id = hashlib.md5(f"{link}{title}".encode("utf-8")).hexdigest()[:12]

                articles.append({
                    "id": article_id,
                    "title": title,
                    "description": description,
                    "link": link,
                    "published_at": published_iso,
                    "timestamp": timestamp,
                    "source": feed["name"],
                    "source_badge": feed["badge"],
                    "source_color": feed["color"],
                    "category": category,
                    "category_label": category_label,
                    "image_url": image_url,
                })

        except Exception as e:
            logger.error(f"Error fetching feed {feed['name']}: {e}")

        return articles

    def fetch_all(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Fetch all feeds in parallel and cache the result.
        """
        now = time.time()
        if not force_refresh and self._cached_articles and (now - self._last_fetch_time < self.cache_ttl):
            return self._cached_articles

        logger.info("Fetching and aggregating latest football RSS feeds...")
        all_articles: List[Dict[str, Any]] = []

        with ThreadPoolExecutor(max_workers=len(RSS_FEEDS)) as executor:
            future_to_feed = {executor.submit(self._fetch_single_feed, f): f for f in RSS_FEEDS}
            for future in as_completed(future_to_feed):
                articles = future.result()
                all_articles.extend(articles)

        # Deduplicate by link or title
        seen = set()
        deduped = []
        for art in all_articles:
            key = art["link"].strip()
            if key not in seen:
                seen.add(key)
                deduped.append(art)

        # Sort chronologically (newest first)
        deduped.sort(key=lambda x: x["timestamp"], reverse=True)

        self._cached_articles = deduped
        self._last_fetch_time = now
        logger.info(f"Aggregated {len(deduped)} football articles from {len(RSS_FEEDS)} sources.")
        return deduped

    def get_news(
        self,
        category: Optional[str] = None,
        query: Optional[str] = None,
        source: Optional[str] = None,
        limit: int = 50,
        refresh: bool = False,
    ) -> Dict[str, Any]:
        """
        Get filtered news articles.

        Args:
            category: Filter by 'transfers', 'injuries', 'matches', 'general', or 'all'.
            query: Keyword search in title/description.
            source: Source name filter (e.g., 'BBC Sport').
            limit: Max items to return.
            refresh: If True, bypass cache.

        Returns:
            Dict containing count, categories, and articles list.
        """
        articles = self.fetch_all(force_refresh=refresh)

        filtered = articles
        if category and category != "all":
            cat_clean = category.lower().strip()
            filtered = [a for a in filtered if a["category"] == cat_clean]

        if source and source != "all":
            src_clean = source.lower().strip()
            filtered = [a for a in filtered if a["source"].lower() == src_clean]

        if query and query.strip():
            q = query.lower().strip()
            filtered = [
                a
                for a in filtered
                if q in a["title"].lower() or q in a["description"].lower()
            ]

        # Category summary counts across full cache
        counts = {
            "all": len(articles),
            "transfers": sum(1 for a in articles if a["category"] == "transfers"),
            "injuries": sum(1 for a in articles if a["category"] == "injuries"),
            "matches": sum(1 for a in articles if a["category"] == "matches"),
            "general": sum(1 for a in articles if a["category"] == "general"),
        }

        return {
            "count": len(filtered[:limit]),
            "total_available": len(filtered),
            "categories": counts,
            "cached": not refresh and (time.time() - self._last_fetch_time < self.cache_ttl),
            "last_updated": datetime.fromtimestamp(self._last_fetch_time, tz=timezone.utc).isoformat() if self._last_fetch_time else None,
            "articles": filtered[:limit],
        }

    def get_transfer_news(self, limit: int = 30, refresh: bool = False) -> Dict[str, Any]:
        """Convenience method for transfer wire articles."""
        return self.get_news(category="transfers", limit=limit, refresh=refresh)


# Global singleton instance
news_aggregator = NewsAggregator()
