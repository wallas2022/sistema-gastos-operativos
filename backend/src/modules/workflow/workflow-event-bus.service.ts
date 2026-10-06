import { Injectable } from '@nestjs/common';
import { WorkflowEvent, WorkflowEventHandler } from './workflow-event.types';

@Injectable()
export class WorkflowEventBus {
  private readonly handlers = new Set<WorkflowEventHandler>();

  subscribe(handler: WorkflowEventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async publish(event: Omit<WorkflowEvent, 'occurredAt'> & { occurredAt?: Date }) {
    const complete = { ...event, occurredAt: event.occurredAt || new Date() } as WorkflowEvent;
    const executions = [...this.handlers].map((handler) => handler(complete));
    if (this.isCritical(complete.type)) {
      // Critical effects are fail-fast; callers must not report a completed decision
      // while a required subscriber has failed.
      await Promise.all(executions);
      return;
    }
    // Notifications and metrics are non-critical side effects. Their failures do not
    // invalidate the already persisted workflow decision.
    await Promise.allSettled(executions);
  }

  private isCritical(type: WorkflowEvent['type']) {
    return ['REQUEST_APPROVED', 'FLOW_COMPLETED'].includes(type);
  }
}
