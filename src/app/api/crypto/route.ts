import { NextResponse } from "next/server";
import { fetchDeribitPerp, type Coin } from "@/lib/deribit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Module-scoped in-memory cache (per server instance). 15s TTL.
type Cached = { at: number; payload: CryptoResponse };
let cache: Cached | null = null;
const TTL_MS = 15_000;

// ── Types ──────────────────────────────────────────────────────────

export interface CryptoItem {
  sym: string;
  price: number;
  change24h: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  sparkline: number[];
}

export interface CryptoResponse {
  live: boolean;
  source: "deribit" | "binance" | "fallback";
  updatedAt: string;
  items: CryptoItem[];
}

// Symbols we track.
const DERIBIT_COINS: { coin: Coin; sym: string }[] = [
  { coin: "BTC", sym: "BTC" },
  { coin: "ETH", sym: "ETH" },
];
const BINANCE_SYMBOLS = ["SOLUSDT", "BNBUSDT"] as const;
const DISPLAY_SYMBOLS: Record<string, string> = {
  SOLUSDT: "SOL",
  BNBUSDT: "BNB",
};

// Base prices for deterministic fallback.
const FALLBACK_BASE: Record<string, number> = {
  BTC: 107842, ETH: 3847, SOLUSDT: 178, BNBUSDT: 642,
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Binance fetch helpers (for SOL/BNB) ────────────────────────────

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

interface BinanceKline {
  0: number; 1: string; 2: string; 3: string; 4: string; 5: string; 6: number;
}

async function fetchBinanceTickers(): Promise<BinanceTicker[]> {
  const symbolsParam = JSON.stringify(BINANCE_SYMBOLS);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Binance ticker HTTP ${res.status}`);
  const json = (await res.json()) as BinanceTicker[];
  if (!Array.isArray(json) || json.length === 0) throw new Error("Binance: empty");
  return json;
}

async function fetchBinanceKlines(symbol: string): Promise<number[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Binance klines HTTP ${res.status}`);
  const json = (await res.json()) as BinanceKline[];
  if (!Array.isArray(json) || json.length === 0) throw new Error("Binance klines: empty");
  return json.map((k) => parseFloat(k[4]));
}

// ── Fallback sparkline (deterministic) ─────────────────────────────

function fallbackSparkline(base: number, symbol: string): number[] {
  const points: number[] = [];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash + symbol.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < 24; i++) {
    hash = ((hash << 5) - hash + i * 9301 + 49297) | 0;
    const r = Math.abs(hash % 233280) / 233280;
    const amp = base * 0.008;
    const center = base + Math.sin(i / 5) * amp + (r - 0.5) * amp * 1.2;
    points.push(parseFloat(center.toFixed(2)));
  }
  return points;
}

function buildFallbackItems(): CryptoItem[] {
  const all = [...DERIBIT_COINS.map((c) => c.sym), ...BINANCE_SYMBOLS];
  return all.map((symbol) => {
    const base = FALLBACK_BASE[symbol] ?? 100;
    let h = 0;
    for (let i = 0; i < symbol.length; i++) h = ((h << 5) - h + symbol.charCodeAt(i)) | 0;
    const r = Math.abs(h % 1000) / 1000;
    const changePct = (r - 0.45) * 6;
    const change24h = base * (changePct / 100);
    return {
      sym: DISPLAY_SYMBOLS[symbol] ?? symbol,
      price: base,
      change24h: parseFloat(change24h.toFixed(2)),
      changePct24h: parseFloat(changePct.toFixed(2)),
      high24h: parseFloat((base * 1.02).toFixed(2)),
      low24h: parseFloat((base * 0.98).toFixed(2)),
      volume24h: parseFloat((base * 12000 + r * base * 8000).toFixed(2)),
      sparkline: fallbackSparkline(base, symbol),
    };
  });
}

