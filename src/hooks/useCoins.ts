import { useQuery } from '@tanstack/react-query';
import { fetchCoinChart, fetchTopCoins } from '../api/coingecko';
import type { Currency } from '../types';

/**
 * Top 100 coins by market cap.
 * Cached for 60s (staleTime) and refreshed on a 60s interval so the free
 * CoinGecko tier is never hammered.
 */
export function useTopCoins(currency: Currency) {
  return useQuery({
    queryKey: ['coins', 'markets', currency],
    queryFn: () => fetchTopCoins(currency),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** 7-day price history for the selected coin. Only fetched on demand. */
export function useCoinChart(coinId: string | null, currency: Currency) {
  return useQuery({
    queryKey: ['coins', coinId, 'chart', currency],
    queryFn: () => fetchCoinChart(coinId as string, currency),
    enabled: coinId !== null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
