import { ocrDocumentWhere, requirePermission } from '../auth/permissions.util';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { StorageService } from './storage/storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly config: ConfigService,
  ) {}

  async upload(file: Express.Multer.File | undefined, userId: string, user?: any) {
    requirePermission(user, 'OCR_UPLOAD');
    if (user.id !== userId) throw new ForbiddenException('Usuario de carga incorrecto.');
    if (!file) throw new BadRequestException('Debe adjuntar un archivo.');
    const allowed = this.config.get<string[]>('ocr.allowedMimeTypes') || [];
    const mimeType = file.mimetype.split(';', 1)[0].toLowerCase();
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(`Tipo MIME no permitido: ${mimeType}.`);
    }
    const maxBytes = this.config.get<number>('ocr.maxFileSizeBytes') || 20 * 1024 * 1024;
    if (!file.size || file.size > maxBytes) {
      throw new BadRequestException(`El archivo debe tener entre 1 y ${maxBytes} bytes.`);
    }
    const uploaded = await this.storageService.uploadFile(file);
    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop() || '',
        mimeType,
        storagePath: uploaded.key,
        sizeBytes: BigInt(file.size),
        status: DocumentStatus.CARGADO,
        userId,
      },
    });
    return { ...document, sizeBytes: Number(document.sizeBytes) };
  }

  async findAll(query?: ListDocumentsDto, user?: any) {
    const accessWhere = this.buildDocumentWhereByPermissions(user);
    const filters: Prisma.DocumentWhereInput[] = [accessWhere];
    if (query?.status) filters.push({ status: query.status as DocumentStatus });
    if (query?.search) {
      filters.push({ fileName: { contains: query.search, mode: 'insensitive' } });
    }
    const where: Prisma.DocumentWhereInput = { AND: filters };
    const page = Math.max(Number(query?.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query?.pageSize ?? 10), 1), 100);
    const [documents, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, role: true, companyId: true, active: true, blocked: true } }, ocrResult: true, confirmation: true },
      }),
      this.prisma.document.count({ where }),
    ]);
    return {
      data: documents.map((document) => ({ ...document, sizeBytes: Number(document.sizeBytes) })),
      page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string, user: any) {
    const document = await this.prisma.document.findFirst({
      where: { AND: [{ id }, this.buildDocumentWhereByPermissions(user)] },
      include: { ocrResult: true, confirmation: true },
    });
    if (!document) throw new NotFoundException('Documento no encontrado');
    return { ...document, sizeBytes: Number(document.sizeBytes) };
  }

  async getFileStream(documentId: string, user: any) {
    const document = await this.prisma.document.findFirst({
      where: { AND: [{ id: documentId }, this.buildDocumentWhereByPermissions(user)] },
    });
    if (!document) return null;
    const buffer = await this.storageService.getFileBuffer(document.storagePath);
    return { buffer, mimeType: document.mimeType, fileName: document.fileName };
  }

  private buildDocumentWhereByPermissions(user: any): Prisma.DocumentWhereInput {
    if (!user?.id) throw new ForbiddenException('Usuario no autenticado.');
    if (user.role === 'ADMIN' || user.permissions?.includes('OCR_VIEW_ALL')) return {};
    const scopes: Prisma.DocumentWhereInput[] = [];
    if (['OCR_VIEW_OWN', 'OCR_VIEW_COMPANY'].some(p => user.permissions?.includes(p))) scopes.push(ocrDocumentWhere(user));
    // Payment/refund evidence follows its original request, including Treasury readers.
    if (user.companyId) {
      const privileged = ['FINANZAS', 'TESORERIA', 'GERENTE'].includes(user.role);
      scopes.push({ expenseRequest: { companyId: user.companyId, ...(privileged ? {} : { requesterId: user.id }) },
        OR: [{ paymentEvidence: { isNot: null } }, { refundEvidence: { isNot: null } }] });
      scopes.push({ settlementItem: { settlement: { companyId: user.companyId,
        ...(privileged ? {} : { expenseRequest: { requesterId: user.id } }) } } });
    }
    return { OR: scopes };
  }
}