// ── Route handler ──────────────────────────────────────────────────

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return NextResponse.json(cache.payload, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
        "X-Data-Source": cache.payload.source === "deribit" ? "deribit-live" : cache.payload.source === "binance" ? "binance-live" : "static-fallback",
      },
    });
  }

  const items: CryptoItem[] = [];
  let source: "deribit" | "binance" | "fallback" = "deribit";
  let live = true;

  // 1. Fetch Deribit BTC + ETH (parallel)
  const deribitResults = await Promise.all(
    DERIBIT_COINS.map(async (c) => {
      const r = await fetchDeribitPerp(c.coin);
      return { sym: c.sym, r };
    })
  );

  for (const { sym, r } of deribitResults) {
    if (r) {
      items.push({
        sym,
        price: r.price,
        change24h: parseFloat((r.price * r.changePct24h / 100).toFixed(2)),
        changePct24h: parseFloat(r.changePct24h.toFixed(2)),
        high24h: r.high24h,
        low24h: r.low24h,
        volume24h: r.volumeUsd,
        sparkline: fallbackSparkline(r.price, sym), // Deribit doesn't give hourly klines in this endpoint
      });
    } else {
      // Deribit failed for this coin — mark not fully live
      live = false;
      const base = FALLBACK_BASE[sym] ?? 100;
      items.push({
        sym,
        price: base,
        change24h: 0,
        changePct24h: 0,
        high24h: base * 1.02,
        low24h: base * 0.98,
        volume24h: 0,
        sparkline: fallbackSparkline(base, sym),
      });
    }
  }

  // 2. Fetch Binance SOL + BNB (parallel)
  try {
    const tickers = await fetchBinanceTickers();
    const tickerMap = new Map<string, BinanceTicker>();
    for (const t of tickers) tickerMap.set(t.symbol, t);

    const klineResults = await Promise.allSettled(
      BINANCE_SYMBOLS.map((sym) => fetchBinanceKlines(sym))
    );

    BINANCE_SYMBOLS.forEach((symbol, idx) => {
      const t = tickerMap.get(symbol);
      const price = t ? parseFloat(t.lastPrice) : FALLBACK_BASE[symbol] ?? 100;
      const changePct = t ? parseFloat(t.priceChangePercent) : 0;
      const change24h = t ? price * (changePct / 100) : 0;
      const high24h = t ? parseFloat(t.highPrice) : price * 1.02;
      const low24h = t ? parseFloat(t.lowPrice) : price * 0.98;
      const volume24h = t ? parseFloat(t.quoteVolume) : 0;

      let sparkline: number[];
      const klineResult = klineResults[idx];
      if (klineResult.status === "fulfilled" && klineResult.value.length >= 10) {
        sparkline = klineResult.value;
      } else {
        sparkline = fallbackSparkline(price, symbol);
      }

      items.push({
        sym: DISPLAY_SYMBOLS[symbol],
        price,
        change24h: parseFloat(change24h.toFixed(2)),
        changePct24h: parseFloat(changePct.toFixed(2)),
        high24h,
        low24h,
        volume24h,
        sparkline,
      });
    });
  } catch {
    // Binance failed — use fallback for SOL/BNB
    if (live) source = "deribit"; // BTC/ETH still live
    for (const symbol of BINANCE_SYMBOLS) {
      const base = FALLBACK_BASE[symbol] ?? 100;
      items.push({
        sym: DISPLAY_SYMBOLS[symbol],
        price: base,
        change24h: 0,
        changePct24h: 0,
        high24h: base * 1.02,
        low24h: base * 0.98,
        volume24h: 0,
        sparkline: fallbackSparkline(base, symbol),
      });
    }
  }

  // If Deribit also failed entirely, mark as fallback
  const anyLive = items.some((i) => i.price > 0 && i.changePct24h !== 0);
  if (!anyLive && items.every((i) => i.volume24h === 0)) {
    live = false;
    source = "fallback";
  } else if (!deribitResults.every((r) => r.r)) {
    source = "binance"; // mixed
  }

  const payload: CryptoResponse = {
    live,
    source,
    updatedAt: new Date().toISOString(),
    items: live ? items : buildFallbackItems(),
  };

  cache = { at: now, payload };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
      "X-Data-Source": source === "deribit" ? "deribit-live" : source === "binance" ? "binance-live" : "static-fallback",
    },
  });
}
