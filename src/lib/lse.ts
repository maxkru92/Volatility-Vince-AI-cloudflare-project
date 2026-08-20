/**
 * London Strategic Edge (LSE) API client.
 * Server-side only. API key passed via x-api-key header.
 *
 * Provides:
 *  - Options chains (with IV + greeks from LSE's own pricing models)
 *  - Quote (via options chain underlying_price or macro series)
 *
 * ⚠️ The API key has a rolling 7-day weekly usage limit. When the limit
 * is hit, the API returns HTTP 429. All functions return null on any
 * error so callers fall back to the next provider in the chain.
 */

import { blackScholes, yearsToExpiry, type OptionType } from "./bsm";
import type { NormalizedOption } from "./options-types";

const LSE_BASE = "https://api.londonstrategicedge.com";
const LSE_API_KEY = process.env.LSE_API_KEY?.trim();

export interface LseOptionsResult {
  contracts: NormalizedOption[];
  spot: number;
  source: "lse";
  underlying: string;
  fetchedAt: string;
}

// ── Fetch helpers ──────────────────────────────────────────────────

interface LseChainResponse {
  underlying?: string;
  spot_price?: number;
  underlying_price?: number;
  contracts?: LseRawContract[];
  chain?: LseRawContract[];
  data?: LseRawContract[];
  // LSE may nest under a different key — we try several.
}

interface LseRawContract {
  symbol?: string;
  contract?: string;
  instrument?: string;
  strike?: number;
  K?: number;
  expiry?: string;
  expiration?: string;
  exp?: string;
  type?: string;
  option_type?: string;
  cp?: string;
  iv?: number;
  implied_vol?: number;
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  bid?: number;
  ask?: number;
  mid?: number;
  mark?: number;
  last?: number;
  volume?: number;
  open_interest?: number;
  oi?: number;
}

function pick<T>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

async function lseGet<T>(path: string): Promise<T> {
  if (!LSE_API_KEY) throw new Error("LSE_API_KEY is not configured");

  const url = `${LSE_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": LSE_API_KEY,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    throw new Error(`LSE HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Fetch an options chain for an equity underlying from LSE.
 * Returns null on any error (429 quota, network, parse) so caller falls back.
 */
export async function fetchLseOptionsChain(
  underlying: string,
  opts?: { type?: "call" | "put"; maxDte?: number }
): Promise<LseOptionsResult | null> {
  try {
    const params = new URLSearchParams({
      underlying: underlying.toUpperCase(),
    });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.maxDte) params.set("max_dte", String(opts.maxDte));

    const raw = await lseGet<LseChainResponse | LseRawContract[]>(
      `/vault/options/chain?${params.toString()}`
    );

    // Normalize: response could be an array, or an object with contracts/chain/data
    let rawContracts: LseRawContract[] = [];
    let spot = 0;
    let sym = underlying.toUpperCase();

    if (Array.isArray(raw)) {
      rawContracts = raw;
    } else if (raw.contracts) {
      rawContracts = raw.contracts;
      spot = raw.spot_price ?? raw.underlying_price ?? 0;
      sym = raw.underlying ?? sym;
    } else if (raw.chain) {
      rawContracts = raw.chain;
      spot = raw.spot_price ?? raw.underlying_price ?? 0;
    } else if (raw.data) {
      rawContracts = raw.data;
      spot = raw.spot_price ?? raw.underlying_price ?? 0;
    }

    if (rawContracts.length === 0) return null;

    const RISK_FREE_RATE = 0.045;
    const contracts: NormalizedOption[] = [];

    for (const rc of rawContracts) {
      const r = rc as Record<string, unknown>;
      const strike = pick<number>(r, ["strike", "K"]);
      const expiryRaw = pick<string>(r, ["expiry", "expiration", "exp"]);
      const typeRaw = pick<string>(r, ["type", "option_type", "cp"]);
      const iv = pick<number>(r, ["iv", "implied_vol", "implied_volatility"]);

      if (strike === undefined || !expiryRaw || iv === undefined) continue;

      let expiryIso: string;
      try {
        expiryIso = new Date(expiryRaw).toISOString();
      } catch {
        continue;
      }
      if (isNaN(new Date(expiryIso).getTime())) continue;

      const type: OptionType =
        (typeRaw ?? "").toLowerCase().startsWith("p") ? "put" : "call";

      const safeIv = Math.max(iv, 0.001);
      const T = yearsToExpiry(expiryIso);
      // If we don't have spot yet, we'll use a fallback (100) — greeks still compute.
      const S = spot > 0 ? spot : 100;
      const greeks = blackScholes(S, strike, T, RISK_FREE_RATE, safeIv, type);

      const mark =
        pick<number>(r, ["mark", "mid", "last"]) ??
        greeks.price;

      contracts.push({
        symbol: pick<string>(r, ["symbol", "contract", "instrument"]) ?? `${sym}-${strike}-${type}`,
        strike,
        expiry: expiryIso,
        type,
        iv: safeIv,
        bid: pick<number>(r, ["bid"]) ?? null,
        ask: pick<number>(r, ["ask"]) ?? null,
        mid: pick<number>(r, ["mid"]) ?? null,
        markPrice: mark,
        markPriceUsd: mark,
        volume: pick<number>(r, ["volume"]) ?? 0,
        volumeUsd: pick<number>(r, ["volume"]) ?? 0,
        openInterest: pick<number>(r, ["open_interest", "oi"]) ?? 0,
        delta: pick<number>(r, ["delta"]) ?? greeks.delta,
        gamma: pick<number>(r, ["gamma"]) ?? greeks.gamma,
        vega: pick<number>(r, ["vega"]) ?? greeks.vega,
        theta: pick<number>(r, ["theta"]) ?? greeks.theta,
        rho: pick<number>(r, ["rho"]) ?? greeks.rho,
        d1: greeks.d1,
        d2: greeks.d2,
        bsPrice: greeks.price,
      });
    }

    if (contracts.length === 0) return null;

    // If spot wasn't in the response, derive from ATM call/put
    if (spot <= 0) {
      const atm = contracts.reduce((best, c) =>
        Math.abs(c.strike - 100) < Math.abs(best.strike - 100) ? c : best
      );
      spot = atm.strike; // rough
    }

    return {
      contracts,
      spot,
      source: "lse",
      underlying: sym,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a live quote for an equity. Tries the options chain endpoint's
 * underlying_price first; falls back to null.
 */
export async function fetchLseQuote(symbol: string): Promise<{ price: number; source: "lse" } | null> {
  try {
    const chain = await fetchLseOptionsChain(symbol, { maxDte: 7 });
    if (chain && chain.spot > 0) {
      return { price: chain.spot, source: "lse" };
    }
    return null;
  } catch {
    return null;
  }
}
