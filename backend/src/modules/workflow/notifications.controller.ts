import { Controller, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Req() req: any, @Query('box') box = 'NOTIFICATIONS', @Query('page', new ParseIntPipe({ optional: true })) page = 1, @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize = 20) { return this.notifications.list(req.user.id, box, page, Math.min(pageSize, 100)); }

  @Get('unread-count')
  async unread(@Req() req: any) { return { count: await this.notifications.unreadCount(req.user.id) }; }

  @Get('latest')
  latest(@Req() req: any) { return this.notifications.latest(req.user.id); }

  @Patch('read-all')
  readAll(@Req() req: any) { return this.notifications.markAllRead(req.user.id); }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) { return this.notifications.findOne(id, req.user.id); }

  @Patch(':id/read')
  read(@Param('id') id: string, @Req() req: any) { return this.notifications.markRead(id, req.user.id); }
}
