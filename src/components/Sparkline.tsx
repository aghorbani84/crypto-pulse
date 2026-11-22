import { useMemo } from 'react';

/**
 * 7-day sparkline drawn from the coin's real `sparkline_in_7d.price`
 * array (CoinGecko, one request — no extra network call). Pure inline SVG,
 * no assets; stroke follows the active theme's up/down token via CSS var.
 */
interface SparklineProps {
  prices: number[] | undefined;
  up: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({ prices, up, width = 96, height = 28 }: SparklineProps) {
  const points = useMemo(() => {
    if (!prices || prices.length < 2) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    // Downsample to at most 48 points so the path stays small.
    const step = Math.max(1, Math.floor(prices.length / 48));
    const sampled: number[] = [];
    for (let i = 0; i < prices.length; i += step) sampled.push(prices[i]!);
    if (sampled[sampled.length - 1] !== prices[prices.length - 1]) {
      sampled.push(prices[prices.length - 1]!);
    }
    return sampled
      .map((p, i) => {
        const x = (i / (sampled.length - 1)) * (width - 2) + 1;
        const y = height - 2 - ((p - min) / range) * (height - 4);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [prices, width, height]);

  if (!points) {
    return (
      <span style={{ color: 'var(--cp-text-dim)', fontSize: '0.85rem' }}>—</span>
    );
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: 'block', marginLeft: 'auto' }}
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: up ? 'var(--cp-up)' : 'var(--cp-down)' }}
      />
    </svg>
  );
}
