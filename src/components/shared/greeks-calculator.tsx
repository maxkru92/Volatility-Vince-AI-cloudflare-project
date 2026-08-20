"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  blackScholes,
  type OptionType as BsmOptionType,
} from "@/lib/bsm";
import type {
  NormalizedOption,
  OptionSource,
  OptionsResponse,
} from "@/lib/options-types";
import { fetchOptionsChain, invalidateOptionsChain } from "@/lib/options-client";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";

// ── Symbol selector options ───────────────────────────────────────────

const SYMBOL_OPTIONS = [
  { value: "BTC", label: "BTC · Bitcoin", kind: "crypto" },
  { value: "ETH", label: "ETH · Ethereum", kind: "crypto" },
  { value: "AAPL", label: "AAPL · Apple", kind: "equity" },
  { value: "SPX", label: "SPX · S&P 500", kind: "equity" },
] as const;

type OptionType = BsmOptionType;

function expiryToYears(expiry: string): number {
  const remainingMs = Date.parse(expiry) - Date.now();
  return Math.max(remainingMs / (365 * 24 * 60 * 60 * 1000), 1 / 365);
}

// ── Component ──────────────────────────────────────────────────────

interface Inputs {
  S: number; // spot price
  K: number; // strike
  T: number; // years to expiry
  r: number; // risk-free rate (decimal)
  sigma: number; // volatility (decimal)
}

type InputKey = keyof Inputs;

interface SliderConfig {
  key: InputKey;
  label: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  accentText: string;
  accentDot: string;
}

interface GreekCard {
  symbol: string;
  name: string;
  value: number;
  color: "emerald" | "cyan" | "violet" | "amber" | "rose";
  desc: string;
  format: (v: number) => string;
}

const greekColorMap: Record<
  GreekCard["color"],
  { text: string; border: string; bg: string; ring: string; raw: string }
> = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/25",
    bg: "bg-emerald-400/[0.06]",
    ring: "ring-emerald-400/30",
    raw: "rgb(52,211,153)",
  },
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-400/25",
    bg: "bg-cyan-400/[0.06]",
    ring: "ring-cyan-400/30",
    raw: "rgb(34,211,238)",
  },
  violet: {
    text: "text-violet-400",
    border: "border-violet-400/25",
    bg: "bg-violet-400/[0.06]",
    ring: "ring-violet-400/30",
    raw: "rgb(167,139,250)",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-400/25",
    bg: "bg-amber-400/[0.06]",
    ring: "ring-amber-400/30",
    raw: "rgb(251,191,36)",
  },
  rose: {
    text: "text-rose-400",
    border: "border-rose-400/25",
    bg: "bg-rose-400/[0.06]",
    ring: "ring-rose-400/30",
    raw: "rgb(251,113,133)",
  },
};

