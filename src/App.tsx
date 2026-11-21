import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  Search,
  SearchX,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import styled from 'styled-components';
import { CoinChart } from './components/CoinChart';
import { useCoinChart, useTopCoins } from './hooks/useCoins';
import { useWatchlist } from './hooks/useWatchlist';
import type {
  ChartPoint,
  Coin,
  Currency,
  SortDirection,
  SortKey,
} from './types';
import { formatCompact, formatCurrency, formatPercent } from './utils/format';

const REFRESH_SECONDS = 60;

/* ------------------------------------------------------------------ */
/* Page + app chrome                                                   */
/* ------------------------------------------------------------------ */

const Page = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(720px 320px at 50% -80px, rgba(56, 189, 248, 0.07), transparent 70%),
    var(--cp-canvas);
  color: var(--cp-text);
  font-family: var(--cp-font);
`;

const Container = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  padding: 21px 21px 64px;
`;

/* Fixed 38px app bar, Stageshow chrome height. The wordmark is plain
   text — no invented logo mark. */
const AppBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 13px;
  height: 38px;
  margin-bottom: 21px;
  border-bottom: 1px solid var(--cp-line-faint);
  padding-bottom: 13px;
`;

const Wordmark = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cp-text);
  white-space: nowrap;

  svg {
    color: var(--cp-accent);
  }
`;

const Accent = styled.span`
  color: var(--cp-accent);
`;

/* One pill, one status (dark-hero): Live / Updating… swap in the same
   cell, so nothing beside it moves. */
const LivePill = styled.div<{ $busy: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 13px;
  border-radius: var(--cp-radius-pill);
  border: 1px solid var(--cp-line);
  background: var(--cp-surface);
  font-size: 0.82rem;
  font-weight: 600;
  color: ${(props) => (props.$busy ? 'var(--cp-accent)' : 'var(--cp-up)')};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cp-up);
  animation: cp-pulse-dot 2s infinite;
  flex: none;
`;

const SpinIcon = styled.span<{ $spin: boolean }>`
  display: inline-flex;
  flex: none;
  svg {
    animation: ${(props) => (props.$spin ? 'cp-spin 0.9s linear infinite' : 'none')};
  }
`;

const Subtitle = styled.p`
  color: var(--cp-text-faint);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 21px;
  max-width: 62ch;
`;

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 21px;
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1 1 220px;
  min-width: 200px;

  svg {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--cp-text-dim);
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 13px 0 38px;
  border-radius: var(--cp-radius-md);
  border: 1px solid var(--cp-line);
  background: var(--cp-surface);
  color: var(--cp-text);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &::placeholder {
    color: var(--cp-text-dim);
  }
  &:focus {
    border-color: var(--cp-accent);
    box-shadow: 0 0 0 3px var(--cp-accent-soft);
  }
`;

/* Segmented currency control — the same setCurrency, as two buttons
   with a sliding-style active state instead of a native select. */
const Segmented = styled.div`
  display: inline-flex;
  height: 40px;
  padding: 3px;
  border-radius: var(--cp-radius-md);
  border: 1px solid var(--cp-line);
  background: var(--cp-surface);
`;

const Segment = styled.button<{ $active: boolean }>`
  min-width: 55px;
  padding: 0 13px;
  border: none;
  border-radius: 10px;
  background: ${(props) => (props.$active ? 'var(--cp-raised)' : 'transparent')};
  color: ${(props) => (props.$active ? 'var(--cp-accent)' : 'var(--cp-text-faint)')};
  font-size: 0.9rem;
  font-weight: ${(props) => (props.$active ? 700 : 500)};
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  &:hover {
    color: ${(props) => (props.$active ? 'var(--cp-accent)' : 'var(--cp-text)')};
  }
`;

