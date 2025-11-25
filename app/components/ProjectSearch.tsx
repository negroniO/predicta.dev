"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await r.json();
      setResults(json);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [q]);

  return (
    <div className="w-full space-y-2 relative">
      <input
        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-cyan-400 outline-none"
        placeholder="Search projects…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading && q && (
        <div className="text-xs text-slate-400">Searching…</div>
      )}

      {results.length > 0 && (
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
