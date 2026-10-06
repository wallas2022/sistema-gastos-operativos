const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DocumentComplianceResult,
  DocumentStatus,
  SettlementBalanceStatus,
} = require('@prisma/client');
const {
  calculateBalance,
  canClose,
  canModifySettlement,
  isDocumentEligible,
} = require('../dist/src/modules/settlements/settlement-rules');

const base = {
  status: DocumentStatus.CONFIRMADO,
  fiscalCompanyId: 'company-a',
  settlementCompanyId: 'company-a',
  confirmedAt: new Date(),
  eligibleForSettlement: true,
  usedInSettlement: false,
  complianceResult: DocumentComplianceResult.VALIDACION_FISCAL_APROBADA,
  receiverType: 'EMPRESA',
};

test('liquidacion exacta queda cuadrada', () => assert.deepEqual(calculateBalance(5000, 5000, 0), { difference: 0, balanceStatus: SettlementBalanceStatus.CUADRADA }));
test('excedente con devolucion completa queda cuadrada', () => assert.equal(calculateBalance(5000, 4500, 500).balanceStatus, SettlementBalanceStatus.CUADRADA));
test('excedente sin devolucion queda pendiente', () => assert.deepEqual(calculateBalance(5000, 4500, 0), { difference: 500, balanceStatus: SettlementBalanceStatus.PENDIENTE_DEVOLUCION }));
test('devolucion parcial conserva diferencia', () => assert.deepEqual(calculateBalance(5000, 4500, 400), { difference: 100, balanceStatus: SettlementBalanceStatus.PENDIENTE_DEVOLUCION }));
test('gasto superior queda en exceso', () => assert.equal(calculateBalance(5000, 5500, 0).balanceStatus, SettlementBalanceStatus.EXCESO_DE_RENDICION));
test('comprobante rechazado no es elegible', () => assert.equal(isDocumentEligible({ ...base, eligibleForSettlement: false, complianceResult: DocumentComplianceResult.VALIDACION_FISCAL_RECHAZADA }), false));
test('comprobante CF no es elegible', () => assert.equal(isDocumentEligible({ ...base, receiverType: 'CONSUMIDOR_FINAL' }), false));
test('recibo permitido por politica es elegible', () => assert.equal(isDocumentEligible({ ...base, complianceResult: DocumentComplianceResult.DOCUMENTO_PERMITIDO_POR_POLITICA, receiverType: 'NO_IDENTIFICADO' }), true));
test('recibo sin politica no es elegible', () => assert.equal(isDocumentEligible({ ...base, complianceResult: DocumentComplianceResult.DOCUMENTO_NO_PERMITIDO }), false));
test('comprobante ya liquidado no es elegible', () => assert.equal(isDocumentEligible({ ...base, usedInSettlement: true }), false));
test('comprobante de otra empresa no es elegible', () => assert.equal(isDocumentEligible({ ...base, fiscalCompanyId: 'company-b' }), false));
test('comprobante sin solicitud directa puede ser elegible', () => assert.equal(isDocumentEligible(base), true));
test('comprobante no confirmado no es elegible', () => assert.equal(isDocumentEligible({ ...base, confirmedAt: null }), false));
test('observacion bloquea cierre', () => assert.equal(canClose({ approved: true, balanced: true, hasObservation: true, hasPendingRefund: false }), false));
test('sin aprobacion no puede cerrar', () => assert.equal(canClose({ approved: false, balanced: true, hasObservation: false, hasPendingRefund: false }), false));
test('solo aprobada y cuadrada puede cerrar', () => assert.equal(canClose({ approved: true, balanced: true, hasObservation: false, hasPendingRefund: false }), true));
test('devolucion en validacion queda auditivamente pendiente', () => assert.equal(calculateBalance(5000, 4500, 0, true).balanceStatus, SettlementBalanceStatus.DEVOLUCION_EN_VALIDACION));
test('liquidación cerrada no permite modificaciones normales', () => assert.equal(canModifySettlement('CERRADA'), false));
