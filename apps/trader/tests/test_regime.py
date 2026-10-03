"""The macro-regime classifier on synthetic BTC paths with known volatility and trend."""
from __future__ import annotations

import numpy as np
import pandas as pd

from app import regime


def closes(vol_early: float, vol_late: float, drift_late: float, n: int = 500, late: int = 60, seed: int = 1) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    r = np.concatenate([rng.normal(0, vol_early, n - late), rng.normal(drift_late, vol_late, late)])
    return pd.DataFrame({"close": 100 * np.exp(np.cumsum(r))})


def test_regime_codes_match_the_solidity_enum():
    # MacroGuard.sol: enum Regime { RiskOff, Neutral, RiskOn }
    assert (regime.RISK_OFF, regime.NEUTRAL, regime.RISK_ON) == (0, 1, 2)


def test_a_volatility_spike_is_risk_off():
    reg = regime.classify(closes(0.003, 0.03, 0.0, late=30))
    assert reg.vol_z > regime.VOL_Z_HOT
    assert reg.regime == regime.RISK_OFF


def test_a_calm_uptrend_is_risk_on():
    reg = regime.classify(closes(0.02, 0.002, 0.002, late=80))
    assert reg.vol_z < 0 and reg.trend > 0
    assert reg.regime == regime.RISK_ON


def test_a_calm_downtrend_stays_neutral():
    reg = regime.classify(closes(0.02, 0.002, -0.002, late=80))
    assert reg.vol_z < 0 and reg.trend < 0
    assert reg.regime == regime.NEUTRAL


def test_the_live_regime_names_its_data_source():
    class FallbackClient:
        def klines(self, symbol, timeframe, bars):
            df = closes(0.02, 0.002, 0.002, late=80)
            df.attrs["source"] = "binance"
            return df

    reg = regime.current(FallbackClient())
    assert reg.source == "binance"
    assert reg.as_dict()["source"] == "binance"


def test_a_regime_from_fallback_data_is_never_written_on_chain():
    from app.main import should_push_regime

    reg = regime.Regime(regime.RISK_OFF, "risk-off", 2.0, -0.01, 60000.0, source="binance")
    assert should_push_regime(reg, regime.NEUTRAL) is False  # changed, but classified from Binance data
    reg.source = "bybit"
    assert should_push_regime(reg, regime.NEUTRAL) is True
    assert should_push_regime(reg, regime.RISK_OFF) is False  # unchanged: nothing to write
    assert should_push_regime(reg, None) is False  # on-chain regime unreadable


def test_one_regime_tick_writes_only_bybit_classified_changes(monkeypatch):
    """A full pass of the engine's regime loop, with a fake chain guard in place of the contract."""
    import asyncio

    import app.main as main

    class FakeGuard:
        enabled = True

        def __init__(self):
            self.writes = []

        def current_regime(self):
            return regime.NEUTRAL

        def set_regime(self, value):
            self.writes.append(value)
            return "0xtx"

    sent = []
    monkeypatch.setattr(main.tg, "send", lambda text: sent.append(text))
    for source, expected in (("binance", []), ("bybit", [regime.RISK_OFF])):
        guard = FakeGuard()
        monkeypatch.setattr(main, "chain_guard", guard)
        reg = regime.Regime(regime.RISK_OFF, "risk-off", 2.0, -0.01, 60000.0, source=source)
        monkeypatch.setattr(main.regime_engine, "current", lambda client, reg=reg: reg)
        asyncio.run(main.regime_tick())
        assert guard.writes == expected, source
        assert main._regime is reg  # shown either way, labelled with its source
    assert len(sent) == 1 and "data bybit" in sent[0]
