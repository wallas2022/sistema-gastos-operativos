import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpenseRequestsService } from './expense-requests.service';
import {
  AssociateExpenseRequestDocumentsDto,
  CreateExpenseRequestDto,
  UpdateExpenseRequestDto,
} from './dto/create-expense-request.dto';
import { requirePermission } from '../auth/permissions.util';
import { WorkflowEventBus } from '../workflow/workflow-event-bus.service';

@Controller('expense-requests')
@UseGuards(JwtAuthGuard)
export class ExpenseRequestsController {
  constructor(
    private readonly expenseRequestsService: ExpenseRequestsService,
    private readonly workflowEvents: WorkflowEventBus,
  ) {}

  @Post()
  async create(@Body() dto: CreateExpenseRequestDto, @Req() req: any) {
    requirePermission(req.user, 'EXPENSE_REQUEST_CREATE');
    const request = await this.expenseRequestsService.create(dto, req.user);
    await this.workflowEvents.publish({ type: 'REQUEST_CREATED', requestId: request.id, actorId: req.user.id, actorName: req.user.name });
    return request;
  }

  @Get()
  findAll(@Req() req: any) {
    return this.expenseRequestsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.expenseRequestsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseRequestDto,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'EXPENSE_REQUEST_CREATE');
    return this.expenseRequestsService.update(id, dto, req.user);
  }

  @Patch(':id/submit')
  async submit(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'EXPENSE_REQUEST_SUBMIT');
    const request = await this.expenseRequestsService.submit(id, req.user);
    await this.workflowEvents.publish({ type: 'REQUEST_SUBMITTED', requestId: request.id, actorId: req.user.id, actorName: req.user.name });
    await this.workflowEvents.publish({ type: 'FLOW_GENERATED', requestId: request.id, actorId: req.user.id, actorName: req.user.name });
    await this.workflowEvents.publish({ type: 'APPROVER_ASSIGNED', requestId: request.id, actorId: req.user.id, actorName: req.user.name });
    return request;
  }

  @Patch(':id/resubmit')
  async resubmit(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'EXPENSE_REQUEST_SUBMIT');
    const request = await this.expenseRequestsService.resubmit(id, req.user);
    await this.workflowEvents.publish({ type: 'REQUEST_SUBMITTED', requestId: request.id, actorId: req.user.id, actorName: req.user.name });
    return request;
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: any) {
    requirePermission(req.user, 'EXPENSE_REQUEST_CREATE');
    const request = await this.expenseRequestsService.cancel(id, req.user);
    await this.workflowEvents.publish({ type: 'REQUEST_CANCELLED', requestId: request.id, actorId: req.user.id, actorName: req.user.name });
    return request;
  }

  @Patch(':id/documents')
  associateDocuments(
    @Param('id') id: string,
    @Body() dto: AssociateExpenseRequestDocumentsDto,
    @Req() req: any,
  ) {
    requirePermission(req.user, 'EXPENSE_REQUEST_CREATE');
    return this.expenseRequestsService.associateDocuments(
      id,
      dto.documentIds,
      req.user,
    );
  }
}
