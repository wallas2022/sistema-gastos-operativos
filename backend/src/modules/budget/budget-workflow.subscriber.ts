import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WorkflowEventBus } from '../workflow/workflow-event-bus.service';
import { WorkflowEvent } from '../workflow/workflow-event.types';
import { BudgetReservationService } from './budget-reservation.service';

@Injectable()
export class BudgetWorkflowSubscriber implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => void;
  constructor(private readonly events: WorkflowEventBus, private readonly reservations: BudgetReservationService) {}
  onModuleInit() { this.unsubscribe = this.events.subscribe((event) => this.handle(event)); }
  onModuleDestroy() { this.unsubscribe?.(); }
  private async handle(event: WorkflowEvent) {
    if (event.type === 'REQUEST_SUBMITTED') await this.reservations.reserve(event.requestId);
    if (event.type === 'REQUEST_REJECTED' || event.type === 'REQUEST_CANCELLED') await this.reservations.release(event.requestId, event.comment || `Liberación por ${event.type}.`);
    if (event.type === 'REQUEST_APPROVED') await this.reservations.execute(event.requestId);
  }
}
