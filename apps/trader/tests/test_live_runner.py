"""The live runner's order of operations: measure the loss, ask and record on-chain, then trade."""
from __future__ import annotations

import asyncio

import pandas as pd

from app import chain, live
from app.chain import ChainGuard, Verdict
from app.models import BotConfig
from app.strategies.base import Strategy
from synthetic import random_walk


class AlwaysLong(Strategy):
    id = "always_long"
    name = "Always long"
    type = "test"
    blurb = "test stub"
    param_specs = []

    def positions(self, df: pd.DataFrame) -> pd.Series:
        return pd.Series(1, index=df.index)


class Client:
    """A Bybit stand-in that logs every order into the shared timeline."""

    def __init__(self, timeline: list, equity: float = 1000.0):
        self.timeline, self.equity = timeline, equity

    def klines(self, symbol, timeframe, bars):
        return random_walk(n=bars, seed=2)

    def account_equity(self):
        return self.equity

    def place_market_order(self, symbol, side, qty):
        self.timeline.append(("order", side))


class Guard:
    """A MacroGuard stand-in: answers like the contract would and logs every decision."""

    enabled = True

    def __init__(self, timeline: list, allow):
        self.timeline, self.allow = timeline, allow

    def decide(self, symbol, target, price, drawdown):
        self.timeline.append(("decide", target, round(drawdown, 4)))
        return Verdict(allowed=self.allow(target), tx="0xabc", confirmed=True)


def tick(monkeypatch, guard, client, position: int = 0, peak: float = 1000.0) -> live.Bot:
    monkeypatch.setattr(live, "chain_guard", guard)
    bot = live.Bot(id="t", config=BotConfig(strategy="macd"))
    bot.running, bot.position, bot.peak_equity = True, position, peak
    asyncio.run(live.BotManager(live.Connection())._tick(bot, client, AlwaysLong()))
    return bot


def test_an_allowed_intent_is_recorded_before_the_order(monkeypatch):
    timeline: list = []
    bot = tick(monkeypatch, Guard(timeline, allow=lambda t: True), Client(timeline))
    assert timeline == [("decide", 1, 0.0), ("order", "Buy")]
    assert bot.position == 1 and bot.chain_vetoed is False
    assert bot.last_chain_tx == "0xabc"


def test_a_blocked_intent_stays_on_the_record_as_the_bots_own_signal(monkeypatch):
    # Risk off: Long is vetoed. The trail shows the Long the bot wanted (allowed = false), not a Flat.
    timeline: list = []
    bot = tick(monkeypatch, Guard(timeline, allow=lambda t: t != 1), Client(timeline))
    assert timeline == [("decide", 1, 0.0)]  # recorded, and no order placed
    assert bot.last_signal == "long" and bot.chain_vetoed is True and bot.position == 0


def test_the_loss_is_checked_before_any_new_order(monkeypatch):
    # The account is already 25% under its peak when the tick starts: the bot exits at once
    # (no new Buy past the line), then the breach goes on the record and the bot stops.
    timeline: list = []
    bot = tick(
        monkeypatch, Guard(timeline, allow=lambda t: True), Client(timeline, equity=750.0), position=1
    )
    assert timeline == [("order", "Sell"), ("decide", 0, -0.25)]
    assert bot.running is False and "drawdown stop hit" in (bot.error or "")


def test_without_a_confirmed_answer_the_runner_holds_flat(monkeypatch):
    # The guard is configured but the chain cannot confirm anything (RPC down): fail closed.
    timeline: list = []
    monkeypatch.setattr(chain, "MACROGUARD_FAIL_MODE", "closed")
    g = ChainGuard()
    g.enabled = True
    g._contract = type("C", (), {"functions": type("F", (), {"recordDecision": staticmethod(lambda *a: a)})})()
    monkeypatch.setattr(g, "_transact", lambda fn: (None, None))
    bot = tick(monkeypatch, g, Client(timeline))
    assert timeline == []  # no order: the Long was not confirmed
    assert bot.position == 0
    assert bot.chain_vetoed is False  # nothing was vetoed on-chain; the bot says why it holds Flat
    assert bot.error == live.NO_ANSWER


def test_a_failed_exit_at_the_stop_is_still_recorded_and_retried(monkeypatch):
    # The exit order is rejected: the breach still goes on the record, and the stop stays
    # latched, so the next tick only retries the exit even though the account has recovered.
    timeline: list = []

    class RejectingClient(Client):
        def place_market_order(self, symbol, side, qty):
            raise ConnectionError("order rejected")

    monkeypatch.setattr(live, "chain_guard", Guard(timeline, allow=lambda t: True))
    bot = live.Bot(id="t", config=BotConfig(strategy="macd"))
    bot.running, bot.position, bot.peak_equity = True, 1, 1000.0
    manager = live.BotManager(live.Connection())

    asyncio.run(manager._tick(bot, RejectingClient(timeline, equity=750.0), AlwaysLong()))
    assert timeline == [("decide", 0, -0.25)]
    assert bot.running is True and bot.position == 1 and "exit failed" in (bot.error or "")

    asyncio.run(manager._tick(bot, Client(timeline, equity=900.0), AlwaysLong()))  # back to -10%
    assert timeline == [("decide", 0, -0.25), ("order", "Sell")]  # no new Buy, no second record
    assert bot.running is False and bot.position == 0

