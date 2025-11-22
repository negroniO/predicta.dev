"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > 250);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        p-3 rounded-full 
        bg-slate-900/70 border border-slate-700/70 
        shadow-lg backdrop-blur-md 
        hover:bg-cyan-500/20 transition
      "
      aria-label="Scroll to top"
    >
      <ArrowUp className="text-cyan-300" size={18} />
    </button>
  );
}
