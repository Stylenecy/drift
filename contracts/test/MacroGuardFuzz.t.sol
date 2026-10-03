// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {MacroGuard} from "../src/MacroGuard.sol";

/// @notice Edge, event and fuzz tests for MacroGuard. The contract itself is
///         unchanged (its source is verified on Sourcify); these tests only
///         pin down what it already does, including its limits.
contract MacroGuardFuzzTest is Test {
    MacroGuard guard;
    address constant STRANGER = address(0xBEEF);
    uint64 constant T0 = 1_790_000_000;

    function setUp() public {
        vm.warp(T0);
        guard = new MacroGuard(2000); // 20% drawdown halt, as deployed on BSC Testnet
    }

    // ------------------------------------------------------------- unit --

    function test_DeployStateMatchesTheDeploymentRecord() public view {
        assertEq(guard.agent(), address(this));
        assertEq(uint8(guard.regime()), uint8(MacroGuard.Regime.Neutral));
        assertFalse(guard.halted());
        assertEq(guard.maxDrawdownBps(), 2000);
        assertEq(guard.decisionCount(), 0);
    }

    function test_OnlyAgentCanResume() public {
        guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 64000e8, -2500);
        vm.prank(STRANGER);
        vm.expectRevert(MacroGuard.NotAgent.selector);
        guard.resume();
        assertTrue(guard.halted());
    }

    function test_HaltBlocksShortAsWellAsLong() public {
        // Mirrors the 30 Sep 2026 smoke test: Short at -25% trips the halt.
        bool ok = guard.recordDecision("BNBUSDT", MacroGuard.Signal.Short, 600e8, -2500);
        assertFalse(ok);
        assertTrue(guard.halted());
        assertFalse(guard.allowed(MacroGuard.Signal.Long));
        assertFalse(guard.allowed(MacroGuard.Signal.Short));
        assertTrue(guard.allowed(MacroGuard.Signal.Flat));
    }

    function test_HaltPersistsWhenDrawdownRecovers() public {
        guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 64000e8, -2000);
        bool ok = guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 70000e8, 0);
        assertFalse(ok);
        assertTrue(guard.halted());
        ok = guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 70000e8, 500);
        assertFalse(ok, "only resume() clears a halt, not a recovered drawdown");
    }

    function test_BlockedSignalIsStillRecorded() public {
        guard.setRegime(MacroGuard.Regime.RiskOff);
        vm.expectEmit(true, true, true, true, address(guard));
        emit MacroGuard.Decision(1, "ETHUSDT", MacroGuard.Signal.Long, false, 3200e8, -100, MacroGuard.Regime.RiskOff, T0);
        bool ok = guard.recordDecision("ETHUSDT", MacroGuard.Signal.Long, 3200e8, -100);
        assertFalse(ok);
        assertEq(guard.decisionCount(), 1);
    }

    function test_DecisionEventCarriesTheFullRecord() public {
        vm.expectEmit(true, true, true, true, address(guard));
        emit MacroGuard.Decision(1, "BTCUSDT", MacroGuard.Signal.Short, true, 65000e8, -150, MacroGuard.Regime.Neutral, T0);
        guard.recordDecision("BTCUSDT", MacroGuard.Signal.Short, 65000e8, -150);
    }

    function test_BreachEmitsHaltedBeforeTheDecision() public {
        vm.expectEmit(true, true, true, true, address(guard));
        emit MacroGuard.Halted(-2500);
        vm.expectEmit(true, true, true, true, address(guard));
        emit MacroGuard.Decision(1, "BNBUSDT", MacroGuard.Signal.Short, false, 600e8, -2500, MacroGuard.Regime.Neutral, T0);
        guard.recordDecision("BNBUSDT", MacroGuard.Signal.Short, 600e8, -2500);
    }

    function test_SecondBreachWhileHaltedEmitsNoNewHalt() public {
        guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 64000e8, -2500);
        vm.recordLogs();
        guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 60000e8, -4000);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 1, "only the Decision log");
        assertEq(logs[0].topics[0], MacroGuard.Decision.selector);
    }

    function test_RegimeSetAndResumedAreLogged() public {
        vm.expectEmit(true, true, true, true, address(guard));
        emit MacroGuard.RegimeSet(MacroGuard.Regime.RiskOff);
        guard.setRegime(MacroGuard.Regime.RiskOff);
        vm.expectEmit(true, true, true, true, address(guard));
        emit MacroGuard.Resumed();
        guard.resume();
    }

    function test_ResumeKeepsTheRegime() public {
        guard.setRegime(MacroGuard.Regime.RiskOff);
        guard.recordDecision("BTCUSDT", MacroGuard.Signal.Short, 64000e8, -2500);
        guard.resume();
        assertFalse(guard.halted());
        assertEq(uint8(guard.regime()), uint8(MacroGuard.Regime.RiskOff));
        assertFalse(guard.allowed(MacroGuard.Signal.Long));
        assertTrue(guard.allowed(MacroGuard.Signal.Short));
    }

    function test_ZeroThresholdHaltsOnTheFirstNonPositiveDrawdown() public {
        // Deploy-parameter edge: with maxDrawdownBps = 0 a flat book (drawdown 0) already halts.
        MacroGuard strict = new MacroGuard(0);
        strict.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 65000e8, 0);
        assertTrue(strict.halted());
    }

    // ------------------------------------------------------------- fuzz --

    function testFuzz_AllowedMatrix(uint8 regimeRaw, bool halt, uint8 signalRaw) public {
        MacroGuard.Regime regime = MacroGuard.Regime(bound(regimeRaw, 0, 2));
        MacroGuard.Signal signal = MacroGuard.Signal(bound(signalRaw, 0, 2));
        guard.setRegime(regime);
        if (halt) guard.recordDecision("BTCUSDT", MacroGuard.Signal.Flat, 1, -2000);

        bool expected;
        if (halt) expected = signal == MacroGuard.Signal.Flat;
        else if (regime == MacroGuard.Regime.RiskOff) expected = signal != MacroGuard.Signal.Long;
        else expected = true;
        assertEq(guard.allowed(signal), expected);
    }

    function testFuzz_HaltThreshold(uint32 maxBps, int256 drawdownBps) public {
        MacroGuard g = new MacroGuard(maxBps);
        g.recordDecision("BTCUSDT", MacroGuard.Signal.Flat, 1, drawdownBps);
        assertEq(g.halted(), drawdownBps <= -int256(uint256(maxBps)));
    }

    function testFuzz_RecordReturnsTheGateAfterTheUpdate(uint8 regimeRaw, uint8 signalRaw, int256 drawdownBps) public {
        guard.setRegime(MacroGuard.Regime(bound(regimeRaw, 0, 2)));
        MacroGuard.Signal signal = MacroGuard.Signal(bound(signalRaw, 0, 2));
        bool ok = guard.recordDecision("BTCUSDT", signal, 1, drawdownBps);
        assertEq(ok, guard.allowed(signal));
        assertEq(guard.decisionCount(), 1);
    }

    function testFuzz_NobodyButTheAgentCanWrite(address caller, uint8 which) public {
        vm.assume(caller != address(this));
        uint8 w = uint8(bound(which, 0, 2));
        vm.prank(caller);
        vm.expectRevert(MacroGuard.NotAgent.selector);
        if (w == 0) guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 1, 0);
        else if (w == 1) guard.setRegime(MacroGuard.Regime.RiskOff);
        else guard.resume();
    }

    function testFuzz_OutOfRangeSignalIsRejected(uint8 raw) public {
        raw = uint8(bound(raw, 3, type(uint8).max));
        (bool success,) = address(guard).call(
            abi.encodeWithSelector(MacroGuard.recordDecision.selector, "BTCUSDT", raw, uint256(1), int256(0))
        );
        assertFalse(success);
        assertEq(guard.decisionCount(), 0);
    }
}
