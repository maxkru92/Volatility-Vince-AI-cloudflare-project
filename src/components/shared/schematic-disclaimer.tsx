"use client";

import { cn } from "@/lib/utils";

interface SchematicDisclaimerProps {
  /** Whether the data shown is live (affects the badge color/text). */
  live?: boolean;
  /** Data source label, e.g. "Deribit", "LSE", "Yahoo", "Demo". */
  source?: string;
  /** Optional extra note shown as a third element, e.g. "60s refresh". */
  note?: string;
  className?: string;
}

/**
 * Subtle, reusable English disclaimer shown under every visualization.
 *
 * Text: "Schematic representation — live data may differ visually."
 *
 * Also renders a tiny data-source badge: a pulsing emerald dot + label
 * when `live` is true, or a muted "DEMO" pill when false.
 */
export function SchematicDisclaimer({
  live = false,
  source,
  note,
  className,
}: SchematicDisclaimerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-white/[0.04] pt-2 mt-2",
        className
      )}
    >
      <p className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-white/25 leading-relaxed">
        Schematic representation — live data may differ visually.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {note && (
          <span className="hidden font-mono text-[0.5rem] uppercase tracking-wider text-white/20 sm:inline">
            {note}
          </span>
        )}
        {source && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider",
              live
                ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-300/80"
                : "border-white/10 bg-white/[0.02] text-white/30"
            )}
          >
            {live && (
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-live-pulse" />
            )}
            {live ? `LIVE · ${source}` : "DEMO"}
          </span>
        )}
      </div>
    </div>
  );
}
