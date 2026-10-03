"""ChainGuard, the engine's MacroGuard client: what it reads, what it sends, and its fail-open limit."""
from __future__ import annotations

from types import SimpleNamespace

from app.chain import ChainGuard, _signal_enum

ADDRESS = "0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D"
AGENT = "0x2B07AfB54068042664074781Af36163aC6714b81"


class FakeCall:
    def __init__(self, value=None, error: Exception | None = None):
        self.value, self.error = value, error

    def call(self):
        if self.error:
            raise self.error
        return self.value


def guard_with(functions: dict, chain_id: int = 97, enabled: bool = True) -> ChainGuard:
    g = ChainGuard()  # no MACROGUARD_ADDRESS in tests: starts inert, then gets fakes
    g.enabled = enabled
    g.address = ADDRESS
    g._w3 = SimpleNamespace(eth=SimpleNamespace(chain_id=chain_id, get_code=lambda address: b"\x60\x80"))
    g._contract = SimpleNamespace(functions=SimpleNamespace(**functions))
    return g


def test_without_an_address_the_guard_is_inert_and_says_why():
    g = ChainGuard()
    assert g.enabled is False
    assert g.allowed(1) is True
    assert g.record("BTCUSDT", 1, 65000.0, -0.1) is None
    state = g.state()
    assert state["connected"] is False
    assert state["error"] == "MACROGUARD_ADDRESS is not configured"


def test_signals_map_onto_the_solidity_enum():
    # MacroGuard.sol: enum Signal { Flat, Long, Short }; the bot's targets are {0, +1, -1}.
    assert [_signal_enum(t) for t in (0, 1, -1)] == [0, 1, 2]


def test_allowed_passes_the_contract_answer_through():
    g = guard_with({"allowed": lambda signal: FakeCall(signal != 1)})  # risk-off: Long vetoed
    assert g.allowed(1) is False
    assert g.allowed(-1) is True
    assert g.allowed(0) is True


def test_allowed_fails_open_when_the_rpc_is_down():
    """Documented limit: chain trouble never blocks a trade; the runner falls back to its local stop."""
    g = guard_with({"allowed": lambda signal: FakeCall(error=ConnectionError("rpc unreachable"))})
    assert g.allowed(1) is True


def test_state_reads_the_contract_into_the_panel_shape():
    g = guard_with(
        {
            "agent": lambda: FakeCall(AGENT),
            "regime": lambda: FakeCall(1),
            "halted": lambda: FakeCall(False),
            "maxDrawdownBps": lambda: FakeCall(2000),
            "decisionCount": lambda: FakeCall(2),
            "allowed": lambda signal: FakeCall(True),
        },
        enabled=False,  # reading needs no key
    )
    assert g.state() == {
        "connected": True,
        "address": ADDRESS,
        "chain_id": 97,
        "explorer": f"https://testnet.bscscan.com/address/{ADDRESS}",
        "agent": AGENT,
        "regime": 1,
        "halted": False,
        "max_drawdown_bps": 2000,
        "decision_count": 2,
        "allowed": {"flat": True, "long": True, "short": True},
        "error": None,
    }


def test_state_refuses_a_node_on_the_wrong_chain():
    g = guard_with({}, chain_id=56)
    state = g.state()
    assert state["connected"] is False
    assert "does not match configured chain 97" in state["error"]


def test_record_scales_price_and_drawdown_for_the_contract(monkeypatch):
    g = guard_with({"recordDecision": lambda *args: args})
    monkeypatch.setattr(g, "_send", lambda fn: fn)  # capture the call instead of signing
    assert g.record("BTCUSDT", -1, 65000.5, -0.2) == ("BTCUSDT", 2, 6_500_050_000_000, -2000)
