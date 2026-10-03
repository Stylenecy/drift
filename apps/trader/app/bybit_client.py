"""Thin wrapper over pybit's V5 HTTP session.

Public market data (klines) needs no credentials; trading/wallet calls do.
Keys, when supplied, are held in memory only for the process lifetime.

Public-data fallback: a client built with ``data_fallback=True`` (the engine's
and terminal's public market-data client, never a trading client) reads klines
and tickers from Binance's public market-data API when Bybit cannot be reached.
Every frame (``df.attrs["source"]``) and ticker row (``"source"``) names where it
came from, so the API and the UI can label it. Orders always go to Bybit.
"""
from __future__ import annotations

import json
import time
from typing import Iterable, Optional

import pandas as pd
import requests
from pybit.unified_trading import HTTP

from .config import TIMEFRAMES

SOURCE_BYBIT = "bybit"
SOURCE_BINANCE = "binance"

# Binance's public market-data host (no key, read-only).
BINANCE_DATA_URL = "https://data-api.binance.vision/api/v3"

# Tickers fetched from Binance on fallback: the symbols the cockpit and terminal show.
FALLBACK_TICKER_SYMBOLS = ("BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ARBUSDT")

_FRAME_COLUMNS = ["time", "open", "high", "low", "close", "volume"]


def _frame(rows: list, symbol: str, timeframe: str) -> pd.DataFrame:
    """[start_ms, open, high, low, close, volume, ...] rows -> oldest-first OHLCV frame."""
    if not rows:
        raise ValueError(f"no kline data for {symbol} {timeframe}")
    df = pd.DataFrame(
        [row[:6] for row in rows],
        columns=["start", "open", "high", "low", "close", "volume"],
    )
    df = df.astype(
        {
            "start": "int64",
            "open": "float64",
            "high": "float64",
            "low": "float64",
            "close": "float64",
            "volume": "float64",
        }
    )
    df["time"] = (df["start"] // 1000).astype("int64")  # epoch seconds
    df = df.sort_values("time").reset_index(drop=True)
    return df[_FRAME_COLUMNS]


def binance_klines(symbol: str, timeframe: str, bars: int) -> pd.DataFrame:
    """Recent candles from Binance public data, oldest-first, same shape as BybitClient.klines.

    These are spot candles (Bybit's are linear perpetuals), so prices differ
    slightly; callers label the source instead of mixing them silently.
    """
    if timeframe not in TIMEFRAMES:
        raise ValueError(f"unsupported timeframe: {timeframe}")
    resp = requests.get(
        f"{BINANCE_DATA_URL}/klines",
        params={"symbol": symbol, "interval": timeframe, "limit": min(bars, 1000)},
        timeout=10,
    )
    resp.raise_for_status()
    return _frame(resp.json(), symbol, timeframe)


def binance_tickers(symbols: Iterable[str] = FALLBACK_TICKER_SYMBOLS) -> dict[str, dict]:
    """24h tickers from Binance public data, mapped onto Bybit's ticker field names."""
    resp = requests.get(
        f"{BINANCE_DATA_URL}/ticker/24hr",
        params={"symbols": json.dumps(list(symbols), separators=(",", ":"))},
        timeout=10,
    )
    resp.raise_for_status()
    return {
        r["symbol"]: {
            "symbol": r["symbol"],
            "lastPrice": r["lastPrice"],
            "price24hPcnt": str(float(r["priceChangePercent"]) / 100),  # Binance: percent; Bybit: fraction
            "highPrice24h": r["highPrice"],
            "lowPrice24h": r["lowPrice"],
            "turnover24h": r["quoteVolume"],
            "source": SOURCE_BINANCE,
        }
        for r in resp.json()
    }


class BybitClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        testnet: bool = True,
        data_fallback: bool = False,
    ):
        self.testnet = testnet
        self.api_key = api_key
        self.api_secret = api_secret
        # Public market data only: fall back to Binance when Bybit is unreachable.
        self.data_fallback = data_fallback
        self.session = HTTP(
            testnet=testnet,
            api_key=api_key or None,
            api_secret=api_secret or None,
        )

    # ---- public market data ----

    def klines(self, symbol: str, timeframe: str, bars: int = 720, fallback: Optional[bool] = None) -> pd.DataFrame:
        """Fetch the most recent `bars` candles, oldest-first.

        Bybit caps each request at 1000 candles, so a single call suffices here.
        ``df.attrs["source"]`` is "bybit", or "binance" when the fallback answered.
        Pass ``fallback=False`` where a live trading decision reads the candles.
        """
        if timeframe not in TIMEFRAMES:
            raise ValueError(f"unsupported timeframe: {timeframe}")
        try:
            df = self._bybit_klines(symbol, timeframe, bars)
        except Exception as primary:
            if not (self.data_fallback if fallback is None else fallback):
                raise
            try:
                df = binance_klines(symbol, timeframe, bars)
            except Exception as backup:
                raise RuntimeError(f"bybit: {primary}; binance fallback: {backup}") from backup
            df.attrs["source"] = SOURCE_BINANCE
            return df
        df.attrs["source"] = SOURCE_BYBIT
        return df

    def _bybit_klines(self, symbol: str, timeframe: str, bars: int) -> pd.DataFrame:
        resp = self.session.get_kline(
            category="linear",
            symbol=symbol,
            interval=TIMEFRAMES[timeframe],
            limit=min(bars, 1000),
        )
        # newest-first: [start, open, high, low, close, volume, turnover]
        return _frame(resp["result"]["list"], symbol, timeframe)

    def last_price(self, symbol: str) -> float:
        resp = self.session.get_tickers(category="linear", symbol=symbol)
        return float(resp["result"]["list"][0]["lastPrice"])

    def tickers(self) -> dict[str, dict]:
        """All linear-perp tickers, keyed by symbol; each row carries its "source"."""
        try:
            resp = self.session.get_tickers(category="linear")
        except Exception as primary:
            if not self.data_fallback:
                raise
            try:
                return binance_tickers()
            except Exception as backup:
                raise RuntimeError(f"bybit: {primary}; binance fallback: {backup}") from backup
        return {r["symbol"]: {**r, "source": SOURCE_BYBIT} for r in resp["result"]["list"]}

    # ---- account / trading (Phase 3) ----

    def wallet_balance(self) -> float:
        resp = self.session.get_wallet_balance(accountType="UNIFIED")
        coins = resp["result"]["list"][0]["coin"]
        usdt = next((c for c in coins if c["coin"] == "USDT"), None)
        return float(usdt["walletBalance"]) if usdt else 0.0

    def account_equity(self) -> float:
        """Total account equity in USDT, including unrealised PnL."""
        resp = self.session.get_wallet_balance(accountType="UNIFIED")
        acct = resp["result"]["list"][0]
        return float(acct.get("totalEquity") or 0.0)

    def place_market_order(self, symbol: str, side: str, qty: float) -> dict:
        resp = self.session.place_order(
            category="linear",
            symbol=symbol,
            side=side,  # "Buy" | "Sell"
            orderType="Market",
            qty=str(qty),
        )
        return resp["result"]

    def position_size(self, symbol: str) -> float:
        resp = self.session.get_positions(category="linear", symbol=symbol)
        lst = resp["result"]["list"]
        if not lst:
            return 0.0
        p = lst[0]
        size = float(p["size"] or 0)
        return size if p["side"] == "Buy" else -size
