"use client";

import Link from "next/link";

type Props = {
  currentSlug: string;
  related: { slug: string; title: string }[];
};

export default function RelatedProjects({ currentSlug, related }: Props) {
  if (!related.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-100">Related projects</h3>
      <div className="flex flex-wrap gap-2 text-xs">
        {related.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400 text-slate-200"
          >
            {p.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
