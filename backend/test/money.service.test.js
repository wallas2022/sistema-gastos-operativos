const test = require('node:test');
const assert = require('node:assert/strict');
const { MoneyService } = require('../dist/src/modules/exchange-rates/money.service');

const ids = { USD: 'usd', GTQ: 'gtq', EUR: 'eur' };
function service(rate) { return new MoneyService({ exchangeRate: { findFirst: async () => rate == null ? null : { id: 'rate-id', rate } } }); }

test('misma moneda usa tasa 1 y no consulta una tasa externa', async () => {
  let queried = false;
  const money = new MoneyService({ exchangeRate: { findFirst: async () => { queried = true; } } });
  const result = await money.convert('5000.00', ids.GTQ, ids.GTQ, new Date('2026-08-08'));
  assert.equal(result.exchangeRate.toString(), '1'); assert.equal(result.budgetAmount.toFixed(2), '5000.00'); assert.equal(result.exchangeRateId, null); assert.equal(queried, false);
});

for (const scenario of [
  ['USD → GTQ', '1000', ids.USD, ids.GTQ, '7.8', '7800.00'],
  ['GTQ → USD', '7800', ids.GTQ, ids.USD, '0.1282051282', '1000.00'],
  ['EUR → GTQ', '1000', ids.EUR, ids.GTQ, '8.45', '8450.00'],
]) test(scenario[0], async () => {
  const result = await service(scenario[4]).convert(scenario[1], scenario[2], scenario[3], new Date('2026-08-08'));
  assert.equal(result.budgetAmount.toFixed(2), scenario[5]); assert.equal(result.exchangeRate.toString(), scenario[4]);
});

test('redondea HALF_UP a dos decimales', async () => assert.equal((await service('7.805').convert('1', ids.USD, ids.GTQ, new Date('2026-08-08'))).budgetAmount.toFixed(2), '7.81'));
test('falla si no existe una tasa vigente', async () => assert.rejects(() => service(null).convert('100', ids.USD, ids.GTQ, new Date('2026-08-08')), /No existe una tasa/));
