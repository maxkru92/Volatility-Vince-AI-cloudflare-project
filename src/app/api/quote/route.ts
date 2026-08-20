import { NextResponse } from "next/server";
import {
  toYahoo,
  YAHOO_SYMBOL_MAP,
  YAHOO_UA,
  type QuoteResponse,
  type Candle,
} from "@/lib/market-types";

// Always run server-side; never cached at the framework level beyond our own TTL.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Module-scoped in-memory cache (per server instance). 60s TTL, keyed by display symbol.
type Cached = { at: number; payload: QuoteResponse };
const cache = new Map<string, Cached>();
const TTL_MS = 60_000;

// Number of recent candles to return.
const CANDLE_COUNT = 30;

// Base prices for the deterministic fallback mock (per display symbol).
const FALLBACK_BASE: Record<string, number> = {
  SPX: 5800,
  NDX: 20300,
  RUT: 2340,
  VIX: 14.2,
  AAPL: 230,
  NVDA: 138,
  TSLA: 412,
  META: 591,
  SPY: 584,
  QQQ: 503,
  GLD: 246,
  TLT: 94,
};

// Minimal shape of the Yahoo v8 chart response we consume.
interface YahooChartMeta {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  shortName?: string;
  longName?: string;
  exchangeName?: string;
  fullExchangeName?: string;
}

interface YahooChartResult {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: number[];
      high?: number[];
      low?: number[];
      close?: number[];
      volume?: number[];
    }>;
  };
  meta?: YahooChartMeta;
}

interface YahooChartResponse {
  chart?: { result?: YahooChartResult[]; error?: unknown };
}

async function fetchYahooChart(
  displaySymbol: string
): Promise<YahooChartResult> {
  const yh = toYahoo(displaySymbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yh
  )}?range=1mo&interval=1d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": YAHOO_UA,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Yahoo chart HTTP ${res.status}`);
  }
  const json = (await res.json()) as YahooChartResponse;
  const result = json.chart?.result?.[0];
  if (!result) {
    throw new Error("Yahoo chart: malformed payload");
  }
  return result;
}

function buildCandles(result: YahooChartResult): Candle[] {
  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0];
  if (!q || !q.open || !q.high || !q.low || !q.close) return [];
  const len = Math.min(ts.length, q.close.length);
  const out: Candle[] = [];
  // Walk from the start; skip nulls (Yahoo returns null for non-trading intervals).
  for (let i = 0; i < len; i++) {
    const o = q.open[i];
    const h = q.high[i];
    const l = q.low[i];
    const c = q.close[i];
    const t = ts[i];
    if (
      o == null ||
      h == null ||
      l == null ||
      c == null ||
      t == null ||
      !Number.isFinite(o) ||
      !Number.isFinite(h) ||
      !Number.isFinite(l) ||
      !Number.isFinite(c)
    ) {
      continue;
    }
    out.push({
      t,
      open: o,
      high: h,
      low: l,
      close: c,
      up: c >= o,
    });
  }
  // Keep only the last CANDLE_COUNT candles.
  return out.slice(-CANDLE_COUNT);
}

function buildLivePayload(
  displaySymbol: string,
  result: YahooChartResult
): QuoteResponse {
  const meta = result.meta ?? {};
  const candles = buildCandles(result);
  const price = meta.regularMarketPrice ?? candles[candles.length - 1]?.close ?? 0;
  const prevClose =
    meta.chartPreviousClose ??
    meta.previousClose ??
    candles[candles.length - 2]?.close ??
    price;
  const dayChg = price - prevClose;
  const dayChgPct = prevClose !== 0 ? (dayChg / prevClose) * 100 : 0;
  const name =
    meta.shortName || meta.longName || displaySymbol;
  const exchange = meta.exchangeName || meta.fullExchangeName || "";

  return {
    symbol: displaySymbol,
    name,
    exchange,
    price,
    prevClose,
    dayChg,
    dayChgPct,
    candles,
    live: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic fallback mock candles — mirrors the pseudo-random algorithm
 * used by the original decorative volatility-chart, centered on a plausible
 * base price for the symbol. Produces a stable but lively chart that never
 * breaks the UI when Yahoo is unreachable.
 */
function fallbackCandles(displaySymbol: string): Candle[] {
  const base = FALLBACK_BASE[displaySymbol] ?? 100;
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  const out: Candle[] = [];
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    // Scaled noise/oscillation proportional to the base price.
    const amp = base * 0.012;
    const center = base + Math.sin(i / 4) * amp + (r - 0.5) * amp * 1.6;
    const open = center + (r - 0.5) * amp * 0.4;
    const close =
      center + Math.sin(i / 3 + 0.2) * amp * 0.9 + (r - 0.45) * amp * 0.5;
    const high = Math.max(open, close) + amp * 0.3 + r * amp * 0.4;
    const low = Math.min(open, close) - amp * 0.3 - r * amp * 0.4;
    out.push({
      t: now - (CANDLE_COUNT - i) * day,
      open,
      high,
      low,
      close,
      up: close >= open,
    });
  }
  return out;
}

function buildFallbackPayload(displaySymbol: string): QuoteResponse {
  const candles = fallbackCandles(displaySymbol);
  const price = candles[candles.length - 1]?.close ?? FALLBACK_BASE[displaySymbol] ?? 100;
  const prevClose =
    candles[candles.length - 2]?.close ??
    price;
  const dayChg = price - prevClose;
  const dayChgPct = prevClose !== 0 ? (dayChg / prevClose) * 100 : 0;
  return {
    symbol: displaySymbol,
    name: displaySymbol,
    exchange: "demo",
    price,
    prevClose,
    dayChg,
    dayChgPct,
    candles,
    live: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("symbol")?.toUpperCase()?.trim() ?? "SPX";
  // Reject unknown symbols — fall back to SPX.
  const displaySymbol = YAHOO_SYMBOL_MAP[raw] ? raw : "SPX";

  const now = Date.now();
  const hit = cache.get(displaySymbol);
  if (hit && now - hit.at < TTL_MS) {
    return NextResponse.json(hit.payload, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        "X-Data-Source": hit.payload.live ? "yahoo-live" : "static-fallback",
      },
    });
  }

  let payload: QuoteResponse;
  try {
    const result = await fetchYahooChart(displaySymbol);
    payload = buildLivePayload(displaySymbol, result);
    // If we got zero candles something is off — fall back.
    if (!payload.candles.length) {
      payload = buildFallbackPayload(displaySymbol);
    }
  } catch {
    payload = buildFallbackPayload(displaySymbol);
  }

  cache.set(displaySymbol, { at: now, payload });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      "X-Data-Source": payload.live ? "yahoo-live" : "static-fallback",
    },
  });
}
