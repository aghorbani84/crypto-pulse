# CryptoPulse

**Track the top 100 cryptocurrencies with live prices, 7-day charts, and a personal watchlist.**

[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f)](https://aghorbani84.github.io/crypto-pulse/)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery&logoColor=white)
[![GitHub stars](https://img.shields.io/github/stars/aghorbani84/crypto-pulse?style=flat)](https://github.com/aghorbani84/crypto-pulse/stargazers)

**Live demo:** https://aghorbani84.github.io/crypto-pulse/

## Overview

CryptoPulse is a React dashboard backed by the public [CoinGecko API](https://www.coingecko.com/en/api)
(free tier, no key). It lists the top 100 coins by market cap, refreshes once a minute, and shows a clear
message instead of stale or fake numbers when the API is unreachable or rate-limited.

## Features

- **Top 100 coins** by market cap from `/coins/markets`.
- **7-day price chart** for any coin, loaded on demand from `/coins/{id}/market_chart`.
- **Search** by name or symbol and **sort** by rank, price, 24h change, or market cap.
- **USD / EUR** currency switch.
- **Watchlist** saved in `localStorage`, with a one-click filter.
- **Auto-refresh** every 60 seconds with a countdown, plus a manual refresh.
- **24h top gainers and losers**.
- **Rate-limit aware**: 60-second caching and explicit handling of HTTP 429.
- **Themes**: Achaemenid and Modern styles, each in light and dark.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Server state | TanStack Query 5 with native `fetch` |
| Charts | Recharts |
| Styling | styled-components |
| Icons | lucide-react |
| Data | CoinGecko public API |
| Deploy | GitHub Actions → GitHub Pages |

## Getting started

Requires Node.js 20 or newer and npm. No API key needed.

```bash
git clone https://github.com/aghorbani84/crypto-pulse.git
cd crypto-pulse
npm install
npm run dev        # http://localhost:5173/crypto-pulse/
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
  App.tsx            table, search, sorting, movers, currency, refresh
  api/coingecko.ts   CoinGecko client and error handling
  hooks/             useCoins, useWatchlist, useTheme
  components/        CoinChart, Sparkline, CoinIcon, ThemeSwitcher
  utils/format.ts    price and percentage formatting
.github/workflows/   GitHub Pages deploy
```

> Prices come from CoinGecko's free tier and are for information only, not financial advice.

## Author

Built by [Abolfazl Ghorbani](https://github.com/aghorbani84). Market data from [CoinGecko](https://www.coingecko.com/).
