/**
 * Shared option-chain types — server + client safe.
 *
 * Used by /api/options, src/lib/deribit.ts, src/lib/lse.ts, and the
 * greeks/strategy/vol-surface/GEX visualizations on the client.
 *
 * This is the SINGLE source of truth for NormalizedOption. All providers
 * (Deribit, LSE, synthetic fallback) MUST produce this shape.
 */

import type { OptionType } from "@/lib/bsm";

export type OptionSource = "deribit" | "lse" | "fallback";

/** A single normalized option contract, regardless of upstream provider. */
export interface NormalizedOption {
  symbol: string;          // instrument name or synthetic ID
  strike: number;
  expiry: string;          // ISO date string
  type: OptionType;        // call | put
  iv: number;              // implied vol, decimal (0.42 = 42%)
  bid: number | null;      // USD (or coin for Deribit — see markPriceUsd)
  ask: number | null;
  mid: number | null;
  markPrice: number;       // mark price (coin for Deribit, USD for LSE)
  markPriceUsd: number;    // mark price in USD
  volume: number;
  volumeUsd: number;
  openInterest: number;
  // BSM-computed Greeks (computed from iv + spot + T + r)
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  d1: number;
  d2: number;
  bsPrice: number;
}

/** Unified response shape returned by GET /api/options?symbol=... */
export interface OptionsResponse {
  symbol: string;
  live: boolean;
  source: OptionSource;
  spot: number;
  contracts: NormalizedOption[];
  expiries: string[];      // sorted unique expiry ISO strings
  strikes: number[];       // sorted unique strikes
  fetchedAt: string;
  ttl: number;             // cache TTL in ms
  /** Optional message — e.g. "LSE quota exceeded, using synthetic" */
  note?: string;
}

/** Parse a Deribit-style instrument name "BTC-28AUG26-59000-P" into parts. */
export function parseDeribitInstrumentName(name: string): {
  coin: string;
  expiry: Date | null;
  strike: number;
  type: OptionType;
} | null {
  const parts = name.split("-");
  if (parts.length !== 4) return null;
  const [coin, dateStr, strikeStr, typeChar] = parts;
  const strike = parseFloat(strikeStr);
  if (!Number.isFinite(strike)) return null;
  let type: OptionType;
  if (typeChar === "C") type = "call";
  else if (typeChar === "P") type = "put";
  else return null;

  const m = /^(\d{1,2})([A-Z]{3})(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monthStr = m[2];
  const yearShort = parseInt(m[3], 10);
  const MONTHS: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };
  const month = MONTHS[monthStr];
  if (month === undefined) return null;
  const year = 2000 + yearShort;
  const expiry = new Date(Date.UTC(year, month, day, 8, 0, 0));
  if (isNaN(expiry.getTime())) return null;
  return { coin, expiry, strike, type };
}
