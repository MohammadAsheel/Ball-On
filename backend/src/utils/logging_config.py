"""
Centralized logging configuration.

Usage:
    from src.utils.logging_config import get_logger
    logger = get_logger(__name__)
    logger.info("Something happened")
"""

import logging
import sys
from typing import Optional

from src.config import LOG_LEVEL


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Create and return a configured logger.

    Args:
        name: Logger name (typically __name__ from the calling module).

    Returns:
        Configured logging.Logger instance.
    """
    logger = logging.getLogger(name or "football_predictor")

    if not logger.handlers:
        # Use utf-8 encoding stream handler where possible or standard safe stream
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    return logger

