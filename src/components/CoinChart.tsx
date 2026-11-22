import { memo, useEffect, useMemo, useState } from 'react';
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
import { formatCompact, formatCurrency } from '../utils/format';

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
  box-shadow: var(--shadow, 0 8px 24px rgba(0, 0, 0, 0.45));
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
  /** `${style}-${mode}` — changing it re-reads chart colors from CSS vars. */
  themeKey: string;
  /** Chart-scrub readout: the point under the pointer, null when it leaves. */
  onHoverPoint: (point: ChartPoint | null) => void;
}

/** Read a theme token from the live CSS variables (spec §6). */
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Narrow viewport (≤640px): the Y axis shrinks and ticks go compact
    ("$90.12K") so the plot keeps most of the panel width. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 640px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
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
  themeKey,
  onHoverPoint,
}: CoinChartProps) {
  const points = useMemo(() => (chart ? buildPoints(chart) : []), [chart]);
  // Theme colors re-read from CSS vars whenever the theme changes; the
  // memo only re-renders when props (incl. themeKey) change.
  const colors = useMemo(
    () => ({
      up: cssVar('--cp-up', '#22c55e'),
      down: cssVar('--cp-down', '#f87171'),
      grid: cssVar('--cp-line', '#232a3a'),
      tick: cssVar('--cp-text-faint', '#7d8698'),
      axis: cssVar('--cp-line', '#232a3a'),
      cursor: cssVar('--cp-accent', '#38bdf8'),
      surface: cssVar('--cp-surface', '#0d1117'),
    }),
    [themeKey],
  );
  const up = coin.price_change_percentage_24h >= 0;
  const color = up ? colors.up : colors.down;
  const narrow = useNarrow();

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
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: colors.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
            minTickGap={48}
            tickFormatter={(value: string) => value.split(' ').slice(0, 2).join(' ')}
          />
          <YAxis
            tick={{ fill: colors.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) =>
              narrow
                ? formatCompact(value, currency)
                : formatCurrency(value, currency, { maximumFractionDigits: 2 })
            }
            width={narrow ? 62 : 90}
          />
          <Tooltip
            cursor={{
              stroke: colors.cursor,
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
              stroke: colors.surface,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
});
