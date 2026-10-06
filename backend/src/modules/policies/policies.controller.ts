import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { requirePermission } from '../auth/permissions.util';
import {
  PolicyRuleDto,
  PolicyRuleFiltersDto,
  SimulatePolicyDto,
} from './dto/policy-rule.dto';
import { PoliciesService } from './policies.service';
import { PolicyEngineService } from './engine/policy-engine.service';
import { RequestPriority } from '@prisma/client';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(
    private readonly policiesService: PoliciesService,
    private readonly policyEngine: PolicyEngineService,
  ) {}

  @Get()
  findAll(@Query() filters: PolicyRuleFiltersDto, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_READ');
    return this.policiesService.findAll(filters);
  }

  @Post('simulate')
  simulate(@Body() dto: SimulatePolicyDto, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_READ');
    return this.policyEngine.evaluate({
      requestId: 'SIMULATION',
      amount: dto.amount,
      companyId: dto.companyId,
      countryId: dto.countryId,
      costCenter: dto.costCenter || '',
      budgetAccount: dto.budgetAccount || null,
      expenseType: dto.expenseType,
      priority: dto.priority || RequestPriority.NORMAL,
      requesterRole: dto.requesterRole,
      destination: dto.destination || null,
      currency: dto.currency,
      days: dto.days ?? null,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_READ');
    return this.policiesService.findOne(id);
  }

  @Post()
  create(@Body() dto: PolicyRuleDto, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_WRITE');
    return this.policiesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: PolicyRuleDto,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'POLICY_RULE_WRITE');
    return this.policiesService.update(id, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_WRITE');
    return this.policiesService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_WRITE');
    return this.policiesService.deactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'POLICY_RULE_WRITE');
    return this.policiesService.remove(id);
  }
}
