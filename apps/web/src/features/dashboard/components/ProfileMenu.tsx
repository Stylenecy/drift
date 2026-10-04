"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { getTelegram, testTelegram } from "@/features/trade/api";
import { useAuthEnabled } from "@/components/AuthProvider";
import type { TelegramStatus } from "@/features/trade/types";

// Initials on a token surface; a profile photo when Google provides one.
function Avatar({ name, image, size = 32 }: { name: string; image?: string | null; size?: number }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} width={size} height={size} className="shrink-0 rounded-full" style={{ width: size, height: size }} />;
  }
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full border border-[var(--line-strong)] bg-slate-1 font-mono text-[11px] text-bone"
      style={{ width: size, height: size }}
    >
      {initials || "·"}
    </span>
  );
}

function TelegramSection() {
  const [tg, setTg] = useState<TelegramStatus | null>(null);
  const [testNote, setTestNote] = useState<string | null>(null);

  useEffect(() => {
    getTelegram().then(setTg).catch(() => setTg(null));
  }, []);

  const sendTest = async () => {
    try {
      await testTelegram();
      setTestNote("sent ✓");
      setTimeout(() => setTestNote(null), 2500);
    } catch {
      setTestNote("failed");
    }
  };

  if (!tg) return null;

  return (
    <div className="border-t border-[var(--line)] px-3.5 py-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-mute">Telegram</div>
      {tg.enabled ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            <span className="text-[12px] text-bone/70">
              Connected{tg.username ? ` · @${tg.username}` : ""}
            </span>
          </div>
          <button
            onClick={sendTest}
            className="w-full border border-[var(--line)] py-1.5 text-[12px] text-bone/70 transition hover:border-[var(--line-strong)] hover:text-bone/85"
          >
            {testNote ?? "Send test alert"}
          </button>
        </div>
      ) : tg.configured && tg.username ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
            <span className="text-[12px] text-mute">Not connected yet</span>
          </div>
          <a
            href={`https://t.me/${tg.username}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 border border-[var(--line-strong)] py-2 text-[12px] font-medium text-bone transition-colors hover:border-bone/40 hover:bg-bone/[0.05]"
          >
            {/* Telegram's own blue only on its mark (5.57:1 on slate-1), like the Google mark on /login. */}
            <span className="text-[#229ED9]">
              <TelegramIcon />
            </span>
            Connect via Telegram
          </a>
          <p className="text-[10px] leading-relaxed text-mute">
            Opens @{tg.username} — send <span className="font-mono">/start</span> to bind your chat and receive alerts.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-mute">Bot not configured on server.</p>
      )}
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const authEnabled = useAuthEnabled();
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!authEnabled) {
    return (
      <div className="border-t border-[var(--line)] px-5 py-4 text-[12px] leading-relaxed text-mute">
        <div className="bracket mb-1">(sign-in)</div>
        Sign-in is off: Google OAuth is not configured on this server.
      </div>
    );
  }

  if (status !== "loading" && !session) {
    return (
      <div className="border-t border-[var(--line)] p-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center gap-2.5 px-2 py-1.5 text-[13px] text-bone/70 transition hover:bg-bone/[0.05] hover:text-bone"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line-strong)] text-mute">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Sign in
        </button>
      </div>
    );
  }

  const name = session?.user?.name ?? session?.user?.email ?? "Account";
  const email = session?.user?.email ?? undefined;
  const image = session?.user?.image;

  const handleSignOut = async () => {
    setOpen(false);
    await signOut({ redirect: false });
    router.replace("/login");
  };

  return (
    <div ref={ref} className="relative border-t border-[var(--line)] p-3">
      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-3 right-3 z-30 overflow-hidden border border-[var(--line)] bg-slate-1 shadow-2xl shadow-black/50">
          {/* user info */}
          <div className="border-b border-[var(--line)] px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={name} image={image} size={34} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-bone">{name}</div>
                {email && <div className="truncate text-[11px] text-mute">{email}</div>}
              </div>
            </div>
          </div>

          {/* Telegram connect */}
          <TelegramSection />

          {/* actions */}
          <div className="border-t border-[var(--line)] py-1">
            <button
              onClick={handleSignOut}
              className="block w-full px-3.5 py-2 text-left text-[13px] text-veto-soft transition hover:bg-bone/[0.05]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-2 py-1.5 transition hover:bg-bone/[0.05]"
      >
        <Avatar name={name} image={image} />
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[13px] font-medium text-bone">{name}</div>
          {email && <div className="truncate text-[11px] text-mute">{email}</div>}
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-mute">
          <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
        </svg>
      </button>
    </div>
  );
}
