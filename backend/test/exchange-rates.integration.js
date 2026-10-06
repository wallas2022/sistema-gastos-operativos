const { PrismaClient } = require('@prisma/client');
const { ExchangeRatesService } = require('../dist/src/modules/exchange-rates/exchange-rates.service');

async function run() {
  const prisma = new PrismaClient();
  let id;
  try {
    const currencies = await prisma.currency.findMany({ where: { code: { in: ['USD', 'GTQ'] } } });
    const usd = currencies.find((item) => item.code === 'USD'), gtq = currencies.find((item) => item.code === 'GTQ');
    if (!usd || !gtq) throw new Error('Faltan USD o GTQ en el catálogo.');
    const service = new ExchangeRatesService(prisma);
    const created = await service.create({ fromCurrencyId: usd.id, toCurrencyId: gtq.id, rate: '7.8123456789', effectiveDate: '2099-01-01' }, { id: 'integration-test', name: 'Prueba automatizada' });
    id = created.id;
    const updated = await service.update(id, { rate: '7.9000000000', active: false }, { id: 'integration-test', name: 'Prueba automatizada' });
    const stored = await prisma.exchangeRate.findUnique({ where: { id }, include: { audits: true } });
    if (!stored || stored.active || stored.audits.length !== 2 || updated.rate.toString() !== '7.9') throw new Error('Persistencia o auditoría de tasa inconsistente.');
    console.log(JSON.stringify({ created: created.rate.toString(), updated: updated.rate.toString(), active: stored.active, audits: stored.audits.length }));
  } finally {
    if (id) await prisma.exchangeRate.delete({ where: { id } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
