import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styled from 'styled-components';
import type { ChartPoint, Coin, Currency, MarketChart } from '../types';
import { formatCurrency } from '../utils/format';

const ChartWrap = styled.div`
  width: 100%;
  height: 280px;
`;

const ChartEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
  color: #8b93a7;
  font-size: 0.95rem;
`;

const TooltipBox = styled.div`
  background: #161b26;
  border: 1px solid #2a3142;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #e6e9f0;
`;

interface CoinChartProps {
  coin: Coin;
  chart: MarketChart | undefined;
  currency: Currency;
  isLoading: boolean;
}

function buildPoints(chart: MarketChart): ChartPoint[] {
  return chart.prices.map(([timestamp, price]) => ({
    time: new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    price,
  }));
}

export function CoinChart({ coin, chart, currency, isLoading }: CoinChartProps) {
  const points = useMemo(() => (chart ? buildPoints(chart) : []), [chart]);
  const up = coin.price_change_percentage_24h >= 0;
  const color = up ? '#22c55e' : '#ef4444';

  if (isLoading) {
    return <ChartEmpty>Loading 7-day chart…</ChartEmpty>;
  }
  if (!chart || points.length === 0) {
    return <ChartEmpty>No chart data available for {coin.name}.</ChartEmpty>;
  }

  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#232a3a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#8b93a7', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2a3142' }}
            minTickGap={48}
          />
          <YAxis
            tick={{ fill: '#8b93a7', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) =>
              formatCurrency(value, currency, { maximumFractionDigits: 2 })
            }
            width={90}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as ChartPoint;
              return (
                <TooltipBox>
                  <div>{point.time}</div>
                  <div>
                    <strong>{formatCurrency(point.price, currency)}</strong>
                  </div>
                </TooltipBox>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.15}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
}
