import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ReportExportService } from './report-export.service';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({ imports: [DashboardModule], controllers: [ReportsController], providers: [ReportsService, ReportsRepository, ReportExportService, RolesGuard] })
export class ReportsModule {}
