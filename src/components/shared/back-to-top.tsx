"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "back to top" button that appears after the user scrolls
 * past the first viewport. Anchored bottom-right with safe-area inset.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/30 bg-[oklch(0.20_0.014_252)]/90 text-emerald-400 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-emerald-400/60 hover:bg-emerald-400/10",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <ArrowUp className="h-4 w-4" />
      <span className="absolute inset-0 -z-10 rounded-full bg-emerald-400/20 blur-md opacity-0 transition-opacity duration-300 hover:opacity-100" />
    </button>
  );
}
