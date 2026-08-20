"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { architectureLayers, performanceMetrics } from "@/lib/site-data";
import { AnimatedStat } from "@/components/shared/animated-stat";

export function ArchitectureSection() {
  return (
    <section id="architecture" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/architecture · 5-layer stack</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            Built like an
            <span className="text-gradient-emerald"> institutional stack.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Five layers, from Telegram interface down to deep-learning models and Plotly
            visualization — all wired through a shared data and config layer that the rest of the
            Krupp Capital Trading Suite also uses.
          </p>
        </div>

        {/* Layer stack */}
        <div className="mx-auto mt-14 max-w-4xl">
          {architectureLayers.map((layer, i) => (
            <div key={layer.layer}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60 p-5 transition-colors hover:border-emerald-400/20 hover-lift hover-glow-emerald"
              >
                <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-emerald-400/80">
                      Layer {architectureLayers.length - i}
                    </div>
                    <div className="mt-1 font-sans text-base font-semibold text-white">
                      {layer.layer}
                    </div>
                  </div>
                  <div>
                    <div className="font-sans text-sm font-medium text-white">
                      {layer.name}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {layer.description}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {layer.tech.map((t) => (
                        <span
                          key={t}
                          className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[0.6rem] text-white/55"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              {i < architectureLayers.length - 1 && (
                <div className="flex justify-center py-1.5">
                  <ArrowDown className="h-3.5 w-3.5 text-white/20" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Section divider between layers and performance */}
        <div className="section-divider" />

        {/* Performance metrics with section-enter + stagger */}
        <div className="mt-16">
          <div className="mb-6 text-center">
            <div className="eyebrow">/performance · measured</div>
            <h3 className="mt-2 font-sans text-xl font-semibold text-white">
              Hedgefund latency, retail access.
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-3 lg:grid-cols-6">
            {performanceMetrics.map((m, i) => (
              <div
                key={m.label}
                className={`section-enter stagger-${Math.min(i + 1, 6)} bg-[oklch(0.20_0.014_252)]/60 px-4 py-5 text-center`}
              >
                <div className="numeric font-mono text-xl font-semibold text-emerald-400">
                  {m.value}
                </div>
                <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider text-white/55">
                  {m.label}
                </div>
                <div className="font-mono text-[0.55rem] text-white/30">{m.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
