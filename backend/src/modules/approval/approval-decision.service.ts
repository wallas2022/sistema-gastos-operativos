import { Injectable } from '@nestjs/common';
import { ApprovalFlowService } from './approval-flow.service';
import { WorkflowEventBus } from '../workflow/workflow-event-bus.service';

/** Single domain entry point for all approval decisions. */
@Injectable()
export class ApprovalDecisionService {
  constructor(private readonly flows: ApprovalFlowService, private readonly events: WorkflowEventBus) {}

  approve(flowId: string, comment: string | undefined, user: any) {
    return this.flows.approve(flowId, comment, user);
  }

  reject(flowId: string, comment: string, user: any) {
    return this.flows.reject(flowId, comment, user);
  }

  observe(flowId: string, comment: string, user: any) {
    return this.flows.observe(flowId, comment, user);
  }

  async decideByRequest(requestId: string, decision: 'approve' | 'reject' | 'observe', comment: string | undefined, user: any) {
    const flow = await this.flows.getByRequest(requestId, user);
    let result: any;
    if (decision === 'approve') result = await this.approve(flow.id, comment, user);
    else if (decision === 'reject') result = await this.reject(flow.id, comment || '', user);
    else result = await this.observe(flow.id, comment || '', user);
    const flowId = result.id;
    if (decision === 'approve') {
      await this.events.publish({ type: result.status === 'APROBADA' ? 'REQUEST_APPROVED' : 'APPROVER_ASSIGNED', requestId, flowId, actorId: user.id, actorName: user.name, comment });
      if (result.status === 'APROBADA') await this.events.publish({ type: 'FLOW_COMPLETED', requestId, flowId, actorId: user.id, actorName: user.name, comment });
    } else {
      await this.events.publish({ type: decision === 'reject' ? 'REQUEST_REJECTED' : 'REQUEST_OBSERVED', requestId, flowId, actorId: user.id, actorName: user.name, comment });
    }
    return this.flows.getByRequest(requestId, user);
  }
}
