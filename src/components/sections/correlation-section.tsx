"use client";

import { motion } from "framer-motion";
import { Radar, ShieldCheck, PieChart } from "lucide-react";
import { CorrelationMatrixViz } from "@/components/shared/correlation-matrix-viz";

const whyCorrCards = [
  {
    icon: Radar,
    title: "Regime detection",
    body: "Spot when correlations spike — the early signature of regime shifts, stress contagion and risk-off convergence across asset classes.",
    accent: "amber" as const,
  },
  {
    icon: ShieldCheck,
    title: "Hedge effectiveness",
    body: "Validate that your hedges are actually counter-correlated. A hedge that drifts positive isn't a hedge — it's doubling down.",
    accent: "rose" as const,
  },
  {
    icon: PieChart,
    title: "Portfolio diversification",
    body: "Track diversification decay in real time. When correlations rise, capital concentration rises with them — quietly.",
    accent: "emerald" as const,
  },
];

const accentMap: Record<
  "amber" | "rose" | "emerald",
  { text: string; border: string; bg: string; ring: string }
> = {
  amber: {
    text: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.06]",
    ring: "group-hover:ring-amber-400/30",
  },
  rose: {
    text: "text-rose-400",
    border: "border-rose-400/30",
    bg: "bg-rose-400/[0.06]",
    ring: "group-hover:ring-rose-400/30",
  },
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.06]",
    ring: "group-hover:ring-emerald-400/30",
  },
};

export function CorrelationSection() {
  return (
    <section id="correlation" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-30" aria-hidden />

      {/* Decorative amber glow dots at the corners */}
      <div className="glow-dot glow-dot-amber" style={{ top: "12%", left: "6%" }} aria-hidden />
      <div className="glow-dot glow-dot-amber" style={{ top: "18%", right: "8%" }} aria-hidden />
      <div className="glow-dot glow-dot-amber" style={{ bottom: "22%", left: "10%" }} aria-hidden />
      <div className="glow-dot glow-dot-amber" style={{ bottom: "14%", right: "6%" }} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading block */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/corr_matrix · cross-asset</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            Cross-asset correlations,
            <br />
            <span className="text-gradient-emerald">decoded at a glance.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            A 30-day rolling correlation matrix across 10 major instruments — instantly
            spot regime shifts, diversification breakdowns and hedge effectiveness. The same
            matrix Volatility Vince surfaces with a single{" "}
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[0.85em] text-emerald-300">
              /corr_matrix
            </code>{" "}
            command in Telegram.
          </p>
        </div>

        {/* Matrix visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 min-w-0"
        >
          <CorrelationMatrixViz />
        </motion.div>

        {/* Why correlations matter — 3 bullet cards */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {whyCorrCards.map((card, i) => {
            const cm = accentMap[card.accent];
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group min-w-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60 p-5 hover-lift card-inner-glow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cm.border} ${cm.bg} ring-1 ring-transparent transition ${cm.ring}`}
                  >
                    <card.icon className={`h-4.5 w-4.5 ${cm.text}`} />
                  </div>
                  <div className="min-w-0">
                    <div className={`font-mono text-xs font-semibold ${cm.text}`}>
                      {card.title}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                      {card.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
