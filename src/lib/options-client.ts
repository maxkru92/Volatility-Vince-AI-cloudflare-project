/**
 * Client-side helper for fetching live option chains via /api/options.
 *
 * Module-scoped cache shared across all client components that need
 * option chains (greeks calculator, strategy calculator, vol surface,
 * GEX section). 60s TTL matches the server's cache TTL.
 *
 * Server-side-only types from @/lib/options-types are imported as types
 * only — they don't ship to the client bundle.
 */

import type { OptionsResponse } from "@/lib/options-types";

const OPTIONS_CACHE_TTL = 60_000;

interface CacheEntry {
  at: number;
  data: OptionsResponse;
  /** Resolved when an in-flight fetch completes. */
  promise: Promise<OptionsResponse | null>;
}

const cache = new Map<string, CacheEntry>();

/**
 * Fetch an option chain for a symbol, deduping concurrent requests
 * for the same symbol. Returns null on any failure.
 */
export function fetchOptionsChain(
  symbol: string,
  opts: { force?: boolean } = {}
): Promise<OptionsResponse | null> {
  const key = symbol.toUpperCase();
  const now = Date.now();

  // Cache hit?
  const existing = cache.get(key);
  if (!opts.force && existing && now - existing.at < OPTIONS_CACHE_TTL) {
    return existing.promise;
  }

  // In-flight promise (dedupes parallel callers).
  const promise = (async () => {
    try {
      const res = await fetch(`/api/options?symbol=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        cache.delete(key);
        return null;
      }
      const json = (await res.json()) as OptionsResponse;
      if (!json || !Array.isArray(json.contracts)) {
        cache.delete(key);
        return null;
      }
      cache.set(key, { at: Date.now(), data: json, promise: Promise.resolve(json) });
      return json;
    } catch {
      cache.delete(key);
      return null;
    }
  })();

  // Optimistically store the in-flight promise so concurrent callers
  // dedupe against it. If it resolves null we clear the cache above.
  cache.set(key, { at: now, data: undefined as unknown as OptionsResponse, promise });

  return promise;
}

/** Invalidate the cache for a symbol (used by 60s refresh intervals). */
export function invalidateOptionsChain(symbol: string) {
  cache.delete(symbol.toUpperCase());
}
