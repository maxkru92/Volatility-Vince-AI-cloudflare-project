"use client";

import { motion } from "framer-motion";
import { Activity, GitBranch, Radio } from "lucide-react";
import { RegimeDetectionViz } from "@/components/shared/regime-detection-viz";

const howItWorksCards = [
  {
    icon: Activity,
    title: "State classification",
    body: "HMM and GMM models decompose market conditions into distinct, probabilistically assigned regimes — bull, sideways, bear — across volatility, trend and correlation dimensions.",
    accent: "emerald" as const,
  },
  {
    icon: GitBranch,
    title: "Transition probabilities",
    body: "The model outputs a full transition matrix: the probability of moving from any state to any other state. This is how you know not just where you are, but where you're likely to go.",
    accent: "amber" as const,
  },
  {
    icon: Radio,
    title: "Real-time monitoring",
    body: "Regime probabilities update with every new data bar. When a transition signal fires, Vince surfaces it instantly — no refresh required, no dashboard to check.",
    accent: "rose" as const,
  },
];

const accentMap: Record<
  "emerald" | "amber" | "rose",
  { text: string; border: string; bg: string; ring: string }
> = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.06]",
    ring: "group-hover:ring-emerald-400/30",
  },
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
};

export function RegimeSection() {
  return (
    <section id="regime" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-30" aria-hidden />

      {/* Decorative glow dots — rose/violet at corners */}
      <div className="glow-dot glow-dot-violet" style={{ top: "10%", left: "5%" }} aria-hidden />
      <div className="glow-dot glow-dot-rose" style={{ top: "15%", right: "7%" }} aria-hidden />
      <div className="glow-dot glow-dot-violet" style={{ bottom: "20%", left: "8%" }} aria-hidden />
      <div className="glow-dot glow-dot-rose" style={{ bottom: "12%", right: "5%" }} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading block */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/regime · market intelligence</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            Market regime detection,
            <br />
            <span className="text-gradient-emerald">in real time.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Hidden Markov Models classify market conditions into distinct
            regimes — bull, sideways, bear — with probabilistic state
            transitions. Volatility Vince runs HMM and GMM models across
            volatility, trend and correlation dimensions, surfacing the current
            state and most likely transitions with a single{" "}
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[0.85em] text-emerald-300">
              /regime
            </code>{" "}
            command.
          </p>
        </div>

        {/* Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 min-w-0"
        >
          <RegimeDetectionViz />
        </motion.div>

        {/* How regime detection works — 3 bullet cards */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {howItWorksCards.map((card, i) => {
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
