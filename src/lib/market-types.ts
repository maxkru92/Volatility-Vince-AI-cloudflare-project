/**
 * Shared market-data types and helpers for the Yahoo Finance integration.
 * Server-side only — used by /api/ticker and /api/quote route handlers.
 */

// Display symbols shown to the user, in tape order.
export const DISPLAY_SYMBOLS = [
  "SPX",
  "NDX",
  "RUT",
  "VIX",
  "AAPL",
  "NVDA",
  "TSLA",
  "META",
  "SPY",
  "QQQ",
  "GLD",
  "TLT",
] as const;

// Map display symbol → Yahoo Finance symbol.
// Indexes need the ^ prefix on Yahoo; ETFs / stocks use the plain ticker.
export const YAHOO_SYMBOL_MAP: Record<string, string> = {
  SPX: "^GSPC",
  NDX: "^NDX",
  RUT: "^RUT",
  VIX: "^VIX",
  AAPL: "AAPL",
  NVDA: "NVDA",
  TSLA: "TSLA",
  META: "META",
  SPY: "SPY",
  QQQ: "QQQ",
  GLD: "GLD",
  TLT: "TLT",
};

// Reverse map: Yahoo symbol → display symbol.
export const DISPLAY_FROM_YAHOO: Record<string, string> = Object.entries(
  YAHOO_SYMBOL_MAP
).reduce((acc, [display, yh]) => {
  acc[yh] = display;
  return acc;
}, {} as Record<string, string>);

export function toYahoo(displaySymbol: string): string {
  return YAHOO_SYMBOL_MAP[displaySymbol] ?? displaySymbol;
}

export function toDisplay(yahooSymbol: string): string {
  return DISPLAY_FROM_YAHOO[yahooSymbol] ?? yahooSymbol;
}

// A single ticker item, as rendered by the ticker-tape.
export interface TickerItem {
  sym: string;
  px: string;
  chg: string;
  up: boolean;
  gex: string;
  live?: boolean;
}

export interface TickerResponse {
  live: boolean;
  updatedAt: string;
  items: TickerItem[];
}

// A candle in the price history.
export interface Candle {
  t: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  up: boolean;
}

export interface QuoteResponse {
  symbol: string; // display symbol (e.g. "SPX")
  name: string;
  exchange: string;
  price: number;
  prevClose: number;
  dayChg: number;
  dayChgPct: number;
  candles: Candle[];
  live: boolean;
  updatedAt: string;
}

// Format a price with thousands separators and 2 decimals.
export function formatPrice(value: number, displaySymbol: string): string {
  const n = Number.isFinite(value) ? value : 0;
  // VIX prints 2 decimals with no thousands separator (always <100 typically).
  // Indices / ETFs / stocks all use 2 decimals with thousands separators.
  if (displaySymbol === "VIX") {
    return n.toFixed(2);
  }
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format a percent change with explicit + or - sign and 2 decimals.
export function formatPct(pct: number): string {
  if (!Number.isFinite(pct)) return "0.00%";
  const sign = pct >= 0 ? "+" : "-";
  return `${sign}${Math.abs(pct).toFixed(2)}%`;
}

// Format a signed absolute change (e.g. +1.23 or -0.45).
export function formatChg(chg: number): string {
  if (!Number.isFinite(chg)) return "0.00";
  const sign = chg >= 0 ? "+" : "-";
  return `${sign}${Math.abs(chg).toFixed(2)}`;
}

// Realistic browser User-Agent — Yahoo blocks the default fetch UA.
export const YAHOO_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
