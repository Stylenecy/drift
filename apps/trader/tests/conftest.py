"""Offline test setup for the DRIFT engine.

Two rules hold for every test:
1. No developer secrets. `app/config.py` loads `.env.local` (from the working
   directory and from `drift/`) when python-dotenv is installed, so loading is
   switched off and the relevant variables are cleared *before* `app` is imported.
2. No network. Any socket connect beyond loopback raises, so a test that silently
   reaches Bybit, Binance or an RPC fails loudly instead of passing on live data.
"""
from __future__ import annotations

import os
import socket
import sys
from pathlib import Path

for _key in (
    "ETH_PRIVATE_KEY",
    "MACROGUARD_ADDRESS",
    "MACROGUARD_FAIL_MODE",
    "BYBIT_API_KEY",
    "BYBIT_API_SECRET",
    "BYBIT_READ_API_KEY",
    "BYBIT_READ_SECRET",
    "OPENROUTER_API_KEY",
    "NVIDIA_API_KEY",
    "LLM_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_TOKEN",
    "TELEGRAM_CHAT_ID",
):
    os.environ.pop(_key, None)

try:
    import dotenv

    dotenv.load_dotenv = lambda *args, **kwargs: False  # never read a real .env.local
except ImportError:
    pass

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # apps/trader -> `import app`


LOOPBACK = {"127.0.0.1", "::1", "localhost"}
_real_connect = socket.socket.connect
_real_getaddrinfo = socket.getaddrinfo


def _connect(self, address):
    # Loopback stays open: asyncio on Windows builds its self-pipe from a local socket pair.
    if isinstance(address, tuple) and address[0] in LOOPBACK:
        return _real_connect(self, address)
    raise RuntimeError(f"network access attempted in an offline test: {address!r}")


def _getaddrinfo(host, *args, **kwargs):
    if host is None or host in LOOPBACK:
        return _real_getaddrinfo(host, *args, **kwargs)
    raise RuntimeError(f"DNS lookup attempted in an offline test: {host!r}")


# Patched at import time, so the guard also covers collection and module-level code,
# for the whole session.
socket.socket.connect = _connect
socket.getaddrinfo = _getaddrinfo
