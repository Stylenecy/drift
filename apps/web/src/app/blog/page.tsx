import type { CSSProperties } from "react";
import Link from "next/link";
import Nav from "@/features/landing/components/Nav";
import Footer from "@/features/landing/components/Footer";
import { posts } from "@/features/landing/blogs";
import { ArchiveBanner } from "@/features/landing/components/ArchiveBanner";
import { Reveal } from "@/features/motion/Motion";

export const metadata = {
  title: "Blog — DRIFT",
  description: "Archived build log from the upstream DRIFT project: inspiration, architecture, strategies, and ecosystem.",
};

// An editorial index: one row per post, index · tag · title · date. The posts
// are the upstream archive, kept as published; the banner says so.
export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Nav solid />

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-[110px] sm:px-6 sm:pt-[132px]">
        <div className="ld-fade flex items-center gap-4" style={{ "--d": "0.05s" } as CSSProperties}>
          <span className="meta text-mute">Archive</span>
          <span className="bracket">(upstream build log)</span>
        </div>
        <h1 className="display-2 ld-lines mt-6 text-bone" aria-label="From the lab.">
          <span className="ln">
            <span className="ln-i" style={{ "--i": 0 } as CSSProperties}>
              From the <span className="serif-i">lab.</span>
            </span>
          </span>
        </h1>
        <p className="ld-up mt-6 max-w-[52ch] text-[16px] leading-relaxed text-mute" style={{ "--d": "0.4s" } as CSSProperties}>
          How the upstream DRIFT team designed the engine — from the first honest backtest to the on-chain risk guard.
        </p>

        <div className="mt-12 max-w-4xl">
          <ArchiveBanner />
        </div>

        <Reveal as="ol" kind="stagger" className="border-t border-[var(--line-strong)]">
          {posts.map((post, i) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-2 border-b border-[var(--line)] py-7 transition-colors hover:bg-bone/[0.025] sm:grid-cols-[3rem_9rem_1fr_auto] sm:gap-x-6 sm:px-2"
              >
                <span className="font-mono text-[12px] text-mute tnum">{String(i + 1).padStart(2, "0")}</span>
                <span className="meta col-start-2 text-mute sm:col-start-auto">
                  <span aria-hidden className="mr-2 inline-block h-1.5 w-1.5 rotate-45 align-middle" style={{ backgroundColor: post.accent }} />
                  {post.tag}
                </span>
                <span className="col-start-2 sm:col-start-auto">
                  <span className="block text-[22px] font-semibold leading-tight tracking-[-0.025em] text-bone sm:text-[28px]">
                    <span className="u-draw pb-1">{post.title}</span>
                  </span>
                  <span className="mt-2 block max-w-[70ch] text-[14px] leading-relaxed text-mute">{post.excerpt}</span>
                  {post.note && <span className="meta mt-2 block text-warn">{post.note}</span>}
                </span>
                <span className="meta col-start-2 text-mute sm:col-start-auto sm:text-right">
                  {post.date} · {post.readTime}
                  <span aria-hidden className="ml-2 inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
