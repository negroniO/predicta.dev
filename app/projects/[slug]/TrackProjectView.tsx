// app/projects/[slug]/TrackProjectView.tsx
"use client";

import { useEffect } from "react";

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;

  const key = "predicta_visitor_id";
  let id = window.localStorage.getItem(key);

  if (!id) {
    // crypto.randomUUID is supported in modern browsers
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }

  return id;
}

export default function TrackProjectView({ slug }: { slug: string }) {
  useEffect(() => {
    const path = window.location.pathname;
    const visitorId = getVisitorId();
    const referrer = document.referrer || null;

    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        slug,
        path,
        visitorId,
        referrer,
      }),
    }).catch(() => {
      // ignore client errors
    });
  }, [slug]);

  return null;
}
