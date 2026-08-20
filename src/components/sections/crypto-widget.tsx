"use client";

import { useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────

interface CryptoItem {
  sym: string;
  price: number;
  change24h: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  sparkline: number[];
}

interface CryptoResponse {
  live: boolean;
  updatedAt: string;
  items: CryptoItem[];
}

// ── Deterministic seed data for instant first paint ────────────────

function seedData(): CryptoItem[] {
  const bases: Record<string, number> = {
    BTC: 107842,
    ETH: 3847,
    SOL: 178,
    BNB: 642,
  };
  return Object.entries(bases).map(([sym, base]) => {
    let h = 0;
    for (let i = 0; i < sym.length; i++) h = ((h << 5) - h + sym.charCodeAt(i)) | 0;
    const r = Math.abs(h % 1000) / 1000;
    const changePct = (r - 0.45) * 6;
    return {
      sym,
      price: base,
      change24h: parseFloat((base * (changePct / 100)).toFixed(2)),
      changePct24h: parseFloat(changePct.toFixed(2)),
      high24h: parseFloat((base * 1.02).toFixed(2)),
      low24h: parseFloat((base * 0.98).toFixed(2)),
      volume24h: parseFloat((base * 12000 + r * base * 8000).toFixed(2)),
      sparkline: seedSparkline(base, sym),
    };
  });
}

function seedSparkline(base: number, sym: string): number[] {
  const points: number[] = [];
  let hash = 0;
  for (let i = 0; i < sym.length; i++) hash = ((hash << 5) - hash + sym.charCodeAt(i)) | 0;
  for (let i = 0; i < 24; i++) {
    hash = ((hash << 5) - hash + i * 9301 + 49297) | 0;
    const r = Math.abs(hash % 233280) / 233280;
    const amp = base * 0.008;
    const center = base + Math.sin(i / 5) * amp + (r - 0.5) * amp * 1.2;
    points.push(parseFloat(center.toFixed(2)));
  }
  return points;
}

// ── Sparkline SVG component ────────────────────────────────────────

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = up ? "rgb(52, 211, 153)" : "rgb(251, 113, 133)"; // emerald-400 / rose-400
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Format helpers ─────────────────────────────────────────────────

function fmtPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtVol(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

// ── Main component ─────────────────────────────────────────────────

export function CryptoWidget() {
  const [items, setItems] = useState<CryptoItem[]>(seedData);
  const [live, setLive] = useState<boolean | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let aborted = false;
    async function pull() {
      try {
        const res = await fetch("/api/crypto", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CryptoResponse;
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
    const id = setInterval(pull, 15_000);
    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, []);

  const isLive = live === true;
  const isDemo = live === false;

  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-[oklch(0.18_0.013_251)]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white/60">
              Crypto / USDT
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-md ${
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
          <span className="font-mono text-[0.55rem] text-white/30">
            24h data
          </span>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => {
            const up = item.changePct24h >= 0;
            return (
              <div
                key={item.sym}
                className="group rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04] sm:p-4"
              >
                {/* Symbol + sparkline row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white/90">
                    {item.sym}
                  </span>
                  <MiniSparkline data={item.sparkline} up={up} />
                </div>

                {/* Price */}
                <div className="mt-1.5 numeric font-mono text-lg font-semibold text-white sm:text-xl">
                  ${fmtPrice(item.price)}
                </div>

                {/* 24h change */}
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`numeric font-mono text-xs font-medium ${
                      up ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {up ? "▲" : "▼"} {Math.abs(item.changePct24h).toFixed(2)}%
                  </span>
                  <span
                    className={`numeric font-mono text-[0.65rem] ${
                      up ? "text-emerald-400/60" : "text-rose-400/60"
                    }`}
                  >
                    {up ? "+" : ""}{fmtPrice(Math.abs(item.change24h))}
                  </span>
                </div>

                {/* High / Low / Volume */}
                <div className="mt-2 flex items-center justify-between font-mono text-[0.6rem] text-white/35">
                  <span>
                    H {fmtPrice(item.high24h)}
                  </span>
                  <span>
                    L {fmtPrice(item.low24h)}
                  </span>
                  <span>
                    Vol {fmtVol(item.volume24h)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
