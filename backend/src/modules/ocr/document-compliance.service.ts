import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentComplianceResult, DocumentVoucherType, ExpenseType, FiscalCompanyIdentificationMethod, FiscalCompanyIdentificationStatus, FiscalReceiverType, PolicyField, PolicyResultStatus, RequestPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyEngineService } from '../policies/engine/policy-engine.service';

@Injectable()
export class DocumentComplianceService {
  constructor(private readonly prisma: PrismaService, private readonly policyEngine: PolicyEngineService, private readonly config: ConfigService) {}

  async evaluate(documentId: string, actor?: any, reviewed = false) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId }, include: { user: { select: { id: true, companyId: true, role: true } }, expenseRequest: { include: { company: { include: { country: true } } } }, ocrResult: { include: { extractedFields: true } } } });
    if (!document?.ocrResult) return null;
    const ocr = document.ocrResult;
    const voucherType = ocr.finalVoucherType || this.normalizeVoucherType(ocr.documentTypeDetected, ocr.extractedText);
    const taxField = this.field(ocr.extractedFields, 'buyer_nit', 'receiverTaxId');
    const nameField = this.field(ocr.extractedFields, 'buyer_name', 'receiverName');
    const tradeNameField = this.field(ocr.extractedFields, 'buyer_trade_name', 'receiverTradeName');
    const rawTaxId = taxField?.value || null;
    const rawName = nameField?.value || null;
    const consumerFinal = this.isConsumerFinal(rawTaxId, rawName, ocr.extractedText);
    const receiverTaxId = consumerFinal ? 'CF' : rawTaxId;
    const receiverName = consumerFinal ? 'CONSUMIDOR FINAL' : rawName;
    const receiverTradeName = consumerFinal ? null : tradeNameField?.value || null;
    const receiverType = consumerFinal ? FiscalReceiverType.CONSUMIDOR_FINAL : receiverTaxId ? FiscalReceiverType.EMPRESA : FiscalReceiverType.NO_IDENTIFICADO;
    const confidence = taxField?.confidence ?? null;
    const identificationMethod = [taxField, nameField, tradeNameField].some(field => field?.wasCorrected)
      ? FiscalCompanyIdentificationMethod.CORRECCION_MANUAL
      : FiscalCompanyIdentificationMethod.OCR;
    const matchedCompanies = receiverTaxId && !consumerFinal
      ? (await this.prisma.company.findMany({ where: { active: true, taxId: { not: null } }, include: { country: true } }))
          .filter(company => this.normalizeTaxId(company.taxId) === this.normalizeTaxId(receiverTaxId))
      : [];
    const detectedCompany = matchedCompanies.length === 1 ? matchedCompanies[0] : null;
    const company = detectedCompany;
    const nameWarning = detectedCompany && receiverName && !this.namesCompatible(receiverName, detectedCompany.legalName || detectedCompany.name)
      ? 'RAZON_SOCIAL_RECEPTOR_DIFIERE'
      : null;
    let result: DocumentComplianceResult, reason: string, appliedRule: string, policy: any = null;

    if (ocr.processStatus === 'ERROR_OCR') {
      result = DocumentComplianceResult.OCR_ERROR; reason = 'OCR_ERROR'; appliedRule = 'OCR_PROCESS_STATUS';
    } else if (voucherType === DocumentVoucherType.FACTURA) {
      appliedRule = 'FISCAL_RECEIVER_VALIDATION';
      const found = this.normalizeTaxId(receiverTaxId);
      const threshold = this.config.get<number>('ocr.fiscalNitMinConfidence') ?? 80;
      if (consumerFinal) { result = DocumentComplianceResult.VALIDACION_FISCAL_RECHAZADA; reason = 'FACTURA_CONSUMIDOR_FINAL'; }
      else if (!found) { result = DocumentComplianceResult.VALIDACION_FISCAL_PENDIENTE_REVISION; reason = 'NIT_NO_IDENTIFICADO'; }
      else if (matchedCompanies.length !== 1) { result = DocumentComplianceResult.VALIDACION_FISCAL_PENDIENTE_REVISION; reason = 'NIT_RECEPTOR_NO_REGISTRADO_MAESTRO'; }
      else if (confidence === null || confidence < threshold) { result = DocumentComplianceResult.VALIDACION_FISCAL_PENDIENTE_REVISION; reason = 'CONFIANZA_NIT_INSUFICIENTE'; }
      else { result = DocumentComplianceResult.VALIDACION_FISCAL_APROBADA; reason = 'NIT_RECEPTOR_COINCIDE'; }
    } else {
      appliedRule = 'POLICY_ENGINE_DOCUMENT_TYPE';
      const request = document.expenseRequest;
      const evaluation = await this.policyEngine.evaluate({ requestId: request?.id || document.id, amount: Number(request?.estimatedAmount || ocr.totalAmount || 0), companyId: company?.id || null, countryId: request?.countryId || company?.countryId || null, costCenter: request?.costCenter || '', budgetAccount: request?.budgetAccount || null, expenseType: request?.type || ExpenseType.OTRO, priority: request?.priority || RequestPriority.NORMAL, requesterRole: document.user.role || 'SOLICITANTE', destination: request?.destination || null, currency: request?.currency || ocr.currencyCode || company?.currencyId || '', days: request?.days || null, documentType: voucherType });
      policy = evaluation.results.find(item => item.field === PolicyField.DOCUMENT_TYPE && item.status === PolicyResultStatus.OK);
      if (policy) { result = DocumentComplianceResult.DOCUMENTO_PERMITIDO_POR_POLITICA; reason = 'DOCUMENTO_PERMITIDO_POR_POLITICA'; }
      else { result = DocumentComplianceResult.DOCUMENTO_NO_PERMITIDO; reason = 'DOCUMENTO_NO_PERMITIDO'; }
    }
    const allowed = result === DocumentComplianceResult.VALIDACION_FISCAL_APROBADA || result === DocumentComplianceResult.DOCUMENTO_PERMITIDO_POR_POLITICA;
    const decision = await this.prisma.$transaction(async tx => {
      await tx.oCRResult.update({ where: { id: ocr.id }, data: { detectedVoucherType: ocr.detectedVoucherType || voucherType, finalVoucherType: voucherType, receiverTaxId, receiverName, receiverTradeName, receiverType, fiscalCompanyId: detectedCompany?.id || null, fiscalCompanyTaxId: detectedCompany?.taxId || null, fiscalCompanyLegalName: detectedCompany?.legalName || detectedCompany?.name || null, fiscalCompanyTradeName: detectedCompany?.tradeName || null, fiscalCompanyIdentifiedAt: detectedCompany ? new Date() : null, fiscalCompanyIdentificationMethod: detectedCompany ? identificationMethod : null, fiscalCompanyIdentificationStatus: detectedCompany ? FiscalCompanyIdentificationStatus.EMPRESA_IDENTIFICADA : FiscalCompanyIdentificationStatus.EMPRESA_NO_IDENTIFICADA, fiscalCompanyWarning: nameWarning, complianceResult: result, complianceReason: reason, eligibleForSettlement: allowed && reviewed && !ocr.usedInSettlement } });
      return tx.oCRComplianceDecision.create({ data: { ocrResultId: ocr.id, documentType: voucherType, companyId: detectedCompany?.id || null, expectedTaxId: detectedCompany?.taxId || null, foundTaxId: receiverTaxId, receiverName, receiverType, receiverConfidence: confidence, appliedRule, appliedPolicyId: policy?.ruleId || null, appliedPolicyCode: policy?.code || null, appliedPolicyName: policy?.name || null, result, reason, actorUserId: actor?.id || null, actorName: actor?.name || actor?.email || 'SYSTEM' } });
    });
    return { ...decision, expectedTaxId: detectedCompany?.taxId || null, eligibleForSettlement: allowed && reviewed && !ocr.usedInSettlement };
  }

  private field(fields: any[], ...names: string[]) { const value = fields.find(field => names.includes(field.fieldName)); return value ? { value: value.finalValue ?? value.normalizedValue ?? value.detectedValue, confidence: value.confidence == null ? null : Number(value.confidence), wasCorrected: value.wasCorrected === true } : null; }
  private normalizeTaxId(value?: string | null) { return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null; }
  private namesCompatible(left: string, right: string) { const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\b(SOCIEDAD ANONIMA|S A|SA|LTDA|LIMITADA)\b/g, '').replace(/[^A-Z0-9]/g, ''); const a = normalize(left), b = normalize(right); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); }
  private isConsumerFinal(taxId?: string | null, name?: string | null, text?: string | null) { const values = [taxId, name].map(value => (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')); if (values.some(value => ['CF', 'CONSUMIDORFINAL', 'CONSUMIDORFINALCF'].includes(value))) return true; return /(?:CONSUMIDOR\s+FINAL(?:\s*\(?(?:C\/?F|CF)\)?)?|(?:^|\s)C\/?F(?:\s|$))/i.test(text || ''); }
  normalizeVoucherType(type?: string | null, text?: string | null): DocumentVoucherType { const source = `${type || ''} ${text || ''}`.toUpperCase(); if (/NOTA\s+DE\s+CREDITO|NOTA_CREDITO/.test(source)) return DocumentVoucherType.NOTA_DE_CREDITO; if (/NOTA\s+DE\s+DEBITO|NOTA_DEBITO/.test(source)) return DocumentVoucherType.NOTA_DE_DEBITO; if (/COMPROBANTE\s+DE\s+PAGO/.test(source)) return DocumentVoucherType.COMPROBANTE_DE_PAGO; if (/RECIBO/.test(source)) return DocumentVoucherType.RECIBO; if (/FACTURA|FEL|DTE/.test(source)) return DocumentVoucherType.FACTURA; return DocumentVoucherType.OTRO; }
}
