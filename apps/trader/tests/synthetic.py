"""Seeded synthetic market data for offline tests (no exchange, no network)."""
from __future__ import annotations

import numpy as np
import pandas as pd


def random_walk(n: int = 600, seed: int = 7, start: float = 100.0, vol: float = 0.01, drift: float = 0.0) -> pd.DataFrame:
    """Synthetic hourly OHLCV candles from a seeded geometric random walk."""
    rng = np.random.default_rng(seed)
    close = start * np.exp(np.cumsum(rng.normal(drift, vol, n)))
    open_ = np.concatenate([[start], close[:-1]])
    high = np.maximum(open_, close) * (1 + rng.uniform(0, 0.004, n))
    low = np.minimum(open_, close) * (1 - rng.uniform(0, 0.004, n))
    return pd.DataFrame(
        {
            "time": 1_790_000_000 + 3600 * np.arange(n),
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": rng.uniform(10, 100, n),
        }
    )


def candles_from_closes(closes) -> pd.DataFrame:
    """Candles whose close path is exactly `closes` (open = previous close)."""
    closes = np.asarray(closes, dtype=float)
    open_ = np.concatenate([[closes[0]], closes[:-1]])
    return pd.DataFrame(
        {
            "time": 1_790_000_000 + 3600 * np.arange(len(closes)),
            "open": open_,
            "high": np.maximum(open_, closes),
            "low": np.minimum(open_, closes),
            "close": closes,
            "volume": np.ones(len(closes)),
        }
    )
