export function isDisbursementCurrencyCompatible(requestCurrencyId: string, paymentCurrencyId: string, accountCurrencyId: string) {
  return requestCurrencyId === paymentCurrencyId && paymentCurrencyId === accountCurrencyId;
}

export function isAllowedEvidence(mimeType?: string) {
  return !!mimeType && ['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType);
}

export function isAllowedRefundMethod(method: string) {
  return method === 'TRANSFERENCIA' || method === 'DEPOSITO';
}

export const REQUESTER_PAYMENT_MODALITIES = ['REEMBOLSO', 'ANTICIPO_VIATICOS'] as const;
export const DIRECT_PAYMENT_MODALITIES = ['PAGO_PROVEEDOR', 'PAGO_SERVICIO', 'PAGO_DIRECTO'] as const;

export function isRequesterPaymentModality(modality: string) {
  return REQUESTER_PAYMENT_MODALITIES.includes(modality as (typeof REQUESTER_PAYMENT_MODALITIES)[number]);
}

export function isDirectPaymentModality(modality: string) {
  return DIRECT_PAYMENT_MODALITIES.includes(modality as (typeof DIRECT_PAYMENT_MODALITIES)[number]);
}

export function operationTypeForModality(modality: string) {
  return isRequesterPaymentModality(modality) ? 'DESEMBOLSO_SOLICITANTE' : 'PAGO_DIRECTO';
}

export function isDirectPaymentCurrencyCompatible(requestCurrencyId: string, paymentCurrencyId: string) {
  return requestCurrencyId === paymentCurrencyId;
}
