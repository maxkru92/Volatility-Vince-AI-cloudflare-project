import { NextResponse } from "next/server";
import { fetchDeribitOptionsChain, fetchDeribitIndex, type Coin } from "@/lib/deribit";
import { fetchLseOptionsChain } from "@/lib/lse";
import { blackScholes, yearsToExpiry, type OptionType } from "@/lib/bsm";
import type { NormalizedOption, OptionsResponse } from "@/lib/options-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Cache ──────────────────────────────────────────────────────────

type Cached = { at: number; payload: OptionsResponse };
const cache = new Map<string, Cached>();
const TTL_MS = 60_000; // 60s

// ── Symbol classification ──────────────────────────────────────────

const CRYPTO_COINS: Record<string, Coin> = {
  BTC: "BTC",
  ETH: "ETH",
};

const EQUITY_SYMBOLS = ["SPX", "NDX", "RUT", "AAPL", "NVDA", "TSLA", "META", "GLD", "TLT", "VIX"];

// ── Synthetic fallback generator (deterministic SABR-like surface) ─

function syntheticChain(symbol: string, spot: number): NormalizedOption[] {
  const contracts: NormalizedOption[] = [];
  const now = Date.now();
  const baseVol = symbol === "VIX" ? 0.85 : symbol === "BTC" || symbol === "ETH" ? 0.55 : 0.22;

  // 6 expiries: 7d, 14d, 30d, 60d, 90d, 180d
  const dtes = [7, 14, 30, 60, 90, 180];
  // 11 strikes: 0.8x to 1.2x spot
  const strikeCount = 11;

  for (const dte of dtes) {
    const expiry = new Date(now + dte * 86400000).toISOString();
    const T = dte / 365;
    for (let i = 0; i < strikeCount; i++) {
      const moneyness = 0.8 + (0.4 * i) / (strikeCount - 1); // 0.8 .. 1.2
      const K = Math.round(spot * moneyness);
      const logM = Math.log(K / spot);
      const skew = -0.06 * logM;
      const smile = 0.12 * logM * logM * (1 / (1 + T * 2));
      const term = 0.04 * Math.exp(-T * 1.2);
      const iv = baseVol + skew + smile + term;

      for (const type of ["call", "put"] as OptionType[]) {
        const greeks = blackScholes(spot, K, yearsToExpiry(expiry), 0.045, iv, type);
        contracts.push({
          symbol: `${symbol}-${K}-${dte}d-${type[0].toUpperCase()}`,
          strike: K,
          expiry,
          type,
          iv,
          bid: greeks.price * 0.98,
          ask: greeks.price * 1.02,
          mid: greeks.price,
          markPrice: greeks.price,
          markPriceUsd: greeks.price,
          volume: 0,
          volumeUsd: 0,
          openInterest: 0,
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
    }
  }
  return contracts;
}

const FALLBACK_SPOT: Record<string, number> = {
  BTC: 65000, ETH: 1950, SPX: 5800, NDX: 20300, RUT: 2340, VIX: 14.3,
  AAPL: 229, NVDA: 138, TSLA: 242, META: 565, GLD: 245, TLT: 95,
};

// ── Route handler ──────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") || "BTC").toUpperCase();

  const now = Date.now();
  const cached = cache.get(symbol);
  if (cached && now - cached.at < TTL_MS) {
    return NextResponse.json(cached.payload, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Data-Source": cached.payload.source,
      },
    });
  }

  let payload: OptionsResponse;

  // ── Path 1: Crypto → Deribit (works now) ──
  const coin = CRYPTO_COINS[symbol];
  if (coin) {
    const result = await fetchDeribitOptionsChain(coin);
    if (result && result.contracts.length > 0) {
      const expiries = [...new Set(result.contracts.map((c) => c.expiry))].sort();
      const strikes = [...new Set(result.contracts.map((c) => c.strike))].sort((a, b) => a - b);
      payload = {
        live: true,
        source: "deribit",
        symbol,
        spot: result.spot,
        contracts: result.contracts,
        expiries,
        strikes,
        fetchedAt: result.fetchedAt,
        ttl: TTL_MS,
      };
      cache.set(symbol, { at: now, payload });
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-Data-Source": "deribit" },
      });
    }
    // Deribit failed — fall through to synthetic
    const spot = (await fetchDeribitIndex(coin)) ?? FALLBACK_SPOT[symbol] ?? 65000;
    const contracts = syntheticChain(symbol, spot);
    payload = {
      live: false,
      source: "fallback",
      symbol,
      spot,
      contracts,
      expiries: [...new Set(contracts.map((c) => c.expiry))].sort(),
      strikes: [...new Set(contracts.map((c) => c.strike))].sort((a, b) => a - b),
      fetchedAt: new Date().toISOString(),
      ttl: TTL_MS,
    };
    cache.set(symbol, { at: now, payload });
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-Data-Source": "fallback" },
    });
  }

  // ── Path 2: Equity → LSE (1st) → synthetic fallback ──
  const lseResult = await fetchLseOptionsChain(symbol, { maxDte: 90 });
  if (lseResult && lseResult.contracts.length > 0) {
    const expiries = [...new Set(lseResult.contracts.map((c) => c.expiry))].sort();
    const strikes = [...new Set(lseResult.contracts.map((c) => c.strike))].sort((a, b) => a - b);
    payload = {
      live: true,
      source: "lse",
      symbol,
      spot: lseResult.spot,
      contracts: lseResult.contracts,
      expiries,
      strikes,
      fetchedAt: lseResult.fetchedAt,
      ttl: TTL_MS,
    };
    cache.set(symbol, { at: now, payload });
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-Data-Source": "lse" },
    });
  }

  // ── Path 3: Synthetic fallback ──
  const spot = FALLBACK_SPOT[symbol] ?? 100;
  const contracts = syntheticChain(symbol, spot);
  payload = {
    live: false,
    source: "fallback",
    symbol,
    spot,
    contracts,
    expiries: [...new Set(contracts.map((c) => c.expiry))].sort(),
    strikes: [...new Set(contracts.map((c) => c.strike))].sort((a, b) => a - b),
    fetchedAt: new Date().toISOString(),
    ttl: TTL_MS,
  };
  cache.set(symbol, { at: now, payload });
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-Data-Source": "fallback" },
  });
}
