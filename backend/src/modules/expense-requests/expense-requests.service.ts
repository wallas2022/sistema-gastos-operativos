import { authorizedCompanyId, authorizedRequestWhere } from '../auth/permissions.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseRequestStatus,
  PolicyResultStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateExpenseRequestDto,
  UpdateExpenseRequestDto,
} from './dto/create-expense-request.dto';
import { PolicyEngineService } from '../policies/engine/policy-engine.service';
import { PolicyEvaluationResult } from '../policies/engine/policy-engine.types';
import { ApprovalEngineService } from '../approval/approval-engine.service';
import { ApprovalFlowService } from '../approval/approval-flow.service';
import { BudgetReservationService } from '../budget/budget-reservation.service';
import { MoneyService } from '../exchange-rates/money.service';

export function validateDirectDocumentAssociation(documents: any[]) {
  const ocrDocument = documents.find(document => document.ocrResult);
  if (ocrDocument) {
    throw new BadRequestException(
      `El documento OCR ${ocrDocument.fileName} debe incorporarse desde la liquidación, no desde la solicitud.`,
    );
  }
}

@Injectable()
export class ExpenseRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEngine: PolicyEngineService,
    private readonly approvalEngine: ApprovalEngineService,
    private readonly approvalFlows: ApprovalFlowService,
    private readonly budgetReservations: BudgetReservationService,
    private readonly money: MoneyService,
  ) {}

  async create(dto: CreateExpenseRequestDto, user: any) {
    if (['PAGO_PROVEEDOR', 'PAGO_SERVICIO', 'PAGO_DIRECTO'].includes(dto.paymentModality) && !dto.intendedBeneficiaryName?.trim()) {
      throw new BadRequestException('La modalidad de pago directo requiere un beneficiario identificado.');
    }
    const requester = this.getAuthenticatedRequester(user);
    authorizedCompanyId(user, dto.companyId);
    const { company, currency, totalAmount, budgetLine, budgetPeriod, conversion } = await this.validateRequest(dto);
    const code = await this.generateExpenseRequestCode(company.id);

    const request = await this.prisma.expenseRequest.create({
      data: {
        code,
        type: dto.type,
        priority: dto.priority,
        paymentModality: dto.paymentModality,
        intendedBeneficiaryName: dto.intendedBeneficiaryName?.trim() || null,
        intendedBeneficiaryTaxId: dto.intendedBeneficiaryTaxId?.trim() || null,
        requesterId: requester.id,
        requesterName: requester.name,
        requesterRole: requester.role,
        company: { connect: { id: company.id } },
        Country: { connect: { id: company.countryId } },
        currencyRef: { connect: { id: currency.id } },
        companyName: company.name,
        currency: currency.code,
        exchangeRate: conversion.exchangeRate,
        budgetAmount: conversion.budgetAmount,
        budgetCurrency: { connect: { id: conversion.budgetCurrencyId } },
        costCenter: dto.costCenter || '',
        budgetAccount: budgetLine.accountCode,
        budgetLine: { connect: { id: budgetLine.id } },
        budgetPeriod: { connect: { id: budgetPeriod.id } },
        concept: dto.concept.trim(),
        justification: dto.justification.trim(),
        destination: dto.destination,
        days: dto.days,
        estimatedDate: dto.estimatedDate
          ? new Date(dto.estimatedDate)
          : undefined,
        estimatedAmount: totalAmount,
        items: {
          create: this.mapItemsForPersistence(dto.items),
        },
        validations: {
          create: [
            {
              type: 'PRESUPUESTO',
              status: 'PENDIENTE',
              message: 'ValidaciÃ³n presupuestaria pendiente de ejecuciÃ³n.',
            },
          ],
        },
        traces: {
          create: {
            event: 'SOLICITUD_CREADA',
            description: `Solicitud ${code} creada como borrador.`,
            userName: requester.name,
            toStatus: ExpenseRequestStatus.BORRADOR,
          },
        },
      },
      include: this.requestInclude(),
    });

    await this.evaluateAndPersistPolicies(request, requester.name);
    return this.reloadAndFormat(request.id);
  }

  async findAll(user: any) {
    const where = await this.buildExpenseRequestWhereByPermissions(user);
    const requests = await this.prisma.expenseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ...this.requestInclude(),
        traces: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    return requests.map((request) => this.formatExpenseRequest(request));
  }

  async findOne(id: string, user: any) {
    const request = await this.findAccessibleRequest(id, user);
    return this.formatExpenseRequest(request);
  }

  async update(id: string, dto: UpdateExpenseRequestDto, user: any) {
    const requester = this.getAuthenticatedRequester(user);
    const existing = await this.findEditableRequest(id, user);
    authorizedCompanyId(user, dto.companyId);
    const { company, currency, totalAmount, budgetLine, budgetPeriod, conversion } = await this.validateRequest(dto);

    const request = await this.prisma.$transaction(async (tx) => {
      await tx.expenseRequestItem.deleteMany({ where: { requestId: id } });

      return tx.expenseRequest.update({
        where: { id },
        data: {
          type: dto.type,
          priority: dto.priority,
          company: { connect: { id: company.id } },
          Country: { connect: { id: company.countryId } },
          currencyRef: { connect: { id: currency.id } },
          companyName: company.name,
          currency: currency.code,
          exchangeRate: conversion.exchangeRate,
          budgetAmount: conversion.budgetAmount,
          budgetCurrency: { connect: { id: conversion.budgetCurrencyId } },
          costCenter: dto.costCenter || '',
          budgetAccount: budgetLine.accountCode,
          budgetLine: { connect: { id: budgetLine.id } },
          budgetPeriod: { connect: { id: budgetPeriod.id } },
          concept: dto.concept.trim(),
          justification: dto.justification.trim(),
          destination: dto.destination,
          days: dto.days,
          estimatedDate: dto.estimatedDate
            ? new Date(dto.estimatedDate)
            : null,
          estimatedAmount: totalAmount,
          items: { create: this.mapItemsForPersistence(dto.items) },
          traces: {
            create: {
              event: 'SOLICITUD_EDITADA',
              description: `Solicitud ${existing.code} actualizada en estado borrador.`,
              userName: requester.name,
              fromStatus: existing.status,
              toStatus: existing.status,
            },
          },
        },
        include: this.requestInclude(),
      });
    });

    await this.evaluateAndPersistPolicies(request, requester.name);
    return this.reloadAndFormat(request.id);
  }

  async submit(id: string, user: any) {
    const requester = this.getAuthenticatedRequester(user);
    const existing = await this.findEditableRequest(id, user);
    if (existing.status !== ExpenseRequestStatus.BORRADOR) throw new BadRequestException('Solo las solicitudes en borrador pueden enviarse; use reenvío para una solicitud observada.');
    const policyEvaluation = await this.evaluateAndPersistPolicies(
      existing,
      requester.name,
    );
    if (policyEvaluation.errors.length) {
      throw new BadRequestException('La solicitud no puede enviarse porque contiene polÃ­ticas bloqueantes: ' + policyEvaluation.errors.map((item: any) => item.code).join(', '));
    }
    await this.budgetReservations.reserve(id);
    try {
      await this.approvalEngine.generateFlow(
        {
          entityType: 'EXPENSE_REQUEST', entityId: existing.id, expenseRequestId: existing.id,
          companyId: existing.companyId, requesterId: existing.requesterId,
          requestCode: existing.code, currentStatus: existing.status,
        }, policyEvaluation, requester.name,
      );
      const request = await this.prisma.expenseRequest.update({
        where: { id },
        data: {
          status: ExpenseRequestStatus.PENDIENTE_APROBACION,
          traces: {
            create: {
              event: 'SOLICITUD_ENVIADA_AUTORIZACION',
              description: 'Solicitud enviada al centro de autorizaciones.',
              userName: requester.name,
              fromStatus: existing.status,
              toStatus: ExpenseRequestStatus.PENDIENTE_APROBACION,
            },
          },
        },
        include: this.requestInclude(),
      });
      return this.formatExpenseRequest(request);
    } catch (error) {
      await this.budgetReservations.release(id, 'LiberaciÃ³n compensatoria por fallo al enviar la solicitud.');
      throw error;
    }
  }

  async resubmit(id: string, user: any) {
    const requester = this.getAuthenticatedRequester(user);
    const request = await this.findAccessibleRequest(id, user);
    if (request.status !== ExpenseRequestStatus.OBSERVADA) throw new BadRequestException(`La solicitud no puede reenviarse desde el estado actual: ${request.status}`);
    if (request.requesterId !== user.id && user.role !== 'ADMIN') throw new ForbiddenException('Solo el solicitante puede reenviar la solicitud.');
    const evaluation = await this.evaluateAndPersistPolicies(request, requester.name);
    if (evaluation.errors.length) throw new BadRequestException('La solicitud continúa bloqueada por políticas: ' + evaluation.errors.map((item: any) => item.code).join(', '));
    await this.budgetReservations.reconcile(id);
    const flowId = await this.approvalEngine.generateFlow({ entityType: 'EXPENSE_REQUEST', entityId: request.id, expenseRequestId: request.id, companyId: request.companyId, requesterId: request.requesterId, requestCode: request.code, currentStatus: request.status }, evaluation, requester.name);
    if (!flowId) throw new BadRequestException('No existe un flujo de aprobación configurado para la solicitud.');
    const flow = await this.approvalFlows.resetForResubmit(flowId.id, user);
    return this.reloadAndFormat(request.id);
  }

  async cancel(id: string, user: any) {
    const requester = this.getAuthenticatedRequester(user);
    const existing = await this.findEditableRequest(id, user);

    const request = await this.prisma.expenseRequest.update({
      where: { id },
      data: {
        status: ExpenseRequestStatus.CANCELADA,
        traces: {
          create: {
            event: 'SOLICITUD_CANCELADA',
            description: 'Solicitud cancelada por el solicitante.',
            userName: requester.name,
            fromStatus: existing.status,
            toStatus: ExpenseRequestStatus.CANCELADA,
          },
        },
      },
      include: this.requestInclude(),
    });

    return this.formatExpenseRequest(request);
  }

  async associateDocuments(id: string, documentIds: string[], user: any) {
    const targetRequest = await this.findEditableRequest(id, user);
    const uniqueDocumentIds = Array.from(new Set(documentIds));

    const documents = await this.prisma.document.findMany({
      where: { id: { in: uniqueDocumentIds } },
      include: { user: { select: { companyId: true } }, ocrResult: true },
    });

    if (documents.length !== uniqueDocumentIds.length) {
      throw new NotFoundException('Uno o mÃ¡s documentos no existen.');
    }

    const permissions: string[] = user?.permissions ?? [];
    const canViewAll =
      user?.role === 'ADMIN' || permissions.includes('OCR_VIEW_ALL');
    const canViewCompany = permissions.includes('OCR_VIEW_COMPANY');

    const forbiddenDocument = documents.find((document) => {
      const ownsDocument = document.userId === user.id;
      const belongsToCompany =
        canViewCompany && document.user.companyId === user.companyId;
      const assignedElsewhere =
        document.expenseRequestId && document.expenseRequestId !== id;

      return (
        assignedElsewhere || (!ownsDocument && !canViewAll && !belongsToCompany)
      );
    });

    if (forbiddenDocument) {
      throw new ForbiddenException(
        'No tiene acceso a uno o mÃ¡s documentos o ya estÃ¡n asociados a otra solicitud.',
      );
    }

    validateDirectDocumentAssociation(documents);

    const request = await this.prisma.expenseRequest.update({
      where: { id },
      data: {
        documents: {
          set: uniqueDocumentIds.map((documentId) => ({ id: documentId })),
        },
      },
      include: this.requestInclude(),
    });

    return this.formatExpenseRequest(request);
  }

  private async validateRequest(dto: CreateExpenseRequestDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      include: { country: true, currency: true },
    });

    if (!company || !company.active) {
      throw new BadRequestException('La empresa seleccionada no existe o estÃ¡ inactiva.');
    }

    if (company.countryId !== dto.countryId || !company.country.active) {
      throw new BadRequestException('El paÃ­s no corresponde a la empresa seleccionada.');
    }

    const currency = await this.prisma.currency.findFirst({ where: { id: dto.currencyId, active: true } });
    if (!currency) throw new BadRequestException('La moneda seleccionada no existe o estÃ¡ inactiva.');

    if (!dto.items?.length) {
      throw new BadRequestException('La solicitud debe incluir al menos un Ã­tem.');
    }

    const totalAmount = dto.items.reduce(
      (total, item) => total.plus(new Prisma.Decimal(String(item.unitAmount)).mul(item.quantity)),
      new Prisma.Decimal(0),
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (!totalAmount.isFinite() || totalAmount.lte(0)) {
      throw new BadRequestException('El total de la solicitud debe ser mayor que cero.');
    }
    const estimatedDate = dto.estimatedDate ? new Date(`${dto.estimatedDate}T12:00:00`) : new Date();
    const fiscalYear = estimatedDate.getFullYear();
    const month = estimatedDate.getMonth() + 1;
    const budgetPeriod = await this.prisma.budgetPeriod.findFirst({
      where: {
        id: dto.budgetPeriodId,
        budgetLineId: dto.budgetLineId,
        fiscalYear,
        month,
        budgetLine: {
          version: { fiscalYear, active: true, status: 'ACTIVE' },
          countryId: dto.countryId,
          OR: [{ companyId: dto.companyId }, { companyId: null }],
        },
      },
      include: { budgetLine: { include: { version: { include: { currency: true } } } } },
    });
    if (!budgetPeriod) {
      throw new BadRequestException('La partida seleccionada no pertenece al presupuesto activo o no corresponde a la empresa, paÃ­s, aÃ±o y mes indicados.');
    }
    const budgetLine = budgetPeriod.budgetLine;
    if (budgetLine.currency !== budgetLine.version.currency.code) throw new BadRequestException('La partida tiene una moneda inconsistente con su presupuesto principal.');
    const conversion = await this.money.convert(totalAmount, currency.id, budgetLine.version.currencyId, estimatedDate);

    return { company, currency, totalAmount, budgetLine, budgetPeriod, conversion };
  }

  private mapItemsForPersistence(items: CreateExpenseRequestDto['items']) {
    return items.map((item) => ({
      name: item.name.trim(),
      description: item.description?.trim(),
      quantity: item.quantity,
      unitAmount: new Prisma.Decimal(String(item.unitAmount)),
      totalAmount: new Prisma.Decimal(String(item.unitAmount)).mul(item.quantity).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
      policyStatus: 'PENDIENTE',
    }));
  }

  private async evaluateAndPersistPolicies(request: any, userName: string) {
    const evaluation = await this.policyEngine.evaluate({
      requestId: request.id,
      amount: Number(request.estimatedAmount),
      companyId: request.companyId,
      countryId: request.countryId,
      costCenter: request.costCenter,
      budgetAccount: request.budgetAccount,
      expenseType: request.type,
      priority: request.priority,
      requesterRole: request.requesterRole,
      destination: request.destination,
      currency: request.currency,
      days: request.days,
    });

    const itemStatus = this.getItemPolicyStatus(evaluation);
    await this.prisma.$transaction(async (tx) => {
      await tx.expenseRequestValidation.deleteMany({
        where: { requestId: request.id, type: { startsWith: 'POLITICA' } },
      });

      if (evaluation.results.length) {
        await tx.expenseRequestValidation.createMany({
          data: evaluation.results.map((result) => ({
            requestId: request.id,
            type: `POLITICA:${result.code}`,
            status: result.status,
            message: result.message,
          })),
        });
      }

      await tx.expenseRequestItem.updateMany({
        where: { requestId: request.id },
        data: { policyStatus: itemStatus },
      });

      await tx.expenseRequestTrace.createMany({
        data: [
          {
            requestId: request.id,
            event: 'POLITICA_EVALUADA',
            description: `${evaluation.results.length} polÃ­tica(s) evaluada(s).`,
            userName,
            fromStatus: request.status,
            toStatus: request.status,
          },
          ...evaluation.results
            .filter(
              (result) =>
                result.status !== PolicyResultStatus.NOT_APPLICABLE,
            )
            .map((result) => ({
              requestId: request.id,
              event: this.getPolicyTraceEvent(result.status),
              description: `[${result.code}] ${result.message}`,
              userName,
              fromStatus: request.status,
              toStatus: request.status,
            })),
        ],
      });
    });
    return evaluation;
  }

  private getPolicyTraceEvent(status: PolicyResultStatus) {
    switch (status) {
      case PolicyResultStatus.OK:
        return 'POLITICA_APROBADA';
      case PolicyResultStatus.APPROVAL_REQUIRED:
        return 'POLITICA_REQUIERE_APROBACION';
      case PolicyResultStatus.WARNING:
      case PolicyResultStatus.ERROR:
        return 'POLITICA_INCUMPLIDA';
      default:
        return 'POLITICA_EVALUADA';
    }
  }

  private getItemPolicyStatus(evaluation: PolicyEvaluationResult) {
    if (evaluation.errors.length) return 'ERROR';
    if (evaluation.approvalsRequired.length) return 'REQUIERE_APROBACION';
    if (evaluation.warnings.length) return 'ADVERTENCIA';
    return evaluation.ok.length ? 'CUMPLE' : 'NO_APLICA';
  }

  private async reloadAndFormat(id: string) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
      include: this.requestInclude(),
    });
    return this.formatExpenseRequest(request);
  }

  private getAuthenticatedRequester(user: any) {
    if (!user?.id || !user?.name || !user?.role) {
      throw new BadRequestException(
        'El usuario autenticado no contiene identidad y rol completos.',
      );
    }

    return { id: user.id, name: user.name, role: user.role };
  }

  private async findEditableRequest(id: string, user: any) {
    const request = await this.findAccessibleRequest(id, user);

    if (!['BORRADOR', 'OBSERVADA'].includes(request.status)) {
      throw new BadRequestException(
        `La solicitud no puede modificarse desde el estado actual: ${request.status}`,
      );
    }

    if (request.requesterId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo el solicitante puede modificar su borrador.',
      );
    }

    return request;
  }

  private async findAccessibleRequest(id: string, user: any) {
    const where = await this.buildExpenseRequestWhereByPermissions(user);
    const request = await this.prisma.expenseRequest.findFirst({
      where: { id, ...where },
      include: this.requestInclude(),
    });

    if (!request) {
      throw new NotFoundException('Solicitud de gasto no encontrada.');
    }

    return request;
  }

  private requestInclude() {
    return {
      items: true,
      validations: true,
      traces: { orderBy: { createdAt: 'asc' as const } },
      documents: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          mimeType: true,
          sizeBytes: true,
          status: true,
          userId: true,
          expenseRequestId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      company: { include: { country: true, currency: true } },
      currencyRef: true,
      budgetCurrency: true,
      Country: true,
      budgetLine: { include: { version: { include: { currency: true } } } },
      budgetPeriod: true,
      budgetReservations: { include: { budgetLine: true, budgetPeriod: true } },
    };
  }

  private formatExpenseRequest(request: any) {
    return {
      ...request,
      estimatedAmount: Number(request.estimatedAmount),
      exchangeRate: Number(request.exchangeRate || 1),
      budgetAmount: request.budgetAmount === null ? null : Number(request.budgetAmount),
      budgetCurrencyCode: request.budgetCurrency?.code || request.budgetLine?.version?.currency?.code || null,
      originalAmount: Number(request.estimatedAmount),
      originalCurrencyCode: request.currency,
      currencySymbol: request.currencyRef?.symbol ?? null,
      items: request.items?.map((item: any) => ({
        ...item,
        unitAmount: Number(item.unitAmount),
        totalAmount: Number(item.totalAmount),
      })),
      documents: request.documents?.map((document: any) => ({
        ...document,
        sizeBytes: Number(document.sizeBytes),
      })),
    };
  }

  private async generateExpenseRequestCode(companyId: string) {
    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const series = await tx.documentSeries.findUnique({
        where: {
          companyId_documentType_year: {
            companyId,
            documentType: 'EXPENSE_REQUEST',
            year,
          },
        },
      });

      if (!series || !series.active) {
        throw new BadRequestException(
          'No existe una serie documental activa para la empresa seleccionada.',
        );
      }

      const nextNumber = series.currentNumber + 1;
      await tx.documentSeries.update({
        where: { id: series.id },
        data: { currentNumber: nextNumber },
      });

      return `${series.prefix}-${year}-${String(nextNumber).padStart(
        series.padding,
        '0',
      )}`;
    });
  }

  private async buildExpenseRequestWhereByPermissions(user: any): Promise<Prisma.ExpenseRequestWhereInput> {
    return authorizedRequestWhere(this.prisma, user);
  }
}


