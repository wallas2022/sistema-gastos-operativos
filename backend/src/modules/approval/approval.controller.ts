import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApprovalFlowService } from './approval-flow.service';
import { ApprovalDecisionService } from './approval-decision.service';
import { ApprovalCommentDto, DelegateApprovalDto, ReassignApprovalDto, RequiredApprovalCommentDto } from './dto/approval-action.dto';

@Controller('approval-flows')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly flows: ApprovalFlowService, private readonly decisions: ApprovalDecisionService) {}
  @Get('pending/me') pending(@Req() req: any) { return this.flows.getPending(req.user); }
  @Get('request/:requestId') byRequest(@Param('requestId') requestId: string, @Req() req: any) { return this.flows.getByRequest(requestId, req.user); }
  @Get(':id/history') history(@Param('id') id: string, @Req() req: any) { return this.flows.history(id, req.user); }
  @Get(':id') findOne(@Param('id') id: string, @Req() req: any) { return this.flows.getById(id, req.user); }
  @Post(':id/approve') async approve(@Param('id') id: string, @Body() dto: ApprovalCommentDto, @Req() req: any) { const flow = await this.flows.getById(id, req.user); return this.decisions.decideByRequest(flow.expenseRequestId!, 'approve', dto.comment, req.user); }
  @Post(':id/reject') async reject(@Param('id') id: string, @Body() dto: RequiredApprovalCommentDto, @Req() req: any) { const flow = await this.flows.getById(id, req.user); return this.decisions.decideByRequest(flow.expenseRequestId!, 'reject', dto.comment, req.user); }
  @Post(':id/observe') async observe(@Param('id') id: string, @Body() dto: RequiredApprovalCommentDto, @Req() req: any) { const flow = await this.flows.getById(id, req.user); return this.decisions.decideByRequest(flow.expenseRequestId!, 'observe', dto.comment, req.user); }
  @Post(':id/delegate') delegate(@Param('id') id: string, @Body() dto: DelegateApprovalDto, @Req() req: any) { return this.flows.delegate(id, dto.targetUserId, dto.comment, req.user); }
  @Patch(':id/steps/:stepId/reassign') reassign(@Param('id') id: string, @Param('stepId') stepId: string, @Body() dto: ReassignApprovalDto, @Req() req: any) { return this.flows.reassign(id, stepId, dto.targetUserId, dto.comment, req.user); }
  @Post(':id/cancel') cancel(@Param('id') id: string, @Body() dto: RequiredApprovalCommentDto, @Req() req: any) { return this.flows.cancel(id, dto.comment, req.user); }
}
