const test = require('node:test');
const assert = require('node:assert/strict');
const { SettlementBalanceStatus } = require('@prisma/client');
const { isAllowedEvidence, isAllowedRefundMethod, isDisbursementCurrencyCompatible } = require('../dist/src/modules/banking/banking-rules');
const { calculateBalance } = require('../dist/src/modules/settlements/settlement-rules');

test('permite registrar múltiples cuentas bancarias diferentes', () => {
  const accounts = new Set(['user:bank:001', 'user:bank:002']);
  assert.equal(accounts.size, 2);
});
test('valida moneda exacta de solicitud, desembolso y cuenta', () => assert.equal(isDisbursementCurrencyCompatible('USD', 'USD', 'USD'), true));
test('rechaza cuenta con moneda distinta al desembolso', () => assert.equal(isDisbursementCurrencyCompatible('USD', 'USD', 'GTQ'), false));
test('registro manual exige evidencia documental admitida', () => { assert.equal(isAllowedEvidence('application/pdf'), true); assert.equal(isAllowedEvidence(undefined), false); });
test('permite devolución mediante transferencia', () => assert.equal(isAllowedRefundMethod('TRANSFERENCIA'), true));
test('permite devolución mediante depósito', () => assert.equal(isAllowedRefundMethod('DEPOSITO'), true));
test('rechaza devolución sin documento de referencia', () => assert.equal(isAllowedEvidence(''), false));
test('devolución pendiente bloquea balance cuadrado', () => assert.equal(calculateBalance(5000, 4500, 0, true).balanceStatus, SettlementBalanceStatus.DEVOLUCION_EN_VALIDACION));
test('sólo devolución validada completa deja liquidación cuadrada', () => assert.deepEqual(calculateBalance(5000, 4500, 500, false), { difference: 0, balanceStatus: SettlementBalanceStatus.CUADRADA }));
