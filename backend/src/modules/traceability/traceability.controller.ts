import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TraceabilityService } from './traceability.service';

@Controller('traceability')
@UseGuards(JwtAuthGuard)
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('authorizations')
  getAuthorizations(@Req() req: any) {
    return this.traceabilityService.getPendingAuthorizations(req.user);
  }

  @Post('authorizations/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Req() req: any,
  ) {
    return this.traceabilityService.approve(id, body.comment, req.user);
  }

  @Post('authorizations/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Req() req: any,
  ) {
    return this.traceabilityService.reject(id, body.comment, req.user);
  }

  @Post('authorizations/:id/observe')
  observe(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Req() req: any,
  ) {
    return this.traceabilityService.observe(id, body.comment, req.user);
  }

  @Get('status-monitor')
    getStatusMonitor(@Req() req: any) {
      return this.traceabilityService.getStatusMonitor(req.user);
    }

    @Get('status-monitor/:id')
    getStatusMonitorDetail(@Param('id') id: string, @Req() req: any) {
      return this.traceabilityService.getStatusMonitorDetail(id, req.user);
    }

    @Get('sla-escalations')
      getSlaEscalations(@Req() req: any) {
        return this.traceabilityService.getSlaEscalations(req.user);
      }

      @Post('sla-escalations/:id/escalate')
      escalateSla(
        @Param('id') id: string,
        @Body() body: { comment?: string },
        @Req() req: any,
      ) {
        return this.traceabilityService.escalateSla(id, body.comment, req.user);
      }

      @Get('event-logs')
        getEventLogs(@Req() req: any) {
          return this.traceabilityService.getEventLogs(req.user);
        }

        @Get('event-logs/:requestId')
        getEventLogsByRequest(
          @Param('requestId') requestId: string,
          @Req() req: any,
        ) {
          return this.traceabilityService.getEventLogsByRequest(requestId, req.user);
        }
}