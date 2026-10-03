"use client";

import { useState } from "react";
import { AutoResearch } from "./AutoResearch";
import { Cockpit } from "./Cockpit";

export function Research() {
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  return (
    <div className="space-y-4">
      <div className="inline-flex border border-[var(--line)] bg-bone/[0.03] p-0.5">
        {(["auto", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={` px-3 py-1.5 text-[12px] font-medium transition ${
              mode === m ? "bg-engine text-ink" : "text-mute hover:text-bone"
            }`}
          >
            {m === "auto" ? "Auto-Research" : "Manual"}
          </button>
        ))}
      </div>
      {mode === "auto" ? <AutoResearch /> : <Cockpit />}
    </div>
  );
}
