"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cpu } from "lucide-react";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";

// ── Seeded PRNG (Mulberry32) ───────────────────────────────────────

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Simulation params ──────────────────────────────────────────────

type PathCount = 1000 | 10000 | 100000;
type Horizon = 5 | 20 | 60;

const PATH_OPTIONS: { label: string; value: PathCount }[] = [
  { label: "1K", value: 1000 },
  { label: "10K", value: 10000 },
  { label: "100K", value: 100000 },
];

const HORIZON_OPTIONS: { label: string; value: Horizon }[] = [
  { label: "5D", value: 5 },
  { label: "20D", value: 20 },
  { label: "60D", value: 60 },
];

// Annualized params.
const MU = 0.08; // drift
const SIGMA = 0.25; // vol
const START_VALUE = 100_000;
const TRADING_DAYS = 252;

// ── Simulation engine ──────────────────────────────────────────────

interface SimResult {
  paths: number[][]; // [pathIndex][day] — all paths (first 50 for rendering)
  finalValues: number[]; // all final values
  medianPath: number[];
  p5Path: number[];
  p95Path: number[];
  vaR95: number;
  cVaR95: number;
  medianReturn: number;
  worstCase: number;
}

function runSimulation(paths: PathCount, horizon: Horizon, seed: number): SimResult {
  const rng = mulberry32(seed);
  const dt = 1 / TRADING_DAYS;
  const drift = (MU - 0.5 * SIGMA * SIGMA) * dt;
  const vol = SIGMA * Math.sqrt(dt);

  const allPaths: number[][] = [];
  const finalValues: number[] = [];

  for (let p = 0; p < paths; p++) {
    const path = [START_VALUE];
    let value = START_VALUE;
    for (let d = 1; d <= horizon; d++) {
      const z = boxMuller(rng);
      value = value * Math.exp(drift + vol * z);
      path.push(value);
    }
    allPaths.push(path);
    finalValues.push(value);
  }

  // Compute percentiles at each day.
  const medianPath: number[] = [];
  const p5Path: number[] = [];
  const p95Path: number[] = [];

  for (let d = 0; d <= horizon; d++) {
    const vals = allPaths.map((p) => p[d]).sort((a, b) => a - b);
    medianPath.push(percentile(vals, 50));
    p5Path.push(percentile(vals, 5));
    p95Path.push(percentile(vals, 95));
  }

  // Sort final values for risk metrics.
  const sortedFinals = [...finalValues].sort((a, b) => a - b);
  const varIndex = Math.floor(0.05 * paths);
  const vaR95 = START_VALUE - sortedFinals[varIndex];
  // CVaR = expected loss given loss exceeds VaR.
  const tailValues = sortedFinals.slice(0, varIndex + 1);
  const cVaR95 = START_VALUE - tailValues.reduce((s, v) => s + v, 0) / tailValues.length;
  const medianReturn = (medianPath[horizon] / START_VALUE - 1) * 100;
  const worstCase = sortedFinals[0];

  return {
    paths: allPaths.slice(0, 50), // only first 50 for rendering
    finalValues,
    medianPath,
    p5Path,
    p95Path,
    vaR95,
    cVaR95,
    medianReturn,
    worstCase,
  };
}

// Box-Muller transform for normal random numbers.
function boxMuller(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1 || 1e-10));
  return r * Math.cos(2 * Math.PI * u2);
}

// Percentile from sorted array.
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Histogram helper ───────────────────────────────────────────────

