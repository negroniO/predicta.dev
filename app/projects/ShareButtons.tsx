"use client";

import { useState } from "react";

type Props = {
  slug: string;
  title: string;
};

export default function ShareButtons({ slug, title }: Props) {
  const [copied, setCopied] = useState(false);
  // Use a stable origin so SSR/CSR match and avoid hydration mismatch.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareUrl = `${origin}/projects/${slug}`;
  const utm = `${shareUrl}?utm_source=share&utm_medium=social&utm_campaign=${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(utm);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("copy failed", e);
    }
  }

  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(utm)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    utm
  )}`;

  return (
    <div className="flex flex-wrap gap-2 text-xs items-center">
      <span className="text-slate-400">Share:</span>
      <a
        href={twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400 text-slate-200"
      >
        X / Twitter
      </a>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400 text-slate-200"
      >
        LinkedIn
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400 text-slate-200"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
