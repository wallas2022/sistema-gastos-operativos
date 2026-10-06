import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { NotificationPriority, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InAppNotificationChannel } from './channels/in-app-notification.channel';
import { WorkflowEventBus } from './workflow-event-bus.service';
import { WorkflowEvent } from './workflow-event.types';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService, private readonly events: WorkflowEventBus, private readonly inApp: InAppNotificationChannel) {}

  onModuleInit() { this.events.subscribe((event) => this.handle(event)); }

  async list(userId: string, box = 'NOTIFICATIONS', page = 1, pageSize = 20) {
    const eventType = box === 'OBSERVED' ? ['REQUEST_OBSERVED'] : box === 'DELEGATED' ? ['APPROVAL_DELEGATED'] : box === 'APPROVED' ? ['REQUEST_APPROVED', 'FLOW_COMPLETED'] : undefined;
    const where = { userId, ...(eventType ? { eventType: { in: eventType } } : {}) };
    const [items, total] = await Promise.all([this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), this.prisma.notification.count({ where })]);
    return { items, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  unreadCount(userId: string) { return this.prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }); }
  latest(userId: string, take = 5) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take }); }

  async markRead(id: string, userId: string) {
    const changed = await this.prisma.notification.updateMany({ where: { id, userId }, data: { status: NotificationStatus.READ, readAt: new Date() } });
    if (!changed.count) throw new NotFoundException('Notificación no encontrada.');
    return this.prisma.notification.findUnique({ where: { id } });
  }

  markAllRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId, status: NotificationStatus.UNREAD }, data: { status: NotificationStatus.READ, readAt: new Date() } }); }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notificación no encontrada.');
    return notification;
  }

  private async handle(event: WorkflowEvent) {
    const request = await this.prisma.expenseRequest.findUnique({ where: { id: event.requestId }, include: { approvalFlow: { include: { steps: { orderBy: { order: 'asc' } } } } } });
    if (!request) return;
    if (['FLOW_GENERATED', 'APPROVER_ASSIGNED'].includes(event.type) && !request.approvalFlow) return;
    const template = this.template(event, request.code);
    const recipientIds = this.recipients(event, request);
    await Promise.all(recipientIds.map((userId) => this.inApp.send({ userId, eventType: event.type, ...template, link: `/solicitudes-gastos/${request.id}`, entityType: 'EXPENSE_REQUEST', entityId: request.id, metadata: { flowId: event.flowId, actorName: event.actorName } })));
  }

  private recipients(event: WorkflowEvent, request: any): string[] {
    if (['APPROVER_ASSIGNED', 'APPROVAL_DELEGATED'].includes(event.type)) {
      const current = request.approvalFlow?.steps.find((step: any) => step.order === request.approvalFlow.currentStepOrder);
      return current?.assignedUserId ? [current.assignedUserId] : [];
    }
    return request.requesterId ? [request.requesterId] : [];
  }

  private template(event: WorkflowEvent, code: string) {
    const values: Record<string, { title: string; description: string; priority: NotificationPriority }> = {
      REQUEST_CREATED: { title: 'Solicitud creada', description: `${code} fue creada correctamente.`, priority: NotificationPriority.LOW },
      REQUEST_SUBMITTED: { title: 'Solicitud enviada', description: `${code} fue enviada al flujo de validación.`, priority: NotificationPriority.NORMAL },
      REQUEST_OBSERVED: { title: 'Solicitud observada', description: event.comment || `${code} requiere correcciones.`, priority: NotificationPriority.HIGH },
      REQUEST_REJECTED: { title: 'Solicitud rechazada', description: event.comment || `${code} fue rechazada.`, priority: NotificationPriority.HIGH },
      REQUEST_APPROVED: { title: 'Solicitud aprobada', description: `${code} completó su aprobación.`, priority: NotificationPriority.NORMAL },
      REQUEST_CANCELLED: { title: 'Solicitud cancelada', description: event.comment || `${code} fue cancelada.`, priority: NotificationPriority.NORMAL },
      FLOW_GENERATED: { title: 'Flujo generado', description: `Se generó el flujo de aprobación para ${code}.`, priority: NotificationPriority.NORMAL },
      APPROVER_ASSIGNED: { title: 'Nueva aprobación asignada', description: `${code} espera su decisión.`, priority: NotificationPriority.HIGH },
      APPROVAL_DELEGATED: { title: 'Delegación recibida', description: event.comment || `Se le delegó la aprobación de ${code}.`, priority: NotificationPriority.HIGH },
      FLOW_COMPLETED: { title: 'Flujo completado', description: `${code} completó todos sus niveles.`, priority: NotificationPriority.NORMAL },
    };
    return values[event.type];
  }
}
