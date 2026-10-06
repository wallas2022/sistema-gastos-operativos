import { authorizedCompanyId, ocrDocumentWhere } from '../auth/permissions.util';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentComplianceResult, DocumentStatus, PaymentMethod, Prisma, SettlementBalanceStatus, SettlementRefundStatus, SettlementStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MoneyService } from '../exchange-rates/money.service';
import { StorageService } from '../documents/storage/storage.service';
import { ApprovalEngineService } from '../approval/approval-engine.service';
import { PolicyEngineService } from '../policies/engine/policy-engine.service';
import { CreateSettlementDto, CreateSettlementRefundDto, ListSettlementsDto } from './dto/settlement.dto';
import { calculateBalance } from './settlement-rules';
import { isAllowedEvidence, isAllowedRefundMethod } from '../banking/banking-rules';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly money: MoneyService,
    private readonly storage: StorageService,
    private readonly policyEngine: PolicyEngineService,
    private readonly approvalEngine: ApprovalEngineService,
  ) {}

  async list(query: ListSettlementsDto, user: any) {
    const ownOnly = !['ADMIN', 'FINANZAS', 'TESORERIA', 'GERENTE'].includes(user.role);
    return this.prisma.expenseSettlement.findMany({
      where: {
        preparedByUserId: ownOnly ? user.id : query.requesterId || undefined,
        companyId: authorizedCompanyId(user, query.companyId, ''),
        status: query.status as SettlementStatus || undefined,
        code: query.code ? { contains: query.code, mode: 'insensitive' } : undefined,
        expenseRequest: query.request ? { code: { contains: query.request, mode: 'insensitive' } } : undefined,
        createdAt: query.from || query.to ? { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined } : undefined,
      },
      include: this.summaryInclude(), orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateSettlementDto, user: any) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id: dto.expenseRequestId }, include: { company: true, payments: true },
    });
    if (!request) throw new NotFoundException('La solicitud no existe.');
    this.assertOwnerOrPrivileged(request.requesterId, user, request.companyId);
    const payment = request.payments.find((candidate) => candidate.id === dto.paymentId);
    if (!payment || payment.paymentStatus !== 'PAGADO') throw new BadRequestException('Debe seleccionar una ejecuciÃ³n financiera PAGADA de la solicitud.');
    const existing = await this.prisma.expenseSettlement.findUnique({ where: { expenseRequestId: request.id } });
    if (existing) throw new BadRequestException(`La solicitud ya tiene la liquidaciÃ³n ${existing.code}.`);
    const year = new Date().getFullYear();
    let settlement;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        settlement = await this.prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`settlement-number-${year}`}))`;
          const duplicate = await tx.expenseSettlement.findUnique({ where: { expenseRequestId: request.id } });
          if (duplicate) throw new BadRequestException(`La solicitud ya tiene la liquidaciÃ³n ${duplicate.code}.`);
          const count = await tx.expenseSettlement.count({ where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } } });
          const code = `LIQ-${year}-${String(count + 1).padStart(5, '0')}`;
          const amount = new Prisma.Decimal(payment.amountPaid);
          return tx.expenseSettlement.create({ data: { code, expenseRequestId: request.id, paymentId: payment.id, companyId: request.companyId, preparedByUserId: user.id, currencyId: payment.currencyId, disbursedAmount: amount, differenceAmount: amount, balanceStatus: SettlementBalanceStatus.PENDIENTE_DEVOLUCION,
            audits: { create: this.auditData('CREACION', null, SettlementStatus.BORRADOR, `LiquidaciÃ³n creada para ${request.code}.`, user, { paymentId: payment.id, disbursedAmount: amount.toString() }) } } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        break;
      } catch (error: any) {
        if (error?.code !== 'P2034' || attempt === 7) throw error;
      }
    }
    return this.get(settlement.id, user);
  }

  async eligibleDocuments(settlementId: string, user: any) {
    const settlement = await this.getInternal(settlementId);
    this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId);
    if (!settlement.companyId) throw new BadRequestException('La liquidaciÃ³n no tiene una empresa configurada.');
    const documents = await this.prisma.document.findMany({
      where: { AND: [ocrDocumentWhere(user)], status: { in: [DocumentStatus.CONFIRMADO, DocumentStatus.ASOCIADO_SOLICITUD] }, settlementItem: null,
        ocrResult: { eligibleForSettlement: true, usedInSettlement: false, confirmedAt: { not: null }, fiscalCompanyId: settlement.companyId, fiscalCompanyIdentificationStatus: 'EMPRESA_IDENTIFICADA', complianceResult: { in: [DocumentComplianceResult.VALIDACION_FISCAL_APROBADA, DocumentComplianceResult.DOCUMENTO_PERMITIDO_POR_POLITICA] } } },
      include: { ocrResult: { include: { fiscalCompany: true, extractedFields: true, complianceDecisions: { orderBy: { createdAt: 'desc' }, take: 1 } } } }, orderBy: { createdAt: 'desc' },
    });
    return documents.map(document => ({ ...document, sizeBytes: Number(document.sizeBytes) }));
  }

  async eligibleDocumentsByRequest(requestId: string, user: any) {
    const settlement = await this.prisma.expenseSettlement.findUnique({ where: { expenseRequestId: requestId } });
    if (!settlement) throw new NotFoundException('La solicitud todavÃ­a no tiene una liquidaciÃ³n.');
    return this.eligibleDocuments(settlement.id, user);
  }

  async get(id: string, user: any) {
    const settlement = await this.prisma.expenseSettlement.findUnique({ where: { id }, include: this.detailInclude() });
    if (!settlement) throw new NotFoundException('LiquidaciÃ³n no encontrada.');
    this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId);
    return {
      ...settlement,
      documents: settlement.documents.map((item) => ({
        ...item,
        document: { ...item.document, sizeBytes: Number(item.document.sizeBytes) },
      })),
      refunds: settlement.refunds.map((refund) => ({
        ...refund,
        evidenceDocument: refund.evidenceDocument
          ? { ...refund.evidenceDocument, sizeBytes: Number(refund.evidenceDocument.sizeBytes) }
          : null,
      })),
    };
  }

  async selectDocument(id: string, documentId: string, user: any) {
    const settlement = await this.getMutable(id, user);
    const document = await this.prisma.document.findFirst({ where: { AND: [{ id: documentId }, ocrDocumentWhere(user)] }, include: { ocrResult: true, settlementItem: true } });
    if (!document) throw new NotFoundException('El documento no existe.');
    const ocr = document.ocrResult;
    if (document.settlementItem || ocr?.usedInSettlement) throw new BadRequestException('Este documento ya estÃ¡ asociado a una liquidaciÃ³n.');
    const selectableStatuses: DocumentStatus[] = [DocumentStatus.CONFIRMADO, DocumentStatus.ASOCIADO_SOLICITUD];
    if (!ocr || !ocr.confirmedAt || !ocr.eligibleForSettlement || !selectableStatuses.includes(document.status)) throw new BadRequestException('El documento debe estar procesado, revisado y confirmado antes de incorporarlo a una liquidaciÃ³n.');
    if (!ocr.fiscalCompanyId || ocr.fiscalCompanyIdentificationStatus !== 'EMPRESA_IDENTIFICADA') throw new BadRequestException('El documento no tiene una empresa fiscal identificada.');
    if (ocr.fiscalCompanyId !== settlement.companyId) throw new BadRequestException('El documento pertenece fiscalmente a una empresa diferente a la solicitud.');
    if (![DocumentComplianceResult.VALIDACION_FISCAL_APROBADA, DocumentComplianceResult.DOCUMENTO_PERMITIDO_POR_POLITICA].includes(ocr.complianceResult as any)) throw new BadRequestException('El comprobante no cuenta con validaciÃ³n fiscal o autorizaciÃ³n por polÃ­tica.');
    if (!ocr.totalAmount || !ocr.currencyCode) throw new BadRequestException('El comprobante no tiene total o moneda confirmados.');
    const currency = await this.prisma.currency.findUnique({ where: { code: ocr.currencyCode } });
    if (!currency) throw new BadRequestException(`La moneda ${ocr.currencyCode} no estÃ¡ configurada.`);
    await this.prisma.$transaction(async (tx) => {
      const reserved = await tx.oCRResult.updateMany({ where: { id: ocr.id, eligibleForSettlement: true, usedInSettlement: false }, data: { usedInSettlement: true } });
      if (reserved.count !== 1) throw new BadRequestException('El comprobante fue seleccionado simultÃ¡neamente en otra liquidaciÃ³n.');
      const conversion = await this.money.convert(ocr.totalAmount!, currency.id, settlement.currencyId, document.createdAt, tx);
      await tx.expenseSettlementDocument.create({ data: { settlementId: id, documentId, selectedByUserId: user.id, originalAmount: conversion.originalAmount, originalCurrencyId: currency.id, exchangeRate: conversion.exchangeRate, exchangeRateId: conversion.exchangeRateId, settlementCurrencyAmount: conversion.budgetAmount } });
      await tx.settlementAudit.create({ data: { settlementId: id, ...this.auditData('SELECCION_COMPROBANTE', settlement.status, settlement.status, `Comprobante ${document.fileName} seleccionado.`, user, { documentId, originalAmount: conversion.originalAmount.toString(), exchangeRate: conversion.exchangeRate.toString(), settlementAmount: conversion.budgetAmount.toString() }) } as any });
    });
    await this.recalculate(id);
    return this.get(id, user);
  }

  async removeDocument(id: string, documentId: string, user: any) {
    const settlement = await this.getMutable(id, user);
    const item = await this.prisma.expenseSettlementDocument.findFirst({ where: { settlementId: id, documentId }, include: { document: true } });
    if (!item) throw new NotFoundException('El comprobante no forma parte de la liquidaciÃ³n.');
    await this.prisma.$transaction([
      this.prisma.expenseSettlementDocument.delete({ where: { documentId } }),
      this.prisma.oCRResult.update({ where: { documentId }, data: { usedInSettlement: false } }),
      this.prisma.settlementAudit.create({ data: { settlementId: id, ...this.auditData('RETIRO_COMPROBANTE', settlement.status, settlement.status, `Comprobante ${item.document.fileName} retirado.`, user, { documentId }) } as any }),
    ]);
    await this.recalculate(id);
    return this.get(id, user);
  }

  async submit(id: string, user: any) {
    const settlement = await this.getMutable(id, user);
    if (!settlement.documents.length) throw new BadRequestException('Debe seleccionar al menos un comprobante vÃ¡lido.');
    if (settlement.balanceStatus === SettlementBalanceStatus.PENDIENTE_DEVOLUCION || settlement.balanceStatus === SettlementBalanceStatus.DEVOLUCION_EN_VALIDACION) throw new BadRequestException('La devoluciÃ³n pendiente debe quedar validada antes de enviar a revisiÃ³n.');
    if (settlement.balanceStatus === SettlementBalanceStatus.EXCESO_DE_RENDICION) throw new BadRequestException('El exceso de rendiciÃ³n requiere resoluciÃ³n antes de enviarse.');
    const request = settlement.expenseRequest;
    const policy = await this.policyEngine.evaluate({ requestId: request.id, amount: Number(settlement.documentsTotal), companyId: request.companyId, countryId: request.countryId, costCenter: request.costCenter, budgetAccount: request.budgetAccount, expenseType: request.type, priority: request.priority, requesterRole: request.requesterRole, destination: request.destination, currency: request.currency, days: request.days });
    let approvalFlowId: string | undefined;
    if (policy.approvalsRequired.length) {
      const flow = await this.approvalEngine.generateFlow({ entityType: 'EXPENSE_SETTLEMENT', entityId: settlement.id, companyId: request.companyId, requesterId: request.requesterId, requestCode: settlement.code, currentStatus: settlement.status }, policy, user.name);
      approvalFlowId = flow?.id;
    }
    await this.changeStatus(settlement, SettlementStatus.PENDIENTE_REVISION, 'ENVIO_REVISION', 'LiquidaciÃ³n enviada a revisiÃ³n.', user, { approvalFlowId, policyRuleIds: policy.approvalsRequired.map((rule) => rule.ruleId) }, { submittedAt: new Date(), currentObservation: null, approvalFlowId });
    return this.get(id, user);
  }

  async observe(id: string, comment: string, user: any) { this.assertReviewer(user); const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId); if (settlement.status !== SettlementStatus.PENDIENTE_REVISION) throw new BadRequestException('Solo una liquidaciÃ³n pendiente puede observarse.'); await this.changeStatus(settlement, SettlementStatus.OBSERVADA, 'OBSERVACION', comment, user, undefined, { currentObservation: comment }); return this.get(id, user); }
  async resubmit(id: string, comment: string, user: any) { const settlement = await this.getMutable(id, user, [SettlementStatus.OBSERVADA]); await this.changeStatus(settlement, SettlementStatus.PENDIENTE_REVISION, 'CORRECCION', comment, user, undefined, { currentObservation: null, submittedAt: new Date() }); return this.get(id, user); }
  async reject(id: string, comment: string, user: any) { this.assertReviewer(user); const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId); await this.changeStatus(settlement, SettlementStatus.RECHAZADA, 'RECHAZO', comment, user); return this.get(id, user); }
  async approve(id: string, comment: string | undefined, user: any) { this.assertReviewer(user); const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId); if (settlement.preparedByUserId === user.id) throw new ForbiddenException('Quien prepara la liquidaciÃ³n no puede aprobarla.'); if (settlement.status !== SettlementStatus.PENDIENTE_REVISION || settlement.balanceStatus !== SettlementBalanceStatus.CUADRADA || settlement.currentObservation) throw new BadRequestException('La liquidaciÃ³n no estÃ¡ cuadrada y libre de observaciones.'); await this.changeStatus(settlement, SettlementStatus.APROBADA, 'APROBACION', comment || 'LiquidaciÃ³n aprobada.', user, undefined, { approvedAt: new Date() }); return this.get(id, user); }
  async close(id: string, user: any) { if (!['ADMIN', 'FINANZAS'].includes(user.role)) throw new ForbiddenException('Solo Finanzas o AdministraciÃ³n puede cerrar.'); const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId); if (settlement.status !== SettlementStatus.APROBADA || settlement.balanceStatus !== SettlementBalanceStatus.CUADRADA || settlement.currentObservation) throw new BadRequestException('La liquidaciÃ³n debe estar aprobada, cuadrada y sin observaciones.'); await this.changeStatus(settlement, SettlementStatus.CERRADA, 'CIERRE', 'LiquidaciÃ³n cerrada y preparada para conciliaciÃ³n.', user, undefined, { closedAt: new Date() }); return this.get(id, user); }

  async certify(id: string, user: any) {
    if (!['ADMIN', 'FINANZAS'].includes(user.role)) throw new ForbiddenException('Solo Finanzas o AdministraciÃ³n puede certificar.');
    const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId);
    if (settlement.status !== SettlementStatus.CERRADA) throw new BadRequestException('SÃ³lo una liquidaciÃ³n cerrada puede certificarse.');
    if (settlement.certificationStatus === 'CERTIFICADA') return this.get(id, user);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ExpenseSettlement" WHERE id = ${id} FOR UPDATE`;
      const changed = await tx.expenseSettlement.updateMany({ where: { id, status: SettlementStatus.CERRADA, certificationStatus: 'PENDIENTE' }, data: { certificationStatus: 'CERTIFICADA', certifiedAt: new Date(), certifiedByUserId: user.id } });
      if (changed.count === 1) await tx.settlementAudit.create({ data: { settlementId: id, ...this.auditData('CERTIFICACION', settlement.status, settlement.status, 'LiquidaciÃ³n certificada.', user, { result: 'CERTIFICADA' }) } as any });
    });
    return this.get(id, user);
  }

  async registerRefund(id: string, dto: CreateSettlementRefundDto, file: Express.Multer.File | undefined, user: any) {
    if (!file) throw new BadRequestException('La devoluciÃ³n requiere evidencia documental.');
    if (!isAllowedEvidence(file.mimetype)) throw new BadRequestException('El documento de referencia debe ser PDF, JPG o PNG.');
    const refundMethods: PaymentMethod[] = [PaymentMethod.TRANSFERENCIA, PaymentMethod.DEPOSITO];
    if (!refundMethods.includes(dto.paymentMethod) || !isAllowedRefundMethod(dto.paymentMethod)) throw new BadRequestException('La devoluciÃ³n debe realizarse por transferencia o depÃ³sito.');
    const settlement = await this.getInternal(id);
    this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId);
    const refundableStatuses: SettlementStatus[] = [SettlementStatus.BORRADOR, SettlementStatus.OBSERVADA];
    if (!refundableStatuses.includes(settlement.status)) throw new BadRequestException('No puede registrar devoluciones en el estado actual.');
    const pendingRefund = settlement.refunds.some((refund: any) => [SettlementRefundStatus.PENDIENTE, SettlementRefundStatus.EN_VALIDACION, SettlementRefundStatus.DEVOLUCION_REGISTRADA, SettlementRefundStatus.DEVOLUCION_EN_REVISION, SettlementRefundStatus.CORRECCION_SOLICITADA].includes(refund.status));
    if (pendingRefund) throw new BadRequestException('Ya existe una devoluciÃ³n pendiente de validaciÃ³n o correcciÃ³n.');
    const refundAmount = new Prisma.Decimal(dto.amount);
    if (settlement.differenceAmount.lte(0)) throw new BadRequestException('La liquidaciÃ³n no tiene saldo pendiente de devoluciÃ³n.');
    if (!refundAmount.equals(settlement.differenceAmount)) throw new BadRequestException(`La devoluciÃ³n debe corresponder al saldo pendiente completo: ${settlement.differenceAmount.toFixed(2)}.`);
    const bank = await this.prisma.bank.findFirst({ where: { id: dto.bankId, active: true } });
    if (!bank) throw new BadRequestException('El banco seleccionado no existe o estÃ¡ inactivo.');
    const conversion = await this.money.convert(refundAmount, dto.currencyId, settlement.currencyId, new Date(dto.operationDate));
    const uploaded = await this.storage.uploadFile(file);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ExpenseSettlement" WHERE id = ${id} FOR UPDATE`;
      const current = await tx.expenseSettlement.findUnique({ where: { id }, include: { refunds: true } });
      if (!current || ![SettlementStatus.BORRADOR, SettlementStatus.OBSERVADA].includes(current.status as any)) throw new BadRequestException('La liquidaciÃ³n ya no admite reintegros.');
      if (current.refunds.some((item: any) => [SettlementRefundStatus.PENDIENTE, SettlementRefundStatus.EN_VALIDACION, SettlementRefundStatus.DEVOLUCION_REGISTRADA, SettlementRefundStatus.DEVOLUCION_EN_REVISION, SettlementRefundStatus.CORRECCION_SOLICITADA].includes(item.status))) throw new BadRequestException('Ya existe una devoluciÃ³n pendiente de validaciÃ³n o correcciÃ³n.');
      const evidence = await tx.document.create({ data: { fileName: file.originalname, fileType: 'SETTLEMENT_REFUND', mimeType: file.mimetype, storagePath: uploaded.key, sizeBytes: BigInt(file.size), status: DocumentStatus.CARGADO, userId: user.id, expenseRequestId: settlement.expenseRequestId } });
      const refund = await tx.settlementRefund.create({ data: { settlementId: id, paymentMethod: dto.paymentMethod, amount: conversion.originalAmount, currencyId: dto.currencyId, exchangeRate: conversion.exchangeRate, exchangeRateId: conversion.exchangeRateId, settlementAmount: conversion.budgetAmount, operationDate: new Date(dto.operationDate), referenceNumber: dto.referenceNumber, bankId: bank.id, observations: dto.observations, evidenceDocumentId: evidence.id, createdByUserId: user.id, status: SettlementRefundStatus.DEVOLUCION_EN_REVISION } });
      await tx.settlementAudit.create({ data: { settlementId: id, ...this.auditData('REGISTRO_DEVOLUCION', SettlementRefundStatus.DEVOLUCION_REGISTRADA, SettlementRefundStatus.DEVOLUCION_EN_REVISION, `DevoluciÃ³n ${dto.referenceNumber} registrada y enviada a TesorerÃ­a. ${dto.observations}`, user, { refundId: refund.id, bankId: dto.bankId, evidenceDocumentId: evidence.id, documentAction: 'DOCUMENTO_REFERENCIA_CARGADO', sha256: createHash('sha256').update(file.buffer).digest('hex'), settlementAmount: conversion.budgetAmount.toString(), result: 'EXITOSO' }) } as any });
    });
    await this.recalculate(id);
    return this.get(id, user);
  }

  async validateRefund(id: string, refundId: string, action: 'APPROVE' | 'REJECT' | 'CORRECTION', comment: string | undefined, user: any) {
    if (!['ADMIN', 'FINANZAS', 'TESORERIA'].includes(user.role)) throw new ForbiddenException('Solo TesorerÃ­a puede validar devoluciones.');
    const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId);
    if (settlement.status === SettlementStatus.CERRADA) throw new BadRequestException('Una liquidaciÃ³n cerrada no permite modificar devoluciones.');
    const refund = settlement.refunds.find((candidate: any) => candidate.id === refundId);
    if (!refund || ![SettlementRefundStatus.EN_VALIDACION, SettlementRefundStatus.DEVOLUCION_EN_REVISION].includes(refund.status as any)) throw new BadRequestException('La devoluciÃ³n no estÃ¡ disponible para validaciÃ³n.');
    if (action !== 'APPROVE' && !comment) throw new BadRequestException('Debe indicar el motivo del rechazo o correcciÃ³n.');
    const status = action === 'APPROVE' ? SettlementRefundStatus.DEVOLUCION_VALIDADA : action === 'REJECT' ? SettlementRefundStatus.DEVOLUCION_RECHAZADA : SettlementRefundStatus.CORRECCION_SOLICITADA;
    await this.prisma.$transaction([
      this.prisma.settlementRefund.update({ where: { id: refundId }, data: { status, validatedByUserId: user.id, validatedAt: new Date(), rejectionReason: action === 'APPROVE' ? null : comment } }),
      this.prisma.settlementAudit.create({ data: { settlementId: id, ...this.auditData(action === 'APPROVE' ? 'VALIDACION_TESORERIA' : action === 'REJECT' ? 'RECHAZO_DEVOLUCION' : 'CORRECCION_DEVOLUCION', refund.status, status, comment || 'DevoluciÃ³n validada.', user, { refundId, result: action }) } as any }),
    ]);
    await this.recalculate(id);
    return this.get(id, user);
  }

  async correctRefund(id: string, refundId: string, dto: CreateSettlementRefundDto, file: Express.Multer.File | undefined, user: any) {
    if (!file || !isAllowedEvidence(file.mimetype)) throw new BadRequestException('La correcciÃ³n requiere nueva evidencia documental PDF, JPG o PNG.');
    if (!isAllowedRefundMethod(dto.paymentMethod)) throw new BadRequestException('La devoluciÃ³n debe realizarse por transferencia o depÃ³sito.');
    const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId);
    if (settlement.status === SettlementStatus.CERRADA) throw new BadRequestException('Una liquidaciÃ³n cerrada no permite modificar devoluciones.');
    if (settlement.expenseRequest.requesterId !== user.id && user.role !== 'ADMIN') throw new ForbiddenException('SÃ³lo el solicitante puede corregir la devoluciÃ³n.');
    const refund = settlement.refunds.find((candidate: any) => candidate.id === refundId);
    if (!refund || refund.status !== SettlementRefundStatus.CORRECCION_SOLICITADA) throw new BadRequestException('La devoluciÃ³n no tiene una correcciÃ³n solicitada.');
    const conversion = await this.money.convert(dto.amount, dto.currencyId, settlement.currencyId, new Date(dto.operationDate));
    const bank = await this.prisma.bank.findFirst({ where: { id: dto.bankId, active: true } });
    if (!bank) throw new BadRequestException('El banco seleccionado no existe o estÃ¡ inactivo.');
    const uploaded = await this.storage.uploadFile(file);
    await this.prisma.$transaction(async (tx) => {
      const evidence = await tx.document.create({ data: { fileName: file.originalname, fileType: 'SETTLEMENT_REFUND_CORRECTION', mimeType: file.mimetype, storagePath: uploaded.key, sizeBytes: BigInt(file.size), status: DocumentStatus.CARGADO, userId: user.id, expenseRequestId: settlement.expenseRequestId } });
      await tx.settlementRefund.update({ where: { id: refundId }, data: { paymentMethod: dto.paymentMethod, amount: conversion.originalAmount, currencyId: dto.currencyId, exchangeRate: conversion.exchangeRate, exchangeRateId: conversion.exchangeRateId, settlementAmount: conversion.budgetAmount, operationDate: new Date(dto.operationDate), referenceNumber: dto.referenceNumber, bankId: bank.id, observations: dto.observations, evidenceDocumentId: evidence.id, status: SettlementRefundStatus.DEVOLUCION_EN_REVISION, validatedByUserId: null, validatedAt: null, rejectionReason: null } });
      await tx.settlementAudit.create({ data: { settlementId: id, ...this.auditData('CORRECCION_DEVOLUCION', SettlementRefundStatus.CORRECCION_SOLICITADA, SettlementRefundStatus.DEVOLUCION_EN_REVISION, `DevoluciÃ³n ${dto.referenceNumber} corregida y reenviada. ${dto.observations}`, user, { refundId, bankId: dto.bankId, evidenceDocumentId: evidence.id, documentAction: 'DOCUMENTO_REFERENCIA_CARGADO', sha256: createHash('sha256').update(file.buffer).digest('hex'), result: 'REENVIADA' }) } as any });
    });
    await this.recalculate(id);
    return this.get(id, user);
  }

  async pendingRefunds(user: any) {
    if (!['ADMIN', 'FINANZAS', 'TESORERIA'].includes(user.role)) throw new ForbiddenException('No tiene acceso a la bandeja de TesorerÃ­a.');
    const refunds = await this.prisma.settlementRefund.findMany({ where: { settlement: { companyId: authorizedCompanyId(user, undefined, '') }, status: { in: [SettlementRefundStatus.EN_VALIDACION, SettlementRefundStatus.DEVOLUCION_EN_REVISION] } }, include: { settlement: { include: { expenseRequest: true, preparedBy: { select: { id: true, name: true, email: true, role: true, companyId: true } }, currency: true } }, currency: true, bank: true, evidenceDocument: true, createdBy: { select: { id: true, name: true, email: true, role: true, companyId: true } } }, orderBy: { createdAt: 'asc' } });
    return refunds.map((refund) => ({
      ...refund,
      evidenceDocument: refund.evidenceDocument
        ? { ...refund.evidenceDocument, sizeBytes: Number(refund.evidenceDocument.sizeBytes) }
        : null,
    }));
  }

  async indicators(user: any) {
    const where = { companyId: authorizedCompanyId(user, undefined, ''), ...(!['ADMIN', 'FINANZAS', 'TESORERIA', 'GERENTE'].includes(user.role) ? { preparedByUserId: user.id } : {}) };
    const [groups, pending] = await Promise.all([
      this.prisma.expenseSettlement.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.expenseSettlement.aggregate({ where: { ...where, balanceStatus: SettlementBalanceStatus.PENDIENTE_DEVOLUCION }, _sum: { differenceAmount: true } }),
    ]);
    const count = (status: SettlementStatus) => groups.find((g) => g.status === status)?._count || 0;
    return { pending: count(SettlementStatus.PENDIENTE_REVISION), observed: count(SettlementStatus.OBSERVADA), balanced: await this.prisma.expenseSettlement.count({ where: { ...where, balanceStatus: SettlementBalanceStatus.CUADRADA } }), pendingRefund: await this.prisma.expenseSettlement.count({ where: { ...where, balanceStatus: SettlementBalanceStatus.PENDIENTE_DEVOLUCION } }), closed: count(SettlementStatus.CERRADA), pendingRefundAmount: pending._sum.differenceAmount || new Prisma.Decimal(0) };
  }

  private async recalculate(id: string) {
    const settlement = await this.prisma.expenseSettlement.findUniqueOrThrow({ where: { id }, include: { documents: true, refunds: true } });
    const documents = settlement.documents.reduce((sum, item) => sum.add(new Prisma.Decimal(item.settlementCurrencyAmount)), new Prisma.Decimal(0));
    const refunds = settlement.refunds.filter((item) => [SettlementRefundStatus.VALIDADA, SettlementRefundStatus.DEVOLUCION_VALIDADA].includes(item.status as any)).reduce((sum, item) => sum.add(new Prisma.Decimal(item.settlementAmount)), new Prisma.Decimal(0));
    const unvalidated = settlement.refunds.some((item) => [SettlementRefundStatus.PENDIENTE, SettlementRefundStatus.EN_VALIDACION, SettlementRefundStatus.DEVOLUCION_REGISTRADA, SettlementRefundStatus.DEVOLUCION_EN_REVISION, SettlementRefundStatus.CORRECCION_SOLICITADA].includes(item.status as any));
    const disbursed = new Prisma.Decimal(settlement.disbursedAmount);
    const difference = disbursed.minus(documents).minus(refunds).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const balanceStatus = documents.gt(disbursed) ? SettlementBalanceStatus.EXCESO_DE_RENDICION : difference.isZero() ? SettlementBalanceStatus.CUADRADA : unvalidated ? SettlementBalanceStatus.DEVOLUCION_EN_VALIDACION : SettlementBalanceStatus.PENDIENTE_DEVOLUCION;
    await this.prisma.expenseSettlement.update({ where: { id }, data: { documentsTotal: documents, validatedRefundTotal: refunds, differenceAmount: difference, balanceStatus } });
  }

  private async getMutable(id: string, user: any, allowed: SettlementStatus[] = [SettlementStatus.BORRADOR, SettlementStatus.OBSERVADA]) { const settlement = await this.getInternal(id); this.assertOwnerOrPrivileged(settlement.expenseRequest.requesterId, user, settlement.companyId); if (!allowed.includes(settlement.status)) throw new BadRequestException(`La liquidaciÃ³n no puede modificarse desde ${settlement.status}.`); return settlement; }
  private async getInternal(id: string) { const result = await this.prisma.expenseSettlement.findUnique({ where: { id }, include: this.detailInclude() }); if (!result) throw new NotFoundException('LiquidaciÃ³n no encontrada.'); return result; }
  private async changeStatus(settlement: any, status: SettlementStatus, action: string, description: string, user: any, metadata?: any, extra?: any) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ExpenseSettlement" WHERE id = ${settlement.id} FOR UPDATE`;
      const changed = await tx.expenseSettlement.updateMany({ where: { id: settlement.id, status: settlement.status }, data: { status, ...extra } });
      if (changed.count !== 1) throw new BadRequestException('La liquidaciÃ³n cambiÃ³ de estado mientras se procesaba.');
      await tx.settlementAudit.create({ data: { settlementId: settlement.id, ...this.auditData(action, settlement.status, status, description, user, metadata) } as any });
    });
  }
  private auditData(action: string, fromStatus: any, toStatus: any, description: string, user: any, metadata?: any) { return { action, fromStatus, toStatus, description, metadata: metadata || undefined, userId: user.id, userName: user.name || user.email || 'Usuario', userRole: user.role || null }; }
  private assertOwnerOrPrivileged(requesterId: string, user: any, companyId?: string) { if (requesterId !== user.id && !['ADMIN', 'FINANZAS', 'TESORERIA', 'GERENTE'].includes(user.role)) throw new ForbiddenException('No tiene acceso a esta liquidaciÃ³n.'); if (user.role !== 'ADMIN' && (!user.companyId || !companyId || companyId !== user.companyId)) throw new ForbiddenException('No tiene acceso a esta empresa.'); }
  private assertReviewer(user: any) { if (!['ADMIN', 'FINANZAS', 'GERENTE'].includes(user.role)) throw new ForbiddenException('No tiene permiso para revisar liquidaciones.'); }
  private summaryInclude() { return { expenseRequest: true, payment: { include: { currency: true } }, currency: true, preparedBy: { select: { id: true, name: true } }, certifiedBy: { select: { id: true, name: true } } }; }
  private detailInclude() { return { ...this.summaryInclude(), company: true, documents: { include: { document: { include: { ocrResult: { include: { fiscalCompany: true, extractedFields: true, complianceDecisions: { orderBy: { createdAt: 'desc' as const }, take: 1 } } } } }, originalCurrency: true, selectedBy: { select: { id: true, name: true } } } }, refunds: { include: { currency: true, bank: true, evidenceDocument: true, createdBy: { select: { id: true, name: true } }, validatedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' as const } }, audits: { orderBy: { createdAt: 'asc' as const } }, approvalFlow: { include: { steps: { include: { assignedUser: { select: { id: true, name: true, email: true, role: true, companyId: true } }, decidedByUser: { select: { id: true, name: true, email: true, role: true, companyId: true } } }, orderBy: { order: 'asc' as const } } } } }; }
}

