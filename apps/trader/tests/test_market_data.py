"""Public market data: Bybit first, Binance public data as a labelled fallback, never for live trading."""
from __future__ import annotations

import json

import pytest
import requests

from app import bybit_client as bc


class DeadSession:
    """pybit session for a network where Bybit is unreachable."""

    def get_kline(self, **kwargs):
        raise ConnectionError("api.bybit.com unreachable")

    def get_tickers(self, **kwargs):
        raise ConnectionError("api.bybit.com unreachable")


class FakeResponse:
    def __init__(self, payload, status: int = 200):
        self.payload, self.status = payload, status

    def raise_for_status(self):
        if self.status >= 400:
            raise requests.HTTPError(f"HTTP {self.status}")

    def json(self):
        return self.payload


# Binance /api/v3/klines rows: [open time ms, open, high, low, close, volume, close time, quote volume, ...]
BINANCE_KLINES = [
    [1_790_000_000_000 + i * 3_600_000, "100.0", "103.0", "99.0", f"{100 + i}.0", "5.0", 0, "500.0", 10, "1", "1", "0"]
    for i in range(3)
]


def make_client(fallback: bool = True, session=None) -> bc.BybitClient:
    client = bc.BybitClient(testnet=False, data_fallback=fallback)
    client.session = session or DeadSession()
    return client


def test_klines_fall_back_to_binance_and_say_so(monkeypatch):
    calls = []

    def fake_get(url, params, timeout):
        calls.append((url, params))
        return FakeResponse(BINANCE_KLINES)

    monkeypatch.setattr(bc.requests, "get", fake_get)
    df = make_client().klines("BTCUSDT", "1h", 3)
    assert df.attrs["source"] == "binance"
    assert list(df.columns) == ["time", "open", "high", "low", "close", "volume"]
    assert df["time"].tolist() == [1_790_000_000 + i * 3600 for i in range(3)]
    assert df["close"].tolist() == [100.0, 101.0, 102.0]
    assert calls == [(f"{bc.BINANCE_DATA_URL}/klines", {"symbol": "BTCUSDT", "interval": "1h", "limit": 3})]


def test_bybit_answers_first_when_it_is_reachable(monkeypatch):
    class LiveSession:
        def get_kline(self, **kwargs):  # Bybit lists newest first
            return {"result": {"list": [
                ["1790003600000", "1", "2", "0.5", "1.5", "3", "4"],
                ["1790000000000", "1", "2", "0.5", "1.2", "3", "4"],
            ]}}

    monkeypatch.setattr(bc.requests, "get", lambda *a, **k: pytest.fail("Binance must not be called"))
    df = make_client(session=LiveSession()).klines("BTCUSDT", "1h", 2)
    assert df.attrs["source"] == "bybit"
    assert df["close"].tolist() == [1.2, 1.5]  # oldest first


def test_trading_paths_never_fall_back(monkeypatch):
    monkeypatch.setattr(bc.requests, "get", lambda *a, **k: pytest.fail("Binance must not be called"))
    with pytest.raises(ConnectionError):
        make_client(fallback=False).klines("BTCUSDT", "1h", 3)
    # The terminal's live bot loop opts out explicitly on the shared public client.
    with pytest.raises(ConnectionError):
        make_client().klines("BTCUSDT", "1h", 3, fallback=False)


def test_tickers_fall_back_in_bybit_field_names(monkeypatch):
    payload = [{
        "symbol": "BTCUSDT", "lastPrice": "65000.5", "priceChangePercent": "-1.250",
        "highPrice": "66000", "lowPrice": "64000", "quoteVolume": "123456",
    }]
    seen = {}

    def fake_get(url, params, timeout):
        seen.update(url=url, params=params)
        return FakeResponse(payload)

    monkeypatch.setattr(bc.requests, "get", fake_get)
    rows = make_client().tickers()
    assert rows["BTCUSDT"] == {
        "symbol": "BTCUSDT",
        "lastPrice": "65000.5",
        "price24hPcnt": "-0.0125",  # Binance reports percent, Bybit a fraction
        "highPrice24h": "66000",
        "lowPrice24h": "64000",
        "turnover24h": "123456",
        "source": "binance",
    }
    assert seen["url"] == f"{bc.BINANCE_DATA_URL}/ticker/24hr"
    assert json.loads(seen["params"]["symbols"]) == list(bc.FALLBACK_TICKER_SYMBOLS)


def test_when_both_sources_fail_the_error_names_both(monkeypatch):
    def down(*args, **kwargs):
        raise requests.ConnectionError("data-api.binance.vision unreachable")

    monkeypatch.setattr(bc.requests, "get", down)
    with pytest.raises(RuntimeError, match=r"bybit: .*unreachable; binance fallback: .*unreachable"):
        make_client().klines("BTCUSDT", "1h", 3)
