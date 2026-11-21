import type { Coin, Currency, MarketChart } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

export class CoinGeckoError extends Error {
  readonly status: number;
  readonly isRateLimited: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CoinGeckoError';
    this.status = status;
    this.isRateLimited = status === 429;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error(
      'Could not reach the CoinGecko API. Check your internet connection and try again.',
    );
  }

  if (response.status === 429) {
    throw new CoinGeckoError(
      429,
      'CoinGecko rate limit reached (free tier). Please wait a minute and try again.',
    );
  }

  if (!response.ok) {
    throw new CoinGeckoError(
      response.status,
      `CoinGecko API error (HTTP ${response.status}). Please try again shortly.`,
    );
  }

  return (await response.json()) as T;
}

/** Top coins by market cap. Free endpoint, no API key required. */
export async function fetchTopCoins(currency: Currency): Promise<Coin[]> {
  const params = new URLSearchParams({
    vs_currency: currency,
    order: 'market_cap_desc',
    per_page: '100',
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });
  return fetchJson<Coin[]>(`${BASE_URL}/coins/markets?${params.toString()}`);
}

/** 7-day price history for one coin. Free endpoint, no API key required. */
export async function fetchCoinChart(
  coinId: string,
  currency: Currency,
): Promise<MarketChart> {
  const params = new URLSearchParams({
    vs_currency: currency,
    days: '7',
  });
  return fetchJson<MarketChart>(
    `${BASE_URL}/coins/${encodeURIComponent(coinId)}/market_chart?${params.toString()}`,
  );
}
