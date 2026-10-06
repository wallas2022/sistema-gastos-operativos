import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrClientService } from './ocr.client';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../documents/storage/storage.module';
import { PoliciesModule } from '../policies/policies.module';
import { DocumentComplianceService } from './document-compliance.service';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, StorageModule, PoliciesModule],
  controllers: [OcrController],
  providers: [OcrService, OcrClientService, DocumentComplianceService],
  exports: [OcrService],
})
export class OcrModule {}
