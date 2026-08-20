import { NextResponse } from "next/server";
import {
  YAHOO_SYMBOL_MAP,
  toYahoo,
  formatPrice,
  formatPct,
  YAHOO_UA,
  type TickerResponse,
  type TickerItem,
} from "@/lib/market-types";
import { tickerSymbols } from "@/lib/site-data";

// Always run server-side; never cached at the framework level beyond our own TTL.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Module-scoped in-memory cache (per server instance). 30s TTL.
type Cached = { at: number; payload: TickerResponse };
let cache: Cached | null = null;
const TTL_MS = 30_000;

// Minimal shape of the Yahoo v7 quote response we consume.
interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  marketState?: string;
  shortName?: string;
  longName?: string;
  fullExchangeName?: string;
  regularMarketPreviousClose?: number;
}

interface YahooQuoteResponse {
  quoteResponse?: { result?: YahooQuoteResult[]; error?: unknown };
}

async function fetchYahooQuotes(): Promise<YahooQuoteResult[]> {
  const yahooSyms = Object.keys(YAHOO_SYMBOL_MAP)
    .map(toYahoo)
    .join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    yahooSyms
  )}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": YAHOO_UA,
      Accept: "application/json",
    },
    // We never want Next.js to cache this fetch — our own TTL handles it.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Yahoo quote HTTP ${res.status}`);
  }
  const json = (await res.json()) as YahooQuoteResponse;
  if (!json.quoteResponse?.result) {
    throw new Error("Yahoo quote: malformed payload");
  }
  return json.quoteResponse.result;
}

function buildLiveItems(results: YahooQuoteResult[]): TickerItem[] {
  // Index Yahoo results by Yahoo symbol for O(1) lookup.
  const byYahoo = new Map<string, YahooQuoteResult>();
  for (const r of results) byYahoo.set(r.symbol, r);

  return Object.keys(YAHOO_SYMBOL_MAP).map((sym) => {
    const yh = toYahoo(sym);
    const r = byYahoo.get(yh);
    const px = r?.regularMarketPrice ?? 0;
    const pct = r?.regularMarketChangePercent ?? 0;
    return {
      sym,
      px: formatPrice(px, sym),
      chg: formatPct(pct),
      up: pct >= 0,
      gex: "—", // GEX not computed live in this route
      live: true,
    };
  });
}

function fallbackItems(): TickerItem[] {
  return tickerSymbols.map((t) => ({ ...t, live: false }));
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return NextResponse.json(cache.payload, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        "X-Data-Source": cache.payload.live ? "yahoo-live" : "static-fallback",
      },
    });
  }

  let payload: TickerResponse;
  try {
    const results = await fetchYahooQuotes();
    if (!results.length) throw new Error("Yahoo quote: empty result set");
    payload = {
      live: true,
      updatedAt: new Date().toISOString(),
      items: buildLiveItems(results),
    };
  } catch {
    payload = {
      live: false,
      updatedAt: new Date().toISOString(),
      items: fallbackItems(),
    };
  }

  cache = { at: now, payload };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      "X-Data-Source": payload.live ? "yahoo-live" : "static-fallback",
    },
  });
}
