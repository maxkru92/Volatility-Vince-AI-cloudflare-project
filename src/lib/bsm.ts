/**
 * Shared Black-Scholes-Merton math.
 * Used by both client-side calculators and server-side API routes
 * (Deribit options chain enrichment).
 *
 * Pure TypeScript, no external dependencies.
 */

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/** Standard normal probability density function φ(x). */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/**
 * Standard normal CDF N(x) — Abramowitz & Stegun 7.1.26 approximation.
 * Max absolute error < 7.5e-8 across the full real line.
 */
export function normalCDF(x: number): number {
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;

  const L = Math.abs(x);
  const K = 1 / (1 + 0.2316419 * L);
  const phi = Math.exp(-0.5 * L * L) / SQRT_2PI;
  const poly = ((((a5 * K + a4) * K + a3) * K + a2) * K + a1) * K;
  const cdf = 1 - phi * poly;
  return x >= 0 ? cdf : 1 - cdf;
}

export type OptionType = "call" | "put";

export interface GreeksResult {
  price: number;
  delta: number;
  gamma: number;
  vega: number; // per 1% vol change
  theta: number; // per calendar day
  rho: number; // per 1% rate change
  d1: number;
  d2: number;
}

/**
 * Black-Scholes-Merton pricer for European options.
 * Returns price + 5 main Greeks.
 * Vega/Rho per 1% change, Theta per calendar day.
 */
export function blackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType
): GreeksResult {
  const safeT = Math.max(T, 1 / 365); // floor at 1 day to avoid div-by-zero
  const safeSigma = Math.max(sigma, 0.001);

  const sqrtT = Math.sqrt(safeT);
  const d1 =
    (Math.log(S / K) + (r + 0.5 * safeSigma * safeSigma) * safeT) /
    (safeSigma * sqrtT);
  const d2 = d1 - safeSigma * sqrtT;

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const Nnd1 = normalCDF(-d1);
  const Nnd2 = normalCDF(-d2);
  const nd1 = normalPDF(d1);

  let price: number;
  let delta: number;
  let rho: number;
  let theta: number;

  if (type === "call") {
    price = S * Nd1 - K * Math.exp(-r * safeT) * Nd2;
    delta = Nd1;
    rho = (K * safeT * Math.exp(-r * safeT) * Nd2) / 100;
    theta =
      (-(S * nd1 * safeSigma) / (2 * sqrtT) -
        r * K * Math.exp(-r * safeT) * Nd2) /
      365;
  } else {
    price = K * Math.exp(-r * safeT) * Nnd2 - S * Nnd1;
    delta = -Nnd1;
    rho = (-K * safeT * Math.exp(-r * safeT) * Nnd2) / 100;
    theta =
      (-(S * nd1 * safeSigma) / (2 * sqrtT) +
        r * K * Math.exp(-r * safeT) * Nnd2) /
      365;
  }

  const gamma = nd1 / (S * safeSigma * sqrtT);
  const vega = (S * nd1 * sqrtT) / 100;

  return { price, delta, gamma, vega, theta, rho, d1, d2 };
}

/**
 * Compute time to expiry in years from an ISO date string.
 * Returns 0 if the date is in the past.
 */
export function yearsToExpiry(expiryIso: string): number {
  const expiry = new Date(expiryIso).getTime();
  const now = Date.now();
  const ms = expiry - now;
  if (ms <= 0) return 1 / 365; // floor at 1 day
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}
