# CryptoPulse

A live cryptocurrency price tracker built with React + TypeScript (Vite). It shows
the top 100 coins by market cap with real prices from the CoinGecko public API —
no API key required, no fake data.

## Features

- **Top 100 coins by market cap** — fetched live from CoinGecko's
  `/coins/markets` endpoint (free, no key).
- **7-day price chart** — click any coin to load its 7-day history from
  CoinGecko's `/coins/{id}/market_chart` endpoint, rendered with recharts.
- **Search** — filter by coin name or symbol.
- **Sorting** — sort by rank, price, 24h change, or market cap.
- **Currency selector** — switch between USD and EUR.
- **Watchlist** — star coins to save them; the watchlist persists in
  `localStorage` and can be filtered with one click.
- **Auto-refresh** — prices refresh every 60 seconds with a live countdown,
  plus a manual "Refresh now" button.
- **24h gainers / losers** — top 3 movers in each direction, highlighted in
  green and red.
- **Honest loading & error states** — if the API is unreachable or rate-limited
  (HTTP 429), the app says so clearly instead of showing fake prices. Requests
  are cached with a 60-second `staleTime` and a 60-second refetch interval to
  respect CoinGecko's free-tier rate limits.

## Tech used

- **React 19 + TypeScript + Vite**
- **TanStack Query** — server-state management, caching, and auto-refetch
- **Native `fetch`** — HTTP (no extra HTTP library)
- **styled-components** — styling
- **recharts** — 7-day price charts
- **CoinGecko public API** — live market data (free tier, no API key)

## How to run

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (default `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Rate limits

CoinGecko's free tier limits request volume. CryptoPulse caches market data for
60 seconds and refreshes at most once per minute, and only fetches a coin's chart
when you click that coin.
