import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { CoinChart } from './components/CoinChart';
import { useCoinChart, useTopCoins } from './hooks/useCoins';
import { useWatchlist } from './hooks/useWatchlist';
import type { Coin, Currency, SortDirection, SortKey } from './types';
import { formatCompact, formatCurrency, formatPercent } from './utils/format';

const REFRESH_SECONDS = 60;

const Page = styled.div`
  min-height: 100vh;
  background: #0b0e14;
  color: #e6e9f0;
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
`;

const Container = styled.main`
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px 64px;
`;

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
`;

const Title = styled.h1`
  font-size: 1.9rem;
  margin: 0;
  letter-spacing: -0.02em;
`;

const Accent = styled.span`
  color: #38bdf8;
`;

const Subtitle = styled.p`
  color: #8b93a7;
  margin: 0 0 20px;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1 1 220px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #2a3142;
  background: #161b26;
  color: #e6e9f0;
  font-size: 0.95rem;
  outline: none;
  &:focus {
    border-color: #38bdf8;
  }
  &::placeholder {
    color: #6b7280;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #2a3142;
  background: #161b26;
  color: #e6e9f0;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
`;

const Button = styled.button<{ $active?: boolean }>`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid ${(props) => (props.$active ? '#38bdf8' : '#2a3142')};
  background: ${(props) => (props.$active ? '#0e2a3d' : '#161b26')};
  color: #e6e9f0;
  font-size: 0.95rem;
  cursor: pointer;
  &:hover {
    border-color: #38bdf8;
  }
`;

const RefreshInfo = styled.span`
  color: #8b93a7;
  font-size: 0.9rem;
  margin-left: auto;
`;

const Movers = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MoverCard = styled.div`
  background: #12161f;
  border: 1px solid #232a3a;
  border-radius: 12px;
  padding: 14px 16px;
`;

const MoverTitle = styled.h2`
  font-size: 0.95rem;
  margin: 0 0 8px;
  color: #c3c9d6;
`;

const MoverRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.92rem;
`;

const Change = styled.span<{ $up: boolean }>`
  color: ${(props) => (props.$up ? '#22c55e' : '#ef4444')};
  font-weight: 600;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  background: #12161f;
  border: 1px solid #232a3a;
  border-radius: 12px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
`;

const Th = styled.th<{ $sortable?: boolean }>`
  text-align: left;
  padding: 12px 14px;
  color: #8b93a7;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid #232a3a;
  cursor: ${(props) => (props.$sortable ? 'pointer' : 'default')};
  user-select: none;
  &:hover {
    color: ${(props) => (props.$sortable ? '#e6e9f0' : '#8b93a7')};
  }
`;

const Td = styled.td`
  padding: 11px 14px;
  border-bottom: 1px solid #1c2230;
  white-space: nowrap;
`;

const Row = styled.tr<{ $selected: boolean }>`
  cursor: pointer;
  background: ${(props) => (props.$selected ? '#182234' : 'transparent')};
  &:hover {
    background: #182234;
  }
`;

const CoinCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
`;

const CoinIcon = styled.img`
  width: 26px;
  height: 26px;
  border-radius: 50%;
`;

const Symbol = styled.span`
  color: #8b93a7;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 0.85rem;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 2px 4px;
  color: #facc15;
  line-height: 1;
`;

const ChartPanel = styled.section`
  margin-top: 16px;
  background: #12161f;
  border: 1px solid #232a3a;
  border-radius: 12px;
  padding: 16px;
`;

const ChartHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
`;

const ChartTitle = styled.h2`
  font-size: 1.15rem;
  margin: 0;
`;

const ChartMeta = styled.span`
  color: #8b93a7;
  font-size: 0.92rem;
`;

const StateBox = styled.div`
  background: #12161f;
  border: 1px solid #232a3a;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  color: #8b93a7;
`;

const ErrorBox = styled(StateBox)`
  color: #fca5a5;
  border-color: #7f1d1d;
`;

const EmptyBox = styled(StateBox)`
  padding: 32px 24px;
`;

const Footer = styled.footer`
  margin-top: 24px;
  color: #6b7280;
  font-size: 0.85rem;
  text-align: center;
`;

const SORT_LABELS: Record<SortKey, string> = {
  market_cap_rank: 'Rank',
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

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <Page>
      <Container>
        <Header>
          <Title>
            Crypto<Accent>Pulse</Accent>
          </Title>
        </Header>
        <Subtitle>
          Live top-100 cryptocurrencies by market cap, powered by the CoinGecko
          public API. Click a coin to see its 7-day price chart.
        </Subtitle>

        <Controls>
          <SearchInput
            type="search"
            placeholder="Search coins (e.g. bitcoin, eth)…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search coins"
          />
          <Select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            aria-label="Currency"
          >
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
          </Select>
          <Button
            $active={watchlistOnly}
            onClick={() => setWatchlistOnly((prev) => !prev)}
            aria-pressed={watchlistOnly}
          >
            ★ Watchlist ({watchlistIds.length})
          </Button>
          <Button onClick={handleRefresh} disabled={coinsQuery.isFetching}>
            {coinsQuery.isFetching ? 'Refreshing…' : 'Refresh now'}
          </Button>
          <RefreshInfo>
            Auto-refresh in {countdown}s · Updated{' '}
            {coinsQuery.dataUpdatedAt
              ? new Date(coinsQuery.dataUpdatedAt).toLocaleTimeString()
              : '—'}
          </RefreshInfo>
        </Controls>

        {coinsQuery.isPending && (
          <StateBox>Loading live prices from CoinGecko…</StateBox>
        )}

        {coinsQuery.isError && (
          <ErrorBox>
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
            <Movers>
              <MoverCard>
                <MoverTitle>Top 24h gainers</MoverTitle>
                {gainers.map((coin) => (
                  <MoverRow key={coin.id}>
                    <span>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                    <Change $up>
                      {formatPercent(coin.price_change_percentage_24h)}
                    </Change>
                  </MoverRow>
                ))}
              </MoverCard>
              <MoverCard>
                <MoverTitle>Top 24h losers</MoverTitle>
                {losers.map((coin) => (
                  <MoverRow key={coin.id}>
                    <span>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                    <Change $up={false}>
                      {formatPercent(coin.price_change_percentage_24h)}
                    </Change>
                  </MoverRow>
                ))}
              </MoverCard>
            </Movers>

            {visibleCoins.length === 0 ? (
              <EmptyBox>
                No coins match your search
                {watchlistOnly ? ' or watchlist filter' : ''}. Try a different
                search.
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
                      <Th $sortable onClick={() => handleSort('current_price')}>
                        {SORT_LABELS.current_price}
                        {sortIndicator('current_price')}
                      </Th>
                      <Th
                        $sortable
                        onClick={() =>
                          handleSort('price_change_percentage_24h')
                        }
                      >
                        {SORT_LABELS.price_change_percentage_24h}
                        {sortIndicator('price_change_percentage_24h')}
                      </Th>
                      <Th $sortable onClick={() => handleSort('market_cap')}>
                        {SORT_LABELS.market_cap}
                        {sortIndicator('market_cap')}
                      </Th>
                      <Th>Watch</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCoins.map((coin) => (
                      <Row
                        key={coin.id}
                        $selected={coin.id === selectedId}
                        onClick={() =>
                          setSelectedId((prev) =>
                            prev === coin.id ? null : coin.id,
                          )
                        }
                      >
                        <Td>{coin.market_cap_rank}</Td>
                        <Td>
                          <CoinCell>
                            <CoinIcon
                              src={coin.image}
                              alt=""
                              loading="lazy"
                            />
                            <span>
                              {coin.name} <Symbol>{coin.symbol}</Symbol>
                            </span>
                          </CoinCell>
                        </Td>
                        <Td>{formatCurrency(coin.current_price, currency)}</Td>
                        <Td>
                          <Change
                            $up={coin.price_change_percentage_24h >= 0}
                          >
                            {formatPercent(coin.price_change_percentage_24h)}
                          </Change>
                        </Td>
                        <Td>{formatCompact(coin.market_cap, currency)}</Td>
                        <Td>
                          <StarButton
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
                            {isWatched(coin.id) ? '★' : '☆'}
                          </StarButton>
                        </Td>
                      </Row>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}

            {selectedCoin && (
              <ChartPanel>
                <ChartHeader>
                  <ChartTitle>
                    {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()}) —
                    7-day price
                  </ChartTitle>
                  <ChartMeta>
                    {formatCurrency(selectedCoin.current_price, currency)} ·{' '}
                    <Change
                      $up={selectedCoin.price_change_percentage_24h >= 0}
                    >
                      {formatPercent(selectedCoin.price_change_percentage_24h)}{' '}
                      (24h)
                    </Change>
                  </ChartMeta>
                </ChartHeader>
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
                />
              </ChartPanel>
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
