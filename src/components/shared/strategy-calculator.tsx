"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import type { OptionsResponse, NormalizedOption, OptionSource } from "@/lib/options-types";
import { fetchOptionsChain, invalidateOptionsChain } from "@/lib/options-client";
import { SchematicDisclaimer } from "@/components/shared/schematic-disclaimer";

// ── Types ──────────────────────────────────────────────────────────

type Leg = {
  strike: number;
  premium: number;
  type: "call" | "put";
  position: "long" | "short";
  quantity?: number; // default 1, butterfly middle leg = 2
};

type Strategy = { name: string; key: string; legs: Leg[] };

// ── Strategy Configurations ────────────────────────────────────────

const STRATEGIES: Record<string, Strategy> = {
  long_call: {
    name: "Long Call",
    key: "long_call",
    legs: [{ strike: 100, premium: 5.0, type: "call", position: "long" }],
  },
  long_put: {
    name: "Long Put",
    key: "long_put",
    legs: [{ strike: 100, premium: 4.5, type: "put", position: "long" }],
  },
  bull_call_spread: {
    name: "Bull Call Spread",
    key: "bull_call_spread",
    legs: [
      { strike: 95, premium: 7.5, type: "call", position: "long" },
      { strike: 105, premium: 3.0, type: "call", position: "short" },
    ],
  },
  bear_put_spread: {
    name: "Bear Put Spread",
    key: "bear_put_spread",
    legs: [
      { strike: 105, premium: 7.0, type: "put", position: "long" },
      { strike: 95, premium: 2.5, type: "put", position: "short" },
    ],
  },
  iron_condor: {
    name: "Iron Condor",
    key: "iron_condor",
    legs: [
      { strike: 85, premium: 1.0, type: "put", position: "long" },
      { strike: 90, premium: 2.5, type: "put", position: "short" },
      { strike: 110, premium: 2.5, type: "call", position: "short" },
      { strike: 115, premium: 1.0, type: "call", position: "long" },
    ],
  },
  straddle: {
    name: "Straddle",
    key: "straddle",
    legs: [
      { strike: 100, premium: 5.0, type: "call", position: "long" },
      { strike: 100, premium: 4.5, type: "put", position: "long" },
    ],
  },
  strangle: {
    name: "Strangle",
    key: "strangle",
    legs: [
      { strike: 105, premium: 2.5, type: "call", position: "long" },
      { strike: 95, premium: 2.0, type: "put", position: "long" },
    ],
  },
  butterfly: {
    name: "Butterfly",
    key: "butterfly",
    legs: [
      { strike: 95, premium: 6.0, type: "call", position: "long" },
      { strike: 100, premium: 3.0, type: "call", position: "short", quantity: 2 },
      { strike: 105, premium: 1.0, type: "call", position: "long" },
    ],
  },
};

const STRATEGY_KEYS = Object.keys(STRATEGIES);

// ── PnL Calculation ───────────────────────────────────────────────

function legPnL(leg: Leg, S: number): number {
  const qty = leg.quantity ?? 1;
  const intrinsic =
    leg.type === "call" ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0);
  if (leg.position === "long") {
    return qty * (intrinsic - leg.premium);
  }
  return qty * (leg.premium - intrinsic);
}

function combinedPnL(legs: Leg[], S: number): number {
  return legs.reduce((sum, l) => sum + legPnL(l, S), 0);
}

interface PnLPoint {
  s: number;
  combined: number;
  legs: number[];
}

interface AnalysisResult {
  points: PnLPoint[];
  breakevens: number[];
  maxProfit: number;
  maxLoss: number;
  netPremium: number;
  startS: number;
  endS: number;
}

