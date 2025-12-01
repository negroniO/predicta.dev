"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const isValid = /\S+@\S+\.\S+/.test(email);
    if (!isValid) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={!!error}
          aria-describedby="subscribe-helper"
          className="flex-1 rounded-lg bg-slate-950/80 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-sm disabled:opacity-70"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p id="subscribe-helper" className="text-[11px] text-slate-400">
        Latest projects and write-ups, about 1–2 emails/month. No spam; unsubscribe anytime.
      </p>
      {error && <p className="text-[11px] text-amber-300" aria-live="polite">{error}</p>}
      {status === "success" && (
        <p className="text-[11px] text-emerald-300" aria-live="polite">
          Thanks! You’re on the list.
        </p>
      )}
      {status === "error" && (
        <p className="text-[11px] text-red-300" aria-live="polite">
          Could not subscribe. Try again.
        </p>
      )}
      <p className="text-[11px] text-slate-500">
        We respect your privacy. No tracking pixels; unsubscribe anytime.
      </p>
    </form>
  );
}