function buildHistogram(values: number[], bins = 20): { x: number; count: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;
  const hist = Array.from({ length: bins }, (_, i) => ({
    x: min + (i + 0.5) * binWidth,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    hist[idx].count++;
  }
  return hist;
}

// ── Main component ─────────────────────────────────────────────────

export function MonteCarloViz() {
  const [pathCount, setPathCount] = useState<PathCount>(10000);
  const [horizon, setHorizon] = useState<Horizon>(20);
  const [result, setResult] = useState<SimResult | null>(null);
  const [animProgress, setAnimProgress] = useState(0); // 0..1 for path drawing animation
  const [running, setRunning] = useState(false);
  const seedRef = useRef(42);
  const animRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const run = useCallback((paths: PathCount, horiz: Horizon, newSeed?: number) => {
    if (newSeed !== undefined) seedRef.current = newSeed;
    const sim = runSimulation(paths, horiz, seedRef.current);
    setResult(sim);
    setAnimProgress(0);
    setRunning(true);
  }, []);

  // Auto-run on mount.
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    run(10000, 20, 42);
  }, [run]);

  // Animation loop.
  useEffect(() => {
    if (!running || !result) return;
    const start = performance.now();
    const duration = 1000; // 1 second animation

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimProgress(progress);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
      }
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [running, result]);

  const handleRun = () => {
    seedRef.current = Date.now() ^ (Math.random() * 0x100000000);
    run(pathCount, horizon, seedRef.current);
  };

  if (!result) return null;

  // ── SVG chart dimensions ──
  const chartW = 560;
  const chartH = 320;
  const padL = 56;
  const padR = 92; // space for histogram
  const padT = 14;
  const padB = 32;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  // ── Value range (use all final values for robust range) ──
  const allVals = [...result.paths.flat(), ...result.p5Path, ...result.p95Path];
  const minVal = Math.min(...allVals) * 0.97;
  const maxVal = Math.max(...allVals) * 1.03;
  const valRange = maxVal - minVal || 1;

  // ── Coordinate transforms ──
  const xScale = (day: number) => padL + (day / horizon) * plotW;
  const yScale = (val: number) => padT + (1 - (val - minVal) / valRange) * plotH;

  // ── Number of paths to show in animation ──
  // Always show at least a few paths so the chart is never empty
  const visiblePaths = Math.max(3, Math.floor(animProgress * result.paths.length));

  // ── Histogram ──
  const hist = buildHistogram(result.finalValues, 18);
  const maxCount = Math.max(...hist.map((h) => h.count), 1);
  const histGap = 2;
  const histBarW = (padR - 12) / hist.length - histGap;

  // ── Build percentile band polygon (closed shape: p95 forward + p5 reversed) ──
  const bandPoints =
    result.p95Path
      .map((v, d) => `${xScale(d)},${yScale(v)}`)
      .join(" ") +
    " " +
    result.p5Path
      .slice()
      .reverse()
      .map((v, d) => {
        const day = horizon - d;
        return `${xScale(day)},${yScale(v)}`;
      })
      .join(" ");

  // ── Build median area (under median line, subtle emerald fill) ──
  const medianAreaPoints =
    result.medianPath
      .map((v, d) => `${xScale(d)},${yScale(v)}`)
      .join(" ") +
    ` ${xScale(horizon)},${yScale(minVal)} ${xScale(0)},${yScale(minVal)}`;

  // ── Format helpers ──
  function fmtDollar(n: number): string {
    const abs = Math.abs(n);
    const sign = n >= 0 ? "+" : "-";
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  }

  function fmtPct(n: number): string {
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(1)}%`;
  }

  return (
    <div className="border-glow rounded-2xl bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl">
      {/* Terminal header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-mono text-xs font-semibold text-white/70">
            vince · /var SPX · Monte Carlo
          </span>
        </div>
        <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/35">
          {pathCount.toLocaleString()} paths · {horizon}D
        </span>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
            Paths:
          </span>
          {PATH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPathCount(opt.value)}
              className={`rounded px-2 py-0.5 font-mono text-[0.65rem] font-medium transition-colors ${
                pathCount === opt.value
                  ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
            Horizon:
          </span>
          {HORIZON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setHorizon(opt.value)}
              className={`rounded px-2 py-0.5 font-mono text-[0.65rem] font-medium transition-colors ${
                horizon === opt.value
                  ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-emerald-400/15 px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-400/25 disabled:opacity-50"
        >
          <Cpu className="h-3.5 w-3.5" />
          Run Simulation
        </button>
      </div>

      {/* SVG Visualization */}
      <div className="overflow-x-auto -mx-1 px-1">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full min-w-[320px] sm:min-w-[420px]"
          style={{ height: "auto", maxHeight: 340 }}
          aria-label="Monte Carlo VaR simulation paths"
          role="img"
        >
          <defs>
            <linearGradient id="mcBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="mcMedianGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mcHistGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Plot area background */}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="white"
            fillOpacity={0.015}
            rx={4}
          />

          {/* Grid lines (horizontal) */}
          {Array.from({ length: 5 }, (_, i) => {
            const val = minVal + (valRange / 4) * i;
            const y = yScale(val);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke="white"
                  strokeOpacity={0.06}
                  strokeWidth={0.5}
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="font-mono"
                  fill="white"
                  fillOpacity={0.4}
                  fontSize={7.5}
                >
                  {val >= 1e6 ? `${(val / 1e6).toFixed(1)}M` : val >= 1e3 ? `${(val / 1e3).toFixed(0)}K` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {Array.from({ length: Math.min(horizon, 6) }, (_, i) => {
            const day = Math.round((horizon / (Math.min(horizon, 6) - 1)) * i);
            return (
              <text
                key={`x-${day}`}
                x={xScale(day)}
                y={chartH - 8}
                textAnchor="middle"
                className="font-mono"
                fill="white"
                fillOpacity={0.4}
                fontSize={7.5}
              >
                D{day}
              </text>
            );
          })}

          {/* Start value reference line */}
          <line
            x1={padL}
            y1={yScale(START_VALUE)}
            x2={padL + plotW}
            y2={yScale(START_VALUE)}
            stroke="white"
            strokeOpacity={0.18}
            strokeDasharray="4,3"
            strokeWidth={0.7}
          />
          <text
            x={padL + 4}
            y={yScale(START_VALUE) - 4}
            className="font-mono"
            fill="white"
            fillOpacity={0.4}
            fontSize={7}
          >
            $100K start
          </text>

          {/* Percentile band (filled area between p5 and p95) */}
          <polygon
            points={bandPoints}
            fill="url(#mcBandGrad)"
            stroke="rgb(52,211,153)"
            strokeOpacity={0.25}
            strokeWidth={0.5}
          />

          {/* Simulated paths (first N, thin lines with better visibility) */}
          {result.paths.slice(0, visiblePaths).map((path, pi) => {
            // Color paths by their final return: emerald if up, rose if down
            const isUp = path[path.length - 1] >= START_VALUE;
            return (
              <polyline
                key={`path-${pi}`}
                points={path
                  .map((v, d) => `${xScale(d)},${yScale(v)}`)
                  .join(" ")}
                fill="none"
                stroke={isUp ? "rgb(52,211,153)" : "rgb(251,113,133)"}
                strokeOpacity={0.13}
                strokeWidth={0.6}
                strokeLinejoin="round"
              />
            );
          })}

          {/* P5 path line (rose) */}
          <polyline
            points={result.p5Path
              .map((v, d) => `${xScale(d)},${yScale(v)}`)
              .join(" ")}
            fill="none"
            stroke="rgb(251,113,133)"
            strokeWidth={1.2}
            strokeOpacity={0.7}
            strokeDasharray="3,2"
          />

          {/* P95 path line (emerald) */}
          <polyline
            points={result.p95Path
              .map((v, d) => `${xScale(d)},${yScale(v)}`)
              .join(" ")}
            fill="none"
            stroke="rgb(52,211,153)"
            strokeWidth={1.2}
            strokeOpacity={0.7}
            strokeDasharray="3,2"
          />

          {/* Median path (thick emerald) */}
          <polyline
            points={result.medianPath
              .map((v, d) => `${xScale(d)},${yScale(v)}`)
              .join(" ")}
            fill="none"
            stroke="rgb(110,231,183)"
            strokeWidth={2}
            strokeOpacity={1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Endpoint dots */}
          <circle
            cx={xScale(horizon)}
            cy={yScale(result.medianPath[horizon])}
            r={2.5}
            fill="rgb(110,231,183)"
          />
          <circle
            cx={xScale(horizon)}
            cy={yScale(result.p5Path[horizon])}
            r={2}
            fill="rgb(251,113,133)"
          />
          <circle
            cx={xScale(horizon)}
            cy={yScale(result.p95Path[horizon])}
            r={2}
            fill="rgb(52,211,153)"
          />

          {/* Path labels at right edge */}
          <text
            x={xScale(horizon) + 6}
            y={yScale(result.p5Path[horizon]) + 3}
            className="font-mono"
            fill="rgb(251,113,133)"
            fillOpacity={0.85}
            fontSize={7}
            fontWeight="600"
          >
            P5
          </text>
          <text
            x={xScale(horizon) + 6}
            y={yScale(result.p95Path[horizon]) + 3}
            className="font-mono"
            fill="rgb(52,211,153)"
            fillOpacity={0.85}
            fontSize={7}
            fontWeight="600"
          >
            P95
          </text>
          <text
            x={xScale(horizon) + 6}
            y={yScale(result.medianPath[horizon]) + 3}
            className="font-mono"
            fill="rgb(110,231,183)"
            fillOpacity={1}
            fontSize={7}
            fontWeight="700"
          >
            Med
          </text>

          {/* Histogram on right side (distribution of final values) */}
          {hist.map((bin, i) => {
            const barH = (bin.count / maxCount) * plotH * 0.7;
            const yStart = padT + plotH - barH;
            const xStart = padL + plotW + 14 + i * (histBarW + histGap);
            // Color bars by whether they're above or below start value
            const isGain = bin.x >= START_VALUE;
            return (
              <rect
                key={`hist-${i}`}
                x={xStart}
                y={yStart}
                width={histBarW}
                height={barH}
                fill={isGain ? "url(#mcHistGrad)" : "rgb(251,113,133)"}
                fillOpacity={isGain ? 1 : 0.3}
                rx={0.8}
              />
            );
          })}
          <text
            x={padL + plotW + 14 + (padR - 14) / 2}
            y={chartH - 8}
            textAnchor="middle"
            className="font-mono"
            fill="white"
            fillOpacity={0.4}
            fontSize={6.5}
          >
            distribution
          </text>

          {/* Legend (top-left of plot) */}
          <g transform={`translate(${padL + 8}, ${padT + 6})`}>
            <rect x={-4} y={-4} width={120} height={36} fill="black" fillOpacity={0.4} rx={3} />
            <line x1={0} y1={4} x2={14} y2={4} stroke="rgb(110,231,183)" strokeWidth={2} />
            <text x={18} y={7} className="font-mono" fill="white" fillOpacity={0.7} fontSize={7}>median</text>
            <line x1={0} y1={14} x2={14} y2={14} stroke="rgb(52,211,153)" strokeWidth={1} strokeDasharray="3,2" />
            <text x={18} y={17} className="font-mono" fill="white" fillOpacity={0.6} fontSize={7}>P95 band</text>
            <line x1={0} y1={24} x2={14} y2={24} stroke="rgb(251,113,133)" strokeWidth={1} strokeDasharray="3,2" />
            <text x={18} y={27} className="font-mono" fill="white" fillOpacity={0.6} fontSize={7}>P5 band</text>
          </g>
        </svg>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            VaR 95%
          </div>
          <div
            className={`numeric mt-1 font-mono text-sm font-semibold ${
              result.vaR95 <= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {fmtDollar(-result.vaR95)}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            CVaR 95%
          </div>
          <div
            className={`numeric mt-1 font-mono text-sm font-semibold ${
              result.cVaR95 <= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {fmtDollar(-result.cVaR95)}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            Median Return
          </div>
          <div
            className={`numeric mt-1 font-mono text-sm font-semibold ${
              result.medianReturn >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {fmtPct(result.medianReturn)}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            Worst Case
          </div>
          <div className="numeric mt-1 font-mono text-sm font-semibold text-rose-400">
            ${result.worstCase.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4">
        <SchematicDisclaimer
          live={false}
          note="GBM simulation · μ=8% σ=25% · 252d"
        />
      </div>
    </div>
  );
}
