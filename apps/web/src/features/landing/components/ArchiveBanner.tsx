// Provenance notice for the blog. The posts are kept as they were published
// upstream (same dates, same text); this banner says where they come from.
export function ArchiveBanner() {
  return (
    <aside
      role="note"
      aria-label="About these posts"
      className="hud relative mb-12 bg-slate-1/40 px-5 pb-4 pt-9 text-[14px] leading-relaxed text-bone/85"
    >
      <span className="meta absolute left-4 top-3 text-mute">(archive · provenance)</span>
      <p>
        Archived posts from the upstream DRIFT project, written for a Mantle hackathon track in June 2026. During the
        September 2026 BNB Chain migration, mentions of Mantle were changed to BNB Chain and the Mantle ecosystem post
        was rewritten as &apos;Building on BNB Chain&apos;. Not written by Dex Bennett.
      </p>
    </aside>
  );
}
