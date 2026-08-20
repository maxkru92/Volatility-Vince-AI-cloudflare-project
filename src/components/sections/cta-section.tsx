"use client";

import { motion } from "framer-motion";
import { ArrowRight, Send, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site-data";
import { NewsletterCard } from "@/components/shared/newsletter-card";

export function CtaSection() {
  return (
    <section id="contact" className="relative overflow-hidden py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-noise bg-scanlines bg-gradient-to-br from-[oklch(0.20_0.014_252)] via-[oklch(0.22_0.015_253)] to-[oklch(0.18_0.013_251)] p-8 sm:p-12 lg:p-16 border-gradient"
        >
          {/* Background grid + glows */}
          <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-[100px]" aria-hidden />
          <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" aria-hidden />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-emerald-300">
                  now accepting early access
                </span>
              </div>
              <h2 className="mt-5 font-sans text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                Deploy a hedgefund research desk
                <br />
                <span className="text-gradient-emerald">in your Telegram today.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
                Get Volatility Vince standalone or as part of the Krupp Capital Trading Suite.
                Production-ready, German-engineered, hedgefund-grade — for retail traders who
                refuse to be gatekept.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  asChild
                  className="btn-ripple hover-magnetic h-11 bg-emerald-400 px-6 font-mono text-sm font-semibold uppercase tracking-wider text-[oklch(0.16_0.02_152)] hover:bg-emerald-300"
                >
                  <a href="#pricing">
                    Choose your license
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-11 border-white/15 bg-white/[0.02] px-6 font-mono text-sm font-medium uppercase tracking-wider text-white/80 hover:bg-white/[0.06] hover:text-white"
                >
                  <a href={`mailto:${site.contactEmail}`}>
                    <Mail className="h-4 w-4" />
                    Talk to {site.parentOrg}
                  </a>
                </Button>
              </div>
            </div>

            {/* Right — contact card */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
              <div className="font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
                direct channels
              </div>
              <div className="mt-3 space-y-2.5">
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
                >
                  <Mail className="h-4 w-4 text-white/60 group-hover:text-emerald-400" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-white">Email</div>
                    <div className="truncate font-mono text-[0.6rem] text-white/40">
                      {site.contactEmail}
                    </div>
                  </div>
                </a>
                <a
                  href="#demo"
                  className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
                >
                  <MessageCircle className="h-4 w-4 text-white/60 group-hover:text-emerald-400" />
                  <div>
                    <div className="font-mono text-xs text-white">Telegram</div>
                    <div className="font-mono text-[0.6rem] text-white/40">
                      {site.contactHandle} · @kruppcapital
                    </div>
                  </div>
                </a>
                <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <Send className="h-4 w-4 text-white/60" />
                  <div>
                    <div className="font-mono text-xs text-white">Live Demo</div>
                    <div className="font-mono text-[0.6rem] text-white/40">
                      Try Vince in-browser →
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-white/[0.06] pt-3 font-mono text-[0.55rem] uppercase tracking-wider text-white/30">
                Watermark: "crafted by Krupp Capital"
              </div>
            </div>
          </div>
        </motion.div>

        {/* Newsletter capture — below the main CTA grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <NewsletterCard />
        </motion.div>
      </div>
    </section>
  );
}
