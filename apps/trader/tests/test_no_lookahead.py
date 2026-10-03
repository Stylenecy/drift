"""No look-ahead, as a property: a position decided at bar t may only use bars <= t.

Prefix invariance: positions(df[:k]) == positions(df)[:k] for every cut k.
If any strategy peeked at a later bar, cutting the future off would change a
past position. Likewise, rewriting the future must never rewrite the past.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from app.strategies.registry import all_strategies, get_strategy
from synthetic import random_walk

STRATEGY_IDS = [s.id for s in all_strategies()]
CUTS = [30, 61, 150, 333, 599]


def test_registry_has_the_four_documented_strategies():
    assert STRATEGY_IDS == ["macd", "rsi", "bollinger", "dual_thrust"]


@pytest.mark.parametrize("strategy_id", STRATEGY_IDS)
def test_prefix_invariance(strategy_id):
    df = random_walk(n=600, seed=11)
    strategy = get_strategy(strategy_id)
    full = strategy.positions(df)

    assert full.index.equals(df.index)
    assert set(np.unique(full.to_numpy())) <= {-1, 0, 1}
    for k in CUTS:
        prefix = strategy.positions(df.iloc[:k].copy())
        pd.testing.assert_series_equal(prefix, full.iloc[:k], check_names=False, check_dtype=False, obj=f"{strategy_id} cut {k}")


@pytest.mark.parametrize("strategy_id", STRATEGY_IDS)
def test_rewriting_the_future_never_changes_the_past(strategy_id):
    df = random_walk(n=600, seed=23)
    shocked = df.copy()
    k = 400
    # A crash and a melt-up after bar k: a strategy that peeks would react early.
    shocked.loc[k:, ["open", "high", "low", "close"]] *= np.linspace(0.4, 2.5, len(df) - k)[:, None]

    strategy = get_strategy(strategy_id)
    before = strategy.positions(df).iloc[:k]
    after = strategy.positions(shocked).iloc[:k]
    pd.testing.assert_series_equal(before, after, check_names=False)
