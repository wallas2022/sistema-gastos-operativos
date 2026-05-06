import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { DocumentStatus } from '@prisma/client';
import { ListDocumentsDto } from './dto/list-documents.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    const uploaded = await this.storageService.uploadFile(file);

    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop() || '',
        mimeType: file.mimetype,
        storagePath: uploaded.key,
        sizeBytes: BigInt(file.size),
        status: DocumentStatus.CARGADO,
        userId,
      },
    });

    return {
      ...document,
      sizeBytes: Number(document.sizeBytes),
    };
  }

  async findAll(query?: ListDocumentsDto, user?: any) {

     const where = this.buildDocumentWhereByPermissions(user);

  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? 10);

  const safePage = page > 0 ? page : 1;
  const safePageSize = pageSize > 0 ? pageSize : 10;

  const skip = (safePage - 1) * safePageSize;
  const take = safePageSize;

  const [documents, total] = await this.prisma.$transaction([
    this.prisma.document.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        ocrResult: true,
        confirmation: true,
      },
    }),
    this.prisma.document.count(),
  ]);

  return {
    data: documents.map((document) => ({
      ...document,
      sizeBytes:
        document.sizeBytes !== null && document.sizeBytes !== undefined
          ? Number(document.sizeBytes)
          : null,
    })),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.ceil(total / safePageSize),
  };
}

  async findOne(id: string, user: any) {
      const whereByPermission = this.buildDocumentWhereByPermissions(user);
    const document = await this.prisma.document.findUnique({
      where: { id, ...whereByPermission },
      include: {
        ocrResult: true,
        confirmation: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    return {
      ...document,
      sizeBytes: Number(document.sizeBytes),
    };
  }

 async getFileStream(documentId: string) {
  const document = await this.prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return null;
  }

  const buffer = await this.storageService.getFileBuffer(document.storagePath);

  return {
    buffer,
    mimeType: document.mimeType,
    fileName: document.fileName,
  };
}


private buildDocumentWhereByPermissions(user: any) {
  const permissions: string[] = user.permissions ?? [];

  if (permissions.includes('OCR_VIEW_ALL')) {
    return {};
  }

  if (permissions.includes('OCR_VIEW_COMPANY')) {
    return {
      user: {
        companyId: user.companyId,
      },
    };
  }

  if (permissions.includes('OCR_VIEW_OWN')) {
    return {
      userId: user.id,
    };
  }

  return {
    id: '__NO_ACCESS__',
  };
}


}