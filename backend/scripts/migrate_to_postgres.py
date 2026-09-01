"""
Database Migration Script: SQLite -> PostgreSQL (Supabase)
Migrates existing data from backend/db/football_transfers.db to PostgreSQL.
Preserves all original IDs and verifies row counts.
"""

import argparse
import functools
import json
import os
import sqlite3
import sys
import time
import warnings
from datetime import date, datetime
from pathlib import Path
import pandas as pd
from sqlalchemy import (
    create_engine,
    text,
    Integer,
    BigInteger,
    Float,
    Numeric,
    Text,
    Date,
    DateTime,
)
from sqlalchemy.dialects.postgresql import JSONB

# Ensure print always flushes immediately
print = functools.partial(print, flush=True)

# Suppress pandas dateutil format inference warning for cleaner output
warnings.filterwarnings("ignore", category=UserWarning, module="pandas")

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Locate SQLite database
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQLITE_DB_PATH = PROJECT_ROOT / "db" / "football_transfers.db"

# Ordered list of tables to migrate (respecting logical dependencies)
MIGRATION_TABLES = [
    "players",
    "clubs",
    "competitions",
    "games",
    "appearances",
    "transfers",
    "player_valuations",
    "model_versions",
    "model_evaluations",
    "feature_snapshots",
    "valuation_predictions",
]

# Explicit SQLAlchemy types to prevent Postgres datatype mismatch in psycopg3 / Supabase pooler
TABLE_DTYPES = {
    "players": {
        "player_id": Integer,
        "last_season": Integer,
        "current_club_id": Integer,
        "height_in_cm": Float,
        "international_caps": Float,
        "international_goals": Float,
        "current_national_team_id": Float,
        "date_of_birth": Date,
        "contract_expiration_date": Date,
        "market_value_in_eur": Numeric(15, 2),
        "highest_market_value_in_eur": Numeric(15, 2),
    },
    "clubs": {
        "club_id": Integer,
        "total_market_value": Numeric(18, 2),
        "squad_size": Integer,
        "average_age": Float,
        "foreigners_number": Integer,
        "foreigners_percentage": Float,
        "national_team_players": Integer,
        "stadium_seats": Integer,
        "last_season": Integer,
    },
    "competitions": {
        "competition_id": Text,
        "country_id": Integer,
        "total_clubs": Float,
    },
    "games": {
        "game_id": Integer,
        "season": Integer,
        "date": Date,
        "home_club_id": Integer,
        "away_club_id": Integer,
        "home_club_goals": Integer,
        "away_club_goals": Integer,
        "home_club_position": Float,
        "away_club_position": Float,
        "attendance": Float,
    },
    "appearances": {
        "appearance_id": Text,
        "game_id": Integer,
        "player_id": Integer,
        "player_club_id": Integer,
        "player_current_club_id": Integer,
        "date": Date,
        "yellow_cards": Integer,
        "red_cards": Integer,
        "goals": Integer,
        "assists": Integer,
        "minutes_played": Integer,
    },
    "transfers": {
        "player_id": Integer,
        "transfer_date": Date,
        "from_club_id": Integer,
        "to_club_id": Integer,
        "transfer_fee": Numeric(15, 2),
        "market_value_in_eur": Numeric(15, 2),
    },
    "player_valuations": {
        "player_id": Integer,
        "date": Date,
        "market_value_in_eur": Numeric(15, 2),
        "current_club_id": Integer,
    },
    "model_versions": {
        "training_date": DateTime(timezone=True),
        "metadata_json": JSONB,
    },
    "model_evaluations": {
        "metrics_json": JSONB,
    },
    "feature_snapshots": {
        "snapshot_id": Integer,
        "player_id": Integer,
        "snapshot_date": Date,
        "feature_json": JSONB,
        "created_at": DateTime(timezone=True),
    },
    "valuation_predictions": {
        "prediction_id": Integer,
        "player_id": Integer,
        "snapshot_id": Integer,
        "estimated_transfer_value": Numeric(15, 2),
        "explanation_json": JSONB,
        "created_at": DateTime(timezone=True),
    },
}

CHUNK_SIZE = 15_000


def check_sqlite_table_exists(sqlite_conn: sqlite3.Connection, table_name: str) -> bool:
    cursor = sqlite_conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,)
    )
    return cursor.fetchone() is not None


def get_sqlite_row_count(sqlite_conn: sqlite3.Connection, table_name: str) -> int:
    cursor = sqlite_conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
    return cursor.fetchone()[0]


def get_postgres_row_count(pg_engine, table_name: str) -> int:
    with pg_engine.connect() as conn:
        result = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
        return result.scalar()


def clean_dataframe(df: pd.DataFrame, table_name: str) -> pd.DataFrame:
    """Sanitize DataFrame before inserting into PostgreSQL."""
    df = df.astype(object).where(pd.notnull(df), None)

    for col in df.columns:
        # Date column conversion to Python date object
        if any(k in col.lower() for k in ["date", "birth", "expiration"]) and "created_at" not in col.lower():
            dt_series = pd.to_datetime(df[col], format="mixed", errors="coerce")
            df[col] = dt_series.dt.date.where(dt_series.notnull(), None)

        # JSON column conversion if dict/list is passed
        if "json" in col.lower():
            df[col] = df[col].apply(
                lambda x: json.loads(x) if isinstance(x, str) and (x.startswith("{") or x.startswith("[")) else x
            )

        # Clean empty strings
        df[col] = df[col].apply(lambda x: None if (isinstance(x, str) and x.strip() == "") else x)

    return df


