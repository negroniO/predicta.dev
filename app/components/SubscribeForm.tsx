"use client";

import Link from "next/link";
import { responseMessage } from "@/app/lib/client-feedback";
import { useId, useRef, useState } from "react";

export default function SubscribeForm() {
  const pending = useRef(false);
  const inputId = useId();
  const helperId = `${inputId}-helper`;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || pending.current) return;
    const isValid = /\S+@\S+\.\S+/.test(email);
    if (!isValid) {
      setError("Enter a valid email address.");
      return;
    }
    pending.current = true;
    setError(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(await responseMessage(res, "Could not subscribe. Your email is still here; try again."));
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setError("Could not connect. Your email is still here; check your connection and try again.");
      setStatus("error");
    } finally { pending.current = false; }
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={status === "loading"}
      className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={inputId} className="sr-only">Email address</label>
        <input
          id={inputId}
          autoComplete="email"
          name="email"
          type="email"
          maxLength={254}
          readOnly={status === "loading"}
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); setStatus("idle"); }}
          placeholder="you@example.com"
          aria-invalid={!!error}
          aria-describedby={`${helperId}${error ? ` ${inputId}-error` : ""}`}
          className="flex-1 rounded-lg bg-slate-950/80 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-sm disabled:opacity-70"
        >
          {status === "loading" ? "Subscribing…" : status === "error" ? "Try again" : "Subscribe"}
        </button>
      </div>
      <p id={helperId} className="text-[11px] text-slate-400">
        Register your interest in future project updates.
      </p>
      {error && <p id={`${inputId}-error`} role="alert" className="text-[11px] text-amber-300">{error}</p>}
      {status === "success" && (
        <p className="text-[11px] text-emerald-300" aria-live="polite">
          Thanks! Your interest has been registered.
        </p>
      )}
      <p className="text-[11px] text-slate-500">
        Your email is stored for future updates. <Link href="/contact" className="underline text-cyan-300">Contact us</Link> to request removal.
      </p>
    </form>
  );
}