function analyseStrategy(legs: Leg[], spot: number, N = 200): AnalysisResult {
  const strikes = legs.map((l) => l.strike);
  const minK = Math.min(...strikes);
  const maxK = Math.max(...strikes);
  const startS = Math.max(0.5 * minK, 1);
  const endS = 1.5 * maxK;

  const points: PnLPoint[] = [];
  for (let i = 0; i <= N; i++) {
    const s = startS + (endS - startS) * (i / N);
    const legPnLs = legs.map((l) => legPnL(l, s));
    points.push({ s, combined: legPnLs.reduce((a, b) => a + b, 0), legs: legPnLs });
  }

  // Breakevens: detect sign changes
  const breakevens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].combined;
    const curr = points[i].combined;
    if ((prev < 0 && curr >= 0) || (prev >= 0 && curr < 0)) {
      // Linear interpolation
      const t = -prev / (curr - prev);
      const be = points[i - 1].s + t * (points[i].s - points[i - 1].s);
      breakevens.push(be);
    }
  }

  const allCombined = points.map((p) => p.combined);
  const maxProfit = Math.max(...allCombined);
  const maxLoss = Math.min(...allCombined);

  // Net premium: credits positive, debits negative
  const netPremium = legs.reduce((sum, l) => {
    const qty = l.quantity ?? 1;
    return sum + (l.position === "short" ? qty * l.premium : -qty * l.premium);
  }, 0);

  return { points, breakevens, maxProfit, maxLoss, netPremium, startS, endS };
}

// ── Symbol selector options ─────────────────────────────────────────

const STRATEGY_SYMBOLS = ["BTC", "ETH", "AAPL", "SPX"] as const;

/**
 * Scale a strategy's default legs (defined for spot=100) to a new spot,
 * snap each leg's strike to the nearest live chain strike, and replace
 * the synthetic premium with the live mid price.
 *
 * Falls back to the original leg if no matching contract is found.
 */
function applyLiveChainToStrategy(
  defaultLegs: Leg[],
  spot: number,
  chain: NormalizedOption[]
): { legs: Leg[]; matched: number } {
  // Pick the shortest-dated expiry with enough liquidity.
  const expiries = Array.from(new Set(chain.map((c) => c.expiry))).sort();
  if (expiries.length === 0) return { legs: defaultLegs.map((l) => ({ ...l })), matched: 0 };
  const expiry = expiries[0];

  const scale = spot / 100; // strategies are authored for spot=100
  let matched = 0;

  const legs = defaultLegs.map((leg) => {
    const targetK = leg.strike * scale;
    const bucket = chain.filter(
      (c) => c.expiry === expiry && c.type === leg.type
    );
    if (bucket.length === 0) return { ...leg };
    const nearest = bucket.reduce((best, c) =>
      Math.abs(c.strike - targetK) < Math.abs(best.strike - targetK) ? c : best
    );
    matched++;
    const premium = nearest.mid !== null && nearest.mid > 0 ? nearest.mid : leg.premium * scale;
    return {
      ...leg,
      strike: nearest.strike,
      premium,
    };
  });

  return { legs, matched };
}

// ── Component ──────────────────────────────────────────────────────

