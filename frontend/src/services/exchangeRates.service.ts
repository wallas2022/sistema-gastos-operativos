import { api } from '../shared/services/api';
import type { Currency } from './catalogs.service';

export type ExchangeRate = { id: string; fromCurrencyId: string; toCurrencyId: string; rate: string | number; effectiveDate: string; active: boolean; fromCurrency: Currency; toCurrency: Currency; createdAt: string; updatedAt: string };
export const exchangeRatesService = {
  list: async (): Promise<ExchangeRate[]> => (await api.get('/exchange-rates')).data,
  current: async (): Promise<ExchangeRate[]> => (await api.get('/exchange-rates/current')).data,
  create: async (payload: { fromCurrencyId: string; toCurrencyId: string; rate: string; effectiveDate: string }): Promise<ExchangeRate> => (await api.post('/exchange-rates', payload)).data,
  update: async (id: string, payload: { rate?: string; effectiveDate?: string; active?: boolean }): Promise<ExchangeRate> => (await api.patch(`/exchange-rates/${id}`, payload)).data,
};
