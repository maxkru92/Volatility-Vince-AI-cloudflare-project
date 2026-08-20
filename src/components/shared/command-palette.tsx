"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Command as CommandPrimitive,
} from "cmdk";
import {
  LayoutDashboard,
  Layers,
  Terminal,
  Activity,
  Sigma,
  Cpu,
  MessageSquare,
  Boxes,
  Tag,
  HelpCircle,
  Mail,
  ArrowUp,
  Play,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site-data";

/**
 * Command Palette — Cmd/Ctrl+K overlay for fast navigation + actions.
 *
 * Built on the shadcn `Command` primitives (cmdk) wrapped in a custom Dialog
 * overlay so we can fully control the institutional dark styling (emerald
 * left-border highlight on the selected row, mono type, low-opacity panel).
 *
 * Behaviour:
 *   - Global keydown listener on `window` for (metaKey || ctrlKey) + "k".
 *     preventDefault stops the browser's native "search" binding.
 *   - Escape closes the palette (handled by Radix Dialog). Click outside also
 *     closes (Radix overlay click).
 *   - Arrow keys + Enter handled natively by cmdk (selection + onSelect).
 *   - Filter is a case-insensitive substring match across label + section,
 *     per the task spec.
 *
 * The listener is registered on `window` (not on a specific element) so the
 * palette opens even when focus is inside a form input — but Escape still
 * only closes the palette (Radix consumes it), so the previously-focused
 * input is not blurred by the palette.
 */

type CommandAction = () => void | Promise<void>;

type CommandEntry = {
  id: string;
  label: string;
  section: string;
  icon: LucideIcon;
  hint?: string;
  keywords?: string;
  run: CommandAction;
};

function scrollToAnchor(target: string) {
  const el = document.querySelector(target);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToAnchorAndClick(target: string, buttonText: string) {
  const el = document.querySelector(target);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Wait for the smooth-scroll to begin, then locate the matching button by
  // trimmed textContent and click it programmatically.
  window.setTimeout(() => {
    const root = document.querySelector(target);
    if (!root) return;
    const buttons = root.querySelectorAll("button");
    for (const b of buttons) {
      if (b.textContent?.trim() === buttonText) {
        (b as HTMLButtonElement).click();
        return;
      }
    }
  }, 480);
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Global Cmd/Ctrl+K toggle, plus a custom-event hook so the header's "⌘K"
  // hint button can open the palette without prop-drilling or shared state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("vince:open-command-palette", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("vince:open-command-palette", onCustom);
    };
  }, []);

  // Reset the search field each time the palette closes — clean slate on next open.
  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => setQuery(""), 150);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const commands: CommandEntry[] = useMemo(
    () => [
      // --- Navigation ---
      { id: "nav-overview", label: "Overview", section: "Navigate", icon: LayoutDashboard, run: () => { scrollToAnchor("#overview"); close(); } },
      { id: "nav-capabilities", label: "Capabilities", section: "Navigate", icon: Layers, run: () => { scrollToAnchor("#capabilities"); close(); } },
      { id: "nav-demo", label: "Live Demo", section: "Navigate", icon: Terminal, run: () => { scrollToAnchor("#demo"); close(); } },
      { id: "nav-gex", label: "GEX Engine", section: "Navigate", icon: Activity, run: () => { scrollToAnchor("#gex"); close(); } },
      { id: "nav-greeks", label: "Greeks", section: "Navigate", icon: Sigma, hint: "#demo", run: () => { scrollToAnchor("#demo"); close(); } },
      { id: "nav-architecture", label: "Architecture", section: "Navigate", icon: Cpu, run: () => { scrollToAnchor("#architecture"); close(); } },
      { id: "nav-commands", label: "Commands", section: "Navigate", icon: MessageSquare, run: () => { scrollToAnchor("#commands"); close(); } },
      { id: "nav-suite", label: "The Suite", section: "Navigate", icon: Boxes, run: () => { scrollToAnchor("#suite"); close(); } },
      { id: "nav-pricing", label: "Pricing", section: "Navigate", icon: Tag, run: () => { scrollToAnchor("#pricing"); close(); } },
      { id: "nav-faq", label: "FAQ", section: "Navigate", icon: HelpCircle, run: () => { scrollToAnchor("#faq"); close(); } },
      { id: "nav-contact", label: "Contact", section: "Navigate", icon: Mail, run: () => { scrollToAnchor("#contact"); close(); } },

      // --- Actions ---
      { id: "act-gex-spx", label: "Try /gex SPX", section: "Actions", icon: Play, hint: "#demo", run: () => { scrollToAnchorAndClick("#demo", "/gex SPX"); close(); } },
      { id: "act-monte-carlo", label: "Run Monte Carlo", section: "Actions", icon: Activity, hint: "#gex", run: () => { scrollToAnchor("#gex"); close(); } },
      { id: "act-pricing", label: "View Pricing", section: "Actions", icon: Tag, hint: "#pricing", run: () => { scrollToAnchor("#pricing"); close(); } },
      {
        id: "act-email",
        label: "Email Krupp Capital",
        section: "Actions",
        icon: Mail,
        keywords: "email contact maxkrupp gmail",
        run: () => {
          window.location.href = `mailto:${site.contactEmail}`;
          close();
        },
      },

      // --- Info / theme ---
      { id: "info-top", label: "Back to top", section: "Info", icon: ArrowUp, hint: "↑", run: () => { window.scrollTo({ top: 0, behavior: "smooth" }); close(); } },
    ],
    [close]
  );

  // Case-insensitive substring match across label + section + keywords.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const haystack = `${c.label} ${c.section} ${c.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, commands]);

  const sections = useMemo(() => {
    const order = ["Navigate", "Actions", "Info"];
    return order
      .map((name) => ({
        name,
        items: filtered.filter((c) => c.section === name),
      }))
      .filter((s) => s.items.length > 0);
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[600px] gap-0 overflow-hidden rounded-xl border-white/10 bg-[oklch(0.18_0.012_252)]/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[600px]"
        onOpenAutoFocus={(e) => {
          // cmdk manages its own focus; suppress Dialog's auto-focus to avoid a double focus jump.
          e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">Volatility Vince Command Palette</DialogTitle>
        <CommandPrimitive
          className="flex h-full w-full flex-col overflow-hidden"
          shouldFilter={false}
        >
          {/* Search input */}
          <div className="flex h-14 items-center gap-3 border-b border-white/[0.08] px-4">
            <Search className="h-4 w-4 shrink-0 text-emerald-400/70" />
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              autoFocus
              placeholder="Search commands or jump to section…"
              className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/40 sm:inline-block">
              Esc
            </kbd>
          </div>

          {/* Filtered list */}
          <CommandPrimitive.List className="max-h-80 overflow-y-auto overflow-x-hidden scroll-quant p-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center font-mono text-xs text-white/40">
                No commands match &ldquo;{query}&rdquo;.
              </div>
            ) : (
              sections.map((section, sIdx) => (
                <CommandPrimitive.Group
                  key={section.name}
                  heading={section.name.toUpperCase()}
                  className="overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.55rem] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-white/35"
                >
                  {sIdx > 0 && (
                    <div className="my-1 h-px bg-white/[0.06]" aria-hidden />
                  )}
                  {section.items.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <CommandPrimitive.Item
                        key={cmd.id}
                        value={cmd.id}
                        onSelect={() => {
                          void cmd.run();
                        }}
                        className={cn(
                          "group relative flex cursor-pointer items-center gap-3 rounded-md border-l-2 border-transparent px-2.5 py-2 font-mono text-sm text-white/80 outline-none",
                          "data-[selected=true]:border-l-emerald-400 data-[selected=true]:bg-emerald-400/[0.06] data-[selected=true]:text-emerald-100",
                          "transition-colors duration-100"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-white/45 group-data-[selected=true]:text-emerald-400" />
                        <span className="flex-1 truncate">{cmd.label}</span>
                        {cmd.hint && (
                          <span className="shrink-0 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/40 group-data-[selected=true]:border-emerald-400/30 group-data-[selected=true]:text-emerald-300/80">
                            {cmd.hint}
                          </span>
                        )}
                        <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-wider text-white/30 group-data-[selected=true]:text-emerald-300/60">
                          {cmd.section}
                        </span>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              ))
            )}
          </CommandPrimitive.List>

          {/* Footer hint strip */}
          <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-white/35">
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5">↑</kbd>
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5">↵</kbd>
              <span>to run</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5">Esc</kbd>
              <span>to close</span>
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
