"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-4" role="alert">
      <h1 className="text-2xl font-semibold">This page couldn’t load</h1>
      <p className="text-sm text-slate-300">Please try again in a moment.</p>
      <div className="flex gap-4 items-center">
        <button type="button" onClick={reset} className="btn btn-sm">Try again</button>
        <Link href="/" className="text-sm text-cyan-300 underline">Back to home</Link>
      </div>
    </div>
  );
}
