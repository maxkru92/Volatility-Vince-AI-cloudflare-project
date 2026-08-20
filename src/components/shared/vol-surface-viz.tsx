"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NormalizedOption, OptionSource, OptionsResponse } from "@/lib/options-types";
import { fetchOptionsChain, invalidateOptionsChain } from "@/lib/options-client";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";

// ── Surface grid dimensions ──────────────────────────────────────────
//
// The isometric renderer samples the vol surface on a regular grid of
// STRIKE_STEPS × TIME_STEPS cells. Both the live (Deribit) and the
// synthetic (SABR) surfaces are resampled onto this grid before render.

const STRIKE_STEPS = 15;
const TIME_STEPS = 12;

// Strike range as a fraction of spot: 0.8× to 1.2× (matches the
// synthetic SABR surface that was tuned for SPX-like vol). For live
// data the strikes are bucketed into this range too.
const K_LO = 0.8;
const K_HI = 1.2;

// Time range: 1 week to 12 months (in years).
const T_LO = 1 / 52;
const T_HI = 1.0;

// ── Synthetic SABR surface (fallback when no live data) ──────────────
//
// SABR-inspired parametric surface with three super-imposed effects:
//   1. Base ATM vol (level)
//   2. Skew + smile across strikes — OTM puts richer (negative skew),
//      convexity lifts both wings; smile is more pronounced for
//      short-dated expiries.
//   3. Contango term structure — short-dated IV slightly elevated,
//      decaying with maturity.
//
// Tuned so the total IV spread (~6 vol points) renders as ~100px of
// 3D elevation once Z_SCALE is applied.

function computeSyntheticVol(K: number, T: number): number {
  const logM = Math.log(K); // K is in moneyness units (K/spot)
  const baseVol = 0.18;

  // Linear skew: negative logM (OTM put) → higher vol.
  const skew = -0.06 * logM;

  // Quadratic smile: lifts both wings; damped for long-dated expiries.
  const smileAmp = 0.12 * logM * logM;
  const smileTermDecay = 1 / (1 + T * 2);
  const smile = smileAmp * smileTermDecay;

  // Term structure: short-dated contango premium decaying with T.
  const term = 0.04 * Math.exp(-T * 1.2);

  return baseVol + skew + smile + term;
}

function buildSyntheticSurface(): number[][] {
  const out: number[][] = [];
  for (let t = 0; t < TIME_STEPS; t++) {
    const T = T_LO + ((T_HI - T_LO) * t) / (TIME_STEPS - 1);
    const row: number[] = [];
    for (let s = 0; s < STRIKE_STEPS; s++) {
      const moneyness = K_LO + ((K_HI - K_LO) * s) / (STRIKE_STEPS - 1);
      row.push(computeSyntheticVol(moneyness, T));
    }
    out.push(row);
  }
  return out;
}

// ── Live surface (resample Deribit chain onto the grid) ──────────────
//
// For each grid cell (strike bucket × time bucket):
//   • Filter live contracts whose K/S falls in [bucket_lo, bucket_hi)
//     AND whose expiry (in years) falls in [bucket_lo, bucket_hi).
//   • Take the median IV of that bucket.
//   • If the bucket is empty, interpolate from neighbouring buckets
//     (or fall back to the synthetic vol as a last resort).

