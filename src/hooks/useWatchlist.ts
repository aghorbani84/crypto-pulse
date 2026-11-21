import { useCallback, useState } from 'react';

const STORAGE_KEY = 'crypto-pulse:watchlist';

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/** Watchlist of coin ids, persisted in localStorage. */
export function useWatchlist() {
  const [ids, setIds] = useState<string[]>(readStored);

  const toggle = useCallback((coinId: string) => {
    setIds((prev) => {
      const next = prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode, quota) — keep in-memory state.
      }
      return next;
    });
  }, []);

  const isWatched = useCallback((coinId: string) => ids.includes(coinId), [ids]);

  return { ids, toggle, isWatched };
}
