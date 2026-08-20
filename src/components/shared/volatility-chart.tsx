"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart3 } from "lucide-react";
import type { Candle, QuoteResponse } from "@/lib/market-types";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";

/**
 * Institutional terminal card with a real candlestick chart fed by
 * /api/quote?symbol=SPX (Yahoo Finance, no API key). Polls every 60s.
 *
 * - On success: real candles + real price + real day change.
 * - On failure: the route returns a deterministic mock candle set with
 *   live:false, so the chart is never broken.
 * - The GEX sidebar stays as visual storytelling (labelled "demo").
 * - A LIVE / DEMO badge sits in the terminal header.
 */

// Local placeholder candles used for the very first paint, before the first
// fetch resolves. Same algorithm as the API fallback so the visual matches.
function placeholderCandles(): Candle[] {
  const base = 5800;
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  const out: Candle[] = [];
  for (let i = 0; i < 30; i++) {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    const amp = base * 0.012;
    const center = base + Math.sin(i / 4) * amp + (r - 0.5) * amp * 1.6;
    const open = center + (r - 0.5) * amp * 0.4;
    const close =
      center + Math.sin(i / 3 + 0.2) * amp * 0.9 + (r - 0.45) * amp * 0.5;
    const high = Math.max(open, close) + amp * 0.3 + r * amp * 0.4;
    const low = Math.min(open, close) - amp * 0.3 - r * amp * 0.4;
    out.push({
      t: now - (30 - i) * day,
      open,
      high,
      low,
      close,
      up: close >= open,
    });
  }
  return out;
}

