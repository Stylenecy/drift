"""ChainGuard, the engine's MacroGuard client: what it reads, what it sends, and how it fails closed."""
from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

from app import chain
from app.chain import _ABI, ChainGuard, Verdict, _signal_enum

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
    assert g.decide("BTCUSDT", 1, 65000.0, -0.1) == Verdict(allowed=True)  # no guard: the local stop only
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


def test_allowed_fails_closed_when_the_rpc_is_down(monkeypatch):
    """No answer from BNB Chain: no new risk. Only Flat (exit) passes."""
    monkeypatch.setattr(chain, "MACROGUARD_FAIL_MODE", "closed")
    g = guard_with({"allowed": lambda signal: FakeCall(error=ConnectionError("rpc unreachable"))})
    assert [g.allowed(t) for t in (1, -1, 0)] == [False, False, True]


def test_fail_mode_open_keeps_the_earlier_behaviour(monkeypatch):
    """MACROGUARD_FAIL_MODE=open: trade on under the local drawdown stop (the behaviour before 7 Oct 2026)."""
    monkeypatch.setattr(chain, "MACROGUARD_FAIL_MODE", "open")
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


# Two real recordDecision receipts from the 30 Sep 2026 on-chain test of 0x8b09…a83D (BSC Testnet):
# decision #1, Short at -1% under risk-off (allowed), and decision #2, Short at -25% (the breach: halted).
RECEIPTS = json.loads((Path(__file__).parent / "fixtures_macroguard_receipts.json").read_text())
SAFE = "0x7a5185e4beb1c51f6c1fcaeb7614df88a5dd72357caa38ab7e15956500ab4810"
BREACH = "0x8e346d74c06c53f2f8914c86c4be9e45c49ea99a54e41ece6fc53a018e3b62ef"


def real_receipt(tx: str):
    from hexbytes import HexBytes
    from web3.datastructures import AttributeDict

    r = RECEIPTS[tx]
    logs = [
        AttributeDict(
            {
                **log,
                "topics": [HexBytes(t) for t in log["topics"]],
                "data": HexBytes(log["data"]),
                "transactionHash": HexBytes(log["transactionHash"]),
                "blockHash": HexBytes(log["blockHash"]),
            }
        )
        for log in r["logs"]
    ]
    return AttributeDict({**r, "logs": logs})


def decoding_guard() -> ChainGuard:
    """A guard whose contract object is real web3 (offline), so events decode for real."""
    from web3 import Web3

    g = ChainGuard()
    g.enabled = True
    g.address = ADDRESS
    g._contract = Web3().eth.contract(address=ADDRESS, abi=_ABI)
    return g


def test_decide_acts_on_the_answer_in_the_receipt(monkeypatch):
    g = decoding_guard()
    for tx, allowed in ((SAFE, True), (BREACH, False)):
        monkeypatch.setattr(g, "_transact", lambda fn, tx=tx: (tx, real_receipt(tx)))
        assert g.decide("BNB", -1, 97500.0, -0.01) == Verdict(allowed=allowed, tx=tx, confirmed=True)


def test_decide_fails_closed_without_a_confirmed_receipt(monkeypatch):
    monkeypatch.setattr(chain, "MACROGUARD_FAIL_MODE", "closed")
    g = decoding_guard()
    monkeypatch.setattr(g, "_transact", lambda fn: (None, None))  # not sent, timed out or reverted
    assert g.decide("BNB", 1, 97500.0, 0.0) == Verdict(allowed=False)
    assert g.decide("BNB", 0, 97500.0, 0.0) == Verdict(allowed=True)  # exits always pass


def test_a_reverted_transaction_is_not_a_receipt():
    g = ChainGuard()
    g._account = SimpleNamespace(address=AGENT, sign_transaction=lambda tx: SimpleNamespace(raw_transaction=b"signed"))
    g._w3 = SimpleNamespace(
        eth=SimpleNamespace(
            get_transaction_count=lambda address, block_identifier=None: 7,
            gas_price=100_000_000,
            send_raw_transaction=lambda raw: bytes.fromhex("ab" * 32),
            wait_for_transaction_receipt=lambda h, timeout: {"status": 0},
        )
    )
    fn = SimpleNamespace(build_transaction=lambda params: params)
    assert g._transact(fn) == (None, None)
    assert g._send(fn) is None


def test_an_unconfirmed_transaction_keeps_its_hash_but_gives_no_answer(monkeypatch):
    """Sent but not mined in time: the hash is kept (it may still land), the bot holds Flat."""
    monkeypatch.setattr(chain, "MACROGUARD_FAIL_MODE", "closed")

    def too_slow(h, timeout):
        raise TimeoutError("not mined within 30 s")

    g = decoding_guard()
    g._account = SimpleNamespace(address=AGENT, sign_transaction=lambda tx: SimpleNamespace(raw_transaction=b"signed"))
    g._w3 = SimpleNamespace(
        eth=SimpleNamespace(
            get_transaction_count=lambda address, block_identifier=None: 7,
            gas_price=100_000_000,
            send_raw_transaction=lambda raw: bytes.fromhex("cd" * 32),
            wait_for_transaction_receipt=too_slow,
        )
    )
    verdict = g.decide("BNB", 1, 97500.0, 0.0)
    assert verdict == Verdict(allowed=False, tx="0x" + "cd" * 32, confirmed=False)
    assert g._send(SimpleNamespace(build_transaction=lambda params: params)) is None  # no confirmed receipt
