import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../documents/storage/storage.service';
import { OcrClientService } from './ocr.client';
import { UpdateDocumentFieldsDto } from './dto/update-fields.dto';
import { get } from 'node_modules/axios/index.cjs';
import { UpdateLineItemsDto } from './dto/i´date-line-items.dto';

@Injectable()
export class OcrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrClient: OcrClientService,
    private readonly storageService: StorageService,
  ) {}

  async processDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { ocrResult: true },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESANDO },
    });

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
            wasCorrected: false,
          })),
        });
      }

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

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PENDIENTE_REVISION },
      });

      return {
        ok: true,
        message: 'Documento procesado correctamente',
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

  async getResult(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        ocrResult: {
          include: {
            extractedFields: true,
            extraFields: true,
            extractedLineItems: true,
          },
        },
        confirmation: true,
      },
    });

    if (!document || !document.ocrResult) {
      throw new NotFoundException('Documento o resultado OCR no encontrado');
    }

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

  async updateFields(documentId: string, dto: UpdateDocumentFieldsDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { ocrResult: true },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (!document.ocrResult) {
      throw new NotFoundException(
        'Resultado OCR no encontrado para el documento',
      );
    }

    for (const field of dto.fields) {
      const extractedField = await this.prisma.extractedField.findFirst({
        where: {
          id: field.id,
          ocrResultId: document.ocrResult.id,
        },
      });

      if (!extractedField) {
        throw new NotFoundException(`Campo OCR no encontrado: ${field.id}`);
      }

      await this.prisma.extractedField.update({
        where: { id: field.id },
        data: {
          finalValue: field.fieldValue,
          confidence: field.confidence ?? extractedField.confidence,
          wasCorrected: extractedField.detectedValue !== field.fieldValue,
        },
      });
    }

    return {
      ok: true,
      message: 'Campos actualizados correctamente',
    };
  }

  async confirmDocument(documentId: string, userId: string, comment?: string) {
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

    if (document.confirmation) {
      return {
        ok: true,
        message: 'El documento ya había sido confirmado',
      };
    }

    await this.prisma.oCRConfirmation.create({
      data: {
        documentId: document.id,
        userId,
        observations: comment ?? null,
        confirmationDate: new Date(),
      },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.CONFIRMADO },
    });

    return {
      ok: true,
      message: 'Documento confirmado correctamente',
    };
  }

  async updateLineItems(documentId: string, dto: UpdateLineItemsDto) {
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

  
}