"""Optional on-chain guard: every bot decision goes to MacroGuard on BNB Chain before the bot acts.

When MACROGUARD_ADDRESS, ETH_PRIVATE_KEY and an RPC are configured the engine records
each decision to the contract first (a permanent, verifiable trail) and acts on the
answer in that same receipt: the contract applies its drawdown halt and macro regime,
and its `Decision` event says whether the signal is allowed. The recorded signal is
the bot's own intent, so a blocked trade shows up on-chain as `allowed = false`.

If the guard is configured but no answer can be confirmed on-chain (RPC down, the
transaction failed or reverted) it fails closed: only Flat passes. Set
MACROGUARD_FAIL_MODE=open to trade on under the local drawdown stop instead. If the
guard is not configured at all it stays inert and the local stop is the only safety.
"""
from __future__ import annotations

import threading
from dataclasses import dataclass
from typing import Optional

from .config import (
    ETH_PRIVATE_KEY,
    MACROGUARD_ADDRESS,
    MACROGUARD_FAIL_MODE,
    BSC_CHAIN_ID,
    BSC_EXPLORER,
    BSC_RPC_URL,
)

# Solidity Signal enum: Flat=0, Long=1, Short=2. The bot's target is {0, +1, -1}.
def _signal_enum(target: int) -> int:
    return 1 if target > 0 else 2 if target < 0 else 0


# Minimal ABI — only the functions the engine calls.
_ABI = [
    {
        "type": "function",
        "name": "allowed",
        "stateMutability": "view",
        "inputs": [{"name": "signal", "type": "uint8"}],
        "outputs": [{"name": "", "type": "bool"}],
    },
    {
        "type": "function",
        "name": "recordDecision",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "symbol", "type": "string"},
            {"name": "signal", "type": "uint8"},
            {"name": "price", "type": "uint256"},
            {"name": "drawdownBps", "type": "int256"},
        ],
        "outputs": [{"name": "ok", "type": "bool"}],
    },
    {
        "type": "function",
        "name": "regime",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint8"}],
    },
    *[
        {
            "type": "function",
            "name": name,
            "stateMutability": "view",
            "inputs": [],
            "outputs": [{"name": "", "type": output_type}],
        }
        for name, output_type in (
            ("agent", "address"),
            ("halted", "bool"),
            ("maxDrawdownBps", "uint32"),
            ("decisionCount", "uint64"),
        )
    ],
    {
        "type": "function",
        "name": "setRegime",
        "stateMutability": "nonpayable",
        "inputs": [{"name": "_regime", "type": "uint8"}],
        "outputs": [],
    },
    # Emitted by recordDecision; `allowed` is the contract's answer after it applied the halt rule.
    {
        "type": "event",
        "name": "Decision",
        "anonymous": False,
        "inputs": [
            {"name": "seq", "type": "uint64", "indexed": True},
            {"name": "symbol", "type": "string", "indexed": False},
            {"name": "signal", "type": "uint8", "indexed": False},
            {"name": "allowed", "type": "bool", "indexed": False},
            {"name": "price", "type": "uint256", "indexed": False},
            {"name": "drawdownBps", "type": "int256", "indexed": False},
            {"name": "regime", "type": "uint8", "indexed": False},
            {"name": "timestamp", "type": "uint64", "indexed": False},
        ],
    },
]


@dataclass(frozen=True)
class Verdict:
    """What the bot may do, and the public receipt behind the answer."""

    allowed: bool
    tx: Optional[str] = None  # 0x hash of the recordDecision receipt, when one was written
    confirmed: bool = False  # True when the answer came from a confirmed on-chain receipt


def _hex(h) -> str:
    hx = h.hex() if hasattr(h, "hex") else str(h)
    return hx if hx.startswith("0x") else f"0x{hx}"


def _when_unconfirmed(target: int) -> bool:
    """No confirmed on-chain answer: fail closed (only Flat) unless MACROGUARD_FAIL_MODE=open."""
    return True if MACROGUARD_FAIL_MODE == "open" else target == 0


