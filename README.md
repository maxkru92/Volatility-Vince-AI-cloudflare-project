# Volatility Vince — Landing Page

Institutional-grade landing page for **Volatility Vince**, the Quant Intelligence Telegram Chatbot (Module 03 of the Krupp Capital Trading Suite).

**Live:** https://volatility-vince-ai.vercel.app

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animation | Framer Motion 12 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Hosting | Vercel (Hobby, fra1) |

---

## Quick Deploy (Vercel)

### Prerequisites
- [Bun](https://bun.sh) installed locally
- [Vercel CLI](https://vercel.com/docs/cli) authenticated
- [GitHub CLI](https://cli.github.com) authenticated

### One-time setup

> **First deploy?** Create the Vercel project first:
> `vercel project add volatility-vince-ai-landingpage --scope kruppcapital`
> (or import via the Vercel dashboard at https://vercel.com/kruppcapital).

```bash
# Clone the repo
git clone https://github.com/maxkru92/volatility-vince-ai-landingpage.git
cd volatility-vince-ai-landingpage

# Install dependencies
bun install

# Link to Vercel project
vercel link --yes --project volatility-vince-ai-landingpage --scope kruppcapital
```

### Local development

```bash
bun run dev        # Start dev server on port 3000
bun run lint       # Run ESLint
bunx tsc --noEmit  # Full TypeScript check (note: next.config.ts sets ignoreBuildErrors, Vercel build skips TS errors)
```

### Production deploy

```bash
# Build & deploy to Vercel production
vercel deploy --prod --yes --scope kruppcapital
```

The `vercel.json` config handles all settings:
- Region: `fra1` (Frankfurt)
- Runtime: Bun (`bun install`)
- Function timeout: 10s for API routes
- Auto-caching headers for `/api/*`

### Build artifacts

```bash
bun run build      # → .next/standalone/
bun run start      # → serve production build locally
```

---

## kc-mint Branding

This deployment uses the **kc-mint** variant of the Krupp Capital logo for all browser-tab and PWA assets:

| Asset | File | Type |
|-------|------|------|
| SVG Icon | `public/kc-mint.svg` | `image/svg+xml` |
| ICO | `public/kc-mint.ico` | `image/vnd.microsoft.icon` |
| PNG 16×16 | `public/kc-mint-16.png` | `image/png` |
| PNG 32×32 | `public/kc-mint-32.png` | `image/png` |
| PNG 192×192 | `public/kc-mint-192.png` | `image/png` |
| PNG 512×512 | `public/kc-mint-512.png` | `image/png` |
| Apple Touch | `public/kc-mint-apple-touch-icon.png` | `image/png` |
| Web Manifest | `public/kc-mint.webmanifest` | `application/manifest+json` |

Metadata configured in `src/app/layout.tsx`:
- `themeColor`: `#00d99a`
- `colorScheme`: `dark`
- `manifest`: `/kc-mint.webmanifest`
- `icons`: SVG + PNG + ICO + Apple Touch Icon

The kc-mint favicon pack source is at `~/Downloads/kc-favicon-pack/`.

---

## Live API Endpoints

All API routes are deployed as Vercel Serverless Functions (force-dynamic, revalidate=0).
Each route has built-in in-memory caching and deterministic synthetic fallbacks.

### `GET /api/ticker`
Live market ticker for 12 symbols (SPX, NDX, RUT, VIX, AAPL, NVDA, TSLA, META, SPY, QQQ, GLD, TLT).

| Aspect | Detail |
|--------|--------|
| Source | Yahoo Finance v7 quote endpoint |
| Cache TTL | 30s (module-scoped Map) |
| Fallback | Yes (static curated data, `live: false`) |
| `X-Data-Source` header | `yahoo-live` / `static-fallback` |

### `GET /api/quote?symbol=SPX`
OHLCV candle data (30 daily bars) with metadata for a single symbol.

| Aspect | Detail |
|--------|--------|
| Source | Yahoo Finance v8 chart endpoint |
| Cache TTL | 60s (module-scoped Map, keyed by symbol) |
| Fallback | Yes (deterministic pseudo-random candles, `live: false`) |
| `X-Data-Source` header | `yahoo-live` / `static-fallback` |

### `GET /api/options?symbol=BTC`
Full normalized options chain with Black-Scholes Greeks.

| Aspect | Detail |
|--------|--------|
| Source (Crypto) | Deribit public API |
| Source (Equity) | LSE (London Strategic Edge) — requires `LSE_API_KEY` env var |
| Cache TTL | 60s (module-scoped Map) |
| Fallback | Yes (deterministic SABR-like synthetic chain, `live: false`) |
| `X-Data-Source` header | `deribit` / `lse` / `fallback` |

> **Note:** The LSE adapter requires an API key set in the Vercel environment variable `LSE_API_KEY`. Without it, equity option requests transparently return the synthetic fallback.

### `GET /api/crypto`
Live crypto prices and 24h stats for BTC, ETH, SOL, BNB.

| Aspect | Detail |
|--------|--------|
| Source | Deribit perpetuals (BTC/ETH) + Binance REST API (SOL/BNB) |
| Cache TTL | 15s (module-scoped singleton) |
| Fallback | Yes (deterministic base prices + sparklines, `live: false`) |
| `X-Data-Source` header | `deribit-live` / `binance-live` / `static-fallback` |

### `POST /api/newsletter`
In-memory newsletter email capture.

| Aspect | Detail |
|--------|--------|
| Body | `{ "email": "user@example.com" }` |
| Storage | Module-scoped `Set` (per-instance, not persistent across cold starts) |
| Response | `{ "ok": true, "message": "Subscribed!" }` / `{ "ok": false, "error": "..." }` |

### `GET /api/newsletter`
Returns current subscriber count (no emails exposed).

---

## Repository Cleanup (vs. original Tarball)

The following artifacts were removed from the production deployment tree and are excluded from this repository:

| Removed | Reason |
|---------|--------|
| `prisma/`, `db/`, `src/lib/db.ts` | SQLite/Prisma unused at runtime; Vercel has read-only filesystem |
| `examples/websocket/` | WebSocket not supported on Vercel serverless |
| `mini-services/` | Empty scaffolding |
| `.env` | Local DATABASE_URL not needed for deployment |
| `worklog.md`, `DEPLOY.md`, `HERMES_DEPLOY_PROMPT.md` | Internal agent development logs |
| `agent-ctx/`, `tool-results/`, `.zscripts/`, `download/`, `upload/` | Internal agent artifacts |
| `@prisma/client`, `prisma` from `package.json` | Dependencies removed |
| `postinstall`, `db:*` from `package.json` scripts | Scripts removed |
| Hardcoded `LSE_API_KEY` in `src/lib/lse.ts` | Now reads exclusively from `process.env.LSE_API_KEY` |

---

## Environment Variables

Only one optional variable is needed on Vercel:

| Variable | Required | Purpose |
|----------|----------|---------|
| `LSE_API_KEY` | No | London Strategic Edge API key for live equity options data. Without it, `/api/options` returns the synthetic SABR-like fallback for equities. |
