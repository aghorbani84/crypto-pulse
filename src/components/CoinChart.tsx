import { memo, useMemo } from 'react';
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
  margin-top: 13px;
  animation: cp-rise 0.4s ease both;
  /* The plot reads as a crosshair surface, as charting apps show it. */
  cursor: crosshair;
  /* Recharts draws its own svg; keep the tooltip above the grid. */
  .recharts-tooltip-wrapper {
    outline: none;
  }
`;

const ChartEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
  margin-top: 13px;
  color: var(--cp-text-faint);
  font-size: 0.95rem;
  background: var(--cp-well);
  border: 1px dashed var(--cp-line);
  border-radius: var(--cp-radius-md);
`;

const TooltipBox = styled.div`
  background: var(--cp-raised);
  border: 1px solid var(--cp-line);
  border-radius: var(--cp-radius-sm);
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--cp-text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
`;

const TooltipDate = styled.div`
  color: var(--cp-text-faint);
  font-size: 0.78rem;
  margin-bottom: 2px;
`;

const TooltipPrice = styled.div`
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

interface CoinChartProps {
  coin: Coin;
  chart: MarketChart | undefined;
  currency: Currency;
  isLoading: boolean;
  /** Chart-scrub readout: the point under the pointer, null when it leaves. */
  onHoverPoint: (point: ChartPoint | null) => void;
}

function buildPoints(chart: MarketChart): ChartPoint[] {
  return chart.prices.map(([timestamp, price]) => {
    const date = new Date(timestamp);
    // Unique per point: the day label alone repeats 24×, and recharts'
    // tooltip resolves a category to its FIRST point — so a hover over
    // "Nov 18" 22:00 read out the 00:00 value. The hour keeps every
    // category distinct; the axis and tooltip render the day part.
    const day = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const hour = String(date.getHours()).padStart(2, '0');
    return { time: `${day} ${hour}:00`, price };
  });
}

/* Memoized: the chart must not re-render while the pointer scrubs it.
   The scrub readout lives in App state; re-rendering the AreaChart on
   every mousemove froze recharts' own tooltip/dot one step behind the
   pointer. Props are stable across hovers (setHoverPoint is a stable
   setter), so memo skips those renders entirely. */
export const CoinChart = memo(function CoinChart({
  coin,
  chart,
  currency,
  isLoading,
  onHoverPoint,
}: CoinChartProps) {
  const points = useMemo(() => (chart ? buildPoints(chart) : []), [chart]);
  const up = coin.price_change_percentage_24h >= 0;
  const color = up ? '#22c55e' : '#f87171';

  if (isLoading) {
    return <ChartEmpty>Loading 7-day chart…</ChartEmpty>;
  }
  if (!chart || points.length === 0) {
    return <ChartEmpty>No chart data available for {coin.name}.</ChartEmpty>;
  }

  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          onMouseMove={(state) => {
            // recharts v3 reports the active tick as a string index.
            const index = Number(state?.activeTooltipIndex);
            onHoverPoint(
              Number.isInteger(index) && index >= 0 && index < points.length
                ? points[index]!
                : null,
            );
          }}
          onMouseLeave={() => onHoverPoint(null)}
        >
          <defs>
            <linearGradient id="cp-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1a2130" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#7d8698', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#232a3a' }}
            minTickGap={48}
            tickFormatter={(value: string) => value.split(' ').slice(0, 2).join(' ')}
          />
          <YAxis
            tick={{ fill: '#7d8698', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) =>
              formatCurrency(value, currency, { maximumFractionDigits: 2 })
            }
            width={90}
          />
          <Tooltip
            cursor={{
              stroke: '#38bdf8',
              strokeOpacity: 0.4,
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as ChartPoint;
              return (
                <TooltipBox>
                  <TooltipDate>{point.time}</TooltipDate>
                  <TooltipPrice>
                    {formatCurrency(point.price, currency)}
                  </TooltipPrice>
                </TooltipBox>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#cp-area-fill)"
            activeDot={{
              r: 4,
              fill: color,
              stroke: '#0d1117',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
});
