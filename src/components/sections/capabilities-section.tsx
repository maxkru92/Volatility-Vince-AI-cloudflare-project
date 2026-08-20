"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { features, type Feature } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

const categories = [
  "All",
  "Greeks",
  "Exposure",
  "Vol Surface",
  "Strategies",
  "Risk",
  "Technical",
  "Regime",
  "Earnings",
  "Flow",
  "Futures",
  "ML",
  "Portfolio",
  "Deep Learning",
  "Valuation",
  "Forecasting",
  "Vision",
] as const;

const accentMap: Record<Feature["accent"], { text: string; border: string; bg: string; dot: string }> = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.08]",
    dot: "bg-emerald-400",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.08]",
    dot: "bg-amber-400",
  },
  rose: {
    text: "text-rose-400",
    border: "border-rose-400/30",
    bg: "bg-rose-400/[0.08]",
    dot: "bg-rose-400",
  },
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/[0.08]",
    dot: "bg-cyan-400",
  },
  violet: {
    text: "text-violet-400",
    border: "border-violet-400/30",
    bg: "bg-violet-400/[0.08]",
    dot: "bg-violet-400",
  },
};

// ── Signature stat per category ─────────────────────────────────────

const SIGNATURE_STATS: Record<string, { stat: string; accent: Feature["accent"] }> = {
  Greeks: { stat: "12 Greeks", accent: "emerald" },
  Exposure: { stat: "100K+ strikes", accent: "emerald" },
  "Vol Surface": { stat: "4 models", accent: "cyan" },
  Strategies: { stat: "15+ strategies", accent: "amber" },
  Risk: { stat: "1M paths", accent: "rose" },
  Technical: { stat: "50+ indicators", accent: "cyan" },
  Regime: { stat: "HMM + GMM", accent: "violet" },
  Earnings: { stat: "IV crush", accent: "amber" },
  Flow: { stat: "Smart-money", accent: "rose" },
  Futures: { stat: "VIX futures", accent: "cyan" },
  ML: { stat: "4 pipelines", accent: "violet" },
  Portfolio: { stat: "HRP + BL", accent: "emerald" },
  "Deep Learning": { stat: "FINN engine", accent: "violet" },
  Valuation: { stat: "DCF + WACC", accent: "amber" },
  Forecasting: { stat: "16K context", accent: "violet" },
  Vision: { stat: "No OCR", accent: "cyan" },
};

// ── Example commands per category ───────────────────────────────────

const EXAMPLE_COMMANDS: Record<string, string[]> = {
  Greeks: ["/bs SPX 5800 0.25", "/greeks NVDA", "/iv_rank AAPL"],
  Exposure: ["/gex SPX", "/dex NDX", "/gamma_flip SPY"],
  "Vol Surface": ["/sabr SPX", "/svi AAPL", "/term_structure SPX"],
  Strategies: ["/iron_condor SPY", "/strangle NVDA", "/butterfly SPX"],
  Risk: ["/var portfolio", "/cvar SPX", "/kelly AAPL"],
  Technical: ["/rsi SPX", "/macd AAPL", "/bbands NVDA"],
  Regime: ["/regime SPY", "/hmm SPX", "/gmm NDX"],
  Earnings: ["/earnings NVDA", "/vol_cone AAPL", "/earn_straddle TSLA"],
  Flow: ["/flow SPX", "/unusual_activity", "/dark_pool AAPL"],
  Futures: ["/vix_futures", "/cot_report", "/basis ES"],
  ML: ["/ml_predict SPX", "/alpha_factor", "/pd_model"],
  Portfolio: ["/efficient_frontier", "/hrp portfolio", "/black_litterman"],
  "Deep Learning": ["/finn_price SPX", "/sabr_calibrate", "/basket_mc"],
  Valuation: ["/dcf AAPL", "/wacc NVDA", "/relative_value SPX"],
  Forecasting: ["/timesfm SPX", "/forecast AAPL 30d", "/zero_shot NDX"],
  Vision: ["/extract_chart image.png", "/parse_table report.pdf", "/read_pdf 10-K"],
};

// ── Main component ──────────────────────────────────────────────────

export function CapabilitiesSection() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");

  const filtered =
    active === "All" ? features : features.filter((f) => f.category === active);

  return (
    <section id="capabilities" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid-fine mask-radial-fade opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/capabilities · 18 submodules</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            One chatbot.
            <span className="text-gradient-emerald"> Sixteen quantitative disciplines.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            From Black-Scholes Greeks to TimesFM forecasting and ColQwen2 document retrieval —
            Volatility Vince packs a full institutional analytics stack into a single Telegram
            interface.
          </p>
        </div>

        {/* Section divider */}
        <div className="section-divider mt-8" />

        {/* Category filter */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-wider transition-all",
                active === cat
                  ? cat === "All"
                    ? "border-emerald-400/40 bg-emerald-400/[0.12] text-emerald-300 border-gradient"
                    : "border-emerald-400/40 bg-emerald-400/[0.12] text-emerald-300"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feature grid */}
        <motion.div layout className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((f) => {
              const a = accentMap[f.accent];
              const sig = SIGNATURE_STATS[f.category];
              const cmds = EXAMPLE_COMMANDS[f.category];

              const cardContent = (
                <motion.div
                  layout
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-[oklch(0.20_0.014_252)]/70 p-6 transition-colors hover:bg-[oklch(0.22_0.015_253)]/80 hover-lift",
                    "border-white/[0.06] hover:border-white/[0.14]"
                  )}
                >
                  {/* Category tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider",
                        a.border,
                        a.bg,
                        a.text
                      )}
                    >
                      <span className={cn("h-1 w-1 rounded-full", a.dot)} />
                      {f.category}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider text-white/25">
                      {f.id}
                    </span>
                  </div>

                  <h3 className="mt-4 font-sans text-lg font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {f.description}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-white/[0.05] pt-4">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-white/60">
                        <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", a.text)} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Signature stat footer */}
                  {sig && (
                    <div className="mt-4 border-t border-white/[0.05] pt-3">
                      <span
                        className={cn(
                          "font-mono text-xs",
                          sig.accent === "emerald"
                            ? "text-emerald-400"
                            : sig.accent === "cyan"
                            ? "text-cyan-400"
                            : sig.accent === "amber"
                            ? "text-amber-400"
                            : sig.accent === "rose"
                            ? "text-rose-400"
                            : "text-violet-400"
                        )}
                      >
                        {sig.stat}
                      </span>
                    </div>
                  )}
                </motion.div>
              );

              // Wrap with HoverCard on desktop only
              if (cmds && cmds.length > 0) {
                return (
                  <HoverCard key={f.id} openDelay={300} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <div className="hidden sm:block">{cardContent}</div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-64 rounded-xl border border-white/[0.08] bg-[oklch(0.16_0.014_252)]/95 p-4 backdrop-blur-xl"
                      side="top"
                      align="center"
                    >
                      <div className="mb-3 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-white/70">
                        {f.category} Commands
                      </div>
                      <div className="space-y-2">
                        {cmds.map((cmd) => (
                          <div key={cmd} className="flex items-start gap-1.5">
                            <span className="shrink-0 font-mono text-[0.6rem] text-emerald-400/70">
                              vince@krupp:~$
                            </span>
                            <span className="font-mono text-[0.65rem] text-white/80">
                              {cmd}
                            </span>
                          </div>
                        ))}
                      </div>
                    </HoverCardContent>
                    {/* Mobile: just the card without hover card */}
                    <div className="sm:hidden">{cardContent}</div>
                  </HoverCard>
                );
              }

              return cardContent;
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
