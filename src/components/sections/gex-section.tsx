"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Layers, Activity, Target, Gauge } from "lucide-react";
import { MonteCarloViz } from "@/components/shared/monte-carlo-viz";
import { VolSurfaceViz } from "@/components/shared/vol-surface-viz";
import { IVSkewViz } from "@/components/shared/iv-skew-viz";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";
import type { NormalizedOption, OptionSource, OptionsResponse } from "@/lib/options-types";
import { fetchOptionsChain, invalidateOptionsChain } from "@/lib/options-client";

const exposureCards = [
  {
    icon: Layers,
    name: "GEX — Gamma Exposure",
    formula: "Σ Γ · OI · 100 · S · sign",
    desc: "Dollar gamma per 1% move. Identifies dealer hedging pressure at every strike.",
    color: "emerald",
  },
  {
    icon: Activity,
    name: "DEX — Delta Exposure",
    formula: "Σ Δ · OI · 100 · sign",
    desc: "Net dollar delta dealers must hedge. Drives intraday buy/sell flow.",
    color: "amber",
  },
  {
    icon: Target,
    name: "VEX — Vanna Exposure",
    formula: "Σ ∂Δ/∂σ · OI · 100",
    desc: "How dealer delta shifts with IV. Critical into earnings and vol events.",
    color: "violet",
  },
  {
    icon: Gauge,
    name: "Gamma Flip / Max Pain",
    formula: "argmin |Σ GEX| · argmax pain",
    desc: "The zero-gamma level where dealer flow inverts, plus max-pain pinning strike.",
    color: "rose",
  },
];

const colorMap: Record<string, { text: string; border: string; bg: string; icon: string }> = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.08]",
    icon: "from-emerald-400/20",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.08]",
    icon: "from-amber-400/20",
  },
  violet: {
    text: "text-violet-400",
    border: "border-violet-400/30",
    bg: "bg-violet-400/[0.08]",
    icon: "from-violet-400/20",
  },
  rose: {
    text: "text-rose-400",
    border: "border-rose-400/30",
    bg: "bg-rose-400/[0.08]",
    icon: "from-rose-400/20",
  },
};

// ── Synthetic GEX data (fallback when no live chain) ─────────────────

const SYNTHETIC_GEX = [
  { k: "5700", gex: -0.4 },
  { k: "5750", gex: -1.2 },
  { k: "5800", gex: -0.6 },
  { k: "5825", gex: 0.2 },
  { k: "5850", gex: 0.9 },
  { k: "5875", gex: 0.4 },
  { k: "5900", gex: 1.6 },
  { k: "5925", gex: 0.7 },
  { k: "5950", gex: 0.5 },
  { k: "5975", gex: 0.2 },
];

const SYNTHETIC_KEY_LEVELS = {
  netGamma: "+1.84B",
  gammaFlip: "5,812",
  maxPain: "5,775",
  callWall: "5,900",
  strikeCount: "124,820",
  computeMs: "0.82",
};

// ── Compute GEX per strike from a live options chain ─────────────────
//
// Convention (simplified, matches the viz's signed-bar layout):
//   • Call GEX = +Γ × OI × spot × 100   (positive → green bar)
//   • Put  GEX = −Γ × OI × spot × 100   (negative → rose bar)
// Summed per strike across both calls and puts at the first expiry.

interface GexRow {
  k: string;       // strike label
  gex: number;     // dollar gamma, in billions (signed)
}

interface GexStats {
  rows: GexRow[];
  netGamma: number;        // total net gamma, billions
  gammaFlip: number | null; // strike where cumulative gamma crosses zero
  maxPain: number | null;   // strike with max total OI (put + call)
  callWall: number | null;  // strike with max call gamma
  spot: number;
}

