"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.8 37.9 46.5 31.8 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.9-6.1C.9 16 0 19.9 0 24s.9 8 2.5 11.4l7.9-7.1z" />
      <path fill="#34A853" d="M24 48c6.4 0 11.9-2.1 15.8-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.5 2.3-6.3 0-11.7-3.7-13.6-9.8l-7.9 7.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

// Only shown when Google OAuth is configured (local or private deployments).
// The hosted demo has no sign-in: /login redirects straight to the cockpit.
export function LoginForm() {
  return (
    <div className="hero-x relative flex min-h-screen bg-ink text-bone">
      <div aria-hidden className="ld-clip pointer-events-none absolute inset-y-0 left-[var(--gx)] right-[var(--gx)] grid-12" style={{ "--d": "0s" } as CSSProperties} />

      <div className="relative hidden flex-1 flex-col justify-between p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5" aria-label="DRIFT home">
          <Image src="/drift-logo.png" alt="" width={28} height={28} className="object-contain" />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">DRIFT</span>
        </Link>
        <div>
          <span className="bracket">(cockpit)</span>
          <h1 className="display-2 ld-lines mt-5 max-w-[16ch]" aria-label="Run classical strategies with a stop you can read.">
            <span className="ln">
              <span className="ln-i" style={{ "--i": 0 } as CSSProperties}>
                Run classical strategies
              </span>
            </span>
            <span className="ln">
              <span className="ln-i" style={{ "--i": 1 } as CSSProperties}>
                with a stop <span className="serif-i text-chain">you can read.</span>
              </span>
            </span>
          </h1>
          <p className="ld-up mt-6 max-w-sm text-[15px] text-mute" style={{ "--d": "0.5s" } as CSSProperties}>
            Sign in to deploy and monitor your bots on Bybit testnet.
          </p>
        </div>
        <div className="meta text-mute">Honest · bounded · on the record</div>
      </div>

      <div className="relative flex w-full items-center justify-center p-6 lg:w-[480px]">
        <div className="ld-clip hud w-full max-w-sm bg-slate-1/60 p-8 pt-12" style={{ "--d": "0.2s" } as CSSProperties}>
          <span className="meta absolute left-4 top-3 text-mute">(sign in)</span>
          <h2 className="text-[24px] font-semibold tracking-[-0.02em]">Sign in</h2>
          <p className="mt-1 text-sm text-mute">Access your trading cockpit.</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="mt-7 flex w-full items-center justify-center gap-2.5 bg-bone py-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <p className="mt-6 text-center text-[12px] leading-relaxed text-mute">
            We use your Google account only to identify your session. Bybit keys stay in the engine&apos;s memory and are never
            linked to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
