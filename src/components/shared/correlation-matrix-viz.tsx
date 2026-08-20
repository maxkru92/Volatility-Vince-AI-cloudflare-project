"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";

// ── Instruments (10x10 matrix) ─────────────────────────────────────
// Order matters: indices, ETFs, vol, mega-cap tech, gold, long bonds.
const INSTRUMENTS = ["SPX", "NDX", "RUT", "VIX", "AAPL", "NVDA", "TSLA", "META", "GLD", "TLT"] as const;
const N = INSTRUMENTS.length;

// ── Hardcoded realistic 30-day rolling correlation matrix ──────────
// Symmetric, diagonal = 1.00. Values are approximate real-world correlations.
// Index map: 0=SPX, 1=NDX, 2=RUT, 3=VIX, 4=AAPL, 5=NVDA, 6=TSLA, 7=META, 8=GLD, 9=TLT
const RAW_CORRS: Array<[number, number, number]> = [
  // row, col, value  (upper triangle, including diagonal self-corr omitted)
  [0, 1, 0.95], [0, 2, 0.82], [0, 3, -0.78], [0, 4, 0.72], [0, 5, 0.68],
  [0, 6, 0.42], [0, 7, 0.61], [0, 8, 0.12], [0, 9, -0.32],

  [1, 2, 0.80], [1, 3, -0.74], [1, 4, 0.71], [1, 5, 0.79], [1, 6, 0.45],
  [1, 7, 0.66], [1, 8, 0.08], [1, 9, -0.30],

  [2, 3, -0.65], [2, 4, 0.55], [2, 5, 0.48], [2, 6, 0.50], [2, 7, 0.52],
  [2, 8, 0.18], [2, 9, -0.25],

  [3, 4, -0.55], [3, 5, -0.52], [3, 6, -0.40], [3, 7, -0.48], [3, 8, 0.22],
  [3, 9, 0.42],

  [4, 5, 0.62], [4, 6, 0.38], [4, 7, 0.48], [4, 8, 0.05], [4, 9, -0.18],

  [5, 6, 0.45], [5, 7, 0.55], [5, 8, 0.02], [5, 9, -0.15],

  [6, 7, 0.40], [6, 8, 0.08], [6, 9, -0.12],

  [7, 8, 0.10], [7, 9, -0.20],

  [8, 9, 0.55],
];

// Build the full symmetric 10x10 matrix.
const CORR_MATRIX: number[][] = Array.from({ length: N }, (_, r) =>
  Array.from({ length: N }, (_, c) => (r === c ? 1.0 : 0))
);
for (const [r, c, v] of RAW_CORRS) {
  CORR_MATRIX[r][c] = v;
  CORR_MATRIX[c][r] = v;
}

// ── Color stops for the 3-stop diverging heatmap ────────────────────
// -1.0 → rose-500      (244,  63,  94)
//  0.0 → neutral white (255, 255, 255) at low opacity
// +1.0 → emerald-400   ( 52, 211, 153)
interface RGB { r: number; g: number; b: number }
const STOP_NEG: RGB = { r: 244, g: 63, b: 94 };
const STOP_MID: RGB = { r: 255, g: 255, b: 255 };
const STOP_POS: RGB = { r: 52, g: 211, b: 153 };

