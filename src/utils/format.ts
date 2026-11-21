export function formatCurrency(
  value: number,
  currency: 'usd' | 'eur',
  options?: { maximumFractionDigits?: number },
): string {
  const fractionDigits =
    options?.maximumFractionDigits ??
    (value >= 1000 ? 2 : value >= 1 ? 2 : 4);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatCompact(value: number, currency: 'usd' | 'eur'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
