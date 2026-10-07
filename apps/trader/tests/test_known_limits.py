"""Upstream behaviour found while writing these tests, pinned here instead of silently changed.

- A bug: BNBUSDT is listed twice in MARKET_SYMBOLS (app/main.py and app/cli.py).
  Marked xfail(strict=True): the suite stays green, and it turns red the day the
  list is fixed so this note gets removed.

(Fixed on 7 Oct 2026 and now tested in test_live_runner.py: the runner used to record a
vetoed signal as Flat, after the order; it now records the bot's own intent first.)
"""
from __future__ import annotations

import pytest

import app.main as main


@pytest.mark.xfail(strict=True, reason="known upstream issue: BNBUSDT is listed twice in MARKET_SYMBOLS")
def test_market_symbols_are_unique():
    assert len(set(main.MARKET_SYMBOLS)) == len(main.MARKET_SYMBOLS)