class ChainGuard:
    """Thin web3 wrapper around one MacroGuard deployment."""

    def __init__(self) -> None:
        self.enabled = False
        self.address: Optional[str] = None
        self._lock = threading.Lock()
        if not MACROGUARD_ADDRESS:
            return
        try:
            from web3 import Web3

            self._w3 = Web3(Web3.HTTPProvider(BSC_RPC_URL))
            self.address = Web3.to_checksum_address(MACROGUARD_ADDRESS)
            self._contract = self._w3.eth.contract(address=self.address, abi=_ABI)
            if ETH_PRIVATE_KEY:
                from eth_account import Account

                self._account = Account.from_key(ETH_PRIVATE_KEY)
                self.enabled = True
        except Exception as e:  # missing dep / bad key — stay inert
            print(f"[drift] chain guard disabled: {e}")

    def info(self) -> dict:
        return {
            "enabled": self.enabled,
            "address": self.address,
            "chain_id": BSC_CHAIN_ID,
            "rpc": BSC_RPC_URL,
            "explorer": f"{BSC_EXPLORER}/address/{self.address}" if self.address else None,
            "explorer_base": BSC_EXPLORER,
        }

    def state(self) -> dict:
        """Read public contract state without requiring the agent's private key."""
        result = {
            "connected": False,
            "address": self.address,
            "chain_id": BSC_CHAIN_ID,
            "explorer": f"{BSC_EXPLORER}/address/{self.address}" if self.address else None,
            "agent": None,
            "regime": None,
            "halted": None,
            "max_drawdown_bps": None,
            "decision_count": None,
            "allowed": None,
            "error": None,
        }
        if not self.address:
            result["error"] = "MACROGUARD_ADDRESS is not configured"
            return result
        try:
            actual_chain_id = self._w3.eth.chain_id
            if actual_chain_id != BSC_CHAIN_ID:
                raise ValueError(f"RPC chain {actual_chain_id} does not match configured chain {BSC_CHAIN_ID}")
            if not self._w3.eth.get_code(self.address):
                raise ValueError("No contract code exists at this address")
            contract = self._contract.functions
            result.update(
                connected=True,
                agent=contract.agent().call(),
                regime=int(contract.regime().call()),
                halted=bool(contract.halted().call()),
                max_drawdown_bps=int(contract.maxDrawdownBps().call()),
                decision_count=int(contract.decisionCount().call()),
                allowed={
                    "flat": bool(contract.allowed(0).call()),
                    "long": bool(contract.allowed(1).call()),
                    "short": bool(contract.allowed(2).call()),
                },
            )
        except Exception as e:
            result["error"] = str(e)
        return result

    def allowed(self, target: int) -> bool:
        """On-chain veto check (free view call). Without an answer it follows MACROGUARD_FAIL_MODE."""
        if not self.enabled:
            return True
        try:
            return bool(self._contract.functions.allowed(_signal_enum(target)).call())
        except Exception:
            return _when_unconfirmed(target)

    def _transact(self, fn):
        """Build, sign, send and confirm a contract call.

        Returns (0x tx hash, receipt) only for a mined transaction with status 1;
        (None, None) if it could not be sent, was not confirmed in time, or reverted.
        """
        with self._lock:  # one agent key → serialise nonces across bots
            try:
                tx = fn.build_transaction(
                    {
                        "from": self._account.address,
                        "nonce": self._w3.eth.get_transaction_count(self._account.address),
                        "gas": 200_000,
                        "gasPrice": self._w3.eth.gas_price,
                        "chainId": BSC_CHAIN_ID,
                    }
                )
                signed = self._account.sign_transaction(tx)
                h = self._w3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = self._w3.eth.wait_for_transaction_receipt(h, timeout=30)
            except Exception as e:
                print(f"[drift] tx failed: {e}")
                return None, None
        if receipt["status"] != 1:
            print(f"[drift] tx reverted: {_hex(h)}")
            return None, None
        return _hex(h), receipt

    def _send(self, fn) -> Optional[str]:
        """Send a contract call; the 0x tx hash of a successful receipt, else None."""
        return self._transact(fn)[0]

    def _decision_allowed(self, receipt) -> Optional[bool]:
        """The `allowed` field of the Decision event in a recordDecision receipt."""
        try:
            from web3.logs import DISCARD

            events = self._contract.events.Decision().process_receipt(receipt, errors=DISCARD)
            return bool(events[-1]["args"]["allowed"]) if events else None
        except Exception as e:
            print(f"[drift] could not read the Decision event: {e}")
            return None

    def decide(self, symbol: str, target: int, price: float, drawdown: float) -> Verdict:
        """Record the bot's intended signal on-chain, then return the contract's answer.

        One transaction both writes the public receipt and applies the contract's rules
        (a drawdown at or past the line halts it first), so the bot acts on exactly the
        answer anyone can open on BscScan. Not configured: allowed, no receipt.
        """
        if not self.enabled:
            return Verdict(allowed=True)
        tx, receipt = self._transact(
            self._contract.functions.recordDecision(
                symbol, _signal_enum(target), int(round(price * 1e8)), int(round(drawdown * 10_000))
            )
        )
        if receipt is not None:
            ok = self._decision_allowed(receipt)
            if ok is not None:
                return Verdict(allowed=ok, tx=tx, confirmed=True)
        return Verdict(allowed=_when_unconfirmed(target), tx=tx)

    def record(self, symbol: str, target: int, price: float, drawdown: float) -> Optional[str]:
        """Log one decision on-chain. Returns the tx hash, or None if disabled/failed."""
        if not self.enabled:
            return None
        return self._send(
            self._contract.functions.recordDecision(
                symbol, _signal_enum(target), int(round(price * 1e8)), int(round(drawdown * 10_000))
            )
        )

    def set_regime(self, regime: int) -> Optional[str]:
        """Push a new macro regime on-chain (RiskOff=0, Neutral=1, RiskOn=2)."""
        if not self.enabled:
            return None
        return self._send(self._contract.functions.setRegime(int(regime)))

    def current_regime(self) -> Optional[int]:
        """Read the regime currently enforced on-chain, or None if unavailable."""
        if not self.address:
            return None
        try:
            return int(self._contract.functions.regime().call())
        except Exception:
            return None


guard = ChainGuard()
