const ISO_CURRENCY = /^[A-Z]{3}$/;

export function normalizeCurrencyCode(value: unknown, fallback = 'GTQ'): string {
  const code = String(value ?? '').trim().toUpperCase();
  return ISO_CURRENCY.test(code) ? code : fallback;
}

export function formatMoney(value: unknown, currency: unknown, locale = 'es-GT'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: normalizeCurrencyCode(currency) }).format(Number(value || 0));
}

