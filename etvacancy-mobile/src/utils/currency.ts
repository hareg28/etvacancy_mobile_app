import type { SalaryPeriod } from '@/types/index';

export interface FormatCurrencyOptions {
  symbol?: string;
  noDecimals?: boolean;
  locale?: string;
}

export function formatCurrency(
  amount: number | null | undefined,
  optionsOrCurrency: string | FormatCurrencyOptions = 'ETB',
): string {
  if (amount == null) return 'Negotiable';

  const opts: FormatCurrencyOptions =
    typeof optionsOrCurrency === 'string' ? { symbol: optionsOrCurrency } : optionsOrCurrency;

  const symbol = opts.symbol ?? 'ETB';
  const locale = opts.locale ?? 'en-ET';
  const maxFractionDigits = opts.noDecimals ? 0 : undefined;

  try {
    if (symbol.length <= 3) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: symbol,
        maximumFractionDigits: maxFractionDigits ?? 0,
      }).format(amount);
    }
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: maxFractionDigits ?? 0,
    }).format(amount);
    return `${symbol} ${formatted}`;
  } catch {
    return `${symbol} ${amount.toLocaleString(locale)}`;
  }
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  period: SalaryPeriod = 'MONTHLY',
  currency = 'ETB',
): string {
  const periodLabel: Record<SalaryPeriod, string> = {
    HOURLY: '/hr',
    DAILY: '/day',
    WEEKLY: '/week',
    MONTHLY: '/mo',
    YEARLY: '/yr',
  };
  if (min == null && max == null) return 'Salary Negotiable';
  if (min != null && max != null) {
    return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)} ${periodLabel[period]}`;
  }
  if (min != null) return `From ${formatCurrency(min, currency)} ${periodLabel[period]}`;
  return `Up to ${formatCurrency(max!, currency)} ${periodLabel[period]}`;
}