const Button = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: var(--cp-radius-md);
  border: 1px solid ${(props) => (props.$active ? 'var(--cp-accent)' : 'var(--cp-line)')};
  background: ${(props) => (props.$active ? 'var(--cp-accent-strong)' : 'var(--cp-surface)')};
  color: ${(props) => (props.$active ? 'var(--cp-accent)' : 'var(--cp-text)')};
  font-size: 0.92rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  &:hover {
    border-color: var(--cp-accent);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  svg {
    color: ${(props) => (props.$active ? 'var(--cp-accent)' : 'var(--cp-text-faint)')};
  }
`;

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--cp-radius-pill);
  background: var(--cp-accent-soft);
  color: var(--cp-accent);
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

/* ------------------------------------------------------------------ */
/* Hero chart panel — the price is the headline, the chart the window  */
/* ------------------------------------------------------------------ */

const ChartPanel = styled.section`
  margin-bottom: 21px;
  background: var(--cp-surface);
  border: 1px solid var(--cp-line);
  border-radius: var(--cp-radius-lg);
  padding: 21px;
  animation: cp-rise 0.35s ease both;
  @media (max-width: 640px) {
    padding: 13px;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 13px;
  margin-bottom: 8px;
`;

const ChartIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
`;

const ChartIcon = styled.img`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--cp-line);
  flex: none;
`;

const ChartTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.01em;
`;

const ChartSub = styled.div`
  color: var(--cp-text-faint);
  font-size: 0.85rem;
  margin-top: 2px;
`;

/* The headline: one number gets to be big (φ type scale, 34px). When the
   pointer scrubs the chart, this value rolls to the day under it. */
const Headline = styled.div`
  display: flex;
  align-items: baseline;
  gap: 13px;
  flex-wrap: wrap;
  margin-top: 13px;
`;

const HeadlinePrice = styled.div`
  font-size: 2.125rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

const HeadlineDate = styled.span`
  color: var(--cp-text-faint);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
`;

const RangeLine = styled.div`
  color: var(--cp-text-faint);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  span {
    color: var(--cp-text-soft);
  }
`;

/* Change pill (dark-hero Badge geometry): soft tint, one mark, the word
   never moves — the pill only ever shows one state. */
const ChangePill = styled.span<{ $up: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--cp-radius-pill);
  background: ${(props) => (props.$up ? 'var(--cp-up-soft)' : 'var(--cp-down-soft)')};
  color: ${(props) => (props.$up ? 'var(--cp-up)' : 'var(--cp-down)')};
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

/* ------------------------------------------------------------------ */
/* Movers                                                              */
/* ------------------------------------------------------------------ */

const Movers = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
  margin-bottom: 21px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MoverCard = styled.div`
  background: var(--cp-surface);
  border: 1px solid var(--cp-line);
  border-radius: var(--cp-radius-md);
  padding: 13px 16px;
`;

const MoverTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0 0 8px;
  color: var(--cp-text-faint);
  svg {
    color: var(--cp-text-dim);
  }
`;

const MoverRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.92rem;
  &:not(:last-child) {
    border-bottom: 1px solid var(--cp-line-faint);
  }
`;

const MoverName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  span {
    color: var(--cp-text-faint);
    text-transform: uppercase;
    font-size: 0.82rem;
    margin-left: 4px;
  }
`;

/* ------------------------------------------------------------------ */
/* Coin table — rows, not boxes                                       */
/* ------------------------------------------------------------------ */

const TableWrap = styled.div`
  overflow-x: auto;
  background: var(--cp-surface);
  border: 1px solid var(--cp-line);
  border-radius: var(--cp-radius-md);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
`;

const Th = styled.th<{ $sortable?: boolean; $right?: boolean }>`
  text-align: ${(props) => (props.$right ? 'right' : 'left')};
  padding: 13px 16px;
  color: var(--cp-text-faint);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 1px solid var(--cp-line);
  background: var(--cp-surface);
  cursor: ${(props) => (props.$sortable ? 'pointer' : 'default')};
  user-select: none;
  &:hover {
    color: ${(props) => (props.$sortable ? 'var(--cp-text)' : 'var(--cp-text-faint)')};
  }
`;

const Td = styled.td<{ $right?: boolean; $num?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid var(--cp-line-faint);
  white-space: nowrap;
  text-align: ${(props) => (props.$right ? 'right' : 'left')};
  font-variant-numeric: ${(props) => (props.$num ? 'tabular-nums' : 'normal')};
  color: ${(props) => (props.$num ? 'var(--cp-text-soft)' : 'inherit')};
`;

const Rank = styled.span`
  font-family: var(--cp-mono);
  font-size: 0.85rem;
  color: var(--cp-text-dim);
`;

const Row = styled.tr<{ $selected: boolean }>`
  cursor: pointer;
  background: ${(props) => (props.$selected ? 'var(--cp-raised)' : 'transparent')};
  box-shadow: ${(props) =>
    props.$selected ? 'inset 2px 0 0 var(--cp-accent)' : 'none'};
  transition: background 0.12s ease;
  &:hover {
    background: var(--cp-raised);
  }
  &:last-child td {
    border-bottom: none;
  }
`;

const CoinCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
`;

const CoinIcon = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--cp-line);
  flex: none;
`;

const CoinName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Symbol = styled.span`
  color: var(--cp-text-faint);
  font-weight: 400;
  text-transform: uppercase;
  font-size: 0.85rem;
  margin-left: 2px;
`;

const Price = styled.span`
  font-weight: 600;
  color: var(--cp-text);
  font-variant-numeric: tabular-nums;
`;

const StarButton = styled.button<{ $watched?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: var(--cp-radius-sm);
  cursor: pointer;
  padding: 0;
  color: var(--cp-text-dim);
  transition:
    color 0.12s ease,
    background 0.12s ease;
  &:hover {
    background: var(--cp-raised);
    color: var(--cp-star);
  }
  svg {
    fill: ${(props) => (props.$watched ? 'var(--cp-star)' : 'none')};
    color: ${(props) =>
      props.$watched ? 'var(--cp-star)' : 'var(--cp-text-dim)'};
  }
`;

/* ------------------------------------------------------------------ */
/* States: skeleton at the table's own geometry, honest error/empty    */
/* ------------------------------------------------------------------ */

const SkeletonWrap = styled.div`
  padding: 8px 0;
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cp-line-faint);
  &:last-child {
    border-bottom: none;
  }
`;

const SkeletonBar = styled.span<{ $w: number; $h?: number; $round?: boolean }>`
  display: block;
  width: ${(props) => props.$w}px;
  height: ${(props) => props.$h ?? 12}px;
  border-radius: ${(props) => (props.$round ? '50%' : '6px')};
  background: linear-gradient(
    90deg,
    var(--cp-raised) 25%,
    var(--cp-chrome) 50%,
    var(--cp-raised) 75%
  );
  background-size: 400px 100%;
  animation: cp-shimmer 1.4s linear infinite;
  flex: none;
`;

const StateBox = styled.div`
  background: var(--cp-surface);
  border: 1px solid var(--cp-line);
  border-radius: var(--cp-radius-md);
  padding: 48px 24px;
  text-align: center;
  color: var(--cp-text-faint);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 13px;
  svg {
    color: var(--cp-text-dim);
  }
  strong {
    color: var(--cp-text);
    font-size: 1.05rem;
  }
  p {
    margin: 0;
    max-width: 52ch;
    line-height: 1.5;
  }
`;

const ErrorBox = styled(StateBox)`
  color: #fca5a5;
  border-color: #7f1d1d;
  svg {
    color: var(--cp-down);
  }
`;

const EmptyBox = styled(StateBox)`
  padding: 34px 24px;
`;

const Footer = styled.footer`
  margin-top: 34px;
  padding-top: 21px;
  border-top: 1px solid var(--cp-line-faint);
  color: var(--cp-text-dim);
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.6;
`;

const SORT_LABELS: Record<SortKey, string> = {
  market_cap_rank: '#',
  current_price: 'Price',
  price_change_percentage_24h: '24h %',
  market_cap: 'Market Cap',
};

function sortCoins(coins: Coin[], key: SortKey, direction: SortDirection): Coin[] {
  const sorted = [...coins];
  sorted.sort((a, b) => {
    const diff = a[key] - b[key];
    return direction === 'asc' ? diff : -diff;
  });
  return sorted;
}

export default function App() {
  const [currency, setCurrency] = useState<Currency>('usd');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('market_cap_rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  // Chart-scrub readout: the point under the pointer, or null for live.
  const [hoverPoint, setHoverPoint] = useState<ChartPoint | null>(null);

  const { ids: watchlistIds, toggle: toggleWatch, isWatched } = useWatchlist();
  const coinsQuery = useTopCoins(currency);
  const chartQuery = useCoinChart(selectedId, currency);

  // Auto-refresh countdown (data itself refreshes via TanStack Query's refetchInterval).
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_SECONDS : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const coins = coinsQuery.data ?? [];

  const gainers = useMemo(() => {
    return [...coins]
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 3);
  }, [coins]);

  const losers = useMemo(() => {
    return [...coins]
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 3);
  }, [coins]);

  const visibleCoins = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = coins;
    if (query) {
      filtered = filtered.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query),
      );
    }
    if (watchlistOnly) {
      filtered = filtered.filter((coin) => watchlistIds.includes(coin.id));
    }
    return sortCoins(filtered, sortKey, sortDirection);
  }, [coins, search, watchlistOnly, watchlistIds, sortKey, sortDirection]);

  const selectedCoin = coins.find((coin) => coin.id === selectedId) ?? null;

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'market_cap_rank' ? 'asc' : 'desc');
    }
  }

  function handleRefresh() {
    void coinsQuery.refetch();
    setCountdown(REFRESH_SECONDS);
  }

  function handleSelect(coinId: string) {
    setSelectedId((prev) => (prev === coinId ? null : coinId));
    setHoverPoint(null);
  }

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  const headlinePrice = hoverPoint
    ? hoverPoint.price
    : (selectedCoin?.current_price ?? 0);
  const headlineLabel = hoverPoint ? hoverPoint.time : 'Live price';

  return (
    <Page>
      <Container>
        <AppBar>
          <Wordmark>
            <Activity size={18} strokeWidth={2.5} />
            Crypto<Accent>Pulse</Accent>
          </Wordmark>
          <LivePill $busy={coinsQuery.isFetching}>
            {coinsQuery.isFetching ? (
              <SpinIcon $spin>
                <RefreshCw size={13} strokeWidth={2.5} />
              </SpinIcon>
            ) : (
              <LiveDot />
            )}
            {coinsQuery.isFetching
              ? 'Updating…'
              : `Live · refresh in ${countdown}s`}
          </LivePill>
        </AppBar>

        <Subtitle>
          Live top-100 cryptocurrencies by market cap, powered by the CoinGecko
          public API. Click a coin to see its 7-day price chart.
        </Subtitle>

        <Controls>
          <SearchWrap>
            <Search size={16} />
            <SearchInput
              type="search"
              placeholder="Search coins (e.g. bitcoin, eth)…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search coins"
            />
          </SearchWrap>
          <Segmented role="group" aria-label="Currency">
            <Segment
              $active={currency === 'usd'}
              onClick={() => setCurrency('usd')}
              aria-pressed={currency === 'usd'}
            >
              USD $
            </Segment>
            <Segment
              $active={currency === 'eur'}
              onClick={() => setCurrency('eur')}
              aria-pressed={currency === 'eur'}
            >
              EUR €
            </Segment>
          </Segmented>
          <Button
            $active={watchlistOnly}
            onClick={() => setWatchlistOnly((prev) => !prev)}
            aria-pressed={watchlistOnly}
          >
            <Star
              size={15}
              fill={watchlistOnly ? 'var(--cp-star)' : 'none'}
              color={watchlistOnly ? 'var(--cp-star)' : 'currentColor'}
            />
            Watchlist
            <CountBadge>{watchlistIds.length}</CountBadge>
          </Button>
          <Button onClick={handleRefresh} disabled={coinsQuery.isFetching}>
            <SpinIcon $spin={coinsQuery.isFetching}>
              <RefreshCw size={15} />
            </SpinIcon>
            {coinsQuery.isFetching ? 'Refreshing…' : 'Refresh now'}
          </Button>
        </Controls>

        {coinsQuery.isPending && (
          <TableWrap aria-busy="true" aria-label="Loading live prices">
            <SkeletonWrap>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <SkeletonRow key={i}>
                  <SkeletonBar $w={18} $h={12} />
                  <SkeletonBar $w={28} $h={28} $round />
                  <SkeletonBar $w={110 - (i % 3) * 18} />
                  <span style={{ flex: 1 }} />
                  <SkeletonBar $w={88 - (i % 2) * 20} />
                  <SkeletonBar $w={64} $h={22} />
                  <SkeletonBar $w={96 - (i % 3) * 14} />
                </SkeletonRow>
              ))}
            </SkeletonWrap>
          </TableWrap>
        )}

        {coinsQuery.isError && (
          <ErrorBox>
            <AlertTriangle size={28} />
            <strong>Couldn&apos;t load prices.</strong>
            <p>
              {coinsQuery.error instanceof Error
                ? coinsQuery.error.message
                : 'An unexpected error occurred.'}
            </p>
            <p>
              <Button onClick={handleRefresh}>Try again</Button>
            </p>
          </ErrorBox>
        )}

        {coinsQuery.isSuccess && coins.length > 0 && (
          <>
            {selectedCoin && (
              <ChartPanel>
                <ChartHeader>
                  <ChartIdentity>
                    <ChartIcon src={selectedCoin.image} alt="" />
                    <div>
                      <ChartTitle>
                        {selectedCoin.name}{' '}
                        <Symbol>{selectedCoin.symbol}</Symbol>
                      </ChartTitle>
                      <ChartSub>7-day price · CoinGecko</ChartSub>
                    </div>
                  </ChartIdentity>
                  <RangeLine>
                    24h range{' '}
                    <span>
                      {formatCurrency(selectedCoin.low_24h, currency)}
                    </span>{' '}
                    —{' '}
                    <span>
                      {formatCurrency(selectedCoin.high_24h, currency)}
                    </span>
                  </RangeLine>
                </ChartHeader>
                <Headline>
                  <HeadlinePrice>
                    {formatCurrency(headlinePrice, currency)}
                  </HeadlinePrice>
                  <ChangePill $up={selectedCoin.price_change_percentage_24h >= 0}>
                    {selectedCoin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp size={13} strokeWidth={2.5} />
                    ) : (
                      <TrendingDown size={13} strokeWidth={2.5} />
                    )}
                    {formatPercent(selectedCoin.price_change_percentage_24h)} · 24h
                  </ChangePill>
                  <HeadlineDate>{headlineLabel}</HeadlineDate>
                </Headline>
                {chartQuery.isError && (
                  <ErrorBox>
                    Couldn&apos;t load the chart:{' '}
                    {chartQuery.error instanceof Error
                      ? chartQuery.error.message
                      : 'An unexpected error occurred.'}
                  </ErrorBox>
                )}
                <CoinChart
                  coin={selectedCoin}
                  chart={chartQuery.data}
                  currency={currency}
                  isLoading={chartQuery.isPending}
                  onHoverPoint={setHoverPoint}
                />
              </ChartPanel>
            )}

            <Movers>
              <MoverCard>
                <MoverTitle>
                  <TrendingUp size={14} /> Top 24h gainers
                </MoverTitle>
                {gainers.map((coin) => (
                  <MoverRow key={coin.id}>
                    <MoverName>
                      {coin.name}
                      <span>{coin.symbol}</span>
                    </MoverName>
                    <ChangePill $up>
                      {formatPercent(coin.price_change_percentage_24h)}
                    </ChangePill>
                  </MoverRow>
                ))}
              </MoverCard>
              <MoverCard>
                <MoverTitle>
                  <TrendingDown size={14} /> Top 24h losers
                </MoverTitle>
                {losers.map((coin) => (
                  <MoverRow key={coin.id}>
                    <MoverName>
                      {coin.name}
                      <span>{coin.symbol}</span>
                    </MoverName>
                    <ChangePill $up={false}>
                      {formatPercent(coin.price_change_percentage_24h)}
                    </ChangePill>
                  </MoverRow>
                ))}
              </MoverCard>
            </Movers>

            {visibleCoins.length === 0 ? (
              <EmptyBox>
                <SearchX size={28} />
                <strong>No coins match your search</strong>
                <p>
                  {watchlistOnly
                    ? 'Nothing in your watchlist matches. Try a different search or clear the watchlist filter.'
                    : 'Try a different search.'}
                </p>
              </EmptyBox>
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th $sortable onClick={() => handleSort('market_cap_rank')}>
                        {SORT_LABELS.market_cap_rank}
                        {sortIndicator('market_cap_rank')}
                      </Th>
                      <Th>Coin</Th>
                      <Th $sortable $right onClick={() => handleSort('current_price')}>
                        {SORT_LABELS.current_price}
                        {sortIndicator('current_price')}
                      </Th>
                      <Th
                        $sortable
                        $right
                        onClick={() =>
                          handleSort('price_change_percentage_24h')
                        }
                      >
                        {SORT_LABELS.price_change_percentage_24h}
                        {sortIndicator('price_change_percentage_24h')}
                      </Th>
                      <Th $sortable $right onClick={() => handleSort('market_cap')}>
                        {SORT_LABELS.market_cap}
                        {sortIndicator('market_cap')}
                      </Th>
                      <Th $right>Watch</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCoins.map((coin) => (
                      <Row
                        key={coin.id}
                        $selected={coin.id === selectedId}
                        onClick={() => handleSelect(coin.id)}
                      >
                        <Td>
                          <Rank>{coin.market_cap_rank}</Rank>
                        </Td>
                        <Td>
                          <CoinCell>
                            <CoinIcon
                              src={coin.image}
                              alt=""
                              loading="lazy"
                            />
                            <CoinName>
                              {coin.name} <Symbol>{coin.symbol}</Symbol>
                            </CoinName>
                          </CoinCell>
                        </Td>
                        <Td $right>
                          <Price>
                            {formatCurrency(coin.current_price, currency)}
                          </Price>
                        </Td>
                        <Td $right>
                          <ChangePill
                            $up={coin.price_change_percentage_24h >= 0}
                          >
                            {formatPercent(coin.price_change_percentage_24h)}
                          </ChangePill>
                        </Td>
                        <Td $right $num>
                          {formatCompact(coin.market_cap, currency)}
                        </Td>
                        <Td $right>
                          <StarButton
                            $watched={isWatched(coin.id)}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleWatch(coin.id);
                            }}
                            aria-label={
                              isWatched(coin.id)
                                ? `Remove ${coin.name} from watchlist`
                                : `Add ${coin.name} to watchlist`
                            }
                            title={
                              isWatched(coin.id)
                                ? 'Remove from watchlist'
                                : 'Add to watchlist'
                            }
                          >
                            <Star size={17} />
                          </StarButton>
                        </Td>
                      </Row>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </>
        )}

        <Footer>
          Data: CoinGecko public API (free tier, no API key). Prices refresh
          every 60 seconds to respect rate limits.
        </Footer>
      </Container>
    </Page>
  );
}
