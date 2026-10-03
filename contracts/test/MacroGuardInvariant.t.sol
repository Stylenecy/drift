// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CommonBase} from "forge-std/Base.sol";
import {StdUtils} from "forge-std/StdUtils.sol";
import {MacroGuard} from "../src/MacroGuard.sol";

/// @notice Drives MacroGuard with random sequences of agent calls (and stranger
///         attempts) and keeps ghost counters for the invariants below.
contract MacroGuardHandler is CommonBase, StdUtils {
    MacroGuard public immutable guard;
    uint64 public ghostRecords;
    uint64 public lastSeenCount;
    bool public countWentBackwards;
    uint256 public strangerWrites;

    constructor() {
        guard = new MacroGuard(2000); // the handler deploys it, so the handler is the agent
    }

    function record(uint8 signalRaw, int256 drawdownBps, uint256 price) external {
        MacroGuard.Signal signal = MacroGuard.Signal(bound(signalRaw, 0, 2));
        drawdownBps = bound(drawdownBps, -10_000, 10_000);
        guard.recordDecision("BTCUSDT", signal, price, drawdownBps);
        ghostRecords += 1;
        _observe();
    }

    function setRegime(uint8 regimeRaw) external {
        guard.setRegime(MacroGuard.Regime(bound(regimeRaw, 0, 2)));
        _observe();
    }

    function resume() external {
        guard.resume();
        _observe();
    }

    function strangerWrite(address who, uint8 which) external {
        if (who == address(this)) return;
        uint8 w = uint8(bound(which, 0, 2));
        vm.prank(who);
        if (w == 0) {
            try guard.recordDecision("BTCUSDT", MacroGuard.Signal.Long, 1, -5000) {
                strangerWrites += 1;
            } catch {}
        } else if (w == 1) {
            try guard.setRegime(MacroGuard.Regime.RiskOn) {
                strangerWrites += 1;
            } catch {}
        } else {
            try guard.resume() {
                strangerWrites += 1;
            } catch {}
        }
        _observe();
    }

    function _observe() internal {
        uint64 count = guard.decisionCount();
        if (count < lastSeenCount) countWentBackwards = true;
        lastSeenCount = count;
    }
}

contract MacroGuardInvariantTest is Test {
    MacroGuardHandler handler;
    MacroGuard guard;

    function setUp() public {
        handler = new MacroGuardHandler();
        guard = handler.guard();
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = MacroGuardHandler.record.selector;
        selectors[1] = MacroGuardHandler.setRegime.selector;
        selectors[2] = MacroGuardHandler.resume.selector;
        selectors[3] = MacroGuardHandler.strangerWrite.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_HaltedAllowsOnlyFlat() public view {
        if (guard.halted()) {
            assertFalse(guard.allowed(MacroGuard.Signal.Long));
            assertFalse(guard.allowed(MacroGuard.Signal.Short));
        }
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_FlatIsAlwaysAllowed() public view {
        assertTrue(guard.allowed(MacroGuard.Signal.Flat));
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_RiskOffBlocksLong() public view {
        if (guard.regime() == MacroGuard.Regime.RiskOff) assertFalse(guard.allowed(MacroGuard.Signal.Long));
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_DecisionCountEqualsAgentRecords() public view {
        assertEq(guard.decisionCount(), handler.ghostRecords());
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_DecisionCountNeverDecreases() public view {
        assertFalse(handler.countWentBackwards());
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_StrangersNeverWrite() public view {
        assertEq(handler.strangerWrites(), 0);
    }

    /// forge-config: default.invariant.runs = 64
    /// forge-config: default.invariant.depth = 64
    function invariant_AgentAndThresholdNeverChange() public view {
        assertEq(guard.agent(), address(handler));
        assertEq(guard.maxDrawdownBps(), 2000);
    }
}
