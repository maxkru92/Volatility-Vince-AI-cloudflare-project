"use client";

import { useEffect, useState } from "react";
import { Menu, X, TrendingUp, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navLinks, site } from "@/lib/site-data";
import { MarketStatus } from "@/components/shared/market-status";
import { MarketClock } from "@/components/shared/market-clock";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    navLinks.forEach((l) => {
      const el = document.querySelector(l.href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-[oklch(0.16_0.012_250)]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#top" className="group flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/[0.08]">
            <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[0.95rem] font-semibold tracking-tight text-white">
              {site.brand}
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/40">
              by {site.parentOrg}
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "hover-magnetic rounded-md px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider",
                activeSection === link.href.slice(1)
                  ? "text-emerald-400"
                  : "text-white/55 hover:text-white"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <MarketClock />
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("vince:open-command-palette")
              )
            }
            aria-label="Open command palette (Cmd+K)"
            title="Open command palette · ⌘K"
            className="hidden h-8 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 font-mono text-[0.6rem] uppercase tracking-wider text-white/55 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/[0.06] hover:text-emerald-300 xl:inline-flex"
          >
            <Command className="h-3 w-3" />
            <span>⌘K</span>
          </button>
          <MarketStatus />
          <Button
            size="sm"
            asChild
            className="bg-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider text-[oklch(0.16_0.02_152)] hover:bg-emerald-300"
          >
            <a href="#pricing">
              Get Access
            </a>
          </Button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/70 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[oklch(0.16_0.012_250)]/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wider text-white/70 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
