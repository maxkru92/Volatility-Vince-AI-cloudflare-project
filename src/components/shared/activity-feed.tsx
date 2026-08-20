"use client";

import { motion } from "framer-motion";
import {
  Terminal,
  TrendingUp,
  AlertCircle,
  Activity,
  Zap,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Live Telegram activity feed widget.
 *
 * Renders a deterministic list of recent Volatility Vince users, the slash
 * command they ran, a short result line, and a relative timestamp. The first
 * row is highlighted with a subtle emerald "new message" pulse keyframe to
 * simulate real-time activity.
 *
 * Visible on `lg+` only — kept off mobile to avoid cluttering the hero.
 */

type Accent = "emerald" | "cyan" | "amber" | "rose" | "violet";

interface FeedRow {
  handle: string;
  command: string;
  result: string;
  timestamp: string;
  icon: LucideIcon;
  accent: Accent;
}

const FEED: FeedRow[] = [
  {
    handle: "@quant_trader_91",
    command: "/gex SPX",
    result: "Gamma Flip: 5,812 · Max Pain: 5,775",
    timestamp: "2m ago",
    icon: Zap,
    accent: "emerald",
  },
  {
    handle: "@OPTIONS_FLOW_NYC",
    command: "/quote NVDA",
    result: "NVDA 138.41 ▲ +2.18% · IV 48.2",
    timestamp: "14m ago",
    icon: TrendingUp,
    accent: "cyan",
  },
  {
    handle: "@vol_desk_ldn",
    command: "/iv_rank AAPL",
    result: "IV Rank: 67/100 (84th pct)",
    timestamp: "1h ago",
    icon: Activity,
    accent: "amber",
  },
  {
    handle: "@voltrader_berlin",
    command: "/surface NDX",
    result: "SABR calibrated · R²=0.997",
    timestamp: "3h ago",
    icon: Terminal,
    accent: "violet",
  },
  {
    handle: "@tail_hedge_401k",
    command: "/setup_best",
    result: "Top setup: Bull Call Spread on SPY",
    timestamp: "7h ago",
    icon: ShieldCheck,
    accent: "emerald",
  },
  {
    handle: "@derivatives_desk",
    command: "/alert_iv TSLA 80",
    result: "Alert set · IV>80 trigger armed",
    timestamp: "12h ago",
    icon: AlertCircle,
    accent: "rose",
  },
];

const ACCENT_COLOR: Record<Accent, string> = {
  emerald: "text-emerald-400",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  violet: "text-violet-400",
};

const ACCENT_BG: Record<Accent, string> = {
  emerald: "bg-emerald-400/10 border-emerald-400/20",
  cyan: "bg-cyan-400/10 border-cyan-400/20",
  amber: "bg-amber-400/10 border-amber-400/20",
  rose: "bg-rose-400/10 border-rose-400/20",
  violet: "bg-violet-400/10 border-violet-400/20",
};

export function ActivityFeed() {
  return (
    <div className="bg-noise border-glow border-gradient relative w-full max-w-sm rounded-2xl bg-[oklch(0.20_0.014_252)]/80 backdrop-blur-xl">
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-1 truncate font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/45">
            vince · live activity · last 24h
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
          live
        </span>
      </div>

      {/* Feed body */}
      <div className="scroll-quant max-h-[22rem] overflow-y-auto p-2">
        <ul className="space-y-1">
          {FEED.map((row, i) => {
            const Icon = row.icon;
            const isFirst = i === 0;
            return (
              <motion.li
                key={`${row.handle}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                className={`feed-row-new relative flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.03] ${
                  isFirst ? "is-new" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${ACCENT_BG[row.accent]}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${ACCENT_COLOR[row.accent]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[0.7rem] font-medium text-white/80">
                      {row.handle}
                    </span>
                    <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-wider text-white/30">
                      {row.timestamp}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 truncate font-mono text-[0.68rem] ${ACCENT_COLOR[row.accent]}`}
                  >
                    {row.command}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[0.62rem] leading-relaxed text-white/45">
                    {row.result}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-2">
        <div className="flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wider text-white/30">
          <span>247 signals today</span>
          <span className="text-emerald-400/70">+12.4% wow</span>
        </div>
      </div>
    </div>
  );
}
