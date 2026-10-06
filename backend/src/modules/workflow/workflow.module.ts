import { Global, Module } from '@nestjs/common';
import { InAppNotificationChannel } from './channels/in-app-notification.channel';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';
import { WorkflowEventBus } from './workflow-event-bus.service';

@Global()
@Module({ controllers: [NotificationsController, SlaController], providers: [WorkflowEventBus, InAppNotificationChannel, NotificationService, SlaService], exports: [WorkflowEventBus, NotificationService, SlaService] })
export class WorkflowModule {}
