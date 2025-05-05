/**
 * Format a number as currency
 * @param value The number to format
 * @param locale The locale to use (defaults to 'en-US')
 * @param currency The currency to use (defaults to 'USD')
 */
export function formatCurrency(
  value: number,
  locale = 'en-US',
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value The number to format (0-1)
 * @param locale The locale to use (defaults to 'en-US')
 * @param digits The number of digits after the decimal point
 */
export function formatPercentage(
  value: number,
  locale = 'en-US',
  digits = 1
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Format a date
 * @param date The date to format
 * @param locale The locale to use (defaults to 'en-US')
 */
export function formatDate(
  date: Date,
  locale = 'en-US'
): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
