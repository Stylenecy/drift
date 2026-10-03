"""FastAPI surface, offline: market data and the chain are faked at the module boundary."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.main as main
from synthetic import random_walk

# Not used as a context manager, so startup tasks (regime loop, Telegram) never run.
client = TestClient(main.app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_guard_state_returns_what_the_panel_reads(monkeypatch):
    fixed = {
        "connected": True,
        "address": "0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D",
        "chain_id": 97,
        "explorer": "https://testnet.bscscan.com/address/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D",
        "agent": "0x2B07AfB54068042664074781Af36163aC6714b81",
        "regime": 1,
        "halted": False,
        "max_drawdown_bps": 2000,
        "decision_count": 2,
        "allowed": {"flat": True, "long": True, "short": True},
        "error": None,
    }
    monkeypatch.setattr(main.chain_guard, "state", lambda: fixed)
    r = client.get("/guard/state")
    assert r.status_code == 200
    assert r.json() == fixed


@pytest.mark.parametrize("source", ["bybit", "binance"])
def test_backtest_names_its_data_source(monkeypatch, source):
    df = random_walk(n=300, seed=4)
    df.attrs["source"] = source
    monkeypatch.setattr(main._public, "klines", lambda symbol, timeframe, bars: df)
    r = client.get("/backtest?strategy=macd&symbol=BTCUSDT&timeframe=1h&bars=300")
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == source
    assert len(body["equity_curve"]) == 300


def test_market_data_failure_is_a_502_that_names_both_sources(monkeypatch):
    def fail(*args, **kwargs):
        raise RuntimeError("bybit: unreachable; binance fallback: unreachable")

    monkeypatch.setattr(main._public, "klines", fail)
    r = client.get("/klines?symbol=BTCUSDT&timeframe=1h&bars=50")
    assert r.status_code == 502
    assert "binance fallback" in r.json()["detail"]
