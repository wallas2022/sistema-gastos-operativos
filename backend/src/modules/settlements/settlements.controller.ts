import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSettlementDto, CreateSettlementRefundDto, ListSettlementsDto, SelectSettlementDocumentDto, SettlementCommentDto } from './dto/settlement.dto';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
@UseGuards(JwtAuthGuard)
export class SettlementsController {
  constructor(private readonly service: SettlementsService) {}

  @Get() list(@Query() query: ListSettlementsDto, @Req() req: any) { return this.service.list(query, req.user); }
  @Get('indicators') indicators(@Req() req: any) { return this.service.indicators(req.user); }
  @Get('refunds/pending-treasury') pendingRefunds(@Req() req: any) { return this.service.pendingRefunds(req.user); }
  @Get('eligible/:requestId') eligibleLegacy(@Param('requestId') requestId: string, @Req() req: any) { return this.service.eligibleDocumentsByRequest(requestId, req.user); }
  @Get(':id/eligible-documents') eligible(@Param('id') id: string, @Req() req: any) { return this.service.eligibleDocuments(id, req.user); }
  @Get(':id') get(@Param('id') id: string, @Req() req: any) { return this.service.get(id, req.user); }
  @Post() create(@Body() dto: CreateSettlementDto, @Req() req: any) { return this.service.create(dto, req.user); }
  @Post(':id/documents') select(@Param('id') id: string, @Body() dto: SelectSettlementDocumentDto, @Req() req: any) { return this.service.selectDocument(id, dto.documentId, req.user); }
  @Delete(':id/documents/:documentId') remove(@Param('id') id: string, @Param('documentId') documentId: string, @Req() req: any) { return this.service.removeDocument(id, documentId, req.user); }
  @Post(':id/submit') submit(@Param('id') id: string, @Req() req: any) { return this.service.submit(id, req.user); }
  @Post(':id/observe') observe(@Param('id') id: string, @Body() dto: SettlementCommentDto, @Req() req: any) { return this.service.observe(id, dto.comment, req.user); }
  @Post(':id/resubmit') resubmit(@Param('id') id: string, @Body() dto: SettlementCommentDto, @Req() req: any) { return this.service.resubmit(id, dto.comment, req.user); }
  @Post(':id/approve') approve(@Param('id') id: string, @Body() dto: Partial<SettlementCommentDto>, @Req() req: any) { return this.service.approve(id, dto.comment, req.user); }
  @Post(':id/reject') reject(@Param('id') id: string, @Body() dto: SettlementCommentDto, @Req() req: any) { return this.service.reject(id, dto.comment, req.user); }
  @Post(':id/close') close(@Param('id') id: string, @Req() req: any) { return this.service.close(id, req.user); }
  @Post(':id/certify') certify(@Param('id') id: string, @Req() req: any) { return this.service.certify(id, req.user); }

  @Post(':id/refunds')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  refund(@Param('id') id: string, @Body() dto: CreateSettlementRefundDto, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: any) { return this.service.registerRefund(id, dto, file, req.user); }

  @Patch(':id/refunds/:refundId/correct')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  correctRefund(@Param('id') id: string, @Param('refundId') refundId: string, @Body() dto: CreateSettlementRefundDto, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: any) { return this.service.correctRefund(id, refundId, dto, file, req.user); }

  @Patch(':id/refunds/:refundId/validate')
  validateRefund(@Param('id') id: string, @Param('refundId') refundId: string, @Body() body: { approve?: boolean; action?: 'APPROVE' | 'REJECT' | 'CORRECTION'; comment?: string }, @Req() req: any) { return this.service.validateRefund(id, refundId, body.action || (body.approve ? 'APPROVE' : 'REJECT'), body.comment, req.user); }
}
