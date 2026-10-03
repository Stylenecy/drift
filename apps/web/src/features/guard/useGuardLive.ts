"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readGuardFromChain, type ChainRead } from "./chainRead";

// One live read of MacroGuard shared by everything on a page (hero readout,
// ticker). Re-read when older than a minute. Nothing here is ever simulated: the
// values come from BSC Testnet, or the state says the read is unavailable.

export type GuardLive =
  | { status: "loading" }
  | { status: "live"; read: ChainRead; at: string }
  | { status: "offline"; error: string };

const MAX_AGE_MS = 60_000;
const LOADING: GuardLive = { status: "loading" };

let current: GuardLive = LOADING;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: GuardLive) {
  current = next;
  listeners.forEach((fn) => fn());
}

function refresh(): Promise<void> {
  if (inflight) return inflight;
  inflight = readGuardFromChain()
    .then((read) => {
      fetchedAt = Date.now();
      publish({ status: "live", read, at: new Date().toLocaleTimeString("en-GB") });
    })
    .catch((cause: unknown) => {
      fetchedAt = Date.now();
      publish({ status: "offline", error: cause instanceof Error ? cause.message : String(cause) });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useGuardLive(): GuardLive {
  const live = useSyncExternalStore(
    subscribe,
    () => current,
    () => LOADING,
  );
  useEffect(() => {
    if (current.status === "loading" || Date.now() - fetchedAt > MAX_AGE_MS) void refresh();
  }, []);
  return live;
}
