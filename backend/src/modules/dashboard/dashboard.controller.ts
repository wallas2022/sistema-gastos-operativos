import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DashboardFilters, DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'GERENTE', 'FINANZAS')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('summary') summary(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.summary(filters, req.user); }
  @Get('budget') budget(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.budget(filters, req.user); }
  @Get('workflow') workflow(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.workflow(filters, req.user); }
  @Get('policies') policies(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.policies(filters, req.user); }
  @Get('approvals') approvals(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.approvals(filters, req.user); }
  @Get('charts') charts(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.charts(filters, req.user); }
  @Get('trends') trends(@Query() filters: DashboardFilters, @Req() req: any) { return this.dashboard.trends(filters, req.user); }
  @Get('filters') filters(@Req() req: any) { return this.dashboard.filters(req.user); }
}
