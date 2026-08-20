"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { commandGroups } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const TYPING_SPEED = 50; // ms per character
const OUTPUT_LINE_DELAY = 300; // ms between output lines
const PAUSE_AFTER_COMPLETE = 3000; // ms before looping

const command = "/report_premarket_us";
const outputLines = [
  { type: "output" as const, content: "▸ fetching futures, FX, earnings calendar…" },
  { type: "output" as const, content: "▸ computing GEX/DEX for SPX, NDX, RUT…" },
  { type: "output" as const, content: "▸ regime classification (HMM posterior)…" },
  { type: "success" as const, content: "✓ report generated · premarket_us_20260524.pdf · 2.1MB · 1.8s" },
];

type Phase = "typing" | "output" | "waiting";

function TerminalTypewriter() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [charIndex, setCharIndex] = useState(0);
  const [outputIndex, setOutputIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const reset = useCallback(() => {
    setPhase("typing");
    setCharIndex(0);
    setOutputIndex(0);
    setShowCursor(true);
  }, []);

  // Typing phase
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex < command.length) {
      const timer = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    } else {
      // Finished typing, brief pause then start output
      const timer = setTimeout(() => {
        setPhase("output");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, charIndex]);

  // Output phase
  useEffect(() => {
    if (phase !== "output") return;
    if (outputIndex < outputLines.length) {
      const timer = setTimeout(() => {
        setOutputIndex((prev) => prev + 1);
      }, OUTPUT_LINE_DELAY);
      return () => clearTimeout(timer);
    } else {
      // All output shown, wait then loop
      const timer = setTimeout(() => {
        setPhase("waiting");
      }, PAUSE_AFTER_COMPLETE);
      return () => clearTimeout(timer);
    }
  }, [phase, outputIndex]);

  // Waiting phase — reset
  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setTimeout(reset, 100);
    return () => clearTimeout(timer);
  }, [phase, reset]);

  const typedCommand = command.slice(0, charIndex);

  return (
    <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-white/40">
          vince@krupp-capital ~ session
        </span>
      </div>
      <div className="space-y-1 px-4 py-4 font-mono text-xs">
        {/* Typed command line */}
        <div className="text-white/45">
          <span className="text-emerald-400">vince</span>
          <span className="text-white/30">@</span>
          <span className="text-cyan-400">krupp</span>
          <span className="text-white/30">:~$</span>{" "}
          <span className="text-white/80">{typedCommand}</span>
          {(phase === "typing") && <span className="typewriter-cursor" />}
        </div>

        {/* Output lines */}
        {outputLines.slice(0, outputIndex).map((line, i) => (
          <div
            key={i}
            className={line.type === "success" ? "text-emerald-400" : "text-white/55"}
          >
            {line.type === "output" && <span className="text-amber-400">▸</span>}{" "}
            {line.type === "output" ? line.content.replace("▸ ", "") : line.content}
          </div>
        ))}

        {/* Final prompt line with cursor (after output is done) */}
        {phase === "output" && outputIndex >= outputLines.length && (
          <div className="text-white/45">
            <span className="text-emerald-400">vince</span>
            <span className="text-white/30">@</span>
            <span className="text-cyan-400">krupp</span>
            <span className="text-white/30">:~$</span>{" "}
            <span className="typewriter-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}

export function CommandsSection() {
  return (
    <section id="commands" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 bg-grid-fine mask-radial-fade opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">/commands · 100+ slash commands</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl text-reveal is-visible">
            Scriptable research,
            <span className="text-gradient-emerald"> one slash at a time.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Every analytics function is exposed as a deterministic slash command — ideal for
            power users who want repeatable, automatable workflows alongside natural-language
            chat.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {commandGroups.map((group, gi) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: gi * 0.06 }}
              className={`section-enter stagger-${Math.min(gi + 1, 5)} overflow-hidden rounded-xl border border-white/[0.06] bg-[oklch(0.20_0.014_252)]/60`}
            >
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                  {group.group}
                </span>
              </div>
              <div className="px-2 py-1.5">
                <div className="px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
                  {group.description}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {group.commands.map((c) => (
                    <li key={c.cmd}>
                      <div className="group flex items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-white/[0.03]">
                        <code className="shrink-0 font-mono text-[0.7rem] font-medium text-emerald-400">
                          {c.cmd}
                        </code>
                        <span className="text-[0.7rem] leading-relaxed text-white/45">
                          {c.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Terminal strip — typewriter */}
        <TerminalTypewriter />
      </div>
    </section>
  );
}
