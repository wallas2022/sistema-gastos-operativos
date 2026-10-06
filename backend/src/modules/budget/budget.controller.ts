import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetEngineService } from './budget-engine.service';
import { BudgetQueryService } from './budget-query.service';
import { AvailableBudgetQueryDto, BudgetQueryDto } from './dto/budget-query.dto';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly engine: BudgetEngineService, private readonly queries: BudgetQueryService) {}
  @Get('available-lines') available(@Query() query: AvailableBudgetQueryDto, @Req() req: any) { return this.queries.available(query, req.user); }
  @Get('filters') filters(@Req() req: any) { return this.queries.filters(req.user); }
  @Get('lines') lines(@Query() query: BudgetQueryDto, @Req() req: any) { return this.queries.list(query, req.user); }
  @Get('lines/:id') line(@Param('id') id: string, @Req() req: any) { return this.queries.detail(id, req.user); }
  @Get('requests/:id/evaluation')
  async evaluate(@Param('id') id: string, @Req() req: any) { await this.queries.assertRequestAccess(id, req.user); return this.engine.evaluateRequest(id); }
}
