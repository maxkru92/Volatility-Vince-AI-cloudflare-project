"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Sparkles, ArrowRight, Star } from "lucide-react";
import { pricingTiers } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Cycle = "monthly" | "annual" | "perpetual";

const cycleOptions: { k: Cycle; label: string; save?: string }[] = [
  { k: "monthly", label: "Monthly" },
  { k: "annual", label: "Annual", save: "−17%" },
  { k: "perpetual", label: "Perpetual" },
];

function CardSpotlightWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    };

    card.addEventListener("mousemove", handleMouseMove);
    return () => card.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={cardRef} className={cn("card-spotlight", className)}>
      {children}
    </div>
  );
}

function ShimmerPrice({ price, cycle }: { price: number; cycle: Cycle }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <span
      ref={ref}
      className={cn(
        "font-mono text-3xl font-semibold text-white",
        isInView && "price-shimmer"
      )}
    >
      €{price}
    </span>
  );
}

export function PricingSection() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  // Find the Pro Trader index (highlight: true)
  const proIndex = pricingTiers.findIndex((t) => t.highlight);

  return (
    <section id="pricing" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-30" aria-hidden />

      {/* Decorative amber glow dots */}
      <div className="glow-dot glow-dot-amber" style={{ top: "12%", left: "8%" }} aria-hidden />
      <div className="glow-dot glow-dot-amber" style={{ top: "18%", right: "12%" }} aria-hidden />
      <div className="glow-dot glow-dot-amber" style={{ bottom: "15%", left: "15%" }} aria-hidden />
      <div className="glow-dot glow-dot-amber" style={{ bottom: "22%", right: "8%" }} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/pricing · individual or bundle</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            License Vince alone,
            <span className="text-gradient-emerald"> or the whole desk.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Every module of the Krupp Capital Trading Suite is sold individually. Start with just
            the chatbot, upgrade to a multi-seat desk license, or license all five modules on a
            single invoice.
          </p>
        </div>

        {/* Billing toggle with sliding indicator */}
        <div className="mt-10 flex items-center justify-center">
          <div className="relative inline-flex items-center rounded-lg border border-white/10 bg-white/[0.02] p-1">
            {/* Sliding indicator */}
            <motion.div
              className="absolute rounded-md bg-emerald-400"
              layout
              layoutId="billing-indicator"
              style={{
                top: 4,
                height: "calc(100% - 8px)",
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
              }}
              animate={{
                left: cycleOptions.findIndex((o) => o.k === cycle) * (100 / cycleOptions.length) + 1 + "%",
                width: `calc(${100 / cycleOptions.length}% - 4px)`,
              }}
            />
            {cycleOptions.map((opt) => (
              <button
                key={opt.k}
                onClick={() => setCycle(opt.k)}
                className={cn(
                  "relative z-10 rounded-md px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                  cycle === opt.k
                    ? "text-[oklch(0.16_0.02_152)]"
                    : "text-white/55 hover:text-white"
                )}
              >
                {opt.label}
                {opt.save && (
                  <span
                    className={cn(
                      "ml-1.5 rounded px-1 py-0.5 text-[0.55rem]",
                      cycle === opt.k
                        ? "bg-[oklch(0.16_0.02_152)]/20 text-[oklch(0.16_0.02_152)]"
                        : "bg-emerald-400/15 text-emerald-400"
                    )}
                  >
                    {opt.save}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {pricingTiers.map((tier, i) => {
            const price =
              cycle === "monthly"
                ? tier.priceMonthly
                : cycle === "annual"
                ? tier.priceAnnual
                : tier.pricePerpetual;

            const showPrice = price !== null;
            const isPro = tier.highlight;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative"
              >
                {/* "Most Popular" floating badge above Pro Trader card */}
                {isPro && (
                  <div className="absolute -top-5 left-1/2 z-20 -translate-x-1/2 badge-bounce">
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-emerald-300 backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                      Most Popular
                    </div>
                  </div>
                )}

                <CardSpotlightWrapper
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-2xl border p-6",
                    isPro
                      ? "border-emerald-400/40 bg-emerald-400/[0.04] ring-1 ring-emerald-400/15 pricing-glow hover-lift-enhanced hover-glow-emerald border-conic-animate"
                      : "border-white/[0.08] bg-[oklch(0.20_0.014_252)]/60 hover-lift-enhanced"
                  )}
                >
                  {tier.badge && !isPro && (
                    <div
                      className={cn(
                        "absolute right-4 top-4 rounded-full border px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider",
                        "border-white/15 bg-white/[0.04] text-white/50"
                      )}
                    >
                      {tier.badge}
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="font-sans text-base font-semibold text-white">{tier.name}</div>
                    <p className="mt-1 text-xs text-white/50">{tier.tagline}</p>

                    <div className="mt-5 flex items-baseline gap-1">
                      {showPrice ? (
                        <>
                          <ShimmerPrice price={price} cycle={cycle} />
                          <span className="font-mono text-xs text-white/40">
                            /{cycle === "monthly" ? "mo" : cycle === "annual" ? "yr" : "once"}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-sm text-white/50">
                          Contact for perpetual
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      asChild
                      className={cn(
                        "mt-5 h-10 font-mono text-xs font-semibold uppercase tracking-wider",
                        isPro
                          ? "bg-emerald-400 text-[oklch(0.16_0.02_152)] hover:bg-emerald-300"
                          : "border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                      )}
                      variant={isPro ? "default" : "outline"}
                    >
                      <a href="#contact">
                        {tier.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>

                    <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-white/65">
                          <Check
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              isPro ? "text-emerald-400" : "text-white/40"
                            )}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardSpotlightWrapper>
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <div className="mx-auto mt-8 flex max-w-2xl items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
          <p className="text-xs leading-relaxed text-white/50">
            All tiers include the standalone Volatility Vince Telegram bot. Pro Trader and above
            add vol surfaces, Monte Carlo VaR, regime detection and forecasting. Desk / Prop Firm
            unlocks white-label, on-prem and the full ML stack. Prices in EUR, ex. VAT.
          </p>
        </div>
      </div>
    </section>
  );
}
