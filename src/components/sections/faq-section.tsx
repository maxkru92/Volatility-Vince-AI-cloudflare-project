"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="eyebrow">/faq · answered</div>
          <h2 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Questions, decoded.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-[oklch(0.20_0.014_252)]/60 transition-all duration-300",
                  isOpen
                    ? "border-emerald-400/25 bg-[oklch(0.22_0.015_253)]/70"
                    : "border-white/[0.06] hover:border-emerald-400/15 hover:bg-[oklch(0.21_0.015_253)]/65"
                )}
              >
                {/* Left border accent on hover / open */}
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full w-[2px] transition-all duration-300",
                    isOpen
                      ? "bg-emerald-400/60"
                      : "bg-transparent group-hover:bg-emerald-400/30"
                  )}
                  aria-hidden
                />

                {/* Question row */}
                <button
                  onClick={() => toggle(i)}
                  className="relative flex w-full items-start gap-3 px-5 py-4 text-left transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-emerald-400/70">
                    Q{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-sans text-sm font-medium text-white">
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mt-0.5 shrink-0"
                  >
                    <ChevronDown className="h-4 w-4 text-white/40 transition-colors group-hover:text-emerald-400/70" />
                  </motion.span>
                </button>

                {/* Answer with AnimatePresence height animation */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pl-12 text-sm leading-relaxed text-white/60">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
