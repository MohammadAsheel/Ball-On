"""
Football Transfer Value Predictor — Central Configuration

All paths, constants, and settings are defined here.
No other module should hardcode paths or magic numbers.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ──────────────────────────────────────────────
# Directory Paths
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / os.getenv("DATA_DIR", "data")
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
FEATURES_DATA_DIR = DATA_DIR / "features"
EXTERNAL_DATA_DIR = DATA_DIR / "external"

MODEL_DIR = PROJECT_ROOT / os.getenv("MODEL_DIR", "models")
DB_DIR = PROJECT_ROOT / "db"

# Ensure directories exist
for directory in [
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    FEATURES_DATA_DIR,
    EXTERNAL_DATA_DIR,
    MODEL_DIR,
    DB_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────
DATABASE_PATH = DB_DIR / "football_transfers.db"
DATABASE_URL = os.getenv("DATABASE_URL")


# ──────────────────────────────────────────────
# Data Source URLs
# ──────────────────────────────────────────────
TRANSFERMARKT_DATASET_BASE_URL = (
    "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"
)
TRANSFERMARKT_ZIP_URL = f"{TRANSFERMARKT_DATASET_BASE_URL}/transfermarkt-datasets.zip"

# Individual CSV files available from the CDN
TRANSFERMARKT_CSV_FILES = [
    "players.csv.gz",
    "transfers.csv.gz",
    "appearances.csv.gz",
    "player_valuations.csv.gz",
    "clubs.csv.gz",
    "competitions.csv.gz",
    "games.csv.gz",
    "game_events.csv.gz",
    "game_lineups.csv.gz",
    "club_games.csv.gz",
]

# Files we actually need for the MVP (skip game_lineups, game_events for now)
TRANSFERMARKT_MVP_FILES = [
    "players.csv.gz",
    "transfers.csv.gz",
    "appearances.csv.gz",
    "player_valuations.csv.gz",
    "clubs.csv.gz",
    "competitions.csv.gz",
    "games.csv.gz",
]

# ──────────────────────────────────────────────
# External APIs
# ──────────────────────────────────────────────
# 1. API-Football / API-Sports (Direct & RapidAPI)
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY", "")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "api-football-v1.p.rapidapi.com")
API_FOOTBALL_BASE_URL = os.getenv("API_FOOTBALL_BASE_URL", "https://v3.football.api-sports.io")

# 2. Football-Data.org
FOOTBALL_DATA_ORG_API_KEY = os.getenv("FOOTBALL_DATA_ORG_API_KEY", "")
FOOTBALL_DATA_ORG_BASE_URL = "https://api.football-data.org/v4"

# 3. SportMonks API (v3)
SPORTMONKS_API_KEY = os.getenv("SPORTMONKS_API_KEY", os.getenv("SPORTMONKS_API_TOKEN", ""))
SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football"

# 4. Transfermarkt Live API (Apify Scraper)
TRANSFERMARKT_API_KEY = os.getenv("TRANSFERMRKT_API_KEY", os.getenv("TRANSFERMARKT_API_KEY", ""))
TRANSFERMARKT_ACTOR_ID = os.getenv("TRANSFERMARKT_ACTOR_ID", "data_xplorer~transfermarkt-api-scraper")
TRANSFERMARKT_CACHE_DIR = EXTERNAL_DATA_DIR / "transfermarkt_cache"
TRANSFERMARKT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# 5. BigBallsData SDK / REST API
BIGBALLSDATA_BASE_URL = "https://api.bigballsdata.com/v1/matches"
BIGBALLSDATA_API_KEY = os.getenv("BIGBALLSDATA_API_KEY", "")

# ──────────────────────────────────────────────
# ML Constants
# ──────────────────────────────────────────────
RANDOM_SEED = 42

# Chronological train/test split date
# Transfers before this date → training set
# Transfers on or after this date → test set
TRAIN_TEST_SPLIT_DATE = "2022-07-01"

# Minimum transfer fee to include (EUR) — filters out trivial transfers
MIN_TRANSFER_FEE = 100_000

# Minimum minutes played in the season before transfer
MIN_MINUTES_PLAYED = 450  # ~5 full matches

# Position mapping: detailed positions → simplified categories
POSITION_MAPPING = {
    # Goalkeepers
    "Goalkeeper": "GK",
    # Defenders
    "Centre-Back": "DEF",
    "Left-Back": "DEF",
    "Right-Back": "DEF",
    "Defender": "DEF",
    # Midfielders
    "Central Midfield": "MID",
    "Defensive Midfield": "MID",
    "Attacking Midfield": "MID",
    "Left Midfield": "MID",
    "Right Midfield": "MID",
    "Midfield": "MID",
    # Forwards
    "Centre-Forward": "FWD",
    "Left Winger": "FWD",
    "Right Winger": "FWD",
    "Second Striker": "FWD",
    "Attack": "FWD",
}

# Top-5 European leagues (by Transfermarkt competition IDs)
TOP_5_LEAGUES = {
    "GB1": "Premier League",
    "ES1": "La Liga",
    "IT1": "Serie A",
    "L1": "Bundesliga",
    "FR1": "Ligue 1",
}

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
