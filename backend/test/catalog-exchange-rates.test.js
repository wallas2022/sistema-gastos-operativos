const test = require('node:test');
const assert = require('node:assert/strict');
const { CatalogService } = require('../dist/src/catalog/catalog.service');
const { ExchangeRatesService } = require('../dist/src/modules/exchange-rates/exchange-rates.service');

test('catálogo evita monedas duplicadas', async () => {
  const service = new CatalogService({ currency: { findUnique: async () => ({ id: 'usd', code: 'USD' }) } });
  await assert.rejects(() => service.createCurrency({ code: 'usd', name: 'Dólar', symbol: '$' }), /ya existe/);
});

test('catálogo activa y desactiva monedas mediante update', async () => {
  let saved;
  const prisma = { currency: { findUnique: async () => ({ id: 'usd' }), findFirst: async () => null, update: async ({ data }) => (saved = data) } };
  await new CatalogService(prisma).updateCurrency('usd', { active: false });
  assert.equal(saved.active, false);
});

test('tasa vigente selecciona una sola tasa histórica por par', async () => {
  const rows = [
    { id: 'new', fromCurrencyId: 'usd', toCurrencyId: 'gtq', effectiveDate: new Date('2026-08-08') },
    { id: 'old', fromCurrencyId: 'usd', toCurrencyId: 'gtq', effectiveDate: new Date('2026-07-01') },
    { id: 'eur', fromCurrencyId: 'eur', toCurrencyId: 'gtq', effectiveDate: new Date('2026-08-08') },
  ];
  const result = await new ExchangeRatesService({ exchangeRate: { findMany: async () => rows } }).current({ date: '2026-08-08' });
  assert.deepEqual(result.map((item) => item.id), ['new', 'eur']);
});

test('no permite una tasa entre la misma moneda', async () => {
  const service = new ExchangeRatesService({});
  await assert.rejects(() => service.create({ fromCurrencyId: 'usd', toCurrencyId: 'usd', rate: '1', effectiveDate: '2026-08-08' }, { id: 'admin' }), /monedas diferentes/);
});
