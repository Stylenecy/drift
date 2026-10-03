import type { StrategyInfo } from "../types";

export function StrategyLibrary({
  strategies,
  selectedId,
  onSelect,
}: {
  strategies: StrategyInfo[];
  selectedId: string | null;
  onSelect: (s: StrategyInfo) => void;
}) {
  return (
    <ul className="space-y-2">
      {strategies.map((s) => {
        const active = s.id === selectedId;
        return (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s)}
              className={`w-full border px-3 py-2.5 text-left transition ${
                active
                  ? "border-engine/40 bg-bone/[0.07]"
                  : "border-[var(--line)] bg-bone/[0.03] hover:bg-bone/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-bone">{s.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-mute">
                  {s.type}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-mute">{s.blurb}</p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
