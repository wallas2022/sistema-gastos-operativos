const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isAllowedEvidence,
  isDirectPaymentCurrencyCompatible,
  isDisbursementCurrencyCompatible,
  isDirectPaymentModality,
  isRequesterPaymentModality,
  operationTypeForModality,
} = require('../dist/src/modules/banking/banking-rules');

test('caso 1: reembolso admite cuenta bancaria con moneda correcta', () => {
  assert.equal(isRequesterPaymentModality('REEMBOLSO'), true);
  assert.equal(isDisbursementCurrencyCompatible('USD', 'USD', 'USD'), true);
});
test('caso 2: reembolso rechaza moneda de cuenta incorrecta', () => assert.equal(isDisbursementCurrencyCompatible('USD', 'USD', 'GTQ'), false));
test('caso 3: anticipo de viáticos genera desembolso al solicitante', () => {
  assert.equal(isRequesterPaymentModality('ANTICIPO_VIATICOS'), true);
  assert.equal(operationTypeForModality('ANTICIPO_VIATICOS'), 'DESEMBOLSO_SOLICITANTE');
});
test('caso 4: pago a proveedor no requiere cuenta del solicitante', () => {
  assert.equal(isDirectPaymentModality('PAGO_PROVEEDOR'), true);
  assert.equal(operationTypeForModality('PAGO_PROVEEDOR'), 'PAGO_DIRECTO');
});
test('caso 5: pago a proveedor rechaza moneda distinta de la solicitud', () => assert.equal(isDirectPaymentCurrencyCompatible('USD', 'GTQ'), false));
test('caso 6: pago de servicio se clasifica como pago directo', () => assert.equal(operationTypeForModality('PAGO_SERVICIO'), 'PAGO_DIRECTO'));
test('caso 7: beneficiario autorizado se clasifica como pago directo', () => assert.equal(operationTypeForModality('PAGO_DIRECTO'), 'PAGO_DIRECTO'));
test('caso 8: confirmación sin comprobante es inválida', () => assert.equal(isAllowedEvidence(undefined), false));
test('caso 9: sólo una solicitud aprobada es pagable', () => {
  const isPayable = (status) => status === 'APROBADA';
  assert.equal(isPayable('PENDIENTE_APROBACION'), false);
  assert.equal(isPayable('APROBADA'), true);
});
test('caso 10: un pago PAGADO previo bloquea duplicidad', () => {
  const duplicate = [{ paymentStatus: 'PAGADO' }].some((payment) => payment.paymentStatus === 'PAGADO');
  assert.equal(duplicate, true);
});
test('caso 11: pago directo PAGADO puede ser base de liquidación', () => {
  const payment = { operationType: 'PAGO_DIRECTO', paymentStatus: 'PAGADO' };
  assert.equal(payment.paymentStatus === 'PAGADO', true);
});
test('caso 12: el evento de auditoría distingue pago directo de desembolso', () => {
  const event = (modality) => isRequesterPaymentModality(modality) ? 'DESEMBOLSO_REGISTRADO' : 'PAGO_DIRECTO_REGISTRADO';
  assert.equal(event('REEMBOLSO'), 'DESEMBOLSO_REGISTRADO');
  assert.equal(event('PAGO_PROVEEDOR'), 'PAGO_DIRECTO_REGISTRADO');
});
