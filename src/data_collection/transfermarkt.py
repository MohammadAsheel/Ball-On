"""
Transfermarkt Datasets — Data Collection Module

Downloads the dcaribou/transfermarkt-datasets from the public CDN,
caches the files locally, and loads them into pandas DataFrames and SQLite.

Data source: https://github.com/dcaribou/transfermarkt-datasets
License: For educational/personal/portfolio use only. Data © Transfermarkt.

Available tables:
    - players        (37,000+ player profiles)
    - transfers       (87,000+ transfer records with fees)
    - appearances     (1,800,000+ per-game player stats)
    - player_valuations (500,000+ historical market values)
    - clubs           (400+ club profiles)
    - competitions    (40+ leagues/tournaments)
    - games           (79,000+ match results)
"""

import gzip
import io
import sqlite3
import time
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import requests
from tqdm import tqdm

from src.config import (
    DATABASE_PATH,
    RAW_DATA_DIR,
    TRANSFERMARKT_DATASET_BASE_URL,
    TRANSFERMARKT_MVP_FILES,
)
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

# Expected minimum row counts for sanity checks
EXPECTED_MIN_ROWS = {
    "players": 30_000,
    "transfers": 70_000,
    "appearances": 1_000_000,
    "player_valuations": 400_000,
    "clubs": 300,
    "competitions": 30,
    "games": 60_000,
}


