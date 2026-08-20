"use client";

import { useEffect, useState } from "react";

/**
 * Live Market Clock — compact horizontal strip of 4 financial-center clocks
 * shown in the site header (desktop only).
 *
 * Each clock shows: city code (NYC / LON / FRA / TYO) + time (HH:MM:SS) in
 * mono. Clocks whose cash-equity session is currently open are highlighted
 * with an emerald dot + emerald text; closed markets are dimmed to gray.
 *
 * Session windows (UTC, Mon–Fri only — does NOT model holidays):
 *   NYC       14:30 – 21:00   (NYSE / Nasdaq regular session)
 *   London    08:00 – 16:30   (LSE)
 *   Frankfurt 08:00 – 16:30   (Xetra)
 *   Tokyo     00:00 – 06:00   (TSE)
 *
 * SSR-safe: renders a same-shape placeholder on the server and on the first
 * client render (so `now` is null until the effect runs), then hydrates to
 * the live ticking clock. This prevents hydration mismatches caused by the
 * server and client rendering different timestamps.
 *
 * Timezone conversion uses `Intl.DateTimeFormat` with the `timeZone` option.
 * NEVER use `Date` methods that assume local time (getHours/getMinutes) —
 * those would be wrong for any visitor not in the target timezone.
 */

type Market = {
  code: string;
  label: string;
  tz: string;
  openStartUtcMin: number;
  openEndUtcMin: number;
};

const MARKETS: Market[] = [
  {
    code: "NYC",
    label: "New York · NYSE/Nasdaq · 14:30–21:00 UTC",
    tz: "America/New_York",
    openStartUtcMin: 14 * 60 + 30,
    openEndUtcMin: 21 * 60,
  },
  {
    code: "LON",
    label: "London · LSE · 08:00–16:30 UTC",
    tz: "Europe/London",
    openStartUtcMin: 8 * 60,
    openEndUtcMin: 16 * 60 + 30,
  },
  {
    code: "FRA",
    label: "Frankfurt · Xetra · 08:00–16:30 UTC",
    tz: "Europe/Berlin",
    openStartUtcMin: 8 * 60,
    openEndUtcMin: 16 * 60 + 30,
  },
  {
    code: "TYO",
    label: "Tokyo · TSE · 00:00–06:00 UTC",
    tz: "Asia/Tokyo",
    openStartUtcMin: 0,
    openEndUtcMin: 6 * 60,
  },
];

// Only show these 2 in the compact header; the rest are in the tooltip
const COMPACT_MARKETS = MARKETS.slice(0, 2);

function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function isMarketOpen(date: Date, market: Market): boolean {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return minutes >= market.openStartUtcMin && minutes < market.openEndUtcMin;
}

function ClockCell({ market, time, open }: { market: Market; time: string; open: boolean }) {
  return (
    <div
      className="flex items-center gap-1 shrink-0"
      title={market.label}
      role="group"
      aria-label={`${market.label} — ${open ? "open" : "closed"} — ${time}`}
    >
      <span
        className={`h-1 w-1 rounded-full shrink-0 ${
          open ? "bg-emerald-400 animate-live-pulse" : "bg-white/30"
        }`}
      />
      <span
        className={`font-mono text-[0.5rem] uppercase tracking-[0.12em] ${
          open ? "text-emerald-300" : "text-white/40"
        }`}
      >
        {market.code}
      </span>
      <span
        className={`numeric font-mono text-[0.6rem] tabular-nums whitespace-nowrap ${
          open ? "text-emerald-200" : "text-white/55"
        }`}
      >
        {time}
      </span>
    </div>
  );
}

export function MarketClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // SSR / first-paint placeholder — same shape & dimensions as the live clock
  // so there is no layout shift when the real timestamps hydrate in.
  if (!now) {
    return (
      <div
        suppressHydrationWarning
        aria-hidden
        className="hidden items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 xl:flex"
        title="Market Clock — hover for all timezones"
      >
        {COMPACT_MARKETS.map((m) => (
          <div key={m.code} className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-white/30">
              {m.code}
            </span>
            <span className="font-mono text-[0.6rem] tabular-nums text-white/30">
              --:--
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Build tooltip text with all 4 markets
  const tooltipLines = MARKETS.map(m =>
    `${m.code} ${formatTime(now, m.tz)} ${isMarketOpen(now, m) ? "● OPEN" : "○ closed"}`
  ).join("\n");

  return (
    <div
      className="hidden items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 xl:flex"
      title={tooltipLines}
    >
      {COMPACT_MARKETS.map((m) => (
        <ClockCell
          key={m.code}
          market={m}
          time={formatTime(now, m.tz)}
          open={isMarketOpen(now, m)}
        />
      ))}
    </div>
  );
}
