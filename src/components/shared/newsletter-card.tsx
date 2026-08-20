"use client";

import { useState, type FormEvent } from "react";
import { Send, Loader2, Check, X, Mail } from "lucide-react";

/**
 * Newsletter capture card for the CTA section.
 *
 * Posts to /api/newsletter with `{ email }`. The route stores subscribers in an
 * in-memory Set (no DB on Vercel Hobby). Renders three states: idle, loading,
 * and success / error.
 */

type Status = "idle" | "loading" | "success" | "error";

interface ApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as ApiResponse;

      if (json.ok) {
        setStatus("success");
        setMessage(json.message ?? "Subscribed!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again");
    }
  }

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.18_0.013_251)]/80 backdrop-blur-xl">
      {/* Subtle glows */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]"
        aria-hidden
      />

      <div className="relative grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Left — copy */}
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-2.5 py-0.5">
            <Mail className="h-3 w-3 text-emerald-400" />
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-emerald-300">
              weekly briefing
            </span>
          </div>
          <h3 className="mt-3 font-sans text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
            Get the Krupp Capital briefing
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
            Weekly quant signals, GEX updates and regime alerts — straight to
            your inbox. No spam.
          </p>
        </div>

        {/* Right — form / status */}
        <div className="min-w-0">
          {status === "success" ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[oklch(0.16_0.02_152)]">
                <Check className="h-4 w-4" strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold uppercase tracking-wider text-emerald-300">
                  Subscribed!
                </div>
                <div className="truncate font-mono text-[0.65rem] text-white/50">
                  {message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                }}
                className="ml-auto shrink-0 font-mono text-[0.6rem] uppercase tracking-wider text-white/40 transition-colors hover:text-white/70"
              >
                reset
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="trader@yourfund.com"
                    disabled={status === "loading"}
                    aria-label="Email address"
                    className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus:border-emerald-400/50 focus:outline-none disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="btn-ripple hover-magnetic inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 font-mono text-xs font-semibold uppercase tracking-wider text-[oklch(0.16_0.02_152)] transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Subscribe</span>
                    </>
                  )}
                </button>
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 font-mono text-[0.7rem] text-rose-400">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{message}</span>
                </div>
              )}

              <p className="font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
                We respect your inbox. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
