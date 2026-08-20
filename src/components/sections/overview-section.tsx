"use client";

import { motion } from "framer-motion";
import { Brain, MessageSquare, Calculator, FileBarChart } from "lucide-react";
import { site } from "@/lib/site-data";

const pillars = [
  {
    icon: MessageSquare,
    title: "Ask Anything",
    description:
      "Natural-language research desk in Telegram. Type a question, get institutional-grade analysis back — with charts, levels and a trade plan.",
    accent: "text-emerald-400",
    glow: "from-emerald-500/20",
  },
  {
    icon: Calculator,
    title: "Calculate Everything",
    description:
      "GEX, DEX, VEX, 12 Greeks, SABR/SVI vol surfaces, Monte Carlo VaR (1M paths), Kelly sizing — all in one chatbot.",
    accent: "text-amber-400",
    glow: "from-amber-500/20",
  },
  {
    icon: Brain,
    title: "Detect Regimes",
    description:
      "HMM & GMM models classify the market across vol, trend, correlation and macro dimensions — so you know what regime you're trading.",
    accent: "text-violet-400",
    glow: "from-violet-500/20",
  },
  {
    icon: FileBarChart,
    title: "Export Board-Ready",
    description:
      "Dark institutional Krupp Capital design via Plotly. Generate PDF, Excel and JSON reports — branded and board-ready in seconds.",
    accent: "text-cyan-400",
    glow: "from-cyan-500/20",
  },
];

export function OverviewSection() {
  return (
    <section id="overview" className="bg-noise relative overflow-hidden py-24 sm:py-28">
      {/* Decorative emerald glow dots */}
      <div className="glow-dot glow-dot-emerald" style={{ top: "8%", left: "5%" }} aria-hidden />
      <div className="glow-dot glow-dot-emerald" style={{ top: "12%", right: "7%" }} aria-hidden />
      <div className="glow-dot glow-dot-emerald" style={{ bottom: "10%", left: "10%" }} aria-hidden />
      <div className="glow-dot glow-dot-emerald" style={{ bottom: "15%", right: "5%" }} aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/overview · the mission</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            A hedgefund research desk,
            <br />
            <span className="text-gradient-emerald">collapsed into a chatbot.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            {site.brand} is the {site.moduleNumber}rd module of the {site.parentSuite} — a
            production-ready Python quant engine wired into Telegram. It does the work of a
            multi-seat research desk: pricing, exposure analytics, regime detection, risk and
            reporting. You just message it.
          </p>
        </div>

        {/* Pillars with section-enter + stagger */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`section-enter stagger-${i + 1} group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60 p-6 transition-colors hover:border-white/[0.12] hover-lift hover-glow-emerald`}
            >
              <div
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${p.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
                aria-hidden
              />
              <div className="relative">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                  <p.icon className={`h-5 w-5 ${p.accent}`} />
                </div>
                <h3 className="mt-4 font-sans text-lg font-semibold text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {p.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
