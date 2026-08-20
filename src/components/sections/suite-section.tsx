"use client";

import { motion } from "framer-motion";
import { Check, Package, Mail } from "lucide-react";
import { suiteModules, site } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const accentMap: Record<string, { text: string; border: string; bg: string; num: string }> = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.06]",
    num: "text-emerald-400/30",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.06]",
    num: "text-amber-400/30",
  },
  rose: {
    text: "text-rose-400",
    border: "border-rose-400/30",
    bg: "bg-rose-400/[0.06]",
    num: "text-rose-400/30",
  },
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/[0.06]",
    num: "text-cyan-400/30",
  },
  violet: {
    text: "text-violet-400",
    border: "border-violet-400/30",
    bg: "bg-violet-400/[0.06]",
    num: "text-violet-400/30",
  },
};

export function SuiteSection() {
  return (
    <section id="suite" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          {/* Left — narrative */}
          <div className="lg:sticky lg:top-24">
            <div className="eyebrow">/suite · modular by design</div>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
              One module,
              <br />
              <span className="text-gradient-emerald">or the whole desk.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60">
              Volatility Vince is Module 03 of the {site.parentSuite} — a five-module quant
              finance stack. Already have your own software? Buy Vince standalone. Want the full
              institutional workflow? License all five modules together.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <div className="font-sans text-sm font-semibold text-white">
                    Every module sold individually
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    Traders who already have their own software and tooling can license just
                    Volatility Vince — the chatbot for asking questions, generating charts and
                    calculating GEX levels — without buying the rest of the suite.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60 p-3">
                <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
                  Total modules
                </div>
                <div className="numeric mt-1 font-mono text-2xl font-semibold text-white">5</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60 p-3">
                <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
                  Suite LOC
                </div>
                <div className="numeric mt-1 font-mono text-2xl font-semibold text-white">
                  ~50K
                </div>
              </div>
            </div>
          </div>

          {/* Right — module cards with stagger */}
          <div className="space-y-3">
            {suiteModules.map((m, i) => {
              const a = accentMap[m.accent];
              const isVince = m.number === "03";
              return (
                <motion.div
                  key={m.number}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={`section-enter stagger-${Math.min(i + 1, 5)} ${cn(
                    "group relative overflow-hidden rounded-xl border bg-[oklch(0.20_0.014_252)]/60 p-5 transition-all hover:bg-[oklch(0.22_0.015_253)]/70",
                    isVince
                      ? "border-emerald-400/30 ring-1 ring-emerald-400/15"
                      : "border-white/[0.06] hover:border-white/[0.14]"
                  )}`}
                >
                  {isVince && (
                    <div className="absolute right-4 top-4 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-emerald-400">
                      you are here
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border font-mono text-lg font-bold",
                        a.border,
                        a.bg,
                        a.text
                      )}
                    >
                      {m.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <h3 className="font-sans text-lg font-semibold text-white">{m.name}</h3>
                        <span className="font-mono text-[0.6rem] uppercase tracking-wider text-white/35">
                          {m.language} · {m.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">{m.tagline}</p>

                      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                        {m.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-1.5 text-[0.7rem] text-white/55"
                          >
                            <Check className={cn("mt-0.5 h-3 w-3 shrink-0", a.text)} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <a
              href={`mailto:${site.contactEmail}`}
              className="group flex items-center justify-between rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-4 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[0.03]"
            >
              <div>
                <div className="font-sans text-sm font-semibold text-white">
                  Request the full suite
                </div>
                <div className="font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
                  {site.contactEmail}
                </div>
              </div>
              <Mail className="h-5 w-5 text-white/40 transition-colors group-hover:text-emerald-400" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
