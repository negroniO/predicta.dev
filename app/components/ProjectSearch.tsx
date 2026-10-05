"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ slug: string; title: string; subtitle: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!r.ok) throw new Error("Search failed");
        const json = await r.json();
        if (!controller.signal.aborted) setResults(json);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [q]);

  return (
    <div className="w-full space-y-2 relative">
      <input
        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-400 outline-none"
        placeholder="Search projects…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setResults([]); setLoading(false); }}
      />

      {loading && q && (
        <div className="text-xs text-slate-400">Searching…</div>
      )}

      {q.length >= 2 && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 p-2 space-y-1 text-sm">
          {results.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="block px-2 py-1 rounded hover:bg-slate-800"
            >
              <span className="font-medium text-slate-100">{p.title}</span>
              {p.subtitle && (
                <span className="block text-[11px] text-slate-400">
                  {p.subtitle}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
