"use client";

import { useEffect, useState } from "react";

/**
 * Tiny institutional "MARKET OPEN / CLOSED" badge.
 *
 * US cash equities (NYSE + Nasdaq) regular session: 14:30–21:00 UTC,
 * Monday–Friday. We compute this client-side (avoids a server round-trip
 * and re-renders automatically when the session boundary crosses).
 *
 * Does not model US market holidays — those are edge cases and would
 * require an external calendar. The badge is informational only.
 */
function computeOpen(now: Date): boolean {
  const day = now.getUTCDay(); // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return false;
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const minutes = h * 60 + m;
  // 14:30 UTC = 870, 21:00 UTC = 1260
  return minutes >= 870 && minutes < 1260;
}

export function MarketStatus() {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const tick = () => setOpen(computeOpen(new Date()));
    tick();
    // Re-check every minute — cheap and keeps the badge accurate.
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (open === null) {
    // SSR / first-paint placeholder — render nothing visible to avoid hydration mismatch.
    return (
      <span
        suppressHydrationWarning
        className="hidden h-5 w-[112px] sm:inline-block xl:hidden"
        aria-hidden
      />
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className={`hidden items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] sm:inline-flex xl:hidden ${
        open
          ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-300"
          : "border-white/10 bg-white/[0.03] text-white/45"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          open ? "bg-emerald-400 animate-live-pulse" : "bg-white/35"
        }`}
      />
      {open ? "Market Open" : "Market Closed"}
    </span>
  );
}
