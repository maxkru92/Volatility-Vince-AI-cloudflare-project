"use client";

import { useEffect, useRef, useState } from "react";
import { tickerSymbols } from "@/lib/site-data";
import type { TickerItem } from "@/lib/market-types";

/**
 * Infinite-scroll ticker tape. Polls /api/ticker every 30s for live prices.
 * While the first fetch is in flight we render the static fallback so there
 * is no flash of empty content. The animation never restarts because we keep
 * the same DOM structure (two concatenated arrays) — only the data mutates.
 */
export function TickerTape() {
  // Start with the static seed data so first paint is instant.
  const [items, setItems] = useState<TickerItem[]>(
    tickerSymbols.map((t) => ({ ...t }))
  );
  const [live, setLive] = useState<boolean | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let aborted = false;
    async function pull() {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          live: boolean;
          items: TickerItem[];
        };
        if (aborted) return;
        if (Array.isArray(json.items) && json.items.length) {
          setItems(json.items);
          setLive(Boolean(json.live));
        }
      } catch {
        if (!aborted) setLive(false);
      }
    }
    pull();
    const id = setInterval(pull, 30_000);
    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, []);

  // Duplicate the array so the CSS keyframe animation can loop seamlessly.
  const loop = [...items, ...items];
  const isLive = live === true;
  const isDemo = live === false;

  return (
    <div className="bg-scanlines relative overflow-hidden border-y border-white/[0.06] bg-[oklch(0.18_0.013_251)]/80 backdrop-blur-sm">
      {/* LIVE / DEMO badge — pinned to the left edge, above the marquee */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center pl-3">
        <span
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-md ${
            isLive
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : isDemo
                ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                : "border-white/15 bg-white/5 text-white/55"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isLive
                ? "bg-emerald-400 animate-live-pulse"
                : isDemo
                  ? "bg-amber-400"
                  : "bg-white/40"
            }`}
          />
          {isLive ? "Live" : isDemo ? "Demo" : "…"}
        </span>
      </div>

      <div className="flex w-max animate-ticker">
        {loop.map((t, i) => (
          <div
            key={`${t.sym}-${i}`}
            className="flex items-center gap-2 border-r border-white/[0.04] px-4 py-2"
          >
            <span className="font-mono text-xs font-semibold text-white/85">
              {t.sym}
            </span>
            <span className="numeric font-mono text-xs text-white/60">
              {t.px}
            </span>
            <span
              className={`numeric font-mono text-[0.7rem] ${
                t.up ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {t.up ? "▲" : "▼"} {t.chg}
            </span>
            {t.gex && t.gex !== "—" && (
              <span className="font-mono text-[0.62rem] uppercase tracking-wider text-white/30">
                gex {t.gex}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* fade edges — the left one also masks the LIVE badge tail nicely */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[oklch(0.18_0.013_251)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[oklch(0.18_0.013_251)] to-transparent" />
    </div>
  );
}
