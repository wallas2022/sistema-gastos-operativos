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
import { TraceabilityModule } from './modules/traceability/traceability.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ApprovalModule } from './modules/approval/approval.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { BudgetModule } from './modules/budget/budget.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { BankingModule } from './modules/banking/banking.module';
import { FunctionalTestsModule } from './modules/functional-tests/functional-tests.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    WorkflowModule,
    UsersModule,
    CatalogModule,
    AuthModule,
    DocumentsModule,
    OcrModule,
    ExpenseRequestsModule,
    ExpenseRequestPaymentsModule,
    SecurityModule,
    TraceabilityModule,
    PoliciesModule,
    ApprovalModule,
    BudgetModule,
    DashboardModule,
    ReportsModule,
    ExchangeRatesModule,
    SettlementsModule,
    BankingModule,
    FunctionalTestsModule,
  ],
})
export class AppModule {}