def migrate(sqlite_path: Path, target_url: str, wipe_target: bool = False):
    print("=" * 70)
    print("BALLON: SQLite -> PostgreSQL (Supabase) Data Migration")
    print("=" * 70)
    print(f"Source SQLite DB : {sqlite_path}")
    masked_url = target_url.split("@")[-1] if "@" in target_url else target_url
    print(f"Target Postgres  : ...@{masked_url}")
    print("-" * 70)

    if not sqlite_path.exists():
        print(f"[ERROR] SQLite source database not found at {sqlite_path}")
        sys.exit(1)

    # Standardize connection string driver for SQLAlchemy
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif target_url.startswith("postgresql://") and not target_url.startswith("postgresql+"):
        target_url = target_url.replace("postgresql://", "postgresql+psycopg://", 1)

    try:
        pg_engine = create_engine(target_url, pool_pre_ping=True)
        with pg_engine.connect() as test_conn:
            test_conn.execute(text("SELECT 1"))
        print("[OK] Connected to PostgreSQL target successfully.")
    except Exception as e:
        print(f"[ERROR] Connecting to PostgreSQL: {e}")
        sys.exit(1)

    sqlite_conn = sqlite3.connect(str(sqlite_path))

    # Check which tables exist in SQLite
    existing_tables = [t for t in MIGRATION_TABLES if check_sqlite_table_exists(sqlite_conn, t)]
    print(f"Found {len(existing_tables)} tables in SQLite database.")

    # Up-front wipe if requested
    if wipe_target:
        print("\n[*] Clearing existing target tables for clean migration...")
        with pg_engine.begin() as conn:
            for t in reversed(MIGRATION_TABLES):
                try:
                    conn.execute(text(f'TRUNCATE TABLE "{t}" CASCADE;'))
                    print(f"    - Cleared {t}")
                except Exception as ex:
                    print(f"    - Notice: {t} truncation info: {ex}")
        print("    [OK] Target tables cleared.")

    migration_stats = {}

    for table in existing_tables:
        total_rows = get_sqlite_row_count(sqlite_conn, table)
        migration_stats[table] = {"sqlite_rows": total_rows}

        # Check if already migrated
        try:
            current_pg_count = get_postgres_row_count(pg_engine, table)
        except Exception:
            current_pg_count = 0

        if not wipe_target and current_pg_count == total_rows and total_rows > 0:
            print(f"\n[*] Table {table}: Already fully migrated ({total_rows:,} rows). Skipping.")
            continue

        print(f"\n[*] Migrating table: {table} ({total_rows:,} rows)...")

        start_time = time.time()
        last_rowid = 0
        inserted = 0
        dtype_map = TABLE_DTYPES.get(table, {})

        while True:
            # Deterministic Keyset pagination using rowid alias
            query = f'SELECT rowid AS _migration_rowid, * FROM "{table}" WHERE rowid > {last_rowid} ORDER BY rowid ASC LIMIT {CHUNK_SIZE}'
            chunk_df = pd.read_sql_query(query, sqlite_conn)
            if chunk_df.empty:
                break

            last_rowid = int(chunk_df["_migration_rowid"].max())
            chunk_df = chunk_df.drop(columns=["_migration_rowid"])

            chunk_df = clean_dataframe(chunk_df, table)

            # Insert into Postgres preserving original IDs and applying explicit dtypes
            chunk_df.to_sql(
                table,
                con=pg_engine,
                if_exists="append",
                index=False,
                chunksize=2_000,
                dtype=dtype_map,
            )
            inserted += len(chunk_df)
            elapsed = time.time() - start_time
            print(f"    Progress: {inserted:,}/{total_rows:,} rows ({elapsed:.1f}s)")

        print(f"    [OK] Done: {inserted:,} rows migrated in {time.time() - start_time:.1f}s")

    sqlite_conn.close()

    # Verification Phase
    print("\n" + "=" * 70)
    print("MIGRATION VERIFICATION REPORT")
    print("=" * 70)
    print(f"{'Table Name':<25} {'SQLite Rows':<15} {'Postgres Rows':<15} {'Status':<10}")
    print("-" * 70)

    has_errors = False
    for table in existing_tables:
        sqlite_count = migration_stats[table]["sqlite_rows"]
        try:
            pg_count = get_postgres_row_count(pg_engine, table)
        except Exception as ex:
            pg_count = -1

        status = "[OK]" if sqlite_count == pg_count else "[MISMATCH]"
        if sqlite_count != pg_count:
            has_errors = True

        print(f"{table:<25} {sqlite_count:<15,d} {pg_count:<15,d} {status:<10}")

    print("-" * 70)
    if has_errors:
        print("[FAILED] Migration failed verification: One or more tables have row count mismatches.")
        sys.exit(1)
    else:
        print("[SUCCESS] ALL TABLES VERIFIED SUCCESSFULLY! PostgreSQL database is ready.")
        print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite DB to PostgreSQL")
    parser.add_argument(
        "--target-url",
        default=os.getenv("DATABASE_URL"),
        help="Target PostgreSQL Connection URL (e.g. postgresql+psycopg://user:pass@host:5432/dbname)",
    )
    parser.add_argument(
        "--sqlite-path",
        default=str(SQLITE_DB_PATH),
        help="Path to SQLite source database",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Truncate target tables before inserting",
    )

    args = parser.parse_args()

    if not args.target_url:
        print("[ERROR] No target database URL provided. Set DATABASE_URL or pass --target-url.")
        sys.exit(1)

    migrate(
        sqlite_path=Path(args.sqlite_path),
        target_url=args.target_url,
        wipe_target=args.wipe,
    )
