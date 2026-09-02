"""
Utility to cleanly reset PostgreSQL tables by recreating them from schema.sql.
"""
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = PROJECT_ROOT / "sql" / "schema.sql"

url = os.getenv("DATABASE_URL")
if not url and len(sys.argv) > 1:
    url = sys.argv[1]

if not url:
    print("No database URL provided.")
    sys.exit(1)

if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+psycopg://", 1)
elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
    url = url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(url, pool_pre_ping=True)

tables = [
    "valuation_predictions",
    "feature_snapshots",
    "model_evaluations",
    "model_versions",
    "player_valuations",
    "transfers",
    "appearances",
    "games",
    "competitions",
    "clubs",
    "players"
]

print("Dropping existing tables...")
with engine.begin() as conn:
    for t in tables:
        try:
            conn.execute(text(f'DROP TABLE IF EXISTS "{t}" CASCADE;'))
            print(f"  - Dropped {t}")
        except Exception as e:
            print(f"  - Error dropping {t}: {e}")

print("Recreating clean schema from schema.sql...")
with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    schema_sql = f.read()

# Execute schema commands
with engine.begin() as conn:
    for statement in schema_sql.split(";"):
        stmt = statement.strip()
        if stmt:
            conn.execute(text(stmt))

print("✓ Database tables reset and clean schema recreated successfully!")
