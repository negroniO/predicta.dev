"use client";

import { useEffect, useRef, useState } from "react";

import { responseMessage } from "@/app/lib/client-feedback";

type Props = { slug: string };

type ReactionState = {
  likeCount: number;
  dislikeCount: number;
  mine: "like" | "dislike" | null;
};

export default function ReactionButtons({ slug }: Props) {
  const [state, setState] = useState<ReactionState>({
    likeCount: 0,
    dislikeCount: 0,
    mine: null,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(`/api/projects/${slug}/reaction`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Reactions unavailable");
        const json = (await res.json()) as ReactionState & { ok: boolean };
        if (!cancelled) {
          setState({
            likeCount: json.likeCount,
            dislikeCount: json.dislikeCount,
            mine: json.mine,
          });
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally { if (!cancelled) setInitialLoading(false); }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  async function react(kind: "like" | "dislike") {
    if (pending.current || initialLoading || loadError) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${slug}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) {
        setError(await responseMessage(res, "Could not save your reaction. Try again."));
        return;
      }
      const json = (await res.json()) as ReactionState & { ok: boolean };
      setState({
        likeCount: json.likeCount,
        dislikeCount: json.dislikeCount,
        mine: json.mine,
      });
    } catch {
      setError("Could not save your reaction. Try again.");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs" aria-busy={loading || initialLoading}>
      <button
        type="button"
        onClick={() => react("like")}
        aria-label={`Like this project (${state.likeCount})`}
        aria-pressed={state.mine === "like"}
        disabled={loading || initialLoading || loadError}
        className={
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 " +
          (state.mine === "like"
            ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
            : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-400")
        }
      >
        👍 <span>{initialLoading || loadError ? "—" : state.likeCount}</span>
      </button>
      <button
        type="button"
        onClick={() => react("dislike")}
        aria-label={`Dislike this project (${state.dislikeCount})`}
        aria-pressed={state.mine === "dislike"}
        disabled={loading || initialLoading || loadError}
        className={"inline-flex items-center gap-1 rounded-full border px-3 py-1 " +
          (state.mine === "dislike"
            ? "border-red-400 bg-red-500/10 text-red-100"
            : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-red-400")
        }
      >
        👎 <span>{initialLoading || loadError ? "—" : state.dislikeCount}</span>
      </button>
      <span role="status">{initialLoading ? "Loading reactions…" : loading ? "Saving reaction…" : loadError ? "Reactions could not be loaded." : error}</span>
      {loadError && <button type="button" className="text-cyan-300 underline" onClick={() => {
        setLoadError(false); setInitialLoading(true); setAttempt((value) => value + 1);
      }}>Retry loading reactions</button>}
    </div>
  );
}
