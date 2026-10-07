"""The terminal bot (`./drift bot`): the same order of operations as the live runner."""
from __future__ import annotations

import io
from types import SimpleNamespace

import pandas as pd
from rich.console import Console

from app import cli
from app.chain import Verdict
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


class Trade:
    """A Bybit stand-in. Equity readings are served in order; an exception is raised as read."""

    def __init__(self, timeline: list, equities: list, size: float = 0.0):
        self.timeline, self.equities, self.size = timeline, list(equities), size

    def account_equity(self):
        value = self.equities.pop(0) if len(self.equities) > 1 else self.equities[0]
        if isinstance(value, Exception):
            raise value
        return value

    def position_size(self, symbol):
        return self.size

    def place_market_order(self, symbol, side, qty):
        self.timeline.append(("order", side))


class Guard:
    enabled = True
    address = "0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D"

    def __init__(self, timeline: list):
        self.timeline = timeline

    def decide(self, symbol, target, price, drawdown):
        self.timeline.append(("decide", target, round(drawdown, 4)))
        return Verdict(allowed=True, tx="0xabc", confirmed=True)


def run_bot(monkeypatch, trade: Trade, timeline: list) -> None:
    """One pass of the loop: the first sleep stands in for Ctrl-C."""

    def ctrl_c(seconds):
        raise KeyboardInterrupt

    monkeypatch.setattr(cli, "_trade", trade)
    monkeypatch.setattr(cli, "_data", SimpleNamespace(klines=lambda *a, **k: random_walk(n=200, seed=2)))
    monkeypatch.setattr(cli, "get_strategy", lambda *a, **k: AlwaysLong())
    monkeypatch.setattr(cli, "chain_guard", Guard(timeline))
    monkeypatch.setattr(cli, "tg", SimpleNamespace(send=lambda *a, **k: None))
    monkeypatch.setattr(cli, "console", Console(file=io.StringIO()))
    monkeypatch.setattr(cli, "draw_chrome", lambda: None)
    monkeypatch.setattr(cli.time, "sleep", ctrl_c)
    cli.cmd_bot("macd", "btc")


def test_the_terminal_records_before_it_orders(monkeypatch):
    timeline: list = []
    run_bot(monkeypatch, Trade(timeline, [1000.0]), timeline)
    # decide, then the Buy; on Ctrl-C the bot flattens its position
    assert timeline == [("decide", 1, 0.0), ("order", "Buy"), ("order", "Sell")]


def test_no_fresh_equity_means_no_decision_and_no_order(monkeypatch):
    timeline: list = []
    run_bot(monkeypatch, Trade(timeline, [1000.0, ConnectionError("bybit down")]), timeline)
    assert timeline == []


def test_past_the_line_the_terminal_exits_first_then_records(monkeypatch):
    timeline: list = []
    run_bot(monkeypatch, Trade(timeline, [1000.0, 750.0], size=0.001), timeline)  # holding a Long
    assert timeline == [("order", "Sell"), ("decide", 0, -0.25)]  # no new Buy past the line