class TransfermarktDataCollector:
    """
    Downloads and manages the transfermarkt-datasets.

    Downloads individual gzipped CSV files from the public CDN,
    caches them in data/raw/, and provides methods to load them
    as DataFrames or insert into SQLite.
    """

    def __init__(
        self,
        raw_dir: Optional[Path] = None,
        db_path: Optional[Path] = None,
        files: Optional[List[str]] = None,
    ):
        self.raw_dir = raw_dir or RAW_DATA_DIR
        self.db_path = db_path or DATABASE_PATH
        self.files = files or TRANSFERMARKT_MVP_FILES
        self.base_url = TRANSFERMARKT_DATASET_BASE_URL

        self.raw_dir.mkdir(parents=True, exist_ok=True)

    # ──────────────────────────────────────────
    # Download
    # ──────────────────────────────────────────

    def download_file(self, filename: str, force: bool = False) -> Path:
        """
        Download a single gzipped CSV file from the CDN.

        Args:
            filename: Name of the file (e.g., 'players.csv.gz').
            force: If True, re-download even if cached.

        Returns:
            Path to the downloaded file.

        Raises:
            requests.HTTPError: If the download fails.
        """
        local_path = self.raw_dir / filename

        if local_path.exists() and not force:
            logger.info(f"Cached: {filename} ({local_path.stat().st_size:,} bytes)")
            return local_path

        url = f"{self.base_url}/{filename}"
        logger.info(f"Downloading: {url}")

        response = requests.get(url, stream=True, timeout=120)
        response.raise_for_status()

        total_size = int(response.headers.get("content-length", 0))

        with open(local_path, "wb") as f:
            with tqdm(
                total=total_size,
                unit="B",
                unit_scale=True,
                desc=filename,
                disable=total_size == 0,
            ) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    pbar.update(len(chunk))

        logger.info(
            f"Downloaded: {filename} ({local_path.stat().st_size:,} bytes)"
        )
        return local_path

    def download_all(self, force: bool = False) -> Dict[str, Path]:
        """
        Download all MVP dataset files.

        Args:
            force: If True, re-download even if cached.

        Returns:
            Dict mapping table name → local file path.
        """
        downloaded = {}
        total = len(self.files)

        logger.info(f"Starting download of {total} dataset files...")

        for i, filename in enumerate(self.files, 1):
            table_name = filename.replace(".csv.gz", "")
            logger.info(f"[{i}/{total}] {filename}")

            try:
                path = self.download_file(filename, force=force)
                downloaded[table_name] = path
            except requests.HTTPError as e:
                logger.error(f"Failed to download {filename}: {e}")
                continue
            except requests.ConnectionError as e:
                logger.error(f"Connection error for {filename}: {e}")
                continue

            # Polite delay between requests
            if i < total:
                time.sleep(0.5)

        logger.info(
            f"Download complete: {len(downloaded)}/{total} files successful"
        )
        return downloaded

    # ──────────────────────────────────────────
    # Load into DataFrames
    # ──────────────────────────────────────────

    def load_csv(self, table_name: str) -> pd.DataFrame:
        """
        Load a downloaded gzipped CSV into a pandas DataFrame.

        Args:
            table_name: Name of the table (e.g., 'players', 'transfers').

        Returns:
            DataFrame with the table data.

        Raises:
            FileNotFoundError: If the file hasn't been downloaded yet.
        """
        filename = f"{table_name}.csv.gz"
        local_path = self.raw_dir / filename

        if not local_path.exists():
            raise FileNotFoundError(
                f"File not found: {local_path}. "
                f"Run download_all() first."
            )

        logger.info(f"Loading {table_name} from {local_path}...")

        df = pd.read_csv(
            local_path,
            compression="gzip",
            low_memory=False,
        )

        logger.info(
            f"Loaded {table_name}: {len(df):,} rows × {len(df.columns)} columns"
        )

        return df

    def load_all(self) -> Dict[str, pd.DataFrame]:
        """
        Load all downloaded CSV files into DataFrames.

        Returns:
            Dict mapping table name → DataFrame.
        """
        dataframes = {}

        for filename in self.files:
            table_name = filename.replace(".csv.gz", "")
            try:
                dataframes[table_name] = self.load_csv(table_name)
            except FileNotFoundError as e:
                logger.warning(f"Skipping {table_name}: {e}")

        return dataframes

    # ──────────────────────────────────────────
    # Load into SQLite
    # ──────────────────────────────────────────

    def load_to_sqlite(
        self,
        dataframes: Optional[Dict[str, pd.DataFrame]] = None,
        if_exists: str = "replace",
    ) -> None:
        """
        Load DataFrames into the SQLite database.

        Args:
            dataframes: Dict of table_name → DataFrame.
                If None, loads from downloaded CSVs.
            if_exists: How to handle existing tables
                ('replace', 'append', 'fail').
        """
        if dataframes is None:
            dataframes = self.load_all()

        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"Loading {len(dataframes)} tables into SQLite: {self.db_path}")

        conn = sqlite3.connect(str(self.db_path))

        try:
            for table_name, df in dataframes.items():
                logger.info(
                    f"  Writing {table_name}: {len(df):,} rows..."
                )
                df.to_sql(
                    table_name,
                    conn,
                    if_exists=if_exists,
                    index=False,
                )
                logger.info(f"  [OK] {table_name} written successfully")

            conn.commit()
        finally:
            conn.close()

        db_size_mb = self.db_path.stat().st_size / (1024 * 1024)
        logger.info(f"SQLite database ready: {self.db_path} ({db_size_mb:.1f} MB)")

    # ──────────────────────────────────────────
    # Validation
    # ──────────────────────────────────────────

    def validate_data(
        self, dataframes: Dict[str, pd.DataFrame]
    ) -> Dict[str, dict]:
        """
        Run sanity checks on the downloaded data.

        Checks:
            - Minimum row counts
            - Required columns exist
            - No entirely empty tables

        Args:
            dataframes: Dict of table_name → DataFrame.

        Returns:
            Validation report as dict.
        """
        report = {}

        required_columns = {
            "players": ["player_id", "name", "position", "date_of_birth"],
            "transfers": ["player_id", "transfer_date"],
            "appearances": [
                "player_id",
                "goals",
                "assists",
                "minutes_played",
            ],
            "player_valuations": ["player_id", "date", "market_value_in_eur"],
            "clubs": ["club_id", "name"],
            "competitions": ["competition_id", "name"],
            "games": ["game_id", "date"],
        }

        for table_name, df in dataframes.items():
            table_report = {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": list(df.columns),
                "missing_values": df.isnull().sum().to_dict(),
                "missing_pct": (df.isnull().sum() / len(df) * 100).round(2).to_dict(),
                "issues": [],
            }

            # Check minimum rows
            min_expected = EXPECTED_MIN_ROWS.get(table_name, 0)
            if len(df) < min_expected:
                table_report["issues"].append(
                    f"Low row count: {len(df):,} (expected >= {min_expected:,})"
                )

            # Check required columns
            req_cols = required_columns.get(table_name, [])
            missing_cols = [c for c in req_cols if c not in df.columns]
            if missing_cols:
                table_report["issues"].append(
                    f"Missing required columns: {missing_cols}"
                )

            # Check for empty table
            if len(df) == 0:
                table_report["issues"].append("Table is completely empty!")

            report[table_name] = table_report

        # Print summary
        logger.info("=" * 60)
        logger.info("DATA VALIDATION REPORT")
        logger.info("=" * 60)

        all_passed = True
        for table_name, table_report in report.items():
            status = "[OK]" if not table_report["issues"] else "[FAIL]"
            if table_report["issues"]:
                all_passed = False

            logger.info(
                f"  {status} {table_name}: "
                f"{table_report['rows']:,} rows x "
                f"{table_report['columns']} cols"
            )

            for issue in table_report["issues"]:
                logger.warning(f"    ! {issue}")

        logger.info("=" * 60)
        if all_passed:
            logger.info("All validation checks passed [OK]")
        else:
            logger.warning("Some validation checks failed - review issues above")

        return report

    # ──────────────────────────────────────────
    # Full Pipeline
    # ──────────────────────────────────────────

    def run_full_pipeline(self, force_download: bool = False) -> Dict[str, pd.DataFrame]:
        """
        Run the complete data acquisition pipeline:
        1. Download all CSV files
        2. Load into DataFrames
        3. Validate data quality
        4. Load into SQLite

        Args:
            force_download: If True, re-download even if cached.

        Returns:
            Dict of table_name → DataFrame.
        """
        logger.info("=" * 60)
        logger.info("TRANSFERMARKT DATA ACQUISITION PIPELINE")
        logger.info("=" * 60)

        # Step 1: Download
        self.download_all(force=force_download)

        # Step 2: Load
        dataframes = self.load_all()

        if not dataframes:
            logger.error("No data loaded. Aborting pipeline.")
            return {}

        # Step 3: Validate
        self.validate_data(dataframes)

        # Step 4: Load to SQLite
        self.load_to_sqlite(dataframes)

        logger.info("Data acquisition pipeline complete [OK]")
        return dataframes


# ──────────────────────────────────────────
# Module-level convenience functions
# ──────────────────────────────────────────


def download_and_validate() -> Dict[str, pd.DataFrame]:
    """Convenience function: download, validate, and load to SQLite."""
    collector = TransfermarktDataCollector()
    return collector.run_full_pipeline()


if __name__ == "__main__":
    download_and_validate()