function computeGexFromChain(chain: NormalizedOption[], spot: number): GexStats | null {
  if (chain.length === 0 || spot <= 0) return null;

  // Pick the shortest-dated expiry (front-month) for the GEX profile.
  const expiries = Array.from(new Set(chain.map((c) => c.expiry))).sort();
  if (expiries.length === 0) return null;
  const expiry = expiries[0];

  const bucket = chain.filter((c) => c.expiry === expiry);
  if (bucket.length === 0) return null;

  // Group by strike — sum gamma × OI × spot × 100, signed.
  const byStrike = new Map<number, { gex: number; callGex: number; putGex: number; totalOi: number; callOi: number }>();
  for (const c of bucket) {
    const gamma = c.gamma || 0;
    const oi = c.openInterest || 0;
    const gexUsd = gamma * oi * spot * 100; // USD per 1.0 spot move
    const gexBn = gexUsd / 1e9;              // convert to billions
    const signed = c.type === "call" ? gexBn : -gexBn;
    const entry = byStrike.get(c.strike) ?? {
      gex: 0, callGex: 0, putGex: 0, totalOi: 0, callOi: 0,
    };
    entry.gex += signed;
    if (c.type === "call") {
      entry.callGex += gexBn;
      entry.callOi += oi;
    } else {
      entry.putGex += -gexBn; // positive number for put-magnitude
    }
    entry.totalOi += oi;
    byStrike.set(c.strike, entry);
  }

  // Pick the 12 strikes around spot with the largest |gex|.
  const allStrikes = Array.from(byStrike.keys()).sort((a, b) => a - b);
  const sortedByProximity = [...allStrikes].sort(
    (a, b) => Math.abs(a - spot) - Math.abs(b - spot)
  );
  const nearbyStrikes = new Set(sortedByProximity.slice(0, 12));
  const selected = allStrikes
    .filter((k) => nearbyStrikes.has(k))
    .sort((a, b) => a - b);

  if (selected.length === 0) return null;

  const rows: GexRow[] = selected.map((k) => ({
    k: k >= 1000 ? k.toFixed(0) : k.toFixed(1),
    gex: byStrike.get(k)!.gex,
  }));

  const netGamma = rows.reduce((s, r) => s + r.gex, 0);

  // Gamma flip: strike where cumulative gamma (sorted by strike) crosses zero.
  let gammaFlip: number | null = null;
  let cum = 0;
  for (const k of selected) {
    const prev = cum;
    cum += byStrike.get(k)!.gex;
    if (prev !== 0 && Math.sign(prev) !== Math.sign(cum)) {
      gammaFlip = k;
      break;
    }
  }

  // Max pain: strike with the largest total OI.
  let maxPain: number | null = null;
  let maxOi = -1;
  for (const k of selected) {
    const e = byStrike.get(k)!;
    if (e.totalOi > maxOi) {
      maxOi = e.totalOi;
      maxPain = k;
    }
  }

  // Call wall: strike with the largest call GEX.
  let callWall: number | null = null;
  let maxCallGex = -Infinity;
  for (const k of selected) {
    const e = byStrike.get(k)!;
    if (e.callGex > maxCallGex) {
      maxCallGex = e.callGex;
      callWall = k;
    }
  }

  return { rows, netGamma, gammaFlip, maxPain, callWall, spot };
}

// ── Section ──────────────────────────────────────────────────────────

