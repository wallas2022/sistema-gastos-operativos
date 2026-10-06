import { ocrDocumentWhere, requirePermission } from '../auth/permissions.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus, DocumentVoucherType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../documents/storage/storage.service';
import { OcrClientService } from './ocr.client';
import { UpdateDocumentFieldsDto } from './dto/update-fields.dto';
import { UpdateLineItemsDto } from './dto/update-line-items.dto';
import { DocumentComplianceService } from './document-compliance.service';

@Injectable()
export class OcrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrClient: OcrClientService,
    private readonly storageService: StorageService,
    private readonly compliance?: DocumentComplianceService,
  ) {}

  async processDocument(documentId: string, user: any) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { ocrResult: true, confirmation: true },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    await this.assertDocumentAccess(document, user, 'process');
    if (document.confirmation) throw new BadRequestException('Un documento confirmado no puede reprocesarse porque su auditoría es inmutable.');
    if (document.ocrResult) {
      const correctionCount = await this.prisma.oCRFieldCorrection.count({ where: { extractedField: { ocrResultId: document.ocrResult.id } } });
      if (correctionCount > 0) throw new BadRequestException('El documento tiene correcciones auditadas y no puede reprocesarse.');
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESANDO },
    });
    if (document.ocrResult) {
      await this.prisma.oCRResult.update({ where: { id: document.ocrResult.id }, data: { processStatus: DocumentStatus.PROCESANDO } });
    }

    try {
      const fileBuffer = await this.storageService.getFileBuffer(
        document.storagePath,
      );

      const result = await this.ocrClient.processFile(
        fileBuffer,
        document.fileName,
        document.mimeType,
      );

      let ocrResultId: string;

      if (document.ocrResult) {
        const updated = await this.prisma.oCRResult.update({
          where: { id: document.ocrResult.id },
          data: {
            extractedText: result.rawText ?? null,
            averageConfidence: result.confidenceAvg ?? null,
            processStatus: result.processStatus ?? 'OK',
            errorMessage: result.errorMessage ?? null,

            countryDetected:
              result.documentContext?.countryDetected ?? null,
            languageDetected:
              result.documentContext?.languageDetected ?? null,
            documentTypeDetected:
              result.documentContext?.documentType ?? null,

            currencyCode: result.documentContext?.currency?.code ?? null,
            currencySymbol: result.documentContext?.currency?.symbol ?? null,
            decimalSeparator:
              result.documentContext?.currency?.decimalSeparator ?? null,
            thousandsSeparator:
              result.documentContext?.currency?.thousandsSeparator ?? null,

            subtotalAmount: result.totals?.subtotal ?? null,
            taxAmount: result.totals?.tax ?? null,
            totalAmount: result.totals?.total ?? null,
            taxIncludedInPrices:
              result.totals?.taxIncludedInPrices ?? null,
            processingDurationMs: result.metrics?.processingDurationMs ?? null,
            pageCount: result.metrics?.pageCount ?? null,
            ocrPageCount: result.metrics?.ocrPageCount ?? null,
            directTextPageCount: result.metrics?.directTextPageCount ?? null,
            retryCount: result.metrics?.retryCount ?? null,
            engineVersion: result.metrics?.engineVersion ?? null,
            reviewStartedAt: new Date(),
            confirmedAt: null,
            fieldsDetectedCount: result.normalizedFields?.length ?? 0,
            fieldsOmittedCount: result.extraFields?.filter((field: any) => field.rawLabel === 'ValidaciÃ³n').length ?? 0,
            modificationCount: 0,
          },
        });

        ocrResultId = updated.id;

        await this.prisma.extractedField.deleteMany({
          where: { ocrResultId },
        });

        await this.prisma.extractedExtraField.deleteMany({
          where: { ocrResultId },
        });

        await this.prisma.extractedLineItem.deleteMany({
          where: { ocrResultId },
        });
      } else {
        const created = await this.prisma.oCRResult.create({
          data: {
            documentId: document.id,
            extractedText: result.rawText ?? null,
            averageConfidence: result.confidenceAvg ?? null,
            processStatus: result.processStatus ?? 'OK',
            errorMessage: result.errorMessage ?? null,

            countryDetected:
              result.documentContext?.countryDetected ?? null,
            languageDetected:
              result.documentContext?.languageDetected ?? null,
            documentTypeDetected:
              result.documentContext?.documentType ?? null,

            currencyCode: result.documentContext?.currency?.code ?? null,
            currencySymbol: result.documentContext?.currency?.symbol ?? null,
            decimalSeparator:
              result.documentContext?.currency?.decimalSeparator ?? null,
            thousandsSeparator:
              result.documentContext?.currency?.thousandsSeparator ?? null,

            subtotalAmount: result.totals?.subtotal ?? null,
            taxAmount: result.totals?.tax ?? null,
            totalAmount: result.totals?.total ?? null,
            taxIncludedInPrices:
              result.totals?.taxIncludedInPrices ?? null,
            processingDurationMs: result.metrics?.processingDurationMs ?? null,
            pageCount: result.metrics?.pageCount ?? null,
            ocrPageCount: result.metrics?.ocrPageCount ?? null,
            directTextPageCount: result.metrics?.directTextPageCount ?? null,
            retryCount: result.metrics?.retryCount ?? null,
            engineVersion: result.metrics?.engineVersion ?? null,
            reviewStartedAt: new Date(),
            fieldsDetectedCount: result.normalizedFields?.length ?? 0,
            fieldsOmittedCount: result.extraFields?.filter((field: any) => field.rawLabel === 'ValidaciÃ³n').length ?? 0,
          },
        });

        ocrResultId = created.id;
      }

      if (result.normalizedFields?.length) {
        await this.prisma.extractedField.createMany({
          data: result.normalizedFields.map((field: any) => ({
            ocrResultId,
            fieldName: field.name,
            rawLabel: field.rawLabel ?? null,
            detectedValue: field.rawValue ?? null,
            normalizedValue: field.normalizedValue ?? null,
            finalValue: field.normalizedValue ?? field.rawValue ?? null,
            confidence: field.confidence ?? null,
            sourceBlock: field.sourceBlock ?? null,
            extractionRule: field.extractionRule ?? null,
            wasCorrected: false,
          })),
        });
      }
      const detectedVoucherType = this.compliance?.normalizeVoucherType(result.documentContext?.documentType, result.rawText);
      if (detectedVoucherType) await this.prisma.extractedField.create({ data: { ocrResultId, fieldName: 'document_type', rawLabel: 'Tipo de comprobante', detectedValue: detectedVoucherType, normalizedValue: detectedVoucherType, finalValue: detectedVoucherType, confidence: result.confidenceAvg ?? null, sourceBlock: 'GENERAL', extractionRule: 'DOCUMENT_CLASSIFIER', wasCorrected: false } });

      if (result.extraFields?.length) {
        await this.prisma.extractedExtraField.createMany({
          data: result.extraFields.map((field: any) => ({
            ocrResultId,
            rawLabel: field.rawLabel ?? null,
            rawValue: field.rawValue ?? null,
            confidence: field.confidence ?? null,
          })),
        });
      }

      if (result.items?.length) {
        await this.prisma.extractedLineItem.createMany({
          data: result.items.map((item) => ({
            ocrResultId: ocrResultId,
            lineNumber: item.lineNumber,
            article: item.article ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineSubtotal: item.lineSubtotal ?? null,
            lineTax: item.lineTax ?? null,
            lineTotal: item.lineTotal ?? null,
            taxIncluded: item.taxIncluded ?? null,
            confidence: item.confidence,
          })),
        });
      }

      const failed = result.success === false || result.processStatus === 'ERROR_OCR';
      const synchronizedStatus = failed ? DocumentStatus.ERROR_OCR : DocumentStatus.PENDIENTE_REVISION;
      await this.prisma.$transaction([
        this.prisma.document.update({ where: { id: documentId }, data: { status: synchronizedStatus } }),
        this.prisma.oCRResult.update({ where: { id: ocrResultId }, data: { processStatus: synchronizedStatus } }),
      ]);
      await this.compliance?.evaluate(documentId, user, false);

      return {
        ok: !failed,
        message: failed
          ? result.errorMessage || 'El documento no pudo ser procesado por OCR.'
          : 'Documento procesado correctamente',
      };
    } catch (error) {
      console.error('Error procesando documento OCR:', error);

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.ERROR_OCR },
      });

      throw new InternalServerErrorException(
        'No se pudo procesar el documento OCR',
      );
    }
  }

  async getResult(documentId: string, user: any) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        ocrResult: {
          include: {
            fiscalCompany: true,
            extractedFields: { include: { corrections: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } } } },
            extraFields: true,
            extractedLineItems: true,
            validationRuns: { include: { executedBy: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } },
            complianceDecisions: { include: { company: true, actorUser: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } },
          },
        },
        confirmation: true,
      },
    });

    if (!document || !document.ocrResult) {
      throw new NotFoundException('Documento o resultado OCR no encontrado');
    }
    await this.assertDocumentAccess(document, user, 'read');

    return {
      ...document,
      sizeBytes: Number(document.sizeBytes),
      ocrResult: {
        ...document.ocrResult,
        averageConfidence:
          document.ocrResult.averageConfidence != null
            ? Number(document.ocrResult.averageConfidence)
            : null,
        subtotalAmount:
          document.ocrResult.subtotalAmount != null
            ? Number(document.ocrResult.subtotalAmount)
            : null,
        taxAmount:
          document.ocrResult.taxAmount != null
            ? Number(document.ocrResult.taxAmount)
            : null,
        totalAmount:
          document.ocrResult.totalAmount != null
            ? Number(document.ocrResult.totalAmount)
            : null,
        extractedFields: document.ocrResult.extractedFields.map((field) => ({
          ...field,
          confidence:
            field.confidence != null ? Number(field.confidence) : null,
        })),
        extraFields: document.ocrResult.extraFields.map((field) => ({
          ...field,
          confidence:
            field.confidence != null ? Number(field.confidence) : null,
        })),
        extractedLineItems: document.ocrResult.extractedLineItems.map(
          (item) => ({
            ...item,
            quantity: item.quantity != null ? Number(item.quantity) : null,
            unitPrice:
              item.unitPrice != null ? Number(item.unitPrice) : null,
            lineSubtotal:
              item.lineSubtotal != null ? Number(item.lineSubtotal) : null,
            lineTax: item.lineTax != null ? Number(item.lineTax) : null,
            lineTotal:
              item.lineTotal != null ? Number(item.lineTotal) : null,
            confidence:
              item.confidence != null ? Number(item.confidence) : null,
          }),
        ),
      },
    };
  }

  async updateFields(documentId: string, dto: UpdateDocumentFieldsDto, user: any) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { ocrResult: true, settlementItem: { include: { settlement: true } } },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    await this.assertDocumentAccess(document, user, 'correct');

    if (!document.ocrResult) {
      throw new NotFoundException(
        'Resultado OCR no encontrado para el documento',
      );
    }

    let modifications = 0;
    await this.prisma.$transaction(async (tx) => {
    for (const field of dto.fields) {
      const extractedField = await tx.extractedField.findFirst({
        where: {
          id: field.id,
          ocrResultId: document.ocrResult.id,
        },
      });

      if (!extractedField) {
        throw new NotFoundException(`Campo OCR no encontrado: ${field.id}`);
      }

      const previousValue = extractedField.finalValue ?? extractedField.normalizedValue ?? extractedField.detectedValue;
      if (previousValue !== field.fieldValue) {
        await tx.oCRFieldCorrection.create({ data: { extractedFieldId: field.id, ocrValue: extractedField.detectedValue, previousValue, finalValue: field.fieldValue, reason: field.reason ?? null, userId: user.id } });
        modifications++;
      }
      await tx.extractedField.update({
        where: { id: field.id },
        data: {
          finalValue: field.fieldValue,
          confidence: field.confidence ?? extractedField.confidence,
          wasCorrected: extractedField.detectedValue !== field.fieldValue,
        },
      });
      if (extractedField.fieldName === 'document_type') {
        if (!Object.values(DocumentVoucherType).includes(field.fieldValue as DocumentVoucherType)) throw new BadRequestException('Tipo de comprobante no válido.');
        await tx.oCRResult.update({ where: { id: document.ocrResult!.id }, data: { finalVoucherType: field.fieldValue as DocumentVoucherType } });
      }
    }
    if (document.settlementItem?.settlement.status === 'CERRADA') {
      throw new BadRequestException('No se pueden alterar datos fiscales de un documento perteneciente a una liquidación cerrada.');
    }
    if (modifications) await tx.oCRResult.update({ where: { id: document.ocrResult!.id }, data: { modificationCount: { increment: modifications } } });
    });
    await this.compliance?.evaluate(documentId, user, document.status === DocumentStatus.CONFIRMADO || document.status === DocumentStatus.ASOCIADO_SOLICITUD);

    return {
      ok: true,
      message: 'Campos actualizados correctamente',
    };
  }

  async confirmDocument(documentId: string, user: any, comment?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        ocrResult: true,
        confirmation: true,
      },
    });

    if (!document || !document.ocrResult) {
      throw new NotFoundException('Documento o resultado OCR no encontrado');
    }
    await this.assertDocumentAccess(document, user, 'confirm');

    if (document.confirmation) {
      return {
        ok: true,
        message: 'El documento ya había sido confirmado',
      };
    }

    await this.compliance?.evaluate(documentId, user, true);
    const finalStatus = document.expenseRequestId ? DocumentStatus.ASOCIADO_SOLICITUD : DocumentStatus.CONFIRMADO;
    await this.prisma.$transaction([
      this.prisma.oCRConfirmation.create({ data: {
        documentId: document.id,
        userId: user.id,
        observations: comment ?? null,
        confirmationDate: new Date(),
      } }),
      this.prisma.document.update({ where: { id: documentId }, data: { status: finalStatus } }),
      this.prisma.oCRResult.update({ where: { id: document.ocrResult.id }, data: { processStatus: finalStatus, confirmedAt: new Date() } }),
    ]);

    return {
      ok: true,
      message: 'Documento confirmado correctamente',
    };
  }

  async updateLineItems(documentId: string, dto: UpdateLineItemsDto, user: any) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException('Documento no encontrado');
    await this.assertDocumentAccess(document, user, 'correct');
    const ocrResult = await this.prisma.oCRResult.findFirst({
      where: {
        documentId,
      },
    });

    if (!ocrResult) {
      throw new NotFoundException('No existe resultado OCR para este documento');
    }

    if (!dto.items || !Array.isArray(dto.items)) {
      throw new BadRequestException('La lista de items es obligatoria');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.extractedLineItem.deleteMany({
        where: {
          ocrResultId: ocrResult.id,
        },
      });

      if (dto.items.length > 0) {
        await tx.extractedLineItem.createMany({
          data: dto.items.map((item, index) => ({
            ocrResultId: ocrResult.id,
            lineNumber: item.lineNumber ?? index + 1,
            article: item.article ?? null,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            lineSubtotal:
              item.lineSubtotal !== undefined && item.lineSubtotal !== null
                ? Number(item.lineSubtotal)
                : null,
            lineTax:
              item.lineTax !== undefined && item.lineTax !== null
                ? Number(item.lineTax)
                : null,
            lineTotal: Number(item.lineTotal),
            taxIncluded: item.taxIncluded ?? false,
            confidence:
              item.confidence !== undefined && item.confidence !== null
                ? Number(item.confidence)
                : 100,
          })),
        });
      }
    });

    return {
      message: 'Detalle de factura actualizado correctamente',
      totalItems: dto.items.length,
    };
  }

  async updateTotal(documentId: string, value: string, reason: string, user: any) {
    const total = new Prisma.Decimal(value);
    if (!total.isPositive()) throw new BadRequestException('El total del documento debe ser mayor que cero.');
    const document = await this.prisma.document.findUnique({ where: { id: documentId }, include: { ocrResult: { include: { extractedFields: true } }, settlementItem: { include: { settlement: true } } } });
    if (!document?.ocrResult) throw new NotFoundException('Documento o resultado OCR no encontrado');
    await this.assertDocumentAccess(document, user, 'correct');
    if (document.settlementItem) throw new BadRequestException('No se puede modificar el monto de un documento ya asociado a una liquidación.');
    const existing = document.ocrResult.extractedFields.find(field => field.fieldName === 'total');
    await this.prisma.$transaction(async tx => {
      const field = existing
        ? await tx.extractedField.update({ where: { id: existing.id }, data: { finalValue: total.toFixed(2), wasCorrected: true } })
        : await tx.extractedField.create({ data: { ocrResultId: document.ocrResult!.id, fieldName: 'total', rawLabel: 'Total', detectedValue: null, normalizedValue: null, finalValue: total.toFixed(2), confidence: null, sourceBlock: 'TAXES', extractionRule: 'MANUAL_CORRECTION', wasCorrected: true } });
      await tx.oCRFieldCorrection.create({ data: { extractedFieldId: field.id, ocrValue: existing?.detectedValue || null, previousValue: existing?.finalValue || document.ocrResult!.totalAmount?.toString() || null, finalValue: total.toFixed(2), reason, userId: user.id } });
      await tx.oCRResult.update({ where: { id: document.ocrResult!.id }, data: { totalAmount: total, modificationCount: { increment: 1 } } });
    });
    await this.compliance?.evaluate(documentId, user, document.status === DocumentStatus.CONFIRMADO || document.status === DocumentStatus.ASOCIADO_SOLICITUD);
    return { ok: true, message: 'Total del documento actualizado con auditoría.' };
  }

  async metrics(user: any) {
    const where = ocrDocumentWhere(user);
    const resultWhere = { document: where };
    const [documents, results, corrections, byCountry, byType, byCompany] = await Promise.all([
      this.prisma.document.groupBy({ where, by: ['status'], _count: { _all: true } }),
      this.prisma.oCRResult.aggregate({ where: resultWhere, _count: { _all: true }, _avg: { processingDurationMs: true, averageConfidence: true, modificationCount: true, fieldsDetectedCount: true, fieldsOmittedCount: true } }),
      this.prisma.oCRFieldCorrection.count({ where: { extractedField: { ocrResult: resultWhere } } }),
      this.prisma.oCRResult.groupBy({ where: resultWhere, by: ['countryDetected'], _count: { _all: true } }),
      this.prisma.oCRResult.groupBy({ where: resultWhere, by: ['documentTypeDetected'], _count: { _all: true } }),
      this.prisma.document.groupBy({ where, by: ['userId'], _count: { _all: true } }),
    ]);
    const confirmed = await this.prisma.oCRResult.findMany({ where: { ...resultWhere, confirmedAt: { not: null }, reviewStartedAt: { not: null } }, select: { reviewStartedAt: true, confirmedAt: true } });
    const users = await this.prisma.user.findMany({ where: { id: { in: byCompany.map(row => row.userId) } }, select: { id: true, company: { select: { name: true } } } });
    const companyByUser = new Map(users.map(user => [user.id, user.company?.name || 'Sin empresa']));
    const companyCounts = new Map<string, number>();
    byCompany.forEach(row => companyCounts.set(companyByUser.get(row.userId) || 'Sin empresa', (companyCounts.get(companyByUser.get(row.userId) || 'Sin empresa') || 0) + row._count._all));
    return {
      status: Object.fromEntries(documents.map(row => [row.status, row._count._all])), total: results._count._all,
      averageOcrMs: Math.round(results._avg.processingDurationMs || 0), averageReviewMs: confirmed.length ? Math.round(confirmed.reduce((sum, row) => sum + (row.confirmedAt!.getTime() - row.reviewStartedAt!.getTime()), 0) / confirmed.length) : 0,
      averageConfidence: Number(results._avg.averageConfidence || 0), corrections, averageModifications: results._avg.modificationCount || 0,
      averageDetectedFields: results._avg.fieldsDetectedCount || 0, averageOmittedFields: results._avg.fieldsOmittedCount || 0,
      byCountry: byCountry.map(row => ({ label: row.countryDetected || 'Sin detectar', value: row._count._all })),
      byType: byType.map(row => ({ label: row.documentTypeDetected || 'Sin detectar', value: row._count._all })),
      byCompany: [...companyCounts].map(([label, value]) => ({ label, value })),
    };
  }

  async createValidationRun(documentId: string, dto: any, user: any) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId }, include: { ocrResult: true } });
    if (!document?.ocrResult) throw new NotFoundException('Documento o resultado OCR no encontrado');
    await this.assertDocumentAccess(document, user, 'correct');
    return this.prisma.oCRValidationRun.create({ data: { ocrResultId: document.ocrResult.id, documentType: dto.documentType, expectedResult: dto.expectedResult, obtainedResult: dto.obtainedResult, correct: dto.correct, observations: dto.observations ?? null, executedById: user.id } });
  }

  async validateCompliance(documentId: string, user: any) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException('Documento no encontrado');
    await this.assertDocumentAccess(document, user, 'correct');
    return this.compliance?.evaluate(documentId, user, document.status === DocumentStatus.CONFIRMADO || document.status === DocumentStatus.ASOCIADO_SOLICITUD);
  }

  private async assertDocumentAccess(document: any, user: any, operation: 'read' | 'process' | 'correct' | 'confirm' = 'read') {
    const permission = { process: 'OCR_PROCESS', correct: 'OCR_REVIEW', confirm: 'OCR_CONFIRM' };
    if (operation !== 'read') requirePermission(user, permission[operation]);
    const where = ocrDocumentWhere(user);
    if (Object.keys(where).length === 0) return;
    const allowed = await this.prisma.document.findFirst({ where: { AND: [{ id: document.id }, where] }, select: { id: true } });
    if (!allowed) throw new ForbiddenException('No tiene permiso para consultar este documento.');
  }
}