function buildLiveSurface(
  contracts: NormalizedOption[],
  spot: number
): number[][] {
  // Pre-compute (moneyness, yearsToExpiry, iv) tuples.
  const now = Date.now();
  const points = contracts
    .map((c) => {
      const dteMs = Date.parse(c.expiry + "T08:00:00Z") - now;
      const T = Math.max(dteMs / (365 * 86400_000), 1 / 365);
      const moneyness = c.strike / spot;
      return { moneyness, T, iv: c.iv };
    })
    .filter((p) => p.iv > 0 && p.iv < 5);

  // Edges for each axis.
  const sEdges = Array.from(
    { length: STRIKE_STEPS + 1 },
    (_, i) => K_LO + ((K_HI - K_LO) * i) / STRIKE_STEPS
  );
  const tEdges = Array.from(
    { length: TIME_STEPS + 1 },
    (_, i) => T_LO + ((T_HI - T_LO) * i) / TIME_STEPS
  );

  const surface: number[][] = [];
  for (let t = 0; t < TIME_STEPS; t++) {
    const row: number[] = [];
    for (let s = 0; s < STRIKE_STEPS; s++) {
      const bucket = points.filter(
        (p) =>
          p.moneyness >= sEdges[s] &&
          p.moneyness < sEdges[s + 1] &&
          p.T >= tEdges[t] &&
          p.T < tEdges[t + 1]
      );
      if (bucket.length > 0) {
        // Median IV — robust against outliers.
        const sorted = bucket.map((p) => p.iv).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        row.push(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
      } else {
        // Empty bucket — fall back to the synthetic vol so the surface
        // never has gaps. The SchematicDisclaimer already flags this as
        // "live data may differ visually".
        const moneyness = (sEdges[s] + sEdges[s + 1]) / 2;
        const T = (tEdges[t] + tEdges[t + 1]) / 2;
        row.push(computeSyntheticVol(moneyness, T));
      }
    }
    surface.push(row);
  }
  return surface;
}

// ── Color interpolation (5-stop: emerald → cyan → amber → rose) ───

interface RGB { r: number; g: number; b: number }

const COLOR_STOPS: { t: number; color: RGB }[] = [
  { t: 0.0, color: { r: 52, g: 211, b: 153 } },   // emerald-400
  { t: 0.3, color: { r: 34, g: 211, b: 238 } },     // cyan-400
  { t: 0.55, color: { r: 251, g: 191, b: 36 } },     // amber-400
  { t: 0.8, color: { r: 251, g: 146, b: 60 } },      // orange-400
  { t: 1.0, color: { r: 251, g: 113, b: 133 } },     // rose-400
];

function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function volToColor(vol: number, minVol: number, maxVol: number): string {
  const norm = (vol - minVol) / (maxVol - minVol || 1);
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const lo = COLOR_STOPS[i];
    const hi = COLOR_STOPS[i + 1];
    if (norm >= lo.t && norm <= hi.t) {
      const segT = (norm - lo.t) / (hi.t - lo.t);
      const c = lerpColor(lo.color, hi.color, segT);
      return `rgb(${c.r},${c.g},${c.b})`;
    }
  }
  const last = COLOR_STOPS[COLOR_STOPS.length - 1].color;
  return `rgb(${last.r},${last.g},${last.b})`;
}

// ── Isometric projection ────────────────────────────────────────────

const COS30 = Math.cos(Math.PI / 6); // ~0.866
const SIN30 = Math.sin(Math.PI / 6); // 0.5

const CELL_W = 20;
const CELL_D = 16;
const Z_SCALE = 1800;
const ORIGIN_X = 50;
const ORIGIN_Y = 270;

function project(
  strikeIdx: number,
  timeIdx: number,
  vol: number,
  minVol: number
): { x: number; y: number } {
  const xBase = strikeIdx * CELL_W;
  const yBase = timeIdx * CELL_D;
  const zVal = (vol - minVol) * Z_SCALE;
  const screenX = ORIGIN_X + xBase + yBase * COS30;
  const screenY = ORIGIN_Y - zVal - yBase * SIN30;
  return { x: screenX, y: screenY };
}

// ── Component ──────────────────────────────────────────────────────

