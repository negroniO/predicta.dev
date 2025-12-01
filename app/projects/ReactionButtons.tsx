"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(`/api/projects/${slug}/reaction`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as ReactionState & { ok: boolean };
        if (!cancelled) {
          setState({
            likeCount: json.likeCount,
            dislikeCount: json.dislikeCount,
            mine: json.mine,
          });
        }
      } catch (e) {
        console.error("reaction fetch failed", e);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function react(kind: "like" | "dislike") {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${slug}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as ReactionState & { ok: boolean };
      setState({
        likeCount: json.likeCount,
        dislikeCount: json.dislikeCount,
        mine: json.mine,
      });
    } catch (e) {
      console.error("reaction failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={() => react("like")}
        disabled={loading}
        className={
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 " +
          (state.mine === "like"
            ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
            : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-400")
        }
      >
        👍 <span>{state.likeCount}</span>
      </button>
      <button
        type="button"
        onClick={() => react("dislike")}
        disabled={loading}
        className={"inline-flex items-center gap-1 rounded-full border px-3 py-1 " +
          (state.mine === "dislike"
            ? "border-red-400 bg-red-500/10 text-red-100"
            : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-red-400")
        }
      >
        👎 <span>{state.dislikeCount}</span>
      </button>
    </div>
  );
}
