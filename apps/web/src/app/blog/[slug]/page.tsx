import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/features/landing/components/Nav";
import Footer from "@/features/landing/components/Footer";
import { posts, getPost, type ContentBlock } from "@/features/landing/blogs";
import { ArchiveBanner } from "@/features/landing/components/ArchiveBanner";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: `${post.title} — DRIFT`, description: post.excerpt };
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mb-4 mt-14 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-bone">{block.text}</h2>;
    case "h3":
      return <h3 className="mb-3 mt-9 text-[19px] font-semibold tracking-[-0.01em] text-bone">{block.text}</h3>;
    case "p":
      return <p className="mb-5 text-[16.5px] leading-[1.8] text-bone/80">{block.text}</p>;
    case "blockquote":
      return (
        <blockquote className="serif-i my-10 border-l border-chain/60 pl-6 text-[24px] leading-[1.3] text-bone">{block.text}</blockquote>
      );
    case "code":
      return (
        <pre className="hud my-7 overflow-x-auto bg-slate-1/50 p-5 font-mono text-[13px] leading-relaxed text-engine">{block.text}</pre>
      );
    case "ul":
      return (
        <ul className="mb-6 space-y-3 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-bone/80">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-mute" />
              {item}
            </li>
          ))}
        </ul>
      );
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const index = posts.findIndex((p) => p.slug === post.slug);

  return (
    <div className="min-h-screen bg-ink text-bone">
      <Nav solid />

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-[110px] sm:px-6 sm:pt-[132px]">
        <div className="mx-auto max-w-[44rem]">
          <Link href="/blog" className="meta inline-flex items-center gap-2 text-mute transition-colors hover:text-bone">
            <span aria-hidden>←</span>
            <span className="u-draw pb-0.5">Upstream archive</span>
          </Link>

          <div className="ld-fade mt-10 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ "--d": "0.05s" } as CSSProperties}>
            <span className="meta text-mute tnum">{String(index + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}</span>
            <span className="meta inline-flex items-center gap-2 text-mute">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45" style={{ backgroundColor: post.accent }} />
              {post.tag}
            </span>
            <span className="meta text-mute">
              {post.date} · {post.readTime} read
            </span>
          </div>

          <h1 className="ld-lines mt-6 text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] text-bone sm:text-[60px]" aria-label={post.title}>
            <span className="ln">
              <span className="ln-i" style={{ "--i": 0 } as CSSProperties}>
                {post.title}
              </span>
            </span>
          </h1>
          {post.note && <p className="meta mt-5 text-warn">Note: {post.note}.</p>}

          <div className="mt-10">
            <ArchiveBanner />
          </div>

          <article className="ld-up" style={{ "--d": "0.3s" } as CSSProperties}>
            {post.content.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </article>

          <div className="mt-16 border-t border-[var(--line)] pt-8">
            <Link href="/blog" className="meta inline-flex items-center gap-2 text-mute transition-colors hover:text-bone">
              <span aria-hidden>←</span>
              <span className="u-draw pb-0.5">All posts</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
