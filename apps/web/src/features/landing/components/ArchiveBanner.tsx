// Provenance notice for the blog. The posts are kept as they were published
// upstream (same dates, same text); this banner says where they come from.
export function ArchiveBanner() {
  return (
    <aside
      role="note"
      aria-label="About these posts"
      className="mb-12 flex flex-col gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm leading-relaxed text-white/75 sm:flex-row sm:gap-3"
    >
      <span className="shrink-0 font-mono text-[11px] uppercase leading-6 tracking-[0.14em] text-white/60">
        Archive
      </span>
      <p>
        Archived posts from the upstream DRIFT project, written for a Mantle hackathon track in June 2026. During the
        September 2026 BNB Chain migration, mentions of Mantle were changed to BNB Chain and the Mantle ecosystem post
        was rewritten as &apos;Building on BNB Chain&apos;. Not written by Dex Bennett.
      </p>
    </aside>
  );
}
