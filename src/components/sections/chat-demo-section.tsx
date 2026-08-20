"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = {
  role: "user" | "bot";
  text: string;
  rich?: "gex" | "chart" | "greeks" | "regime" | "risk";
};

const suggestions = [
  "/gex SPX",
  "/chain NVDA",
  "/regime SPY",
  "/risk portfolio",
  "/setup_best",
];

const responses: Record<string, Msg> = {
  "/gex spx": {
    role: "bot",
    text: "Gamma Exposure — SPX (real-time)",
    rich: "gex",
  },
  "/chain nvda": {
    role: "bot",
    text: "Option chain · NVDA · front month",
    rich: "greeks",
  },
  "/regime spy": {
    role: "bot",
    text: "Market regime classification — SPY",
    rich: "regime",
  },
  "/risk portfolio": {
    role: "bot",
    text: "VKKM Aegis · Portfolio Risk Report",
    rich: "risk",
  },
  "/setup_best": {
    role: "bot",
    text: "Top ranked setups · today",
    rich: "chart",
  },
};

function RichGEX() {
  const strikes = [
    { k: "5750", gex: -1.24, type: "put wall" },
    { k: "5800", gex: -0.42, type: "gamma flip" },
    { k: "5850", gex: 0.88, type: "" },
    { k: "5900", gex: 1.42, type: "call wall" },
    { k: "5950", gex: 0.61, type: "" },
  ];
  const max = Math.max(...strikes.map((s) => Math.abs(s.gex)));
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
        <span>strike</span>
        <span>net GEX ($B)</span>
      </div>
      <div className="space-y-1.5">
        {strikes.map((s) => (
          <div key={s.k} className="flex items-center gap-2">
            <span className="w-12 font-mono text-xs text-white/70">{s.k}</span>
            <div className="relative h-4 flex-1">
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
              <div
                className={cn(
                  "absolute top-0 h-full rounded-sm",
                  s.gex >= 0 ? "left-1/2 bg-emerald-400/70" : "right-1/2 bg-rose-400/70"
                )}
                style={{ width: `${(Math.abs(s.gex) / max) * 48}%` }}
              />
            </div>
            <span
              className={cn(
                "numeric w-12 text-right font-mono text-xs",
                s.gex >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {s.gex >= 0 ? "+" : ""}
              {s.gex.toFixed(2)}
            </span>
            {s.type && (
              <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider text-amber-400">
                {s.type}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-2 font-mono text-[0.6rem]">
        <div>
          <div className="text-white/35">net gex</div>
          <div className="text-emerald-400">+1.84B</div>
        </div>
        <div>
          <div className="text-white/35">flip</div>
          <div className="text-amber-400">5,812</div>
        </div>
        <div>
          <div className="text-white/35">max pain</div>
          <div className="text-rose-400">5,775</div>
        </div>
      </div>
    </div>
  );
}

function RichGreeks() {
  const rows = [
    { k: "130C", iv: "48.2", delta: "0.71", gamma: "0.014", theta: "-0.18", vega: "0.22" },
    { k: "135C", iv: "46.8", delta: "0.58", gamma: "0.016", theta: "-0.21", vega: "0.24" },
    { k: "140C", iv: "45.5", delta: "0.44", gamma: "0.017", theta: "-0.23", vega: "0.25" },
    { k: "145C", iv: "44.7", delta: "0.31", gamma: "0.015", theta: "-0.22", vega: "0.23" },
  ];
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <div className="grid grid-cols-6 gap-px bg-white/[0.06] px-2 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
        <span>strike</span>
        <span>IV%</span>
        <span>Δ</span>
        <span>Γ</span>
        <span>Θ</span>
        <span>ν</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.k}
          className="grid grid-cols-6 gap-px border-t border-white/[0.04] px-2 py-1.5 font-mono text-[0.7rem] numeric"
        >
          <span className="text-white/80">{r.k}</span>
          <span className="text-amber-400">{r.iv}</span>
          <span className="text-emerald-400">{r.delta}</span>
          <span className="text-violet-400">{r.gamma}</span>
          <span className="text-rose-400">{r.theta}</span>
          <span className="text-cyan-400">{r.vega}</span>
        </div>
      ))}
    </div>
  );
}

function RichRegime() {
  const regimes = [
    { name: "Low-Vol Trend", p: 0.62, color: "bg-emerald-400" },
    { name: "High-Vol Trend", p: 0.21, color: "bg-amber-400" },
    { name: "Mean-Revert", p: 0.12, color: "bg-cyan-400" },
    { name: "Regime Break", p: 0.05, color: "bg-rose-400" },
  ];
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
        HMM posterior probabilities
      </div>
      <div className="space-y-2">
        {regimes.map((r) => (
          <div key={r.name}>
            <div className="flex items-center justify-between font-mono text-[0.65rem]">
              <span className="text-white/70">{r.name}</span>
              <span className="numeric text-white/55">{(r.p * 100).toFixed(0)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={cn("h-full rounded-full", r.color)}
                style={{ width: `${r.p * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-white/[0.06] pt-2 font-mono text-[0.6rem] text-white/45">
        <span className="text-emerald-400">→ Active:</span> Low-Vol Trend · vol regime stable
      </div>
    </div>
  );
}

function RichRisk() {
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-rose-400/20 bg-rose-400/[0.05] p-2">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-rose-400/80">
            1-day VaR (95%)
          </div>
          <div className="numeric mt-1 font-mono text-lg font-semibold text-rose-400">
            −$4,182
          </div>
          <div className="font-mono text-[0.55rem] text-white/40">parametric</div>
        </div>
        <div className="rounded border border-amber-400/20 bg-amber-400/[0.05] p-2">
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-amber-400/80">
            CVaR (95%)
          </div>
          <div className="numeric mt-1 font-mono text-lg font-semibold text-amber-400">
            −$6,941
          </div>
          <div className="font-mono text-[0.55rem] text-white/40">expected shortfall</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-2 font-mono text-[0.6rem]">
        <div>
          <div className="text-white/35">MC paths</div>
          <div className="text-violet-400">1,000,000</div>
        </div>
        <div>
          <div className="text-white/35">sharpe</div>
          <div className="text-emerald-400">1.84</div>
        </div>
        <div>
          <div className="text-white/35">max DD</div>
          <div className="text-rose-400">−12.4%</div>
        </div>
      </div>
    </div>
  );
}

function RichChart() {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const r = ((i * 9301 + 49297) % 233280) / 233280;
    return 50 + Math.sin(i / 3) * 12 + r * 14;
  });
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * 280;
      const y = 60 - ((p - min) / range) * 50 - 5;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-1 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
        <span>SPY · 1D · setup score 8.4/10</span>
        <span className="text-emerald-400">long bias</span>
      </div>
      <svg viewBox="0 0 280 60" className="w-full">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L280,60 L0,60 Z`} fill="url(#sg)" />
        <path d={path} fill="none" stroke="#34d399" strokeWidth="1.5" />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[0.6rem]">
        <div>
          <div className="text-white/35">entry</div>
          <div className="text-emerald-400">584.20</div>
        </div>
        <div>
          <div className="text-white/35">target</div>
          <div className="text-cyan-400">591.50</div>
        </div>
        <div>
          <div className="text-white/35">stop</div>
          <div className="text-rose-400">581.80</div>
        </div>
      </div>
    </div>
  );
}

function RichBlock({ kind }: { kind: NonNullable<Msg["rich"]> }) {
  if (kind === "gex") return <RichGEX />;
  if (kind === "greeks") return <RichGreeks />;
  if (kind === "regime") return <RichRegime />;
  if (kind === "risk") return <RichRisk />;
  return <RichChart />;
}

export function ChatDemoSection() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Volatility Vince online · 18 submodules ready · type a command or ask in natural language.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      const key = text.toLowerCase();
      const reply =
        responses[key] ||
        ({
          role: "bot",
          text: `Analyzing "${text}"… use commands like /gex, /chain, /regime, /risk, /setup_best for structured output.`,
        } as Msg);
      setTyping(false);
      setMessages((m) => [...m, reply]);
    }, 950);
  };

  return (
    <section id="demo" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid-fine mask-radial-fade opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Copy */}
          <div>
            <div className="eyebrow">/demo · live preview</div>
            <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Talk to Vince.
              <br />
              <span className="text-gradient-emerald">Get institutional output.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60">
              No dashboards to learn. No terminals to license. Just message Volatility Vince in
              Telegram — in plain English or with slash commands — and receive structured,
              board-ready analysis in under two seconds.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { k: "Natural language", v: "Ask “what's the GEX flip on SPX?” — Vince parses and answers." },
                { k: "Slash commands", v: "100+ commands for deterministic, scriptable research." },
                { k: "Rich renders", v: "GEX profiles, Greek tables, regime posters, VaR cards — inline." },
              ].map((row) => (
                <div key={row.k} className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <div className="font-mono text-xs uppercase tracking-wider text-emerald-400">
                      {row.k}
                    </div>
                    <div className="text-sm text-white/60">{row.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="border-glow rounded-2xl bg-[oklch(0.20_0.014_252)]/80 backdrop-blur-xl">
            {/* Telegram-like header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500">
                  <Bot className="h-5 w-5 text-[oklch(0.16_0.02_152)]" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[oklch(0.20_0.014_252)] bg-emerald-400" />
                </div>
                <div>
                  <div className="font-sans text-sm font-semibold text-white">
                    Volatility Vince
                  </div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-wider text-emerald-400/80">
                    online · quant engine ready
                  </div>
                </div>
              </div>
              <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
                telegram
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="scroll-quant h-[420px] space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2.5",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      m.role === "user"
                        ? "bg-white/10"
                        : "bg-gradient-to-br from-emerald-400 to-cyan-500"
                    )}
                  >
                    {m.role === "user" ? (
                      <User className="h-3.5 w-3.5 text-white/70" />
                    ) : (
                      <Bot className="h-4 w-4 text-[oklch(0.16_0.02_152)]" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5",
                      m.role === "user"
                        ? "rounded-tr-sm bg-emerald-400/15 text-white"
                        : "rounded-tl-sm bg-white/[0.05] text-white/85"
                    )}
                  >
                    <div className="font-mono text-sm">{m.text}</div>
                    {m.rich && <RichBlock kind={m.rich} />}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500">
                    <Bot className="h-4 w-4 text-[oklch(0.16_0.02_152)]" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white/[0.05] px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-white/40"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-4 py-2.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[0.65rem] text-white/60 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/[0.08] hover:text-emerald-300"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Volatility Vince…  (try /gex SPX)"
                className="terminal-cursor flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
              />
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400 text-[oklch(0.16_0.02_152)] transition-colors hover:bg-emerald-300"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
