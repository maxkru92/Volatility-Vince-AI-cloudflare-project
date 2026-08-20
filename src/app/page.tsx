import { SiteHeader } from "@/components/sections/site-header";
import { MatrixRain } from "@/components/shared/matrix-rain";
import { HeroSection } from "@/components/sections/hero-section";
import { TickerTape } from "@/components/sections/ticker-tape";
import { CryptoWidget } from "@/components/sections/crypto-widget";
import { OverviewSection } from "@/components/sections/overview-section";
import { CapabilitiesSection } from "@/components/sections/capabilities-section";
import { ChatDemoSection } from "@/components/sections/chat-demo-section";
import { GexSection } from "@/components/sections/gex-section";
import { GreeksCalculator } from "@/components/shared/greeks-calculator";
import { StrategyCalculator } from "@/components/shared/strategy-calculator";
import { CorrelationSection } from "@/components/sections/correlation-section";
import { RegimeSection } from "@/components/sections/regime-section";
import { ArchitectureSection } from "@/components/sections/architecture-section";
import { CommandsSection } from "@/components/sections/commands-section";
import { SuiteSection } from "@/components/sections/suite-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { SiteFooter } from "@/components/sections/site-footer";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-[0.9] motion-reduce:hidden">
          <MatrixRain />
        </div>
        <div className="absolute inset-0 bg-grid bg-grid-pulse opacity-100 [mask-image:linear-gradient(to_bottom,white_0%,white_92%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.06] via-transparent to-transparent" />
      </div>

      <SiteHeader />
      <main className="relative z-10 flex-1">
        <HeroSection />
        <TickerTape />
        <CryptoWidget />
        <OverviewSection />
        <div className="section-divider-gradient" />
        <CapabilitiesSection />
        <ChatDemoSection />
        <GexSection />
        <div className="section-divider-gradient" />
        <section id="greeks" className="relative py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="eyebrow">/greeks · pricing engine</div>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
                Price options with
                <span className="text-gradient-emerald"> 12 Greeks — live.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/60">
                Black-Scholes-Merton pricing with full Greeks suite. Adjust the
                inputs and watch Delta, Gamma, Vega, Theta and Rho update in
                real time — the same engine Volatility Vince runs in Telegram.
              </p>
            </div>
            <div className="mt-12">
              <GreeksCalculator />
            </div>
          </div>
        </section>
        <section id="strategy" className="relative py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="eyebrow">/strategy · options lab</div>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
                Model 15+ options strategies. See the
                <span className="text-gradient-emerald"> P&amp;L.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/60">
                Iron Condor, Butterfly, Straddle, Spreads and more — configure legs,
                visualize payoffs at expiry, and find breakevens in real time.
              </p>
            </div>
            <div className="mt-12">
              <StrategyCalculator />
            </div>
          </div>
        </section>
        <CorrelationSection />
        <div className="section-divider-gradient" />
        <RegimeSection />
        <ArchitectureSection />
        <CommandsSection />
        <SuiteSection />
        <div className="section-divider-gradient" />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
