import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SlaService } from './sla.service';

@Controller('workflow/sla')
@UseGuards(JwtAuthGuard)
export class SlaController {
  constructor(private readonly sla: SlaService) {}
  @Get('rules') rules() { return this.sla.listRules(); }
  @Get('pending/me') pending(@Req() req: any) { return this.sla.pendingForUser(req.user); }
  @Get('flow/:id') flow(@Param('id') id: string, @Req() req: any) { return this.sla.forFlow(id, req.user); }
}
