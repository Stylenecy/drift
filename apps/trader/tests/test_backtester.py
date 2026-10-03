"""The backtester earns a position on the *next* bar, and its metrics add up."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from app.backtester import run_backtest
from app.strategies.base import Strategy
from synthetic import candles_from_closes, random_walk


class Scripted(Strategy):
    """Plays back a fixed position list (or a function of the frame)."""

    id = "scripted"
    name = "Scripted"
    type = "test"
    blurb = "fixed positions"
    param_specs = []

    def __init__(self, positions):
        super().__init__()
        self._positions = positions

    def positions(self, df: pd.DataFrame) -> pd.Series:
        pos = self._positions(df) if callable(self._positions) else self._positions
        return pd.Series(pos, index=df.index).astype(int)


def test_a_position_is_earned_on_the_next_bar_only():
    df = candles_from_closes([100, 110, 121, 121, 108.9])
    # Long decided on bar 1 earns bar 2 (+10%) and bar 3 (0%); exit decided on bar 3.
    result = run_backtest(Scripted([0, 1, 1, 0, 0]), df, "TEST", "1h")
    equity = [p.equity for p in result.equity_curve]
    assert equity == pytest.approx([1.0, 1.0, 1.1, 1.1, 1.1])
    assert result.metrics.total_return == pytest.approx(0.1)
    assert result.metrics.num_trades == 1
    assert result.metrics.win_rate == 1.0


def test_a_same_bar_oracle_loses_its_edge_after_the_shift():
    """A signal that peeks at its own candle would look like a money machine; the shift removes that."""
    df = random_walk(n=600, seed=5, vol=0.01)
    bar_return = df["close"].pct_change().fillna(0.0)
    oracle = lambda frame: (frame["close"].pct_change().fillna(0.0) > 0).astype(int)  # noqa: E731

    unshifted = float((1.0 + oracle(df) * bar_return).cumprod().iloc[-1] - 1.0)
    result = run_backtest(Scripted(oracle), df, "TEST", "1h")
    manual = float((1.0 + oracle(df).shift(1).fillna(0) * bar_return).cumprod().iloc[-1] - 1.0)

    assert unshifted > 5  # several hundred percent if a bar's own move could be traded
    assert result.metrics.total_return == pytest.approx(manual, abs=1e-6)
    assert result.metrics.total_return < 1.0  # what is left after the shift: no oracle edge


def test_max_drawdown_on_a_known_path():
    df = candles_from_closes([100, 120, 90, 135, 108])
    result = run_backtest(Scripted([1, 1, 1, 1, 1]), df, "TEST", "1h")
    # Held from bar 1: equity follows close/100 -> peak 1.20 then 0.90 (-25%); peak 1.35 then 1.08 (-20%).
    assert result.metrics.max_drawdown == pytest.approx(-0.25)
    assert result.metrics.total_return == pytest.approx(0.08)
    assert result.metrics.num_trades == 0  # never closed, so no round trip is counted


def test_round_trips_and_win_rate_count_closed_trades():
    df = candles_from_closes([100, 100, 110, 110, 110, 99, 99, 99])
    # Trade 1: long bars 1-3, exit on 3 (+10%). Trade 2: long 4-6, exit on 6 (-10%).
    result = run_backtest(Scripted([0, 1, 1, 0, 1, 1, 0, 0]), df, "TEST", "1h")
    assert result.metrics.num_trades == 2
    assert result.metrics.win_rate == 0.5
    assert [t.side for t in result.trades] == ["long", "exit", "long", "exit"]


def test_a_flat_book_has_no_return_no_sharpe_no_trades():
    df = random_walk(n=200, seed=3)
    result = run_backtest(Scripted([0] * 200), df, "TEST", "1h")
    assert result.metrics.total_return == 0.0
    assert result.metrics.sharpe == 0.0
    assert result.metrics.max_drawdown == 0.0
    assert result.metrics.num_trades == 0
    assert len(result.candles) == len(result.equity_curve) == 200
