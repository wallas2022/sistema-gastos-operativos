const test = require('node:test');
const assert = require('node:assert/strict');
const { BudgetEngineService } = require('../dist/src/modules/budget/budget-engine.service');

function repository(monthly, annual, reserved = 0, executed = 0) { return {
  selectedLine: async () => ({ id: 'line', companyId: 'company', countryId: 'country', currency: 'GTQ', accountCode: '6.1', annualAmount: annual, version: { id: 'version', fiscalYear: 2026, active: true, status: 'ACTIVE', currency: { code: 'GTQ' } }, periods: [{ id: 'period', fiscalYear: 2026, month: 8, approvedAmount: monthly }] }),
  reservationTotals: async () => [{ status: 'RESERVED', _sum: { amount: reserved } }, { status: 'EXECUTED', _sum: { amount: executed } }],
  periodReservationTotals: async () => [{ status: 'RESERVED', _sum: { amount: reserved } }, { status: 'EXECUTED', _sum: { amount: executed } }],
}; }
const input = (amount, currency = 'GTQ') => ({ fiscalYear: 2026, month: 8, budgetLineId: 'line', budgetPeriodId: 'period', companyId: 'company', countryId: 'country', currency, amount });

test('presupuesto mensual y anual suficientes', async () => assert.equal((await new BudgetEngineService(repository('10000', '100000')).evaluate(input('7800'))).status, 'AVAILABLE'));
test('presupuesto mensual insuficiente conserva la regla actual', async () => assert.equal((await new BudgetEngineService(repository('5000', '100000')).evaluate(input('7800'))).status, 'PARTIAL'));
test('sin presupuesto mensual aunque exista anual no anticipa fondos', async () => assert.equal((await new BudgetEngineService(repository('0', '100000')).evaluate(input('7800'))).status, 'INSUFFICIENT'));
test('excedente anual no es aprobable', async () => assert.notEqual((await new BudgetEngineService(repository('200000', '100000')).evaluate(input('100001'))).status, 'AVAILABLE'));
test('el motor exige moneda presupuestaria', async () => assert.equal((await new BudgetEngineService(repository('10000', '100000')).evaluate(input('1000', 'USD'))).status, 'NO_APPLIES'));
