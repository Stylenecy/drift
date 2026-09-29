# DRIFT: Mantle to BNB Chain migration

DRIFT's only on-chain piece is `MacroGuard.sol`, a plain Solidity risk guard. It uses no Mantle-specific precompiles or tokens, so the contract logic did not change. What changed is the network config, the engine's chain settings and the branding.

## What changed

| Area | Change |
|---|---|
| `contracts/foundry.toml` | Replaced `mantle_sepolia` with `bsc_testnet` (chain 97, `https://data-seed-prebsc-1-s1.bnbchain.org:8545`) and `bsc` (chain 56, `https://bsc-dataseed.bnbchain.org`). Verification now uses Etherscan V2 with `ETHERSCAN_API_KEY`. |
| `contracts/broadcast/Deploy.s.sol/5003/` | Removed the old Mantle Sepolia deployment records. |
| `apps/trader/app/config.py` | Renamed `MANTLE_RPC_URL`, `MANTLE_CHAIN_ID` and `MANTLE_EXPLORER` to `BSC_RPC_URL`, `BSC_CHAIN_ID` and `BSC_EXPLORER`. The defaults now point to BSC Testnet (97) and `https://testnet.bscscan.com`. |
| `apps/trader/app/chain.py` | Uses the new `BSC_*` settings. The web3.py logic is unchanged. Legacy `gasPrice` transactions work on BSC. |
| `apps/trader/.env.example` | Added the BSC variables, mainnet values and a link to the faucet. |
| `apps/trader/app/cli.py`, `main.py`, web `ConfigPanel.tsx`, `AutoResearch.tsx` | Changed the watchlist symbol `MNTUSDT` to `BNBUSDT`. |
| Web UI (`LiveBots.tsx`, `PlatformShowcase.tsx`, `blog/page.tsx`, `blogs.ts`) | Changed "Mantle" to "BNB Chain". The Mantle ecosystem blog post was rewritten as "Building on BNB Chain", with no Mantle-specific TVL or token claims. Its slug is now `building-on-bnb-chain`. |
| `README.md`, `SHOWCASE.md`, `docs/drift-plan.md` | Rebranded to BNB Chain. Removed the old Mantle address `0x4011…7ab3` and marked the address as a TODO. |

## TODO

- Deploy `MacroGuard` to BSC Testnet (command below), then set `MACROGUARD_ADDRESS` in the engine env.
- Add the new address and BscScan link to `README.md` and `SHOWCASE.md` (both marked TODO).
- Fund the agent key (`ETH_PRIVATE_KEY`) with testnet BNB from https://www.bnbchain.org/en/testnet-faucet.
- For mainnet, set `BSC_RPC_URL=https://bsc-dataseed.bnbchain.org`, `BSC_CHAIN_ID=56` and `BSC_EXPLORER=https://bscscan.com`.

## Deploy to BSC Testnet

```bash
cd contracts
forge build && forge test
MAX_DRAWDOWN_BPS=2000 forge script script/Deploy.s.sol:Deploy \
  --rpc-url bsc_testnet --private-key $ETH_PRIVATE_KEY --broadcast
# optional verification
forge verify-contract <ADDRESS> src/MacroGuard.sol:MacroGuard \
  --chain 97 --constructor-args $(cast abi-encode "constructor(uint32)" 2000) \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

The deployer becomes the `agent`, so use the same key as the engine's `ETH_PRIVATE_KEY`.

## Verification done

- `forge build`: success. `forge test`: 7/7 passed.
- `python3 -m py_compile apps/trader/app/*.py`: OK.
- Did not run the web `tsc` or `next build` because `node_modules` is not installed. The web changes only touch strings and constants.