export function GreeksCalculator() {
  // ── Live options data state ──
  const [symbol, setSymbol] = useState<string>("BTC");
  const [optionsData, setOptionsData] = useState<OptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(true);
  const [selectedExpiry, setSelectedExpiry] = useState<string>("");
  const [useMarketIV, setUseMarketIV] = useState<boolean>(true);
  const fetchedRef = useRef<string | null>(null);

  // ── BSM input state ──
  const [inputs, setInputs] = useState<Inputs>({
    S: 65000,
    K: 65000,
    T: 0.083, // ~30 days
    r: 0.045,
    sigma: 0.45,
  });
  const [type, setType] = useState<OptionType>("call");

  // ── Fetch live options chain whenever the symbol changes ──
  useEffect(() => {
    if (fetchedRef.current === symbol) return;
    fetchedRef.current = symbol;
    let aborted = false;
    // Initial fetch (loading state is set inside the async function so we
    // don't trigger a synchronous re-render from inside the effect body).
    (async () => {
      setOptionsLoading(true);
      const data = await fetchOptionsChain(symbol);
      if (aborted) return;
      setOptionsData(data);
      if (data) {
        // Pick the first expiry (shortest-dated) and an ATM strike.
        const expiries = Array.from(
          new Set(data.contracts.map((c) => c.expiry))
        ).sort();
        const expiry = expiries[0] ?? "";
        setSelectedExpiry(expiry);
        const spot = data.spot;
        if (spot > 0) {
          // Snap strike to the nearest chain strike for this expiry + type.
          const bucket = data.contracts.filter(
            (c) => c.expiry === expiry && c.type === "call"
          );
          const targetK = spot;
          const nearest =
            bucket.length > 0
              ? bucket.reduce((best, c) =>
                  Math.abs(c.strike - targetK) <
                  Math.abs(best.strike - targetK)
                    ? c
                    : best
                )
              : null;
          const K = nearest?.strike ?? spot;
          const T = nearest
            ? expiryToYears(nearest.expiry)
            : 30 / 365;
          const sigma = nearest?.iv ?? 0.45;
          setInputs({
            S: spot,
            K,
            T,
            r: 0.045,
            sigma,
          });
        }
      }
      if (!aborted) setOptionsLoading(false);
    })();

    // Refresh every 60s while the component is mounted.
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

  // ── Derived chain data ──
  const expiries = useMemo(() => {
    if (!optionsData) return [];
    return Array.from(new Set(optionsData.contracts.map((c) => c.expiry))).sort();
  }, [optionsData]);

  const strikesForExpiry = useMemo(() => {
    if (!optionsData || !selectedExpiry) return [];
    return Array.from(
      new Set(
        optionsData.contracts
          .filter((c) => c.expiry === selectedExpiry)
          .map((c) => c.strike)
      )
    ).sort((a, b) => a - b);
  }, [optionsData, selectedExpiry]);

  // Current selected contract — the chain contract nearest to the
  // manual inputs.K (so moving the strike slider snaps to the chain).
  const currentContract: NormalizedOption | null = useMemo(() => {
    if (!optionsData || !selectedExpiry || strikesForExpiry.length === 0) return null;
    const bucket = optionsData.contracts.filter(
      (c) => c.expiry === selectedExpiry && c.type === type
    );
    if (bucket.length === 0) return null;
    return bucket.reduce((best, c) =>
      Math.abs(c.strike - inputs.K) < Math.abs(best.strike - inputs.K) ? c : best
    );
  }, [optionsData, selectedExpiry, type, inputs.K, strikesForExpiry.length]);

  // Effective inputs: when useMarketIV is on, K/T/sigma are derived from
  // the chain contract (no state mutation needed — pure derivation).
  // Moving the σ slider turns useMarketIV off (see updateInput), at
  // which point the manual inputs take over.
  const effectiveInputs: Inputs = useMemo(() => {
    if (!useMarketIV || !currentContract) return inputs;
    return {
      ...inputs,
      K: currentContract.strike,
      T: expiryToYears(currentContract.expiry),
      sigma: currentContract.iv,
    };
  }, [useMarketIV, currentContract, inputs]);

  // When expiry changes, snap strike to the nearest available strike.
  const onExpiryChange = (newExpiry: string) => {
    setSelectedExpiry(newExpiry);
    if (!optionsData) return;
    const bucket = optionsData.contracts.filter(
      (c) => c.expiry === newExpiry && c.type === type
    );
    if (bucket.length === 0) return;
    const targetK = inputs.S;
    const nearest = bucket.reduce((best, c) =>
      Math.abs(c.strike - targetK) < Math.abs(best.strike - targetK) ? c : best
    );
    setInputs((prev) => ({
      ...prev,
      K: nearest.strike,
      T: expiryToYears(nearest.expiry),
      sigma: useMarketIV ? nearest.iv : prev.sigma,
    }));
  };

  const live = optionsData?.live ?? false;
  const source: OptionSource | undefined = optionsData?.source;

  // ── BSM result ──
  const result = useMemo(
    () =>
      blackScholes(
        effectiveInputs.S,
        effectiveInputs.K,
        effectiveInputs.T,
        effectiveInputs.r,
        effectiveInputs.sigma,
        type
      ),
    [effectiveInputs, type]
  );

  // Payoff-at-expiry curve across 0.5K .. 1.5K spot range.
  const payoff = useMemo(() => {
    const start = effectiveInputs.K * 0.5;
    const end = effectiveInputs.K * 1.5;
    const N = 120;
    const premium = result.price;
    const pts: { s: number; pnl: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const s = start + (end - start) * (i / N);
      const intrinsic =
        type === "call"
          ? Math.max(s - effectiveInputs.K, 0)
          : Math.max(effectiveInputs.K - s, 0);
      pts.push({ s, pnl: intrinsic - premium });
    }
    // Breakeven: solve intrinsic(S) = premium.
    // Call: S = K + premium ; Put: S = K - premium
    const breakeven =
      type === "call"
        ? effectiveInputs.K + premium
        : effectiveInputs.K - premium;
    return { pts, breakeven, start, end, premium };
  }, [effectiveInputs.K, type, result.price]);

  // ── Slider configs ──
  // Strike + spot ranges adapt to the symbol (BTC vs SPX have very
  // different scales). When a live chain is loaded, the strike slider
  // snaps to the chain's min/max for the current expiry.
  const spotMin = optionsData && optionsData.spot > 0
    ? optionsData.spot * 0.4
    : 50;
  const spotMax = optionsData && optionsData.spot > 0
    ? optionsData.spot * 1.6
    : 500;
  const strikeMin = strikesForExpiry.length > 0 ? strikesForExpiry[0] : spotMin;
  const strikeMax = strikesForExpiry.length > 0
    ? strikesForExpiry[strikesForExpiry.length - 1]
    : spotMax;

  const sliders: SliderConfig[] = [
    {
      key: "S",
      label: "Spot Price",
      symbol: "S",
      min: spotMin,
      max: spotMax,
      step: spotMax > 1000 ? 1 : 0.5,
      value: effectiveInputs.S,
      format: (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      accentText: "text-emerald-400",
      accentDot: "bg-emerald-400",
    },
    {
      key: "K",
      label: "Strike",
      symbol: "K",
      min: strikeMin,
      max: strikeMax,
      step: strikeMax > 1000 ? 1 : 0.5,
      value: effectiveInputs.K,
      format: (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      accentText: "text-cyan-400",
      accentDot: "bg-cyan-400",
    },
    {
      key: "T",
      label: "Time to Expiry",
      symbol: "T",
      min: 0.005,
      max: 2.0,
      step: 0.005,
      value: effectiveInputs.T,
      format: (v) =>
        `${v.toFixed(3)}y · ${Math.round(v * 365)}d`,
      accentText: "text-amber-400",
      accentDot: "bg-amber-400",
    },
    {
      key: "r",
      label: "Risk-free Rate",
      symbol: "r",
      min: 0,
      max: 0.1,
      step: 0.001,
      value: effectiveInputs.r,
      format: (v) => `${(v * 100).toFixed(2)}%`,
      accentText: "text-violet-400",
      accentDot: "bg-violet-400",
    },
    {
      key: "sigma",
      label: useMarketIV ? "Volatility (market)" : "Volatility (override)",
      symbol: "σ",
      min: 0.01,
      max: 2.0,
      step: 0.005,
      value: effectiveInputs.sigma,
      format: (v) => `${(v * 100).toFixed(1)}%`,
      accentText: "text-rose-400",
      accentDot: "bg-rose-400",
    },
  ];

  // ── Greeks grid data ──
  const greekCards: GreekCard[] = [
    {
      symbol: "Δ",
      name: "Delta",
      value: result.delta,
      color: "emerald",
      desc: "∂V/∂S — spot sensitivity",
      format: (v) => v.toFixed(4),
    },
    {
      symbol: "Γ",
      name: "Gamma",
      value: result.gamma,
      color: "cyan",
      desc: "∂²V/∂S² — delta's rate of change",
      format: (v) => v.toFixed(5),
    },
    {
      symbol: "ν",
      name: "Vega",
      value: result.vega,
      color: "violet",
      desc: "∂V/∂σ — per 1% vol move",
      format: (v) => v.toFixed(4),
    },
    {
      symbol: "Θ",
      name: "Theta",
      value: result.theta,
      color: "amber",
      desc: "∂V/∂t — per-day decay",
      format: (v) => v.toFixed(4),
    },
    {
      symbol: "ρ",
      name: "Rho",
      value: result.rho,
      color: "rose",
      desc: "∂V/∂r — per 1% rate move",
      format: (v) => v.toFixed(4),
    },
  ];

  // ── Helpers ──
  // When the user manually moves the σ or T slider, auto-disable market IV
  // mode so the manual override takes effect. The K slider keeps market
  // IV on (the strike snaps to the nearest chain strike automatically).
  const updateInput = (key: InputKey, value: number) => {
    if ((key === "sigma" || key === "T") && useMarketIV) {
      setUseMarketIV(false);
    }
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const fmtMoney = (n: number) =>
    `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ── Payoff SVG geometry ──
  const chartW = 600;
  const chartH = 280;
  const padL = 52;
  const padR = 18;
  const padT = 18;
  const padB = 36;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  // Y range — always include zero so the breakeven line is visible.
  const allPnl = payoff.pts.map((p) => p.pnl);
  const rawMin = Math.min(...allPnl, 0);
  const rawMax = Math.max(...allPnl, 0);
  // Pad y range a touch so the curve doesn't touch the plot edges.
  const yPad = (rawMax - rawMin) * 0.08 || 1;
  const minPnl = rawMin - yPad;
  const maxPnl = rawMax + yPad;
  const pnlRange = maxPnl - minPnl || 1;

  const xScale = (s: number) =>
    padL + ((s - payoff.start) / (payoff.end - payoff.start)) * plotW;
  const yScale = (pnl: number) =>
    padT + (1 - (pnl - minPnl) / pnlRange) * plotH;

  // Curve polyline points (string of "x,y" pairs).
  const curvePoints = payoff.pts
    .map((p) => `${xScale(p.s).toFixed(2)},${yScale(p.pnl).toFixed(2)}`)
    .join(" ");

  // Area polygon: curve + back along zero line.
  const yZero = yScale(0);
  const areaPolygon =
    `${xScale(payoff.start).toFixed(2)},${yZero.toFixed(2)} ` +
    curvePoints +
    ` ${xScale(payoff.end).toFixed(2)},${yZero.toFixed(2)}`;

  // Current spot P&L for marker.
  const currentPnl =
    (type === "call"
      ? Math.max(effectiveInputs.S - effectiveInputs.K, 0)
      : Math.max(effectiveInputs.K - effectiveInputs.S, 0)) - result.price;

  // Price color: emerald for call, rose for put (institutional convention).
  const priceColor = type === "call" ? "text-emerald-400" : "text-rose-400";
  const priceKey = Math.round(result.price * 100); // remounts span on price change → replays pulse

  // X-axis ticks: 5 evenly spaced spot values.
  const xTicks = Array.from({ length: 5 }, (_, i) => {
    const s = payoff.start + (i / 4) * (payoff.end - payoff.start);
    return s;
  });

  // Y-axis ticks: 5 evenly spaced P&L values.
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    return minPnl + (i / 4) * pnlRange;
  });

  return (
    <div className="border-glow rounded-2xl bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl">
      {/* Terminal header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-mono text-xs font-semibold text-white/70">
            vince · /greeks {symbol} · Black-Scholes
          </span>
          {/* LIVE / DEMO badge */}
          {optionsLoading ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/55">
              <span className="h-1 w-1 rounded-full bg-white/40" />
              loading…
            </span>
          ) : live && source ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-emerald-300">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-live-pulse" />
              live · {source}
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-amber-300">
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              demo
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol selector */}
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-0.5">
            {SYMBOL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSymbol(opt.value)}
                className={`rounded px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-wider transition-colors ${
                  symbol === opt.value
                    ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                    : "text-white/50 hover:text-white/80"
                }`}
                aria-pressed={symbol === opt.value}
              >
                {opt.value}
              </button>
            ))}
          </div>
          {/* Expiry selector */}
          <select
            value={selectedExpiry}
            onChange={(e) => onExpiryChange(e.target.value)}
            disabled={expiries.length === 0}
            className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-white/80 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 disabled:opacity-40"
            aria-label="Expiry"
          >
            {expiries.length === 0 ? (
              <option value="">— expiry —</option>
            ) : (
              expiries.map((e) => <option key={e} value={e}>{e}</option>)
            )}
          </select>
          {/* Market IV toggle */}
          <button
            onClick={() => setUseMarketIV((v) => !v)}
            className={`rounded-md border px-2 py-1 font-mono text-[0.55rem] uppercase tracking-wider transition-colors ${
              useMarketIV
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80"
            }`}
            aria-pressed={useMarketIV}
            title="Use IV from the live options chain (turns off when you move the σ slider)"
          >
            IV: {useMarketIV ? "market" : "manual"}
          </button>
          {/* CALL / PUT toggle badge */}
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-0.5">
            <button
              onClick={() => setType("call")}
              className={`rounded px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider transition-colors ${
                type === "call"
                  ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : "text-white/50 hover:text-white/80"
              }`}
              aria-pressed={type === "call"}
            >
              Call
            </button>
            <button
              onClick={() => setType("put")}
              className={`rounded px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider transition-colors ${
                type === "put"
                  ? "bg-rose-400/20 text-rose-300 ring-1 ring-rose-400/40"
                  : "text-white/50 hover:text-white/80"
              }`}
              aria-pressed={type === "put"}
            >
              Put
            </button>
          </div>
        </div>
      </div>

      {/* Market IV readout — shows the live IV from the chain for the
          currently selected strike + expiry + type, when available. */}
      {currentContract && (
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-[0.65rem] text-white/65">
          <span>
            <span className="text-white/40">spot:</span>{" "}
            <span className="numeric font-semibold text-emerald-300">
              ${optionsData?.spot.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
          <span>
            <span className="text-white/40">strike:</span>{" "}
            <span className="numeric font-semibold text-cyan-300">
              ${currentContract.strike.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
          <span>
            <span className="text-white/40">IV (market):</span>{" "}
            <span className="numeric font-semibold text-rose-300">
              {(currentContract.iv * 100).toFixed(1)}%
            </span>
          </span>
          <span>
            <span className="text-white/40">mark:</span>{" "}
            <span className="numeric font-semibold text-amber-300">
              ${currentContract.markPriceUsd?.toFixed(4) ?? currentContract.mid?.toFixed(4) ?? currentContract.markPrice.toFixed(4)}
            </span>
          </span>
          <span>
            <span className="text-white/40">Δ:</span>{" "}
            <span className="numeric font-semibold text-emerald-300">
              {currentContract.delta.toFixed(3)}
            </span>
          </span>
          <span>
            <span className="text-white/40">OI:</span>{" "}
            <span className="numeric font-semibold text-white/80">
              {currentContract.openInterest.toLocaleString("en-US")}
            </span>
          </span>
        </div>
      )}

      {/* Two-column layout: controls (left, 40%) + results/viz (right, 60%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* ─── LEFT — input controls ─── */}
        <div className="flex flex-col gap-5">
          {sliders.map((cfg) => {
            const fillPct =
              ((cfg.value - cfg.min) / (cfg.max - cfg.min)) * 100;
            const style = {
              "--fill": `${fillPct}%`,
            } as CSSProperties;
            return (
              <div key={cfg.key}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label
                    htmlFor={`range-${cfg.key}`}
                    className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-wider text-white/55"
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.accentDot}`}
                    />
                    <span className="font-sans text-white/80">{cfg.label}</span>
                    <span
                      className={`font-mono text-[0.7rem] font-bold ${cfg.accentText}`}
                    >
                      {cfg.symbol}
                    </span>
                  </label>
                  <span
                    className={`numeric font-mono text-sm font-semibold ${cfg.accentText}`}
                  >
                    {cfg.format(cfg.value)}
                  </span>
                </div>
                <input
                  id={`range-${cfg.key}`}
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={cfg.value}
                  onChange={(e) =>
                    updateInput(cfg.key, parseFloat(e.target.value))
                  }
                  className="vince-range"
                  style={style}
                  aria-label={cfg.label}
                />
              </div>
            );
          })}

          {/* Footer note: d1 / d2 + model attribution */}
          <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
              Intermediate values
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-white/65">
              <span>
                d₁ ={" "}
                <span className="numeric font-semibold text-white/90">
                  {result.d1.toFixed(4)}
                </span>
              </span>
              <span>
                d₂ ={" "}
                <span className="numeric font-semibold text-white/90">
                  {result.d2.toFixed(4)}
                </span>
              </span>
              <span>
                N(d₁) ={" "}
                <span className="numeric font-semibold text-white/90">
                  {(type === "call"
                    ? result.delta
                    : result.delta + 1
                  ).toFixed(4)}
                </span>
              </span>
            </div>
            <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-white/35">
              Black-Scholes-Merton · European exercise · continuous yield
              assumptions. Greeks reported per conventional unit (Vega/Rho per
              1%, Theta/day).
            </p>
          </div>
        </div>

        {/* ─── RIGHT — results + payoff diagram ─── */}
        <div className="flex flex-col gap-5">
          {/* Big price display */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/45">
                  Option Price · {type === "call" ? "Call" : "Put"}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    key={priceKey}
                    className={`numeric animate-data-pulse font-mono text-3xl font-bold tabular-nums ${priceColor}`}
                  >
                    {fmtMoney(result.price)}
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
                    per share
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
                  Intrinsic / Time
                </div>
                <div className="numeric mt-0.5 font-mono text-xs text-white/70">
                  {fmtMoney(
                    type === "call"
                      ? Math.max(effectiveInputs.S - effectiveInputs.K, 0)
                      : Math.max(effectiveInputs.K - effectiveInputs.S, 0)
                  )}
                  {" / "}
                  {fmtMoney(
                    result.price -
                      (type === "call"
                        ? Math.max(effectiveInputs.S - effectiveInputs.K, 0)
                        : Math.max(effectiveInputs.K - effectiveInputs.S, 0))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Greeks grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {greekCards.map((g) => {
              const c = greekColorMap[g.color];
              return (
                <div
                  key={g.name}
                  className={`rounded-lg border ${c.border} ${c.bg} p-3 transition-colors hover:bg-white/[0.04]`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-base font-bold leading-none ${c.text}`}
                    >
                      {g.symbol}
                    </span>
                    <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                      {g.name}
                    </span>
                  </div>
                  <div
                    className={`numeric mt-2 font-mono text-lg font-semibold tabular-nums ${c.text}`}
                  >
                    {g.format(g.value)}
                  </div>
                  <div className="mt-1 font-mono text-[0.55rem] leading-snug text-white/40">
                    {g.desc}
                  </div>
                </div>
              );
            })}
            {/* 6th cell — moneyness summary */}
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold leading-none text-white/80">
                  M
                </span>
                <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                  Moneyness
                </span>
              </div>
              <div
                className={`numeric mt-2 font-mono text-lg font-semibold tabular-nums ${
                  effectiveInputs.S > effectiveInputs.K
                    ? "text-emerald-400"
                    : effectiveInputs.S < effectiveInputs.K
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {((effectiveInputs.S / effectiveInputs.K - 1) * 100).toFixed(2)}%
              </div>
              <div className="mt-1 font-mono text-[0.55rem] leading-snug text-white/40">
                {effectiveInputs.S > effectiveInputs.K
                  ? type === "call"
                    ? "ITM"
                    : "OTM"
                  : effectiveInputs.S < effectiveInputs.K
                  ? type === "call"
                    ? "OTM"
                    : "ITM"
                  : "ATM"}
              </div>
            </div>
          </div>

          {/* Payoff diagram SVG */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/50">
                Payoff at expiry · P&amp;L vs spot
              </div>
              <div className="flex items-center gap-3 font-mono text-[0.55rem] text-white/45">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-3 rounded-sm bg-emerald-400/60" />
                  profit
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-3 rounded-sm bg-rose-400/60" />
                  loss
                </span>
              </div>
            </div>
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full"
              style={{ height: "auto" }}
              aria-label="Option payoff diagram at expiry"
              role="img"
            >
              <defs>
                <clipPath id="greekProfitClip">
                  <rect
                    x={padL}
                    y={yScale(maxPnl)}
                    width={plotW}
                    height={Math.max(yZero - yScale(maxPnl), 0)}
                  />
                </clipPath>
                <clipPath id="greekLossClip">
                  <rect
                    x={padL}
                    y={yZero}
                    width={plotW}
                    height={Math.max(yScale(minPnl) - yZero, 0)}
                  />
                </clipPath>
              </defs>

              {/* Plot background */}
              <rect
                x={padL}
                y={padT}
                width={plotW}
                height={plotH}
                fill="white"
                fillOpacity={0.015}
                rx={4}
              />

              {/* Horizontal grid lines + Y-axis labels */}
              {yTicks.map((v, i) => {
                const y = yScale(v);
                return (
                  <g key={`ygrid-${i}`}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={padL + plotW}
                      y2={y}
                      stroke="white"
                      strokeOpacity={0.05}
                      strokeWidth={0.5}
                    />
                    <text
                      x={padL - 6}
                      y={y + 2.5}
                      textAnchor="end"
                      className="font-mono"
                      fill="white"
                      fillOpacity={0.4}
                      fontSize={7.5}
                    >
                      {v >= 1000
                        ? `$${(v / 1000).toFixed(1)}K`
                        : `${v >= 0 ? "$" : "-$"}${Math.abs(v).toFixed(0)}`}
                    </text>
                  </g>
                );
              })}

              {/* Vertical grid lines + X-axis labels */}
              {xTicks.map((s, i) => {
                const x = xScale(s);
                return (
                  <g key={`xgrid-${i}`}>
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="white"
                      strokeOpacity={0.04}
                      strokeWidth={0.5}
                    />
                    <text
                      x={x}
                      y={chartH - 12}
                      textAnchor="middle"
                      className="font-mono"
                      fill="white"
                      fillOpacity={0.4}
                      fontSize={7.5}
                    >
                      ${s.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Zero P&L line (breakeven axis) */}
              <line
                x1={padL}
                y1={yZero}
                x2={padL + plotW}
                y2={yZero}
                stroke="white"
                strokeOpacity={0.28}
                strokeWidth={0.8}
                strokeDasharray="4,3"
              />

              {/* Profit area (above zero) */}
              <polygon
                points={areaPolygon}
                fill="rgb(52,211,153)"
                fillOpacity={0.22}
                clipPath="url(#greekProfitClip)"
              />
              {/* Loss area (below zero) */}
              <polygon
                points={areaPolygon}
                fill="rgb(251,113,133)"
                fillOpacity={0.22}
                clipPath="url(#greekLossClip)"
              />

              {/* Strike vertical line */}
              <line
                x1={xScale(effectiveInputs.K)}
                y1={padT}
                x2={xScale(effectiveInputs.K)}
                y2={padT + plotH}
                stroke="rgb(34,211,238)"
                strokeOpacity={0.35}
                strokeWidth={0.8}
                strokeDasharray="2,3"
              />
              <text
                x={xScale(effectiveInputs.K)}
                y={padT - 4}
                textAnchor="middle"
                className="font-mono"
                fill="rgb(34,211,238)"
                fillOpacity={0.7}
                fontSize={7}
                fontWeight={600}
              >
                K
              </text>

              {/* Breakeven marker */}
              {payoff.breakeven >= payoff.start &&
                payoff.breakeven <= payoff.end && (
                  <g>
                    <line
                      x1={xScale(payoff.breakeven)}
                      y1={yZero - 4}
                      x2={xScale(payoff.breakeven)}
                      y2={yZero + 4}
                      stroke="rgb(251,191,36)"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={xScale(payoff.breakeven)}
                      cy={yZero}
                      r={3}
                      fill="rgb(251,191,36)"
                      stroke="rgb(20,20,24)"
                      strokeWidth={1}
                    />
                    <text
                      x={xScale(payoff.breakeven)}
                      y={padT + plotH + 22}
                      textAnchor="middle"
                      className="font-mono"
                      fill="rgb(251,191,36)"
                      fillOpacity={0.85}
                      fontSize={7}
                      fontWeight={600}
                    >
                      BE ${payoff.breakeven.toFixed(1)}
                    </text>
                  </g>
                )}

              {/* P&L curve */}
              <polyline
                points={curvePoints}
                fill="none"
                stroke="white"
                strokeOpacity={0.85}
                strokeWidth={1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Current spot vertical line + marker */}
              {effectiveInputs.S >= payoff.start && effectiveInputs.S <= payoff.end && (
                <g>
                  <line
                    x1={xScale(effectiveInputs.S)}
                    y1={padT}
                    x2={xScale(effectiveInputs.S)}
                    y2={padT + plotH}
                    stroke="white"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                  />
                  <circle
                    cx={xScale(effectiveInputs.S)}
                    cy={yScale(currentPnl)}
                    r={4}
                    fill={currentPnl >= 0 ? "rgb(52,211,153)" : "rgb(251,113,133)"}
                    stroke="rgb(20,20,24)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={xScale(effectiveInputs.S)}
                    y={padT - 4}
                    textAnchor="middle"
                    className="font-mono"
                    fill="white"
                    fillOpacity={0.85}
                    fontSize={7.5}
                    fontWeight={700}
                  >
                    S=${effectiveInputs.S.toFixed(0)}
                  </text>
                </g>
              )}

              {/* Axis titles */}
              <text
                x={padL + plotW / 2}
                y={chartH - 1}
                textAnchor="middle"
                className="font-mono"
                fill="white"
                fillOpacity={0.4}
                fontSize={7}
              >
                Spot price at expiry
              </text>
              <text
                x={10}
                y={padT + plotH / 2}
                textAnchor="middle"
                className="font-mono"
                fill="white"
                fillOpacity={0.4}
                fontSize={7}
                transform={`rotate(-90 10 ${padT + plotH / 2})`}
              >
                P&amp;L per share
              </text>
            </svg>
          </div>

          {/* Disclaimer */}
          <SchematicDisclaimer
            live={live}
            source={source}
            note="BSM greeks · 60s refresh"
          />
        </div>
      </div>
    </div>
  );
}
