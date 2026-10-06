import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationChannelAdapter, NotificationMessage } from './notification-channel.interface';

@Injectable()
export class InAppNotificationChannel implements NotificationChannelAdapter {
  readonly channel = NotificationChannel.IN_APP;
  constructor(private readonly prisma: PrismaService) {}

  async send(message: NotificationMessage) {
    await this.prisma.notification.create({ data: { ...message, channel: this.channel, metadata: message.metadata as any } });
  }
}