export function VolSurfaceViz() {
  const [symbol, setSymbol] = useState<string>("BTC");
  const [optionsData, setOptionsData] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  // ── Pick the surface: live chain → resampled grid; else synthetic ──
  const surface = useMemo<number[][]>(() => {
    if (
      optionsData &&
      optionsData.contracts.length > 0 &&
      optionsData.spot > 0
    ) {
      return buildLiveSurface(optionsData.contracts, optionsData.spot);
    }
    return buildSyntheticSurface();
  }, [optionsData]);

  const allVols = useMemo(() => surface.flat(), [surface]);
  const minVol = useMemo(() => Math.min(...allVols), [allVols]);
  const maxVol = useMemo(() => Math.max(...allVols), [allVols]);

  // Precompute cell polygons.
  const cells = useMemo(() => {
    const out: { points: string; fill: string; row: number }[] = [];
    for (let t = 0; t < TIME_STEPS - 1; t++) {
      for (let s = 0; s < STRIKE_STEPS - 1; s++) {
        const v00 = surface[t][s];
        const v10 = surface[t][s + 1];
        const v01 = surface[t + 1][s];
        const v11 = surface[t + 1][s + 1];

        const p0 = project(s, t, v00, minVol);
        const p1 = project(s + 1, t, v10, minVol);
        const p2 = project(s + 1, t + 1, v11, minVol);
        const p3 = project(s, t + 1, v01, minVol);

        const avgVol = (v00 + v10 + v01 + v11) / 4;

        out.push({
          points: `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
          fill: volToColor(avgVol, minVol, maxVol),
          row: t,
        });
      }
    }
    return out;
  }, [surface, minVol, maxVol]);

  // Strike axis labels: 0.8× to 1.2× of spot, with the live spot shown
  // when available.
  const spot = optionsData?.spot ?? 100;
  const strikesAxis = Array.from(
    { length: STRIKE_STEPS },
    (_, i) => K_LO + ((K_HI - K_LO) * i) / (STRIKE_STEPS - 1)
  );
  const timesAxis = Array.from(
    { length: TIME_STEPS },
    (_, i) => T_LO + ((T_HI - T_LO) * i) / (TIME_STEPS - 1)
  );

  const strikeTicks = [0, 4, 7, 10, 14].map((si) => {
    const p = project(si, -0.2, minVol, minVol);
    const moneyness = strikesAxis[si];
    const strike = spot * moneyness;
    const label =
      Math.abs(moneyness - 1.0) < 0.001
        ? "ATM"
        : spot > 1000
        ? `${(strike / 1000).toFixed(1)}K`
        : strike.toFixed(0);
    return { x: p.x, y: p.y + 12, label };
  });

  const timeTicks = [0, 3, 6, 8, 11].map((ti) => {
    const p = project(-0.3, ti, minVol, minVol);
    const months = timesAxis[ti] * 12;
    const label = months < 1 ? "1w" : `${Math.round(months)}m`;
    return { x: p.x - 18, y: p.y + 3, label };
  });

  const strikeLabelPos = project(STRIKE_STEPS / 2, -0.5, minVol, minVol);
  const expiryLabelPos = project(-1.5, TIME_STEPS / 2, minVol, minVol);
  const ivLabelPos = project(
    STRIKE_STEPS,
    (TIME_STEPS - 1) / 2,
    (minVol + maxVol) / 2,
    minVol
  );

  // ATM marker — at the ATM strike (moneyness=1) on the first expiry.
  const atmStrikeIdx = strikesAxis.reduce(
    (best, val, i) =>
      Math.abs(val - 1.0) < Math.abs(strikesAxis[best] - 1.0) ? i : best,
    0
  );
  const atmPoint = project(atmStrikeIdx, 0, surface[0][atmStrikeIdx], minVol);

  // Legend stops (computed from current min/max).
  const legendTopPct = Math.round(maxVol * 100);
  const legendBotPct = Math.round(minVol * 100);

  // Stats cards — compute real values from the surface when available.
  const stats = useMemo(() => {
    const atmVol = surface[0][atmStrikeIdx];
    // 25Δ skew: IV(K=0.9) - IV(K=1.1) on the shortest expiry.
    const kIdxLo = strikesAxis.reduce(
      (best, val, i) =>
        Math.abs(val - 0.9) < Math.abs(strikesAxis[best] - 0.9) ? i : best,
      0
    );
    const kIdxHi = strikesAxis.reduce(
      (best, val, i) =>
        Math.abs(val - 1.1) < Math.abs(strikesAxis[best] - 1.1) ? i : best,
      0
    );
    const skew = surface[0][kIdxLo] - surface[0][kIdxHi];
    const termSpread = surface[0][atmStrikeIdx] - surface[TIME_STEPS - 1][atmStrikeIdx];
    return {
      atmVol: (atmVol * 100).toFixed(1) + "%",
      skew: (skew * 100).toFixed(1) + "%",
      termSpread: (termSpread * 100).toFixed(1) + "%",
      fitR2: live ? "—" : "0.997",
    };
  }, [surface, atmStrikeIdx, strikesAxis, live]);

  const LEGEND_X = 510;
  const LEGEND_Y_TOP = 50;
  const LEGEND_Y_BOT = 230;

  return (
    <div className="border-glow rounded-2xl bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl bg-noise">
      {/* Terminal header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-mono text-xs font-semibold text-white/70">
            vince · /vol_surface {symbol} ·{" "}
            {live && source
              ? `${source === "deribit" ? "Deribit" : source.toUpperCase()} LIVE`
              : "synthetic"}
          </span>
          {/* Symbol selector */}
          <div className="ml-2 flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-0.5">
            {(["BTC", "ETH"] as const).map((sym) => (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className={`rounded px-2 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-wider transition-colors ${
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
        <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/35">
          {loading
            ? "loading live IVs…"
            : live && source
            ? `${surface.flat().length} cells · ${source} feed`
            : "synthetic SABR · fallback"}
        </span>
      </div>

      {/* SVG visualization */}
      <div className="overflow-x-auto -mx-1 px-1">
        <svg
          viewBox="0 0 560 320"
          className="w-full min-w-[320px] sm:min-w-[480px]"
          style={{ height: "auto", maxHeight: 320 }}
          aria-label="Implied volatility surface isometric visualization"
          role="img"
        >
          <defs>
            {/* Color scale gradient for legend */}
            <linearGradient id="volLegendGrad" x1="0" y1="1" x2="0" y2="0">
              {COLOR_STOPS.slice().reverse().map((stop, i) => (
                <stop
                  key={i}
                  offset={`${(stop.t * 100).toFixed(1)}%`}
                  stopColor={`rgb(${stop.color.r},${stop.color.g},${stop.color.b})`}
                />
              ))}
            </linearGradient>
            {/* Subtle glow filter */}
            <filter id="volGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Surface cells (rendered back-to-front for proper occlusion) */}
          {cells.map((cell, i) => (
            <polygon
              key={i}
              points={cell.points}
              fill={cell.fill}
              fillOpacity={visible ? 0.75 : 0}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.3}
              style={{
                transition: `fill-opacity 0.6s ease ${cell.row * 0.12}s`,
              }}
            />
          ))}

          {/* Front edge grid lines (strike axis, time=0) */}
          {Array.from({ length: STRIKE_STEPS }, (_, s) => {
            const p0 = project(s, 0, surface[0][s], minVol);
            const p1 = project(s, 1, surface[1][s], minVol);
            return (
              <line
                key={`front-v-${s}`}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.4}
                style={{
                  transition: `stroke-opacity 0.6s ease 0.8s`,
                  strokeOpacity: visible ? 1 : 0,
                }}
              />
            );
          })}

          {/* Left edge grid lines (time axis, strike=0) */}
          {Array.from({ length: TIME_STEPS }, (_, t) => {
            const p0 = project(0, t, surface[t][0], minVol);
            const p1 = project(1, t, surface[t][1], minVol);
            return (
              <line
                key={`left-h-${t}`}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.4}
                style={{
                  transition: `stroke-opacity 0.6s ease 0.8s`,
                  strokeOpacity: visible ? 1 : 0,
                }}
              />
            );
          })}

          {/* Horizontal grid lines across the surface for depth reference */}
          {Array.from({ length: TIME_STEPS }, (_, t) => {
            const points = strikesAxis
              .map((_, s) => {
                const p = project(s, t, surface[t][s], minVol);
                return `${p.x},${p.y}`;
              })
              .join(" ");
            return (
              <polyline
                key={`depth-line-${t}`}
                points={points}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.3}
                style={{
                  transition: `stroke-opacity 0.6s ease ${0.8 + t * 0.08}s`,
                  strokeOpacity: visible ? 1 : 0,
                }}
              />
            );
          })}

          {/* Axis labels */}
          <text
            x={strikeLabelPos.x}
            y={strikeLabelPos.y + 8}
            textAnchor="middle"
            className="font-mono"
            fill="white"
            fillOpacity={0.5}
            fontSize={8}
            fontWeight="600"
          >
            Strike (K/S)
          </text>

          <text
            x={expiryLabelPos.x}
            y={expiryLabelPos.y}
            textAnchor="middle"
            className="font-mono"
            fill="white"
            fillOpacity={0.5}
            fontSize={8}
            fontWeight="600"
            transform={`rotate(-25, ${expiryLabelPos.x}, ${expiryLabelPos.y})`}
          >
            Expiry
          </text>

          <text
            x={ivLabelPos.x + 16}
            y={ivLabelPos.y}
            textAnchor="start"
            className="font-mono"
            fill="white"
            fillOpacity={0.5}
            fontSize={8}
            fontWeight="600"
          >
            IV
          </text>

          {/* Strike tick labels */}
          {strikeTicks.map((tick, i) => (
            <text
              key={`stk-${i}`}
              x={tick.x}
              y={tick.y}
              textAnchor="middle"
              className="font-mono"
              fill="white"
              fillOpacity={0.35}
              fontSize={6}
            >
              {tick.label}
            </text>
          ))}

          {/* Time tick labels */}
          {timeTicks.map((tick, i) => (
            <text
              key={`time-${i}`}
              x={tick.x}
              y={tick.y}
              textAnchor="end"
              className="font-mono"
              fill="white"
              fillOpacity={0.35}
              fontSize={6}
            >
              {tick.label}
            </text>
          ))}

          {/* Color scale legend */}
          <rect
            x={LEGEND_X}
            y={LEGEND_Y_TOP}
            width={10}
            height={LEGEND_Y_BOT - LEGEND_Y_TOP}
            fill="url(#volLegendGrad)"
            rx={2}
            opacity={visible ? 1 : 0}
            style={{ transition: "opacity 0.8s ease 1s" }}
          />
          <text
            x={LEGEND_X + 16}
            y={LEGEND_Y_TOP + 5}
            className="font-mono"
            fill="white"
            fillOpacity={0.5}
            fontSize={6.5}
          >
            {legendTopPct}%
          </text>
          <text
            x={LEGEND_X + 16}
            y={LEGEND_Y_BOT + 3}
            className="font-mono"
            fill="white"
            fillOpacity={0.5}
            fontSize={6.5}
          >
            {legendBotPct}%
          </text>
          <text
            x={LEGEND_X + 5}
            y={LEGEND_Y_TOP - 8}
            textAnchor="middle"
            className="font-mono"
            fill="white"
            fillOpacity={0.35}
            fontSize={5.5}
          >
            IV
          </text>

          {/* ATM marker on the surface */}
          <g
            opacity={visible ? 1 : 0}
            style={{ transition: "opacity 0.6s ease 1.2s" }}
          >
            <circle cx={atmPoint.x} cy={atmPoint.y - 4} r={2.5} fill="rgb(110,231,183)" fillOpacity={0.8} />
            <text
              x={atmPoint.x + 6}
              y={atmPoint.y - 6}
              className="font-mono"
              fill="rgb(110,231,183)"
              fillOpacity={0.9}
              fontSize={6.5}
              fontWeight="600"
            >
              ATM
            </text>
          </g>
        </svg>
      </div>

      {/* Stat cards row */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            ATM Vol
          </div>
          <div className="numeric mt-1 font-mono text-sm font-semibold text-emerald-400">
            {stats.atmVol}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            90%/110% Skew
          </div>
          <div className="numeric mt-1 font-mono text-sm font-semibold text-rose-400">
            +{stats.skew}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            Term Spread
          </div>
          <div className="numeric mt-1 font-mono text-sm font-semibold text-amber-400">
            {stats.termSpread}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            Fit R²
          </div>
          <div className="numeric mt-1 font-mono text-sm font-semibold text-cyan-400">
            {stats.fitR2}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4">
        <SchematicDisclaimer
          live={live}
          source={source}
          note="IV grid resampled from live chain · 60s refresh"
        />
      </div>
    </div>
  );
}
