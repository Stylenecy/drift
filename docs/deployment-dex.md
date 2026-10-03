# Dex BSC Testnet Deployment

Status: DEPLOYED and smoke-tested (2026-09-30)

Network: BSC Testnet
Chain ID: 97
Deployer:
0x2B07AfB54068042664074781Af36163aC6714b81

MacroGuard:
0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D
BscScan: https://testnet.bscscan.com/address/0x8b09ebB85Be8Ed55Bb5132d29eABc567c42aa83D

maxDrawdownBps:
2000 (verified on-chain, 20%)

Deployment transaction:
0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044
BscScan: https://testnet.bscscan.com/tx/0x2d8cce2de583424a45e8de176c1b79438cdf54f7a016ae0cfc6c4ca86078c044

Deployment block:
133995398

Receipt status: 1 (success)
Gas used: 449207
Effective gas price: 100000000 wei (0.1 gwei)
Actual cost: ~0.0000449207 tBNB

## On-chain verification (post-deploy reads)

- code exists at address: YES (3448 chars)
- agent(): 0x2B07AfB54068042664074781Af36163aC6714b81 (matches deployer)
- maxDrawdownBps(): 2000
- regime: Neutral (1, initial)
- halted: false (initial)
- decisionCount: 0 (initial)

## Smoke Test

All smoke-test transactions executed 2026-09-30 from Dex deployer wallet on BSC Testnet chain 97. All receipts status 1.

### Initial state
Neutral (1), halted false, decisionCount 0, Long/Short/Flat all allowed. Verified via `cast call` before first tx.

### setRegime(RiskOff)
Tx:
0x563f1eee78fee6a0b532c6ae50ab5de05667e7d64bb573ddc21596b9d2376858
BscScan: https://testnet.bscscan.com/tx/0x563f1eee78fee6a0b532c6ae50ab5de05667e7d64bb573ddc21596b9d2376858

Result:
status 1, block 134042196, gas 27790. Regime=RiskOff verified; allowed(Long)=false, allowed(Short)=true, allowed(Flat)=true.

### allowed(Long)
false under RiskOff (verified via `cast call` after RiskOff tx).

### safe recordDecision
Tx (BNB, Short, drawdown -100, within threshold):
0x7a5185e4beb1c51f6c1fcaeb7614df88a5dd72357caa38ab7e15956500ab4810
BscScan: https://testnet.bscscan.com/tx/0x7a5185e4beb1c51f6c1fcaeb7614df88a5dd72357caa38ab7e15956500ab4810
status 1, block 134042256, gas 33189. Decision seq 1 recorded allowed=true; halted still false.

### drawdown breach / halt
Tx (BNB, Short, drawdown -2500, beyond 2000 threshold):
0x8e346d74c06c53f2f8914c86c4be9e45c49ea99a54e41ece6fc53a018e3b62ef
BscScan: https://testnet.bscscan.com/tx/0x8e346d74c06c53f2f8914c86c4be9e45c49ea99a54e41ece6fc53a018e3b62ef
status 1, block 134042283, gas 34323. Halted event + Decision seq 2 emitted; halted=true, decisionCount=2, only Flat allowed (Short now false).

### resume
Tx:
0xda579ebbf2969b855fe50b4520593fb267e33f4db062e0c71c48ca64b18d18ae
BscScan: https://testnet.bscscan.com/tx/0xda579ebbf2969b855fe50b4520593fb267e33f4db062e0c71c48ca64b18d18ae
status 1, block 134042318, gas 27030. Resumed event emitted.

### setRegime(Neutral)
Tx:
0xa846652354020a77b8c24ef8bb3e088ccecb63f4c2c3267c0a4377c57a39486b
BscScan: https://testnet.bscscan.com/tx/0xa846652354020a77b8c24ef8bb3e088ccecb63f4c2c3267c0a4377c57a39486b
status 1, block 134042328, gas 27802. Final state: regime Neutral, halted false, allowed(Long)=true, decisionCount=2.

### unauthorized caller test
Result:
REVERT as expected. `eth_call` simulation of `setRegime(2)` from `0x000000000000000000000000000000000000dEaD` reverted with `0x0d9ab13f` (`NotAgent()`). No broadcast, no gas spent.
