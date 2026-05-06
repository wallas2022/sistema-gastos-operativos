import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { ExpenseRequestsModule } from './modules/expense-requests/expense-requests.module';
import { ExpenseRequestPaymentsModule } from './modules/expense-request-payments/expense-request-payments.module';
import { CatalogModule } from './catalog/catalog.module';
import { SecurityModule } from './modules/security/security.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    UsersModule,
    CatalogModule,
    AuthModule,
    DocumentsModule,
    OcrModule,
    ExpenseRequestsModule,
    ExpenseRequestPaymentsModule,
    SecurityModule,
  ],
})
export class AppModule {}