# MacroGuard contracts (Foundry)

`src/MacroGuard.sol` is DRIFT's on-chain risk gate: the stored market regime, `allowed(signal)`, the drawdown halt, decision receipts and the agent-only `resume()`. The contract is unchanged from upstream; this project added the fuzz and invariant tests and its own deployment.

- **Live (BSC Testnet, chain 97):** [`0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D`](https://testnet.bscscan.com/address/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D), source verified on [Sourcify](https://repo.sourcify.dev/97/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D) (exact match). Deploy and smoke-test receipts: [`docs/deployment-dex.md`](../docs/deployment-dex.md).
- **Upstream group deployment (25 Sep 2026):** `deployments/bsc-testnet.json`.

## Test

`forge-std` is not vendored (`lib/` is ignored). Fetch it at the commit the tests were run with, as CI does:

```shell
git init -q lib/forge-std
git -C lib/forge-std fetch -q --depth 1 https://github.com/foundry-rs/forge-std 6764d4a42fcdff8e9f6999ab94fb74c1752a0445
git -C lib/forge-std checkout -q FETCH_HEAD
forge test
forge coverage --report summary --no-match-coverage "(script|test)"
```

30 tests: 7 from upstream, and 23 added in this project (11 unit and event tests and 5 fuzz tests in `MacroGuardFuzz.t.sol`, 7 invariants over random agent and stranger call sequences in `MacroGuardInvariant.t.sol`). Coverage of `MacroGuard.sol`: 100% of lines, statements, branches and functions.

## Deploy

The deployer becomes the agent, the only key that can write. The halt line comes from `MAX_DRAWDOWN_BPS` (default 2000 = 20%).

```shell
forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast --private-key <agent key>
```

Never commit a private key; pass it on the command line or through your own Git-ignored environment.
