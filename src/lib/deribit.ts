/**
 * Deribit public API client.
 * Server-side only. No API key required (all public endpoints).
 *
 * Provides:
 *  - Index prices (BTC, ETH)
 *  - Perpetual futures tickers (spot + 24h stats)
 *  - Full options chains with IV + BSM-computed Greeks
 */

import { blackScholes, yearsToExpiry, type OptionType } from "./bsm";
import type { NormalizedOption } from "./options-types";

const DERIBIT_BASE = "https://www.deribit.com/api/v2/public";

export type Coin = "BTC" | "ETH";

export type { NormalizedOption };

export interface DeribitOptionsResult {
  contracts: NormalizedOption[];
  spot: number;
  source: "deribit";
  coin: Coin;
  fetchedAt: string;
}

// ── Parse Deribit instrument_name: "BTC-28AUG26-59000-P" ────────────

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function parseInstrumentName(name: string): {
  coin: string;
  expiry: string;
  strike: number;
  type: OptionType;
} | null {
  const parts = name.split("-");
  if (parts.length !== 4) return null;
  const [coin, dateStr, strikeStr, typeStr] = parts;
  // dateStr like "28AUG26"
  const day = parseInt(dateStr.slice(0, 2), 10);
  const monStr = dateStr.slice(2, 5);
  const yr = parseInt(dateStr.slice(5, 7), 10);
  const mon = MONTHS[monStr];
  if (mon === undefined || isNaN(day) || isNaN(yr)) return null;
  const expiry = new Date(Date.UTC(2000 + yr, mon, day, 8, 0, 0)); // 08:00 UTC expiry
  const strike = parseFloat(strikeStr);
  const type: OptionType = typeStr === "C" ? "call" : "put";
  return { coin, expiry: expiry.toISOString(), strike, type };
}

// ── Fetch helpers ──────────────────────────────────────────────────

interface DeribitRpc<T> {
  jsonrpc: "2.0";
  result: T;
}

async function deribitGet<T>(path: string): Promise<T> {
  const url = `${DERIBIT_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Deribit HTTP ${res.status}`);
  const json = (await res.json()) as DeribitRpc<T>;
  return json.result;
}

// ── Public API ─────────────────────────────────────────────────────

/** Fetch the current index (spot) price for BTC or ETH. */
export async function fetchDeribitIndex(coin: Coin): Promise<number | null> {
  try {
    const r = await deribitGet<{ index_price: number }>(
      `/get_index_price?index_name=${coin.toLowerCase()}_usd`
    );
    return r.index_price ?? null;
  } catch {
    return null;
  }
}

export interface DeribitPerpResult {
  price: number;
  indexPrice: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  volumeUsd: number;
  markPrice: number;
}

/** Fetch perpetual futures ticker for BTC or ETH. */
export async function fetchDeribitPerp(coin: Coin): Promise<DeribitPerpResult | null> {
  try {
    interface PerpTicker {
      last_price: number;
      index_price: number;
      mark_price: number;
      stats: {
        high: number;
        low: number;
        price_change: number;
        volume_usd: number;
      };
    }
    const t = await deribitGet<PerpTicker>(`/ticker?instrument_name=${coin}-PERPETUAL`);
    return {
      price: t.last_price,
      indexPrice: t.index_price,
      changePct24h: t.stats.price_change,
      high24h: t.stats.high,
      low24h: t.stats.low,
      volumeUsd: t.stats.volume_usd,
      markPrice: t.mark_price,
    };
  } catch {
    return null;
  }
}

interface BookSummaryEntry {
  instrument_name: string;
  mark_iv: number;
  mark_price: number;
  underlying_price: number;
  open_interest: number;
  volume: number;
  volume_usd: number;
  bid_price: number | null;
  ask_price: number | null;
  mid_price: number | null;
}

/**
 * Fetch the full options chain for BTC or ETH with IV + BSM-computed Greeks.
 * Returns null on any failure (caller falls back).
 */
export async function fetchDeribitOptionsChain(
  coin: Coin
): Promise<DeribitOptionsResult | null> {
  try {
    const entries = await deribitGet<BookSummaryEntry[]>(
      `/get_book_summary_by_currency?currency=${coin}&kind=option`
    );
    if (!Array.isArray(entries) || entries.length === 0) return null;

    // Use the underlying_price from the first entry as spot (they're all ~same).
    const spot = entries[0].underlying_price;
    if (!spot || spot <= 0) return null;

    const RISK_FREE_RATE = 0.045;

    const contracts: NormalizedOption[] = [];
    for (const e of entries) {
      const parsed = parseInstrumentName(e.instrument_name);
      if (!parsed) continue;
      if (parsed.coin !== coin) continue;

      const iv = (e.mark_iv ?? 0) / 100; // Deribit IV is in %
      if (iv <= 0 || iv > 5) continue; // skip garbage / >500% IV

      const T = yearsToExpiry(parsed.expiry);
      const greeks = blackScholes(spot, parsed.strike, T, RISK_FREE_RATE, iv, parsed.type);

      contracts.push({
        symbol: e.instrument_name,
        strike: parsed.strike,
        expiry: parsed.expiry,
        type: parsed.type,
        iv,
        bid: e.bid_price,
        ask: e.ask_price,
        mid: e.mid_price,
        markPrice: e.mark_price,
        markPriceUsd: e.mark_price * spot,
        volume: e.volume ?? 0,
        volumeUsd: e.volume_usd ?? 0,
        openInterest: e.open_interest ?? 0,
        delta: greeks.delta,
        gamma: greeks.gamma,
        vega: greeks.vega,
        theta: greeks.theta,
        rho: greeks.rho,
        d1: greeks.d1,
        d2: greeks.d2,
        bsPrice: greeks.price,
      });
    }

    if (contracts.length === 0) return null;

    // Sort by expiry asc, then strike asc, then puts before calls
    contracts.sort((a, b) => {
      if (a.expiry !== b.expiry) return a.expiry.localeCompare(b.expiry);
      if (a.strike !== b.strike) return a.strike - b.strike;
      return a.type === "call" ? -1 : 1;
    });

    return {
      contracts,
      spot,
      source: "deribit",
      coin,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