export function VolatilityChart() {
  const [candles, setCandles] = useState<Candle[]>(() => placeholderCandles());
  const [price, setPrice] = useState<number>(0);
  const [dayChg, setDayChg] = useState<number>(0);
  const [dayChgPct, setDayChgPct] = useState<number>(0);
  const [live, setLive] = useState<boolean | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let aborted = false;
    async function pull() {
      try {
        const res = await fetch("/api/quote?symbol=SPX", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as QuoteResponse;
        if (aborted) return;
        if (Array.isArray(json.candles) && json.candles.length) {
          setCandles(json.candles);
          setPrice(json.price);
          setDayChg(json.dayChg);
          setDayChgPct(json.dayChgPct);
          setLive(Boolean(json.live));
        }
      } catch {
        if (!aborted) setLive(false);
      }
    }
    pull();
    const id = setInterval(pull, 60_000);
    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, []);

  // GEX profile sidebar — decorative (visual storytelling only).
  const gexBars = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const r = ((i * 7919) % 1000) / 1000;
        const val = (r - 0.42) * 1.8;
        return { val, up: val >= 0 };
      }),
    []
  );

  // Chart geometry
  const H = 220;
  const W = 520;
  const all = candles.flatMap((c) => [c.high, c.low]);
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;
  const range = max - min || 1;
  const yOf = (v: number) => H - ((v - min) / range) * (H - 20) - 10;
  const stepX = candles.length > 1 ? (W - 24) / (candles.length - 1) : 0;

  const lastPrice = candles.length
    ? candles[candles.length - 1].close
    : price || 0;
  const displayPrice = price || lastPrice;
  const pct = dayChgPct || 0;
  const isLive = live === true;
  const isDemo = live === false;

  return (
    <div className="bg-noise relative border-glow rounded-2xl bg-[oklch(0.20_0.014_252)]/80 backdrop-blur-xl">
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-white/45">
            vince · /chart SPX
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wider">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              live · yahoo
            </span>
          ) : isDemo ? (
            <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              demo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              loading
            </span>
          )}
        </div>
      </div>

      {/* Symbol row */}
      <div className="flex items-end justify-between border-b border-white/[0.04] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold text-white">
              SPX
            </span>
            <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-emerald-400">
              index
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-white/35">
            S&amp;P 500 · {isLive ? "realtime" : "demo feed"}
          </div>
        </div>
        <div className="text-right">
          <div className="animate-data-pulse numeric font-mono text-xl font-semibold text-white tabular-nums">
            {displayPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div
            className={`numeric font-mono text-xs tabular-nums ${
              pct >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}% ·{" "}
            {pct >= 0 ? "+" : "-"}
            {Math.abs(dayChg).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart + GEX sidebar */}
      <div className="grid grid-cols-[1fr_88px]">
        <div className="relative px-3 pt-4 pb-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
            {/* horizontal gridlines */}
            {[0.2, 0.4, 0.6, 0.8].map((p) => (
              <line
                key={p}
                x1={0}
                x2={W}
                y1={H * p}
                y2={H * p}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
            ))}
            {/* candles */}
            {candles.map((c, i) => {
              const x = 12 + i * stepX;
              const yo = yOf(c.open);
              const yc = yOf(c.close);
              const yh = yOf(c.high);
              const yl = yOf(c.low);
              const color = c.up ? "#34d399" : "#fb7185";
              const bodyTop = Math.min(yo, yc);
              const bodyH = Math.max(Math.abs(yc - yo), 1.5);
              const bodyW = Math.max(stepX * 0.55, 4);
              return (
                <g key={`${c.t}-${i}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={yh}
                    y2={yl}
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.6}
                  />
                  <rect
                    x={x - bodyW / 2}
                    y={bodyTop}
                    width={bodyW}
                    height={bodyH}
                    fill={color}
                    opacity={0.9}
                    rx={1}
                  />
                </g>
              );
            })}
            {/* last price line */}
            <line
              x1={0}
              x2={W}
              y1={yOf(lastPrice)}
              y2={yOf(lastPrice)}
              stroke="#34d399"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />
          </svg>

          {/* price tag */}
          <div
            className="absolute right-3 rounded bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[0.6rem] text-emerald-300 tabular-nums"
            style={{ top: `${(yOf(lastPrice) / H) * 100}%` }}
          >
            {lastPrice.toLocaleString("en-US", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </div>
        </div>

        {/* GEX sidebar — decorative, clearly labelled "demo" */}
        <div className="border-l border-white/[0.04] px-2 py-3">
          <div className="mb-2 flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            <BarChart3 className="h-3 w-3" /> GEX
            <span className="ml-1 rounded bg-amber-400/10 px-1 text-[0.5rem] uppercase tracking-wider text-amber-400/80">
              demo
            </span>
          </div>
          <div className="flex h-[200px] flex-col justify-between gap-0.5">
            {gexBars.map((b, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-white/[0.03]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(b.val) * 60, 60)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`absolute ${
                      b.up ? "left-0 bg-emerald-400/70" : "right-0 bg-rose-400/70"
                    } h-full`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-white/[0.05] pt-2 font-mono text-[0.55rem] text-white/40">
            <div className="flex justify-between">
              <span>net</span>
              <span className="text-emerald-400">+1.84B</span>
            </div>
            <div className="flex justify-between">
              <span>flip</span>
              <span className="text-amber-400">5,812</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer indicators — decorative but plausible */}
      <div className="grid grid-cols-4 gap-px border-t border-white/[0.06] bg-white/[0.02] text-center">
        {[
          { l: "IV", v: "14.27", c: "text-amber-400" },
          { l: "RV20", v: "11.84", c: "text-cyan-400" },
          { l: "Δ", v: "0.42", c: "text-emerald-400" },
          { l: "Γ", v: "0.008", c: "text-violet-400" },
        ].map((m) => (
          <div key={m.l} className="bg-[oklch(0.20_0.014_252)]/60 px-2 py-2">
            <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/35">
              {m.l}
            </div>
            <div className={`numeric font-mono text-sm font-semibold ${m.c}`}>
              {m.v}
            </div>
          </div>
        ))}
      </div>

      {/* Floating activity badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute -bottom-3 -right-3 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-[oklch(0.20_0.014_252)] px-3 py-2 shadow-xl"
      >
        <Activity className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-mono text-[0.62rem] uppercase tracking-wider text-white/70">
          /gex SPX · 0.8s
        </span>
      </motion.div>
    </div>
  );
}
