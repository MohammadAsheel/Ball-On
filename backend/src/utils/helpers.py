"""
General-purpose helper utilities.
"""

from datetime import date, datetime
from typing import Optional, Union

import numpy as np
import pandas as pd


def calculate_age(
    date_of_birth: Union[str, date, datetime, pd.Timestamp],
    reference_date: Union[str, date, datetime, pd.Timestamp],
) -> Optional[float]:
    """
    Calculate age in years at a given reference date.

    Args:
        date_of_birth: Player's date of birth.
        reference_date: Date to calculate age at (e.g., transfer date).

    Returns:
        Age in years (float), or None if inputs are invalid.
    """
    try:
        dob = pd.Timestamp(date_of_birth)
        ref = pd.Timestamp(reference_date)

        if pd.isna(dob) or pd.isna(ref):
            return None

        delta = ref - dob
        return round(delta.days / 365.25, 1)
    except (ValueError, TypeError):
        return None


def safe_per_90(
    stat: Union[int, float],
    minutes: Union[int, float],
    min_minutes: int = 90,
) -> Optional[float]:
    """
    Calculate a per-90-minutes rate safely.

    Avoids division by zero and returns None for players
    with insufficient minutes.

    Args:
        stat: Raw stat count (e.g., goals, assists).
        minutes: Total minutes played.
        min_minutes: Minimum minutes required. Below this, returns None.

    Returns:
        Per-90 rate, or None if minutes are insufficient or invalid.
    """
    try:
        if pd.isna(stat) or pd.isna(minutes):
            return None
        if minutes < min_minutes:
            return None
        return round((stat / minutes) * 90, 4)
    except (ZeroDivisionError, TypeError):
        return None


def parse_transfer_fee(fee_str: Union[str, float, int, None]) -> Optional[float]:
    """
    Parse transfer fee strings into numeric EUR values.

    Handles formats like '€25.5m', '€500k', '25500000', etc.

    Args:
        fee_str: Raw fee value from dataset.

    Returns:
        Fee in EUR as float, or None if unparseable/missing.
    """
    if fee_str is None or (isinstance(fee_str, float) and np.isnan(fee_str)):
        return None

    if isinstance(fee_str, (int, float)):
        return float(fee_str) if fee_str > 0 else None

    fee_str = str(fee_str).strip().replace("€", "").replace(",", "")

    if not fee_str or fee_str.lower() in ("?", "-", "free", "loan", "n/a", "nan"):
        return None

    multiplier = 1.0
    if fee_str.lower().endswith("m"):
        multiplier = 1_000_000
        fee_str = fee_str[:-1]
    elif fee_str.lower().endswith("k"):
        multiplier = 1_000
        fee_str = fee_str[:-1]

    try:
        return float(fee_str) * multiplier
    except ValueError:
        return None


def determine_transfer_window(transfer_date: Union[str, date, pd.Timestamp]) -> str:
    """
    Determine if a transfer occurred in the summer or winter window.

    Summer window: June–September (months 6–9)
    Winter window: January–February (months 1–2)
    Other months: "other"

    Args:
        transfer_date: Date of the transfer.

    Returns:
        "summer", "winter", or "other".
    """
    try:
        dt = pd.Timestamp(transfer_date)
        if pd.isna(dt):
            return "unknown"

        month = dt.month
        if 6 <= month <= 9:
            return "summer"
        elif month in (1, 2):
            return "winter"
        else:
            return "other"
    except (ValueError, TypeError):
        return "unknown"


def format_currency(value: Optional[float], currency: str = "EUR") -> str:
    """
    Format a numeric value as a human-readable currency string.

    Args:
        value: Amount in base currency units.
        currency: Currency code.

    Returns:
        Formatted string like '€25.5M' or '€500K'.
    """
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return "N/A"

    symbol = "€" if currency == "EUR" else currency + " "

    if abs(value) >= 1_000_000:
        return f"{symbol}{value / 1_000_000:.1f}M"
    elif abs(value) >= 1_000:
        return f"{symbol}{value / 1_000:.0f}K"
    else:
        return f"{symbol}{value:,.0f}"
