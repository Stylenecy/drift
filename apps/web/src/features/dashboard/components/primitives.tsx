import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------- PageHead -- */
// Every cockpit page opens the same way: index, bracket label, title with one
// serif-italic phrase, one line of context. Runs on first paint with CSS only.
export function PageHead({
  index,
  label,
  title,
  accent,
  children,
}: {
  index: string;
  label: string;
  title: string;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--line)] pb-6">
      <div className="ld-fade flex items-center gap-4" style={{ "--d": "0.05s" } as CSSProperties}>
        <span className="meta text-mute tnum">{index} / 06</span>
        <span className="bracket">({label})</span>
      </div>
      <h1 className="ld-lines display-3 mt-4 text-bone" aria-label={accent ? `${title} ${accent}` : title}>
        <span className="ln">
          <span className="ln-i" style={{ "--i": 0 } as CSSProperties}>
            {title} {accent && <span className="serif-i">{accent}</span>}
          </span>
        </span>
      </h1>
      {children && (
        <div className="ld-up mt-3 max-w-[70ch] text-[14px] leading-relaxed text-mute" style={{ "--d": "0.35s" } as CSSProperties}>
          {children}
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ Card -- */
export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`hud border border-[var(--line)] bg-slate-1/35 ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="truncate text-[13px] font-semibold text-bone">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-mute">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------- SectionHeader -- */
export function SectionHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`meta text-mute ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------- StatTile -- */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="border border-[var(--line)] bg-slate-1/35 px-3 py-2.5">
      <div className="meta text-mute">{label}</div>
      <div className={`mt-1 font-mono text-lg tabular-nums ${accent ? "text-ok" : "text-bone"}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-mute">{hint}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- Badge -- */
const badgeTones = {
  zinc: "border-[var(--line-strong)] bg-bone/[0.05] text-mute",
  lime: "border-engine/35 bg-engine/10 text-engine",
  green: "border-ok/35 bg-ok/10 text-ok",
  amber: "border-warn/35 bg-warn/10 text-warn",
  rose: "border-veto/45 bg-veto/10 text-veto-soft",
} as const;

export function Badge({
  children,
  tone = "zinc",
  dot,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  dot?: boolean;
}) {
  return (
    <span className={`meta inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] ${badgeTones[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Button -- */
const btnVariants = {
  primary: "bg-engine text-ink hover:bg-engine/85 disabled:opacity-40",
  lime: "bg-engine text-ink hover:bg-engine/85 disabled:opacity-40",
  outline: "border border-[var(--line-strong)] bg-bone/[0.03] text-bone/90 hover:border-bone/40 hover:bg-bone/[0.07] disabled:opacity-40",
  ghost: "text-mute hover:bg-bone/[0.06] hover:text-bone",
} as const;

export function Button({
  children,
  variant = "outline",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: keyof typeof btnVariants;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${btnVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ Awaiting -- */
// Honest empty state — shown wherever a data source isn't configured.
export function Awaiting({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex h-9 w-9 items-center justify-center border border-dashed border-[var(--line-strong)] text-mute">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 8v4l3 2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <span className="meta text-mute">Not configured</span>
      <span className="max-w-xs text-xs leading-relaxed text-mute">
        Set <span className="font-mono text-bone/80">{what}</span> to read live data here.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ Skeleton -- */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-bone/[0.08] motion-reduce:animate-none ${className}`} />;
}

/* ----------------------------------------------------------------- Row -- */
export function Row({
  label,
  value,
  mono = true,
}: {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-mute">{label}</span>
      <span className={`${mono ? "font-mono tabular-nums" : ""} text-bone`}>{value}</span>
    </div>
  );
}

/* --------------------------------------------------------------- Empty -- */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-1 py-8 text-center text-sm text-mute">{children}</p>;
}
