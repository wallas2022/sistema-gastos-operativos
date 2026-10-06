export type WorkflowEventType =
  | 'REQUEST_CREATED'
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_OBSERVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_CANCELLED'
  | 'FLOW_GENERATED'
  | 'APPROVER_ASSIGNED'
  | 'APPROVAL_DELEGATED'
  | 'FLOW_COMPLETED';

export interface WorkflowEvent {
  type: WorkflowEventType;
  requestId: string;
  flowId?: string;
  actorId?: string;
  actorName?: string;
  comment?: string;
  occurredAt: Date;
}

export type WorkflowEventHandler = (event: WorkflowEvent) => Promise<void>;