export function StrategyCalculator() {
  const [symbol, setSymbol] = useState<string>("BTC");
  const [optionsData, setOptionsData] = useState<OptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(true);
  const fetchedRef = useRef<string | null>(null);

  const [strategyKey, setStrategyKey] = useState<string>("iron_condor");
  const [spot, setSpot] = useState(100);
  const [legs, setLegs] = useState<Leg[]>(STRATEGIES.iron_condor.legs);
  // Tracks whether the current legs reflect a live chain (so we show the
  // LIVE badge) or are still synthetic (DEMO badge).
  const [legsLive, setLegsLive] = useState<boolean>(false);

  const strategy = STRATEGIES[strategyKey];

  // ── Apply live chain to the active strategy whenever either changes ──
  const applyLiveChain = useCallback(
    (data: OptionsResponse | null, key: string) => {
      if (!data || !data.spot || data.spot <= 0) {
        setLegs(STRATEGIES[key].legs.map((l) => ({ ...l })));
        setSpot(100);
        setLegsLive(false);
        return;
      }
      const { legs: newLegs, matched } = applyLiveChainToStrategy(
        STRATEGIES[key].legs,
        data.spot,
        data.contracts
      );
      setLegs(newLegs);
      setSpot(data.spot);
      // "Live" only if at least half the legs matched a real contract.
      setLegsLive(matched >= Math.ceil(STRATEGIES[key].legs.length / 2));
    },
    []
  );

  // ── Fetch live options chain whenever the symbol changes ──
  useEffect(() => {
    if (fetchedRef.current === symbol) return;
    fetchedRef.current = symbol;
    let aborted = false;
    (async () => {
      setOptionsLoading(true);
      const data = await fetchOptionsChain(symbol);
      if (aborted) return;
      setOptionsData(data);
      applyLiveChain(data, strategyKey);
      if (!aborted) setOptionsLoading(false);
    })();

    const id = setInterval(() => {
      invalidateOptionsChain(symbol);
      fetchOptionsChain(symbol, { force: true }).then((data) => {
        if (!aborted) {
          setOptionsData(data);
          applyLiveChain(data, strategyKey);
        }
      });
    }, 60_000);

    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, [symbol, applyLiveChain, strategyKey]);

  const selectStrategy = useCallback(
    (key: string) => {
      setStrategyKey(key);
      // Re-apply the live chain (if loaded) to the new strategy's legs.
      applyLiveChain(optionsData, key);
    },
    [optionsData, applyLiveChain]
  );

  const updateLeg = useCallback(
    (idx: number, field: keyof Leg, value: number | string) => {
      setLegs((prev) => {
        const next = prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
        return next;
      });
    },
    []
  );

  const analysis = useMemo(
    () => analyseStrategy(legs, spot),
    [legs, spot]
  );

  // ── SVG geometry ──
  const chartW = 700;
  const chartH = 320;
  const padL = 56;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const allPnl = analysis.points.map((p) => p.combined);
  const rawMin = Math.min(...allPnl, 0);
  const rawMax = Math.max(...allPnl, 0);
  const yPad = (rawMax - rawMin) * 0.1 || 1;
  const minPnl = rawMin - yPad;
  const maxPnl = rawMax + yPad;
  const pnlRange = maxPnl - minPnl || 1;

  const xScale = (s: number) =>
    padL + ((s - analysis.startS) / (analysis.endS - analysis.startS)) * plotW;
  const yScale = (pnl: number) =>
    padT + (1 - (pnl - minPnl) / pnlRange) * plotH;

  const yZero = yScale(0);

  // Combined PnL polyline
  const combinedPoints = analysis.points
    .map((p) => `${xScale(p.s).toFixed(2)},${yScale(p.combined).toFixed(2)}`)
    .join(" ");

  // Individual leg polylines
  const legLines = legs.map((leg, li) =>
    analysis.points
      .map((p) => `${xScale(p.s).toFixed(2)},${yScale(p.legs[li]).toFixed(2)}`)
      .join(" ")
  );

  // Area polygon for combined (fill between curve and zero)
  const areaPolygon =
    `${xScale(analysis.startS).toFixed(2)},${yZero.toFixed(2)} ` +
    combinedPoints +
    ` ${xScale(analysis.endS).toFixed(2)},${yZero.toFixed(2)}`;

  // X-axis ticks
  const xTicks = Array.from({ length: 6 }, (_, i) => {
    return analysis.startS + (i / 5) * (analysis.endS - analysis.startS);
  });

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    return minPnl + (i / 4) * pnlRange;
  });

  // ── Formatting helpers ──
  const fmtMoney = (n: number) => {
    const abs = Math.abs(n);
    const prefix = n >= 0 ? "$" : "-$";
    if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(2)}K`;
    return `${prefix}${abs.toFixed(2)}`;
  };

  const fmtStrike = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPremium = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Risk/Reward ratio
  const riskReward =
    analysis.maxLoss !== 0 ? Math.abs(analysis.maxProfit / analysis.maxLoss) : Infinity;

  // Leg color: calls=emerald, puts=rose
  const legColor = (leg: Leg) =>
    leg.type === "call" ? "rgb(52,211,153)" : "rgb(251,113,133)";
  const legColorClass = (leg: Leg) =>
    leg.type === "call" ? "text-emerald-400" : "text-rose-400";
  const legBorderClass = (leg: Leg) =>
    leg.type === "call" ? "border-emerald-400/20" : "border-rose-400/20";
  const legBgClass = (leg: Leg) =>
    leg.type === "call" ? "bg-emerald-400/[0.04]" : "bg-rose-400/[0.04]";

  // ── Spot slider ──
  // Range is adaptive: 0.5× to 1.5× the current spot (so the slider is
  // always centred on the live/most-recent spot for BTC ~$65K vs AAPL ~$230).
  const spotMin = spot * 0.5;
  const spotMax = spot * 1.5;
  const spotStep = spotMax > 1000 ? 1 : spotMax > 100 ? 0.5 : 0.1;
  const spotFill = ((spot - spotMin) / (spotMax - spotMin)) * 100;
  const spotStyle = { "--fill": `${spotFill}%` } as CSSProperties;

  const live = optionsData?.live ?? false;
  const source: OptionSource | undefined = optionsData?.source;

  return (
    <div className="border-glow bg-noise rounded-2xl bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl">
      {/* Terminal header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-mono text-xs font-semibold text-white/70">
            vince · /strategy {strategy.key} {symbol} · P&amp;L at Expiry
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[0.6rem]">
          {/* Symbol selector */}
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-0.5">
            {STRATEGY_SYMBOLS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className={`rounded px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-wider transition-colors ${
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
          {/* LIVE / DEMO badge */}
          {optionsLoading ? (
            <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/55">
              <span className="h-1 w-1 rounded-full bg-white/40" />
              loading…
            </span>
          ) : live && source ? (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-emerald-300">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-live-pulse" />
              premiums · live · {source}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-amber-300">
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              premiums · demo
            </span>
          )}
        </div>
      </div>

      {/* Strategy selector pills */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {STRATEGY_KEYS.map((key) => {
          const active = key === strategyKey;
          return (
            <button
              key={key}
              onClick={() => selectStrategy(key)}
              className={`rounded-full px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider transition-all ${
                active
                  ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : "border border-white/[0.07] bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80"
              }`}
              aria-pressed={active}
            >
              {STRATEGIES[key].name}
            </button>
          );
        })}
      </div>

      {/* Main grid: Legs + Spot (left) | Chart + Summary (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* ─── LEFT — Leg configuration + Spot ─── */}
        <div className="flex flex-col gap-4">
          {/* Spot price slider */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label
                htmlFor="range-spot"
                className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-wider text-white/55"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-sans text-white/80">Spot Price</span>
                <span className="font-mono text-[0.7rem] font-bold text-emerald-400">S</span>
              </label>
              <span className="numeric font-mono text-sm font-semibold text-emerald-400">
                ${spot.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <input
              id="range-spot"
              type="range"
              min={spotMin}
              max={spotMax}
              step={spotStep}
              value={spot}
              onChange={(e) => setSpot(parseFloat(e.target.value))}
              className="vince-range"
              style={spotStyle}
              aria-label="Spot Price"
            />
          </div>

          {/* Leg cards */}
          <div className="flex flex-col gap-2.5">
            {legs.map((leg, idx) => {
              const qty = leg.quantity ?? 1;
              return (
                <div
                  key={idx}
                  className={`rounded-lg border ${legBorderClass(leg)} ${legBgClass(leg)} p-3`}
                >
                  {/* Leg header */}
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[0.7rem] font-bold uppercase ${legColorClass(leg)}`}
                      >
                        {leg.position === "long" ? "LONG" : "SHORT"}
                      </span>
                      <span
                        className={`font-mono text-[0.7rem] font-bold uppercase ${legColorClass(leg)}`}
                      >
                        {leg.type === "call" ? "CALL" : "PUT"}
                      </span>
                      {qty > 1 && (
                        <span className="rounded bg-white/10 px-1.5 font-mono text-[0.6rem] text-white/60">
                          ×{qty}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/35">
                      Leg {idx + 1}
                    </span>
                  </div>

                  {/* Strike + Premium inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor={`strike-${idx}`}
                        className="mb-1 block font-mono text-[0.55rem] uppercase tracking-wider text-white/40"
                      >
                        Strike
                      </label>
                      <input
                        id={`strike-${idx}`}
                        type="number"
                        value={leg.strike}
                        onChange={(e) =>
                          updateLeg(idx, "strike", parseFloat(e.target.value) || 0)
                        }
                        className="numeric w-full rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-white/90 placeholder-white/20 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
                        step={leg.strike > 1000 ? 1 : 0.5}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`premium-${idx}`}
                        className="mb-1 block font-mono text-[0.55rem] uppercase tracking-wider text-white/40"
                      >
                        {leg.position === "long" ? "Debit" : "Credit"}
                      </label>
                      <input
                        id={`premium-${idx}`}
                        type="number"
                        value={leg.premium}
                        onChange={(e) =>
                          updateLeg(idx, "premium", parseFloat(e.target.value) || 0)
                        }
                        className="numeric w-full rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-white/90 placeholder-white/20 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
                        step={leg.premium > 100 ? 1 : 0.5}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategy info note */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
              Strategy profile
            </div>
            <div className="font-mono text-[0.65rem] leading-relaxed text-white/55">
              {strategyKey === "iron_condor" &&
                "Neutral · Profit when price stays between short strikes. Max profit = net credit."}
              {strategyKey === "butterfly" &&
                "Neutral · Profit when price near middle strike. Max profit = wing width − net debit."}
              {strategyKey === "straddle" &&
                "Volatile · Profit on big moves either direction. Max loss = total premium paid."}
              {strategyKey === "strangle" &&
                "Volatile · Profit on large moves. Wider breakevens than straddle, lower cost."}
              {strategyKey === "bull_call_spread" &&
                "Bullish · Profit when price rises above upper strike. Limited risk & reward."}
              {strategyKey === "bear_put_spread" &&
                "Bearish · Profit when price falls below lower strike. Limited risk & reward."}
              {strategyKey === "long_call" &&
                "Bullish · Unlimited upside, limited downside. Max loss = premium paid."}
              {strategyKey === "long_put" &&
                "Bearish · Profit as price falls. Max loss = premium paid."}
            </div>
          </div>
        </div>

        {/* ─── RIGHT — Chart + Summary ─── */}
        <div className="flex flex-col gap-5">
          {/* Payoff diagram */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/50">
                P&amp;L at Expiry · {strategy.name}
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[0.5rem] text-white/45">
                {/* Legend entries for each leg */}
                {legs.map((leg, li) => (
                  <span key={li} className="flex items-center gap-1">
                    <span
                      className="inline-block h-0.5 w-3"
                      style={{
                        backgroundColor: legColor(leg),
                        opacity: 0.7,
                        borderTop: "1px dashed",
                      }}
                    />
                    <span className="uppercase">
                      {leg.position === "short" ? "Sh" : "L"}
                      {leg.type === "call" ? "C" : "P"} {fmtStrike(leg.strike)}
                    </span>
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1 w-3 rounded-sm bg-white/80" />
                  combined
                </span>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full"
              style={{ height: "auto" }}
              aria-label="Strategy PnL payoff diagram at expiry"
              role="img"
            >
              <defs>
                <clipPath id="stratProfitClip">
                  <rect
                    x={padL}
                    y={yScale(maxPnl)}
                    width={plotW}
                    height={Math.max(yZero - yScale(maxPnl), 0)}
                  />
                </clipPath>
                <clipPath id="stratLossClip">
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
                      y={chartH - 14}
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

              {/* Zero P&L line */}
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
                fillOpacity={0.18}
                clipPath="url(#stratProfitClip)"
              />
              {/* Loss area (below zero) */}
              <polygon
                points={areaPolygon}
                fill="rgb(251,113,133)"
                fillOpacity={0.18}
                clipPath="url(#stratLossClip)"
              />

              {/* Max profit horizontal dashed line */}
              {analysis.maxProfit > 0 && (
                <line
                  x1={padL}
                  y1={yScale(analysis.maxProfit)}
                  x2={padL + plotW}
                  y2={yScale(analysis.maxProfit)}
                  stroke="rgb(34,211,238)"
                  strokeOpacity={0.35}
                  strokeWidth={0.6}
                  strokeDasharray="3,4"
                />
              )}

              {/* Max loss horizontal dashed line */}
              {analysis.maxLoss < 0 && (
                <line
                  x1={padL}
                  y1={yScale(analysis.maxLoss)}
                  x2={padL + plotW}
                  y2={yScale(analysis.maxLoss)}
                  stroke="rgb(251,113,133)"
                  strokeOpacity={0.3}
                  strokeWidth={0.6}
                  strokeDasharray="3,4"
                />
              )}

              {/* Individual leg PnL lines (thin, dashed) */}
              {legs.map((leg, li) => (
                <polyline
                  key={`leg-${li}`}
                  points={legLines[li]}
                  fill="none"
                  stroke={legColor(leg)}
                  strokeOpacity={0.4}
                  strokeWidth={1}
                  strokeDasharray="4,3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {/* Combined PnL line (thick, solid white) */}
              <polyline
                points={combinedPoints}
                fill="none"
                stroke="white"
                strokeOpacity={0.9}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Strike vertical lines */}
              {legs.map((leg, li) => (
                <g key={`strike-line-${li}`}>
                  <line
                    x1={xScale(leg.strike)}
                    y1={padT}
                    x2={xScale(leg.strike)}
                    y2={padT + plotH}
                    stroke={legColor(leg)}
                    strokeOpacity={0.15}
                    strokeWidth={0.5}
                    strokeDasharray="2,3"
                  />
                </g>
              ))}

              {/* Current spot vertical line */}
              {spot >= analysis.startS && spot <= analysis.endS && (
                <g>
                  <line
                    x1={xScale(spot)}
                    y1={padT}
                    x2={xScale(spot)}
                    y2={padT + plotH}
                    stroke="white"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                    strokeDasharray="4,3"
                  />
                  <text
                    x={xScale(spot)}
                    y={padT - 5}
                    textAnchor="middle"
                    className="font-mono"
                    fill="white"
                    fillOpacity={0.85}
                    fontSize={7.5}
                    fontWeight={700}
                  >
                    S=${spot.toFixed(0)}
                  </text>
                  {/* Current PnL marker on combined line */}
                  {(() => {
                    const currentPnl = combinedPnL(legs, spot);
                    const cy = yScale(currentPnl);
                    return (
                      <circle
                        cx={xScale(spot)}
                        cy={cy}
                        r={4}
                        fill={currentPnl >= 0 ? "rgb(52,211,153)" : "rgb(251,113,133)"}
                        stroke="rgb(20,20,24)"
                        strokeWidth={1.5}
                      />
                    );
                  })()}
                </g>
              )}

              {/* Breakeven markers */}
              {analysis.breakevens.map((be, i) => {
                const bx = xScale(be);
                return (
                  bx >= padL &&
                  bx <= padL + plotW && (
                    <g key={`be-${i}`}>
                      <circle
                        cx={bx}
                        cy={yZero}
                        r={3.5}
                        fill="rgb(251,191,36)"
                        stroke="rgb(20,20,24)"
                        strokeWidth={1}
                      />
                      <text
                        x={bx}
                        y={padT + plotH + 28}
                        textAnchor="middle"
                        className="font-mono"
                        fill="rgb(251,191,36)"
                        fillOpacity={0.9}
                        fontSize={7}
                        fontWeight={600}
                      >
                        BE ${be.toFixed(1)}
                      </text>
                    </g>
                  )
                );
              })}

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
                Underlying price at expiry
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
                P&amp;L ($)
              </text>
            </svg>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {/* Max Profit */}
            <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/[0.06] p-3">
              <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                Max Profit
              </div>
              <div className="numeric mt-1.5 font-mono text-base font-semibold tabular-nums text-emerald-400">
                {analysis.maxProfit === Infinity ? "∞" : fmtMoney(analysis.maxProfit)}
              </div>
            </div>

            {/* Max Loss */}
            <div className="rounded-lg border border-rose-400/25 bg-rose-400/[0.06] p-3">
              <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                Max Loss
              </div>
              <div className="numeric mt-1.5 font-mono text-base font-semibold tabular-nums text-rose-400">
                {analysis.maxLoss === -Infinity ? "∞" : fmtMoney(analysis.maxLoss)}
              </div>
            </div>

            {/* Breakevens */}
            <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-3">
              <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                Breakeven{analysis.breakevens.length !== 1 ? "s" : ""}
              </div>
              <div className="numeric mt-1.5 font-mono text-base font-semibold tabular-nums text-amber-400">
                {analysis.breakevens.length > 0
                  ? analysis.breakevens.map((be) => `$${be.toFixed(1)}`).join(", ")
                  : "—"}
              </div>
            </div>

            {/* Net Premium */}
            <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/[0.06] p-3">
              <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                Net Premium
              </div>
              <div className="numeric mt-1.5 font-mono text-base font-semibold tabular-nums text-cyan-400">
                {analysis.netPremium >= 0 ? "+" : ""}
                {fmtMoney(analysis.netPremium)}
              </div>
              <div className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-wider text-white/35">
                {analysis.netPremium >= 0 ? "credit" : "debit"}
              </div>
            </div>

            {/* Risk/Reward */}
            <div className="rounded-lg border border-violet-400/25 bg-violet-400/[0.06] p-3">
              <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">
                Risk / Reward
              </div>
              <div className="numeric mt-1.5 font-mono text-base font-semibold tabular-nums text-violet-400">
                1 : {riskReward === Infinity ? "∞" : riskReward.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <SchematicDisclaimer
            live={live && legsLive}
            source={source}
            note="payoff at expiry · 60s refresh"
          />
        </div>
      </div>
    </div>
  );
}
