import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalEngineService } from './approval-engine.service';
import { ApprovalFlowService } from './approval-flow.service';
import { ApprovalDecisionService } from './approval-decision.service';

@Module({
  controllers: [ApprovalController],
  providers: [ApprovalEngineService, ApprovalFlowService, ApprovalDecisionService],
  exports: [ApprovalEngineService, ApprovalFlowService, ApprovalDecisionService],
})
export class ApprovalModule {}
