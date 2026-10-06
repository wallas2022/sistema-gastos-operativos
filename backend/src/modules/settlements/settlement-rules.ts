import { DocumentComplianceResult, DocumentStatus, SettlementBalanceStatus } from '@prisma/client';

export type SettlementDocumentRuleInput = {
  status: DocumentStatus; fiscalCompanyId: string | null; settlementCompanyId: string | null;
  eligibleForSettlement: boolean; usedInSettlement: boolean;
  complianceResult: DocumentComplianceResult | null; receiverType?: string | null; confirmedAt?: Date | string | null;
};

export function calculateBalance(disbursed: number, documents: number, validatedRefund: number, refundInValidation = false) {
  const difference = Math.round((disbursed - documents - validatedRefund) * 100) / 100;
  const balanceStatus = documents > disbursed
    ? SettlementBalanceStatus.EXCESO_DE_RENDICION
    : difference === 0
      ? SettlementBalanceStatus.CUADRADA
      : refundInValidation
        ? SettlementBalanceStatus.DEVOLUCION_EN_VALIDACION
        : SettlementBalanceStatus.PENDIENTE_DEVOLUCION;
  return { difference, balanceStatus };
}

export function isDocumentEligible(input: SettlementDocumentRuleInput) {
  if (!input.fiscalCompanyId || input.fiscalCompanyId !== input.settlementCompanyId || input.usedInSettlement || !input.eligibleForSettlement || !input.confirmedAt) return false;
  const eligibleStatuses: DocumentStatus[] = [DocumentStatus.CONFIRMADO, DocumentStatus.ASOCIADO_SOLICITUD];
  if (!eligibleStatuses.includes(input.status)) return false;
  if (input.receiverType === 'CONSUMIDOR_FINAL') return false;
  const eligibleResults: DocumentComplianceResult[] = [
    DocumentComplianceResult.VALIDACION_FISCAL_APROBADA,
    DocumentComplianceResult.DOCUMENTO_PERMITIDO_POR_POLITICA,
  ];
  return input.complianceResult !== null && eligibleResults.includes(input.complianceResult);
}

export function canModifySettlement(status: string) {
  return status === 'BORRADOR' || status === 'OBSERVADA';
}

export function canClose(input: { approved: boolean; balanced: boolean; hasObservation: boolean; hasPendingRefund: boolean }) {
  return input.approved && input.balanced && !input.hasObservation && !input.hasPendingRefund;
}
