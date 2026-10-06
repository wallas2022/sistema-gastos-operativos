import { BadRequestException, Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportExportService } from './report-export.service';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FINANZAS', 'GERENTE')
export class ReportsController {
  constructor(private readonly reports: ReportsService, private readonly exporter: ReportExportService) {}
  @Get('filters') filters(@Req() req: any) { return this.reports.filters(req.user); }
  @Get('budget') budget(@Query() filters: ReportQueryDto, @Req() req: any) { return this.reports.budget(filters, req.user); }
  @Get('requests') requests(@Query() filters: ReportQueryDto, @Req() req: any) { return this.reports.requests(filters, req.user); }
  @Get('approvals') approvals(@Query() filters: ReportQueryDto, @Req() req: any) { return this.reports.approvals(filters, req.user); }
  @Get('policies') policies(@Query() filters: ReportQueryDto, @Req() req: any) { return this.reports.policies(filters, req.user); }
  @Get('executive') executive(@Query() filters: ReportQueryDto, @Req() req: any) { return this.reports.executive(filters, req.user); }
  @Get('ocr') ocr(@Query() filters: ReportQueryDto, @Req() req: any) { return this.reports.ocr(filters, req.user); }

  @Get(':kind/export/:format')
  async export(@Param('kind') kind: string, @Param('format') format: string, @Query() filters: ReportQueryDto, @Req() req: any, @Res() response: Response) {
    const payload = await this.reports.exportPayload(kind, filters, req.user);
    const isExcel = format === 'excel';
    if (!isExcel && format !== 'pdf') throw new BadRequestException('Formato de exportación no válido.');
    const buffer = isExcel ? await this.exporter.excel(payload, filters as any, req.user) : await this.exporter.pdf(payload, filters as any, req.user);
    const extension = isExcel ? 'xlsx' : 'pdf';
    response.setHeader('Content-Type', isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}-${new Date().toISOString().slice(0, 10)}.${extension}"`);
    response.send(buffer);
  }
}
