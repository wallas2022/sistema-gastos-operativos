import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetEngineService } from './budget-engine.service';
import { BudgetImportController } from './budget-import.controller';
import { BudgetImportService } from './budget-import.service';
import { BudgetRepository } from './budget.repository';
import { BudgetReservationService } from './budget-reservation.service';
import { BudgetWorkflowSubscriber } from './budget-workflow.subscriber';
import { ExcelBudgetProvider } from './providers/excel-budget.provider';
import { OracleJdeProvider } from './providers/oracle-jde.provider';
import { BudgetQueryService } from './budget-query.service';

@Module({ controllers: [BudgetController, BudgetImportController], providers: [BudgetRepository, BudgetImportService, BudgetEngineService, BudgetReservationService, BudgetQueryService, BudgetWorkflowSubscriber, ExcelBudgetProvider, OracleJdeProvider], exports: [BudgetEngineService, BudgetReservationService, BudgetQueryService] })
export class BudgetModule {}
