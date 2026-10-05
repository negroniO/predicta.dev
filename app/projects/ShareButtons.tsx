"use client";

import { SITE_URL } from "@/app/lib/site";
import { useState } from "react";

type Props = {
  slug: string;
  title: string;
};

export default function ShareButtons({ slug, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  // Use a stable origin so SSR/CSR match and avoid hydration mismatch.
  const shareUrl = `${SITE_URL}/projects/${encodeURIComponent(slug)}`;
  const utm = `${shareUrl}?utm_source=share&utm_medium=social&utm_campaign=${slug}`;

  async function copy() {
    setError(false);
    try {
      await navigator.clipboard.writeText(utm);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError(true);
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
      <span role="status">{error ? "Could not copy. Copy the page address from your browser." : copied ? "Link copied." : ""}</span>
    </div>
  );
}
