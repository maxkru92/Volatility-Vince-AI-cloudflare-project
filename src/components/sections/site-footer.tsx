"use client";

import { TrendingUp, Mail, Send } from "lucide-react";
import { site, navLinks } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="bg-noise relative mt-auto border-t border-white/[0.06] bg-[oklch(0.16_0.012_250)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/[0.08]">
                <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-mono text-sm font-semibold text-white">{site.brand}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/40">
                  by {site.parentOrg}
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/45">
              Institutional Quant Intelligence Telegram Chatbot — Module 03 of the{" "}
              {site.parentSuite}. Hedgefund-grade analysis for retail traders.
            </p>
            <div className="mt-4 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wider text-white/35">
              <span className="rounded border border-emerald-400/30 bg-emerald-400/[0.06] px-1.5 py-0.5 text-emerald-400">
                {site.status}
              </span>
              <span>{site.language}</span>
              <span>·</span>
              <span>{site.api}</span>
            </div>
          </div>

          {/* Nav */}
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
              Navigate
            </div>
            <ul className="mt-3 space-y-2">
              {navLinks.slice(0, 5).map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="font-mono text-xs text-white/55 transition-colors hover:text-emerald-400"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
              Resources
            </div>
            <ul className="mt-3 space-y-2">
              {navLinks.slice(5).map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="font-mono text-xs text-white/55 transition-colors hover:text-emerald-400"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="font-mono text-xs text-white/55 transition-colors hover:text-emerald-400"
                >
                  Request Access
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
              Contact
            </div>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="group flex items-center gap-2 font-mono text-xs text-white/55 hover:text-emerald-400"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              </li>
              <li className="flex items-center gap-2 font-mono text-xs text-white/55">
                <Send className="h-3.5 w-3.5" />
                Telegram
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
            © {new Date().getFullYear()} {site.parentOrg} · {site.brand} · MIT License
          </div>
          <div className="flex items-center gap-4 font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
            <span>crafted by {site.parentOrg}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              all systems operational
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3">
          <p className="font-mono text-[0.55rem] leading-relaxed text-white/30">
            DISCLAIMER — Volatility Vince and the Krupp Capital Trading Suite are analytical
            software tools, not investment advice. All outputs are for research and educational
            purposes. Markets carry risk; past performance does not guarantee future results.
            Always do your own due diligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