export function GexSection() {
  return (
    <section id="gex" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-30" aria-hidden />

      {/* Decorative cyan glow dots near the GEX profile */}
      <div className="glow-dot glow-dot-cyan" style={{ top: "15%", right: "10%" }} aria-hidden />
      <div className="glow-dot glow-dot-cyan" style={{ top: "45%", right: "5%" }} aria-hidden />
      <div className="glow-dot glow-dot-cyan" style={{ bottom: "20%", right: "15%" }} aria-hidden />
      <div className="glow-dot glow-dot-cyan" style={{ bottom: "35%", left: "8%" }} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          {/* Left — copy + cards */}
          <div className="min-w-0">
            <div className="eyebrow">/gex · flagship engine</div>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
              Dealer positioning,
              <br />
              <span className="text-gradient-emerald">decoded in real time.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60">
              The same gamma-exposure framework Tier-1 desks use — calculating GEX, DEX and VEX
              across 100,000+ strikes per market in real time, then surfacing gamma flips, max
              pain and call/put walls directly in Telegram.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {exposureCards.map((c, i) => {
                const cm = colorMap[c.color];
                return (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60 p-4 hover-lift"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cm.border} ${cm.bg}`}
                      >
                        <c.icon className={`h-4.5 w-4.5 ${cm.text}`} />
                      </div>
                      <div className="min-w-0">
                        <div className={`font-mono text-xs font-semibold ${cm.text}`}>
                          {c.name}
                        </div>
                        <div className="mt-1 font-mono text-[0.6rem] text-white/35">
                          {c.formula}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                          {c.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right — GEX profile visualization + Monte Carlo VaR */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* GEX profile card */}
            <GexProfileCard />

            {/* Monte Carlo VaR */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="eyebrow text-[0.6rem]">Monte Carlo VaR</span>
              </div>
              <MonteCarloViz />
            </div>
          </div>
        </div>

        {/* Vol Surface — full-width below the grid */}
        <div className="mt-8 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="eyebrow text-[0.6rem]">Volatility Surface</span>
          </div>
          <VolSurfaceViz />
        </div>

        {/* IV Skew — full-width below Vol Surface */}
        <div className="mt-8 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="eyebrow text-[0.6rem]">IV Skew Profile</span>
          </div>
          <IVSkewViz />
        </div>
      </div>
    </section>
  );
}

// ── GEX profile card (live data aware) ──────────────────────────────

function GexProfileCard() {
  const [symbol, setSymbol] = useState<"BTC" | "ETH">("BTC");
  const [optionsData, setOptionsData] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === symbol) return;
    fetchedRef.current = symbol;
    let aborted = false;
    (async () => {
      setLoading(true);
      const data = await fetchOptionsChain(symbol);
      if (aborted) return;
      setOptionsData(data);
      setLoading(false);
    })();
    const id = setInterval(() => {
      invalidateOptionsChain(symbol);
      fetchOptionsChain(symbol, { force: true }).then((data) => {
        if (!aborted) setOptionsData(data);
      });
    }, 60_000);
    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, [symbol]);

  const live = optionsData?.live ?? false;
  const source: OptionSource | undefined = optionsData?.source;
  const spot = optionsData?.spot ?? 0;

  // Compute live GEX, fall back to synthetic.
  const gexStats = useMemo<GexStats | null>(() => {
    if (optionsData && optionsData.contracts.length > 0 && spot > 0) {
      return computeGexFromChain(optionsData.contracts, spot);
    }
    return null;
  }, [optionsData, spot]);

  // Pick rows + key levels: live if available, else synthetic.
  const rows: GexRow[] = gexStats?.rows ?? SYNTHETIC_GEX;
  const netGamma = gexStats
    ? formatGamma(gexStats.netGamma)
    : SYNTHETIC_KEY_LEVELS.netGamma;
  const gammaFlip = gexStats?.gammaFlip
    ? gexStats.gammaFlip.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : SYNTHETIC_KEY_LEVELS.gammaFlip;
  const maxPain = gexStats?.maxPain
    ? gexStats.maxPain.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : SYNTHETIC_KEY_LEVELS.maxPain;
  const callWall = gexStats?.callWall
    ? gexStats.callWall.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : SYNTHETIC_KEY_LEVELS.callWall;
  const strikeCount = optionsData
    ? optionsData.contracts.length.toLocaleString("en-US")
    : SYNTHETIC_KEY_LEVELS.strikeCount;
  const computeMs = optionsData
    ? "<100"
    : SYNTHETIC_KEY_LEVELS.computeMs;

  return (
    <div className="border-glow border-gradient rounded-2xl bg-noise bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl card-inner-glow">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-white">
              {symbol} · GEX Profile
            </span>
            {/* Symbol selector */}
            <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-0.5">
              {(["BTC", "ETH"] as const).map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-wider transition-colors ${
                    symbol === sym
                      ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  aria-pressed={symbol === sym}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-wider text-white/40">
            {loading
              ? "loading live OI…"
              : live && source
              ? `front month · ${source} feed`
              : "front month · synthetic"}
          </div>
        </div>
        <div className="text-right">
          <div className="ticker-glow numeric font-mono text-lg font-semibold text-emerald-400">
            {netGamma}
          </div>
          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
            net gamma
          </div>
        </div>
      </div>

      {/* Histogram */}
      <GexHistogram rows={rows} />

      {/* Key levels */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-amber-400/80">
            Gamma Flip
          </div>
          <div className="numeric mt-1 font-mono text-base font-semibold text-amber-400">
            {gammaFlip}
          </div>
        </div>
        <div className="rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-rose-400/80">
            Max Pain
          </div>
          <div className="numeric mt-1 font-mono text-base font-semibold text-rose-400">
            {maxPain}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-emerald-400/80">
            Call Wall
          </div>
          <div className="numeric mt-1 font-mono text-base font-semibold text-emerald-400">
            {callWall}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[0.6rem] text-white/40">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "bg-emerald-400 animate-live-pulse" : "bg-amber-400"
            }`}
          />
          {live ? `GEX · LIVE · ${source}` : "GEX · synthetic demo"}
          <span className="text-white/25">· {strikeCount} contracts · {computeMs}s</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-3">
        <SchematicDisclaimer
          live={live}
          source={source}
          note="front-month GEX · 60s refresh"
        />
      </div>
    </div>
  );
}

function formatGamma(bn: number): string {
  // Format net gamma: ±X.XXB (always 2 decimals, sign always shown).
  const sign = bn >= 0 ? "+" : "-";
  return `${sign}${Math.abs(bn).toFixed(2)}B`;
}

// ── Bidirectional gamma histogram ───────────────────────────────────
//
// Positive GEX (call gamma) → emerald bar growing upward from center.
// Negative GEX (put gamma)  → rose bar growing downward from center.

function GexHistogram({ rows }: { rows: GexRow[] }) {
  const max = Math.max(...rows.map((s) => Math.abs(s.gex)), 0.1);
  const barMaxH = 56; // px per side

  return (
    <div>
      <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-wider text-white/35">
        <span className="text-rose-400/70">← put gamma (negative)</span>
        <span className="text-emerald-400/70">call gamma (positive) →</span>
      </div>

      <div className="relative">
        {/* center axis */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />

        <div className="flex h-44 items-stretch justify-between gap-1.5">
          {rows.map((s) => {
            const h = (Math.abs(s.gex) / max) * barMaxH;
            return (
              <div
                key={s.k}
                className="flex flex-1 flex-col items-center justify-center"
              >
                {/* upper half (positive) */}
                <div className="flex h-1/2 w-full items-end justify-center">
                  {s.gex >= 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="w-full max-w-[28px] rounded-t-sm bg-gradient-to-t from-emerald-400/40 to-emerald-400"
                    />
                  )}
                </div>
                {/* lower half (negative) */}
                <div className="flex h-1/2 w-full items-start justify-center">
                  {s.gex < 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="w-full max-w-[28px] rounded-b-sm bg-gradient-to-b from-rose-400/40 to-rose-400"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* strike labels */}
        <div className="mt-1 flex justify-between gap-1.5">
          {rows.map((s) => (
            <span
              key={s.k}
              className="flex-1 text-center font-mono text-[0.5rem] text-white/35"
            >
              {s.k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