function lerp(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/** Returns {fill, opacity} for a correlation value t ∈ [-1, +1]. */
function corrToFill(t: number): { fill: string; opacity: number } {
  const tc = Math.max(-1, Math.min(1, t));
  let c: RGB;
  if (tc < 0) {
    // From white (0) → rose (-1)
    c = lerp(STOP_MID, STOP_NEG, -tc);
  } else {
    // From white (0) → emerald (+1)
    c = lerp(STOP_MID, STOP_POS, tc);
  }
  // Opacity ramps from 0.08 at t=0 to 1.0 at |t|=1
  const opacity = 0.08 + Math.abs(tc) * 0.92;
  return { fill: `rgb(${c.r},${c.g},${c.b})`, opacity };
}

// ── SVG layout constants ────────────────────────────────────────────
// viewBox is 460 wide × 460 tall.
//   - left padding (row labels):  46
//   - top padding (col labels):   36
//   - grid: 10×10 cells × 36px = 360×360
//   - legend bar: 360 wide, below the grid
const VB_W = 460;
const VB_H = 460;
const PAD_L = 46;
const PAD_T = 36;
const CELL = 36;
const GRID_W = CELL * N; // 360
const GRID_H = CELL * N; // 360
const LEGEND_Y = PAD_T + GRID_H + 28; // 424
const LEGEND_H = 10;
const LEGEND_TICK_Y = LEGEND_Y + LEGEND_H;
const LEGEND_LABEL_Y = LEGEND_TICK_Y + 14;

// ── Derived stats ───────────────────────────────────────────────────

interface CorrStats {
  avg: number;
  strongestPos: { a: string; b: string; v: number };
  strongestNeg: { a: string; b: string; v: number };
  diversification: number;
}

function computeStats(): CorrStats {
  let sum = 0;
  let count = 0;
  let maxV = -Infinity;
  let minV = Infinity;
  let maxPair = { a: "", b: "", v: 0 };
  let minPair = { a: "", b: "", v: 0 };

  for (let r = 0; r < N; r++) {
    for (let c = r + 1; c < N; c++) {
      const v = CORR_MATRIX[r][c];
      sum += v;
      count++;
      if (v > maxV) {
        maxV = v;
        maxPair = { a: INSTRUMENTS[r], b: INSTRUMENTS[c], v };
      }
      if (v < minV) {
        minV = v;
        minPair = { a: INSTRUMENTS[r], b: INSTRUMENTS[c], v };
      }
    }
  }
  const avg = sum / count;
  return {
    avg,
    strongestPos: maxPair,
    strongestNeg: minPair,
    diversification: 1 - avg,
  };
}

// ── Hover tooltip state ─────────────────────────────────────────────
interface HoverState {
  row: number;
  col: number;
  x: number; // px relative to container
  y: number;
}

// ── Main component ──────────────────────────────────────────────────
export function CorrelationMatrixViz() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const stats = useMemo(() => computeStats(), []);

  function handleCellEnter(row: number, col: number, e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({
      row,
      col,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleCellMove(row: number, col: number, e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({
      row,
      col,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleCellLeave() {
    setHover(null);
  }

  // Legend tick positions along the legend bar (x in viewBox coords)
  const legendX0 = PAD_L;
  const legendX1 = PAD_L + GRID_W;
  const legendTicks = [-1, -0.5, 0, 0.5, 1].map((v) => {
    const t = (v + 1) / 2; // 0..1
    const x = legendX0 + t * (legendX1 - legendX0);
    return { v, x };
  });

  // Diversification progress (0..1) — 0.0 means no diversification,
  // 1.0 means perfectly diversified. Score = 1 - avg_corr clamped.
  const divScore = Math.max(0, Math.min(1, stats.diversification));

  return (
    <div className="border-glow border-gradient rounded-2xl bg-noise bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl card-inner-glow">
      {/* Terminal header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 truncate font-mono text-xs font-semibold text-white/70">
            vince · /corr_matrix · 30D rolling correlations
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-[0.6rem] text-white/40">
          <span className="inline-block h-1.5 w-1.5 animate-live-pulse rounded-full bg-emerald-400" />
          LIVE
        </div>
      </div>

      {/* Heatmap + tooltip wrapper */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto -mx-1 px-1"
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full min-w-[320px] sm:min-w-[440px]"
          style={{ height: "auto", maxHeight: 540 }}
          aria-label="30-day rolling correlation matrix across 10 major instruments"
          role="img"
        >
          <defs>
            {/* Diverging legend gradient: rose → neutral → emerald */}
            <linearGradient id="corrLegendGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(244,63,94)" />
              <stop offset="50%" stopColor="rgb(255,255,255)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="rgb(52,211,153)" />
            </linearGradient>
          </defs>

          {/* Subtle plot background */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={GRID_W}
            height={GRID_H}
            fill="white"
            fillOpacity={0.015}
            rx={4}
          />

          {/* Column headers (top) — instrument tickers */}
          {INSTRUMENTS.map((sym, c) => {
            const cx = PAD_L + c * CELL + CELL / 2;
            return (
              <text
                key={`col-${c}`}
                x={cx}
                y={PAD_T - 10}
                textAnchor="middle"
                className="font-mono"
                fill="white"
                fillOpacity={0.55}
                fontSize={9}
                fontWeight={600}
              >
                {sym}
              </text>
            );
          })}

          {/* Row headers (left) — instrument tickers */}
          {INSTRUMENTS.map((sym, r) => {
            const cy = PAD_T + r * CELL + CELL / 2;
            return (
              <text
                key={`row-${r}`}
                x={PAD_L - 8}
                y={cy + 3}
                textAnchor="end"
                className="font-mono"
                fill="white"
                fillOpacity={0.55}
                fontSize={9}
                fontWeight={600}
              >
                {sym}
              </text>
            );
          })}

          {/* 10x10 heatmap cells with row-by-row stagger entrance */}
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const v = CORR_MATRIX[r][c];
              const { fill, opacity } = corrToFill(v);
              const isDiag = r === c;
              const x = PAD_L + c * CELL;
              const y = PAD_T + r * CELL;
              const delay = (r * N + c) * 0.02;
              // Show the value label inside the cell when not the diagonal
              // and the cell has meaningful magnitude (|v| > 0.15).
              const showLabel = !isDiag && Math.abs(v) > 0.15;
              const labelColor =
                v > 0.5
                  ? "rgb(110,231,183)"
                  : v < -0.5
                  ? "rgb(251,113,133)"
                  : "rgba(255,255,255,0.55)";
              return (
                <motion.rect
                  key={`cell-${r}-${c}`}
                  x={x + 1}
                  y={y + 1}
                  width={CELL - 2}
                  height={CELL - 2}
                  rx={2.5}
                  fill={fill}
                  fillOpacity={0}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay, ease: "easeOut" }}
                  stroke={isDiag ? "rgb(110,231,183)" : "rgba(255,255,255,0.06)"}
                  strokeOpacity={isDiag ? 0.7 : 1}
                  strokeWidth={isDiag ? 1.4 : 0.5}
                  className="cursor-pointer"
                  onMouseEnter={(e) => handleCellEnter(r, c, e)}
                  onMouseMove={(e) => handleCellMove(r, c, e)}
                  onMouseLeave={handleCellLeave}
                />
              );
            })
          ).flat()}

          {/* Value labels inside cells (rendered after cells so they sit on top) */}
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const v = CORR_MATRIX[r][c];
              const isDiag = r === c;
              const showLabel = !isDiag && Math.abs(v) > 0.15;
              if (!showLabel) return null;
              const cx = PAD_L + c * CELL + CELL / 2;
              const cy = PAD_T + r * CELL + CELL / 2;
              const labelColor =
                v > 0.5
                  ? "rgb(110,231,183)"
                  : v < -0.5
                  ? "rgb(251,113,133)"
                  : "rgba(255,255,255,0.55)";
              const delay = (r * N + c) * 0.02 + 0.1;
              return (
                <motion.text
                  key={`val-${r}-${c}`}
                  x={cx}
                  y={cy + 2.5}
                  textAnchor="middle"
                  className="font-mono pointer-events-none"
                  fill={labelColor}
                  fontSize={7.5}
                  fontWeight={600}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.3, delay }}
                >
                  {v.toFixed(2)}
                </motion.text>
              );
            })
          ).flat()}

          {/* ─── Legend bar below the matrix ─── */}
          <text
            x={PAD_L}
            y={LEGEND_Y - 8}
            className="font-mono"
            fill="white"
            fillOpacity={0.4}
            fontSize={7.5}
            fontWeight={600}
            letterSpacing={0.5}
          >
            CORRELATION
          </text>

          <rect
            x={legendX0}
            y={LEGEND_Y}
            width={legendX1 - legendX0}
            height={LEGEND_H}
            fill="url(#corrLegendGrad)"
            rx={2}
          />

          {/* Tick marks */}
          {legendTicks.map((t) => (
            <g key={`tick-${t.v}`}>
              <line
                x1={t.x}
                y1={LEGEND_TICK_Y}
                x2={t.x}
                y2={LEGEND_TICK_Y + 4}
                stroke="white"
                strokeOpacity={0.3}
                strokeWidth={0.6}
              />
              <text
                x={t.x}
                y={LEGEND_LABEL_Y}
                textAnchor="middle"
                className="font-mono"
                fill="white"
                fillOpacity={0.45}
                fontSize={7}
              >
                {t.v > 0 ? `+${t.v.toFixed(1)}` : t.v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Footer caption */}
          <text
            x={VB_W - 4}
            y={LEGEND_LABEL_Y}
            textAnchor="end"
            className="font-mono"
            fill="white"
            fillOpacity={0.32}
            fontSize={6.5}
            letterSpacing={0.5}
          >
            pearson · log-return · 30 trading days
          </text>
        </svg>

        {/* Hover tooltip (state-managed, positioned absolutely) */}
        {hover && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[130%] rounded-lg border border-white/10 bg-[oklch(0.16_0.012_250)]/95 px-3 py-2 shadow-xl backdrop-blur-md"
            style={{ left: hover.x, top: hover.y }}
          >
            <div className="font-mono text-[0.65rem] font-semibold text-white/90">
              {INSTRUMENTS[hover.row]} · {INSTRUMENTS[hover.col]}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.6rem]">
              <span className="text-white/40">corr</span>
              <span
                className={`numeric font-bold ${
                  CORR_MATRIX[hover.row][hover.col] >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {CORR_MATRIX[hover.row][hover.col] >= 0 ? "+" : ""}
                {CORR_MATRIX[hover.row][hover.col].toFixed(3)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats row — 4 cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        <div className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            Avg Pairwise Corr
          </div>
          <div className="numeric mt-1 font-mono text-sm font-semibold text-amber-400">
            {stats.avg >= 0 ? "+" : ""}
            {stats.avg.toFixed(3)}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-emerald-400/80">
            Strongest Positive
          </div>
          <div className="mt-1 font-mono text-[0.7rem] font-semibold text-emerald-300">
            {stats.strongestPos.a} · {stats.strongestPos.b}
          </div>
          <div className="numeric mt-0.5 font-mono text-xs font-bold text-emerald-400">
            +{stats.strongestPos.v.toFixed(2)}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-rose-400/80">
            Strongest Negative
          </div>
          <div className="mt-1 font-mono text-[0.7rem] font-semibold text-rose-300">
            {stats.strongestNeg.a} · {stats.strongestNeg.b}
          </div>
          <div className="numeric mt-0.5 font-mono text-xs font-bold text-rose-400">
            {stats.strongestNeg.v.toFixed(2)}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.05] p-2.5">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-cyan-400/80">
            Diversification
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="numeric font-mono text-sm font-semibold text-cyan-400">
              {divScore.toFixed(3)}
            </span>
            <span className="font-mono text-[0.55rem] text-white/40">/ 1.00</span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400/60 to-emerald-400"
              initial={{ width: 0 }}
              whileInView={{ width: `${divScore * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4">
        <SchematicDisclaimer
          live={false}
          note="30-day rolling Pearson correlations"
        />
      </div>
    </div>
  );
}
