"""Auto-Research chooses parameters on the training slice only, and labels results honestly."""
from __future__ import annotations

import numpy as np
import pytest

from app import optimize as opt
from app.strategies.macd import MacdStrategy
from app.strategies.registry import all_strategies
from synthetic import random_walk


@pytest.mark.parametrize(
    ("is_sharpe", "oos_sharpe", "verdict"),
    [
        (1.0, 0.6, "robust"),
        (2.0, 0.6, "robust"),  # robust is checked first, even if OOS < 40% of IS
        (1.0, 0.3, "overfit"),  # strong in-sample, collapses out-of-sample
        (1.0, 0.45, "weak"),  # neither robust nor collapsed
        (0.3, 2.0, "weak"),  # a lucky out-of-sample run alone is not an edge
    ],
)
def test_verdict_thresholds(is_sharpe, oos_sharpe, verdict):
    assert opt._verdict(is_sharpe, oos_sharpe) == verdict


def test_param_grid_stays_in_bounds_and_keeps_fast_below_slow():
    for cls in all_strategies():
        grid = opt._param_grid(cls)
        assert 0 < len(grid) <= opt.MAX_COMBOS
        for params in grid:
            for spec in cls.param_specs:
                assert spec.min <= params[spec.key] <= spec.max
    assert all(p["fast"] < p["slow"] for p in opt._param_grid(MacdStrategy))


def test_parameters_are_chosen_on_the_training_slice_only():
    df = random_walk(n=1000, seed=42)
    split = int(len(df) * 0.7)
    shocked = df.copy()
    # Rewrite everything after the split: a held-out slice must not influence the choice.
    shocked.loc[split:, ["open", "high", "low", "close"]] *= np.linspace(1.0, 3.0, len(df) - split)[:, None]

    honest = {r.strategy: r for r in opt.optimize(df, "TEST", "1h", 0.7).results}
    rewritten = {r.strategy: r for r in opt.optimize(shocked, "TEST", "1h", 0.7).results}
    assert honest.keys() == rewritten.keys()
    for sid in honest:
        assert honest[sid].params == rewritten[sid].params, sid
        assert honest[sid].in_sample == rewritten[sid].in_sample, sid


def test_results_cover_every_strategy_and_rank_robust_first():
    res = opt.optimize(random_walk(n=800, seed=9), "TEST", "1h", 0.7)
    assert sorted(r.strategy for r in res.results) == sorted(c.id for c in all_strategies())
    ranks = [opt._VERDICT_RANK[r.verdict] for r in res.results]
    assert ranks == sorted(ranks)
    for r in res.results:
        assert 0 <= r.split_index < len(r.equity)
