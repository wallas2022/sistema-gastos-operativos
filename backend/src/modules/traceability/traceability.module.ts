import { Module } from '@nestjs/common';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalModule } from '../approval/approval.module';

@Module({
  imports: [ApprovalModule],
  controllers: [TraceabilityController],
  providers: [TraceabilityService, PrismaService],
})
export class TraceabilityModule {}
