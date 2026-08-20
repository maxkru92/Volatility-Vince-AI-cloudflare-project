"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send, Sparkles, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site, stats } from "@/lib/site-data";
import { VolatilityChart } from "@/components/shared/volatility-chart";
import { AnimatedStat } from "@/components/shared/animated-stat";
import { ActivityFeed } from "@/components/shared/activity-feed";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax — translate each `.hero-parallax-layer` by scrollY * its own
  // `--parallax-speed` CSS variable. Cheap, GPU-accelerated, throttled via rAF.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const el = sectionRef.current;
      if (!el) return;
      el.style.setProperty("--hero-scroll-y", String(y));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-40 lg:pb-28"
      style={{ ["--hero-scroll-y" as string]: "0" }}
    >
      {/* Hero-specific background layers; the animated matrix/grid backdrop lives globally in the page shell. */}
      {/* Layered parallax glows — three radial gradients moving at different speeds */}
      <div
        className="hero-parallax-layer pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-500/12 blur-[120px]"
        style={{ ["--parallax-speed" as string]: "0.12" }}
        aria-hidden
      />
      <div
        className="hero-parallax-layer pointer-events-none absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"
        style={{ ["--parallax-speed" as string]: "0.20" }}
        aria-hidden
      />
      <div
        className="hero-parallax-layer pointer-events-none absolute left-1/3 top-1/4 h-80 w-80 rounded-full bg-violet-500/8 blur-[120px]"
        style={{ ["--parallax-speed" as string]: "0.08" }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Floating particles */}
        <div className="float-particle float-particle-sm" style={{ top: "18%", left: "12%", "--float-delay": "0s" } as React.CSSProperties} aria-hidden />
        <div className="float-particle float-particle-md" style={{ top: "35%", left: "8%", "--float-delay": "1.5s" } as React.CSSProperties} aria-hidden />
        <div className="float-particle float-particle-lg" style={{ top: "55%", right: "15%", "--float-delay": "3s" } as React.CSSProperties} aria-hidden />
        <div className="float-particle float-particle-sm" style={{ top: "70%", right: "10%", "--float-delay": "4.5s" } as React.CSSProperties} aria-hidden />

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Left — copy */}
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-white/60">
                Module 03 · {site.status} · {site.language}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem] text-reveal is-visible"
            >
              Institutional Quant
              <br />
              Intelligence.
              <br />
              <span className="text-gradient-emerald">In Your Telegram.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg"
            >
              {site.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button
                size="lg"
                asChild
                className="btn-ripple hover-magnetic h-11 bg-emerald-400 px-6 font-mono text-sm font-semibold uppercase tracking-wider text-[oklch(0.16_0.02_152)] hover:bg-emerald-300 border-conic-animate"
              >
                <a href="#pricing">
                  Get Volatility Vince
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-11 border-white/15 bg-white/[0.02] px-6 font-mono text-sm font-medium uppercase tracking-wider text-white/80 hover:bg-white/[0.06] hover:text-white"
              >
                <a href="#demo">
                  <Send className="h-4 w-4" />
                  Try Live Demo
                </a>
              </Button>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45"
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400/70" />
                <span className="font-mono uppercase tracking-wider">18 submodules</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-400/70" />
                <span className="font-mono uppercase tracking-wider">100+ commands</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-400/70" />
                <span className="font-mono uppercase tracking-wider">Hedgefund-grade</span>
              </span>
            </motion.div>
          </div>

          {/* Right — chart card + activity feed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative min-w-0"
          >
            <VolatilityChart />

            {/* Floating live activity feed — desktop only, anchored bottom-left of chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 hidden w-[20rem] xl:block"
            >
              <ActivityFeed />
            </motion.div>
          </motion.div>
        </div>

        {/* Activity feed — fallback placement (below chart) on lg-only screens */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 hidden lg:block xl:hidden"
        >
          <div className="mx-auto max-w-sm">
            <ActivityFeed />
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-3 lg:grid-cols-6"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[oklch(0.20_0.014_252)]/60 px-5 py-5 text-center backdrop-blur-sm"
            >
              <div className="ticker-glow numeric font-mono text-2xl font-semibold text-emerald-400 sm:text-3xl">
                <AnimatedStat value={s.value} />
              </div>
              <div className="mt-1 font-mono text-[0.7rem] uppercase tracking-wider text-white/55">
                {s.label}
              </div>
              <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-white/30">
                {s.sub}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
