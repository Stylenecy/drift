"""Upstream behaviour found while writing these tests, pinned here instead of silently changed.

- A bug: BNBUSDT is listed twice in MARKET_SYMBOLS (app/main.py and app/cli.py).
  Marked xfail(strict=True): the suite stays green, and it turns red the day the
  list is fixed so this note gets removed.
- A design limit: the live runner clamps a vetoed signal to Flat *before* it calls
  recordDecision, so the on-chain trail records Flat (allowed), not the blocked Long.
"""
from __future__ import annotations

import asyncio

import pandas as pd
import pytest

import app.main as main
from app import live
from app.models import BotConfig
from app.strategies.base import Strategy
from synthetic import random_walk


@pytest.mark.xfail(strict=True, reason="known upstream issue: BNBUSDT is listed twice in MARKET_SYMBOLS")
def test_market_symbols_are_unique():
    assert len(set(main.MARKET_SYMBOLS)) == len(main.MARKET_SYMBOLS)


class AlwaysLong(Strategy):
    id = "always_long"
    name = "Always long"
    type = "test"
    blurb = "test stub"
    param_specs = []

    def positions(self, df: pd.DataFrame) -> pd.Series:
        return pd.Series(1, index=df.index)


def test_runner_records_the_post_veto_target(monkeypatch):
    recorded = []

    class RiskOffGuard:
        def allowed(self, target):
            return target != 1  # Long vetoed

        def record(self, symbol, target, price, drawdown):
            recorded.append(target)
            return None

    class Client:
        def klines(self, symbol, timeframe, bars):
            return random_walk(n=bars, seed=2)

        def account_equity(self):
            return 1000.0

        def place_market_order(self, *args):
            pytest.fail("a vetoed signal must not place an order")

    monkeypatch.setattr(live, "chain_guard", RiskOffGuard())
    bot = live.Bot(id="t", config=BotConfig(strategy="macd"))
    asyncio.run(live.BotManager(live.Connection())._tick(bot, Client(), AlwaysLong()))

    assert bot.last_signal == "long"
    assert bot.chain_vetoed is True
    assert recorded == [0]  # the trail shows Flat, not the blocked Long
